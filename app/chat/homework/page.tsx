"use client"

import type React from "react"
import { useState, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Home, Folder, Settings, Send, Menu, X } from "lucide-react"
import Link from "next/link"
import DiagramViewer from "@/components/homework/diagram-viewer"
import FlashcardSet from "@/components/homework/flashcard-set"
import Quiz from "@/components/homework/quiz"
import FileUpload from "@/components/homework/file-upload"
import ReactMarkdown from 'react-markdown'

interface Message {
  id: string
  content: string
  sender: "user" | "clara"
  timestamp: Date
  tool_calls?: ToolCall[]
}

interface ToolCall {
  type: string
  data: any
  id: string
}

export default function HomeworkHelpPage() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      content: "Hi! I'm Clara, your AI learning assistant. I'm here to help you with your homework. Ask me anything! I can create diagrams, flashcards, and quizzes to help you learn.",
      sender: "clara",
      timestamp: new Date(),
    },
  ])
  const [inputMessage, setInputMessage] = useState("")
  const [isLoading, setIsLoading] = useState(false)

  const sendMessage = async () => {
    if (inputMessage.trim() && !isLoading) {
      const newMessage: Message = {
        id: Date.now().toString(),
        content: inputMessage,
        sender: "user",
        timestamp: new Date(),
      }

      setMessages(prev => [...prev, newMessage])
      setInputMessage("")
      setIsLoading(true)

      try {
        // Build conversation history for API
        const conversationHistory = messages.map(msg => ({
          role: msg.sender === "user" ? "user" : "assistant",
          content: msg.content
        }))

        const response = await fetch('/api/homework/chat', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            message: inputMessage,
            conversation_history: conversationHistory
          }),
        })

        const data = await response.json()

        const claraResponse: Message = {
          id: (Date.now() + 1).toString(),
          content: data.response || "I'm sorry, I couldn't process that request.",
          sender: "clara",
          timestamp: new Date(),
          tool_calls: data.tool_calls || []
        }
        
        setMessages(prev => [...prev, claraResponse])
      } catch (error) {
        console.error('Error sending message:', error)
        const errorResponse: Message = {
          id: (Date.now() + 1).toString(),
          content: "I'm sorry, I'm having trouble connecting right now. Please try again.",
          sender: "clara",
          timestamp: new Date(),
        }
        setMessages(prev => [...prev, errorResponse])
      } finally {
        setIsLoading(false)
      }
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  const handleFileUploaded = (fileId: string, filename: string) => {
    // Add a message indicating a file was uploaded
    const uploadMessage: Message = {
      id: Date.now().toString(),
      content: `📎 Uploaded: ${filename}`,
      sender: "user",
      timestamp: new Date(),
    }
    setMessages(prev => [...prev, uploadMessage])
  }

  const renderToolCall = (toolCall: ToolCall) => {
    switch (toolCall.type) {
      case 'mermaid_diagram':
        return (
          <DiagramViewer
            key={toolCall.id}
            title={toolCall.data.title}
            content={toolCall.data.content}
            description={toolCall.data.description}
            validated={true}
          />
        )
      case 'flashcards':
        return (
          <FlashcardSet
            key={toolCall.id}
            title={toolCall.data.title}
            cards={toolCall.data.cards}
            validated={true}
          />
        )
      case 'quiz':
        return (
          <Quiz
            key={toolCall.id}
            title={toolCall.data.title}
            questions={toolCall.data.questions}
            validated={true}
          />
        )
      default:
        return null
    }
  }

  return (
    <div className="min-h-screen bg-white flex">
      {/* Sidebar */}
      <div
        className={`${sidebarCollapsed ? "w-16" : "w-64"} bg-white border-r border-gray-200 transition-all duration-300`}
      >
        <div className="p-6 flex items-center justify-between">
          {!sidebarCollapsed && <h1 className="text-xl font-semibold text-gray-900">Clara.ai</h1>}
          <Button variant="ghost" size="sm" onClick={() => setSidebarCollapsed(!sidebarCollapsed)} className="p-2">
            {sidebarCollapsed ? <Menu className="w-5 h-5" /> : <X className="w-5 h-5" />}
          </Button>
        </div>

        <nav className="px-6 space-y-2">
          <Link
            href="/dashboard"
            className="flex items-center space-x-3 rounded-lg px-3 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-50 transition-colors"
          >
            <Home className="w-5 h-5" />
            {!sidebarCollapsed && <span>Dashboard</span>}
          </Link>
          <Link
            href="/chat/homework"
            className="flex items-center space-x-3 rounded-lg px-3 py-2 bg-blue-50 text-blue-700"
          >
            <Folder className="w-5 h-5" />
            {!sidebarCollapsed && <span>Homework Help</span>}
          </Link>
          <Link
            href="/chat/study"
            className="flex items-center space-x-3 rounded-lg px-3 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-50 transition-colors"
          >
            <Settings className="w-5 h-5" />
            {!sidebarCollapsed && <span>Study Session</span>}
          </Link>
        </nav>

        {!sidebarCollapsed && (
          <div className="px-6 flex-1 overflow-y-auto">
            <div className="mb-4">
              <h3 className="text-sm font-medium text-gray-900 mb-2">Recent Messages</h3>
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {messages.slice(-5).map((message) => (
                  <div
                    key={message.id}
                    className={`p-2 rounded-lg text-xs ${
                      message.sender === "user" ? "bg-blue-100 text-blue-900" : "bg-gray-100 text-gray-700"
                    }`}
                  >
                    <div className="font-medium mb-1">{message.sender === "user" ? "You" : "Clara"}</div>
                    <div className="line-clamp-3">
                      <div className="prose prose-sm max-w-none">
                        <ReactMarkdown>
                          {message.content}
                        </ReactMarkdown>
                      </div>
                    </div>
                    <div className="text-xs opacity-60 mt-1">
                      {message.timestamp.toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col h-screen">
        {/* Chat Messages with Fixed Height and Vertical Scroll */}
        <div className="flex-1 overflow-hidden">
          <ScrollArea className="h-full p-6">
            <div className="space-y-6 pb-4">
              {messages.map((message) => (
                <div key={message.id} className={`flex ${message.sender === "user" ? "justify-end" : "justify-start"}`}>
                  <div className={`max-w-4xl w-full ${message.sender === "user" ? "order-1" : ""}`}>
                    <Card
                      className={`${
                        message.sender === "user" ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-900"
                      }`}
                    >
                      <CardContent className="p-4">
                        <div className="text-sm">
                          <div className="prose prose-sm max-w-none overflow-x-auto">
                            <ReactMarkdown>
                              {message.content}
                            </ReactMarkdown>
                          </div>
                        </div>
                        <p className={`text-xs mt-2 ${message.sender === "user" ? "text-blue-100" : "text-gray-500"}`}>
                          {message.timestamp.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                        </p>
                      </CardContent>
                    </Card>
                    
                    {/* Render tool calls with horizontal scroll */}
                    {message.tool_calls && message.tool_calls.length > 0 && (
                      <div className="mt-4 space-y-4">
                        <div className="text-xs text-green-600 font-medium mb-2">
                          ✨ Generated {message.tool_calls.length} learning component{message.tool_calls.length > 1 ? 's' : ''}
                        </div>
                        <div className="w-full overflow-x-auto">
                          <div className="flex gap-4 min-w-max">
                            {message.tool_calls.map((toolCall) => (
                              <div key={toolCall.id} className="flex-shrink-0">
                                {renderToolCall(toolCall)}
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ))}
              
              {isLoading && (
                <div className="flex justify-start">
                  <Card className="bg-gray-100 text-gray-900">
                    <CardContent className="p-4">
                      <div className="flex items-center space-x-2">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                        <span className="text-sm">Clara is thinking and generating components...</span>
                      </div>
                      <div className="mt-2 text-xs text-gray-600">
                        Validating and ensuring components are properly formatted...
                      </div>
                    </CardContent>
                  </Card>
                </div>
              )}
            </div>
          </ScrollArea>
        </div>

        {/* File Upload and Chat Input - Fixed at Bottom */}
        <div className="border-t border-gray-200 p-6 bg-white">
          <div className="max-w-4xl mx-auto space-y-4">
            {/* File Upload Component */}
            <FileUpload 
              onFileUploaded={handleFileUploaded}
              className="mb-4"
            />
            
            {/* Chat Input */}
            <div className="flex gap-4">
              <Input
                placeholder="Ask me about your homework, request diagrams, flashcards, or quizzes..."
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                disabled={isLoading}
                className="flex-1"
              />
              <Button 
                onClick={sendMessage} 
                disabled={!inputMessage.trim() || isLoading}
                className="bg-blue-600 hover:bg-blue-700"
              >
                <Send className="w-4 h-4" />
              </Button>
            </div>
            <p className="text-xs text-gray-500">
              💡 Try: "Create flashcards for this topic" or "Make a diagram showing this process" or "Generate a quiz to test my understanding"
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
