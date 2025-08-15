"use client"

import React, { useState, useEffect, useCallback } from 'react'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Mic, Volume2, MessageSquare, Users, Play, Square, Brain, FileText, BarChart3 } from "lucide-react"
import { useClaraVoiceSession, VisualContent } from "@/hooks/use-clara-voice-session"

interface ModalVoiceRoomProps {
  onEndSession: () => void
}

function ModalVoiceRoomContent({ onEndSession }: ModalVoiceRoomProps) {
  const [userId] = useState(() => 'user-' + Date.now())
  const [inputMessage, setInputMessage] = useState('')
  const [isMicrophoneEnabled, setIsMicrophoneEnabled] = useState(false)
  const [isListening, setIsListening] = useState(false)

  // Use the new Clara voice session hook
  const {
    status,
    messages,
    currentVisualContent,
    showVisualContent,
    startSession,
    endSession,
    sendTextMessage,
    requestVisualContent,
    enableMicrophone,
    disableMicrophone,
    setShowVisualContent,
    setCurrentVisualContent
  } = useClaraVoiceSession({
    userId,
    wsUrl: process.env.NEXT_PUBLIC_LIVEKIT_URL
  })

  // Handle session start
  const handleStartSession = async () => {
    const result = await startSession()
    if (result.success) {
      console.log('Clara session started successfully')
    } else {
      console.error('Failed to start session:', result.error)
    }
  }

  // Handle session end
  const handleEndSession = async () => {
    await endSession()
    onEndSession()
  }

  // Handle microphone toggle
  const handleMicrophoneToggle = async () => {
    if (!isMicrophoneEnabled) {
      try {
        await enableMicrophone()
        setIsMicrophoneEnabled(true)
      } catch (error) {
        console.error('Failed to enable microphone:', error)
        // Don't update state if it failed
      }
    } else {
      try {
        await disableMicrophone()
        setIsMicrophoneEnabled(false)
      } catch (error) {
        console.error('Failed to disable microphone:', error)
      }
    }
  }

  // Handle text message send
  const handleSendMessage = useCallback((message: string) => {
    if (message.trim()) {
      sendTextMessage(message)
      setInputMessage('')
    }
  }, [sendTextMessage])

  // Handle visual content requests
  const handleVisualContentRequest = (type: 'diagram' | 'flashcard' | 'quiz' | 'mindmap') => {
    const topics = {
      diagram: 'photosynthesis',
      flashcard: 'math formulas',
      quiz: 'biology concepts',
      mindmap: 'chemistry topics'
    }
    
    requestVisualContent(`Create a ${type}`, topics[type])
  }

  // Handle visual content close
  const handleVisualContentClose = () => {
    setShowVisualContent(false)
    setCurrentVisualContent(null)
  }

  // Show error if connection failed
  if (status.error) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-6">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-red-800 mb-2">Connection Error</h3>
            <p className="text-red-700 mb-4">{status.error}</p>
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
                    <Badge variant={status.isConnected ? "default" : "secondary"}>
                      {status.isConnected ? "Connected" : "Connecting..."}
                    </Badge>
                    {status.agentConnected && (
                      <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                        Clara Ready
                      </Badge>
                    )}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleEndSession}
                    >
                      End Session
                    </Button>
                  </div>
                </div>
              </CardHeader>
              
              <CardContent className="space-y-4">
                {/* Connection Status */}
                {!status.isConnected && (
                  <div className="text-center p-6 bg-blue-50 rounded-lg border border-blue-200">
                    <p className="text-blue-700 mb-4">Ready to start your study session with Clara?</p>
                    <Button onClick={handleStartSession} className="bg-blue-600 hover:bg-blue-700">
                      Start Session
                    </Button>
                  </div>
                )}

                {/* Voice Controls */}
                {status.isConnected && (
                  <div className="flex items-center justify-center gap-4 p-6 bg-gray-50 rounded-lg">
                    <div className="text-center">
                      <Button 
                        size="lg" 
                        className={`rounded-full w-16 h-16 ${
                          isMicrophoneEnabled ? 'bg-green-600 hover:bg-green-700' : 'bg-gray-400 hover:bg-gray-500'
                        }`}
                        onClick={handleMicrophoneToggle}
                      >
                        <Mic className="h-6 w-6" />
                      </Button>
                      <p className="text-sm mt-2 text-gray-600">
                        {isMicrophoneEnabled ? 'Microphone On' : 'Microphone Off'}
                      </p>
                      {status.isSpeaking && isMicrophoneEnabled && (
                        <div className="flex items-center justify-center mt-1">
                          <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
                          <span className="text-xs text-red-600 ml-1">Speaking</span>
                        </div>
                      )}
                    </div>
                    <Button size="lg" variant="outline" className="rounded-full w-16 h-16">
                      <Volume2 className="h-6 w-6" />
                    </Button>
                  </div>
                )}

                {/* Microphone Permission Notice */}
                {status.isConnected && !isMicrophoneEnabled && (
                  <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <p className="text-yellow-800 text-sm">
                      💡 <strong>Tip:</strong> Enable your microphone to talk to Clara. Click the microphone button above to start.
                    </p>
                  </div>
                )}
                
                {/* Messages */}
                <div className="h-64 overflow-y-auto border rounded-lg p-4 bg-white">
                  {messages.length === 0 ? (
                    <div className="text-center text-gray-500 py-8">
                      {status.isConnected ? "Start talking to Clara or send a message below" : "Connect to start your session"}
                    </div>
                  ) : (
                    messages.map((message, index) => (
                      <div key={index} className="mb-2 p-2 rounded bg-gray-50">
                        {message}
                      </div>
                    ))
                  )}
                </div>
                
                {/* Message Input */}
                {status.isConnected && (
                  <div className="flex gap-2">
                    <Input
                      value={inputMessage}
                      onChange={(e) => setInputMessage(e.target.value)}
                      placeholder="Type a message to Clara..."
                      onKeyPress={(e) => {
                        if (e.key === 'Enter') {
                          handleSendMessage(inputMessage)
                        }
                      }}
                    />
                    <Button onClick={() => handleSendMessage(inputMessage)}>
                      Send
                    </Button>
                  </div>
                )}

                {/* Visual Content Quick Actions */}
                {status.isConnected && (
                  <div className="grid grid-cols-2 gap-2">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => handleVisualContentRequest('diagram')}
                      className="flex items-center gap-2"
                    >
                      <BarChart3 className="h-4 w-4" />
                      Create Diagram
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => handleVisualContentRequest('flashcard')}
                      className="flex items-center gap-2"
                    >
                      <FileText className="h-4 w-4" />
                      Create Flashcards
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => handleVisualContentRequest('quiz')}
                      className="flex items-center gap-2"
                    >
                      <Brain className="h-4 w-4" />
                      Create Quiz
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => handleVisualContentRequest('mindmap')}
                      className="flex items-center gap-2"
                    >
                      <BarChart3 className="h-4 w-4" />
                      Create Mindmap
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
          
          {/* Sidebar */}
          <div className="space-y-4">
            {/* Session Info */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MessageSquare className="h-4 w-4" />
                  Session Info
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="text-sm">
                  <p><strong>Room:</strong> {status.roomName || 'Not connected'}</p>
                  <p><strong>Status:</strong> {status.isConnected ? 'Connected' : 'Disconnected'}</p>
                  <p><strong>Agent:</strong> {status.agentConnected ? 'Clara Ready' : 'Waiting...'}</p>
                </div>
              </CardContent>
            </Card>

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
                    <div className={`w-2 h-2 rounded-full ${status.agentConnected ? 'bg-purple-500' : 'bg-gray-300'}`}></div>
                    <span className="text-sm">Clara AI</span>
                    {status.agentConnected && <Badge variant="outline">Ready</Badge>}
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