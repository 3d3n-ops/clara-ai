import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'

// Rate limiting map (in production, use Redis or similar)
const fileRequestAttempts = new Map<string, { count: number, lastAttempt: number }>()

const RATE_LIMIT = {
  MAX_ATTEMPTS: 30,
  WINDOW_MS: 60 * 1000, // 1 minute
}

function isRateLimited(userId: string): boolean {
  const now = Date.now()
  const userAttempts = fileRequestAttempts.get(userId)
  
  if (!userAttempts) {
    fileRequestAttempts.set(userId, { count: 1, lastAttempt: now })
    return false
  }
  
  // Reset if window has passed
  if (now - userAttempts.lastAttempt > RATE_LIMIT.WINDOW_MS) {
    fileRequestAttempts.set(userId, { count: 1, lastAttempt: now })
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

export async function GET(request: NextRequest) {
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

    const { searchParams } = new URL(request.url)
    const folderId = searchParams.get('folderId')

    // Validate folderId if provided
    if (folderId && typeof folderId !== 'string') {
      return NextResponse.json(
        { error: 'Invalid folder ID' },
        { status: 400 }
      )
    }

    // Call the Python backend to get files from Pinecone
    const pythonBackendUrl = process.env.PYTHON_BACKEND_URL || 'http://localhost:8000'
    
    const url = folderId 
      ? `${pythonBackendUrl}/homework/files/${userId}?class_id=${encodeURIComponent(folderId)}`
      : `${pythonBackendUrl}/homework/files/${userId}`
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    })

    if (!response.ok) {
      console.error('Error fetching files from backend:', response.status)
      return NextResponse.json(
        { error: 'Failed to fetch files' },
        { status: 500 }
      )
    }

    const data = await response.json()
    
    return NextResponse.json({
      success: true,
      files: data.files || []
    })
  } catch (error) {
    console.error('Error in GET /api/homework/files:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}