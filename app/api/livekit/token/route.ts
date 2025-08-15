import { NextRequest, NextResponse } from 'next/server'
import { AccessToken } from 'livekit-server-sdk'

export async function POST(request: NextRequest) {
  try {
    const { roomName, userId, participantName } = await request.json()

    // Handle both old format (userId) and new format (participantName)
    const identity = userId || participantName

    if (!roomName || !identity) {
      return NextResponse.json(
        { error: 'Missing roomName or userId/participantName' },
        { status: 400 }
      )
    }

    // Get LiveKit credentials from environment variables
    const apiKey = process.env.LIVEKIT_API_KEY
    const apiSecret = process.env.LIVEKIT_API_SECRET
    const livekitUrl = process.env.LIVEKIT_URL

    if (!apiKey || !apiSecret || !livekitUrl) {
      return NextResponse.json(
        { error: 'LiveKit credentials not configured' },
        { status: 500 }
      )
    }

    // Create access token
    const at = new AccessToken(apiKey, apiSecret, {
      identity: identity,
      name: `User-${identity}`,
    })

    // Grant permissions for the room
    at.addGrant({
      room: roomName,
      roomJoin: true,
      canPublish: true,
      canSubscribe: true,
      canPublishData: true,
    })

    // Generate token
    const token = await at.toJwt()

    // Return both token and wsUrl for frontend connection
    return NextResponse.json({ 
      token,
      wsUrl: livekitUrl
    })
  } catch (error) {
    console.error('Error generating LiveKit token:', error)
    return NextResponse.json(
      { error: 'Failed to generate token' },
      { status: 500 }
    )
  }
} 