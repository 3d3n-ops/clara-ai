"use client"

import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Card, CardContent } from '@/components/ui/card'
import { Mic, MicOff, Send, User, Bot, Volume2 } from 'lucide-react'
import { QRCode } from '@/components/qr-code'
import { cn } from '@/lib/utils'

export default function DemoPage() {
  const [isLoaded, setIsLoaded] = useState(false)
  const [currentSection, setCurrentSection] = useState(1)
  const [isRecording, setIsRecording] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const [inputMessage, setInputMessage] = useState("")
  const [messages, setMessages] = useState<Array<{id: string, type: 'user' | 'assistant', content: string}>>([])
  const [isTyping, setIsTyping] = useState(false)
  const [interactiveMessages, setInteractiveMessages] = useState<Array<{id: string, type: 'user' | 'assistant', content: string}>>([])
  const [personalizedMessages, setPersonalizedMessages] = useState<Array<{id: string, type: 'user' | 'assistant', content: string}>>([])
  const [interactiveInput, setInteractiveInput] = useState("")
  const [personalizedInput, setPersonalizedInput] = useState("")
  const [isInteractiveTyping, setIsInteractiveTyping] = useState(false)
  const [isPersonalizedTyping, setIsPersonalizedTyping] = useState(false)
  const [isPlayingTTS, setIsPlayingTTS] = useState(false)

  useEffect(() => {
    // Trigger fade-in animation after component mounts
    const timer = setTimeout(() => {
      setIsLoaded(true)
    }, 100)

    return () => clearTimeout(timer)
  }, [])

  const handleBeginClick = () => {
    setCurrentSection(2)
    // Initialize interactive chat with Clara's first message
    if (interactiveMessages.length === 0) {
      const initialMessage = {
        id: Date.now().toString(),
        type: 'assistant' as const,
        content: "Hi! My name is Clara! What's your name?"
      }
      setInteractiveMessages([initialMessage])
    }
  }

  const handleNextClick = () => {
    setCurrentSection(3)
    // Initialize personalized chat with Clara's first message
    if (personalizedMessages.length === 0) {
      const initialMessage = {
        id: Date.now().toString(),
        type: 'assistant' as const,
        content: "Hello! I'm Clara, your AI study assistant. I'm here to help you with whatever you need - whether it's explaining concepts, creating study materials, or just having a conversation about your learning goals. What would you like to work on today?"
      }
      setPersonalizedMessages([initialMessage])
    }
  }

  const handleNextClick2 = () => {
    setCurrentSection(4)
  }

  const handleNextClick3 = () => {
    setCurrentSection(5)
  }

  const handleNextClick4 = () => {
    setCurrentSection(6)
  }

  const handleNextClick5 = () => {
    setCurrentSection(7)
  }

  const handleNextClick6 = () => {
    setCurrentSection(8)
  }

  const toggleRecording = async () => {
    if (isRecording) {
      // Stop recording and process
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

  const handleSendMessage = async () => {
    if (!inputMessage.trim()) return

    const userMessage = {
      id: Date.now().toString(),
      type: 'user' as const,
      content: inputMessage
    }

    setMessages(prev => [...prev, userMessage])
    setInputMessage("")
    setIsTyping(true)

    try {
      // Use multimodal chat API
      const response = await fetch('/api/multimodal/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: inputMessage,
          context: {
            isScreenSharing: false,
            previousMessages: messages.slice(-5),
            demoMode: 'multimodal'
          }
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to get response')
      }

      const data = await response.json()
      
      const assistantMessage = {
        id: (Date.now() + 1).toString(),
        type: 'assistant' as const,
        content: data.response || "I'm here to help! Try asking me to create flashcards, quizzes, or diagrams."
      }

      setMessages(prev => [...prev, assistantMessage])

    } catch (error) {
      console.error('Error sending message:', error)
      
      const errorMessage = {
        id: (Date.now() + 1).toString(),
        type: 'assistant' as const,
        content: "Sorry, I'm having trouble processing that. Try asking me to create flashcards, quizzes, or diagrams!"
      }
      
      setMessages(prev => [...prev, errorMessage])
    } finally {
      setIsTyping(false)
    }
  }

  const handleInteractiveSend = async () => {
    if (!interactiveInput.trim()) return

    const userMessage = {
      id: Date.now().toString(),
      type: 'user' as const,
      content: interactiveInput
    }

    setInteractiveMessages(prev => [...prev, userMessage])
    setInteractiveInput("")
    setIsInteractiveTyping(true)

    try {
      const response = await fetch('/api/multimodal/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: interactiveInput,
          context: {
            isScreenSharing: false,
            previousMessages: interactiveMessages.slice(-5),
            demoMode: 'interactive'
          }
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to get response')
      }

      const data = await response.json()
      
      const assistantMessage = {
        id: (Date.now() + 1).toString(),
        type: 'assistant' as const,
        content: data.response || "Hi! I'm Clara! What's your name?"
      }

      setInteractiveMessages(prev => [...prev, assistantMessage])

    } catch (error) {
      console.error('Error sending message:', error)
      
      const errorMessage = {
        id: (Date.now() + 1).toString(),
        type: 'assistant' as const,
        content: "Sorry, I'm having trouble processing that. Let's try again!"
      }
      
      setInteractiveMessages(prev => [...prev, errorMessage])
    } finally {
      setIsInteractiveTyping(false)
    }
  }

  const handlePersonalizedSend = async () => {
    if (!personalizedInput.trim()) return

    const userMessage = {
      id: Date.now().toString(),
      type: 'user' as const,
      content: personalizedInput
    }

    setPersonalizedMessages(prev => [...prev, userMessage])
    setPersonalizedInput("")
    setIsPersonalizedTyping(true)

    try {
      const response = await fetch('/api/multimodal/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: personalizedInput,
          context: {
            isScreenSharing: false,
            previousMessages: personalizedMessages.slice(-5),
            demoMode: 'personalized'
          }
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to get response')
      }

      const data = await response.json()
      
      const assistantMessage = {
        id: (Date.now() + 1).toString(),
        type: 'assistant' as const,
        content: data.response || "Hello! I'm Clara, your AI study assistant. I'm here to help you with whatever you need!"
      }

      setPersonalizedMessages(prev => [...prev, assistantMessage])

    } catch (error) {
      console.error('Error sending message:', error)
      
      const errorMessage = {
        id: (Date.now() + 1).toString(),
        type: 'assistant' as const,
        content: "Sorry, I'm having trouble processing that. Let's try again!"
      }
      
      setPersonalizedMessages(prev => [...prev, errorMessage])
    } finally {
      setIsPersonalizedTyping(false)
    }
  }

  const playTTS = async (text: string) => {
    if (isPlayingTTS) return
    
    setIsPlayingTTS(true)
    
    try {
      console.log('[Demo] Requesting TTS for text:', text.substring(0, 50) + '...')
      
      // Try ElevenLabs TTS first
      const response = await fetch('/api/tts/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text: text,
          voice_id: '21m00Tcm4TlvDq8ikWAM' // Rachel voice
        }),
      })

      console.log('[Demo] TTS response status:', response.status)

      if (!response.ok) {
        const errorData = await response.json()
        console.error('[Demo] TTS API error:', errorData)
        
        // Fallback to browser speech synthesis
        console.log('[Demo] Falling back to browser speech synthesis')
        if ('speechSynthesis' in window) {
          const utterance = new SpeechSynthesisUtterance(text)
          utterance.rate = 0.9
          utterance.pitch = 1.1
          utterance.volume = 0.8
          
          // Try to find a female voice
          const voices = speechSynthesis.getVoices()
          const femaleVoice = voices.find(voice => 
            voice.name.toLowerCase().includes('female') || 
            voice.name.toLowerCase().includes('woman') ||
            voice.name.toLowerCase().includes('girl')
          )
          if (femaleVoice) {
            utterance.voice = femaleVoice
          }
          
          utterance.onend = () => {
            console.log('[Demo] Browser TTS ended')
            setIsPlayingTTS(false)
          }
          utterance.onerror = (e) => {
            console.error('[Demo] Browser TTS error:', e)
            setIsPlayingTTS(false)
          }
          
          speechSynthesis.speak(utterance)
          console.log('[Demo] Browser TTS started')
          return
        } else {
          throw new Error(`TTS failed: ${errorData.error} - ${errorData.details || ''}`)
        }
      }

      const data = await response.json()
      console.log('[Demo] TTS response data:', { success: data.success, hasAudio: !!data.audioUrl })
      
      if (data.success && data.audioUrl) {
        const audio = new Audio(data.audioUrl)
        audio.onended = () => {
          console.log('[Demo] TTS playback ended')
          setIsPlayingTTS(false)
        }
        audio.onerror = (e) => {
          console.error('[Demo] TTS playback error:', e)
          setIsPlayingTTS(false)
        }
        await audio.play()
        console.log('[Demo] TTS playback started')
      } else {
        throw new Error('No audio URL received from TTS API')
      }
    } catch (error) {
      console.error('[Demo] TTS error:', error)
      setIsPlayingTTS(false)
      
      // Show error to user (you could add a toast notification here)
      alert(`TTS Error: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  // First Section - Original Landing
  if (currentSection === 1) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center p-4">
        <div className="text-center space-y-8 max-w-2xl mx-auto">
          {/* Main Heading */}
          <h1 
            className={`text-5xl md:text-6xl font-bold text-gray-900 transition-all duration-1000 ease-out ${
              isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
            }`}
          >
            A new mode of learning
          </h1>

          {/* Subtitle */}
          <p 
            className={`text-xl md:text-2xl text-gray-700 font-instrument-serif italic transition-all duration-1000 ease-out delay-300 ${
              isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
            }`}
          >
            that's interactive, personalized, and multimodal.
          </p>

          {/* Circular Background Image */}
          <div 
            className={`relative w-64 h-64 mx-auto transition-all duration-1000 ease-out delay-600 ${
              isLoaded ? 'opacity-100 scale-100' : 'opacity-0 scale-95'
            }`}
          >
            <div 
              className="absolute inset-0 rounded-full overflow-hidden"
              style={{
                background: `url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjU2IiBoZWlnaHQ9IjI1NiIgdmlld0JveD0iMCAwIDI1NiAyNTYiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIyNTYiIGhlaWdodD0iMjU2IiBmaWxsPSJ1cmwoI2dyYWRpZW50KSIvPgo8ZGVmcz4KPGxpbmVhckdyYWRpZW50IGlkPSJncmFkaWVudCIgeDE9IjAiIHkxPSIwIiB4Mj0iMjU2IiB5Mj0iMjU2IiBncmFkaWVudFVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+CjxzdG9wIG9mZnNldD0iMCUiIHN0eWxlPSJzdG9wLWNvbG9yOiNmZmY7c3RvcC1vcGFjaXR5OjEiLz4KPHN0b3Agb2Zmc2V0PSIxNSUiIHN0eWxlPSJzdG9wLWNvbG9yOiNmMGYwZmY7c3RvcC1vcGFjaXR5OjEiLz4KPHN0b3Agb2Zmc2V0PSI0MCUiIHN0eWxlPSJzdG9wLWNvbG9yOiNjN2M3ZTg7c3RvcC1vcGFjaXR5OjEiLz4KPHN0b3Agb2Zmc2V0PSI2MCUiIHN0eWxlPSJzdG9wLWNvbG9yOiM5M2M1ZmQ7c3RvcC1vcGFjaXR5OjEiLz4KPHN0b3Agb2Zmc2V0PSI4MCUiIHN0eWxlPSJzdG9wLWNvbG9yOiM2MGE1ZmE7c3RvcC1vcGFjaXR5OjEiLz4KPHN0b3Agb2Zmc2V0PSIxMDAlIiBzdHlsZT0ic3RvcC1jb2xvcjojM2I4MmY2O3N0b3Atb3BhY2l0eToxIi8+CjwvbGluZWFyR3JhZGllbnQ+CjwvZGVmcz4KPC9zdmc+')`,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                filter: 'blur(2px)',
              }}
            />
            <div 
              className="absolute inset-2 rounded-full overflow-hidden"
              style={{
                background: `url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjU2IiBoZWlnaHQ9IjI1NiIgdmlld0JveD0iMCAwIDI1NiAyNTYiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIyNTYiIGhlaWdodD0iMjU2IiBmaWxsPSJ1cmwoI2dyYWRpZW50KSIvPgo8ZGVmcz4KPGxpbmVhckdyYWRpZW50IGlkPSJncmFkaWVudCIgeDE9IjAiIHkxPSIwIiB4Mj0iMjU2IiB5Mj0iMjU2IiBncmFkaWVudFVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+CjxzdG9wIG9mZnNldD0iMCUiIHN0eWxlPSJzdG9wLWNvbG9yOiNmZmY7c3RvcC1vcGFjaXR5OjEiLz4KPHN0b3Agb2Zmc2V0PSIxNSUiIHN0eWxlPSJzdG9wLWNvbG9yOiNmMGYwZmY7c3RvcC1vcGFjaXR5OjEiLz4KPHN0b3Agb2Zmc2V0PSI0MCUiIHN0eWxlPSJzdG9wLWNvbG9yOiNjN2M3ZTg7c3RvcC1vcGFjaXR5OjEiLz4KPHN0b3Agb2Zmc2V0PSI2MCUiIHN0eWxlPSJzdG9wLWNvbG9yOiM5M2M1ZmQ7c3RvcC1vcGFjaXR5OjEiLz4KPHN0b3Agb2Zmc2V0PSI4MCUiIHN0eWxlPSJzdG9wLWNvbG9yOiM2MGE1ZmE7c3RvcC1vcGFjaXR5OjEiLz4KPHN0b3Agb2Zmc2V0PSIxMDAlIiBzdHlsZT0ic3RvcC1jb2xvcjojM2I4MmY2O3N0b3Atb3BhY2l0eToxIi8+CjwvbGluZWFyR3JhZGllbnQ+CjwvZGVmcz4KPC9zdmc+')`,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
              }}
            />
          </div>

          {/* Call to Action Button */}
          <div 
            className={`transition-all duration-1000 ease-out delay-900 ${
              isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
            }`}
          >
            <Button 
              size="lg" 
              className="bg-black hover:bg-gray-800 text-white px-8 py-3 text-lg font-semibold rounded-lg transition-all duration-300 hover:scale-105"
              onClick={handleBeginClick}
            >
              Begin!
            </Button>
          </div>
        </div>
      </div>
    )
  }

  // Second Section - Interactive Chat
  if (currentSection === 2) {
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center p-4">
        {/* Heading */}
        <h2 
          className={`text-3xl md:text-4xl font-instrument-serif italic text-gray-900 mb-8 text-center transition-all duration-1000 ease-out ${
            isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
          }`}
        >
          It's interactive!
        </h2>

        {/* Chat Container */}
        <div 
          className={`w-full max-w-4xl h-[600px] transition-all duration-1000 ease-out delay-600 ${
            isLoaded ? 'opacity-100 scale-100' : 'opacity-0 scale-95'
          }`}
        >
          <Card className="h-full flex flex-col">
            {/* Chat Header */}
            <div className="p-4 border-b bg-gradient-to-r from-blue-50 to-indigo-50">
              <h3 className="font-semibold text-lg text-center">Interactive Chat with Clara</h3>
            </div>

            {/* Messages Area */}
            <CardContent className="flex-1 p-0 overflow-hidden">
              <ScrollArea className="h-full">
                <div className="p-4 space-y-4 min-h-full">
                  {interactiveMessages.length === 0 ? (
                    <div className="text-center text-gray-500 mt-8">
                      <p>Clara will start the conversation!</p>
                    </div>
                  ) : (
                    interactiveMessages.map((message) => (
                      <div
                        key={message.id}
                        className={cn(
                          "flex items-start space-x-3",
                          message.type === 'user' ? 'flex-row-reverse space-x-reverse' : ''
                        )}
                      >
                        {/* Avatar */}
                        <div className={cn(
                          "w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0",
                          message.type === 'user' 
                            ? 'bg-blue-500 text-white' 
                            : 'bg-purple-500 text-white'
                        )}>
                          {message.type === 'user' ? (
                            <User className="w-4 h-4" />
                          ) : (
                            <Bot className="w-4 h-4" />
                          )}
                        </div>

                        {/* Message Content */}
                        <div className={cn(
                          "flex-1 max-w-[80%]",
                          message.type === 'user' ? 'text-right' : ''
                        )}>
                          <div className={cn(
                            "rounded-2xl px-4 py-2 text-sm",
                            message.type === 'user'
                              ? 'bg-blue-500 text-white ml-auto inline-block'
                              : 'bg-gray-100 text-gray-900'
                          )}>
                            <p className="whitespace-pre-wrap">{message.content}</p>
                            {/* TTS Button for AI messages */}
                            {message.type === 'assistant' && (
                              <div className="mt-2 flex justify-start">
                                <button
                                  onClick={() => playTTS(message.content)}
                                  disabled={isPlayingTTS}
                                  className={cn(
                                    "flex items-center gap-1 text-xs text-gray-500 hover:text-gray-700 transition-colors",
                                    isPlayingTTS && "opacity-50 cursor-not-allowed"
                                  )}
                                >
                                  <Volume2 className="w-3 h-3" />
                                  {isPlayingTTS ? 'Playing...' : 'Listen'}
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    ))
                  )}

                  {/* Typing indicator */}
                  {isInteractiveTyping && (
                    <div className="flex items-start space-x-3">
                      <div className="w-8 h-8 rounded-full bg-purple-500 text-white flex items-center justify-center flex-shrink-0">
                        <Bot className="w-4 h-4" />
                      </div>
                      <div className="bg-gray-100 rounded-2xl px-4 py-2">
                        <div className="flex space-x-1">
                          <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                          <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
                          <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </ScrollArea>
            </CardContent>

            {/* Input Area */}
            <div className="p-4 border-t">
              <div className="flex items-center space-x-2">
                <Input
                  value={interactiveInput}
                  onChange={(e) => setInteractiveInput(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault()
                      handleInteractiveSend()
                    }
                  }}
                  placeholder="Type your message..."
                  disabled={isInteractiveTyping}
                  className="flex-1"
                />
                <Button 
                  onClick={handleInteractiveSend}
                  disabled={!interactiveInput.trim() || isInteractiveTyping}
                  size="sm"
                >
                  <Send className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </Card>
        </div>

        {/* Next Button */}
        <div 
          className={`flex justify-end w-full max-w-4xl mt-4 transition-all duration-1000 ease-out delay-900 ${
            isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
          }`}
        >
          <Button 
            variant="outline"
            className="bg-gray-100 border-gray-300 text-gray-900 hover:bg-gray-200 px-6 py-2 rounded-lg"
            onClick={handleNextClick}
          >
            Next
          </Button>
        </div>
      </div>
    )
  }

  // Third Section - Personalized Chat
  if (currentSection === 3) {
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center p-4">
        {/* Heading */}
        <h2 
          className={`text-3xl md:text-4xl font-instrument-serif italic text-gray-900 mb-8 text-center transition-all duration-1000 ease-out ${
            isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
          }`}
        >
          It's personalized!
        </h2>

        {/* Chat Container */}
        <div 
          className={`w-full max-w-4xl h-[600px] transition-all duration-1000 ease-out delay-600 ${
            isLoaded ? 'opacity-100 scale-100' : 'opacity-0 scale-95'
          }`}
        >
          <Card className="h-full flex flex-col">
            {/* Chat Header */}
            <div className="p-4 border-b bg-gradient-to-r from-purple-50 to-pink-50">
              <h3 className="font-semibold text-lg text-center">Personalized Study Assistant</h3>
            </div>

            {/* Messages Area */}
            <CardContent className="flex-1 p-0 overflow-hidden">
              <ScrollArea className="h-full">
                <div className="p-4 space-y-4 min-h-full">
                  {personalizedMessages.length === 0 ? (
                    <div className="text-center text-gray-500 mt-8">
                      <p>Clara will offer personalized study help!</p>
                    </div>
                  ) : (
                    personalizedMessages.map((message) => (
                      <div
                        key={message.id}
                        className={cn(
                          "flex items-start space-x-3",
                          message.type === 'user' ? 'flex-row-reverse space-x-reverse' : ''
                        )}
                      >
                        {/* Avatar */}
                        <div className={cn(
                          "w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0",
                          message.type === 'user' 
                            ? 'bg-blue-500 text-white' 
                            : 'bg-purple-500 text-white'
                        )}>
                          {message.type === 'user' ? (
                            <User className="w-4 h-4" />
                          ) : (
                            <Bot className="w-4 h-4" />
                          )}
                        </div>

                        {/* Message Content */}
                        <div className={cn(
                          "flex-1 max-w-[80%]",
                          message.type === 'user' ? 'text-right' : ''
                        )}>
                          <div className={cn(
                            "rounded-2xl px-4 py-2 text-sm",
                            message.type === 'user'
                              ? 'bg-blue-500 text-white ml-auto inline-block'
                              : 'bg-gray-100 text-gray-900'
                          )}>
                            <p className="whitespace-pre-wrap">{message.content}</p>
                            {/* TTS Button for AI messages */}
                            {message.type === 'assistant' && (
                              <div className="mt-2 flex justify-start">
                                <button
                                  onClick={() => playTTS(message.content)}
                                  disabled={isPlayingTTS}
                                  className={cn(
                                    "flex items-center gap-1 text-xs text-gray-500 hover:text-gray-700 transition-colors",
                                    isPlayingTTS && "opacity-50 cursor-not-allowed"
                                  )}
                                >
                                  <Volume2 className="w-3 h-3" />
                                  {isPlayingTTS ? 'Playing...' : 'Listen'}
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    ))
                  )}

                  {/* Typing indicator */}
                  {isPersonalizedTyping && (
                    <div className="flex items-start space-x-3">
                      <div className="w-8 h-8 rounded-full bg-purple-500 text-white flex items-center justify-center flex-shrink-0">
                        <Bot className="w-4 h-4" />
                      </div>
                      <div className="bg-gray-100 rounded-2xl px-4 py-2">
                        <div className="flex space-x-1">
                          <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                          <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
                          <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </ScrollArea>
            </CardContent>

            {/* Input Area */}
            <div className="p-4 border-t">
              <div className="flex items-center space-x-2">
                <Input
                  value={personalizedInput}
                  onChange={(e) => setPersonalizedInput(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault()
                      handlePersonalizedSend()
                    }
                  }}
                  placeholder="Ask for study help..."
                  disabled={isPersonalizedTyping}
                  className="flex-1"
                />
                <Button 
                  onClick={handlePersonalizedSend}
                  disabled={!personalizedInput.trim() || isPersonalizedTyping}
                  size="sm"
                >
                  <Send className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </Card>
        </div>

        {/* Next Button */}
        <div 
          className={`flex justify-end w-full max-w-4xl mt-4 transition-all duration-1000 ease-out delay-900 ${
            isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
          }`}
        >
          <Button 
            variant="outline"
            className="bg-gray-100 border-gray-300 text-gray-900 hover:bg-gray-200 px-6 py-2 rounded-lg"
            onClick={handleNextClick2}
          >
            Next
          </Button>
        </div>
      </div>
    )
  }

  // Fourth Section - Multimodal
  if (currentSection === 4) {
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center p-4">
        {/* Heading - Above rectangle */}
        <h2 
          className={`text-3xl md:text-4xl font-instrument-serif italic text-gray-900 mb-8 text-center transition-all duration-1000 ease-out ${
            isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
          }`}
        >
          It's multimodal!
        </h2>

        {/* Main Content Area */}
        <div className="flex-1 flex items-center justify-center">
          <div 
            className={`relative w-full max-w-7xl h-[600px] transition-all duration-1000 ease-out delay-600 ${
              isLoaded ? 'opacity-100 scale-100' : 'opacity-0 scale-95'
            }`}
          >
            {/* Left Section - Gray Rectangle for Multimodal Content */}
            <div className="absolute left-0 top-0 w-2/3 h-full">
              <div className="w-full h-full bg-gray-200 rounded-2xl shadow-lg overflow-hidden">
                {/* Chat Messages */}
                <div className="h-full p-4 overflow-y-auto">
                  {messages.length === 0 ? (
                    <div className="text-center text-gray-500 mt-8">
                      <p>Ask me to create flashcards, quizzes, or diagrams!</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {messages.map((message) => (
                        <div
                          key={message.id}
                          className={`flex gap-2 text-sm ${
                            message.type === 'user' ? 'justify-end' : 'justify-start'
                          }`}
                        >
                          <div
                            className={`max-w-[80%] rounded-lg px-3 py-2 ${
                              message.type === 'user'
                                ? 'bg-blue-600 text-white'
                                : 'bg-gray-100 text-gray-900'
                            }`}
                          >
                            {message.content}
                          </div>
                        </div>
                      ))}
                      {isTyping && (
                        <div className="flex gap-2 justify-start">
                          <div className="bg-gray-100 rounded-lg px-3 py-2 text-sm">
                            <div className="flex space-x-1">
                              <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                              <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                              <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Right Section - Circular Mic Element */}
            <div className="absolute right-8 top-1/2 transform -translate-y-1/2">
              <div className="relative">
                {/* Circular Background with Yellow/Pink Gradient */}
                <div 
                  className="w-40 h-40 rounded-full shadow-lg flex items-center justify-center"
                  style={{
                    background: `url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTYwIiBoZWlnaHQ9IjE2MCIgdmlld0JveD0iMCAwIDE2MCAxNjAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIxNjAiIGhlaWdodD0iMTYwIiBmaWxsPSJ1cmwoI2dyYWRpZW50KSIvPgo8ZGVmcz4KPGxpbmVhckdyYWRpZW50IGlkPSJncmFkaWVudCIgeDE9IjAiIHkxPSIwIiB4Mj0iMTYwIiB5Mj0iMTYwIiBncmFkaWVudFVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+CjxzdG9wIG9mZnNldD0iMCUiIHN0eWxlPSJzdG9wLWNvbG9yOiNmZmZmMDA7c3RvcC1vcGFjaXR5OjEiLz4KPHN0b3Agb2Zmc2V0PSIzMCUiIHN0eWxlPSJzdG9wLWNvbG9yOiNmZmZmMDA7c3RvcC1vcGFjaXR5OjEiLz4KPHN0b3Agb2Zmc2V0PSI2MCUiIHN0eWxlPSJzdG9wLWNvbG9yOiNmZmZmMDA7c3RvcC1vcGFjaXR5OjEiLz4KPHN0b3Agb2Zmc2V0PSI4MCUiIHN0eWxlPSJzdG9wLWNvbG9yOiNmZmZmMDA7c3RvcC1vcGFjaXR5OjEiLz4KPHN0b3Agb2Zmc2V0PSIxMDAlIiBzdHlsZT0ic3RvcC1jb2xvcjojZmZmZmZmO3N0b3Atb3BhY2l0eToxIi8+CjwvbGluZWFyR3JhZGllbnQ+CjwvZGVmcz4KPC9zdmc+')`,
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                  }}
                >
                  {/* Mic Icon */}
                  <button
                    onClick={toggleRecording}
                    className={`w-16 h-16 rounded-full flex items-center justify-center transition-all duration-300 ${
                      isRecording
                        ? 'bg-red-500 hover:bg-red-600 animate-pulse' 
                        : 'bg-white hover:bg-gray-100 shadow-lg'
                    }`}
                  >
                    {isRecording ? (
                      <MicOff className="w-8 h-8 text-white" />
                    ) : (
                      <Mic className="w-8 h-8 text-gray-600" />
                    )}
                  </button>
                </div>
                
                {/* Recording Indicator */}
                {isRecording && (
                  <div className="absolute -top-2 -right-2 w-4 h-4 bg-red-500 rounded-full animate-ping" />
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Chat Input Section */}
        <div className={`w-full max-w-7xl mt-4 transition-all duration-1000 ease-out delay-900 ${
          isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
        }`}>
          <div className="flex gap-2 items-center">
            <Input
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyPress={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault()
                  handleSendMessage()
                }
              }}
              placeholder="Ask me to create flashcards, quizzes, or diagrams..."
              className="flex-1"
            />
            <Button
              onClick={handleSendMessage}
              disabled={!inputMessage.trim() || isTyping}
              size="sm"
            >
              Send
            </Button>
          </div>
        </div>

        {/* Next Button - Bottom Right */}
        <div 
          className={`flex justify-end w-full max-w-7xl mt-4 transition-all duration-1000 ease-out delay-900 ${
            isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
          }`}
        >
          <Button 
            variant="outline"
            className="bg-gray-100 border-gray-300 text-gray-900 hover:bg-gray-200 px-6 py-2 rounded-lg"
            onClick={handleNextClick3}
          >
            Next
          </Button>
        </div>
      </div>
    )
  }

  // Fifth Section - "We are revolutionizing the way humans will learn forever"
  if (currentSection === 5) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center p-4">
        <div className="text-center space-y-8 max-w-4xl mx-auto">
          {/* Main Heading */}
          <h1 
            className={`text-5xl md:text-6xl font-bold text-gray-900 transition-all duration-1000 ease-out ${
              isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
            }`}
          >
            We are revolutionizing the way
          </h1>
          
          {/* Second Line */}
          <h2 
            className={`text-5xl md:text-6xl font-bold text-gray-900 transition-all duration-1000 ease-out delay-300 ${
              isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
            }`}
          >
            humans will learn{' '}
            <span className="font-instrument-serif italic text-4xl md:text-5xl">forever</span>
          </h2>

          {/* Next Button */}
          <div 
            className={`mt-12 transition-all duration-1000 ease-out delay-600 ${
              isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
            }`}
          >
            <Button 
              variant="outline"
              className="bg-gray-100 border-gray-300 text-gray-900 hover:bg-gray-200 px-6 py-2 rounded-lg"
              onClick={handleNextClick4}
            >
              Next
            </Button>
          </div>
        </div>
      </div>
    )
  }

  // Sixth Section - List of "No more" statements
  if (currentSection === 6) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center p-4">
        <div className="text-center space-y-8 max-w-4xl mx-auto">
          {/* List of Points */}
          <div 
            className={`space-y-6 transition-all duration-1000 ease-out ${
              isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
            }`}
          >
            <p className="text-3xl md:text-4xl">
              <span className="font-bold">No more</span>{' '}
              <span className="font-instrument-serif italic">outdated textbooks</span>
            </p>
            <p className="text-3xl md:text-4xl">
              <span className="font-bold">No more</span>{' '}
              <span className="font-instrument-serif italic">boring lectures</span>
            </p>
            <p className="text-3xl md:text-4xl">
              <span className="font-bold">No more</span>{' '}
              <span className="font-instrument-serif italic">Youtube tutorials</span>
            </p>
            <p className="text-3xl md:text-4xl">
              <span className="font-bold">No more</span>{' '}
              <span className="font-instrument-serif italic">lame teachers & tutors</span>
            </p>
          </div>

          {/* Next Button */}
          <div 
            className={`mt-12 transition-all duration-1000 ease-out delay-600 ${
              isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
            }`}
          >
            <Button 
              variant="outline"
              className="bg-gray-100 border-gray-300 text-gray-900 hover:bg-gray-200 px-6 py-2 rounded-lg"
              onClick={handleNextClick5}
            >
              Next
            </Button>
          </div>
        </div>
      </div>
    )
  }

  // Seventh Section - "This is the turning point of learning" with QR Code
  if (currentSection === 7) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center p-4">
        <div className="text-center space-y-8 max-w-2xl mx-auto">
          {/* Main Heading */}
          <h1 
            className={`text-5xl md:text-6xl font-bold text-gray-900 transition-all duration-1000 ease-out ${
              isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
            }`}
          >
            This is the turning point of learning
          </h1>

          {/* QR Code */}
          <div 
            className={`transition-all duration-1000 ease-out delay-600 ${
              isLoaded ? 'opacity-100 scale-100' : 'opacity-0 scale-95'
            }`}
          >
            <QRCode />
          </div>

          {/* Next Button */}
          <div 
            className={`mt-8 transition-all duration-1000 ease-out delay-900 ${
              isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
            }`}
          >
            <Button 
              variant="outline"
              className="bg-gray-100 border-gray-300 text-gray-900 hover:bg-gray-200 px-6 py-2 rounded-lg"
              onClick={handleNextClick6}
            >
              Next
            </Button>
          </div>
        </div>
      </div>
    )
  }

  // Eighth Section - Final call to action
  if (currentSection === 8) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center p-4">
        <div className="text-center space-y-8 max-w-4xl mx-auto">
          {/* Main Heading */}
          <h1 
            className={`text-5xl md:text-6xl font-bold text-gray-900 transition-all duration-1000 ease-out ${
              isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
            }`}
          >
            Join the revolution
          </h1>
          
          {/* Subtitle */}
          <p 
            className={`text-xl md:text-2xl text-gray-700 font-instrument-serif italic transition-all duration-1000 ease-out delay-300 ${
              isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
            }`}
          >
            Experience the future of education today
          </p>

          {/* Call to Action Button */}
          <div 
            className={`transition-all duration-1000 ease-out delay-600 ${
              isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
            }`}
          >
            <Button 
              size="lg" 
              className="bg-black hover:bg-gray-800 text-white px-8 py-3 text-lg font-semibold rounded-lg transition-all duration-300 hover:scale-105"
              onClick={() => setCurrentSection(1)}
            >
              Start Over
            </Button>
          </div>
        </div>
      </div>
    )
  }
}
