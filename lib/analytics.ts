import posthog from 'posthog-js'

export const ANALYTICS_EVENTS = {
  // User lifecycle events
  USER_SIGNED_UP: 'user_signed_up',
  USER_SIGNED_IN: 'user_signed_in',
  USER_SIGNED_OUT: 'user_signed_out',
  
  // Navigation events
  PAGE_VIEWED: 'page_viewed',
  NAVIGATION: 'navigation',
  
  // Dashboard events
  DASHBOARD_LOADED: 'dashboard_loaded',
  FOLDER_CREATED: 'folder_created',
  FOLDER_CREATION_FAILED: 'folder_creation_failed',
  FOLDER_CREATION_ERROR: 'folder_creation_error',
  
  // File management events
  FILE_UPLOADED: 'file_uploaded',
  FILE_UPLOAD_FAILED: 'file_upload_failed',
  FILE_DELETED: 'file_deleted',
  
  // Study session events
  STUDY_SESSION_STARTED: 'study_session_started',
  STUDY_SESSION_COMPLETED: 'study_session_completed',
  STUDY_SESSION_ENDED_EARLY: 'study_session_ended_early',
  
  // Homework help events
  HOMEWORK_MESSAGE_SENT: 'homework_message_sent',
  HOMEWORK_MESSAGE_RECEIVED: 'homework_message_received',
  HOMEWORK_CHAT_ERROR: 'homework_chat_error',
  
  // Voice session events
  VOICE_SESSION_STARTED: 'voice_session_started',
  VOICE_SESSION_ENDED: 'voice_session_ended',
  VOICE_SESSION_START_FAILED: 'voice_session_start_failed',
  
  // Learning component events
  QUIZ_STARTED: 'quiz_started',
  QUIZ_QUESTION_ANSWERED: 'quiz_question_answered',
  QUIZ_COMPLETED: 'quiz_completed',
  FLASHCARD_FLIPPED: 'flashcard_flipped',
  FLASHCARD_SET_STARTED: 'flashcard_set_started',
  FLASHCARD_MARKED_CORRECT: 'flashcard_marked_correct',
  FLASHCARD_MARKED_INCORRECT: 'flashcard_marked_incorrect',
  
  // Tool generation events
  TOOL_GENERATED: 'tool_generated',
  
  // Performance tracking events
  LEARNING_PERFORMANCE_UPDATED: 'learning_performance_updated',
  
  // Error events
  ERROR_OCCURRED: 'error_occurred',
  
  // Button click events
  BUTTON_CLICKED: 'button_clicked',
} as const

export const ANALYTICS_PROPERTIES = {
  // User properties
  USER_ID: 'user_id',
  USER_EMAIL: 'user_email',
  USER_NAME: 'user_name',
  
  // Page properties
  PAGE_NAME: 'page_name',
  PAGE_URL: 'page_url',
  
  // File properties
  FILE_NAME: 'file_name',
  FILE_SIZE: 'file_size',
  FILE_TYPE: 'file_type',
  FOLDER_ID: 'folder_id',
  
  // Session properties
  SESSION_DURATION: 'session_duration',
  SESSION_TYPE: 'session_type',
  
  // Quiz properties
  QUIZ_TITLE: 'quiz_title',
  QUIZ_SCORE: 'quiz_score',
  TOTAL_QUESTIONS: 'total_questions',
  CORRECT_ANSWERS: 'correct_answers',
  
  // Flashcard properties
  FLASHCARD_TITLE: 'flashcard_title',
  TOTAL_CARDS: 'total_cards',
  CORRECT_COUNT: 'correct_count',
  INCORRECT_COUNT: 'incorrect_count',
  
  // Error properties
  ERROR_TYPE: 'error_type',
  ERROR_MESSAGE: 'error_message',
  
  // Button properties
  BUTTON_TEXT: 'button_text',
  BUTTON_LOCATION: 'button_location',
  
  // Performance properties
  OVERALL_SCORE: 'overall_score',
  QUIZ_AVERAGE: 'quiz_average',
  FLASHCARD_AVERAGE: 'flashcard_average',
  TOTAL_SESSIONS: 'total_sessions',
  CURRENT_STREAK: 'current_streak',
} as const

export class Analytics {
  private static instance: Analytics
  private isInitialized = false

  private constructor() {}

  static getInstance(): Analytics {
    if (!Analytics.instance) {
      Analytics.instance = new Analytics()
    }
    return Analytics.instance
  }

  private ensureInitialized() {
    if (!this.isInitialized) {
      try {
        // Check if PostHog is available and initialized
        if (typeof window !== 'undefined' && posthog) {
          this.isInitialized = true
        } else {
          console.warn('PostHog not initialized. Analytics will be disabled.')
        }
      } catch (error) {
        console.warn('PostHog initialization check failed:', error)
      }
    }
  }

  track(eventName: string, properties?: Record<string, any>) {
    try {
      this.ensureInitialized()
      if (this.isInitialized && typeof window !== 'undefined' && posthog) {
        posthog.capture(eventName, properties)
      }
    } catch (error) {
      console.warn('Failed to track event:', eventName, error)
    }
  }

  trackPageView(pageName: string, properties?: Record<string, any>) {
    this.track(ANALYTICS_EVENTS.PAGE_VIEWED, {
      [ANALYTICS_PROPERTIES.PAGE_NAME]: pageName,
      ...properties
    })
  }

  identify(userId: string, userProperties?: Record<string, any>) {
    try {
      this.ensureInitialized()
      if (this.isInitialized && typeof window !== 'undefined' && posthog) {
        posthog.identify(userId, userProperties)
      }
    } catch (error) {
      console.warn('Failed to identify user:', error)
    }
  }

