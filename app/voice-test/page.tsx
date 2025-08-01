"use client"

import React, { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import { 
  Send, 
  MessageSquare, 
  User,
  Bot,
  Play,
  StopCircle,
  Lightbulb,
  Users,
  Sparkles
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface Message {
  id: string
  type: 'user' | 'assistant'
  content: string
  timestamp: Date
}

type DemoMode = 'interactive' | 'personalized'

export default function VoiceTestPage() {
  const [messages, setMessages] = useState<Message[]>([])
  const [textInput, setTextInput] = useState("")
  const [isTyping, setIsTyping] = useState(false)
  const [isInSession, setIsInSession] = useState(false)
  const [demoMode, setDemoMode] = useState<DemoMode>('interactive')
  const scrollAreaRef = React.useRef<HTMLDivElement>(null)

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (scrollAreaRef.current) {
      const scrollElement = scrollAreaRef.current.querySelector('[data-radix-scroll-area-viewport]')
      if (scrollElement) {
        scrollElement.scrollTop = scrollElement.scrollHeight
      }
    }
  }, [messages])

  const startSession = (mode: DemoMode) => {
    setDemoMode(mode)
    setIsInSession(true)
    
    // AI initiates the conversation based on mode
    const initialMessage = mode === 'interactive' 
      ? "Hi! My name is Clara! What's your name?"
      : "Hello! I'm Clara, your AI study assistant. I'm here to help you with whatever you need - whether it's explaining concepts, creating study materials, or just having a conversation about your learning goals. What would you like to work on today?"
    
    const aiMessage: Message = {
      id: Date.now().toString(),
      type: 'assistant',
      content: initialMessage,
      timestamp: new Date()
    }
    
    setMessages([aiMessage])
  }

  const endSession = () => {
    setIsInSession(false)
    setMessages([])
    setTextInput("")
  }

  const handleSendText = async () => {
    if (!textInput.trim()) return

    const userMessage: Message = {
      id: Date.now().toString(),
      type: 'user',
      content: textInput,
      timestamp: new Date()
    }

    setMessages(prev => [...prev, userMessage])
    setTextInput("")
    setIsTyping(true)

    try {
      const response = await fetch('/api/multimodal/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: textInput,
          context: {
            isScreenSharing: false,
            previousMessages: messages.slice(-5),
            demoMode
          }
        }),
      })

      const data = await response.json()
      
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        type: 'assistant',
        content: data.response || "I'm having trouble processing that right now. Could you try again?",
        timestamp: new Date()
      }

      setMessages(prev => [...prev, assistantMessage])
    } catch (error) {
      console.error('Chat error:', error)
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        type: 'assistant',
        content: "I'm having trouble connecting right now. Please try again.",
        timestamp: new Date()
      }
      setMessages(prev => [...prev, errorMessage])
    } finally {
      setIsTyping(false)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSendText()
    }
  }

  if (isInSession) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="container mx-auto p-4">
          <div className="max-w-4xl mx-auto">
            {/* Header */}
            <div className="text-center mb-6">
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                Clara AI Demo - {demoMode === 'interactive' ? 'Interactive' : 'Personalized'}
              </h1>
              <p className="text-gray-600">
                {demoMode === 'interactive' 
                  ? 'Simple conversation with Clara' 
                  : 'Personalized study assistance with Clara'
                }
              </p>
            </div>

            {/* Chat Interface */}
            <Card className="h-[600px] flex flex-col">
              {/* Messages Area */}
              <CardContent className="flex-1 p-0 overflow-hidden">
                <ScrollArea className="h-full" ref={scrollAreaRef}>
                  <div className="p-4 space-y-4 min-h-full">
                    {messages.map((message) => (
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
                          </div>
                          
                          {/* Message metadata */}
                          <div className={cn(
                            "flex items-center space-x-1 mt-1 text-xs text-gray-500",
                            message.type === 'user' ? 'justify-end' : 'justify-start'
                          )}>
                            <span>{message.timestamp.toLocaleTimeString([], { 
                              hour: '2-digit', 
                              minute: '2-digit' 
                            })}</span>
                          </div>
                        </div>
                      </div>
                    ))}

                    {/* Typing indicator */}
                    {isTyping && (
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
                    value={textInput}
                    onChange={(e) => setTextInput(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder="Type your message..."
                    disabled={isTyping}
                    className="flex-1"
                  />
                  <Button 
                    onClick={handleSendText}
                    disabled={!textInput.trim() || isTyping}
                    size="sm"
                  >
                    <Send className="w-4 h-4" />
                  </Button>
                  <Button 
                    onClick={endSession}
                    variant="outline"
                    size="sm"
                  >
                    <StopCircle className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto p-4">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">
              Clara AI Demo
            </h1>
            <p className="text-xl text-gray-600 mb-6">
              Experience Clara AI with simple text conversation
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Interactive Mode */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MessageSquare className="h-5 w-5 text-blue-600" />
                  Interactive Mode
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary">Simple Chat</Badge>
                    <Badge variant="outline">AI Initiates</Badge>
                  </div>
                  <p className="text-sm text-gray-600">
                    Start with a simple greeting and casual conversation. Clara will ask for your name and engage in friendly chat.
                  </p>
                  <Button 
                    onClick={() => startSession('interactive')}
                    className="w-full"
                    size="lg"
                  >
                    <Play className="h-4 w-4 mr-2" />
                    Start Interactive Demo
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Personalized Mode */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-purple-600" />
                  Personalized Mode
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary">Study Assistant</Badge>
                    <Badge variant="outline">Personalized Help</Badge>
                  </div>
                  <p className="text-sm text-gray-600">
                    Get personalized study assistance. Clara will offer to help with whatever you need - concepts, materials, or learning goals.
                  </p>
                  <Button 
                    onClick={() => startSession('personalized')}
                    className="w-full"
                    size="lg"
                  >
                    <Play className="h-4 w-4 mr-2" />
                    Start Personalized Demo
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Features */}
          <Card className="mt-8">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Lightbulb className="h-5 w-5 text-yellow-600" />
                Demo Features
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span className="text-sm">AI-initiated conversations</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span className="text-sm">Simple text interface</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span className="text-sm">Real-time responses</span>
                  </div>
                </div>
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span className="text-sm">Two conversation modes</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span className="text-sm">Context-aware responses</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span className="text-sm">Study assistance ready</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Instructions */}
          <Card className="mt-8">
            <CardHeader>
              <CardTitle>How to Use</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-sm font-medium">1</div>
                  <div>
                    <h4 className="font-medium">Choose Mode</h4>
                    <p className="text-sm text-gray-600">Select Interactive for casual chat or Personalized for study help</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-sm font-medium">2</div>
                  <div>
                    <h4 className="font-medium">Start Conversation</h4>
                    <p className="text-sm text-gray-600">Clara will initiate the conversation with an opening message</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-sm font-medium">3</div>
                  <div>
                    <h4 className="font-medium">Chat Naturally</h4>
                    <p className="text-sm text-gray-600">Type your responses and engage with Clara's helpful responses</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-sm font-medium">4</div>
                  <div>
                    <h4 className="font-medium">End Session</h4>
                    <p className="text-sm text-gray-600">Click the stop button to end the conversation and return to the main menu</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
} 