"use client"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { 
  Send, 
  Mic, 
  MicOff, 
  Monitor, 
  MonitorOff, 
  MessageSquare, 
  Volume2,
  User,
  Bot,
  Image as ImageIcon
} from "lucide-react"
import { cn } from "@/lib/utils"

interface Message {
  id: string
  type: 'user' | 'assistant'
  content: string
  inputType: 'text' | 'voice' | 'visual'
  timestamp: Date
  hasScreenshot?: boolean
  screenshotUrl?: string
}

interface MultimodalChatProps {
  isVoiceActive: boolean
  onVoiceToggle: () => void
  isScreenSharing: boolean
  onScreenShareToggle: () => void
  voiceState?: 'idle' | 'listening' | 'thinking' | 'speaking'
  className?: string
}

// Global screen context storage
let recentScreenAnalysis: string | null = null

export default function MultimodalChat({
  isVoiceActive,
  onVoiceToggle,
  isScreenSharing,
  onScreenShareToggle,
  voiceState = 'idle',
  className
}: MultimodalChatProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      type: 'assistant',
      content: "Hello! I'm Clara, your AI study assistant. You can talk to me using voice, type messages, or share your screen so I can see what you're working on. How can I help you study today?",
      inputType: 'text',
      timestamp: new Date()
    }
  ])
  const [textInput, setTextInput] = useState("")
  const [isTyping, setIsTyping] = useState(false)
  const scrollAreaRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (scrollAreaRef.current) {
      const scrollElement = scrollAreaRef.current.querySelector('[data-radix-scroll-area-viewport]')
      if (scrollElement) {
        scrollElement.scrollTop = scrollElement.scrollHeight
      }
    }
  }, [messages])

  const handleSendText = async () => {
    if (!textInput.trim()) return

    const userMessage: Message = {
      id: Date.now().toString(),
      type: 'user',
      content: textInput,
      inputType: 'text',
      timestamp: new Date()
    }

    setMessages(prev => [...prev, userMessage])
    setTextInput("")
    setIsTyping(true)

    try {
      // Send to Clara AI backend with screen context
      const response = await fetch('/api/multimodal/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: textInput,
          context: {
            isScreenSharing,
            previousMessages: messages.slice(-5) // Last 5 messages for context
          },
          screenContext: isScreenSharing ? {
            recentAnalysis: recentScreenAnalysis
          } : null
        }),
      })

      const data = await response.json()
      
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        type: 'assistant',
        content: data.response || "I'm having trouble processing that right now. Could you try again?",
        inputType: 'text',
        timestamp: new Date()
      }

      setMessages(prev => [...prev, assistantMessage])
    } catch (error) {
      console.error('Chat error:', error)
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        type: 'assistant',
        content: "I'm having trouble connecting right now. Please try again or use voice mode.",
        inputType: 'text',
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

  const addVoiceMessage = (content: string, isUser: boolean) => {
    const message: Message = {
      id: Date.now().toString(),
      type: isUser ? 'user' : 'assistant',
      content,
      inputType: 'voice',
      timestamp: new Date()
    }
    setMessages(prev => [...prev, message])
  }

  const addScreenshotMessage = (screenshotUrl: string, analysis: string, shouldShowMessage: boolean = false) => {
    // Always store the analysis globally for chat context
    recentScreenAnalysis = analysis
    
    // Only show as a chat message if shouldShowMessage is true (to avoid spam)
    if (shouldShowMessage) {
      const message: Message = {
        id: Date.now().toString(),
        type: 'assistant',
        content: analysis,
        inputType: 'visual',
        timestamp: new Date(),
        hasScreenshot: true,
        screenshotUrl
      }
      setMessages(prev => [...prev, message])
    }
  }

  // Expose methods for parent component
  useEffect(() => {
    ;(window as any).addVoiceMessage = addVoiceMessage
    ;(window as any).addScreenshotMessage = addScreenshotMessage
  }, [])

  const getInputTypeIcon = (inputType: string) => {
    switch (inputType) {
      case 'voice':
        return <Volume2 className="w-3 h-3" />
      case 'visual':
        return <ImageIcon className="w-3 h-3" />
      default:
        return <MessageSquare className="w-3 h-3" />
    }
  }

  const getVoiceStateText = () => {
    switch (voiceState) {
      case 'listening':
        return 'Listening...'
      case 'thinking':
        return 'Thinking...'
      case 'speaking':
        return 'Speaking...'
      default:
        return 'Voice ready'
    }
  }

  return (
    <Card className={cn("h-full flex flex-col", className)}>
      {/* Header */}
      <div className="p-4 border-b">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-lg">Chat with Clara</h3>
          <div className="flex items-center space-x-2">
            {/* Voice Status Indicator */}
            {isVoiceActive && (
              <div className="flex items-center space-x-1 text-sm text-blue-600">
                <Mic className="w-4 h-4" />
                <span>{getVoiceStateText()}</span>
              </div>
            )}
            
            {/* Screen Share Status */}
            {isScreenSharing && (
              <div className="flex items-center space-x-1 text-sm text-green-600">
                <Monitor className="w-4 h-4" />
                <span>Screen shared</span>
              </div>
            )}
          </div>
        </div>
      </div>

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
                    {/* Screenshot if present */}
                    {message.hasScreenshot && message.screenshotUrl && (
                      <div className="mb-2">
                        <img 
                          src={message.screenshotUrl} 
                          alt="Screen capture" 
                          className="rounded-lg max-w-full h-auto"
                        />
                      </div>
                    )}
                    
                    <p className="whitespace-pre-wrap">{message.content}</p>
                  </div>
                  
                  {/* Message metadata */}
                  <div className={cn(
                    "flex items-center space-x-1 mt-1 text-xs text-gray-500",
                    message.type === 'user' ? 'justify-end' : 'justify-start'
                  )}>
                    {getInputTypeIcon(message.inputType)}
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
        {/* Control Buttons */}
        <div className="flex items-center justify-center space-x-2 mb-3">
          <Button
            onClick={onVoiceToggle}
            variant={isVoiceActive ? "default" : "outline"}
            size="sm"
            className={cn(
              "flex items-center space-x-2",
              isVoiceActive && voiceState === 'listening' && "animate-pulse"
            )}
          >
            {isVoiceActive ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
            <span>{isVoiceActive ? 'Stop Voice' : 'Start Voice'}</span>
          </Button>

          <Button
            onClick={onScreenShareToggle}
            variant={isScreenSharing ? "default" : "outline"}
            size="sm"
            className="flex items-center space-x-2"
          >
            {isScreenSharing ? <MonitorOff className="w-4 h-4" /> : <Monitor className="w-4 h-4" />}
            <span>{isScreenSharing ? 'Stop Share' : 'Share Screen'}</span>
          </Button>
        </div>

        {/* Text Input */}
        <div className="flex items-center space-x-2">
          <Input
            ref={inputRef}
            value={textInput}
            onChange={(e) => setTextInput(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder={isVoiceActive ? "Type a message or speak..." : "Type a message..."}
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
        </div>
      </div>
    </Card>
  )
}