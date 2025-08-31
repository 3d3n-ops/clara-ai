import { NextRequest, NextResponse } from 'next/server'
import { AccessToken } from 'livekit-server-sdk'

export async function POST(request: NextRequest) {
  try {
    const { roomName, userId, participantName } = await request.json()
    const identity = userId || participantName

    if (!roomName || !identity) {
      return NextResponse.json(
        { error: 'Missing roomName or userId/participantName' },
        { status: 400 }
      )
    }

    // These are the verified environment variable names
    const apiKey = process.env.LIVEKIT_API_KEY
    const apiSecret = process.env.LIVEKIT_API_SECRET  
    const livekitUrl = process.env.NEXT_PUBLIC_LIVEKIT_URL

    if (!apiKey || !apiSecret || !livekitUrl) {
      return NextResponse.json(
        { error: 'LiveKit credentials not configured' },
        { status: 500 }
      )
    }

    const at = new AccessToken(apiKey, apiSecret, {
      identity: identity,
      name: `User-${identity}`,
    })

    at.addGrant({
      room: roomName,
      roomJoin: true,
      canPublish: true,
      canSubscribe: true,
      canPublishData: true,
      agent: true,
    })

    const token = await at.toJwt()

    console.log("✅ LiveKit Token: Generated token for room:", roomName)
    console.log("🤖 LiveKit Cloud Agent: Will auto-join when user connects")

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