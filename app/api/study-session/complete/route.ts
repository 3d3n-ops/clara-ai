import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'

// Rate limiting map (in production, use Redis or similar)
const sessionCompletionAttempts = new Map<string, { count: number, lastAttempt: number }>()

const RATE_LIMIT = {
  MAX_ATTEMPTS: 5,
  WINDOW_MS: 60 * 1000, // 1 minute
}

const MAX_SESSION_DURATION = 3600 // 1 hour in seconds
const MAX_CONFIDENCE_SCORE = 1.0
const MIN_CONFIDENCE_SCORE = 0.0

function isRateLimited(userId: string): boolean {
  const now = Date.now()
  const userAttempts = sessionCompletionAttempts.get(userId)
  
  if (!userAttempts) {
    sessionCompletionAttempts.set(userId, { count: 1, lastAttempt: now })
    return false
  }
  
  // Reset if window has passed
  if (now - userAttempts.lastAttempt > RATE_LIMIT.WINDOW_MS) {
    sessionCompletionAttempts.set(userId, { count: 1, lastAttempt: now })
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

function validateSessionData(data: any): boolean {
  return (
    data.sessionId &&
    typeof data.sessionId === 'string' &&
    data.duration &&
    typeof data.duration === 'number' &&
    data.duration > 0 &&
    data.duration <= MAX_SESSION_DURATION &&
    data.confidenceScore &&
    typeof data.confidenceScore === 'number' &&
    data.confidenceScore >= MIN_CONFIDENCE_SCORE &&
    data.confidenceScore <= MAX_CONFIDENCE_SCORE &&
    Array.isArray(data.classesCovered) &&
    Array.isArray(data.topicsCovered) &&
    Array.isArray(data.keyConcepts) &&
    data.summaryText &&
    typeof data.summaryText === 'string'
  )
}

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth()
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Rate limiting check
    if (isRateLimited(userId)) {
      return NextResponse.json(
        { error: 'Rate limit exceeded. Please try again later.' },
        { status: 429 }
      )
    }

    const body = await request.json()
    const {
      sessionId,
      duration,
      classesCovered,
      topicsCovered,
      keyConcepts,
      confidenceScore,
      summaryText
    } = body

    // Validate session data
    if (!validateSessionData(body)) {
      return NextResponse.json(
        { error: 'Invalid session data provided' },
        { status: 400 }
      )
    }

    // In a real implementation, you would save this to your database
    // For now, we'll just return a success response
    const sessionData = {
      id: sessionId,
      userId,
      duration,
      classesCovered,
      topicsCovered,
      keyConcepts,
      confidenceScore,
      summaryText,
      completedAt: new Date().toISOString()
    }

    console.log('Session completed:', sessionData)

    // Update learning stats (in a real app, this would be in the database)
    // For demo purposes, we'll just return success

    return NextResponse.json({
      success: true,
      sessionData,
      message: 'Session completed successfully'
    })

  } catch (error) {
    console.error('Error completing session:', error)
    return NextResponse.json(
      { error: 'Failed to complete session' },
      { status: 500 }
    )
  }
} 