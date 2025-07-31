"use client"

import React, { useState, useEffect, useCallback, useRef } from 'react'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Progress } from "@/components/ui/progress"
import { Input } from "@/components/ui/input"
import { Home, Folder, Settings, Menu, X, MessageSquare, Monitor, Users, Mic, Volume2, Clock, Trophy, BookOpen, Lightbulb, Send } from "lucide-react"
import Link from "next/link"
import { useUserTracking } from '@/hooks/use-analytics'
import { VoiceVisualContent } from '@/components/voice-visual-content'

interface SimpleVoiceRoomProps {
  onEndSession: () => void
  sidebarCollapsed: boolean
  setSidebarCollapsed: (collapsed: boolean) => void
}

interface SessionSummary {
  keyConcepts: string[]
  confidenceScore: number
  classesCovered: string[]
  topicsCovered: string[]
  summaryText: string
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

interface BackendMessage {
  type: string
  text?: string
  message?: string
  visual_content?: VisualContent
  command_type?: string
}

// Client-side only wrapper to prevent hydration issues
function ClientOnlySimpleVoiceRoom({ 
  onEndSession, 
  sidebarCollapsed, 
  setSidebarCollapsed 
}: SimpleVoiceRoomProps) {
  const [isMounted, setIsMounted] = useState(false)

  useEffect(() => {
    setIsMounted(true)
  }, [])

  if (!isMounted) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading voice session...</p>
        </div>
      </div>
    )
  }

  return <SimpleVoiceRoomContent onEndSession={onEndSession} sidebarCollapsed={sidebarCollapsed} setSidebarCollapsed={setSidebarCollapsed} />
}

