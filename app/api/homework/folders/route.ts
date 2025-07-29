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
    const pythonBackendUrl = process.env.PYTHON_BACKEND_URL || 'http://localhost:8000'
    
    const response = await fetch(`${pythonBackendUrl}/homework/folders/${userId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    })

    if (!response.ok) {
      console.error('Error fetching folders from backend:', response.status)
      return NextResponse.json(
        { error: 'Failed to fetch folders' },
        { status: 500 }
      )
    }

    const data = await response.json()
    
    return NextResponse.json({
      success: true,
      folders: data.folders || []
    })
  } catch (error) {
    console.error('Error in GET /api/homework/folders:', error)
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
    const pythonBackendUrl = process.env.PYTHON_BACKEND_URL || 'http://localhost:8000'
    
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
      console.error('Error creating folder:', response.status)
      return NextResponse.json(
        { error: 'Failed to create folder' },
        { status: 500 }
      )
    }

    const data = await response.json()
    
    return NextResponse.json({
      success: true,
      folder: data.folder
    })
  } catch (error) {
    console.error('Error in POST /api/homework/folders:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}