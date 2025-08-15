"use client"

import { useEffect, useState, useCallback, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Mic, MicOff, Phone, PhoneOff, Volume2, Home, Monitor, MonitorOff } from "lucide-react"
import Link from "next/link"
import MultimodalChat from "./multimodal-chat"
import { createVapi } from '@/lib/vapi-mock'
import { VAPI_CONFIG } from '@/lib/vapi-config'

interface VapiVoiceRoomProps {
  onEndSession: () => void
  sidebarCollapsed: boolean
  setSidebarCollapsed: (collapsed: boolean) => void
}

interface VoiceState {
  isConnected: boolean
  isRecording: boolean
  isProcessing: boolean
  error: string | null
  messages: string[]
  visualContent: any | null
}

function VoiceVisualizer({ state }: { state: string }) {
  return (
    <div className="w-64 h-64 bg-gradient-to-b from-blue-400 to-blue-600 rounded-full flex items-center justify-center shadow-lg relative overflow-hidden">
      <div className="z-10">
        {state === "listening" ? (
          <Mic className="w-16 h-16 text-white animate-pulse" />
        ) : state === "thinking" ? (
          <div className="w-16 h-16 border-4 border-white border-t-transparent rounded-full animate-spin" />
        ) : state === "speaking" ? (
          <Volume2 className="w-16 h-16 text-white animate-bounce" />
        ) : (
          <Mic className="w-16 h-16 text-white" />
        )}
      </div>
    </div>
  )
}

function VoiceAssistantDemo({ 
  onEndSession, 
  isScreenSharing, 
  onScreenShareToggle,
  voiceState,
  onToggleRecording,
  isConnected
}: { 
  onEndSession: () => void
  isScreenSharing: boolean
  onScreenShareToggle: () => void
  voiceState: string
  onToggleRecording: () => void
  isConnected: boolean
}) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[600px] space-y-8">
      {/* Voice Visualizer */}
      <VoiceVisualizer state={voiceState} />

      {/* Status */}
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-bold text-gray-900">
          Clara is {voiceState}
        </h2>
        <p className="text-gray-600">
          {voiceState === "listening" && "I'm listening to you..."}
          {voiceState === "thinking" && "Let me think about that..."}
          {voiceState === "speaking" && "I'm speaking to you..."}
          {voiceState === "idle" && "Ready to help with your studies"}
        </p>
      </div>

      {/* Control Buttons */}
      <div className="flex space-x-4">
        <Button
          onClick={onToggleRecording}
          variant={voiceState === "listening" ? "destructive" : "default"}
          className="px-6 py-2 rounded-lg"
          disabled={!isConnected}
        >
          {voiceState === "listening" ? (
            <>
              <MicOff className="w-4 h-4 mr-2" />
              Stop Listening
            </>
          ) : (
            <>
              <Mic className="w-4 h-4 mr-2" />
              Start Listening
            </>
          )}
        </Button>

        <Button
          onClick={onScreenShareToggle}
          variant={isScreenSharing ? "destructive" : "outline"}
          className="px-6 py-2 rounded-lg"
        >
          {isScreenSharing ? (
            <>
              <MonitorOff className="w-4 h-4 mr-2" />
              Stop Sharing
            </>
          ) : (
            <>
              <Monitor className="w-4 h-4 mr-2" />
              Share Screen
            </>
          )}
        </Button>
      </div>

      {/* End Session Button */}
      <Button
        onClick={onEndSession}
        variant="destructive"
        className="px-6 py-2 rounded-lg"
      >
        <PhoneOff className="w-4 h-4 mr-2" />
        End Session
      </Button>
    </div>
  )
}

