import { useState, useEffect, useCallback, useRef } from 'react'
import { Room, RoomEvent, Participant, Track, AudioPresets, LocalTrack, LocalAudioTrack } from 'livekit-client'

export interface ClaraVoiceSessionConfig {
  userId: string
  wsUrl?: string
}

export interface VisualContent {
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

export interface SessionStatus {
  isConnected: boolean
  agentConnected: boolean
  roomName: string | null
  error: string | null
  isSpeaking: boolean
}

export function useClaraVoiceSession(config: ClaraVoiceSessionConfig) {
  const [status, setStatus] = useState<SessionStatus>({
    isConnected: false,
    agentConnected: false,
    roomName: null,
    error: null,
    isSpeaking: false
  })
  const [messages, setMessages] = useState<string[]>([])
  const [currentVisualContent, setCurrentVisualContent] = useState<VisualContent | null>(null)
  const [showVisualContent, setShowVisualContent] = useState(false)
  
  const roomRef = useRef<Room | null>(null)
  const localAudioTrackRef = useRef<Track | null>(null)
  const audioContextRef = useRef<AudioContext | null>(null)
  const analyserRef = useRef<AnalyserNode | null>(null)
  const speakingCheckRef = useRef<NodeJS.Timeout | null>(null)

  // Get LiveKit token from backend
  const getLiveKitToken = useCallback(async (roomName: string, userId: string): Promise<{ token: string; wsUrl: string } | null> => {
    try {
      const response = await fetch('/api/livekit/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          roomName,
          participantName: `student-${userId}`
        })
      })
      
      if (response.ok) {
        const data = await response.json()
        return { token: data.token, wsUrl: data.wsUrl }
      }
      
      return null
    } catch (error) {
      console.error('Error getting LiveKit token:', error)
      return null
    }
  }, [])

  // Start voice session
  const startSession = useCallback(async () => {
    try {
      setStatus(prev => ({ ...prev, error: null }))
      
      // 1. Create room name
      const roomName = `clara-study-${config.userId}-${Date.now()}`
      
      // 2. Get LiveKit token and wsUrl from backend
      const tokenData = await getLiveKitToken(roomName, config.userId)
      if (!tokenData) {
        throw new Error('Failed to get LiveKit token')
      }
      
      const { token, wsUrl } = tokenData
      
      // 3. Create and configure room
      const room = new Room({
        adaptiveStream: true,
        dynacast: true,
        publishDefaults: {
          audioPreset: AudioPresets.music,
          videoCodec: 'vp9'
        }
      })
      
      // 4. Set up event listeners
      room.on(RoomEvent.Connected, () => {
        console.log('Connected to LiveKit room')
        setStatus(prev => ({ ...prev, isConnected: true, roomName }))
        setMessages(prev => [...prev, "Connected to Clara's voice session!"])
      })
      
      room.on(RoomEvent.ParticipantConnected, (participant: Participant) => {
        console.log('Participant connected:', participant.identity)
        
        // Check if this is Clara (the agent)
        if (participant.identity.includes('agent') || participant.identity.includes('clara')) {
          console.log('Clara AI agent joined the session!')
          setStatus(prev => ({ ...prev, agentConnected: true }))
          setMessages(prev => [...prev, "Clara is ready to help with your studies!"])
        }
      })
      
      room.on(RoomEvent.TrackSubscribed, (track: Track, publication, participant: Participant) => {
        console.log('Track subscribed:', track.kind, 'from', participant.identity)
        
        if (track.kind === Track.Kind.Audio && participant.identity.includes('agent')) {
          // This is Clara's audio - play it
          const audioElement = document.createElement('audio')
          audioElement.autoplay = true
          audioElement.controls = false
          track.attach(audioElement)
          
          console.log('Clara audio track attached and playing')
        }
      })
      
      room.on(RoomEvent.DataReceived, (payload: Uint8Array, participant?: Participant) => {
        try {
          const data = JSON.parse(new TextDecoder().decode(payload))
          console.log('Received data from agent:', data)
          
          if (data.type === 'response') {
            setMessages(prev => [...prev, `Clara: ${data.text}`])
          } else if (data.type === 'visual_content') {
            setCurrentVisualContent(data.content)
            setShowVisualContent(true)
          }
        } catch (err) {
          console.error('Error parsing agent message:', err)
        }
      })
      
      room.on(RoomEvent.Disconnected, (reason) => {
        console.log('Disconnected from room:', reason)
        setStatus(prev => ({ 
          ...prev, 
          isConnected: false, 
          agentConnected: false,
          roomName: null 
        }))
      })
      
      // 5. Connect to room
      await room.connect(wsUrl, token)
      
      console.log('Connected to Clara study session:', roomName)
      roomRef.current = room
      
      // 6. Enable microphone
      await enableMicrophone()
      
      return { success: true, roomName }
      
    } catch (error) {
      console.error('Failed to start Clara session:', error)
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      setStatus(prev => ({ ...prev, error: errorMessage }))
      return { success: false, error: errorMessage }
    }
  }, [config.userId, getLiveKitToken])

  // Enable microphone
  const enableMicrophone = useCallback(async () => {
    try {
      if (!roomRef.current) return
      
      // Request microphone permission first
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          sampleRate: 48000,
          channelCount: 1
        } 
      })
      
      // Enable microphone publishing to LiveKit
      await roomRef.current.localParticipant.setMicrophoneEnabled(true)
      
      // Store the stream reference for cleanup
      localAudioTrackRef.current = stream as any
      
      // Set up voice activity detection
      setupVoiceActivityDetection(stream)
      
      console.log('Microphone enabled and published to LiveKit')
      setMessages(prev => [...prev, "Microphone enabled - you can now speak to Clara"])
      
      // Send a test message to Clara to verify connection
      if (roomRef.current && status.isConnected) {
        const data = new TextEncoder().encode(JSON.stringify({
          type: 'microphone_enabled',
          message: 'Microphone is now active',
          timestamp: Date.now()
        }))
        
        await roomRef.current.localParticipant.publishData(data, { topic: 'system' })
      }
      
    } catch (error) {
      console.error('Failed to enable microphone:', error)
      setMessages(prev => [...prev, "Failed to enable microphone - check permissions"])
      throw error
    }
  }, [status.isConnected])

  // Set up voice activity detection
  const setupVoiceActivityDetection = useCallback((stream: MediaStream) => {
    try {
      // Create audio context for voice activity detection
      audioContextRef.current = new AudioContext()
      const source = audioContextRef.current.createMediaStreamSource(stream)
      analyserRef.current = audioContextRef.current.createAnalyser()
      
      analyserRef.current.fftSize = 256
      analyserRef.current.smoothingTimeConstant = 0.8
      
      source.connect(analyserRef.current)
      
      // Start monitoring voice activity
      const checkVoiceActivity = () => {
        if (!analyserRef.current) return
        
        const bufferLength = analyserRef.current.frequencyBinCount
        const dataArray = new Uint8Array(bufferLength)
        analyserRef.current.getByteFrequencyData(dataArray)
        
        // Calculate average volume
        const average = dataArray.reduce((a, b) => a + b) / bufferLength
        
        // Consider speaking if volume is above threshold
        const isSpeaking = average > 30 // Adjust threshold as needed
        
        setStatus(prev => ({ ...prev, isSpeaking }))
        
        // Continue monitoring
        speakingCheckRef.current = setTimeout(checkVoiceActivity, 100)
      }
      
      checkVoiceActivity()
      
    } catch (error) {
      console.error('Failed to set up voice activity detection:', error)
    }
  }, [])

  // Disable microphone
  const disableMicrophone = useCallback(async () => {
    try {
      // Disable microphone in LiveKit
      if (roomRef.current) {
        await roomRef.current.localParticipant.setMicrophoneEnabled(false)
      }
      
      // Stop the local stream
      if (localAudioTrackRef.current) {
        if (localAudioTrackRef.current instanceof MediaStream) {
          localAudioTrackRef.current.getTracks().forEach(track => track.stop())
        }
        localAudioTrackRef.current = null
      }
      
      console.log('Microphone disabled')
      setMessages(prev => [...prev, "Microphone disabled"])
      
      // Clean up voice activity detection
      if (speakingCheckRef.current) {
        clearTimeout(speakingCheckRef.current)
        speakingCheckRef.current = null
      }
      
      if (audioContextRef.current) {
        await audioContextRef.current.close()
        audioContextRef.current = null
      }
      
      analyserRef.current = null
      setStatus(prev => ({ ...prev, isSpeaking: false }))
      
    } catch (error) {
      console.error('Failed to disable microphone:', error)
    }
  }, [])

  // Send text message to agent
  const sendTextMessage = useCallback(async (message: string) => {
    if (roomRef.current && status.isConnected) {
      try {
        const data = new TextEncoder().encode(JSON.stringify({
          type: 'text_message',
          message: message,
          timestamp: Date.now()
        }))
        
        await roomRef.current.localParticipant.publishData(data, { topic: 'chat' })
        setMessages(prev => [...prev, `You: ${message}`])
        
      } catch (error) {
        console.error('Failed to send message:', error)
      }
    }
  }, [status.isConnected])

  // Request visual content generation
  const requestVisualContent = useCallback(async (command: string, topic: string) => {
    if (roomRef.current && status.isConnected) {
      try {
        const data = new TextEncoder().encode(JSON.stringify({
          type: 'visual_command',
          command: command,
          topic: topic,
          timestamp: Date.now()
        }))
        
        await roomRef.current.localParticipant.publishData(data, { topic: 'visual' })
        setMessages(prev => [...prev, `Requesting visual content: ${command} about ${topic}`])
        
      } catch (error) {
        console.error('Failed to request visual content:', error)
      }
    }
  }, [status.isConnected])

  // Send voice command to agent
  const sendVoiceCommand = useCallback(async (command: string) => {
    if (roomRef.current && status.isConnected) {
      try {
        const data = new TextEncoder().encode(JSON.stringify({
          type: 'voice_command',
          command: command,
          timestamp: Date.now()
        }))
        
        await roomRef.current.localParticipant.publishData(data, { topic: 'voice' })
        setMessages(prev => [...prev, `Voice command: ${command}`])
        
      } catch (error) {
        console.error('Failed to send voice command:', error)
      }
    }
  }, [status.isConnected])

  // End session
  const endSession = useCallback(async () => {
    try {
      // Disable microphone in LiveKit
      if (roomRef.current) {
        await roomRef.current.localParticipant.setMicrophoneEnabled(false)
      }
      
      // Stop the local stream
      if (localAudioTrackRef.current) {
        if (localAudioTrackRef.current instanceof MediaStream) {
          localAudioTrackRef.current.getTracks().forEach(track => track.stop())
        }
        localAudioTrackRef.current = null
      }
      
      // Clean up voice activity detection
      if (speakingCheckRef.current) {
        clearTimeout(speakingCheckRef.current)
        speakingCheckRef.current = null
      }
      
      if (audioContextRef.current) {
        await audioContextRef.current.close()
        audioContextRef.current = null
      }
      
      analyserRef.current = null
      
      if (roomRef.current) {
        await roomRef.current.disconnect()
        roomRef.current = null
      }
      
      setStatus(prev => ({ 
        ...prev, 
        isConnected: false, 
        agentConnected: false,
        roomName: null,
        isSpeaking: false
      }))
      
      setMessages(prev => [...prev, "Session ended"])
      console.log('Clara session ended')
      
    } catch (error) {
      console.error('Error ending session:', error)
    }
  }, [])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (roomRef.current) {
        roomRef.current.disconnect()
      }
      if (localAudioTrackRef.current) {
        if (localAudioTrackRef.current instanceof MediaStream) {
          localAudioTrackRef.current.getTracks().forEach(track => track.stop())
        }
      }
      if (speakingCheckRef.current) {
        clearTimeout(speakingCheckRef.current)
      }
      if (audioContextRef.current) {
        audioContextRef.current.close()
      }
    }
  }, [])

  return {
    // State
    status,
    messages,
    currentVisualContent,
    showVisualContent,
    
    // Actions
    startSession,
    endSession,
    sendTextMessage,
    sendVoiceCommand,
    requestVisualContent,
    enableMicrophone,
    disableMicrophone,
    
    // UI helpers
    setShowVisualContent,
    setCurrentVisualContent
  }
} 