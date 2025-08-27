import { NextRequest, NextResponse } from 'next/server'
import { GoogleGenerativeAI } from '@google/generative-ai'

export async function GET(request: NextRequest) {
  try {
    if (!process.env.GOOGLE_AI_API_KEY) {
      return NextResponse.json(
        { error: 'Google AI API key not configured' },
        { status: 500 }
      )
    }

    const genAI = new GoogleGenerativeAI(process.env.GOOGLE_AI_API_KEY)
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash-exp" })

    const result = await model.generateContent('Test: Can you see this message? Respond with "Clara AI system working!"')
    const response = await result.response
    const text = response.text()

    return NextResponse.json({
      success: true,
      message: text,
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    console.error('Gemini test error:', error)
    return NextResponse.json(
      { 
        error: 'Gemini API test failed',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}