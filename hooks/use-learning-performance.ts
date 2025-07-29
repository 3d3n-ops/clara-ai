import { useState, useEffect } from 'react'

interface LearningPerformance {
  quizScore: number
  flashcardScore: number
  overallScore: number
  totalQuizzes: number
  totalFlashcards: number
}

interface LearningStats {
  currentStreak: number
  totalSessions: number
  lastStudyDate: string | null
  learningPerformance: LearningPerformance
}

export function useLearningPerformance() {
  const [learningStats, setLearningStats] = useState<LearningStats>({
    currentStreak: 0,
    totalSessions: 0,
    lastStudyDate: null,
    learningPerformance: {
      quizScore: 0,
      flashcardScore: 0,
      overallScore: 0,
      totalQuizzes: 0,
      totalFlashcards: 0
    }
  })

  useEffect(() => {
    // Load learning stats from localStorage
    const savedStats = localStorage.getItem("learningStats")
    if (savedStats) {
      const parsedStats = JSON.parse(savedStats)
      // Handle migration from old format to new format
      if (parsedStats.longestStreak !== undefined) {
        // Migrate old format to new format
        const newStats: LearningStats = {
          currentStreak: parsedStats.currentStreak || 0,
          totalSessions: parsedStats.totalSessions || 0,
          lastStudyDate: parsedStats.lastStudyDate || null,
          learningPerformance: {
            quizScore: 75, // Default values for demo
            flashcardScore: 80,
            overallScore: 77,
            totalQuizzes: 5,
            totalFlashcards: 8
          }
        }
        setLearningStats(newStats)
        localStorage.setItem("learningStats", JSON.stringify(newStats))
      } else {
        setLearningStats(parsedStats)
      }
    }
  }, [])

  const updateQuizPerformance = (score: number) => {
    setLearningStats(prev => {
      const currentPerformance = prev.learningPerformance
      const newTotalQuizzes = currentPerformance.totalQuizzes + 1
      const newQuizScore = Math.round(
        ((currentPerformance.quizScore * currentPerformance.totalQuizzes) + score) / newTotalQuizzes
      )
      
      const newPerformance = {
        ...currentPerformance,
        quizScore: newQuizScore,
        totalQuizzes: newTotalQuizzes,
        overallScore: Math.round((newQuizScore + currentPerformance.flashcardScore) / 2)
      }
      
      const newStats = {
        ...prev,
        learningPerformance: newPerformance
      }
      
      localStorage.setItem("learningStats", JSON.stringify(newStats))
      return newStats
    })
  }

  const updateFlashcardPerformance = (score: number) => {
    setLearningStats(prev => {
      const currentPerformance = prev.learningPerformance
      const newTotalFlashcards = currentPerformance.totalFlashcards + 1
      const newFlashcardScore = Math.round(
        ((currentPerformance.flashcardScore * currentPerformance.totalFlashcards) + score) / newTotalFlashcards
      )
      
      const newPerformance = {
        ...currentPerformance,
        flashcardScore: newFlashcardScore,
        totalFlashcards: newTotalFlashcards,
        overallScore: Math.round((currentPerformance.quizScore + newFlashcardScore) / 2)
      }
      
      const newStats = {
        ...prev,
        learningPerformance: newPerformance
      }
      
      localStorage.setItem("learningStats", JSON.stringify(newStats))
      return newStats
    })
  }

  const completeStudySession = () => {
    const today = new Date().toDateString()
    const yesterday = new Date(Date.now() - 86400000).toDateString()

    setLearningStats((prevStats) => {
      let newStreak = prevStats.currentStreak

      // Check if this is a new day
      if (prevStats.lastStudyDate !== today) {
        // If last study was yesterday, increment streak
        if (prevStats.lastStudyDate === yesterday) {
          newStreak = prevStats.currentStreak + 1
        }
        // If last study was more than a day ago, reset streak
        else if (prevStats.lastStudyDate && prevStats.lastStudyDate !== yesterday) {
          newStreak = 1
        }
        // If this is the first study session ever
        else if (!prevStats.lastStudyDate) {
          newStreak = 1
        }
      }

      const newStats = {
        ...prevStats,
        currentStreak: newStreak,
        totalSessions: prevStats.totalSessions + 1,
        lastStudyDate: today,
      }

      // Save to localStorage
      localStorage.setItem("learningStats", JSON.stringify(newStats))

      return newStats
    })
  }

  return {
    learningStats,
    updateQuizPerformance,
    updateFlashcardPerformance,
    completeStudySession
  }
} 