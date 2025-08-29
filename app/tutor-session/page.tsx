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
  RoomAudioRenderer,
  TrackToggle,
  useConnectionState,
  useLocalParticipant,
  useTracks,
  useParticipants,
  useRemoteParticipants,
  StartAudio,
} from "@livekit/components-react" 
import { Track, ConnectionState, Room } from "livekit-client"
import "@livekit/components-styles"
import { useUser } from "@clerk/nextjs"
import ReactMarkdown from "react-markdown"
import { useDataReceived } from "@/hooks/use-data-received"
import { Mermaid } from "mermaid"
import { highlightCode } from "@/lib/shiki-highlighter"

// Dynamic import for mermaid to avoid SSR issues
import dynamic from 'next/dynamic'

// Dynamically import mermaid with no SSR
const MermaidChart = dynamic(() => import('@/components/MermaidChart'), {
  ssr: false,
  loading: () => <div>Loading diagram...</div>
})

declare global {
  interface Window {
    lkRoom?: any;
    cleanupRoomListeners?: () => void;
  }
}

interface CodeBlockProps {
  node?: any;
  className?: string;
  children?: React.ReactNode; // Make children optional
  inline?: boolean; // Add inline prop
}

function CodeBlock({ className, children, inline, ...props }: CodeBlockProps) {
  const match = /language-(\w+)/.exec(className || '');
  const lang = match ? match[1] : 'plaintext';
  const code = String(children).replace(/\n$/, '');
  const [highlightedCode, setHighlightedCode] = useState('');

  useEffect(() => {
    const getHighlightedCode = async () => {
      try {
        const html = await highlightCode(code, lang);
        setHighlightedCode(html);
      } catch (error) {
        console.error('Code highlighting failed:', error);
        setHighlightedCode(`<pre><code>${code}</code></pre>`);
      }
    };
    if (!inline) {
      getHighlightedCode();
    }
  }, [code, lang, inline]);

  if (inline) {
    return <code className={className} {...props}>{children}</code>;
  }

  return match ? (
    <div dangerouslySetInnerHTML={{ __html: highlightedCode }} />
  ) : (
    <code className={className} {...props}>
      {children}
    </code>
  );
}

interface TutorSessionContentProps {
  room: Room | undefined;
}

