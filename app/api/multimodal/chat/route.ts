import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { GoogleGenerativeAI } from '@google/generative-ai'

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth()
    
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { message, context, screenContext } = await request.json()

    if (!message) {
      return NextResponse.json(
        { error: 'Message is required' },
        { status: 400 }
      )
    }

    // Route to appropriate AI model based on context
    const isScreenSharing = context?.isScreenSharing && screenContext?.recentAnalysis
    
    if (isScreenSharing && process.env.GOOGLE_AI_API_KEY) {
      // Use Gemini for multimodal understanding when screen sharing
      return await handleGeminiMultimodal(message, context, screenContext)
    } else {
      // Use OpenAI for text-only responses
      return await handleOpenAIText(message, context)
    }

  } catch (error) {
    console.error('Multimodal chat error:', error)
    return NextResponse.json(
      { error: 'Failed to process message' },
      { status: 500 }
    )
  }
}

async function handleOpenAIText(message: string, context: any) {
  try {
    const openaiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: `You are Clara, a helpful AI study assistant. You help students with their studies in a friendly, encouraging way. 

Your personality:
- Patient and understanding
- Ask probing questions to test understanding
- Provide clear explanations with examples
- Use active learning techniques
- Celebrate student progress

Current context:
- Screen sharing active: ${context?.isScreenSharing ? 'Yes' : 'No'}
- Communication mode: Text chat
- Previous conversation context available: ${context?.previousMessages?.length || 0} messages

Keep responses concise but helpful. If screen sharing is active, mention that you can see their screen and offer to help with what they're working on.`
          },
          // Add previous messages for context (last 3-5 messages)
          ...(context?.previousMessages?.slice(-3)?.map((msg: any) => ({
            role: msg.type === 'user' ? 'user' : 'assistant',
            content: msg.content
          })) || []),
          {
            role: 'user',
            content: message
          }
        ],
        max_tokens: 500,
        temperature: 0.7,
      }),
    })

    if (!openaiResponse.ok) {
      throw new Error(`OpenAI API error: ${openaiResponse.status}`)
    }

    const data = await openaiResponse.json()
    const response = data.choices[0]?.message?.content || "I'm having trouble processing that. Could you try again?"

    return NextResponse.json({ 
      response,
      context: {
        isScreenSharing: context?.isScreenSharing || false,
        timestamp: new Date().toISOString(),
        model: 'openai'
      }
    })

  } catch (error) {
    console.error('OpenAI chat error:', error)
    return NextResponse.json(
      { error: 'Failed to process message with OpenAI' },
      { status: 500 }
    )
  }
}

async function handleGeminiMultimodal(message: string, context: any, screenContext: any) {
  try {
    const genAI = new GoogleGenerativeAI(process.env.GOOGLE_AI_API_KEY!)
    const model = genAI.getGenerativeModel({ 
      model: "gemini-2.0-flash-exp",
      generationConfig: {
        maxOutputTokens: 600,
        temperature: 0.6,
      }
    })

    // Build conversation context
    const conversationHistory = context?.previousMessages?.slice(-3)?.map((msg: any) => 
      `${msg.type === 'user' ? 'Student' : 'Clara'}: ${msg.content}`
    ).join('\n') || ''

    const prompt = `You are Clara, an AI study assistant helping a student via text chat while you can see their screen.

SCREEN CONTEXT:
Recent screen analysis: "${screenContext?.recentAnalysis || 'No recent analysis'}"
Screen sharing active: Yes

CONVERSATION HISTORY:
${conversationHistory}

STUDENT'S CURRENT MESSAGE: "${message}"

INSTRUCTIONS:
- You can see what's on the student's screen and understand the visual context
- Combine your visual understanding with their text message
- Provide helpful, educational responses that reference both what you see and what they're asking
- Be encouraging and ask probing questions to test understanding
- Keep responses concise but comprehensive (2-3 sentences max)

Respond as Clara to help the student:`

    const result = await model.generateContent(prompt)
    const response = await result.response
    const text = response.text()

    return NextResponse.json({ 
      response: text,
      context: {
        isScreenSharing: true,
        timestamp: new Date().toISOString(),
        model: 'gemini',
        screenContext: screenContext?.recentAnalysis ? 'included' : 'none'
      }
    })

  } catch (error) {
    console.error('Gemini multimodal chat error:', error)
    
    // Fallback to OpenAI if Gemini fails
    return await handleOpenAIText(message, context)
  }
}