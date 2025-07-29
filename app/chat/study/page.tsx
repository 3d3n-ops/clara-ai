"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Home, Folder, Settings, Send, Menu, X, Mic, Users, MessageSquare } from "lucide-react"
import Link from "next/link"
import { useLiveKit, generateLiveKitToken } from "@/hooks/use-livekit"
import {
  LiveKitRoom,
  RoomAudioRenderer,
  ControlBar,
  ConnectionStateToast,
} from "@livekit/components-react"
import FileUpload from "@/components/homework/file-upload"

// Client-side only wrapper to prevent hydration issues
function ClientOnlyStudySessionPage() {
  const [isMounted, setIsMounted] = useState(false)

  useEffect(() => {
    setIsMounted(true)
  }, [])

  if (!isMounted) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading study session...</p>
        </div>
      </div>
    )
  }

  return <StudySessionPageContent />
}

function StudySessionPageContent() {
  const [roomName, setRoomName] = useState("")
  const [token, setToken] = useState("")
  const [participantName, setParticipantName] = useState("")
  const [isConnecting, setIsConnecting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)

  const { connect, disconnect, isConnected, connectionState } = useLiveKit()

  useEffect(() => {
    const sessionId = Math.random().toString(36).substring(7)
    setRoomName(`study-session-${sessionId}`)
    setParticipantName(`student-${sessionId}`)
  }, [])

  const startVoiceSession = async () => {
    if (!roomName || !participantName) return

    setIsConnecting(true)
    setError(null)

    try {
      const generatedToken = await generateLiveKitToken(roomName, participantName)
      setToken(generatedToken)
    } catch (err) {
      setError("Failed to start session. Please try again.")
      setIsConnecting(false)
    }
  }

  const endSession = () => {
    setToken("")
    setIsConnecting(false)
    disconnect()
  }

  const handleFileUploaded = (fileId: string, filename: string) => {
    // You can add logic here to notify the voice session about uploaded files
    console.log(`File uploaded: ${filename} (ID: ${fileId})`)
  }

  const serverUrl = process.env.NEXT_PUBLIC_LIVEKIT_URL || "wss://clara-ai-voice.livekit.cloud"

  if (token && serverUrl) {
    return (
      <div className="min-h-screen bg-white">
        <LiveKitRoom
          video={false}
          audio={true}
          token={token}
          serverUrl={serverUrl}
          data-lk-theme="default"
          style={{ height: "100vh" }}
          onDisconnected={() => {
            setToken("")
            setIsConnecting(false)
          }}
        >
          <MinimalVoiceRoom onEndSession={endSession} />
        </LiveKitRoom>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white flex">
      {/* Sidebar */}
      <div className={`${sidebarCollapsed ? "w-16" : "w-64"} bg-white border-r border-gray-200 transition-all duration-300 flex flex-col`}>
        <div className="p-6 flex items-center justify-between">
          {!sidebarCollapsed && <h1 className="text-xl font-semibold text-gray-900">Clara.ai</h1>}
          <Button variant="ghost" size="sm" onClick={() => setSidebarCollapsed(!sidebarCollapsed)} className="p-2">
            {sidebarCollapsed ? <Menu className="w-5 h-5" /> : <X className="w-5 h-5" />}
          </Button>
        </div>

        <nav className="px-6 space-y-2 mb-6">
          <Link
            href="/dashboard"
            className={`w-full flex items-center ${sidebarCollapsed ? "justify-center" : "space-x-3"} rounded-lg px-3 py-2 text-left text-gray-600 hover:text-gray-900 hover:bg-gray-50 bg-gray-100`}
            title={sidebarCollapsed ? "Home" : ""}
          >
            <Home className="w-5 h-5" />
            {!sidebarCollapsed && <span>Home</span>}
          </Link>
          <button
            className={`w-full flex items-center ${sidebarCollapsed ? "justify-center" : "space-x-3"} rounded-lg px-3 py-2 text-left text-gray-600 hover:text-gray-900 hover:bg-gray-50`}
            title={sidebarCollapsed ? "Folders" : ""}
          >
            <Folder className="w-5 h-5" />
            {!sidebarCollapsed && <span>Folders</span>}
          </button>
          <button
            className={`w-full flex items-center ${sidebarCollapsed ? "justify-center" : "space-x-3"} rounded-lg px-3 py-2 text-left text-gray-600 hover:text-gray-900 hover:bg-gray-50`}
            title={sidebarCollapsed ? "Settings" : ""}
          >
            <Settings className="w-5 h-5" />
            {!sidebarCollapsed && <span>Settings</span>}
          </button>
        </nav>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Central Voice Element */}
        <div className="flex-1 flex items-center justify-center p-8">
          <div className="text-center space-y-8">
            {/* Large Circular Element */}
            <div className="w-48 h-48 bg-gradient-to-b from-blue-400 to-blue-600 rounded-full flex items-center justify-center mx-auto shadow-lg">
              <Mic className="w-16 h-16 text-white" />
            </div>
            
            <div className="space-y-4">
              <h1 className="text-3xl font-bold text-gray-900">Study with Clara</h1>
              <p className="text-lg text-gray-600 max-w-md mx-auto">
                Start a voice session with your AI study assistant
              </p>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 max-w-md mx-auto">
                <p className="text-red-700 text-sm">{error}</p>
              </div>
            )}

            {isConnecting && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 max-w-md mx-auto">
                <div className="flex items-center justify-center gap-2 text-blue-700">
                  <div className="w-3 h-3 bg-blue-500 rounded-full animate-pulse"></div>
                  <span className="text-sm font-medium">Connecting to Clara...</span>
                </div>
              </div>
            )}

            <Button
              onClick={startVoiceSession}
              disabled={isConnecting}
              className="px-8 py-3 text-lg bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-all duration-300 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isConnecting ? "Connecting..." : "Start Voice Session"}
            </Button>
          </div>
        </div>

        {/* File Upload and Bottom Content */}
        <div className="p-6 border-t border-gray-200">
          <div className="max-w-4xl mx-auto space-y-4">
            {/* File Upload Component */}
            <FileUpload 
              onFileUploaded={handleFileUploaded}
              className="mb-4"
            />
            
            {/* Placeholder content */}
            <div className="h-8 bg-gray-300 rounded-lg w-24"></div>
          </div>
        </div>
      </div>
    </div>
  )
}

