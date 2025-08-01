import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    console.log('[TTS Test] Testing ElevenLabs API connection...')
    
    // ElevenLabs API configuration
    const ELEVENLABS_API_KEY = process.env.ELEVENLABS_API_KEY || 'sk_9d8562f0f4cb192d69ed8a227dcf030a461eca8629c2c606'
    const ELEVENLABS_BASE_URL = 'https://api.elevenlabs.io/v1'

    console.log('[TTS Test] API Key (first 10 chars):', ELEVENLABS_API_KEY.substring(0, 10) + '...')

    // First, test the voices endpoint to see if we can connect
    const voicesResponse = await fetch(`${ELEVENLABS_BASE_URL}/voices`, {
      method: 'GET',
      headers: {
        'xi-api-key': ELEVENLABS_API_KEY,
      },
    })

    console.log('[TTS Test] Voices response status:', voicesResponse.status)

    if (!voicesResponse.ok) {
      const errorText = await voicesResponse.text()
      console.error('[TTS Test] Voices API error:', errorText)
      
      return NextResponse.json({
        success: false,
        error: 'Failed to connect to ElevenLabs API',
        status: voicesResponse.status,
        details: errorText
      })
    }

    const voices = await voicesResponse.json()
    console.log('[TTS Test] Available voices:', voices.voices?.length || 0)

    // Test with a simple TTS request
    const testVoiceId = '21m00Tcm4TlvDq8ikWAM' // Rachel voice
    const testText = 'Hello, this is a test of the text to speech API.'

    const ttsResponse = await fetch(`${ELEVENLABS_BASE_URL}/text-to-speech/${testVoiceId}`, {
      method: 'POST',
      headers: {
        'Accept': 'audio/mpeg',
        'Content-Type': 'application/json',
        'xi-api-key': ELEVENLABS_API_KEY,
      },
      body: JSON.stringify({
        text: testText,
        model_id: 'eleven_monolingual_v1',
        voice_settings: {
          stability: 0.5,
          similarity_boost: 0.5
        }
      }),
    })

    console.log('[TTS Test] TTS response status:', ttsResponse.status)

    if (!ttsResponse.ok) {
      const errorText = await ttsResponse.text()
      console.error('[TTS Test] TTS API error:', errorText)
      
      return NextResponse.json({
        success: false,
        error: 'Failed to generate test TTS',
        status: ttsResponse.status,
        details: errorText
      })
    }

    const audioBuffer = await ttsResponse.arrayBuffer()
    console.log('[TTS Test] Audio buffer size:', audioBuffer.byteLength)

    return NextResponse.json({
      success: true,
      message: 'ElevenLabs API is working correctly',
      availableVoices: voices.voices?.length || 0,
      testAudioSize: audioBuffer.byteLength,
      apiKeyValid: true
    })

  } catch (error) {
    console.error('[TTS Test] Error:', error)
    
    return NextResponse.json({
      success: false,
      error: 'Test failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    })
  }
} 