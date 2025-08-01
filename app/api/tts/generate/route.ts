import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const { text, voice_id = '21m00Tcm4TlvDq8ikWAM' } = await request.json()

    if (!text) {
      return NextResponse.json({ error: 'Text is required' }, { status: 400 })
    }

    console.log('[TTS API] Generating speech for text:', text.substring(0, 50) + '...')

    // ElevenLabs API configuration
    const ELEVENLABS_API_KEY = process.env.ELEVENLABS_API_KEY || 'sk_9d8562f0f4cb192d69ed8a227dcf030a461eca8629c2c606'
    const ELEVENLABS_BASE_URL = 'https://api.elevenlabs.io/v1'

    console.log('[TTS API] Using API key:', ELEVENLABS_API_KEY.substring(0, 10) + '...')
    console.log('[TTS API] Voice ID:', voice_id)

    // Call ElevenLabs TTS API
    const response = await fetch(`${ELEVENLABS_BASE_URL}/text-to-speech/${voice_id}`, {
      method: 'POST',
      headers: {
        'Accept': 'audio/mpeg',
        'Content-Type': 'application/json',
        'xi-api-key': ELEVENLABS_API_KEY,
      },
      body: JSON.stringify({
        text: text,
        model_id: 'eleven_monolingual_v1',
        voice_settings: {
          stability: 0.5,
          similarity_boost: 0.5
        }
      }),
    })

    console.log('[TTS API] Response status:', response.status)
    console.log('[TTS API] Response headers:', Object.fromEntries(response.headers.entries()))

    if (!response.ok) {
      const errorText = await response.text()
      console.error(`[TTS API] ElevenLabs API error (${response.status}):`, errorText)
      
      // Try to parse error details
      let errorDetails = errorText
      try {
        const errorJson = JSON.parse(errorText)
        errorDetails = errorJson.detail || errorJson.message || errorText
      } catch (e) {
        // If not JSON, use the raw text
      }
      
      return NextResponse.json(
        { 
          error: `TTS API error: ${response.status} ${response.statusText}`,
          details: errorDetails
        },
        { status: response.status }
      )
    }

    // Get the audio data
    const audioBuffer = await response.arrayBuffer()
    console.log('[TTS API] Audio buffer size:', audioBuffer.byteLength)
    
    // Convert to base64 for easy transmission
    const base64Audio = Buffer.from(audioBuffer).toString('base64')
    
    // Create a data URL
    const audioDataUrl = `data:audio/mpeg;base64,${base64Audio}`

    console.log('[TTS API] Successfully generated audio')

    return NextResponse.json({
      success: true,
      audioUrl: audioDataUrl,
      text: text,
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    console.error('[TTS API] Error in TTS API:', error)
    
    // Return more detailed error information
    return NextResponse.json(
      { 
        error: 'Failed to generate speech',
        details: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined
      },
      { status: 500 }
    )
  }
} 