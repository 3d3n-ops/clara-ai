"use client"

import { useEffect, useState } from "react"
import {
  LiveKitRoom,
  RoomAudioRenderer,
  StartAudio,
  useVoiceAssistant,
  BarVisualizer,
  VoiceAssistantControlBar,
} from "@livekit/components-react"
import "@livekit/components-styles"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Mic, MicOff, Phone, PhoneOff, Volume2, Home, Monitor, MonitorOff } from "lucide-react"
import Link from "next/link"
import MultimodalChat from "./multimodal-chat"

interface LiveKitVoiceRoomProps {
  onEndSession: () => void
  sidebarCollapsed: boolean
  setSidebarCollapsed: (collapsed: boolean) => void
}

function VoiceAssistantDemo({ 
  onEndSession, 
  isScreenSharing, 
  onScreenShareToggle 
}: { 
  onEndSession: () => void
  isScreenSharing: boolean
  onScreenShareToggle: () => void
}) {
  const { state, audioTrack } = useVoiceAssistant()

  return (
    <div className="flex flex-col items-center justify-center min-h-[600px] space-y-8">
      {/* Voice Visualizer */}
      <div className="w-64 h-64 bg-gradient-to-b from-blue-400 to-blue-600 rounded-full flex items-center justify-center shadow-lg relative overflow-hidden">
        {audioTrack && (
          <div className="absolute inset-0 flex items-center justify-center">
            <BarVisualizer 
              state={state} 
              trackRef={audioTrack}
              barCount={50}
              options={{ minHeight: 20, maxHeight: 80 }}
            />
          </div>
        )}
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

      {/* Status */}
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-bold text-gray-900">Clara is {state}</h2>
        <p className="text-gray-600">
          {state === "listening" && "I'm listening to you..."}
          {state === "thinking" && "Let me think about that..."}
          {state === "speaking" && "I'm speaking to you..."}
          
        </p>
      </div>

      {/* Control Bar */}
      <VoiceAssistantControlBar />

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

export default function LiveKitVoiceRoom({ 
  onEndSession, 
  sidebarCollapsed, 
  setSidebarCollapsed 
}: LiveKitVoiceRoomProps) {
  const [token, setToken] = useState("")
  const [connecting, setConnecting] = useState(false)
  const [error, setError] = useState("")
  const [isScreenSharing, setIsScreenSharing] = useState(false)
  const [screenStream, setScreenStream] = useState<MediaStream | null>(null)

  useEffect(() => {
    const getToken = async () => {
      setConnecting(true)
      setError("")
      
      try {
        // Generate a unique room name for this session
        const roomName = `clara-study-${Date.now()}`
        const participantName = `student-${Math.random().toString(36).substr(2, 9)}`
        
        console.log(`[LiveKit] Creating room: ${roomName}`)
        
        // First, ensure the Modal agent is started for this room
        try {
          const modalWebhookUrl = process.env.NEXT_PUBLIC_MODAL_WEBHOOK_URL || 'https://d3n-ops--clara-voice-agent-create-room-and-start-agent.modal.run'
          const modalResponse = await fetch(modalWebhookUrl, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              room_name: roomName
            }),
          })
          
          if (modalResponse.ok) {
            console.log(`[LiveKit] Modal agent started for room: ${roomName}`)
          } else {
            console.warn(`[LiveKit] Modal agent start failed: ${modalResponse.status}`)
            // Don't fail the connection - the webhook might still work
          }
        } catch (modalError) {
          console.warn(`[LiveKit] Modal agent start error:`, modalError)
          // Don't fail the connection - the webhook might still work
        }
        
        // Get the LiveKit token
        const response = await fetch('/api/livekit/token', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            roomName,
            participantName,
            participantMetadata: JSON.stringify({
              type: 'student',
              sessionType: 'study'
            })
          }),
        })

        if (!response.ok) {
          throw new Error(`Failed to get token: ${response.status}`)
        }

        const data = await response.json()
        
        // Ensure token is a string
        const tokenString = typeof data.token === 'string' ? data.token : String(data.token)
        setToken(tokenString)
        
        console.log(`[LiveKit] Token generated for room: ${roomName}`)
        
      } catch (error) {
        console.error('Error getting LiveKit token:', error)
        setError(error instanceof Error ? error.message : 'Failed to connect')
      } finally {
        setConnecting(false)
      }
    }

    getToken()
  }, [])

    const handleScreenShareToggle = async () => {
    if (isScreenSharing) {
      // Stop screen sharing
      if (screenStream) {
        screenStream.getTracks().forEach(track => track.stop())
        setScreenStream(null)
      }
      setIsScreenSharing(false)
      
      // Remove debug video
      const debugVideo = document.querySelector('video[style*="border: 2px solid red"]')
      if (debugVideo) {
        debugVideo.remove()
      }
    } else {
      // Start screen sharing
      try {
        const stream = await navigator.mediaDevices.getDisplayMedia({
          video: { 
            frameRate: { ideal: 3, max: 5 } // Low frame rate for efficiency
          },
          audio: false
        })
        
        setScreenStream(stream)
        setIsScreenSharing(true)

        // Handle when user stops sharing via browser UI
        stream.getVideoTracks()[0].onended = () => {
          setIsScreenSharing(false)
          setScreenStream(null)
          
          // Remove debug video
          const debugVideo = document.querySelector('video[style*="border: 2px solid red"]')
          if (debugVideo) {
            debugVideo.remove()
          }
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
    // Create a debug video element to see what we're capturing
    const debugVideo = document.createElement('video')
    debugVideo.srcObject = stream
    debugVideo.autoplay = true
    debugVideo.muted = true
    debugVideo.style.position = 'fixed'
    debugVideo.style.top = '10px'
    debugVideo.style.right = '10px'
    debugVideo.style.width = '200px'
    debugVideo.style.height = '150px'
    debugVideo.style.border = '2px solid red'
    debugVideo.style.zIndex = '9999'
    debugVideo.style.backgroundColor = 'black'
    document.body.appendChild(debugVideo)
    
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')

    let lastFrameTime = 0
    const frameInterval = 3000 // Process frame every 3 seconds
    let processingFrame = false

    const processFrame = async () => {
      // Check if stream is still active (more reliable than React state)
      const streamActive = stream.getVideoTracks().length > 0 && 
                          stream.getVideoTracks()[0].readyState === 'live'
      
      if (!streamActive || !ctx || processingFrame) {
        if (streamActive) {
          setTimeout(processFrame, 100) // Retry in 100ms
        }
        return
      }

      const now = Date.now()
      if (now - lastFrameTime < frameInterval) {
        setTimeout(processFrame, 100)
        return
      }

      // Check if video has valid dimensions
      if (debugVideo.videoWidth === 0 || debugVideo.videoHeight === 0) {
        setTimeout(processFrame, 100)
        return
      }

      processingFrame = true
      lastFrameTime = now
      
      try {
        // Capture frame with better quality
        canvas.width = Math.min(debugVideo.videoWidth, 1920) // Increased resolution
        canvas.height = Math.min(debugVideo.videoHeight, 1080) // Increased resolution
        
        // Draw the video directly to canvas without scaling
        ctx.drawImage(debugVideo, 0, 0, canvas.width, canvas.height)
        
        // Convert to base64 with higher quality
        const frameData = canvas.toDataURL('image/jpeg', 0.8) // Increased quality
        
        // Send to Gemini for analysis
        await processScreenFrame(frameData)
      } catch (error) {
        console.error('Frame processing error:', error)
      } finally {
        processingFrame = false
      }

      // Schedule next frame
      setTimeout(processFrame, frameInterval)
    }

    // Wait for video to be ready
    debugVideo.addEventListener('loadedmetadata', () => {
      // Wait a bit longer for video to be fully loaded
      setTimeout(() => {
        processFrame()
      }, 2000) // Start processing after 2 seconds
    })

    // Handle video errors
    debugVideo.addEventListener('error', (e: Event) => {
      console.error('Video error:', e)
    })
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
        // Always store the analysis for chat context, regardless of shouldRespond
        if ((window as any).addScreenshotMessage) {
          (window as any).addScreenshotMessage(frameData, data.analysis, data.shouldRespond)
        }
      }
    } catch (error) {
      console.error('Error processing screen frame:', error)
      // Don't throw - just log and continue
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

  if (!token) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">Preparing session...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white">
      <LiveKitRoom
        video={false}
        audio={true}
        token={token}
        serverUrl={process.env.NEXT_PUBLIC_LIVEKIT_URL}
        data-lk-theme="default"
        style={{ height: "100vh" }}
        onDisconnected={onEndSession}
        onError={(error) => {
          console.error('LiveKit room error:', error)
          setError(`Room error: ${error.message}`)
        }}
      >
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
                voiceState="idle"
                className="h-full"
              />
            </div>
          </div>
        </div>

        <RoomAudioRenderer />
        <StartAudio label="Click to enable audio" />
      </LiveKitRoom>
    </div>
  )
}