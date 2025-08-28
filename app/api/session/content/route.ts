import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'

export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth()
    
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Get cache key from query params
    const { searchParams } = new URL(request.url)
    const cacheKey = searchParams.get('cacheKey')

    if (!cacheKey) {
      return NextResponse.json(
        { error: 'Cache key is required' },
        { status: 400 }
      )
    }

    const backendUrl = process.env.NEXT_PUBLIC_API_URL || process.env.PYTHON_BACKEND_URL || 'http://localhost:8000'

    const response = await fetch(`${backendUrl}/summary/${cacheKey}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error(`[Session Content API] Backend error: ${response.status} - ${errorText}`)
      
      return NextResponse.json(
        { 
          success: false,
          error: `Backend error: ${response.status} - ${errorText}`
        },
        { status: response.status }
      )
    }

    const data = await response.json()
    
    console.log(`[Session Content API] Successfully retrieved session content for key: ${cacheKey}`)
    
    return NextResponse.json({
      success: true,
      title: data.title,
      notes: data.notes,
      diagram: data.diagram
    })
  } catch (error) {
    console.error('[Session Content API] Error retrieving session content:', error)
    
    return NextResponse.json(
      { 
        success: false,
        error: error instanceof Error ? error.message : 'Failed to retrieve session content'
      },
      { status: 500 }
    )
  }
}
