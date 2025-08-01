"use client"

import React, { useState, useEffect, useCallback } from 'react'
import {
  ControlBar,
  Chat,
  GridLayout,
  ParticipantTile,
  RoomAudioRenderer,
  useLocalParticipant,
  useRoomContext,
  useTracks,
  useParticipants,
  ConnectionStateToast,
  PreJoin,
} from '@livekit/components-react'
import { Track, RoomEvent, Participant, Room } from 'livekit-client'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Mic, Volume2, MessageSquare, Users } from "lucide-react"

interface ModalVoiceRoomProps {
  onEndSession: () => void
}

interface VisualContent {
  type: 'diagram' | 'flashcard' | 'quiz' | 'mindmap'
  title: string
  description?: string
  components?: string[]
  relationships?: string[]
  cards?: Array<{ front: string; back: string }>
  questions?: Array<{
    question: string
    options: string[]
    correct_answer: string
  }>
  central_topic?: string
  branches?: Array<{ topic: string; subtopics: string[] }>
  generated_at: string
}

function ModalVoiceRoomContent({ onEndSession }: ModalVoiceRoomProps) {
  const [userId] = useState(() => 'user-' + Date.now())
  const [isConnected, setIsConnected] = useState(false)
  const [messages, setMessages] = useState<string[]>([])
  const [currentVisualContent, setCurrentVisualContent] = useState<VisualContent | null>(null)
  const [showVisualContent, setShowVisualContent] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [inputMessage, setInputMessage] = useState('')

  // Get LiveKit token function
  const getLiveKitToken = async (roomName: string, userId: string): Promise<string | null> => {
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
  }

  // Connect to LiveKit room
  useEffect(() => {
    const connectToRoom = async () => {
      try {
        const livekitUrl = process.env.NEXT_PUBLIC_LIVEKIT_URL || 'wss://your-livekit-instance.livekit.cloud'
        const roomName = `clara-study-${userId}`
        
        const token = await getLiveKitToken(roomName, userId)
        
        if (!token) {
          setError('Failed to get LiveKit token. Please check your configuration.')
          return
        }

        // Create room instance
        const room = new Room()
        
        // Connect to room
        await room.connect(livekitUrl, token, {
          autoSubscribe: true,
        })
        
        console.log('Connected to LiveKit room:', roomName)
        setIsConnected(true)
        setMessages(prev => [...prev, "Connected to Clara's voice session!"])
        
        // Listen for participant events (when Clara agent joins)
        room.on(RoomEvent.ParticipantConnected, (participant: Participant) => {
          console.log('Participant connected:', participant.identity)
          if (participant.identity.includes('Clara') || participant.identity.includes('clara')) {
            setMessages(prev => [...prev, "Clara has joined the session and is ready to help!"])
          }
        })
        
        // Listen for data messages from the agent
        room.on(RoomEvent.DataReceived, (payload: Uint8Array, participant?: Participant) => {
          try {
            const data = JSON.parse(new TextDecoder().decode(payload))
            console.log('Received data from agent:', data)
            
            if (data.type === 'response') {
              setMessages(prev => [...prev, `Clara: ${data.text}`])
            } else if (data.type === 'visual_content') {
              setCurrentVisualContent(data.content)
              setShowVisualContent(true)
            }
          } catch (err) {
            console.error('Error parsing agent message:', err)
          }
        })
        
        // Store room instance for cleanup
        return () => {
          room.disconnect()
        }
        
      } catch (err) {
        console.error('Error connecting to LiveKit room:', err)
        setError('Failed to connect to voice session. Please try refreshing the page.')
      }
    }
    
    connectToRoom()
  }, [userId])

  // Send message to agent
  const sendMessage = useCallback((message: string) => {
    if (message.trim()) {
      setMessages(prev => [...prev, `You: ${message}`])
      setInputMessage('')
      
      // In a real implementation, you would send this to the LiveKit room
      // For now, we'll just log it
      console.log('Sending message to agent:', message)
    }
  }, [])

  // Handle visual content close
  const handleVisualContentClose = () => {
    setShowVisualContent(false)
    setCurrentVisualContent(null)
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-6">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-red-800 mb-2">Connection Error</h3>
            <p className="text-red-700 mb-4">{error}</p>
            <Button 
              onClick={() => window.location.reload()}
              className="bg-red-600 hover:bg-red-700"
            >
              Refresh Page
            </Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto p-4">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Main Voice Interface */}
          <div className="lg:col-span-2">
            <Card className="h-full">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <Mic className="h-5 w-5 text-blue-600" />
                    Clara Voice Assistant
                  </CardTitle>
                  <div className="flex items-center gap-2">
                    <Badge variant={isConnected ? "default" : "secondary"}>
                      {isConnected ? "Connected" : "Connecting..."}
                    </Badge>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={onEndSession}
                    >
                      End Session
                    </Button>
                  </div>
                </div>
              </CardHeader>
              
              <CardContent className="space-y-4">
                {/* Voice Controls */}
                <div className="flex items-center justify-center gap-4 p-6 bg-gray-50 rounded-lg">
                  <Button size="lg" className="rounded-full w-16 h-16">
                    <Mic className="h-6 w-6" />
                  </Button>
                  <Button size="lg" variant="outline" className="rounded-full w-16 h-16">
                    <Volume2 className="h-6 w-6" />
                  </Button>
                </div>
                
                {/* Messages */}
                <div className="h-64 overflow-y-auto border rounded-lg p-4 bg-white">
                  {messages.map((message, index) => (
                    <div key={index} className="mb-2 p-2 rounded bg-gray-50">
                      {message}
                    </div>
                  ))}
                </div>
                
                {/* Message Input */}
                <div className="flex gap-2">
                  <Input
                    value={inputMessage}
                    onChange={(e) => setInputMessage(e.target.value)}
                    placeholder="Type a message to Clara..."
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        sendMessage(inputMessage)
                      }
                    }}
                  />
                  <Button onClick={() => sendMessage(inputMessage)}>
                    Send
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
          
          {/* Sidebar */}
          <div className="space-y-4">
            {/* Participants */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  Participants
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex items-center gap-2 p-2 rounded bg-blue-50">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span className="text-sm">You</span>
                  </div>
                  <div className="flex items-center gap-2 p-2 rounded bg-purple-50">
                    <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                    <span className="text-sm">Clara AI</span>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            {/* Visual Content */}
            {showVisualContent && currentVisualContent && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <MessageSquare className="h-4 w-4" />
                    {currentVisualContent.title}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-gray-600 mb-2">
                    {currentVisualContent.description}
                  </p>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleVisualContentClose}
                  >
                    Close
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default function ModalVoiceRoom(props: ModalVoiceRoomProps) {
  return <ModalVoiceRoomContent {...props} />
} 