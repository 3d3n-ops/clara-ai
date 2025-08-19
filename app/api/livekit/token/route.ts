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

    try {
      const modalWebhookUrl = process.env.MODAL_WEBHOOK_URL
      if (modalWebhookUrl) {
        console.log(`Triggering Modal webhook for room: ${roomName}`)
        console.log(`Modal webhook URL: ${modalWebhookUrl}`)

        const webhookResponse = await fetch(modalWebhookUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            event: 'room_started',
            id: `manual-${Date.now()}`,
            createdAt: Math.floor(Date.now() / 1000),
            room: {
              sid: roomName,
              name: roomName
            }
          })
        })
        
        if (webhookResponse.ok) {
          console.log('Successfully triggered Modal agent')
        } else {
          const errorText = await webhookResponse.text()
          console.error(`Failed to trigger Modal agent (${webhookResponse.status}):`, errorText)
        }
      } else {
        console.warn('MODAL_WEBHOOK_URL not configured - agent will not be triggered')
      }
    } catch (webhookError) {
      console.error('Error triggering Modal webhook:', webhookError)
      // Don't fail the token request if webhook fails
    }

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