function SimpleVoiceRoomContent({ 
  onEndSession, 
  sidebarCollapsed, 
  setSidebarCollapsed 
}: SimpleVoiceRoomProps) {
  const [sessionStartTime, setSessionStartTime] = useState<Date | null>(null)
  const [timeRemaining, setTimeRemaining] = useState(600) // 10 minutes in seconds
  const [sessionStatus, setSessionStatus] = useState<'active' | 'winding-down' | 'completed'>('active')
  const [showCompletionDialog, setShowCompletionDialog] = useState(false)
  const [sessionSummary, setSessionSummary] = useState<SessionSummary | null>(null)
  const [isSessionEnding, setIsSessionEnding] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  // Visual content state
  const [currentVisualContent, setCurrentVisualContent] = useState<VisualContent | null>(null)
  const [visualCommandType, setVisualCommandType] = useState<string>('')
  const [showVisualContent, setShowVisualContent] = useState(false)
  
  // Backend websocket connection
  const [backendConnected, setBackendConnected] = useState(false)
  const [backendMessages, setBackendMessages] = useState<string[]>([])
  const [inputMessage, setInputMessage] = useState('')
  const websocketRef = useRef<WebSocket | null>(null)
  const [userId] = useState(() => 'voice-user-' + Date.now()) // Generate a unique user ID
  
  const { trackUserAction } = useUserTracking()

  // Connect to backend websocket for AI agent communication
  useEffect(() => {
    const connectToBackend = () => {
      try {
        const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'ws://localhost:8765'
        
        const ws = new WebSocket(backendUrl)
        websocketRef.current = ws
        
        ws.onopen = () => {
          console.log('Connected to backend voice websocket')
          setBackendConnected(true)
          setSessionStartTime(new Date())
          
          // Send session start message
          ws.send(JSON.stringify({
            type: 'session_start',
            user_id: userId
          }))
          
          // Track study session start
          trackUserAction('study_session_started', {
            session_type: 'voice_websocket',
            user_id: userId,
          })
        }
        
        ws.onmessage = (event) => {
          try {
            const data: BackendMessage = JSON.parse(event.data)
            console.log('Received message from backend:', data)
            
            if (data.type === 'response') {
              if (data.text) {
                setBackendMessages(prev => [...prev, data.text!])
              }
              
              // Handle visual content
              if (data.visual_content) {
                setCurrentVisualContent(data.visual_content)
                setVisualCommandType(data.command_type || '')
                setShowVisualContent(true)
              }
            } else if (data.type === 'session_started') {
              if (data.message) {
                setBackendMessages(prev => [...prev, data.message!])
              }
            } else if (data.type === 'session_ended') {
              if (data.message) {
                setBackendMessages(prev => [...prev, data.message!])
              }
              handleSessionCompletion()
            }
          } catch (err) {
            console.error('Error parsing websocket message:', err)
          }
        }
        
        ws.onerror = (error) => {
          console.error('WebSocket error:', error)
          setBackendConnected(false)
          setError('Failed to connect to voice agent. Please try again.')
        }
        
        ws.onclose = () => {
          console.log('WebSocket connection closed')
          setBackendConnected(false)
          if (sessionStatus === 'active') {
            setError('Connection to voice agent lost. Please refresh to reconnect.')
          }
        }
        
        return () => {
          if (ws.readyState === WebSocket.OPEN) {
            ws.close()
          }
        }
      } catch (err) {
        console.error('Error connecting to backend websocket:', err)
        setBackendConnected(false)
        setError('Failed to connect to voice agent. Please check your connection.')
      }
    }
    
    connectToBackend()
  }, [userId, trackUserAction])

  // Send message to backend
  const sendMessageToBackend = useCallback((message: string) => {
    if (websocketRef.current && websocketRef.current.readyState === WebSocket.OPEN) {
      websocketRef.current.send(JSON.stringify({
        type: 'text',
        text: message,
        user_id: userId
      }))
      setInputMessage('')
    }
  }, [userId])

  // Timer countdown
  useEffect(() => {
    if (!sessionStartTime) return

    const interval = setInterval(() => {
      setTimeRemaining((prev) => {
        const newTime = prev - 1
        
        // Handle session phases
        if (newTime <= 180 && sessionStatus === 'active') { // 3 minutes remaining
          setSessionStatus('winding-down')
          console.log('Session winding down')
        }
        
        if (newTime <= 0) {
          setSessionStatus('completed')
          clearInterval(interval)
          handleSessionCompletion()
          return 0
        }
        
        return newTime
      })
    }, 1000)

    return () => clearInterval(interval)
  }, [sessionStartTime, sessionStatus])

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = seconds % 60
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`
  }

  const getTimeColor = (seconds: number) => {
    if (seconds <= 60) return 'text-red-500'
    if (seconds <= 180) return 'text-yellow-500'
    return 'text-green-500'
  }

  const handleSessionCompletion = useCallback(async () => {
    setIsSessionEnding(true)
    
    // Generate mock session summary
    const mockSummary: SessionSummary = {
      keyConcepts: ['Voice interaction', 'Study assistance', 'Visual content generation'],
      confidenceScore: 0.85,
      classesCovered: ['General Study', 'Voice AI'],
      topicsCovered: ['Voice commands', 'Visual content', 'Study techniques'],
      summaryText: 'Great session! You successfully used voice commands to generate visual content and interact with Clara. You showed good understanding of how to use voice commands for study assistance.'
    }
    
    setSessionSummary(mockSummary)
    setShowCompletionDialog(true)
    
    // Track study session completion
    trackUserAction('study_session_completed', {
      session_duration: 600 - timeRemaining,
      confidence_score: mockSummary.confidenceScore,
      classes_covered: mockSummary.classesCovered,
      topics_covered: mockSummary.topicsCovered,
      key_concepts: mockSummary.keyConcepts,
    })
    
    // Send session completion to API
    try {
      const sessionData = {
        sessionId: `session-${Date.now()}`,
        duration: 600 - timeRemaining,
        classesCovered: mockSummary.classesCovered,
        topicsCovered: mockSummary.topicsCovered,
        keyConcepts: mockSummary.keyConcepts,
        confidenceScore: mockSummary.confidenceScore,
        summaryText: mockSummary.summaryText
      }
      
      await fetch('/api/study-session/complete', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(sessionData)
      })
    } catch (error) {
      console.error('Failed to save session data:', error)
    }
  }, [timeRemaining, trackUserAction])

  const handleEndSession = () => {
    if (sessionStatus === 'active') {
      setSessionStatus('completed')
      
      // Track early session end
      trackUserAction('study_session_ended_early', {
        session_duration: 600 - timeRemaining,
        session_status: sessionStatus,
      })
      
      handleSessionCompletion()
    } else {
      onEndSession()
    }
  }

  const handleContinueSession = () => {
    setShowCompletionDialog(false)
    onEndSession()
  }

  // Visual content handling functions
  const handleVisualContentClose = () => {
    setShowVisualContent(false)
    setCurrentVisualContent(null)
    setVisualCommandType('')
  }

  const handleVisualContentInteraction = (action: string, data: any) => {
    trackUserAction('visual_content_interaction', {
      action,
      content_type: currentVisualContent?.type,
      data,
    })
  }

  // If there's an error, show error UI
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
    <div className="min-h-screen bg-gray-900 text-white">
      {/* Visual Content Overlay */}
      {showVisualContent && currentVisualContent && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <VoiceVisualContent
              visualContent={currentVisualContent}
              commandType={visualCommandType}
              onClose={handleVisualContentClose}
              onInteract={handleVisualContentInteraction}
            />
          </div>
        </div>
      )}
      
      {/* Main Room Interface */}
      <div className="flex h-screen">
        {/* Main Content Area */}
        <div className="flex-1 flex flex-col">
          {/* Header */}
          <div className="p-4 bg-gray-800 border-b border-gray-700">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <h1 className="text-xl font-semibold">Study Session with Clara</h1>
                <div className="flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full ${
                    sessionStatus === 'active' ? 'bg-green-500' : 
                    sessionStatus === 'winding-down' ? 'bg-yellow-500' : 'bg-red-500'
                  }`} />
                  <span className="text-sm text-gray-300">
                    {sessionStatus === 'active' ? 'Active' : 
                     sessionStatus === 'winding-down' ? 'Winding Down' : 'Completed'}
                  </span>
                </div>
                
                {/* Visual Content Indicator */}
                {currentVisualContent && (
                  <div className="flex items-center gap-2 bg-blue-600 px-3 py-1 rounded-full">
                    <Lightbulb className="w-4 h-4" />
                    <span className="text-sm">Visual Content Available</span>
                  </div>
                )}
              </div>
              
              {/* Timer */}
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4" />
                  <span className={`font-mono text-lg ${getTimeColor(timeRemaining)}`}>
                    {formatTime(timeRemaining)}
                  </span>
                </div>
                
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleEndSession}
                  className="flex items-center gap-2"
                >
                  End Session
                </Button>
              </div>
            </div>
          </div>

          {/* Main Content Area */}
          <div className="flex-1 relative flex items-center justify-center">
            <div className="text-center space-y-8">
              {/* Large Circular Element */}
              <div className="w-48 h-48 bg-gradient-to-b from-blue-400 to-blue-600 rounded-full flex items-center justify-center mx-auto shadow-lg">
                <Mic className="w-16 h-16 text-white" />
              </div>
              
              <div className="space-y-4">
                <h2 className="text-2xl font-bold">Voice Session Active</h2>
                <p className="text-lg text-gray-300 max-w-md mx-auto">
                  Clara is ready to help you study. Type your questions or use voice commands like "create diagram" or "make flashcards".
                </p>
              </div>

              {/* Connection Status */}
              <div className="flex items-center justify-center gap-2">
                <div className={`w-2 h-2 rounded-full ${backendConnected ? 'bg-green-500' : 'bg-red-500'}`} />
                <span className="text-sm text-gray-300">
                  {backendConnected ? 'Connected to Clara' : 'Connecting to Clara...'}
                </span>
              </div>
            </div>
          </div>

          {/* Chat Input */}
          <div className="p-4 bg-gray-800 border-t border-gray-700">
            <div className="flex items-center gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full ${backendConnected ? 'bg-green-500' : 'bg-red-500'}`} />
                  <span className="text-sm text-gray-300">
                    {backendConnected ? 'AI Connected' : 'AI Disconnected'}
                  </span>
                </div>
              </div>
            </div>
            
            {/* Backend Messages */}
            {backendMessages.length > 0 && (
              <div className="flex-1 max-h-20 overflow-y-auto mt-2">
                {backendMessages.slice(-3).map((msg, index) => (
                  <div key={index} className="text-sm text-gray-300 bg-gray-700 p-2 rounded mb-1">
                    {msg}
                  </div>
                ))}
              </div>
            )}
            
            {/* Text Input for Backend */}
            <div className="flex items-center gap-2 mt-2">
              <Input
                type="text"
                placeholder="Type a message to Clara..."
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === 'Enter' && inputMessage.trim()) {
                    sendMessageToBackend(inputMessage.trim())
                  }
                }}
                className="flex-1 bg-gray-700 text-white border-gray-600 focus:border-blue-500"
              />
              <Button
                size="sm"
                onClick={() => {
                  if (inputMessage.trim()) {
                    sendMessageToBackend(inputMessage.trim())
                  }
                }}
                disabled={!backendConnected || !inputMessage.trim()}
                className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600"
              >
                <Send className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Session Completion Dialog */}
      <Dialog open={showCompletionDialog} onOpenChange={setShowCompletionDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-2xl">
              <Trophy className="w-6 h-6 text-yellow-500" />
              Session Complete! 🎉
            </DialogTitle>
            <DialogDescription>
              Great job! Here's what you learned in your study session.
            </DialogDescription>
          </DialogHeader>
          
          {sessionSummary && (
            <div className="space-y-6">
              {/* Summary */}
              <div className="bg-blue-50 p-4 rounded-lg">
                <h3 className="font-semibold text-blue-900 mb-2 flex items-center gap-2">
                  <BookOpen className="w-4 h-4" />
                  Session Summary
                </h3>
                <p className="text-blue-800">{sessionSummary.summaryText}</p>
              </div>

              {/* Key Concepts */}
              <div>
                <h4 className="font-semibold text-gray-900 mb-3">Key Concepts Covered:</h4>
                <div className="flex flex-wrap gap-2">
                  {sessionSummary.keyConcepts.map((concept, index) => (
                    <Badge key={index} variant="secondary" className="bg-green-100 text-green-800">
                      {concept}
                    </Badge>
                  ))}
                </div>
              </div>

              {/* Classes Covered */}
              <div>
                <h4 className="font-semibold text-gray-900 mb-3">Classes Covered:</h4>
                <div className="flex flex-wrap gap-2">
                  {sessionSummary.classesCovered.map((className, index) => (
                    <Badge key={index} variant="outline">
                      {className}
                    </Badge>
                  ))}
                </div>
              </div>

              {/* Confidence Score */}
              <div className="bg-green-50 p-4 rounded-lg">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-green-900">Confidence Score:</span>
                  <span className="text-2xl font-bold text-green-600">
                    {Math.round(sessionSummary.confidenceScore * 100)}%
                  </span>
                </div>
                <Progress 
                  value={sessionSummary.confidenceScore * 100} 
                  className="mt-2 h-2"
                />
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 pt-4">
                <Button 
                  onClick={handleContinueSession}
                  className="flex-1 bg-blue-600 hover:bg-blue-700"
                >
                  Continue to Dashboard
                </Button>
                <Button 
                  variant="outline"
                  onClick={() => setShowCompletionDialog(false)}
                >
                  Stay in Session
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default ClientOnlySimpleVoiceRoom 