"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Home, Folder, Settings, Send, Menu, X, Mic, Users, MessageSquare } from "lucide-react"
import Link from "next/link"
import FileUpload from "@/components/homework/file-upload"
import { usePageView, useUserTracking } from "@/hooks/use-analytics"
import LocalLiveKitVoiceRoom from "@/components/local-livekit-voice-room"

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
  const [isSessionActive, setIsSessionActive] = useState(false)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const { trackUserAction } = useUserTracking()
  
  // Track page view
  usePageView('Study Session')

  const startVoiceSession = async () => {
    setIsSessionActive(true)
    
    // Track voice session start
    trackUserAction('voice_session_started', {
      session_type: 'study_websocket',
    })
  }

  const endSession = () => {
    setIsSessionActive(false)
    
    // Track session end
    trackUserAction('voice_session_ended', {
      session_type: 'study_websocket',
      session_duration: 'manual_end',
    })
  }

  const handleFileUploaded = (fileId: string, filename: string) => {
    // You can add logic here to notify the voice session about uploaded files
    console.log(`File uploaded: ${filename} (ID: ${fileId})`)
  }

  if (isSessionActive) {
    return (
      <div className="min-h-screen bg-white">
        <LocalLiveKitVoiceRoom 
          onEndSession={endSession}
          sidebarCollapsed={sidebarCollapsed}
          setSidebarCollapsed={setSidebarCollapsed}
        />
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

            <Button
              onClick={startVoiceSession}
              className="px-8 py-3 text-lg bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-all duration-300 hover:scale-105"
            >
              Start Voice Session
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



export default ClientOnlyStudySessionPage
