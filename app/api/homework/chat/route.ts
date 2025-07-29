import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'

// Rate limiting map (in production, use Redis or similar)
const chatRequestAttempts = new Map<string, { count: number, lastAttempt: number }>()

const RATE_LIMIT = {
  MAX_ATTEMPTS: 50,
  WINDOW_MS: 60 * 1000, // 1 minute
}

const MAX_MESSAGE_LENGTH = 5000
const MAX_CONVERSATION_HISTORY = 20

function isRateLimited(userId: string): boolean {
  const now = Date.now()
  const userAttempts = chatRequestAttempts.get(userId)
  
  if (!userAttempts) {
    chatRequestAttempts.set(userId, { count: 1, lastAttempt: now })
    return false
  }
  
  // Reset if window has passed
  if (now - userAttempts.lastAttempt > RATE_LIMIT.WINDOW_MS) {
    chatRequestAttempts.set(userId, { count: 1, lastAttempt: now })
    return false
  }
  
  // Check if limit exceeded
  if (userAttempts.count >= RATE_LIMIT.MAX_ATTEMPTS) {
    return true
  }
  
  // Increment counter
  userAttempts.count++
  userAttempts.lastAttempt = now
  return false
}

function sanitizeMessage(message: string): string {
  return message
    .trim()
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .substring(0, MAX_MESSAGE_LENGTH)
}

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth()
    
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Rate limiting check
    if (isRateLimited(userId)) {
      return NextResponse.json(
        { error: 'Rate limit exceeded. Please try again later.' },
        { status: 429 }
      )
    }

    const body = await request.json()
    const { message, conversation_history, conversation_id, folder_id } = body

    if (!message || typeof message !== 'string') {
      return NextResponse.json(
        { error: 'Valid message is required' },
        { status: 400 }
      )
    }

    // Sanitize and validate message
    const sanitizedMessage = sanitizeMessage(message)
    if (!sanitizedMessage) {
      return NextResponse.json(
        { error: 'Message cannot be empty' },
        { status: 400 }
      )
    }

    // Validate conversation history
    const validHistory = Array.isArray(conversation_history) 
      ? conversation_history.slice(-MAX_CONVERSATION_HISTORY) // Limit history length
      : []

    // Call the Python backend with RAG integration
    const pythonBackendUrl = process.env.PYTHON_BACKEND_URL || 'http://localhost:8000'
    
    const response = await fetch(`${pythonBackendUrl}/homework/chat-rag`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message: sanitizedMessage,
        conversation_history: validHistory,
        user_id: userId,
        conversation_id,
        folder_id
      }),
    })

    if (!response.ok) {
      throw new Error(`Backend error: ${response.status}`)
    }

    const data = await response.json()
    
    return NextResponse.json({
      success: true,
      response: data.response,
      tool_calls: data.tool_calls || [],
      conversation_id: data.conversation_id,
      context_used: data.context_used || false,
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    console.error('Error in POST /api/homework/chat:', error)
    return NextResponse.json(
      { 
        success: false,
        error: error instanceof Error ? error.message : 'Failed to process chat message'
      },
      { status: 500 }
    )
  }
} 