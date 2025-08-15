import { useState, useCallback, useRef, useEffect } from 'react'
import { createVapi } from '@/lib/vapi-mock'

interface UseVapiVoiceProps {
  onVisualContentGenerated?: (content: any) => void
  onMessageReceived?: (message: string) => void
  onError?: (error: string) => void
}

interface VapiVoiceState {
  isConnected: boolean
  isRecording: boolean
  isProcessing: boolean
  error: string | null
  messages: string[]
  visualContent: any | null
}

export function useVapiVoice({ 
  onVisualContentGenerated, 
  onMessageReceived, 
  onError 
}: UseVapiVoiceProps = {}) {
  const [state, setState] = useState<VapiVoiceState>({
    isConnected: false,
    isRecording: false,
    isProcessing: false,
    error: null,
    messages: [],
    visualContent: null
  })
  
  const vapiRef = useRef<any>(null)
  const sessionRef = useRef<any>(null)

  // Initialize Vapi connection
  const connect = useCallback(async () => {
    try {
      // Generate a unique session ID
      const sessionId = `clara-study-${Date.now()}`
      const userId = `student-${Math.random().toString(36).substr(2, 9)}`
      
      console.log(`[Vapi] Creating session: ${sessionId}`)
      
      // Get Vapi token
      const response = await fetch('/api/vapi/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          roomName: sessionId,
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
        setState(prev => ({ 
          ...prev, 
          isConnected: true,
          messages: [...prev.messages, "Connected to Clara's voice session!"]
        }))
      })

      vapi.on('call-end', () => {
        console.log('[Vapi] Call ended')
        setState(prev => ({ 
          ...prev, 
          isConnected: false,
          isRecording: false,
          isProcessing: false
        }))
      })

      vapi.on('speech-start', () => {
        console.log('[Vapi] Speech started')
        setState(prev => ({ 
          ...prev, 
          isRecording: true,
          isProcessing: false
        }))
      })

      vapi.on('speech-end', () => {
        console.log('[Vapi] Speech ended')
        setState(prev => ({ 
          ...prev, 
          isRecording: false,
          isProcessing: true
        }))
      })

             vapi.on('message', (message: any) => {
         console.log('[Vapi] Message received:', message)
         if (message.role === 'assistant') {
           const messageText = `Clara: ${message.content}`
           setState(prev => ({ 
             ...prev, 
             messages: [...prev.messages, messageText],
             isProcessing: false
           }))
           onMessageReceived?.(messageText)
         }
       })

       vapi.on('error', (error: any) => {
         console.error('[Vapi] Error:', error)
         const errorMessage = `Vapi error: ${error.message}`
         setState(prev => ({ ...prev, error: errorMessage }))
         onError?.(errorMessage)
       })

      vapiRef.current = vapi
      setState(prev => ({ ...prev, isConnected: true }))
      
    } catch (error) {
      console.error('Error initializing Vapi:', error)
      const errorMessage = error instanceof Error ? error.message : 'Failed to connect'
      setState(prev => ({ ...prev, error: errorMessage }))
      onError?.(errorMessage)
    }
  }, [onMessageReceived, onError])

  // Disconnect from Vapi
  const disconnect = useCallback(() => {
    if (vapiRef.current) {
      try {
        vapiRef.current.stop()
      } catch (error) {
        console.error('Error stopping Vapi:', error)
      }
      vapiRef.current = null
    }
    setState(prev => ({ 
      ...prev, 
      isConnected: false,
      isRecording: false,
      isProcessing: false
    }))
  }, [])

  // Toggle recording
  const toggleRecording = useCallback(() => {
    if (!vapiRef.current) return

    if (state.isRecording) {
      // Stop recording
      try {
        vapiRef.current.stop()
        setState(prev => ({ 
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
        setState(prev => ({ 
          ...prev, 
          isRecording: true,
          isProcessing: false
        }))
      } catch (error) {
        console.error('Error starting recording:', error)
      }
    }
  }, [state.isRecording])

  // Send text message
  const sendTextMessage = useCallback((text: string) => {
    if (vapiRef.current && state.isConnected) {
      // Vapi doesn't have a direct text message API, but we can simulate it
      // by adding the message to our state
      const messageText = `You: ${text}`
      setState(prev => ({ 
        ...prev, 
        messages: [...prev.messages, messageText]
      }))
      onMessageReceived?.(messageText)
    }
  }, [state.isConnected, onMessageReceived])

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

  return {
    state,
    connect,
    disconnect,
    toggleRecording,
    sendTextMessage,
    isConnected: state.isConnected,
    isRecording: state.isRecording,
    isProcessing: state.isProcessing,
    error: state.error,
    messages: state.messages,
    visualContent: state.visualContent
  }
} 