"use client"

import React, { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { VoiceVisualContent } from '@/components/voice-visual-content'
import { Lightbulb, FileText, HelpCircle, Brain } from 'lucide-react'

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
      <div className="max-w-4xl mx-auto space-y-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Voice Visual Generation Test
          </h1>
          <p className="text-gray-600">
            Test the visual content generation functionality for voice commands
          </p>
        </div>

        {/* Test Controls */}
        <Card>
          <CardHeader>
            <CardTitle>Generate Visual Content</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
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

              <div className="space-y-2">
                <Label htmlFor="topic">Topic</Label>
                <Input
                  id="topic"
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  placeholder="Enter topic (e.g., photosynthesis)"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="context">Context (Optional)</Label>
              <Input
                id="context"
                value={context}
                onChange={(e) => setContext(e.target.value)}
                placeholder="Additional context for generation"
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
              <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-red-700">{error}</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Generated Content */}
        {generatedContent && (
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                {getIconForType(generatedContent.type)}
                <CardTitle>Generated {generatedContent.type}</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <VoiceVisualContent
                visualContent={generatedContent}
                commandType={commandType}
                onClose={() => setGeneratedContent(null)}
                onInteract={(action, data) => {
                  console.log('Visual content interaction:', action, data)
                }}
              />
            </CardContent>
          </Card>
        )}

        {/* Voice Commands Guide */}
        <Card>
          <CardHeader>
            <CardTitle>Voice Commands Guide</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <h3 className="font-semibold">Diagram Commands</h3>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• "create diagram"</li>
                  <li>• "draw this"</li>
                  <li>• "visualize"</li>
                  <li>• "show diagram"</li>
                </ul>
              </div>

              <div className="space-y-2">
                <h3 className="font-semibold">Flashcard Commands</h3>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• "make flashcards"</li>
                  <li>• "create cards"</li>
                  <li>• "study cards"</li>
                  <li>• "flash cards"</li>
                </ul>
              </div>

              <div className="space-y-2">
                <h3 className="font-semibold">Quiz Commands</h3>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• "show quiz"</li>
                  <li>• "test me"</li>
                  <li>• "quiz me"</li>
                  <li>• "create quiz"</li>
                </ul>
              </div>

              <div className="space-y-2">
                <h3 className="font-semibold">Mindmap Commands</h3>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• "mind map"</li>
                  <li>• "organize ideas"</li>
                  <li>• "connect concepts"</li>
                  <li>• "create mindmap"</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
} 