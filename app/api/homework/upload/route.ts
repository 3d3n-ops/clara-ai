import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'

// Rate limiting map (in production, use Redis or similar)
const uploadRequestAttempts = new Map<string, { count: number, lastAttempt: number }>()

const RATE_LIMIT = {
  MAX_ATTEMPTS: 10,
  WINDOW_MS: 60 * 1000, // 1 minute
}

const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10MB
const ALLOWED_FILE_TYPES = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'text/plain',
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp'
]

function isRateLimited(userId: string): boolean {
  const now = Date.now()
  const userAttempts = uploadRequestAttempts.get(userId)
  
  if (!userAttempts) {
    uploadRequestAttempts.set(userId, { count: 1, lastAttempt: now })
    return false
  }
  
  // Reset if window has passed
  if (now - userAttempts.lastAttempt > RATE_LIMIT.WINDOW_MS) {
    uploadRequestAttempts.set(userId, { count: 1, lastAttempt: now })
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

function validateFile(file: File): { isValid: boolean; error?: string } {
  // Check file size
  if (file.size > MAX_FILE_SIZE) {
    return { isValid: false, error: 'File size exceeds 10MB limit' }
  }
  
  // Check file type
  if (!ALLOWED_FILE_TYPES.includes(file.type)) {
    return { isValid: false, error: 'File type not allowed' }
  }
  
  return { isValid: true }
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

    const formData = await request.formData()
    const file = formData.get('file') as File
    const folderId = formData.get('folderId') as string

    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      )
    }

    // Validate file
    const validation = validateFile(file)
    if (!validation.isValid) {
      return NextResponse.json(
        { error: validation.error },
        { status: 400 }
      )
    }

    // Read file content
    const arrayBuffer = await file.arrayBuffer()
    const content = new TextDecoder().decode(arrayBuffer)
    
    // Prepare request body for Python backend with user_id
    const requestBody = {
      filename: file.name,
      content: content,
      folder_id: folderId || null,
      user_id: userId  // Add user_id to the request
    }
    
    const pythonBackendUrl = process.env.PYTHON_BACKEND_URL || 'http://localhost:8000'
    
    console.log(`Uploading file ${file.name} for user ${userId} to folder ${folderId || 'none'}`)
    
    const response = await fetch(`${pythonBackendUrl}/homework/upload-rag`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      console.error(`Backend upload error: ${response.status} - ${errorData.error || 'Unknown error'}`)
      return NextResponse.json(
        { 
          success: false,
          error: `Backend error: ${response.status} - ${errorData.error || 'Unknown error'}`
        },
        { status: response.status }
      )
    }

    const data = await response.json()
    
    console.log(`Successfully uploaded: ${file.name}`)
    
    return NextResponse.json({
      success: true,
      file_id: data.file_id,
      filename: file.name,
      chunks_processed: data.chunks_processed,
      message: 'File uploaded and processed successfully'
    })
  } catch (error) {
    console.error('Error uploading file:', error)
    return NextResponse.json(
      { 
        success: false,
        error: error instanceof Error ? error.message : 'Failed to upload file'
      },
      { status: 500 }
    )
  }
} 