"use client"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Home, Settings, Send, GripVertical } from "lucide-react"
import Link from "next/link"
import {
  LiveKitRoom,
  AudioTrack,
  ConnectionState,
  RoomAudioRenderer,
  TrackToggle,
  useConnectionState,
  useLocalParticipant,
  useTracks,
} from "@livekit/components-react"
import { Track } from "livekit-client"
import "@livekit/components-styles"
import { useUser } from "@clerk/nextjs"

function TutorSessionContent() {
  const [message, setMessage] = useState("")
  const [sessionFiles, setSessionFiles] = useState<any[]>([])
  const [isLoaded, setIsLoaded] = useState(false)
  const [sidebarWidth, setSidebarWidth] = useState(256)
  const [chatPaneWidth, setChatPaneWidth] = useState(33.33)
  const [isDraggingSidebar, setIsDraggingSidebar] = useState(false)
  const [isDraggingChat, setIsDraggingChat] = useState(false)

  const sidebarRef = useRef<HTMLDivElement>(null)
  const chatPaneRef = useRef<HTMLDivElement>(null)
  const connectionState = useConnectionState()
  const { localParticipant } = useLocalParticipant()

  // Get audio tracks for visualization
  const tracks = useTracks([{ source: Track.Source.Microphone, withPlaceholder: true }])

  useEffect(() => {
    const files = localStorage.getItem("sessionFiles")
    if (files) {
      setSessionFiles(JSON.parse(files))
    }
    setTimeout(() => setIsLoaded(true), 100)
  }, [])

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (isDraggingSidebar) {
        const newWidth = Math.max(200, Math.min(400, e.clientX))
        setSidebarWidth(newWidth)
      }
      if (isDraggingChat) {
        const containerWidth = window.innerWidth - sidebarWidth
        const newChatWidth = Math.max(25, Math.min(60, ((e.clientX - sidebarWidth) / containerWidth) * 100))
        setChatPaneWidth(newChatWidth)
      }
    }

    const handleMouseUp = () => {
      setIsDraggingSidebar(false)
      setIsDraggingChat(false)
    }

    if (isDraggingSidebar || isDraggingChat) {
      document.addEventListener("mousemove", handleMouseMove)
      document.addEventListener("mouseup", handleMouseUp)
    }

    return () => {
      document.removeEventListener("mousemove", handleMouseMove)
      document.removeEventListener("mouseup", handleMouseUp)
    }
  }, [isDraggingSidebar, isDraggingChat, sidebarWidth])

  const sendMessage = () => {
    if (message.trim()) {
      setMessage("")
    }
  }

  const isConnected = connectionState === ConnectionState.Connected
  const isMicEnabled = localParticipant?.isMicrophoneEnabled ?? false

  return (
    <div className="h-screen bg-gray-50 flex overflow-hidden">
      {/* Resizable Sidebar */}
      <div
        ref={sidebarRef}
        className="bg-white border-r border-gray-200 flex-shrink-0 flex flex-col"
        style={{ width: `${sidebarWidth}px` }}
      >
        <div className="p-6 flex-shrink-0">
          <h1 className="text-xl font-semibold text-gray-900">Clara.ai</h1>
        </div>

        <nav className="px-6 space-y-2 flex-shrink-0">
          <Link
            href="/dashboard"
            className="w-full flex items-center space-x-3 rounded-lg px-3 py-2 text-left text-gray-600 hover:text-gray-900 hover:bg-gray-50"
          >
            <Home className="w-5 h-5" />
            <span>Home</span>
          </Link>
          <button className="w-full flex items-center space-x-3 rounded-lg px-3 py-2 text-left text-gray-600 hover:text-gray-900 hover:bg-gray-50">
            <Settings className="w-5 h-5" />
            <span>Settings</span>
          </button>
        </nav>
      </div>

      {/* Sidebar Resize Handle */}
      <div
        className="w-1 bg-gray-200 hover:bg-blue-400 cursor-col-resize flex items-center justify-center group transition-colors"
        onMouseDown={() => setIsDraggingSidebar(true)}
      >
        <GripVertical className="w-3 h-3 text-gray-400 group-hover:text-blue-600" />
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex h-full">
        {/* Left Panel - Voice Interface */}
        <div
          ref={chatPaneRef}
          className={`bg-white border-r border-gray-200 flex flex-col p-6 transition-all duration-1000 ${isLoaded ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}`}
          style={{ width: `${chatPaneWidth}%` }}
        >
          {/* Voice Interface */}
          <div className="flex-shrink-0 flex flex-col items-center pt-8">
            {/* Gradient Orb with Audio Visualization */}
            <div className="mb-6 relative">
              <div
                className={`w-24 h-24 rounded-full shadow-2xl flex items-center justify-center transition-all duration-300 ${
                  isMicEnabled && isConnected ? "animate-pulse scale-110" : "scale-100"
                }`}
                style={{
                  background: `url('/images/gradient-2.png')`,
                  backgroundSize: "cover",
                  backgroundPosition: "center",
                }}
              >
                {/* Audio visualization overlay */}
                {tracks
                  .filter((trackRef) => trackRef.publication)
                  .map((trackRef) => (
                    <AudioTrack
                      key={trackRef.publication!.trackSid}
                      trackRef={trackRef as any}
                      className="absolute inset-0 rounded-full opacity-30"
                    />
                  ))}
              </div>
            </div>

            {/* Connection Status */}
            <div className="text-center mb-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                {isConnected ? "Connected to Clara" : "Connecting..."}
              </h3>
              <p className="text-sm text-gray-600">
                {isConnected ? "Voice AI session ready" : "Establishing connection..."}
              </p>
            </div>

            {/* LiveKit Controls */}
            <div className="flex gap-3 mb-6">
              <TrackToggle
                source={Track.Source.Microphone}
                className={`w-14 h-14 rounded-full transition-all duration-300 flex items-center justify-center ${
                  isMicEnabled ? "bg-blue-600 hover:bg-blue-700 text-white" : "bg-red-500 hover:bg-red-600 text-white"
                }`}
              ></TrackToggle>

              <TrackToggle
                source={Track.Source.ScreenShare}
                className="w-14 h-14 rounded-full bg-gray-600 hover:bg-gray-700 text-white flex items-center justify-center"
              ></TrackToggle>
            </div>

            {/* Chat Input */}
            <div className="w-full max-w-sm mb-6">
              <div className="flex gap-2">
                <Input
                  placeholder="Type to Clara..."
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  onKeyPress={(e) => e.key === "Enter" && sendMessage()}
                  className="flex-1 text-sm"
                />
                <Button onClick={sendMessage} size="sm">
                  <Send className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>

          {/* Session Files */}
          {sessionFiles.length > 0 && (
            <div className="flex-shrink-0 w-full max-w-sm mx-auto">
              <h4 className="text-sm font-medium text-gray-700 mb-2">Session Materials:</h4>
              <div className="space-y-1 max-h-32 overflow-y-auto">
                {sessionFiles.map((file, index) => (
                  <div key={index} className="text-xs text-gray-600 bg-gray-50 p-2 rounded">
                    📄 {file.name}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Spacer */}
          <div className="flex-1" />
        </div>

        {/* Chat/Content Resize Handle */}
        <div
          className="w-1 bg-gray-200 hover:bg-blue-400 cursor-col-resize flex items-center justify-center group transition-colors"
          onMouseDown={() => setIsDraggingChat(true)}
        >
          <GripVertical className="w-3 h-3 text-gray-400 group-hover:text-blue-600" />
        </div>

        {/* Right Panel - Lesson Content */}
        <div
          className={`flex-1 flex flex-col transition-all duration-1000 delay-300 ${isLoaded ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}`}
        >
          {/* Header */}
          <div className="flex-shrink-0 p-6 bg-white border-b border-gray-200">
            <Card>
              <CardHeader className="pb-4">
                <CardTitle className="text-2xl text-gray-900">AI Lesson Content</CardTitle>
                <p className="text-gray-600">Interactive lessons and diagrams will appear here</p>
              </CardHeader>
            </Card>
          </div>

          {/* Scrollable Content Area */}
          <div className="flex-1 overflow-y-auto p-6 bg-gray-50">
            <div className="max-w-4xl mx-auto">
              <Card className="mb-6">
                <CardContent className="p-8">
                  <div className="text-center text-gray-500">
                    <div className="w-16 h-16 bg-gray-200 rounded-full mx-auto mb-4 flex items-center justify-center">
                      <span className="text-2xl">📚</span>
                    </div>
                    <h3 className="text-lg font-medium text-gray-700 mb-2">Lesson Content Loading...</h3>
                    <p className="text-sm">
                      Upload your materials and start a conversation to generate personalized lesson content, diagrams,
                      and practice problems.
                    </p>
                  </div>
                </CardContent>
              </Card>

              <Card className="mb-6">
                <CardHeader>
                  <CardTitle className="text-lg text-gray-800">Interactive Diagrams</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="bg-gray-100 h-64 rounded-lg flex items-center justify-center">
                    <p className="text-gray-500">Mathematical visualizations will appear here</p>
                  </div>
                </CardContent>
              </Card>

              <Card className="mb-6">
                <CardHeader>
                  <CardTitle className="text-lg text-gray-800">Practice Problems</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="bg-gray-100 h-48 rounded-lg flex items-center justify-center">
                    <p className="text-gray-500">AI-generated practice problems will appear here</p>
                  </div>
                </CardContent>
              </Card>

              <Card className="mb-6">
                <CardHeader>
                  <CardTitle className="text-lg text-gray-800">Step-by-Step Solutions</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="bg-gray-100 h-56 rounded-lg flex items-center justify-center">
                    <p className="text-gray-500">Detailed solution walkthroughs will appear here</p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>

      {/* Audio Renderer */}
      <RoomAudioRenderer />
    </div>
  )
}

export default function TutorSessionPage() {
  const { user } = useUser()
  const [connectionData, setConnectionData] = useState<{ token: string; wsUrl: string } | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const connectToLiveKit = async () => {
      if (!user) return

      try {
        setIsLoading(true)
        setError(null)

        const response = await fetch("/api/livekit/token", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            roomName: `tutor-session-${user.id}`,
            participantName: user.firstName || user.id,
            userId: user.id,
          }),
        })

        if (!response.ok) {
          const errorData = await response.json()
          throw new Error(errorData.error || "Failed to connect to LiveKit")
        }

        const data = await response.json()
        setConnectionData(data)
      } catch (err) {
        console.error("Error connecting to LiveKit:", err)
        setError(err instanceof Error ? err.message : "Failed to connect")
      } finally {
        setIsLoading(false)
      }
    }

    connectToLiveKit()
  }, [user])

  if (isLoading) {
    return (
      <div className="h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-blue-600 rounded-full mx-auto mb-4 animate-pulse"></div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Connecting to Clara...</h2>
          <p className="text-gray-600">Setting up your tutoring session</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center max-w-md">
          <div className="w-16 h-16 bg-red-500 rounded-full mx-auto mb-4 flex items-center justify-center">
            <span className="text-white text-2xl">⚠️</span>
          </div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Connection Error</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <Button onClick={() => window.location.reload()} className="bg-blue-600 hover:bg-blue-700">
            Try Again
          </Button>
        </div>
      </div>
    )
  }

  if (!connectionData) {
    return (
      <div className="h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Unable to connect</h2>
          <p className="text-gray-600">Please try refreshing the page</p>
        </div>
      </div>
    )
  }

  return (
    <LiveKitRoom
      video={false}
      audio={true}
      token={connectionData.token}
      serverUrl={connectionData.wsUrl}
      data-lk-theme="default"
      style={{ height: "100vh" }}
      onConnected={() => console.log("Connected to LiveKit room")}
      onDisconnected={() => console.log("Disconnected from LiveKit room")}
    >
      <TutorSessionContent />
    </LiveKitRoom>
  )
}
