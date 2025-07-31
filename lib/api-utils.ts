import { auth } from '@clerk/nextjs/server'

// Server-side API utilities for secure communication
export class ServerAPIError extends Error {
  constructor(
    message: string,
    public status: number,
    public code?: string
  ) {
    super(message)
    this.name = 'ServerAPIError'
  }
}

export async function getAuthenticatedUser(): Promise<string> {
  const { userId } = await auth()
  if (!userId) {
    throw new ServerAPIError('Unauthorized', 401)
  }
  return userId
}

export async function serverFetch<T = any>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const userId = await getAuthenticatedUser()
  
  const defaultHeaders = {
    'Content-Type': 'application/json',
  }

  const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || process.env.PYTHON_BACKEND_URL || 'http://localhost:8000'}${endpoint}`, {
    ...options,
    headers: {
      ...defaultHeaders,
      ...options.headers,
    },
  })

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}))
    throw new ServerAPIError(
      errorData.error || `HTTP ${response.status}`,
      response.status,
      errorData.code
    )
  }

  return response.json()
}

// Homework API utilities
export async function getFolders(): Promise<{ folders: any[] }> {
  return serverFetch('/homework/folders')
}

export async function createFolder(name: string, description?: string): Promise<{ folder: any }> {
  return serverFetch('/homework/folders', {
    method: 'POST',
    body: JSON.stringify({ name, description }),
  })
}

export async function getFiles(folderId?: string): Promise<{ files: any[] }> {
  const url = folderId ? `/homework/files?class_id=${encodeURIComponent(folderId)}` : '/homework/files'
  return serverFetch(url)
}

export async function uploadFile(file: File, folderId?: string): Promise<{ file_id: string; chunks_processed: number }> {
  const formData = new FormData()
  formData.append('file', file)
  if (folderId) {
    formData.append('folderId', folderId)
  }
  
  return serverFetch('/homework/upload-rag', {
    method: 'POST',
    body: formData,
  })
}

export async function chatWithAgent(message: string, conversationHistory?: any[], conversationId?: string, folderId?: string): Promise<any> {
  return serverFetch('/homework/chat-rag', {
    method: 'POST',
    body: JSON.stringify({
      message,
      conversation_history: conversationHistory || [],
      conversation_id: conversationId,
      folder_id: folderId,
    }),
  })
}

export async function deleteFile(fileId: string): Promise<any> {
  return serverFetch(`/homework/files/${fileId}`, {
    method: 'DELETE',
  })
}

export async function getUserContext(folderId?: string): Promise<{ context: any }> {
  const url = folderId ? `/homework/context?class_id=${encodeURIComponent(folderId)}` : '/homework/context'
  return serverFetch(url)
}

// LiveKit utilities
export async function generateLiveKitToken(roomName: string, participantName: string): Promise<{ token: string }> {
  return serverFetch('/livekit/token', {
    method: 'POST',
    body: JSON.stringify({ room_name: roomName, participant_name: participantName }),
  })
}

// Study session utilities
export async function completeStudySession(sessionData: any): Promise<any> {
  return serverFetch('/study-session/complete', {
    method: 'POST',
    body: JSON.stringify(sessionData),
  })
}