// Minimal Voice Room Component
function MinimalVoiceRoom({ onEndSession }: { onEndSession: () => void }) {
  return (
    <div className="h-screen flex flex-col bg-white">
      {/* Header */}
      <div className="bg-white p-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-3 h-3 bg-green-500 rounded-full"></div>
            <h1 className="text-lg font-semibold text-gray-900">Study Session</h1>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              className="text-gray-600 border-gray-300 hover:bg-gray-50"
            >
              <MessageSquare className="w-4 h-4" />
            </Button>

            <Button
              variant="outline"
              size="sm"
              className="text-gray-600 border-gray-300 hover:bg-gray-50"
            >
              <Users className="w-4 h-4" />
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={onEndSession}
              className="text-red-600 border-red-300 hover:bg-red-50"
            >
              End Session
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Audio Renderer */}
        <RoomAudioRenderer />

        {/* Connection Toast */}
        <ConnectionStateToast />

        {/* Central Voice Display */}
        <div className="flex-1 flex items-center justify-center p-8">
          <div className="text-center space-y-6">
            <div className="w-32 h-32 bg-gradient-to-b from-blue-400 to-blue-600 rounded-full flex items-center justify-center mx-auto shadow-lg">
              <Mic className="w-16 h-16 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Clara is Ready!</h2>
              <p className="text-gray-600">Start speaking to begin your study session</p>
            </div>
          </div>
        </div>

        {/* Control Bar */}
        <div className="p-4 bg-white border-t border-gray-200">
          <ControlBar
            variation="minimal"
            controls={{
              microphone: true,
              camera: false,
              chat: false,
              screenShare: true,
              leave: false,
            }}
          />
        </div>
      </div>
    </div>
  )
}

export default ClientOnlyStudySessionPage
