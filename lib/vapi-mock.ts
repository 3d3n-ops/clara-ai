// Mock Vapi implementation for testing and fallback
export class MockVapi {
  private isConnected = false
  private isRecording = false
  private eventListeners: { [key: string]: Function[] } = {}

  constructor(config: any) {
    console.log('[MockVapi] Initialized with config:', config)
  }

  on(event: string, callback: Function) {
    if (!this.eventListeners[event]) {
      this.eventListeners[event] = []
    }
    this.eventListeners[event].push(callback)
  }

  start() {
    console.log('[MockVapi] Starting...')
    this.isRecording = true
    this.emit('call-start', {})
    this.emit('speech-start', {})
    
    // Simulate a response after 2 seconds
    setTimeout(() => {
      this.emit('speech-end', {})
      this.emit('message', {
        role: 'assistant',
        content: 'Hello! I\'m Clara, your AI study assistant. How can I help you today?'
      })
      this.isRecording = false
    }, 2000)
  }

  stop() {
    console.log('[MockVapi] Stopping...')
    this.isRecording = false
    this.emit('speech-end', {})
    this.emit('call-end', {})
  }

  private emit(event: string, data: any) {
    const listeners = this.eventListeners[event] || []
    listeners.forEach(callback => {
      try {
        callback(data)
      } catch (error) {
        console.error(`[MockVapi] Error in ${event} listener:`, error)
      }
    })
  }
}

// Export a function to create either real Vapi or MockVapi
export function createVapi(config: any) {
  try {
    // Try to use real Vapi
    const Vapi = require('@vapi-ai/web').default
    return new Vapi(config)
  } catch (error) {
    console.warn('[Vapi] Falling back to mock implementation:', error)
    return new MockVapi(config)
  }
} 