  trackSignUp(userId: string, properties?: Record<string, any>) {
    this.track(ANALYTICS_EVENTS.USER_SIGNED_UP, {
      [ANALYTICS_PROPERTIES.USER_ID]: userId,
      ...properties
    })
  }

  trackSignIn(userId: string, properties?: Record<string, any>) {
    this.track(ANALYTICS_EVENTS.USER_SIGNED_IN, {
      [ANALYTICS_PROPERTIES.USER_ID]: userId,
      ...properties
    })
  }

  trackFileUpload(fileName: string, fileSize: number, fileType: string, folderId?: string, properties?: Record<string, any>) {
    this.track(ANALYTICS_EVENTS.FILE_UPLOADED, {
      [ANALYTICS_PROPERTIES.FILE_NAME]: fileName,
      [ANALYTICS_PROPERTIES.FILE_SIZE]: fileSize,
      [ANALYTICS_PROPERTIES.FILE_TYPE]: fileType,
      [ANALYTICS_PROPERTIES.FOLDER_ID]: folderId,
      ...properties
    })
  }

  trackStudySessionStarted(sessionType: string, properties?: Record<string, any>) {
    this.track(ANALYTICS_EVENTS.STUDY_SESSION_STARTED, {
      [ANALYTICS_PROPERTIES.SESSION_TYPE]: sessionType,
      ...properties
    })
  }

  trackStudySessionCompleted(duration: number, confidenceScore: number, classesCovered: string[], topicsCovered: string[], properties?: Record<string, any>) {
    this.track(ANALYTICS_EVENTS.STUDY_SESSION_COMPLETED, {
      [ANALYTICS_PROPERTIES.SESSION_DURATION]: duration,
      confidence_score: confidenceScore,
      classes_covered: classesCovered,
      topics_covered: topicsCovered,
      ...properties
    })
  }

  trackQuizCompleted(quizTitle: string, score: number, totalQuestions: number, correctAnswers: number, properties?: Record<string, any>) {
    this.track(ANALYTICS_EVENTS.QUIZ_COMPLETED, {
      [ANALYTICS_PROPERTIES.QUIZ_TITLE]: quizTitle,
      [ANALYTICS_PROPERTIES.QUIZ_SCORE]: score,
      [ANALYTICS_PROPERTIES.TOTAL_QUESTIONS]: totalQuestions,
      [ANALYTICS_PROPERTIES.CORRECT_ANSWERS]: correctAnswers,
      ...properties
    })
  }

  trackFlashcardSetCompleted(flashcardTitle: string, totalCards: number, correctCount: number, incorrectCount: number, properties?: Record<string, any>) {
    this.track(ANALYTICS_EVENTS.FLASHCARD_SET_STARTED, {
      [ANALYTICS_PROPERTIES.FLASHCARD_TITLE]: flashcardTitle,
      [ANALYTICS_PROPERTIES.TOTAL_CARDS]: totalCards,
      [ANALYTICS_PROPERTIES.CORRECT_COUNT]: correctCount,
      [ANALYTICS_PROPERTIES.INCORRECT_COUNT]: incorrectCount,
      ...properties
    })
  }

  trackToolGenerated(toolType: string, toolTitle: string, properties?: Record<string, any>) {
    this.track(ANALYTICS_EVENTS.TOOL_GENERATED, {
      tool_type: toolType,
      tool_title: toolTitle,
      ...properties
    })
  }

  trackError(errorType: string, errorMessage: string, properties?: Record<string, any>) {
    this.track(ANALYTICS_EVENTS.ERROR_OCCURRED, {
      [ANALYTICS_PROPERTIES.ERROR_TYPE]: errorType,
      [ANALYTICS_PROPERTIES.ERROR_MESSAGE]: errorMessage,
      ...properties
    })
  }

  trackButtonClick(buttonText: string, buttonLocation: string, properties?: Record<string, any>) {
    this.track(ANALYTICS_EVENTS.BUTTON_CLICKED, {
      [ANALYTICS_PROPERTIES.BUTTON_TEXT]: buttonText,
      [ANALYTICS_PROPERTIES.BUTTON_LOCATION]: buttonLocation,
      ...properties
    })
  }

  trackLearningPerformanceUpdate(overallScore: number, quizAverage: number, flashcardAverage: number, totalSessions: number, currentStreak: number, properties?: Record<string, any>) {
    this.track(ANALYTICS_EVENTS.LEARNING_PERFORMANCE_UPDATED, {
      [ANALYTICS_PROPERTIES.OVERALL_SCORE]: overallScore,
      [ANALYTICS_PROPERTIES.QUIZ_AVERAGE]: quizAverage,
      [ANALYTICS_PROPERTIES.FLASHCARD_AVERAGE]: flashcardAverage,
      [ANALYTICS_PROPERTIES.TOTAL_SESSIONS]: totalSessions,
      [ANALYTICS_PROPERTIES.CURRENT_STREAK]: currentStreak,
      ...properties
    })
  }
}

export const analytics = Analytics.getInstance()

// Helper functions for common tracking patterns
export const trackPageView = (pageName: string, properties?: Record<string, any>) => {
  analytics.trackPageView(pageName, properties)
}

export const trackUserAction = (action: string, properties?: Record<string, any>) => {
  analytics.track(action, properties)
}

export const trackError = (errorType: string, errorMessage: string, properties?: Record<string, any>) => {
  analytics.trackError(errorType, errorMessage, properties)
}

export const trackButtonClick = (buttonText: string, buttonLocation: string, properties?: Record<string, any>) => {
  analytics.trackButtonClick(buttonText, buttonLocation, properties)
} 