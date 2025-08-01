"use client"

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ArrowLeft, Mic, MicOff, Volume2, MessageSquare } from 'lucide-react'
import Link from 'next/link'

export default function ElevenLabsDemoPage() {
  const [isConnected, setIsConnected] = useState(false)
  const [isRecording, setIsRecording] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const [messages, setMessages] = useState<Array<{id: string, type: 'user' | 'assistant', content: string}>>([])

  // Simulate connection on mount
  useEffect(() => {
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

  const handleSendMessage = async (message: string) => {
    const userMessage = {
      id: Date.now().toString(),
      type: 'user' as const,
      content: message
    }

    setMessages(prev => [...prev, userMessage])

    try {
      // Call ElevenLabs API
      const response = await fetch('/api/elevenlabs/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: message,
          agent_id: 'h31FVt7CMU4ALZLMnpe8'
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
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <Link href="/dashboard">
                <Button variant="ghost" size="sm">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back to Dashboard
                </Button>
              </Link>
              <div className="h-6 w-px bg-gray-300" />
              <h1 className="text-xl font-semibold text-gray-900">ElevenLabs Voice Agent Demo</h1>
            </div>
            <div className="flex items-center space-x-2">
              <div className={`w-3 h-3 rounded-full ${isConnected ? 'bg-green-500' : 'bg-gray-400'}`} />
              <span className="text-sm text-gray-600">
                {isConnected ? 'Connected' : 'Connecting...'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Voice Interface */}
          <div className="lg:col-span-2">
            <Card className="h-[600px] flex flex-col">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Mic className="w-5 h-5" />
                  <span>Voice Interface</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="flex-1 flex items-center justify-center">
                <div className="text-center space-y-8">
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
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Chat Interface */}
          <div className="lg:col-span-1">
            <Card className="h-[600px] flex flex-col">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <MessageSquare className="w-5 h-5" />
                  <span>Chat History</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="flex-1 flex flex-col">
                {/* Messages */}
                <div className="flex-1 overflow-y-auto space-y-4 mb-4">
                  {messages.length === 0 ? (
                    <div className="text-center text-gray-500 mt-8">
                      <p>Start a conversation with Clara!</p>
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
                    </div>
                  )}
                </div>

                {/* Quick Actions */}
                <div className="space-y-2">
                  <p className="text-sm font-medium text-gray-700">Quick Actions:</p>
                  <div className="grid grid-cols-2 gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleSendMessage("Create flashcards for photosynthesis")}
                      className="text-xs"
                    >
                      Create Flashcards
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleSendMessage("Generate a quiz about math")}
                      className="text-xs"
                    >
                      Generate Quiz
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleSendMessage("Draw a diagram of the water cycle")}
                      className="text-xs"
                    >
                      Create Diagram
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleSendMessage("Explain quantum physics simply")}
                      className="text-xs"
                    >
                      Explain Topic
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Info Section */}
        <div className="mt-8">
          <Card>
            <CardHeader>
              <CardTitle>About This Demo</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                <div>
                  <h4 className="font-semibold mb-2">Voice Agent</h4>
                  <p className="text-gray-600">
                    This demo uses ElevenLabs' voice agent technology to provide an interactive learning experience.
                  </p>
                </div>
                <div>
                  <h4 className="font-semibold mb-2">Agent ID</h4>
                  <p className="text-gray-600">
                    Using agent ID: <code className="bg-gray-100 px-1 rounded">h31FVt7CMU4ALZLMnpe8</code>
                  </p>
                </div>
                <div>
                  <h4 className="font-semibold mb-2">Features</h4>
                  <p className="text-gray-600">
                    Voice interaction, text chat, and quick action buttons for testing different scenarios.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
} 