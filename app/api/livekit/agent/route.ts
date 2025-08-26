import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const { roomName } = await request.json()
    
    console.log('🚀 Agent API: Received request to trigger agent')
    console.log('🏠 Room Name:', roomName)
    
    if (!roomName) {
      console.error('❌ Agent API: Missing roomName in request')
      return NextResponse.json(
        { error: 'Room name is required' },
        { status: 400 }
      )
    }

    // Get environment variables for Modal webhook
    const modalWebhookUrl = process.env.MODAL_AGENT_WEBHOOK_URL
    const modalApiKey = process.env.MODAL_API_KEY
    
    if (!modalWebhookUrl) {
      console.error('❌ Agent API: MODAL_AGENT_WEBHOOK_URL not configured')
      return NextResponse.json(
        { error: 'Modal webhook URL not configured' },
        { status: 500 }
      )
    }

    console.log('📡 Agent API: Calling Modal webhook...')
    console.log('🔗 Webhook URL:', modalWebhookUrl)

    // Call Modal webhook to trigger agent
    const webhookResponse = await fetch(modalWebhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(modalApiKey && { 'Authorization': `Bearer ${modalApiKey}` })
      },
      body: JSON.stringify({
        roomName,
        timestamp: new Date().toISOString(),
        action: 'join_room'
      })
    })

    console.log('📨 Agent API: Modal webhook response status:', webhookResponse.status)

    if (!webhookResponse.ok) {
      const errorText = await webhookResponse.text()
      console.error('❌ Agent API: Modal webhook failed:', errorText)
      return NextResponse.json(
        { error: 'Failed to trigger agent', details: errorText },
        { status: 500 }
      )
    }

    const webhookData = await webhookResponse.json().catch(() => ({}))
    console.log('✅ Agent API: Agent triggered successfully')
    console.log('📦 Webhook response:', webhookData)

    return NextResponse.json({
      success: true,
      message: 'Agent triggered successfully',
      roomName,
      webhookResponse: webhookData
    })

  } catch (error) {
    console.error('💥 Agent API: Unexpected error:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
