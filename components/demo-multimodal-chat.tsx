"use client"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { Send, User, Bot, Image as ImageIcon, BookOpen, HelpCircle, BarChart3, ChevronLeft, ChevronRight, CheckCircle, XCircle } from "lucide-react"
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
        return <FlashcardSet content={visualContent.content} />
      case 'quiz':
        return <QuizSet content={visualContent.content} />
      case 'diagram':
        return <DiagramViewer content={visualContent.content} />
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

// Enhanced Flashcard Component
function FlashcardSet({ content }: { content: any }) {
  const [currentCard, setCurrentCard] = useState(0)
  const [isFlipped, setIsFlipped] = useState(false)

  const handleNext = () => {
    setIsFlipped(false)
    setCurrentCard((prev) => (prev + 1) % content.cards.length)
  }

  const handlePrev = () => {
    setIsFlipped(false)
    setCurrentCard((prev) => (prev - 1 + content.cards.length) % content.cards.length)
  }

  const card = content.cards[currentCard]

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-4">
        <BookOpen className="w-5 h-5 text-blue-600" />
        <h3 className="text-lg font-semibold">Flashcards</h3>
        <span className="text-sm text-gray-500 ml-auto">
          {currentCard + 1} of {content.cards.length}
        </span>
      </div>
      
      <div className="flex items-center justify-center">
        <Card 
          className="w-full max-w-md cursor-pointer hover:shadow-lg transition-all duration-300 transform hover:scale-105"
          onClick={() => setIsFlipped(!isFlipped)}
        >
          <CardContent className="p-8 text-center min-h-[200px] flex items-center justify-center">
            <div className={`transition-all duration-500 ${isFlipped ? 'rotate-y-180' : ''}`}>
              {!isFlipped ? (
                <div>
                  <div className="text-sm text-gray-500 mb-2">Question</div>
                  <div className="text-lg font-medium">{card.front}</div>
                </div>
              ) : (
                <div>
                  <div className="text-sm text-gray-500 mb-2">Answer</div>
                  <div className="text-lg font-medium">{card.back}</div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="flex justify-center gap-4">
        <Button
          variant="outline"
          size="sm"
          onClick={handlePrev}
          disabled={content.cards.length <= 1}
        >
          <ChevronLeft className="w-4 h-4" />
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setIsFlipped(!isFlipped)}
        >
          {isFlipped ? 'Show Question' : 'Show Answer'}
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={handleNext}
          disabled={content.cards.length <= 1}
        >
          <ChevronRight className="w-4 h-4" />
        </Button>
      </div>
    </div>
  )
}

// Enhanced Quiz Component
function QuizSet({ content }: { content: any }) {
  const [currentQuestion, setCurrentQuestion] = useState(0)
  const [selectedAnswers, setSelectedAnswers] = useState<Record<number, string>>({})
  const [showResults, setShowResults] = useState(false)

  const question = content.questions[currentQuestion]
  const isLastQuestion = currentQuestion === content.questions.length - 1

  const handleAnswerSelect = (answer: string) => {
    setSelectedAnswers(prev => ({ ...prev, [currentQuestion]: answer }))
  }

  const handleNext = () => {
    if (isLastQuestion) {
      setShowResults(true)
    } else {
      setCurrentQuestion(prev => prev + 1)
    }
  }

  const handlePrev = () => {
    setCurrentQuestion(prev => Math.max(0, prev - 1))
  }

  const getScore = () => {
    let correct = 0
    content.questions.forEach((q: any, index: number) => {
      if (selectedAnswers[index] === q.correct_answer) {
        correct++
      }
    })
    return { correct, total: content.questions.length }
  }

  if (showResults) {
    const score = getScore()
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-2 mb-4">
          <HelpCircle className="w-5 h-5 text-green-600" />
          <h3 className="text-lg font-semibold">Quiz Results</h3>
        </div>
        
        <Card className="p-6 text-center">
          <div className="text-3xl font-bold text-green-600 mb-2">
            {score.correct}/{score.total}
          </div>
          <div className="text-gray-600">
            {score.correct === score.total ? 'Perfect!' : 
             score.correct >= score.total * 0.8 ? 'Great job!' : 
             score.correct >= score.total * 0.6 ? 'Good effort!' : 'Keep practicing!'}
          </div>
        </Card>

        <div className="flex justify-center">
          <Button onClick={() => {
            setShowResults(false)
            setCurrentQuestion(0)
            setSelectedAnswers({})
          }}>
            Retake Quiz
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-4">
        <HelpCircle className="w-5 h-5 text-green-600" />
        <h3 className="text-lg font-semibold">Quiz</h3>
        <span className="text-sm text-gray-500 ml-auto">
          {currentQuestion + 1} of {content.questions.length}
        </span>
      </div>
      
      <Card>
        <CardContent className="p-6">
          <div className="font-medium mb-4 text-lg">{question.question}</div>
          <div className="space-y-3">
            {question.options.map((option: string, index: number) => (
              <div
                key={index}
                className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                  selectedAnswers[currentQuestion] === option
                    ? 'bg-blue-50 border-blue-200'
                    : 'hover:bg-gray-50'
                }`}
                onClick={() => handleAnswerSelect(option)}
              >
                <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                  selectedAnswers[currentQuestion] === option
                    ? 'border-blue-500 bg-blue-500'
                    : 'border-gray-300'
                }`}>
                  {selectedAnswers[currentQuestion] === option && (
                    <div className="w-2 h-2 bg-white rounded-full" />
                  )}
                </div>
                <span className="flex-1">{option}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-between">
        <Button
          variant="outline"
          onClick={handlePrev}
          disabled={currentQuestion === 0}
        >
          Previous
        </Button>
        <Button
          onClick={handleNext}
          disabled={!selectedAnswers[currentQuestion]}
        >
          {isLastQuestion ? 'Finish Quiz' : 'Next Question'}
        </Button>
      </div>
    </div>
  )
}

// Enhanced Diagram Component
function DiagramViewer({ content }: { content: any }) {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-4">
        <BarChart3 className="w-5 h-5 text-purple-600" />
        <h3 className="text-lg font-semibold">Diagram</h3>
      </div>
      
      <Card>
        <CardContent className="p-6">
          <div className="text-center font-medium mb-6 text-lg">{content.title}</div>
          <div className="flex flex-wrap justify-center items-center gap-4">
            {content.elements?.map((element: string, index: number) => (
              <div key={index} className="text-center">
                <div className="bg-gradient-to-r from-blue-500 to-purple-600 text-white px-4 py-3 rounded-lg text-sm font-medium shadow-lg">
                  {element}
                </div>
                {index < content.elements.length - 1 && (
                  <div className="text-gray-400 mt-2 text-xl">→</div>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
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
          <FlashcardSet content={visualContent.content} />
        </div>
      )
    case 'quiz':
      return (
        <div className="w-full h-full p-6 overflow-y-auto">
          <QuizSet content={visualContent.content} />
        </div>
      )
    case 'diagram':
      return (
        <div className="w-full h-full p-6 overflow-y-auto">
          <DiagramViewer content={visualContent.content} />
        </div>
      )
    default:
      return null
  }
} 