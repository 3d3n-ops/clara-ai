import { useState, useEffect } from 'react'
import { Room, ConnectionState } from 'livekit-client'

export interface LiveKitConnectionConfig {
  serverUrl: string
  token: string
}

export function useLiveKit() {
  const [room, setRoom] = useState<Room | null>(null)
  const [connectionState, setConnectionState] = useState<ConnectionState>(ConnectionState.Disconnected)
  const [error, setError] = useState<Error | null>(null)

  const connect = async (config: LiveKitConnectionConfig) => {
    try {
      setError(null)
      const newRoom = new Room()
      
      newRoom.on('connectionStateChanged', (state) => {
        setConnectionState(state)
      })

      newRoom.on('disconnected', () => {
        setRoom(null)
      })

      await newRoom.connect(config.serverUrl, config.token)
      setRoom(newRoom)
    } catch (err) {
      setError(err as Error)
      console.error('Failed to connect to LiveKit room:', err)
    }
  }

  const disconnect = async () => {
    if (room) {
      await room.disconnect()
      setRoom(null)
    }
  }

  useEffect(() => {
    return () => {
      if (room) {
        room.disconnect()
      }
    }
  }, [room])

  return {
    room,
    connectionState,
    error,
    connect,
    disconnect,
    isConnected: connectionState === ConnectionState.Connected
  }
}

export async function generateLiveKitToken(roomName: string, participantName: string) {
  try {
    const response = await fetch('/api/livekit/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        roomName,
        participantName,
      }),
    })

    if (!response.ok) {
      throw new Error('Failed to generate token')
    }

    const data = await response.json()
    return data.token
  } catch (error) {
    console.error('Error generating LiveKit token:', error)
    throw error
  }
} 