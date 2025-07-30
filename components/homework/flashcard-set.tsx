"use client"

import React, { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ChevronLeft, ChevronRight, RotateCcw, Shuffle, Download } from "lucide-react"
import { useLearningPerformance } from '@/hooks/use-learning-performance'
import { useUserTracking } from '@/hooks/use-analytics'

interface FlashCard {
  front: string
  back: string
}

interface FlashcardSetProps {
  title: string
  cards: FlashCard[]
  validated?: boolean
}

export default function FlashcardSet({ title, cards, validated = true }: FlashcardSetProps) {
  const [currentCardIndex, setCurrentCardIndex] = useState(0)
  const [isFlipped, setIsFlipped] = useState(false)
  const [cardOrder, setCardOrder] = useState<number[]>(() => 
    Array.from({ length: cards.length }, (_, i) => i)
  )
  const [studyMode, setStudyMode] = useState(false)
  const [correctCount, setCorrectCount] = useState(0)
  const [incorrectCount, setIncorrectCount] = useState(0)
  const { updateFlashcardPerformance } = useLearningPerformance()
  const { trackUserAction } = useUserTracking()

  const currentCard = cards[cardOrder[currentCardIndex]]
  const totalCards = cards.length

  const flipCard = () => {
    setIsFlipped(!isFlipped)
    
    // Track flashcard flip
    trackUserAction('flashcard_flipped', {
      flashcard_title: title,
      card_index: currentCardIndex,
      is_flipped: !isFlipped,
      total_cards: cards.length,
    })
  }

  const nextCard = () => {
    if (currentCardIndex < totalCards - 1) {
      setCurrentCardIndex(currentCardIndex + 1)
      setIsFlipped(false)
    }
  }

  const prevCard = () => {
    if (currentCardIndex > 0) {
      setCurrentCardIndex(currentCardIndex - 1)
      setIsFlipped(false)
    }
  }

  const shuffleCards = () => {
    const shuffled = [...cardOrder].sort(() => Math.random() - 0.5)
    setCardOrder(shuffled)
    setCurrentCardIndex(0)
    setIsFlipped(false)
  }

  const resetCards = () => {
    setCurrentCardIndex(0)
    setIsFlipped(false)
    setCorrectCount(0)
    setIncorrectCount(0)
    setStudyMode(false)
  }

  const startStudyMode = () => {
    setStudyMode(true)
    setCorrectCount(0)
    setIncorrectCount(0)
    setCurrentCardIndex(0)
    setIsFlipped(false)
    
    // Track study mode start
    trackUserAction('flashcard_set_started', {
      flashcard_title: title,
      total_cards: cards.length,
    })
  }

  const markCorrect = () => {
    setCorrectCount(correctCount + 1)
    nextCard()
    
    // Track correct answer
    trackUserAction('flashcard_marked_correct', {
      flashcard_title: title,
      card_index: currentCardIndex,
      correct_count: correctCount + 1,
      total_cards: cards.length,
    })
  }

  const markIncorrect = () => {
    setIncorrectCount(incorrectCount + 1)
    nextCard()
    
    // Track incorrect answer
    trackUserAction('flashcard_marked_incorrect', {
      flashcard_title: title,
      card_index: currentCardIndex,
      incorrect_count: incorrectCount + 1,
      total_cards: cards.length,
    })
  }

  const downloadFlashcards = () => {
    const data = {
      title,
      cards,
      exported_at: new Date().toISOString()
    }
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${title.replace(/\s+/g, '_')}_flashcards.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  if (totalCards === 0) {
    return (
      <Card className="w-full max-w-2xl">
        <CardContent className="p-6 text-center">
          <p className="text-gray-500">No flashcards available</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="w-full max-w-2xl">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CardTitle className="text-lg font-semibold">{title}</CardTitle>
            {validated && (
              <div className="flex items-center gap-1 text-green-600 text-xs">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span>Validated</span>
              </div>
            )}
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={downloadFlashcards}
              className="h-8"
            >
              <Download className="w-4 h-4 mr-1" />
              Export
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={shuffleCards}
              className="h-8"
            >
              <Shuffle className="w-4 h-4 mr-1" />
              Shuffle
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={resetCards}
              className="h-8"
            >
              <RotateCcw className="w-4 h-4 mr-1" />
              Reset
            </Button>
          </div>
        </div>
        
        <div className="flex items-center justify-between text-sm text-gray-600">
          <span>Card {currentCardIndex + 1} of {totalCards}</span>
          {studyMode && (
            <div className="flex gap-2">
              <Badge variant="outline" className="text-green-600">
                Correct: {correctCount}
              </Badge>
              <Badge variant="outline" className="text-red-600">
                Incorrect: {incorrectCount}
              </Badge>
            </div>
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Flashcard */}
        <div 
          className="relative h-48 cursor-pointer"
          onClick={flipCard}
        >
          <div className={`absolute inset-0 transition-transform duration-500 preserve-3d ${isFlipped ? 'rotate-y-180' : ''}`}>
            {/* Front of card */}
            <div className="absolute inset-0 backface-hidden bg-blue-50 border-2 border-blue-200 rounded-lg p-6 flex items-center justify-center">
              <div className="text-center">
                <p className="text-lg font-medium text-blue-900 mb-2">{currentCard.front}</p>
                <p className="text-sm text-blue-600">Click to reveal answer</p>
              </div>
            </div>
            
            {/* Back of card */}
            <div className="absolute inset-0 backface-hidden rotate-y-180 bg-green-50 border-2 border-green-200 rounded-lg p-6 flex items-center justify-center">
              <div className="text-center">
                <p className="text-lg font-medium text-green-900 mb-2">{currentCard.back}</p>
                <p className="text-sm text-green-600">Click to show question</p>
              </div>
            </div>
          </div>
        </div>

        {/* Navigation and Study Mode Controls */}
        <div className="flex items-center justify-between">
          <Button
            variant="outline"
            onClick={prevCard}
            disabled={currentCardIndex === 0}
            className="flex items-center gap-1"
          >
            <ChevronLeft className="w-4 h-4" />
            Previous
          </Button>

          {studyMode && isFlipped && currentCardIndex < totalCards - 1 && (
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={markIncorrect}
                className="text-red-600 border-red-200"
              >
                Incorrect
              </Button>
              <Button
                variant="outline"
                onClick={markCorrect}
                className="text-green-600 border-green-200"
              >
                Correct
              </Button>
            </div>
          )}

          {!studyMode && (
            <Button
              variant="default"
              onClick={startStudyMode}
              className="bg-blue-600 hover:bg-blue-700"
            >
              Start Study Mode
            </Button>
          )}

          <Button
            variant="outline"
            onClick={nextCard}
            disabled={currentCardIndex === totalCards - 1}
            className="flex items-center gap-1"
          >
            Next
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>

        {/* Study Mode Completion */}
        {studyMode && currentCardIndex === totalCards - 1 && isFlipped && (
          <div className="text-center p-4 bg-blue-50 rounded-lg border">
            <h3 className="font-semibold text-blue-900 mb-2">Study Session Complete!</h3>
            <p className="text-blue-700 mb-3">
              Correct: {correctCount} | Incorrect: {incorrectCount} | 
              Score: {Math.round((correctCount / totalCards) * 100)}%
            </p>
            <Button
              onClick={() => {
                // Update learning performance when flashcard session is completed
                const score = Math.round((correctCount / totalCards) * 100)
                updateFlashcardPerformance(score)
                resetCards()
              }}
              className="bg-blue-600 hover:bg-blue-700"
            >
              Start New Session
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  )
} 