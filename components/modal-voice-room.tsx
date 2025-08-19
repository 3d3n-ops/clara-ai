"use client"

import React, { useState, useEffect, useRef } from 'react'
import { 
  Room, 
  RoomEvent, 
  RemoteParticipant, 
  LocalTrackPublication,
  RemoteTrackPublication
} from 'livekit-client'

interface ModalVoiceRoomProps {
  onEndSession: () => void
}

export default function ModalVoiceRoom({ onEndSession }: ModalVoiceRoomProps) {
  const [isConnected, setIsConnected] = useState(false)
  const [isConnecting, setIsConnecting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isMuted, setIsMuted] = useState(false)
  const [hasAgent, setHasAgent] = useState(false)
  
  const roomRef = useRef<Room | null>(null)
  const audioRef = useRef<HTMLAudioElement>(null)

  const connectToRoom = async () => {
    if (isConnecting) return
    
    setIsConnecting(true)
    setError(null)

    try {
      // Generate a random room name and user ID
      const roomName = `study-room-${Date.now()}`
      const userId = `user-${Math.random().toString(36).substr(2, 9)}`

      console.log('Requesting token for room:', roomName)

      // Get token from your API
      const response = await fetch('/api/livekit/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ roomName, participantName: userId })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to get token')
      }

      const { token, wsUrl } = await response.json()
      console.log('Got token, connecting to:', wsUrl)

      // Create and connect to room
      const room = new Room({
        adaptiveStream: true,
        dynacast: true,
      })

      roomRef.current = room

      // Set up room event listeners
      room.on(RoomEvent.Connected, () => {
        console.log('Connected to room')
        setIsConnected(true)
        setIsConnecting(false)
      })

      room.on(RoomEvent.Disconnected, () => {
        console.log('Disconnected from room')
        setIsConnected(false)
        cleanup()
      })

      room.on(RoomEvent.ParticipantConnected, (participant: RemoteParticipant) => {
        console.log('Participant connected:', participant.identity)
        if (participant.identity.includes('agent')) {
          setHasAgent(true)
          console.log('Agent joined the room!')
        }
      })

      room.on(RoomEvent.TrackSubscribed, (track, publication: RemoteTrackPublication) => {
        console.log('Track subscribed:', track.kind)
        if (track.kind === 'audio' && audioRef.current) {
          track.attach(audioRef.current)
        }
      })

      room.on(RoomEvent.TrackUnsubscribed, (track) => {
        console.log('Track unsubscribed:', track.kind)
        track.detach()
      })

      // Connect to the room
      await room.connect(wsUrl, token)
      
      // Enable microphone
      await room.localParticipant.setMicrophoneEnabled(true)
      console.log('Microphone enabled')

    } catch (err) {
      console.error('Connection error:', err)
      setError(err instanceof Error ? err.message : 'Failed to connect')
      setIsConnecting(false)
    }
  }

  const disconnect = async () => {
    if (roomRef.current) {
      await roomRef.current.disconnect()
      cleanup()
    }
    onEndSession()
  }

  const toggleMute = async () => {
    if (roomRef.current?.localParticipant) {
      if (isMuted) {
        await roomRef.current.localParticipant.setMicrophoneEnabled(true)
      } else {
        await roomRef.current.localParticipant.setMicrophoneEnabled(false)
      }
      setIsMuted(!isMuted)
    }
  }

  const cleanup = () => {
    if (roomRef.current) {
      roomRef.current.removeAllListeners()
      roomRef.current = null
    }
    setIsConnected(false)
    setIsConnecting(false)
    setHasAgent(false)
  }

  useEffect(() => {
    return () => {
      cleanup()
    }
  }, [])

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-8 bg-gray-100">
      <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full">
        <h1 className="text-2xl font-bold text-center mb-6">Voice Agent Test</h1>
        
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}

        <div className="space-y-4">
          {!isConnected ? (
            <button
              onClick={connectToRoom}
              disabled={isConnecting}
              className="w-full py-3 px-4 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isConnecting ? 'Connecting...' : 'Start Voice Chat'}
            </button>
          ) : (
            <div className="space-y-4">
              <div className="text-center">
                <div className="flex items-center justify-center space-x-2 mb-2">
                  <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                  <span className="text-green-600 font-medium">Connected</span>
                </div>
                
                {hasAgent ? (
                  <p className="text-green-600 text-sm">🤖 Agent is ready to chat!</p>
                ) : (
                  <p className="text-orange-600 text-sm">⏳ Waiting for agent to join...</p>
                )}
              </div>

              <div className="flex space-x-2">
                <button
                  onClick={toggleMute}
                  className={`flex-1 py-2 px-4 rounded-lg ${
                    isMuted 
                      ? 'bg-red-500 hover:bg-red-600 text-white' 
                      : 'bg-gray-200 hover:bg-gray-300 text-gray-800'
                  }`}
                >
                  {isMuted ? '🔇 Unmute' : '🎤 Mute'}
                </button>
                
                <button
                  onClick={disconnect}
                  className="flex-1 py-2 px-4 bg-red-500 text-white rounded-lg hover:bg-red-600"
                >
                  End Chat
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Hidden audio element for agent voice */}
        <audio ref={audioRef} autoPlay playsInline />
        
        <div className="mt-6 text-xs text-gray-500 text-center">
          <p>Make sure to allow microphone permissions when prompted</p>
        </div>
      </div>
    </div>
  )
}