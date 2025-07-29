import { NextRequest, NextResponse } from 'next/server'
import { AccessToken } from 'livekit-server-sdk'
import { auth } from '@clerk/nextjs/server'

// Rate limiting map (in production, use Redis or similar)
const tokenRequestAttempts = new Map<string, { count: number, lastAttempt: number }>()

const RATE_LIMIT = {
  MAX_ATTEMPTS: 10,
  WINDOW_MS: 60 * 1000, // 1 minute
}

function isRateLimited(userId: string): boolean {
  const now = Date.now()
  const userAttempts = tokenRequestAttempts.get(userId)
  
  if (!userAttempts) {
    tokenRequestAttempts.set(userId, { count: 1, lastAttempt: now })
    return false
  }
  
  // Reset if window has passed
  if (now - userAttempts.lastAttempt > RATE_LIMIT.WINDOW_MS) {
    tokenRequestAttempts.set(userId, { count: 1, lastAttempt: now })
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

function sanitizeRoomName(roomName: string): string {
  // Only allow alphanumeric, hyphens, and underscores
  return roomName.replace(/[^a-zA-Z0-9-_]/g, '').substring(0, 50)
}

function sanitizeParticipantName(participantName: string): string {
  // Only allow alphanumeric, hyphens, and underscores
  return participantName.replace(/[^a-zA-Z0-9-_]/g, '').substring(0, 50)
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

    const { roomName, participantName } = await request.json()

    if (!roomName || !participantName) {
      return NextResponse.json(
        { error: 'Room name and participant name are required' },
        { status: 400 }
      )
    }

    // Sanitize inputs
    const sanitizedRoomName = sanitizeRoomName(roomName)
    const sanitizedParticipantName = sanitizeParticipantName(participantName)

    if (!sanitizedRoomName || !sanitizedParticipantName) {
      return NextResponse.json(
        { error: 'Invalid room name or participant name' },
        { status: 400 }
      )
    }

    const apiKey = process.env.LIVEKIT_API_KEY
    const apiSecret = process.env.LIVEKIT_API_SECRET
    
    if (!apiKey || !apiSecret) {
      console.error('LiveKit API credentials not found')
      return NextResponse.json(
        { error: 'Server configuration error' },
        { status: 500 }
      )
    }

    const at = new AccessToken(apiKey, apiSecret, {
      identity: sanitizedParticipantName,
      ttl: '10m', // Token valid for 10 minutes
    })
    
    at.addGrant({
      room: sanitizedRoomName,
      roomJoin: true,
      canPublish: true,
      canSubscribe: true,
      canPublishData: true,
    })

    const token = await at.toJwt()
    
    return NextResponse.json({ token })
  } catch (error) {
    console.error('Error generating LiveKit token:', error)
    return NextResponse.json(
      { error: 'Failed to generate token' },
      { status: 500 }
    )
  }
} 