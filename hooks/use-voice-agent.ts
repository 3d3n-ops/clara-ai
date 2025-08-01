"use client"

import { useState, useEffect, useCallback } from 'react'

interface VoiceAgentState {
  isConnected: boolean
  isRecording: boolean
  isProcessing: boolean
  error: string | null
  messages: string[]
  visualContent: any | null
}

interface UseVoiceAgentProps {
  roomName?: string
  userId?: string
  onVisualContentGenerated?: (content: any) => void
}

export function useVoiceAgent({ roomName, userId, onVisualContentGenerated }: UseVoiceAgentProps = {}) {
  const [state, setState] = useState<VoiceAgentState>({
    isConnected: false,
    isRecording: false,
    isProcessing: false,
    error: null,
    messages: [],
    visualContent: null
  })
  const [websocket, setWebsocket] = useState<WebSocket | null>(null)
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null)

  // Connect to voice agent via WebSocket
  const connect = useCallback(async () => {
    try {
      const currentUserId = userId || `demo-user-${Date.now()}`
      const backendUrl = process.env.NEXT_PUBLIC_API_URL || process.env.PYTHON_BACKEND_URL || 'http://localhost:8000'
      const wsUrl = backendUrl.replace('http', 'ws')
      
      const ws = new WebSocket(`${wsUrl}/voice/ws/${currentUserId}`)
      
      ws.onopen = () => {
        console.log('Connected to voice agent')
        setState(prev => ({ 
          ...prev, 
          isConnected: true, 
          error: null,
          messages: [...prev.messages, "Connected to Clara's voice session!"]
        }))
        setWebsocket(ws)
      }
      
      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data)
          console.log('Received message from voice agent:', data)
          
          if (data.type === 'response') {
            setState(prev => ({ 
              ...prev, 
              messages: [...prev.messages, `Clara: ${data.text}`]
            }))
            
            // Handle visual content if generated
            if (data.visual_content) {
              const visualContent = {
                type: data.command_type || 'diagram',
                title: `Generated ${data.command_type || 'content'} from voice`,
                content: data.visual_content,
                timestamp: new Date()
              }
              setState(prev => ({ ...prev, visualContent }))
              onVisualContentGenerated?.(visualContent)
            }
          } else if (data.type === 'session_started') {
            setState(prev => ({ 
              ...prev, 
              messages: [...prev.messages, data.message]
            }))
          }
        } catch (err) {
          console.error('Error parsing voice agent message:', err)
        }
      }
      
      ws.onerror = (error) => {
        console.error('WebSocket error:', error)
        setState(prev => ({ 
          ...prev, 
          error: 'Failed to connect to voice agent' 
        }))
      }
      
      ws.onclose = () => {
        console.log('Disconnected from voice agent')
        setState(prev => ({ 
          ...prev, 
          isConnected: false,
          isRecording: false,
          isProcessing: false
        }))
        setWebsocket(null)
      }
      
    } catch (error) {
      console.error('Error connecting to voice agent:', error)
      setState(prev => ({ 
        ...prev, 
        error: 'Failed to connect to voice agent' 
      }))
    }
  }, [userId, onVisualContentGenerated])

  // Disconnect from voice agent
  const disconnect = useCallback(() => {
    if (websocket) {
      websocket.close()
      setWebsocket(null)
    }
    if (mediaRecorder && mediaRecorder.state !== 'inactive') {
      mediaRecorder.stop()
      setMediaRecorder(null)
    }
    setState(prev => ({ 
      ...prev, 
      isConnected: false,
      isRecording: false,
      isProcessing: false
    }))
  }, [websocket, mediaRecorder])

  // Toggle recording
  const toggleRecording = useCallback(async () => {
    if (!state.isConnected) {
      // If not connected, try to connect first
      await connect()
      return
    }

    if (state.isRecording) {
      // Stop recording
      if (mediaRecorder && mediaRecorder.state !== 'inactive') {
        mediaRecorder.stop()
        setMediaRecorder(null)
      }
      setState(prev => ({ 
        ...prev, 
        isRecording: false,
        isProcessing: true
      }))
    } else {
      // Start recording
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
        const recorder = new MediaRecorder(stream)
        
        recorder.ondataavailable = async (event) => {
          if (event.data.size > 0 && websocket) {
            // Convert audio blob to base64
            const arrayBuffer = await event.data.arrayBuffer()
            const base64Audio = btoa(String.fromCharCode(...new Uint8Array(arrayBuffer)))
            
            // Send audio data to voice agent
            websocket.send(JSON.stringify({
              type: 'audio',
              audio: base64Audio
            }))
          }
        }
        
        recorder.onstop = () => {
          // Stop all tracks
          stream.getTracks().forEach(track => track.stop())
        }
        
        recorder.start()
        setMediaRecorder(recorder)
        setState(prev => ({ 
          ...prev, 
          isRecording: true,
          isProcessing: false
        }))
        
        // Send session start message
        if (websocket) {
          websocket.send(JSON.stringify({
            type: 'session_start'
          }))
        }
        
      } catch (error) {
        console.error('Error starting recording:', error)
        setState(prev => ({ 
          ...prev, 
          error: 'Failed to access microphone' 
        }))
      }
    }
  }, [state.isConnected, state.isRecording, state.isProcessing, websocket, mediaRecorder, connect])

  // Send text message to voice agent
  const sendTextMessage = useCallback((text: string) => {
    if (websocket && state.isConnected) {
      websocket.send(JSON.stringify({
        type: 'text',
        text: text
      }))
    }
  }, [websocket, state.isConnected])

  // Send visual generation command
  const sendVisualCommand = useCallback((command: string, topic: string) => {
    if (websocket && state.isConnected) {
      websocket.send(JSON.stringify({
        type: 'visual_command',
        command: command,
        topic: topic
      }))
    }
  }, [websocket, state.isConnected])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      disconnect()
    }
  }, [disconnect])

  return {
    ...state,
    connect,
    disconnect,
    toggleRecording,
    sendTextMessage,
    sendVisualCommand
  }
} 