"use client"

import React, { useState, useEffect, useCallback, Component, ReactNode } from 'react'
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
import { Track, RoomEvent, Participant } from 'livekit-client'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Progress } from "@/components/ui/progress"
import { Home, Folder, Settings, Menu, X, MessageSquare, Monitor, Users, Mic, Volume2, Clock, Trophy, BookOpen } from "lucide-react"
import Link from "next/link"

interface VoiceAssistantRoomProps {
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

// Error Boundary for LiveKit Components
class LiveKitErrorBoundary extends Component<
  { children: ReactNode; fallback: ReactNode },
  { hasError: boolean }
> {
  constructor(props: { children: ReactNode; fallback: ReactNode }) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('LiveKit Error Boundary caught an error:', error, errorInfo)
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback
    }

    return this.props.children
  }
}

// Client-side only wrapper to prevent hydration issues
function ClientOnlyVoiceAssistantRoom({ 
  onEndSession, 
  sidebarCollapsed, 
  setSidebarCollapsed 
}: VoiceAssistantRoomProps) {
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

  return <VoiceAssistantRoomContent onEndSession={onEndSession} sidebarCollapsed={sidebarCollapsed} setSidebarCollapsed={setSidebarCollapsed} />
}

function VoiceAssistantRoomContent({ 
  onEndSession, 
  sidebarCollapsed, 
  setSidebarCollapsed 
}: VoiceAssistantRoomProps) {
  const [showChat, setShowChat] = useState(false)
  const [showParticipants, setShowParticipants] = useState(false)
  const [sessionStartTime, setSessionStartTime] = useState<Date | null>(null)
  const [timeRemaining, setTimeRemaining] = useState(600) // 10 minutes in seconds
  const [sessionStatus, setSessionStatus] = useState<'active' | 'winding-down' | 'completed'>('active')
  const [showCompletionDialog, setShowCompletionDialog] = useState(false)
  const [sessionSummary, setSessionSummary] = useState<SessionSummary | null>(null)
  const [isSessionEnding, setIsSessionEnding] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  // Wrap LiveKit hooks in try-catch to handle context errors
  let room, localParticipant, participants, tracks
  
  try {
    room = useRoomContext()
    const localParticipantResult = useLocalParticipant()
    localParticipant = localParticipantResult?.localParticipant
    participants = useParticipants()
    
    // Track audio from AI agent
    tracks = useTracks(
      [
        { source: Track.Source.Camera, withPlaceholder: true },
        { source: Track.Source.ScreenShare, withPlaceholder: false },
        { source: Track.Source.Microphone, withPlaceholder: false },
      ],
      { onlySubscribed: false },
    )
  } catch (err) {
    console.error('LiveKit context error:', err)
    setError('Failed to initialize voice session. Please try refreshing the page.')
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

  // If LiveKit context is not available, show loading
  if (!room || !localParticipant || !participants || !tracks) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Initializing voice session...</p>
        </div>
      </div>
    )
  }

  const aiParticipants = participants.filter(p => 
    p.identity.includes('assistant') || p.identity.includes('agent') || p.identity.includes('clara')
  )
  
  const humanParticipants = participants.filter(p => 
    !p.identity.includes('assistant') && !p.identity.includes('agent') && !p.identity.includes('clara')
  )

  // Initialize session timer when AI joins
  useEffect(() => {
    if (aiParticipants.length > 0 && !sessionStartTime) {
      setSessionStartTime(new Date())
      console.log('Study session started!')
    }
  }, [aiParticipants.length, sessionStartTime])

  // Timer countdown
  useEffect(() => {
    if (!sessionStartTime) return

    const interval = setInterval(() => {
      setTimeRemaining((prev) => {
        const newTime = prev - 1
        
        // Handle session phases
        if (newTime <= 180 && sessionStatus === 'active') { // 3 minutes remaining
          setSessionStatus('winding-down')
          console.log('Session winding down - AI should start wrapping up')
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
    
    // Generate mock session summary (in real app, this would come from AI)
    const mockSummary: SessionSummary = {
      keyConcepts: ['Algebraic equations', 'Linear functions', 'Graph interpretation'],
      confidenceScore: 0.85,
      classesCovered: ['Mathematics', 'Algebra'],
      topicsCovered: ['Linear equations', 'Function graphs', 'Problem solving'],
      summaryText: 'Great session! You covered algebraic equations and linear functions. You showed strong understanding of graphing and solving equations. Keep practicing with similar problems to reinforce these concepts.'
    }
    
    setSessionSummary(mockSummary)
    setShowCompletionDialog(true)
    
    // Update learning stats
    updateLearningStats()
    
    // Send session completion to API
    try {
      const sessionData = {
        sessionId: `session-${Date.now()}`,
        duration: 600 - timeRemaining, // Duration in seconds
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
  }, [timeRemaining])

  const updateLearningStats = () => {
    const currentStats = JSON.parse(localStorage.getItem('learningStats') || '{}')
    const newStats = {
      ...currentStats,
      totalSessions: (currentStats.totalSessions || 0) + 1,
      lastStudyDate: new Date().toDateString()
    }
    localStorage.setItem('learningStats', JSON.stringify(newStats))
  }

  const handleEndSession = () => {
    if (sessionStatus === 'active') {
      setSessionStatus('completed')
      handleSessionCompletion()
    } else {
      onEndSession()
    }
  }

  const handleContinueSession = () => {
    setShowCompletionDialog(false)
    onEndSession()
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <LiveKitErrorBoundary 
        fallback={
          <div className="min-h-screen bg-gray-100 flex items-center justify-center">
            <div className="text-center max-w-md mx-auto p-6">
              <div className="bg-red-50 border border-red-200 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-red-800 mb-2">Connection Error</h3>
                <p className="text-red-700 mb-4">Failed to initialize voice session. Please try refreshing the page.</p>
                <Button 
                  onClick={() => window.location.reload()}
                  className="bg-red-600 hover:bg-red-700"
                >
                  Refresh Page
                </Button>
              </div>
            </div>
          </div>
        }
      >
        <>
          {/* Room Audio Renderer */}
          <RoomAudioRenderer />
          
          {/* Connection State Toast */}
          <ConnectionStateToast />
          
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
                      onClick={() => setShowChat(!showChat)}
                      className="flex items-center gap-2"
                    >
                      <MessageSquare className="w-4 h-4" />
                      {showChat ? 'Hide Chat' : 'Show Chat'}
                    </Button>
                    
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setShowParticipants(!showParticipants)}
                      className="flex items-center gap-2"
                    >
                      <Users className="w-4 h-4" />
                      {showParticipants ? 'Hide Participants' : 'Show Participants'}
                    </Button>
                  </div>
                </div>
              </div>

              {/* Video/Audio Area */}
              <div className="flex-1 relative">
                <div className="absolute inset-0 flex items-center justify-center">
                  {tracks.length > 0 && (
                    <GridLayout tracks={tracks} style={{ height: 'calc(100vh - 400px)' }}>
                      <LiveKitErrorBoundary 
                        fallback={
                          <div className="flex items-center justify-center h-full">
                            <div className="text-center">
                              <div className="w-16 h-16 bg-gray-200 rounded-full mx-auto mb-4 flex items-center justify-center">
                                <Users className="w-8 h-8 text-gray-400" />
                              </div>
                              <p className="text-gray-600">Waiting for participants...</p>
                            </div>
                          </div>
                        }
                      >
                        <ParticipantTile />
                      </LiveKitErrorBoundary>
                    </GridLayout>
                  )}
                </div>
              </div>

              {/* Control Bar */}
              <div className="p-4 bg-gray-800">
                <LiveKitErrorBoundary 
                  fallback={
                    <div className="flex items-center justify-center gap-4 p-4">
                      <Button 
                        variant="outline" 
                        onClick={() => setShowChat(!showChat)}
                        className="flex items-center gap-2"
                      >
                        <MessageSquare className="w-4 h-4" />
                        {showChat ? 'Hide Chat' : 'Show Chat'}
                      </Button>
                      <Button 
                        variant="outline" 
                        onClick={() => setShowParticipants(!showParticipants)}
                        className="flex items-center gap-2"
                      >
                        <Users className="w-4 h-4" />
                        {showParticipants ? 'Hide Participants' : 'Show Participants'}
                      </Button>
                      <Button 
                        variant="destructive" 
                        onClick={handleEndSession}
                        className="flex items-center gap-2"
                      >
                        Leave Session
                      </Button>
                    </div>
                  }
                >
                  <ControlBar 
                    variation="verbose"
                    controls={{
                      microphone: true,
                      camera: false,
                      chat: true,
                      screenShare: true,
                      leave: true,
                    }}
                  />
                </LiveKitErrorBoundary>
              </div>
            </div>

            {/* Chat Sidebar */}
            {showChat && (
              <div className="w-80 bg-white border-l border-gray-200 flex flex-col">
                <div className="p-4 border-b border-gray-200">
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold text-gray-900">Chat</h3>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowChat(false)}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
                <div className="flex-1">
                  <LiveKitErrorBoundary 
                    fallback={
                      <div className="flex items-center justify-center h-full">
                        <div className="text-center">
                          <MessageSquare className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                          <p className="text-gray-600">Chat not available</p>
                        </div>
                      </div>
                    }
                  >
                    <Chat style={{ height: '100%' }} />
                  </LiveKitErrorBoundary>
                </div>
              </div>
            )}

            {/* Participants Sidebar */}
            {showParticipants && (
              <div className="w-64 bg-white border-l border-gray-200">
                <div className="p-4 border-b border-gray-200">
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold text-gray-900">Participants</h3>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowParticipants(false)}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
                <div className="p-4 space-y-2">
                  {participants.map((participant) => (
                    <div
                      key={participant.identity}
                      className="flex items-center gap-3 p-2 rounded-lg bg-gray-50"
                    >
                      <div className={`w-2 h-2 rounded-full ${
                        participant.identity.includes('clara') || participant.identity.includes('assistant') 
                          ? 'bg-blue-500' 
                          : 'bg-green-500'
                      }`} />
                      <span className="text-sm font-medium">
                        {participant.identity.includes('clara') || participant.identity.includes('assistant') 
                          ? 'Clara (AI Assistant)' 
                          : participant.identity}
                      </span>
                      {participant === localParticipant && (
                        <Badge variant="secondary" className="text-xs">You</Badge>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </>
      </LiveKitErrorBoundary>

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

export default ClientOnlyVoiceAssistantRoom 