import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'

// Rate limiting map (in production, use Redis or similar)
const folderRequestAttempts = new Map<string, { count: number, lastAttempt: number }>()

const RATE_LIMIT = {
  MAX_ATTEMPTS: 20,
  WINDOW_MS: 60 * 1000, // 1 minute
}

const MAX_FOLDER_NAME_LENGTH = 100
const MAX_FOLDER_DESCRIPTION_LENGTH = 500

function isRateLimited(userId: string): boolean {
  const now = Date.now()
  const userAttempts = folderRequestAttempts.get(userId)
  
  if (!userAttempts) {
    folderRequestAttempts.set(userId, { count: 1, lastAttempt: now })
    return false
  }
  
  // Reset if window has passed
  if (now - userAttempts.lastAttempt > RATE_LIMIT.WINDOW_MS) {
    folderRequestAttempts.set(userId, { count: 1, lastAttempt: now })
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

function sanitizeFolderName(name: string): string {
  return name.trim().substring(0, MAX_FOLDER_NAME_LENGTH)
}

function sanitizeFolderDescription(description: string): string {
  return description.trim().substring(0, MAX_FOLDER_DESCRIPTION_LENGTH)
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

    // Call the Python backend to get folders from Pinecone
    const pythonBackendUrl = process.env.NEXT_PUBLIC_API_URL || process.env.PYTHON_BACKEND_URL || 'http://localhost:8000'
    
    console.log(`[Folders API] Fetching folders for user ${userId} from ${pythonBackendUrl}`)
    
    const response = await fetch(`${pythonBackendUrl}/homework/folders/${userId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error(`[Folders API] Backend error (${response.status}):`, errorText)
      return NextResponse.json(
        { error: `Failed to fetch folders: ${response.status} ${response.statusText}` },
        { status: 500 }
      )
    }

    const data = await response.json()
    
    return NextResponse.json({
      success: true,
      folders: data.folders || []
    })
  } catch (error) {
    console.error('[Folders API] Error in GET /api/homework/folders:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
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

    const body = await request.json()
    const { name, description } = body

    if (!name || typeof name !== 'string') {
      return NextResponse.json(
        { error: 'Valid folder name is required' },
        { status: 400 }
      )
    }

    // Sanitize inputs
    const sanitizedName = sanitizeFolderName(name)
    const sanitizedDescription = sanitizeFolderDescription(description || '')

    if (!sanitizedName) {
      return NextResponse.json(
        { error: 'Folder name cannot be empty' },
        { status: 400 }
      )
    }

    // Call the Python backend to create folder
    const pythonBackendUrl = process.env.NEXT_PUBLIC_API_URL || process.env.PYTHON_BACKEND_URL || 'http://localhost:8000'
    
    console.log(`[Folders API] Creating folder for user ${userId} via ${pythonBackendUrl}`)
    console.log(`[Folders API] Folder data:`, { name: sanitizedName, description: sanitizedDescription })
    
    const response = await fetch(`${pythonBackendUrl}/homework/folders`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: sanitizedName,
        description: sanitizedDescription,
        user_id: userId
      }),
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error(`[Folders API] Backend error (${response.status}):`, errorText)
      
      // Provide more specific error messages based on status code
      if (response.status === 500) {
        return NextResponse.json(
          { error: 'Backend service error. Please try again later.' },
          { status: 500 }
        )
      } else if (response.status === 503) {
        return NextResponse.json(
          { error: 'Backend service temporarily unavailable. Please try again later.' },
          { status: 503 }
        )
      } else {
        return NextResponse.json(
          { error: `Failed to create folder: ${response.status} ${response.statusText}` },
          { status: 500 }
        )
      }
    }

    const data = await response.json()
    console.log(`[Folders API] Successfully created folder:`, data.folder)
    
    return NextResponse.json({
      success: true,
      folder: data.folder
    })
  } catch (error) {
    console.error('[Folders API] Error in POST /api/homework/folders:', error)
    
    // Provide more specific error messages
    if (error instanceof TypeError && error.message.includes('fetch')) {
      return NextResponse.json(
        { error: 'Unable to connect to backend service. Please try again later.' },
        { status: 503 }
      )
    }
    
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}