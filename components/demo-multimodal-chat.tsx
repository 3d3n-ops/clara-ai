"use client"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { Send, User, Bot, Image as ImageIcon, BookOpen, HelpCircle, BarChart3 } from "lucide-react"
import { cn } from "@/lib/utils"

interface Message {
  id: string
  type: 'user' | 'assistant'
  content: string
  timestamp: Date
}

interface VisualContent {
  type: 'flashcard' | 'quiz' | 'diagram'
  title: string
  content: any
  timestamp: Date
}

interface DemoMultimodalChatProps {
  className?: string
}

export default function DemoMultimodalChat({ className }: DemoMultimodalChatProps) {
  const [messages, setMessages] = useState<Message[]>([])
  const [visualContent, setVisualContent] = useState<VisualContent | null>(null)
  const [textInput, setTextInput] = useState("")
  const [isTyping, setIsTyping] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

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
      // Send to multimodal chat API
      const response = await fetch('/api/multimodal/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: textInput,
          context: {
            isScreenSharing: false,
            previousMessages: messages.slice(-3)
          }
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to get response')
      }

      const data = await response.json()
      
      // Check if response contains visual content commands
      const lowerMessage = textInput.toLowerCase()
      const isVisualRequest = lowerMessage.includes('flashcard') || 
                             lowerMessage.includes('quiz') || 
                             lowerMessage.includes('diagram') ||
                             lowerMessage.includes('create') ||
                             lowerMessage.includes('generate')

      if (isVisualRequest) {
        // Generate visual content based on the request
        const visualType = lowerMessage.includes('flashcard') ? 'flashcard' :
                          lowerMessage.includes('quiz') ? 'quiz' : 'diagram'
        
        const newVisualContent: VisualContent = {
          type: visualType,
          title: `Generated ${visualType} for: ${textInput}`,
          content: generateMockVisualContent(visualType, textInput),
          timestamp: new Date()
        }
        
        setVisualContent(newVisualContent)
      }

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        type: 'assistant',
        content: data.response || "I'm here to help! Try asking me to create flashcards, quizzes, or diagrams.",
        timestamp: new Date()
      }

      setMessages(prev => [...prev, assistantMessage])

    } catch (error) {
      console.error('Error sending message:', error)
      
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        type: 'assistant',
        content: "Sorry, I'm having trouble processing that. Try asking me to create flashcards, quizzes, or diagrams!",
        timestamp: new Date()
      }
      
      setMessages(prev => [...prev, errorMessage])
    } finally {
      setIsTyping(false)
    }
  }

  const generateMockVisualContent = (type: string, prompt: string) => {
    switch (type) {
      case 'flashcard':
        return {
          cards: [
            { front: "What is the capital of France?", back: "Paris" },
            { front: "What is 2 + 2?", back: "4" },
            { front: "What is the largest planet?", back: "Jupiter" }
          ]
        }
      case 'quiz':
        return {
          questions: [
            {
              question: "What is the capital of France?",
              options: ["London", "Paris", "Berlin", "Madrid"],
              correct_answer: "Paris"
            },
            {
              question: "What is 2 + 2?",
              options: ["3", "4", "5", "6"],
              correct_answer: "4"
            }
          ]
        }
      case 'diagram':
        return {
          title: "Study Process Flow",
          elements: ["Start", "Read", "Practice", "Test", "Review"],
          connections: [
            { from: "Start", to: "Read" },
            { from: "Read", to: "Practice" },
            { from: "Practice", to: "Test" },
            { from: "Test", to: "Review" }
          ]
        }
      default:
        return { content: "Generated content" }
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSendText()
    }
  }

  const renderVisualContent = () => {
    if (!visualContent) return null

    switch (visualContent.type) {
      case 'flashcard':
        return (
          <div className="space-y-4">
            <div className="flex items-center gap-2 mb-4">
              <BookOpen className="w-5 h-5 text-blue-600" />
              <h3 className="text-lg font-semibold">Flashcards</h3>
            </div>
            <div className="grid gap-3">
              {visualContent.content.cards?.map((card: any, index: number) => (
                <Card key={index} className="cursor-pointer hover:shadow-md transition-shadow">
                  <CardContent className="p-4">
                    <div className="text-sm text-gray-600 mb-2">Card {index + 1}</div>
                    <div className="font-medium mb-2">{card.front}</div>
                    <div className="text-sm text-gray-500">{card.back}</div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )

      case 'quiz':
        return (
          <div className="space-y-4">
            <div className="flex items-center gap-2 mb-4">
              <HelpCircle className="w-5 h-5 text-green-600" />
              <h3 className="text-lg font-semibold">Quiz</h3>
            </div>
            <div className="space-y-4">
              {visualContent.content.questions?.map((question: any, index: number) => (
                <Card key={index}>
                  <CardContent className="p-4">
                    <div className="font-medium mb-3">{question.question}</div>
                    <div className="space-y-2">
                      {question.options.map((option: string, optionIndex: number) => (
                        <div key={optionIndex} className="flex items-center gap-2">
                          <input
                            type="radio"
                            name={`question-${index}`}
                            id={`option-${index}-${optionIndex}`}
                            className="text-blue-600"
                          />
                          <label htmlFor={`option-${index}-${optionIndex}`} className="text-sm">
                            {option}
                          </label>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )

      case 'diagram':
        return (
          <div className="space-y-4">
            <div className="flex items-center gap-2 mb-4">
              <BarChart3 className="w-5 h-5 text-purple-600" />
              <h3 className="text-lg font-semibold">Diagram</h3>
            </div>
            <div className="bg-white p-4 rounded-lg border">
              <div className="text-center font-medium mb-4">{visualContent.content.title}</div>
              <div className="flex justify-center items-center space-x-4">
                {visualContent.content.elements?.map((element: string, index: number) => (
                  <div key={index} className="text-center">
                    <div className="bg-blue-100 text-blue-800 px-3 py-2 rounded-lg text-sm font-medium">
                      {element}
                    </div>
                    {index < visualContent.content.elements.length - 1 && (
                      <div className="text-gray-400 mt-2">→</div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )

      default:
        return null
    }
  }

  return (
    <div className={cn("flex flex-col h-full", className)}>
      {/* Chat Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message) => (
          <div
            key={message.id}
            className={cn(
              "flex gap-3",
              message.type === 'user' ? 'justify-end' : 'justify-start'
            )}
          >
            {message.type === 'assistant' && (
              <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                <Bot className="w-4 h-4 text-blue-600" />
              </div>
            )}
            <div
              className={cn(
                "max-w-[80%] rounded-lg px-4 py-2 text-sm",
                message.type === 'user'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-900'
              )}
            >
              {message.content}
            </div>
            {message.type === 'user' && (
              <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
                <User className="w-4 h-4 text-gray-600" />
              </div>
            )}
          </div>
        ))}
        {isTyping && (
          <div className="flex gap-3 justify-start">
            <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
              <Bot className="w-4 h-4 text-blue-600" />
            </div>
            <div className="bg-gray-100 rounded-lg px-4 py-2 text-sm">
              <div className="flex space-x-1">
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Input */}
      <div className="p-4 border-t bg-white">
        <div className="flex gap-2">
          <Input
            ref={inputRef}
            value={textInput}
            onChange={(e) => setTextInput(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Ask me to create flashcards, quizzes, or diagrams..."
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
    </div>
  )
}

// Export the visual content renderer for use in the demo page
export function renderVisualContentInRectangle(visualContent: VisualContent | null) {
  if (!visualContent) {
    return (
      <div className="w-full h-full flex items-center justify-center text-gray-500">
        <div className="text-center">
          <ImageIcon className="w-12 h-12 mx-auto mb-2 text-gray-400" />
          <p className="text-sm">Visual content will appear here</p>
          <p className="text-xs text-gray-400 mt-1">Try asking for flashcards, quizzes, or diagrams</p>
        </div>
      </div>
    )
  }

  switch (visualContent.type) {
    case 'flashcard':
      return (
        <div className="w-full h-full p-6 overflow-y-auto">
          <div className="space-y-4">
            <div className="flex items-center gap-2 mb-4">
              <BookOpen className="w-5 h-5 text-blue-600" />
              <h3 className="text-lg font-semibold">Flashcards</h3>
            </div>
            <div className="grid gap-3">
              {visualContent.content.cards?.map((card: any, index: number) => (
                <Card key={index} className="cursor-pointer hover:shadow-md transition-shadow">
                  <CardContent className="p-4">
                    <div className="text-sm text-gray-600 mb-2">Card {index + 1}</div>
                    <div className="font-medium mb-2">{card.front}</div>
                    <div className="text-sm text-gray-500">{card.back}</div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>
      )

    case 'quiz':
      return (
        <div className="w-full h-full p-6 overflow-y-auto">
          <div className="space-y-4">
            <div className="flex items-center gap-2 mb-4">
              <HelpCircle className="w-5 h-5 text-green-600" />
              <h3 className="text-lg font-semibold">Quiz</h3>
            </div>
            <div className="space-y-4">
              {visualContent.content.questions?.map((question: any, index: number) => (
                <Card key={index}>
                  <CardContent className="p-4">
                    <div className="font-medium mb-3">{question.question}</div>
                    <div className="space-y-2">
                      {question.options.map((option: string, optionIndex: number) => (
                        <div key={optionIndex} className="flex items-center gap-2">
                          <input
                            type="radio"
                            name={`question-${index}`}
                            id={`option-${index}-${optionIndex}`}
                            className="text-blue-600"
                          />
                          <label htmlFor={`option-${index}-${optionIndex}`} className="text-sm">
                            {option}
                          </label>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>
      )

    case 'diagram':
      return (
        <div className="w-full h-full p-6 overflow-y-auto">
          <div className="space-y-4">
            <div className="flex items-center gap-2 mb-4">
              <BarChart3 className="w-5 h-5 text-purple-600" />
              <h3 className="text-lg font-semibold">Diagram</h3>
            </div>
            <div className="bg-white p-4 rounded-lg border">
              <div className="text-center font-medium mb-4">{visualContent.content.title}</div>
              <div className="flex justify-center items-center space-x-4">
                {visualContent.content.elements?.map((element: string, index: number) => (
                  <div key={index} className="text-center">
                    <div className="bg-blue-100 text-blue-800 px-3 py-2 rounded-lg text-sm font-medium">
                      {element}
                    </div>
                    {index < visualContent.content.elements.length - 1 && (
                      <div className="text-gray-400 mt-2">→</div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )

    default:
      return null
  }
} 