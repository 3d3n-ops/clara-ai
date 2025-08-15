import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const { userId, roomName } = await request.json()

    if (!userId || !roomName) {
      return NextResponse.json(
        { error: 'userId and roomName are required' },
        { status: 400 }
      )
    }

    // Get Vapi credentials from environment
    const vapiPublicKey = process.env.VAPI_PUBLIC_KEY
    const vapiPrivateKey = process.env.VAPI_PRIVATE_KEY

    if (!vapiPublicKey || !vapiPrivateKey) {
      return NextResponse.json(
        { error: 'Vapi credentials not configured' },
        { status: 500 }
      )
    }

    // Generate a token for the user session
    // In a real implementation, you might want to use a JWT library
    // For now, we'll create a simple token structure
    const token = {
      userId,
      roomName,
      agentId: '4102aa12-fb39-4c0f-82c3-15f4f752f2f6', // Your Clara agent ID
      timestamp: Date.now(),
      expiresAt: Date.now() + (60 * 60 * 1000), // 1 hour expiry
    }

    return NextResponse.json({
      token: Buffer.from(JSON.stringify(token)).toString('base64'),
      agentId: '4102aa12-fb39-4c0f-82c3-15f4f752f2f6',
      publicKey: vapiPublicKey
    })

  } catch (error) {
    console.error('Error generating Vapi token:', error)
    return NextResponse.json(
      { error: 'Failed to generate token' },
      { status: 500 }
    )
  }
} 