export default function VapiVoiceRoom({ 
  onEndSession, 
  sidebarCollapsed, 
  setSidebarCollapsed 
}: VapiVoiceRoomProps) {
  const [voiceState, setVoiceState] = useState<VoiceState>({
    isConnected: false,
    isRecording: false,
    isProcessing: false,
    error: null,
    messages: [],
    visualContent: null
  })
  const [isScreenSharing, setIsScreenSharing] = useState(false)
  const [screenStream, setScreenStream] = useState<MediaStream | null>(null)
  const [connecting, setConnecting] = useState(false)
  const [error, setError] = useState("")
  
  const vapiRef = useRef<any>(null)
  const sessionRef = useRef<any>(null)

  // Initialize Vapi connection
  useEffect(() => {
    const initializeVapi = async () => {
      setConnecting(true)
      setError("")
      
      try {
        // Generate a unique room name for this session
        const roomName = `clara-study-${Date.now()}`
        const userId = `student-${Math.random().toString(36).substr(2, 9)}`
        
        console.log(`[Vapi] Creating session: ${roomName}`)
        
        // Get Vapi token
        const response = await fetch('/api/vapi/token', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            roomName,
            userId
          }),
        })

        if (!response.ok) {
          throw new Error(`Failed to get token: ${response.status}`)
        }

        const data = await response.json()
        
        console.log('[Vapi] Initializing with:', {
          publicKey: data.publicKey ? 'SET' : 'NOT SET',
          agentId: data.agentId
        })

        // Initialize Vapi with assistant ID using the createVapi function
        const vapi = createVapi({
          publicKey: data.publicKey,
          assistantId: data.agentId
        })

        console.log('[Vapi] Vapi instance created successfully')

        // Set up event listeners
        vapi.on('call-start', () => {
          console.log('[Vapi] Call started')
          setVoiceState(prev => ({ 
            ...prev, 
            isConnected: true,
            messages: [...prev.messages, "Connected to Clara's voice session!"]
          }))
        })

        vapi.on('call-end', () => {
          console.log('[Vapi] Call ended')
          setVoiceState(prev => ({ 
            ...prev, 
            isConnected: false,
            isRecording: false,
            isProcessing: false
          }))
          onEndSession()
        })

        vapi.on('speech-start', () => {
          console.log('[Vapi] Speech started')
          setVoiceState(prev => ({ 
            ...prev, 
            isRecording: true,
            isProcessing: false
          }))
        })

        vapi.on('speech-end', () => {
          console.log('[Vapi] Speech ended')
          setVoiceState(prev => ({ 
            ...prev, 
            isRecording: false,
            isProcessing: true
          }))
        })

        vapi.on('message', (message: any) => {
          console.log('[Vapi] Message received:', message)
          if (message.role === 'assistant') {
            setVoiceState(prev => ({ 
              ...prev, 
              messages: [...prev.messages, `Clara: ${message.content}`],
              isProcessing: false
            }))
          }
        })

        vapi.on('error', (error: any) => {
          console.error('[Vapi] Error:', error)
          setError(`Vapi error: ${error.message}`)
        })

        vapiRef.current = vapi
        setVoiceState(prev => ({ ...prev, isConnected: true }))
        
      } catch (error) {
        console.error('Error initializing Vapi:', error)
        setError(error instanceof Error ? error.message : 'Failed to connect')
      } finally {
        setConnecting(false)
      }
    }

    initializeVapi()
  }, [onEndSession])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (vapiRef.current) {
        try {
          vapiRef.current.stop()
        } catch (error) {
          console.error('Error stopping Vapi:', error)
        }
      }
    }
  }, [])

  const toggleRecording = useCallback(() => {
    if (!vapiRef.current) return

    if (voiceState.isRecording) {
      // Stop recording
      try {
        vapiRef.current.stop()
        setVoiceState(prev => ({ 
          ...prev, 
          isRecording: false,
          isProcessing: false
        }))
      } catch (error) {
        console.error('Error stopping recording:', error)
      }
    } else {
      // Start recording
      try {
        vapiRef.current.start()
        setVoiceState(prev => ({ 
          ...prev, 
          isRecording: true,
          isProcessing: false
        }))
      } catch (error) {
        console.error('Error starting recording:', error)
        setError('Failed to start recording')
      }
    }
  }, [voiceState.isRecording])

  const handleScreenShareToggle = async () => {
    if (isScreenSharing) {
      // Stop screen sharing
      if (screenStream) {
        screenStream.getTracks().forEach(track => track.stop())
        setScreenStream(null)
      }
      setIsScreenSharing(false)
    } else {
      // Start screen sharing
      try {
        const stream = await navigator.mediaDevices.getDisplayMedia({
          video: { 
            frameRate: { ideal: 3, max: 5 }
          },
          audio: false
        })
        
        setScreenStream(stream)
        setIsScreenSharing(true)

        // Handle when user stops sharing via browser UI
        stream.getVideoTracks()[0].onended = () => {
          setIsScreenSharing(false)
          setScreenStream(null)
        }

        // Start processing screen frames
        startScreenProcessing(stream)
      } catch (error) {
        console.error('Error starting screen share:', error)
        setError('Failed to start screen sharing. Please try again.')
      }
    }
  }

  const startScreenProcessing = (stream: MediaStream) => {
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')

    let lastFrameTime = 0
    const frameInterval = 3000 // Process frame every 3 seconds
    let processingFrame = false

    const processFrame = async () => {
      const streamActive = stream.getVideoTracks().length > 0 && 
                          stream.getVideoTracks()[0].readyState === 'live'
      
      if (!streamActive || !ctx || processingFrame) {
        if (streamActive) {
          setTimeout(processFrame, 100)
        }
        return
      }

      const now = Date.now()
      if (now - lastFrameTime < frameInterval) {
        setTimeout(processFrame, 100)
        return
      }

      processingFrame = true
      lastFrameTime = now
      
      try {
        // Capture frame
        canvas.width = 1920
        canvas.height = 1080
        
        // Convert to base64
        const frameData = canvas.toDataURL('image/jpeg', 0.8)
        
        // Send to Gemini for analysis
        await processScreenFrame(frameData)
      } catch (error) {
        console.error('Frame processing error:', error)
      } finally {
        processingFrame = false
      }

      setTimeout(processFrame, frameInterval)
    }

    processFrame()
  }

  const processScreenFrame = async (frameData: string) => {
    try {
      const response = await fetch('/api/multimodal/screen-analysis', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          image: frameData,
          context: 'study_session'
        }),
      })

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }

      const data = await response.json()
      
      if (data.analysis) {
        // Store the analysis for chat context
        if ((window as any).addScreenshotMessage) {
          (window as any).addScreenshotMessage(frameData, data.analysis, data.shouldRespond)
        }
      }
    } catch (error) {
      console.error('Error processing screen frame:', error)
    }
  }

  if (connecting) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="text-gray-600">Connecting to Clara...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="p-6 text-center space-y-4">
            <div className="text-red-500 text-xl">⚠️</div>
            <h3 className="text-lg font-medium text-gray-900">Connection Error</h3>
            <p className="text-gray-600">{error}</p>
            <Button onClick={onEndSession} variant="outline">
              <Home className="w-4 h-4 mr-2" />
              Back to Home
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white">
      <div className="flex h-full">
        {/* Sidebar */}
        <div className={`${sidebarCollapsed ? "w-16" : "w-64"} bg-white border-r border-gray-200 transition-all duration-300 flex flex-col`}>
          <div className="p-4">
            <Link href="/dashboard">
              <Button variant="ghost" size="sm" className="w-full justify-start">
                <Home className="w-4 h-4 mr-2" />
                {!sidebarCollapsed && "Back to Home"}
              </Button>
            </Link>
          </div>
        </div>

        {/* Main Content Area */}
        <div className="flex-1 flex">
          {/* Voice Interface */}
          <div className="flex-1 flex flex-col">
            <div className="flex-1 flex items-center justify-center p-8">
              <VoiceAssistantDemo 
                onEndSession={onEndSession}
                isScreenSharing={isScreenSharing}
                onScreenShareToggle={handleScreenShareToggle}
                voiceState={voiceState.isRecording ? "listening" : voiceState.isProcessing ? "thinking" : "idle"}
                onToggleRecording={toggleRecording}
                isConnected={voiceState.isConnected}
              />
            </div>
            
            {/* Screen Share Preview */}
            {isScreenSharing && screenStream && (
              <div className="p-4 border-t bg-gray-50">
                <div className="text-center">
                  <h4 className="text-sm font-medium text-gray-700 mb-2">Screen Being Shared</h4>
                  <video
                    ref={(video) => {
                      if (video && screenStream) {
                        video.srcObject = screenStream
                      }
                    }}
                    autoPlay
                    muted
                    className="max-w-full h-32 object-contain bg-black rounded"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Chat Interface */}
          <div className="w-96 border-l border-gray-200">
            <MultimodalChat
              isVoiceActive={true}
              onVoiceToggle={() => {}} // Handled by parent
              isScreenSharing={isScreenSharing}
              onScreenShareToggle={handleScreenShareToggle}
              voiceState={voiceState.isRecording ? "listening" : voiceState.isProcessing ? "thinking" : "idle"}
              className="h-full"
            />
          </div>
        </div>
      </div>
    </div>
  )
} 