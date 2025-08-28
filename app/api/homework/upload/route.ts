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

    console.log(`[Upload API] Processing upload for user ${userId}`)
    console.log(`[Upload API] File details: name=${file.name}, size=${file.size}, type=${file.type}`)
    console.log(`[Upload API] Folder ID: ${folderId || 'none'}`)

    // Validate file
    const validation = validateFile(file)
    if (!validation.isValid) {
      console.log(`[Upload API] File validation failed: ${validation.error}`)
      return NextResponse.json(
        { error: validation.error },
        { status: 400 }
      )
    }

    // Read file content with proper encoding handling
    console.log(`[Upload API] Reading file content...`)
    const arrayBuffer = await file.arrayBuffer()
    
    // Determine if this is a text file or binary file
    const isTextFile = file.type.startsWith('text/') || 
                      file.name.endsWith('.txt') || 
                      file.name.endsWith('.md') ||
                      file.name.endsWith('.json') ||
                      file.name.endsWith('.csv')
    
    let content: string
    if (isTextFile) {
      // For text files, decode as UTF-8
      try {
        content = new TextDecoder('utf-8').decode(arrayBuffer)
      } catch (error) {
        // Fallback to latin-1 if UTF-8 fails
        content = new TextDecoder('latin-1').decode(arrayBuffer)
      }
    } else {
      // For binary files (PDF, DOC, etc.), encode as base64
      const uint8Array = new Uint8Array(arrayBuffer)
      content = btoa(String.fromCharCode(...uint8Array))
    }
    
    console.log(`[Upload API] File content length: ${content.length} characters`)
    console.log(`[Upload API] File type: ${isTextFile ? 'text' : 'binary'}`)
    
    // Prepare request body for Python backend with user_id
    const requestBody = {
      filename: file.name,
      content: content,
      content_type: isTextFile ? 'text' : 'binary',
      folder_id: folderId || null,
      user_id: userId  // Add user_id to the request
    }
    
    const pythonBackendUrl = process.env.NEXT_PUBLIC_API_URL || process.env.PYTHON_BACKEND_URL || 'http://localhost:8000'
    
    console.log(`[Upload API] Uploading file ${file.name} for user ${userId}`)
    console.log(`[Upload API] Backend URL: ${pythonBackendUrl}`)
    
    const response = await fetch(`${pythonBackendUrl}/file-upload/`, {
      method: 'POST',
      body: formData,
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error(`[Upload API] Backend upload error: ${response.status} - ${errorText}`)
      
      // Try to parse as JSON for better error handling
      let errorData: { error?: string } = {}
      try {
        errorData = JSON.parse(errorText)
      } catch (e) {
        errorData = { error: errorText || 'Unknown error' }
      }
      
      return NextResponse.json(
        { 
          success: false,
          error: `Backend error: ${response.status} - ${errorData.error || 'Unknown error'}`
        },
        { status: response.status }
      )
    }

    const data = await response.json()
    
    console.log(`[Upload API] Successfully uploaded: ${file.name}`)
    console.log(`[Upload API] Response data:`, data)
    
    // Add client-side cache key storage logic
    if (data.cache_key) {
      console.log(`[Upload API] Storing cache key: ${data.cache_key}`)
    }

    return NextResponse.json({
      success: true,
      file_id: data.file_id,
      filename: file.name,
      chunks_processed: data.chunks_processed,
      cache_key: data.cache_key || null,
      message: 'File uploaded and processed successfully'
    })
  } catch (error) {
    console.error('[Upload API] Error uploading file:', error)
    
    // Provide more specific error messages
    if (error instanceof TypeError && error.message.includes('fetch')) {
      return NextResponse.json(
        { 
          success: false,
          error: 'Unable to connect to backend service. Please try again later.'
        },
        { status: 503 }
      )
    }
    
    return NextResponse.json(
      { 
        success: false,
        error: error instanceof Error ? error.message : 'Failed to upload file'
      },
      { status: 500 }
    )
  }
} 