"use client"

import { useState, useEffect, useCallback } from 'react'
import { Room, RoomEvent, Participant } from 'livekit-client'

interface VoiceAgentState {
  isConnected: boolean
  isRecording: boolean
  isProcessing: boolean
  error: string | null
  messages: string[]
}

interface UseVoiceAgentProps {
  roomName?: string
  userId?: string
}

export function useVoiceAgent({ roomName, userId }: UseVoiceAgentProps = {}) {
  const [state, setState] = useState<VoiceAgentState>({
    isConnected: false,
    isRecording: false,
    isProcessing: false,
    error: null,
    messages: []
  })
  const [room, setRoom] = useState<Room | null>(null)

  // Get LiveKit token
  const getLiveKitToken = useCallback(async (roomName: string, userId: string): Promise<string | null> => {
    try {
      const response = await fetch('/api/livekit/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          roomName,
          userId,
        }),
      })
      
      if (response.ok) {
        const data = await response.json()
        return data.token
      }
      
      return null
    } catch (error) {
      console.error('Error getting LiveKit token:', error)
      return null
    }
  }, [])

  // Connect to voice agent
  const connect = useCallback(async () => {
    try {
      const livekitUrl = process.env.NEXT_PUBLIC_LIVEKIT_URL || 'wss://your-livekit-instance.livekit.cloud'
      const currentRoomName = roomName || `clara-demo-${Date.now()}`
      const currentUserId = userId || `user-${Date.now()}`
      
      const token = await getLiveKitToken(currentRoomName, currentUserId)
      
      if (!token) {
        setState(prev => ({ ...prev, error: 'Failed to get LiveKit token' }))
        return
      }

      // Create room instance
      const newRoom = new Room()
      
      // Connect to room
      await newRoom.connect(livekitUrl, token, {
        autoSubscribe: true,
      })
      
      console.log('Connected to LiveKit room:', currentRoomName)
      setRoom(newRoom)
      setState(prev => ({ 
        ...prev, 
        isConnected: true, 
        error: null,
        messages: [...prev.messages, "Connected to Clara's voice session!"]
      }))
      
      // Listen for participant events (when Clara agent joins)
      newRoom.on(RoomEvent.ParticipantConnected, (participant: Participant) => {
        console.log('Participant connected:', participant.identity)
        if (participant.identity.includes('Clara') || participant.identity.includes('clara')) {
          setState(prev => ({ 
            ...prev, 
            messages: [...prev.messages, "Clara has joined the session and is ready to help!"]
          }))
        }
      })
      
      // Listen for data messages from the agent
      newRoom.on(RoomEvent.DataReceived, (payload: Uint8Array, participant?: Participant) => {
        try {
          const data = JSON.parse(new TextDecoder().decode(payload))
          console.log('Received data from agent:', data)
          
          if (data.type === 'response') {
            setState(prev => ({ 
              ...prev, 
              messages: [...prev.messages, `Clara: ${data.text}`]
            }))
          }
        } catch (err) {
          console.error('Error parsing agent message:', err)
        }
      })

    } catch (error) {
      console.error('Error connecting to voice agent:', error)
      setState(prev => ({ 
        ...prev, 
        error: 'Failed to connect to voice agent' 
      }))
    }
  }, [roomName, userId, getLiveKitToken])

  // Disconnect from voice agent
  const disconnect = useCallback(() => {
    if (room) {
      room.disconnect()
      setRoom(null)
      setState(prev => ({ 
        ...prev, 
        isConnected: false,
        isRecording: false,
        isProcessing: false
      }))
    }
  }, [room])

  // Toggle recording
  const toggleRecording = useCallback(() => {
    if (!room || !state.isConnected) {
      // If not connected, try to connect first
      connect()
      return
    }

    setState(prev => ({ 
      ...prev, 
      isRecording: !prev.isRecording,
      isProcessing: !prev.isRecording // Start processing when recording starts
    }))

    // Simulate processing delay
    if (!state.isRecording) {
      setTimeout(() => {
        setState(prev => ({ 
          ...prev, 
          isProcessing: false,
          messages: [...prev.messages, "Clara: I heard you! How can I help with your studies today?"]
        }))
      }, 2000)
    }
  }, [room, state.isConnected, state.isRecording, connect])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (room) {
        room.disconnect()
      }
    }
  }, [room])

  return {
    ...state,
    connect,
    disconnect,
    toggleRecording
  }
} 