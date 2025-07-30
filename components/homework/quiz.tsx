"use client"

import React, { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import { CheckCircle, XCircle, RotateCcw, Download } from "lucide-react"
import { useLearningPerformance } from '@/hooks/use-learning-performance'
import { useUserTracking } from '@/hooks/use-analytics'

interface QuizQuestion {
  question: string
  type: string
  options: string[]
  correct_answer: string
  explanation: string
}

interface QuizProps {
  title: string
  questions: QuizQuestion[]
  validated?: boolean
}

interface QuizResult {
  questionIndex: number
  selectedAnswer: string
  isCorrect: boolean
  question: QuizQuestion
}

export default function Quiz({ title, questions, validated = true }: QuizProps) {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [selectedAnswer, setSelectedAnswer] = useState<string>('')
  const [showAnswer, setShowAnswer] = useState(false)
  const [quizResults, setQuizResults] = useState<QuizResult[]>([])
  const [isQuizComplete, setIsQuizComplete] = useState(false)
  const [quizStarted, setQuizStarted] = useState(false)
  const { updateQuizPerformance } = useLearningPerformance()
  const { trackUserAction } = useUserTracking()

  const currentQuestion = questions[currentQuestionIndex]
  const totalQuestions = questions.length
  const progress = ((currentQuestionIndex + 1) / totalQuestions) * 100

  const startQuiz = () => {
    setQuizStarted(true)
    setCurrentQuestionIndex(0)
    setSelectedAnswer('')
    setShowAnswer(false)
    setQuizResults([])
    setIsQuizComplete(false)
    
    // Track quiz start
    trackUserAction('quiz_started', {
      quiz_title: title,
      total_questions: questions.length,
    })
  }

  const submitAnswer = () => {
    if (!selectedAnswer) return

    const isCorrect = selectedAnswer === currentQuestion.correct_answer
    const result: QuizResult = {
      questionIndex: currentQuestionIndex,
      selectedAnswer,
      isCorrect,
      question: currentQuestion
    }

    setQuizResults([...quizResults, result])
    setShowAnswer(true)
    
    // Track question answered
    trackUserAction('quiz_question_answered', {
      quiz_title: title,
      question_index: currentQuestionIndex,
      question_type: currentQuestion.type,
      is_correct: isCorrect,
      total_questions: questions.length,
    })
  }

  const nextQuestion = () => {
    if (currentQuestionIndex < totalQuestions - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1)
      setSelectedAnswer('')
      setShowAnswer(false)
    } else {
      setIsQuizComplete(true)
      // Update learning performance when quiz is completed
      const correctAnswers = quizResults.filter(r => r.isCorrect).length + 1 // +1 for current question
      const score = Math.round((correctAnswers / totalQuestions) * 100)
      updateQuizPerformance(score)
      
      // Track quiz completion
      trackUserAction('quiz_completed', {
        quiz_title: title,
        total_questions: totalQuestions,
        correct_answers: correctAnswers,
        score: score,
      })
    }
  }

  const resetQuiz = () => {
    setQuizStarted(false)
    setCurrentQuestionIndex(0)
    setSelectedAnswer('')
    setShowAnswer(false)
    setQuizResults([])
    setIsQuizComplete(false)
  }

  const downloadResults = () => {
    const correctAnswers = quizResults.filter(r => r.isCorrect).length
    const score = Math.round((correctAnswers / totalQuestions) * 100)
    
    const results = {
      title,
      completed_at: new Date().toISOString(),
      score: `${correctAnswers}/${totalQuestions} (${score}%)`,
      results: quizResults.map(r => ({
        question: r.question.question,
        selected_answer: r.selectedAnswer,
        correct_answer: r.question.correct_answer,
        is_correct: r.isCorrect,
        explanation: r.question.explanation
      }))
    }

    const blob = new Blob([JSON.stringify(results, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${title.replace(/\s+/g, '_')}_quiz_results.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const correctAnswers = quizResults.filter(r => r.isCorrect).length
  const finalScore = totalQuestions > 0 ? Math.round((correctAnswers / totalQuestions) * 100) : 0

  if (!quizStarted) {
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
          </div>
          <p className="text-sm text-gray-600">
            {totalQuestions} question{totalQuestions !== 1 ? 's' : ''}
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="text-center">
            <p className="text-gray-700 mb-4">
              Test your understanding with this interactive quiz.
            </p>
            <Button 
              onClick={startQuiz}
              className="bg-blue-600 hover:bg-blue-700"
            >
              Start Quiz
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (isQuizComplete) {
    return (
      <Card className="w-full max-w-2xl">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg font-semibold">Quiz Complete!</CardTitle>
            <Button
              variant="outline"
              size="sm"
              onClick={downloadResults}
              className="h-8"
            >
              <Download className="w-4 h-4 mr-1" />
              Download Results
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="text-center p-6 bg-blue-50 rounded-lg border">
            <h3 className="text-2xl font-bold text-blue-900 mb-2">
              Your Score: {correctAnswers}/{totalQuestions}
            </h3>
            <p className="text-xl text-blue-700 mb-4">{finalScore}%</p>
            
            <div className="space-y-2 mb-4">
              {finalScore >= 90 && (
                <Badge className="bg-green-100 text-green-800">Excellent! 🎉</Badge>
              )}
              {finalScore >= 70 && finalScore < 90 && (
                <Badge className="bg-blue-100 text-blue-800">Good Job! 👍</Badge>
              )}
              {finalScore >= 50 && finalScore < 70 && (
                <Badge className="bg-yellow-100 text-yellow-800">Keep Practicing 📚</Badge>
              )}
              {finalScore < 50 && (
                <Badge className="bg-red-100 text-red-800">Review Material 📖</Badge>
              )}
            </div>
          </div>

          {/* Review incorrect answers */}
          <div className="space-y-3">
            <h4 className="font-semibold">Review:</h4>
            {quizResults.map((result, index) => (
              <div 
                key={index}
                className={`p-3 rounded-lg border ${
                  result.isCorrect ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'
                }`}
              >
                <div className="flex items-start gap-2">
                  {result.isCorrect ? (
                    <CheckCircle className="w-5 h-5 text-green-600 mt-0.5" />
                  ) : (
                    <XCircle className="w-5 h-5 text-red-600 mt-0.5" />
                  )}
                  <div className="flex-1">
                    <p className="font-medium text-sm mb-1">{result.question.question}</p>
                    {!result.isCorrect && (
                      <div className="text-xs space-y-1">
                        <p className="text-red-700">
                          Your answer: {result.selectedAnswer}
                        </p>
                        <p className="text-green-700">
                          Correct answer: {result.question.correct_answer}
                        </p>
                        <p className="text-gray-600">
                          {result.question.explanation}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="flex gap-2 justify-center">
            <Button
              onClick={resetQuiz}
              className="bg-blue-600 hover:bg-blue-700"
            >
              <RotateCcw className="w-4 h-4 mr-1" />
              Take Again
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="w-full max-w-2xl">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold">{title}</CardTitle>
          <Badge variant="outline">
            {currentQuestionIndex + 1} of {totalQuestions}
          </Badge>
        </div>
        <Progress value={progress} className="h-2" />
      </CardHeader>
      
      <CardContent className="space-y-4">
        <div className="p-4 bg-gray-50 rounded-lg">
          <h3 className="font-medium text-gray-900 mb-3">
            {currentQuestion.question}
          </h3>
          
          <RadioGroup
            value={selectedAnswer}
            onValueChange={setSelectedAnswer}
            disabled={showAnswer}
          >
            {currentQuestion.options.map((option, index) => {
              const isSelected = selectedAnswer === option
              const isCorrect = option === currentQuestion.correct_answer
              
              let optionClass = "p-3 rounded border cursor-pointer transition-colors"
              
              if (showAnswer) {
                if (isCorrect) {
                  optionClass += " bg-green-50 border-green-200"
                } else if (isSelected && !isCorrect) {
                  optionClass += " bg-red-50 border-red-200"
                } else {
                  optionClass += " bg-gray-50 border-gray-200"
                }
              } else {
                optionClass += isSelected 
                  ? " bg-blue-50 border-blue-300" 
                  : " bg-white border-gray-200 hover:border-blue-200"
              }
              
              return (
                <div key={index} className={optionClass}>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem
                      value={option}
                      id={`option-${index}`}
                      disabled={showAnswer}
                    />
                    <Label
                      htmlFor={`option-${index}`}
                      className="flex-1 cursor-pointer"
                    >
                      {option}
                    </Label>
                    {showAnswer && isCorrect && (
                      <CheckCircle className="w-4 h-4 text-green-600" />
                    )}
                    {showAnswer && isSelected && !isCorrect && (
                      <XCircle className="w-4 h-4 text-red-600" />
                    )}
                  </div>
                </div>
              )
            })}
          </RadioGroup>
        </div>

        {showAnswer && (
          <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
            <h4 className="font-medium text-blue-900 mb-2">Explanation:</h4>
            <p className="text-blue-800 text-sm">{currentQuestion.explanation}</p>
          </div>
        )}

        <div className="flex justify-between">
          <Button
            variant="outline"
            onClick={resetQuiz}
          >
            <RotateCcw className="w-4 h-4 mr-1" />
            Reset
          </Button>
          
          <div className="flex gap-2">
            {!showAnswer ? (
              <Button
                onClick={submitAnswer}
                disabled={!selectedAnswer}
                className="bg-blue-600 hover:bg-blue-700"
              >
                Submit Answer
              </Button>
            ) : (
              <Button
                onClick={nextQuestion}
                className="bg-blue-600 hover:bg-blue-700"
              >
                {currentQuestionIndex < totalQuestions - 1 ? 'Next Question' : 'View Results'}
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
} 