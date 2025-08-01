import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const { message, agent_id } = await request.json()

    if (!message) {
      return NextResponse.json({ error: 'Message is required' }, { status: 400 })
    }

    // ElevenLabs API configuration
    const ELEVENLABS_API_KEY = 'sk_9d8562f0f4cb192d69ed8a227dcf030a461eca8629c2c606'
    const ELEVENLABS_BASE_URL = 'https://api.elevenlabs.io/v1'

    // For now, we'll simulate the response since we need to implement the full ElevenLabs integration
    // In a real implementation, you would:
    // 1. Send the message to your agent via ElevenLabs API
    // 2. Get the response from the agent
    // 3. Return the response

    // Simulate processing time
    await new Promise(resolve => setTimeout(resolve, 1000))

    // Generate a contextual response based on the message
    const lowerMessage = message.toLowerCase()
    let response = "I'm here to help with your studies! How can I assist you today?"

    if (lowerMessage.includes('flashcard') || lowerMessage.includes('card')) {
      response = "I'd be happy to create flashcards for you! What topic would you like to study?"
    } else if (lowerMessage.includes('quiz') || lowerMessage.includes('test')) {
      response = "Great idea! I can create a quiz to test your knowledge. What subject should we focus on?"
    } else if (lowerMessage.includes('diagram') || lowerMessage.includes('visual')) {
      response = "I can help you create visual diagrams! What concept would you like me to illustrate?"
    } else if (lowerMessage.includes('help') || lowerMessage.includes('study')) {
      response = "I'm here to help you study! I can explain concepts, create study materials, and test your knowledge. What would you like to work on?"
    } else if (lowerMessage.includes('hello') || lowerMessage.includes('hi')) {
      response = "Hello! I'm Clara, your AI study assistant. I'm here to help you learn and succeed!"
    }

    return NextResponse.json({
      response,
      agent_id,
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    console.error('Error in ElevenLabs chat API:', error)
    return NextResponse.json(
      { error: 'Failed to process message' },
      { status: 500 }
    )
  }
} 