function TutorSessionContent({ room }: TutorSessionContentProps) {
  const [message, setMessage] = useState("")
  const [sessionFiles, setSessionFiles] = useState<any[]>([])
  const [isLoaded, setIsLoaded] = useState(false)
  const [sidebarWidth, setSidebarWidth] = useState(256)
  const [chatPaneWidth, setChatPaneWidth] = useState(33.33)
  const [isDraggingSidebar, setIsDraggingSidebar] = useState(false)
  const [isDraggingChat, setIsDraggingChat] = useState(false)
  const [agentStatus, setAgentStatus] = useState<'connecting' | 'connected' | 'disconnected'>('connecting')
  const [title, setTitle] = useState("")
  const [notes, setNotes] = useState("")
  const [diagrams, setDiagrams] = useState<{ content: string }[]>([])
  const [mermaidLoaded, setMermaidLoaded] = useState(false)
  
  const data = useDataReceived(room);

  useEffect(() => {
    if (data) {
      switch (data.tool) {
        case "explanation":
          setNotes(data.explanation);
          break;
        case "example":
          setNotes(data.example);
          break;
        case "quiz":
          // Handle quiz data differently if needed
          break;
        case "diagram":
          setDiagrams([{ content: data.mermaid_code }]);
          break;
        default:
          break;
      }
    }
  }, [data]);

  const sidebarRef = useRef<HTMLDivElement>(null)
  const chatPaneRef = useRef<HTMLDivElement>(null)
  const connectionState = useConnectionState()
  const { localParticipant } = useLocalParticipant()
  const participants = useParticipants()
  const remoteParticipants = useRemoteParticipants()

  // Get audio tracks for visualization
  const tracks = useTracks([{ source: Track.Source.Microphone, withPlaceholder: true }])
  
  // Get all audio tracks (both local and remote)
  const allAudioTracks = useTracks([Track.Source.Microphone], { onlySubscribed: false })
  const remoteAudioTracks = useTracks([Track.Source.Microphone], { onlySubscribed: false }).filter(
    (trackRef) => trackRef.participant.isLocal === false
  )

  // Handle localStorage safely
  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        const files = localStorage.getItem("sessionFiles")
        if (files) {
          setSessionFiles(JSON.parse(files))
        }
      } catch (error) {
        console.error('Error loading session files from localStorage:', error);
      }
      
      setTimeout(() => setIsLoaded(true), 100)

      try {
        const generatedContent = localStorage.getItem("generatedContent")
        if (generatedContent) {
          const { title, notes, diagrams } = JSON.parse(generatedContent)
          setTitle(title || "")
          setNotes(notes || "")
          setDiagrams(diagrams || [])
          localStorage.removeItem("generatedContent") // Clean up local storage
        }
      } catch (error) {
        console.error('Error loading generated content from localStorage:', error);
      }
    }
  }, [])

  // Initialize mermaid safely
  useEffect(() => {
    if (diagrams.length > 0 && typeof window !== 'undefined' && !mermaidLoaded) {
      setMermaidLoaded(true);
    }
  }, [diagrams, mermaidLoaded]);

  // Monitor for agent joining the room with improved detection and audio debugging
  useEffect(() => {
    if (!localParticipant) return;

    const checkForAgent = () => {
      // Look for participants that are not the local participant
      const otherParticipants = participants.filter(p => 
        p.identity !== localParticipant.identity
      )
      
      // Log all participants for debugging
      console.log("🔍 All participants:", participants.map(p => ({
        identity: p.identity,
        name: p.name || 'no name',
        isLocal: p.isLocal,
        audioTracks: Array.from(p.audioTrackPublications?.values() as Iterable<any> || []).map(pub => ({
          trackSid: pub.trackSid,
          subscribed: pub.isSubscribed ?? false,
          enabled: pub.isEnabled ?? false,
          muted: pub.isMuted ?? false,
          kind: pub.kind,
          source: pub.source
        }))
      })))
      
      if (otherParticipants.length > 0 && agentStatus !== 'connected') {
        const agent = otherParticipants[0] // Assume first non-local participant is the agent
        console.log("🎉 Agent Status: Agent detected!")
        console.log("🤖 Agent Identity:", agent.identity)
        console.log("🔖 Agent Name:", agent.name || 'no name')
        
        // Log agent's audio tracks
        const agentAudioTracks = Array.from(agent.audioTrackPublications?.values() as Iterable<any> || [])
        console.log("🎵 Agent Audio Tracks:", agentAudioTracks.map(pub => ({
          trackSid: pub.trackSid,
          subscribed: pub.isSubscribed ?? false,
          enabled: pub.isEnabled ?? false,
          muted: pub.isMuted ?? false,
          kind: pub.kind,
          source: pub.source,
          track: pub.track ? {
            sid: pub.track.sid,
            kind: pub.track.kind,
            enabled: pub.track.mediaStreamTrack?.enabled ?? false,
            muted: pub.track.mediaStreamTrack?.muted ?? false
          } : null
        })))
        
        setAgentStatus('connected')
      } else if (otherParticipants.length === 0 && agentStatus === 'connected') {
        console.log("👋 Agent Status: Agent has left the room")
        setAgentStatus('disconnected')
      }
    }

    if (connectionState === ConnectionState.Connected) {
      checkForAgent()
    }
  }, [participants, localParticipant, agentStatus, connectionState])

  // Set agent status to connecting when room is connected but no agent yet
  useEffect(() => {
    if (connectionState === ConnectionState.Connected) {
      const timer = setTimeout(() => {
        if (agentStatus === 'connecting' && participants.length <= 1) {
          console.log("⏰ Agent connection timeout - still waiting...")
        }
      }, 10000) // Check after 10 seconds

      return () => clearTimeout(timer)
    }
  }, [connectionState, agentStatus, participants.length])

  // Audio debugging - monitor all audio tracks
  useEffect(() => {
    console.log("🎧 Audio Debug - All Audio Tracks:", allAudioTracks.map(trackRef => ({
      participant: {
        identity: trackRef.participant.identity,
        isLocal: trackRef.participant.isLocal,
        name: trackRef.participant.name || 'no name'
      },
      publication: trackRef.publication ? {
        trackSid: trackRef.publication.trackSid,
        subscribed: trackRef.publication.isSubscribed,
        enabled: trackRef.publication.isEnabled,
        muted: trackRef.publication.isMuted,
        source: trackRef.publication.source,
        kind: trackRef.publication.kind
      } : null,
      track: trackRef.publication?.track ? {
        sid: trackRef.publication.track.sid,
        kind: trackRef.publication.track.kind,
        enabled: trackRef.publication.track.mediaStreamTrack?.enabled ?? false,
        muted: trackRef.publication.track.mediaStreamTrack?.muted ?? false,
        mediaStreamTrack: trackRef.publication.track.mediaStreamTrack ? {
          enabled: trackRef.publication.track.mediaStreamTrack.enabled,
          muted: trackRef.publication.track.mediaStreamTrack.muted,
          readyState: trackRef.publication.track.mediaStreamTrack.readyState
        } : null
      } : null
    })))
    
    console.log("🎵 Audio Debug - Remote Audio Tracks Only:", remoteAudioTracks.length)
    remoteAudioTracks.forEach((trackRef, index) => {
      console.log(`🎵 Remote Audio Track ${index + 1}:`, {
        participant: trackRef.participant.identity,
        trackSid: trackRef.publication?.trackSid,
        subscribed: trackRef.publication?.isSubscribed,
        enabled: trackRef.publication?.isEnabled,
        muted: trackRef.publication?.isMuted
      })
    })
  }, [allAudioTracks, remoteAudioTracks])

  // Audio device and browser permissions debugging
  useEffect(() => {
    const checkAudioPermissions = async () => {
      if (typeof window === 'undefined') return;
      
      try {
        console.log("🎤 Audio Debug - Checking browser audio permissions...")
        
        // Check if we have microphone permission
        if ('permissions' in navigator && 'query' in navigator.permissions) {
          const permissionStatus = await navigator.permissions.query({ name: 'microphone' as PermissionName })
          console.log("🎤 Microphone Permission:", permissionStatus.state)
        }
        
        // Get available audio devices
        if ('mediaDevices' in navigator && 'enumerateDevices' in navigator.mediaDevices) {
          const devices = await navigator.mediaDevices.enumerateDevices()
          const audioInputs = devices.filter(device => device.kind === 'audioinput')
          const audioOutputs = devices.filter(device => device.kind === 'audiooutput')
          
          console.log("🎧 Audio Input Devices:", audioInputs.map(device => ({
            deviceId: device.deviceId,
            label: device.label || 'no label',
            groupId: device.groupId
          })))
          
          console.log("🔊 Audio Output Devices:", audioOutputs.map(device => ({
            deviceId: device.deviceId,
            label: device.label || 'no label',
            groupId: device.groupId
          })))
        }
        
        // Check if audio context is running
        if ('AudioContext' in window || 'webkitAudioContext' in window) {
          const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
          const audioContext = new AudioContextClass()
          console.log("🎵 AudioContext State:", audioContext.state)
          console.log("🎵 AudioContext Sample Rate:", audioContext.sampleRate)
          audioContext.close()
        }
        
      } catch (error) {
        console.error("❌ Audio Debug - Error checking audio permissions:", error)
      }
    }
    
    if (connectionState === ConnectionState.Connected) {
      checkAudioPermissions()
    }
  }, [connectionState])

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
              
              {/* Agent Status Notification */}
              {isConnected && (
                <div className={`mt-3 px-3 py-2 rounded-full text-xs font-medium transition-all duration-300 ${
                  agentStatus === 'connected' 
                    ? 'bg-green-100 text-green-800 border border-green-200' 
                    : agentStatus === 'connecting'
                    ? 'bg-yellow-100 text-yellow-800 border border-yellow-200 animate-pulse'
                    : 'bg-red-100 text-red-800 border border-red-200'
                }`}>
                  {agentStatus === 'connected' && '🤖 AI Tutor Connected'}
                  {agentStatus === 'connecting' && '🔄 Calling AI Tutor...'}
                  {agentStatus === 'disconnected' && '⚠️ AI Tutor Disconnected'}
                </div>
              )}

              {/* Audio Debug Info */}
              {isConnected && (
                <div className="mt-2 text-xs text-gray-500 space-y-1">
                  <div>
                    Participants: {participants.length} | 
                    Others: {participants.filter(p => p.identity !== localParticipant?.identity).length}
                  </div>
                  <div>
                    Audio Tracks: {allAudioTracks.length} | 
                    Remote Audio: {remoteAudioTracks.length}
                  </div>
                  {remoteAudioTracks.length > 0 && (
                    <div className="text-green-600">
                      ✅ Agent audio track detected
                    </div>
                  )}
                  {remoteAudioTracks.length === 0 && agentStatus === 'connected' && (
                    <div className="text-red-600">
                      ⚠️ Agent connected but no audio track
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* LiveKit Controls */}
            <div className="flex gap-3 mb-6">
              <TrackToggle
                source={Track.Source.Microphone}
                className={`w-14 h-14 rounded-full transition-all duration-300 flex items-center justify-center ${
                  isMicEnabled ? "bg-blue-600 hover:bg-blue-700 text-white" : "bg-red-500 hover:bg-red-600 text-white"
                }`}
              />

              <TrackToggle
                source={Track.Source.ScreenShare}
                className="w-14 h-14 rounded-full bg-gray-600 hover:bg-gray-700 text-white flex items-center justify-center"
              />
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
                <CardTitle className="text-2xl text-gray-900">{title || "AI Lesson Content"}</CardTitle>
                <p className="text-gray-600">Interactive lessons and diagrams will appear here</p>
              </CardHeader>
            </Card>
          </div>

          {/* Scrollable Content Area */}
          <div className="flex-1 overflow-y-auto p-6 bg-gray-50">
            <div className="max-w-4xl mx-auto">
              {notes ? (
                <Card className="mb-6">
                  <CardContent className="p-8 prose max-w-none">
                    <ReactMarkdown
                      components={{
                        code: CodeBlock,
                      }}
                    >
                      {notes}
                    </ReactMarkdown>
                  </CardContent>
                </Card>
              ) : (
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
              )}

              {diagrams.length > 0 && (
                <Card className="mb-6">
                  <CardHeader>
                    <CardTitle className="text-lg text-gray-800">Interactive Diagrams</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {diagrams.map((diagram, index) => (
                      <MermaidChart key={index} chart={diagram.content} />
                    ))}
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function TutorSessionPage() {
  const { user } = useUser()
  const [connectionData, setConnectionData] = useState<{ token: string; wsUrl: string } | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [room, setRoom] = useState<Room | undefined>(undefined)

  useEffect(() => {
    const connectToLiveKit = async () => {
      if (!user) {
        console.log("🔄 LiveKit Connection: Waiting for user authentication...")
        return
      }

      try {
        console.log("🚀 LiveKit Connection: Starting connection process...")
        console.log("👤 User ID:", user.id)
        console.log("📝 User Name:", user.firstName || user.id)
        
        setError(null)

        const requestBody = {
          roomName: `tutor-session-${user.id}`,
          participantName: user.firstName || user.id,
          userId: user.id,
        }
        
        console.log("📡 LiveKit Connection: Sending token request to /api/livekit/token")
        console.log("📦 Request payload:", requestBody)

        const response = await fetch("/api/livekit/token", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(requestBody),
        })

        console.log("📨 LiveKit Connection: Response status:", response.status)
        console.log("📨 LiveKit Connection: Response OK:", response.ok)

        if (!response.ok) {
          const errorData = await response.json()
          console.error("❌ LiveKit Connection: Token request failed")
          console.error("❌ Error details:", errorData)
          throw new Error(errorData.error || "Failed to connect to LiveKit")
        }

        const data = await response.json()
        console.log("✅ LiveKit Connection: Token received successfully")
        console.log("🔗 WebSocket URL:", data.wsUrl)
        console.log("🎫 Token length:", data.token?.length || 0)
        console.log("🤖 LiveKit Cloud Agent: Will auto-join when room connects")
        
        setConnectionData(data)
        console.log("🎯 LiveKit Connection: Connection data set, proceeding to room connection...")
      } catch (err) {
        console.error("💥 LiveKit Connection: Error during connection process:", err)
        console.error("💥 Error stack:", err instanceof Error ? err.stack : "No stack trace")
        setError(err instanceof Error ? err.message : "Failed to connect")
      }
    }

    connectToLiveKit()
  }, [user])

  // Cleanup function for room listeners
  useEffect(() => {
    return () => {
      if (typeof window !== 'undefined' && window.cleanupRoomListeners) {
        window.cleanupRoomListeners();
      }
    }
  }, [])

  // Show error state if there's an error
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

  // Show the main interface immediately, even if connectionData is null
  // LiveKit will handle the connection state internally
  return (
    <LiveKitRoom
      video={false}
      audio={true}
      token={connectionData?.token || ""}
      serverUrl={connectionData?.wsUrl || ""}
      data-lk-theme="default"
      style={{ height: "100vh" }}
      onConnected={() => {
        // The room instance is available via useRoomContext or useRoom hook inside LiveKitRoom children
        setRoom(window.lkRoom); // Assuming lkRoom is set in the global window object in the TutorSessionContent component

        console.log("🎉 LiveKit Room: Successfully connected to room!");
        console.log("🤖 LiveKit Cloud Agent: Waiting for agent to auto-join...");
        
        // Safe property access with null checks
        const audioContextInfo = {
          canPlayAudio: window.lkRoom?.canPlaybackAudio,
          audioContext: 'not available'
        };
        console.log("🎵 Room Audio Context:", audioContextInfo);
        
        // Set up audio track event handlers with proper typing
        const handleTrackSubscribed = (track: any, publication: any, participant: any) => {
          try {
            const trackInfo = {
              trackKind: track?.kind,
              trackSid: track?.sid,
              participant: participant?.identity,
              isAgent: participant?.identity !== window.lkRoom?.localParticipant?.identity,
              isEnabled: track?.isEnabled,
              isMuted: track?.isMuted
            };
            console.log("🎵 Track Subscribed:", trackInfo);
            
            if (track?.kind === 'audio' && participant?.identity !== window.lkRoom?.localParticipant?.identity) {
              console.log("🎉 Agent Audio Track Subscribed!");
              console.log("🎵 Audio Track Details:", {
                trackSid: track.sid,
                isEnabled: track.isEnabled,
                isMuted: track.isMuted,
                mediaStreamTrack: track.mediaStreamTrack ? {
                  readyState: track.mediaStreamTrack.readyState,
                  label: track.mediaStreamTrack.label || 'no label'
                } : 'no mediaStreamTrack'
              });
            }
          } catch (error) {
            console.error("❌ Error in trackSubscribed handler:", error);
          }
        };
        
        const handleTrackUnsubscribed = (track: any, publication: any, participant: any) => {
          try {
            console.log("🎵 Track Unsubscribed:", {
              trackKind: track?.kind,
              participant: participant?.identity
            });
          } catch (error) {
            console.error("❌ Error in trackUnsubscribed handler:", error);
          }
        };
        
        // Add event listeners
        window.lkRoom.on('trackSubscribed', handleTrackSubscribed);
        window.lkRoom.on('trackUnsubscribed', handleTrackUnsubscribed);
        
        // Cleanup function to remove listeners
        const cleanup = () => {
          if (window.lkRoom) {
            window.lkRoom.off('trackSubscribed', handleTrackSubscribed);
            window.lkRoom.off('trackUnsubscribed', handleTrackUnsubscribed);
          }
          if (typeof window !== 'undefined') {
            delete window.lkRoom;
          }
        };
        
        // Store cleanup function
        window.cleanupRoomListeners = cleanup;
      }}
      onDisconnected={(reason) => {
        console.log("👋 LiveKit Room: Disconnected from room");
        console.log("📝 Disconnect reason:", reason);
        if (typeof window !== 'undefined') {
          delete window.lkRoom;
        }
      }}
      onError={(error) => {
        console.error("🚨 LiveKit Room: Connection error occurred");
        console.error("🚨 Error details:", error);
        console.error("🚨 Error message:", error.message);
        if (typeof window !== 'undefined') {
          delete window.lkRoom;
        }
      }}
    >
      <TutorSessionContent room={room} />
      <RoomAudioRenderer />
      <StartAudio label="Click to enable audio" />
    </LiveKitRoom>
  );
}