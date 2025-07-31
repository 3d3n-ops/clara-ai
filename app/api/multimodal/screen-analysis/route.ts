import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { GoogleGenerativeAI } from '@google/generative-ai'

// Initialize Gemini
const genAI = new GoogleGenerativeAI(process.env.GOOGLE_AI_API_KEY || '')

// Rate limiting for screen analysis (prevent spam)
const analysisCache = new Map<string, { timestamp: number, analysis: string }>()
const ANALYSIS_COOLDOWN = 5000 // 5 seconds between analyses

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth()
    
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { image, context } = await request.json()

    if (!image) {
      return NextResponse.json(
        { error: 'Image data is required' },
        { status: 400 }
      )
    }

    if (!process.env.GOOGLE_AI_API_KEY || process.env.GOOGLE_AI_API_KEY === 'your_google_ai_api_key_here') {
      // Fallback response when Gemini is not configured
      return NextResponse.json({
        analysis: "I can see you're sharing your screen! To get detailed visual analysis, please configure your Google AI API key. For now, I'm ready to help with any questions you type in the chat.",
        shouldRespond: false, // Don't spam with fallback messages
        fallback: true,
        timestamp: new Date().toISOString()
      })
    }

    console.log('[Screen Analysis] Processing request for user:', userId)

    // Check rate limiting
    const now = Date.now()
    const lastAnalysis = analysisCache.get(userId)
    if (lastAnalysis && (now - lastAnalysis.timestamp) < ANALYSIS_COOLDOWN) {
      return NextResponse.json({
        analysis: lastAnalysis.analysis,
        shouldRespond: false,
        cached: true
      })
    }

    // Validate and process base64 image
    if (!image.startsWith('data:image/')) {
      return NextResponse.json(
        { error: 'Invalid image format' },
        { status: 400 }
      )
    }

    const base64Data = image.replace(/^data:image\/[a-z]+;base64,/, '')
    
    // Validate base64 data
    if (!base64Data || base64Data.length < 100) {
      return NextResponse.json(
        { error: 'Image data too small or invalid' },
        { status: 400 }
      )
    }

    console.log('[Screen Analysis] Image size:', Math.round(base64Data.length / 1024), 'KB')

    // Prepare the model
    const model = genAI.getGenerativeModel({ 
      model: "gemini-2.0-flash-exp",
      generationConfig: {
        maxOutputTokens: 400,
        temperature: 0.4, // Lower temperature for more consistent responses
      }
    })

    const prompt = `You are Clara, an AI study assistant analyzing a student's screen.

TASK: Look at this screen capture and provide a detailed analysis of what you see.

ANALYZE FOR:
• Text content (words, sentences, paragraphs)
• Code or programming content
• Error messages or warnings
• Applications or websites being used
• Documents, files, or study materials
• UI elements, buttons, menus
• Any visual content that could be described

RESPONSE FORMAT:
If you can see specific content: "I can see [detailed description of what you observe - be specific about text, apps, content]. [Helpful suggestion or question about what you see]"
If you see a desktop/entertainment: "I can see you're using [specific app/website]. I'm ready to help when you start studying or working on something educational!"
If the image is unclear: "I can see your screen but the content isn't clear enough for me to read. Could you try sharing a specific window or application?"

RULES:
• Be very specific about what you can see
• Mention text content, apps, websites, or visual elements
• If you can read text, describe what it says
• If you see code, describe the programming language or structure
• Be encouraging and offer to help with what you observe
• Keep responses concise but detailed (2-3 sentences)`

    console.log('[Screen Analysis] Sending to Gemini...')
    
    const result = await model.generateContent([
      prompt,
      {
        inlineData: {
          data: base64Data,
          mimeType: "image/jpeg"
        }
      }
    ])

    const response = await result.response
    const analysis = response.text()
    
    console.log('[Screen Analysis] Gemini response:', analysis)

    // Determine if we should respond (avoid spam)
    const shouldRespond = shouldProvideResponse(analysis)
    
    console.log('[Screen Analysis] Should respond:', shouldRespond)

    // Cache the analysis
    analysisCache.set(userId, {
      timestamp: now,
      analysis
    })

    // Clean up old cache entries
    cleanupCache()

    return NextResponse.json({
      analysis,
      shouldRespond,
      timestamp: new Date().toISOString(),
      cached: false,
      success: true
    })

  } catch (error) {
    console.error('Screen analysis error:', error)
    
    // Check if it's a Gemini API error
    if (error instanceof Error && error.message.includes('API key')) {
      return NextResponse.json(
        { error: 'Google AI API configuration error' },
        { status: 500 }
      )
    }

    return NextResponse.json(
      { error: 'Failed to analyze screen content' },
      { status: 500 }
    )
  }
}

function shouldProvideResponse(analysis: string): boolean {
  const lowerAnalysis = analysis.toLowerCase()
  
  // Always respond if Clara says "I can see" (our new format)
  if (lowerAnalysis.includes('i can see')) {
    return true
  }

  // Don't respond for these cases
  if (lowerAnalysis.includes('no assistance needed') || 
      lowerAnalysis.includes('nothing educational')) {
    return false
  }

  // Default to responding (our new approach is more helpful)
  return true
}

function cleanupCache() {
  const now = Date.now()
  const maxAge = 60000 // 1 minute
  
  for (const [userId, data] of analysisCache.entries()) {
    if (now - data.timestamp > maxAge) {
      analysisCache.delete(userId)
    }
  }
}