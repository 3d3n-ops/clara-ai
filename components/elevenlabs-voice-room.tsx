"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Home, Mic, MicOff, Volume2, MessageSquare, Users, X, Menu } from "lucide-react"
import Link from "next/link"
import MultimodalChat from "./multimodal-chat"

interface ElevenLabsVoiceRoomProps {
  onEndSession: () => void
  sidebarCollapsed: boolean
  setSidebarCollapsed: (collapsed: boolean) => void
}

function ElevenLabsVoiceRoomContent({ 
  onEndSession, 
  sidebarCollapsed, 
  setSidebarCollapsed 
}: ElevenLabsVoiceRoomProps) {
  const [isConnected, setIsConnected] = useState(false)
  const [isRecording, setIsRecording] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const [isScreenSharing, setIsScreenSharing] = useState(false)
  const [screenStream, setScreenStream] = useState<MediaStream | null>(null)
  const [messages, setMessages] = useState<Array<{id: string, type: 'user' | 'assistant', content: string}>>([])

  useEffect(() => {
    // Set connected after a short delay to simulate connection
    const timer = setTimeout(() => {
      setIsConnected(true)
    }, 1000)

    return () => clearTimeout(timer)
  }, [])

  const handleVoiceToggle = async () => {
    if (isRecording) {
      // Stop recording
      setIsRecording(false)
      setIsProcessing(true)
      
      // Simulate processing time
      setTimeout(() => {
        setIsProcessing(false)
        // Add a sample response
        const assistantMessage = {
          id: Date.now().toString(),
          type: 'assistant' as const,
          content: "I heard you! I'm here to help with your studies. What would you like to work on?"
        }
        setMessages(prev => [...prev, assistantMessage])
      }, 2000)
    } else {
      // Start recording
      setIsRecording(true)
      setIsProcessing(false)
    }
  }

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
      // Check if stream is still active
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
        canvas.width = Math.min(debugVideo.videoWidth, 1920)
        canvas.height = Math.min(debugVideo.videoHeight, 1080)
        
        // Draw the video directly to canvas without scaling
        ctx.drawImage(debugVideo, 0, 0, canvas.width, canvas.height)
        
        // Convert to base64 with higher quality
        const frameData = canvas.toDataURL('image/jpeg', 0.8)
        
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
              <div className="flex flex-col items-center justify-center min-h-[600px] space-y-8">
                {/* Voice Visualizer */}
                <div className="w-64 h-64 bg-gradient-to-b from-blue-400 to-blue-600 rounded-full flex items-center justify-center shadow-lg relative overflow-hidden">
                  <div className="z-10">
                    {isRecording ? (
                      <MicOff className="w-16 h-16 text-white animate-pulse" />
                    ) : isProcessing ? (
                      <div className="w-16 h-16 border-4 border-white border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <Mic className="w-16 h-16 text-white" />
                    )}
                  </div>
                </div>

                {/* Status */}
                <div className="text-center space-y-2">
                  <h2 className="text-2xl font-bold text-gray-900">
                    {isRecording ? "Listening..." : isProcessing ? "Processing..." : "Clara is ready"}
                  </h2>
                  <p className="text-gray-600">
                    {isRecording 
                      ? "I'm listening to you..."
                      : isProcessing
                      ? "Processing your request..."
                      : "Click the microphone to start talking"
                    }
                  </p>
                </div>

                {/* Voice Control Button */}
                <Button
                  onClick={handleVoiceToggle}
                  size="lg"
                  className={`rounded-full w-20 h-20 transition-all duration-300 ${
                    isRecording 
                      ? 'bg-red-500 hover:bg-red-600 animate-pulse' 
                      : isProcessing
                      ? 'bg-yellow-500 hover:bg-yellow-600'
                      : 'bg-blue-600 hover:bg-blue-700'
                  }`}
                  disabled={isProcessing}
                >
                  {isRecording ? (
                    <MicOff className="w-8 h-8 text-white" />
                  ) : isProcessing ? (
                    <div className="w-8 h-8 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <Mic className="w-8 h-8 text-white" />
                  )}
                </Button>

                {/* End Session Button */}
                <Button
                  onClick={onEndSession}
                  variant="destructive"
                  className="px-6 py-2 rounded-lg"
                >
                  End Session
                </Button>
              </div>
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
    </div>
  )
}

export default function ElevenLabsVoiceRoom(props: ElevenLabsVoiceRoomProps) {
  return <ElevenLabsVoiceRoomContent {...props} />
} 