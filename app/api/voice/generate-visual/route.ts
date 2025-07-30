import { NextRequest, NextResponse } from 'next/server'

interface VisualGenerationRequest {
  command_type: string
  topic: string
  context: string
  user_id: string
}

export async function POST(request: NextRequest) {
  try {
    const body: VisualGenerationRequest = await request.json()
    
    console.log('[Visual API] Received request:', {
      command_type: body.command_type,
      topic: body.topic,
      user_id: body.user_id
    })

    // Call the Python backend
    const pythonBackendUrl = process.env.PYTHON_BACKEND_URL || 'http://localhost:8000'
    
    const response = await fetch(`${pythonBackendUrl}/voice/generate-visual`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error(`[Visual API] Backend error (${response.status}):`, errorText)
      
      return NextResponse.json(
        { 
          success: false,
          error: `Backend error: ${response.status} ${response.statusText}` 
        },
        { status: response.status }
      )
    }

    const data = await response.json()
    console.log('[Visual API] Successfully generated visual content:', data.command_type)
    
    return NextResponse.json(data)
    
  } catch (error) {
    console.error('[Visual API] Error generating visual content:', error)
    
    return NextResponse.json(
      { 
        success: false,
        error: error instanceof Error ? error.message : 'Internal server error'
      },
      { status: 500 }
    )
  }
} 