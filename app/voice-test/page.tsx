"use client"

import React, { useState, useEffect, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { VoiceVisualContent } from '@/components/voice-visual-content'
import { Lightbulb, FileText, HelpCircle, Brain, Send, MessageSquare } from 'lucide-react'

interface VisualContent {
  type: 'diagram' | 'flashcard' | 'quiz' | 'mindmap'
  title: string
  description?: string
  components?: string[]
  relationships?: string[]
  cards?: Array<{ front: string; back: string }>
  questions?: Array<{
    question: string
    options: string[]
    correct_answer: string
  }>
  central_topic?: string
  branches?: Array<{ topic: string; subtopics: string[] }>
  generated_at: string
}

export default function VoiceTestPage() {
  const [commandType, setCommandType] = useState<string>('diagram')
  const [topic, setTopic] = useState<string>('photosynthesis')
  const [context, setContext] = useState<string>('')
  const [generatedContent, setGeneratedContent] = useState<VisualContent | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // WebSocket test state
  const [wsConnected, setWsConnected] = useState(false)
  const [wsMessages, setWsMessages] = useState<string[]>([])
  const [inputMessage, setInputMessage] = useState('')
  const wsRef = useRef<WebSocket | null>(null)
  const [userId] = useState(() => 'test-user-' + Date.now())

  // Connect to backend websocket
  useEffect(() => {
    const connectWebSocket = () => {
      try {
        const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8000'
        const wsUrl = backendUrl.replace('http', 'ws')
        
        const ws = new WebSocket(`${wsUrl}/voice/ws/${userId}`)
        wsRef.current = ws
        
        ws.onopen = () => {
          console.log('Connected to backend voice websocket')
          setWsConnected(true)
          setWsMessages(prev => [...prev, 'Connected to Clara AI'])
          
          // Send session start message
          ws.send(JSON.stringify({
            type: 'session_start',
            user_id: userId
          }))
        }
        
        ws.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data)
            console.log('Received message from backend:', data)
            
            if (data.type === 'response') {
              setWsMessages(prev => [...prev, `Clara: ${data.text}`])
              
              // Handle visual content
              if (data.visual_content) {
                setGeneratedContent(data.visual_content)
              }
            } else if (data.type === 'session_started') {
              setWsMessages(prev => [...prev, `Clara: ${data.message}`])
            }
          } catch (err) {
            console.error('Error parsing websocket message:', err)
          }
        }
        
        ws.onerror = (error) => {
          console.error('WebSocket error:', error)
          setWsConnected(false)
          setWsMessages(prev => [...prev, 'Error: Connection failed'])
        }
        
        ws.onclose = () => {
          console.log('WebSocket connection closed')
          setWsConnected(false)
          setWsMessages(prev => [...prev, 'Disconnected from Clara AI'])
        }
      } catch (err) {
        console.error('Error connecting to backend websocket:', err)
        setWsConnected(false)
        setWsMessages(prev => [...prev, 'Error: Failed to connect'])
      }
    }
    
    connectWebSocket()
    
    return () => {
      if (wsRef.current) {
        wsRef.current.close()
      }
    }
  }, [userId])

  const sendMessage = () => {
    if (inputMessage.trim() && wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({
        type: 'text',
        text: inputMessage,
        user_id: userId
      }))
      setWsMessages(prev => [...prev, `You: ${inputMessage}`])
      setInputMessage('')
    }
  }

  const generateVisualContent = async () => {
    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/voice/generate-visual', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          command_type: commandType,
          topic: topic,
          context: context,
          user_id: 'test-user-123'
        }),
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data = await response.json()
      
      if (data.success && data.visual_content) {
        setGeneratedContent(data.visual_content)
      } else {
        throw new Error(data.error || 'Failed to generate visual content')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setIsLoading(false)
    }
  }

  const getIconForType = (type: string) => {
    switch (type) {
      case 'diagram': return <Lightbulb className="h-5 w-5" />
      case 'flashcard': return <FileText className="h-5 w-5" />
      case 'quiz': return <HelpCircle className="h-5 w-5" />
      case 'mindmap': return <Brain className="h-5 w-5" />
      default: return <Lightbulb className="h-5 w-5" />
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-6xl mx-auto space-y-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Voice Chat Test
          </h1>
          <p className="text-gray-600">
            Test the voice chat functionality with Clara AI
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* WebSocket Chat Test */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="h-5 w-5" />
                Voice Chat with Clara
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Connection Status */}
              <div className="flex items-center gap-2">
                <div className={`w-3 h-3 rounded-full ${wsConnected ? 'bg-green-500' : 'bg-red-500'}`} />
                <span className="text-sm">
                  {wsConnected ? 'Connected to Clara AI' : 'Disconnected'}
                </span>
              </div>

              {/* Messages */}
              <div className="h-64 bg-gray-100 rounded-lg p-4 overflow-y-auto space-y-2">
                {wsMessages.map((msg, index) => (
                  <div key={index} className="text-sm">
                    {msg.startsWith('You:') ? (
                      <div className="text-blue-600 font-medium">{msg}</div>
                    ) : msg.startsWith('Clara:') ? (
                      <div className="text-green-600 font-medium">{msg}</div>
                    ) : (
                      <div className="text-gray-600">{msg}</div>
                    )}
                  </div>
                ))}
              </div>

              {/* Input */}
              <div className="flex gap-2">
                <Input
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  placeholder="Type a message to Clara..."
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      sendMessage()
                    }
                  }}
                  disabled={!wsConnected}
                />
                <Button
                  onClick={sendMessage}
                  disabled={!wsConnected || !inputMessage.trim()}
                  size="sm"
                >
                  <Send className="h-4 w-4" />
                </Button>
              </div>

              {/* Test Commands */}
              <div className="space-y-2">
                <p className="text-sm font-medium text-gray-700">Try these commands:</p>
                <div className="flex flex-wrap gap-2">
                  {[
                    "Hello Clara!",
                    "create diagram for photosynthesis",
                    "make flashcards for math",
                    "show quiz about history"
                  ].map((cmd, index) => (
                    <Button
                      key={index}
                      variant="outline"
                      size="sm"
                      onClick={() => setInputMessage(cmd)}
                      disabled={!wsConnected}
                    >
                      {cmd}
                    </Button>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Visual Generation Test */}
          <Card>
            <CardHeader>
              <CardTitle>Generate Visual Content</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="command-type">Command Type</Label>
                  <Select value={commandType} onValueChange={setCommandType}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="diagram">Diagram</SelectItem>
                      <SelectItem value="flashcard">Flashcard</SelectItem>
                      <SelectItem value="quiz">Quiz</SelectItem>
                      <SelectItem value="mindmap">Mindmap</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="topic">Topic</Label>
                  <Input
                    id="topic"
                    value={topic}
                    onChange={(e) => setTopic(e.target.value)}
                    placeholder="Enter topic"
                  />
                </div>
              </div>
              
              <div>
                <Label htmlFor="context">Context (Optional)</Label>
                <Input
                  id="context"
                  value={context}
                  onChange={(e) => setContext(e.target.value)}
                  placeholder="Additional context"
                />
              </div>

              <Button
                onClick={generateVisualContent}
                disabled={isLoading}
                className="w-full"
              >
                {isLoading ? 'Generating...' : 'Generate Visual Content'}
              </Button>

              {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <p className="text-red-700 text-sm">{error}</p>
                </div>
              )}

              {generatedContent && (
                <div className="border rounded-lg p-4">
                  <h3 className="font-semibold mb-2 flex items-center gap-2">
                    {getIconForType(generatedContent.type)}
                    {generatedContent.title}
                  </h3>
                  <p className="text-sm text-gray-600">{generatedContent.description}</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
} 