"use client"

import React, { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  Lightbulb, 
  FileText, 
  HelpCircle, 
  Brain, 
  Download, 
  Share2,
  Play,
  Pause,
  RotateCcw
} from 'lucide-react'

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

interface VoiceVisualContentProps {
  visualContent: VisualContent
  commandType: string
  onClose?: () => void
  onInteract?: (action: string, data: any) => void
}

export function VoiceVisualContent({ 
  visualContent, 
  commandType, 
  onClose, 
  onInteract 
}: VoiceVisualContentProps) {
  const [currentFlashcardIndex, setCurrentFlashcardIndex] = useState(0)
  const [isFlipped, setIsFlipped] = useState(false)
  const [selectedAnswers, setSelectedAnswers] = useState<Record<number, string>>({})
  const [quizResults, setQuizResults] = useState<Record<number, boolean>>({})

  const getIconForType = (type: string) => {
    switch (type) {
      case 'diagram': return <Lightbulb className="h-5 w-5" />
      case 'flashcard': return <FileText className="h-5 w-5" />
      case 'quiz': return <HelpCircle className="h-5 w-5" />
      case 'mindmap': return <Brain className="h-5 w-5" />
      default: return <Lightbulb className="h-5 w-5" />
    }
  }

  const handleFlashcardNext = () => {
    if (visualContent.cards && currentFlashcardIndex < visualContent.cards.length - 1) {
      setCurrentFlashcardIndex(currentFlashcardIndex + 1)
      setIsFlipped(false)
    }
  }

  const handleFlashcardPrevious = () => {
    if (currentFlashcardIndex > 0) {
      setCurrentFlashcardIndex(currentFlashcardIndex - 1)
      setIsFlipped(false)
    }
  }

  const handleQuizAnswer = (questionIndex: number, answer: string) => {
    setSelectedAnswers(prev => ({ ...prev, [questionIndex]: answer }))
  }

  const handleQuizSubmit = () => {
    if (!visualContent.questions) return

    const results: Record<number, boolean> = {}
    visualContent.questions.forEach((question, index) => {
      results[index] = selectedAnswers[index] === question.correct_answer
    })
    setQuizResults(results)
  }

  const renderDiagram = () => (
    <div className="space-y-4">
      <div className="bg-gradient-to-r from-blue-50 to-purple-50 p-6 rounded-lg border">
        <h3 className="text-lg font-semibold mb-2">{visualContent.title}</h3>
        {visualContent.description && (
          <p className="text-gray-600 mb-4">{visualContent.description}</p>
        )}
        
        {visualContent.components && visualContent.components.length > 0 && (
          <div className="space-y-2">
            <h4 className="font-medium">Components:</h4>
            <div className="flex flex-wrap gap-2">
              {visualContent.components.map((component, index) => (
                <Badge key={index} variant="secondary">
                  {component}
                </Badge>
              ))}
            </div>
          </div>
        )}
        
        {visualContent.relationships && visualContent.relationships.length > 0 && (
          <div className="space-y-2 mt-4">
            <h4 className="font-medium">Relationships:</h4>
            <ul className="list-disc list-inside space-y-1 text-sm text-gray-600">
              {visualContent.relationships.map((relationship, index) => (
                <li key={index}>{relationship}</li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  )

  const renderFlashcards = () => (
    <div className="space-y-4">
      {visualContent.cards && visualContent.cards.length > 0 && (
        <>
          <div className="flex justify-between items-center mb-4">
            <span className="text-sm text-gray-500">
              Card {currentFlashcardIndex + 1} of {visualContent.cards.length}
            </span>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleFlashcardPrevious}
                disabled={currentFlashcardIndex === 0}
              >
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleFlashcardNext}
                disabled={currentFlashcardIndex === visualContent.cards.length - 1}
              >
                Next
              </Button>
            </div>
          </div>
          
          <Card className="cursor-pointer" onClick={() => setIsFlipped(!isFlipped)}>
            <CardContent className="p-8 text-center min-h-[200px] flex items-center justify-center">
              <div className="space-y-4">
                <div className="text-sm text-gray-500">
                  {isFlipped ? 'Answer' : 'Question'}
                </div>
                <div className="text-lg font-medium">
                  {isFlipped 
                    ? visualContent.cards[currentFlashcardIndex].back
                    : visualContent.cards[currentFlashcardIndex].front
                  }
                </div>
                <div className="text-xs text-gray-400">
                  Click to {isFlipped ? 'see question' : 'see answer'}
                </div>
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  )

  const renderQuiz = () => (
    <div className="space-y-4">
      {visualContent.questions && visualContent.questions.length > 0 && (
        <Tabs defaultValue="0" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            {visualContent.questions.map((_, index) => (
              <TabsTrigger key={index} value={index.toString()}>
                Q{index + 1}
              </TabsTrigger>
            ))}
          </TabsList>
          
          {visualContent.questions.map((question, index) => (
            <TabsContent key={index} value={index.toString()}>
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Question {index + 1}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-gray-700">{question.question}</p>
                  
                  <div className="space-y-2">
                    {question.options.map((option, optionIndex) => (
                      <Button
                        key={optionIndex}
                        variant={selectedAnswers[index] === option ? "default" : "outline"}
                        className="w-full justify-start"
                        onClick={() => handleQuizAnswer(index, option)}
                      >
                        {option}
                      </Button>
                    ))}
                  </div>
                  
                  {quizResults[index] !== undefined && (
                    <div className={`p-3 rounded-lg ${
                      quizResults[index] 
                        ? 'bg-green-50 text-green-700 border border-green-200' 
                        : 'bg-red-50 text-red-700 border border-red-200'
                    }`}>
                      {quizResults[index] ? '✓ Correct!' : '✗ Incorrect'}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          ))}
        </Tabs>
      )}
      
      <div className="flex gap-2">
        <Button onClick={handleQuizSubmit} className="flex-1">
          Submit Quiz
        </Button>
        <Button variant="outline" onClick={() => {
          setSelectedAnswers({})
          setQuizResults({})
        }}>
          Reset
        </Button>
      </div>
    </div>
  )

  const renderMindmap = () => (
    <div className="space-y-4">
      <div className="bg-gradient-to-r from-green-50 to-blue-50 p-6 rounded-lg border">
        <h3 className="text-lg font-semibold mb-4 text-center">
          {visualContent.central_topic}
        </h3>
        
        {visualContent.branches && visualContent.branches.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {visualContent.branches.map((branch, index) => (
              <Card key={index}>
                <CardHeader>
                  <CardTitle className="text-sm">{branch.topic}</CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-1">
                    {branch.subtopics.map((subtopic, subIndex) => (
                      <li key={subIndex} className="text-sm text-gray-600">
                        • {subtopic}
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  )

  const renderContent = () => {
    switch (visualContent.type) {
      case 'diagram':
        return renderDiagram()
      case 'flashcard':
        return renderFlashcards()
      case 'quiz':
        return renderQuiz()
      case 'mindmap':
        return renderMindmap()
      default:
        return <div>Unsupported visual content type</div>
    }
  }

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {getIconForType(visualContent.type)}
            <CardTitle>{visualContent.title}</CardTitle>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm">
              <Download className="h-4 w-4 mr-2" />
              Download
            </Button>
            <Button variant="outline" size="sm">
              <Share2 className="h-4 w-4 mr-2" />
              Share
            </Button>
            {onClose && (
              <Button variant="outline" size="sm" onClick={onClose}>
                Close
              </Button>
            )}
          </div>
        </div>
        <div className="text-sm text-gray-500">
          Generated via voice command: "{commandType}"
        </div>
      </CardHeader>
      <CardContent>
        {renderContent()}
      </CardContent>
    </Card>
  )
} 