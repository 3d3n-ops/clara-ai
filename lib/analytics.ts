import posthog from 'posthog-js'

// Event type constants for consistency
export const ANALYTICS_EVENTS = {
  // User lifecycle events
  USER_SIGNED_UP: 'user_signed_up',
  USER_SIGNED_IN: 'user_signed_in',
  USER_SIGNED_OUT: 'user_signed_out',
  
  // Navigation events
  PAGE_VIEWED: 'page_viewed',
  NAVIGATION_CLICKED: 'navigation_clicked',
  
  // Dashboard events
  DASHBOARD_VIEWED: 'dashboard_viewed',
  FOLDER_CREATED: 'folder_created',
  FOLDER_VIEWED: 'folder_viewed',
  
  // File management events
  FILE_UPLOADED: 'file_uploaded',
  FILE_UPLOAD_FAILED: 'file_upload_failed',
  FILE_DELETED: 'file_deleted',
  
  // Study session events
  STUDY_SESSION_STARTED: 'study_session_started',
  STUDY_SESSION_COMPLETED: 'study_session_completed',
  STUDY_SESSION_ENDED_EARLY: 'study_session_ended_early',
  VOICE_SESSION_STARTED: 'voice_session_started',
  VOICE_SESSION_ENDED: 'voice_session_ended',
  
  // Homework help events
  HOMEWORK_CHAT_STARTED: 'homework_chat_started',
  HOMEWORK_MESSAGE_SENT: 'homework_message_sent',
  HOMEWORK_MESSAGE_RECEIVED: 'homework_message_received',
  
  // Learning component events
  QUIZ_STARTED: 'quiz_started',
  QUIZ_COMPLETED: 'quiz_completed',
  QUIZ_QUESTION_ANSWERED: 'quiz_question_answered',
  FLASHCARD_SET_STARTED: 'flashcard_set_started',
  FLASHCARD_SET_COMPLETED: 'flashcard_set_completed',
  FLASHCARD_FLIPPED: 'flashcard_flipped',
  DIAGRAM_VIEWED: 'diagram_viewed',
  DIAGRAM_DOWNLOADED: 'diagram_downloaded',
  
  // Performance tracking events
  LEARNING_PERFORMANCE_UPDATED: 'learning_performance_updated',
  QUIZ_SCORE_RECORDED: 'quiz_score_recorded',
  FLASHCARD_SCORE_RECORDED: 'flashcard_score_recorded',
  
  // Feature usage events
  FEATURE_USED: 'feature_used',
  TOOL_GENERATED: 'tool_generated',
  
  // Error events
  ERROR_OCCURRED: 'error_occurred',
  API_ERROR: 'api_error',
  
  // Engagement events
  BUTTON_CLICKED: 'button_clicked',
  LINK_CLICKED: 'link_clicked',
  MODAL_OPENED: 'modal_opened',
  MODAL_CLOSED: 'modal_closed',
} as const

// Property constants for consistency
export const ANALYTICS_PROPERTIES = {
  // Common properties
  USER_ID: 'user_id',
  SESSION_ID: 'session_id',
  PAGE_URL: 'page_url',
  TIMESTAMP: 'timestamp',
  
  // File properties
  FILE_NAME: 'file_name',
  FILE_SIZE: 'file_size',
  FILE_TYPE: 'file_type',
  FOLDER_ID: 'folder_id',
  FOLDER_NAME: 'folder_name',
  
  // Study session properties
  SESSION_DURATION: 'session_duration',
  SESSION_TYPE: 'session_type',
  CONFIDENCE_SCORE: 'confidence_score',
  CLASSES_COVERED: 'classes_covered',
  TOPICS_COVERED: 'topics_covered',
  KEY_CONCEPTS: 'key_concepts',
  
  // Quiz properties
  QUIZ_TITLE: 'quiz_title',
  QUIZ_SCORE: 'quiz_score',
  TOTAL_QUESTIONS: 'total_questions',
  CORRECT_ANSWERS: 'correct_answers',
  QUESTION_INDEX: 'question_index',
  QUESTION_TYPE: 'question_type',
  
  // Flashcard properties
  FLASHCARD_TITLE: 'flashcard_title',
  TOTAL_CARDS: 'total_cards',
  CORRECT_COUNT: 'correct_count',
  INCORRECT_COUNT: 'incorrect_count',
  CURRENT_CARD_INDEX: 'current_card_index',
  
  // Learning performance properties
  OVERALL_SCORE: 'overall_score',
  QUIZ_AVERAGE: 'quiz_average',
  FLASHCARD_AVERAGE: 'flashcard_average',
  TOTAL_SESSIONS: 'total_sessions',
  CURRENT_STREAK: 'current_streak',
  
  // Tool properties
  TOOL_TYPE: 'tool_type',
  TOOL_TITLE: 'tool_title',
  TOOL_DATA: 'tool_data',
  
  // Error properties
  ERROR_TYPE: 'error_type',
  ERROR_MESSAGE: 'error_message',
  ERROR_STACK: 'error_stack',
  
  // UI properties
  BUTTON_TEXT: 'button_text',
  BUTTON_LOCATION: 'button_location',
  LINK_URL: 'link_url',
  MODAL_TYPE: 'modal_type',
} as const

// Analytics utility class
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

  // Initialize PostHog if not already done
  private ensureInitialized() {
    if (!this.isInitialized && typeof window !== 'undefined') {
      this.isInitialized = true
    }
  }

  // Track a custom event
  track(eventName: string, properties?: Record<string, any>) {
    this.ensureInitialized()
    
    try {
      const enrichedProperties = {
        ...properties,
        timestamp: new Date().toISOString(),
        page_url: typeof window !== 'undefined' ? window.location.href : undefined,
      }
      
      posthog.capture(eventName, enrichedProperties)
      console.log(`[Analytics] Tracked: ${eventName}`, enrichedProperties)
    } catch (error) {
      console.error(`[Analytics] Error tracking event ${eventName}:`, error)
    }
  }

  // Track page views
  trackPageView(pageName: string, properties?: Record<string, any>) {
    this.track(ANALYTICS_EVENTS.PAGE_VIEWED, {
      page_name: pageName,
      ...properties,
    })
  }

  // Track user identification
  identify(userId: string, userProperties?: Record<string, any>) {
    this.ensureInitialized()
    
    try {
      posthog.identify(userId, userProperties)
      console.log(`[Analytics] Identified user: ${userId}`, userProperties)
    } catch (error) {
      console.error('[Analytics] Error identifying user:', error)
    }
  }

  // Track user sign up
  trackSignUp(userId: string, properties?: Record<string, any>) {
    this.track(ANALYTICS_EVENTS.USER_SIGNED_UP, {
      [ANALYTICS_PROPERTIES.USER_ID]: userId,
      ...properties,
    })
  }

  // Track user sign in
  trackSignIn(userId: string, properties?: Record<string, any>) {
    this.track(ANALYTICS_EVENTS.USER_SIGNED_IN, {
      [ANALYTICS_PROPERTIES.USER_ID]: userId,
      ...properties,
    })
  }

  // Track file upload
  trackFileUpload(fileName: string, fileSize: number, fileType: string, folderId?: string, properties?: Record<string, any>) {
    this.track(ANALYTICS_EVENTS.FILE_UPLOADED, {
      [ANALYTICS_PROPERTIES.FILE_NAME]: fileName,
      [ANALYTICS_PROPERTIES.FILE_SIZE]: fileSize,
      [ANALYTICS_PROPERTIES.FILE_TYPE]: fileType,
      [ANALYTICS_PROPERTIES.FOLDER_ID]: folderId,
      ...properties,
    })
  }

  // Track study session start
  trackStudySessionStarted(sessionType: string, properties?: Record<string, any>) {
    this.track(ANALYTICS_EVENTS.STUDY_SESSION_STARTED, {
      [ANALYTICS_PROPERTIES.SESSION_TYPE]: sessionType,
      ...properties,
    })
  }

  // Track study session completion
  trackStudySessionCompleted(duration: number, confidenceScore: number, classesCovered: string[], topicsCovered: string[], properties?: Record<string, any>) {
    this.track(ANALYTICS_EVENTS.STUDY_SESSION_COMPLETED, {
      [ANALYTICS_PROPERTIES.SESSION_DURATION]: duration,
      [ANALYTICS_PROPERTIES.CONFIDENCE_SCORE]: confidenceScore,
      [ANALYTICS_PROPERTIES.CLASSES_COVERED]: classesCovered,
      [ANALYTICS_PROPERTIES.TOPICS_COVERED]: topicsCovered,
      ...properties,
    })
  }

  // Track quiz completion
  trackQuizCompleted(quizTitle: string, score: number, totalQuestions: number, correctAnswers: number, properties?: Record<string, any>) {
    this.track(ANALYTICS_EVENTS.QUIZ_COMPLETED, {
      [ANALYTICS_PROPERTIES.QUIZ_TITLE]: quizTitle,
      [ANALYTICS_PROPERTIES.QUIZ_SCORE]: score,
      [ANALYTICS_PROPERTIES.TOTAL_QUESTIONS]: totalQuestions,
      [ANALYTICS_PROPERTIES.CORRECT_ANSWERS]: correctAnswers,
      ...properties,
    })
  }

  // Track flashcard set completion
  trackFlashcardSetCompleted(flashcardTitle: string, totalCards: number, correctCount: number, incorrectCount: number, properties?: Record<string, any>) {
    this.track(ANALYTICS_EVENTS.FLASHCARD_SET_COMPLETED, {
      [ANALYTICS_PROPERTIES.FLASHCARD_TITLE]: flashcardTitle,
      [ANALYTICS_PROPERTIES.TOTAL_CARDS]: totalCards,
      [ANALYTICS_PROPERTIES.CORRECT_COUNT]: correctCount,
      [ANALYTICS_PROPERTIES.INCORRECT_COUNT]: incorrectCount,
      ...properties,
    })
  }

  // Track tool generation
  trackToolGenerated(toolType: string, toolTitle: string, properties?: Record<string, any>) {
    this.track(ANALYTICS_EVENTS.TOOL_GENERATED, {
      [ANALYTICS_PROPERTIES.TOOL_TYPE]: toolType,
      [ANALYTICS_PROPERTIES.TOOL_TITLE]: toolTitle,
      ...properties,
    })
  }

  // Track error
  trackError(errorType: string, errorMessage: string, properties?: Record<string, any>) {
    this.track(ANALYTICS_EVENTS.ERROR_OCCURRED, {
      [ANALYTICS_PROPERTIES.ERROR_TYPE]: errorType,
      [ANALYTICS_PROPERTIES.ERROR_MESSAGE]: errorMessage,
      ...properties,
    })
  }

  // Track button click
  trackButtonClick(buttonText: string, buttonLocation: string, properties?: Record<string, any>) {
    this.track(ANALYTICS_EVENTS.BUTTON_CLICKED, {
      [ANALYTICS_PROPERTIES.BUTTON_TEXT]: buttonText,
      [ANALYTICS_PROPERTIES.BUTTON_LOCATION]: buttonLocation,
      ...properties,
    })
  }

  // Track learning performance update
  trackLearningPerformanceUpdate(overallScore: number, quizAverage: number, flashcardAverage: number, totalSessions: number, currentStreak: number, properties?: Record<string, any>) {
    this.track(ANALYTICS_EVENTS.LEARNING_PERFORMANCE_UPDATED, {
      [ANALYTICS_PROPERTIES.OVERALL_SCORE]: overallScore,
      [ANALYTICS_PROPERTIES.QUIZ_AVERAGE]: quizAverage,
      [ANALYTICS_PROPERTIES.FLASHCARD_AVERAGE]: flashcardAverage,
      [ANALYTICS_PROPERTIES.TOTAL_SESSIONS]: totalSessions,
      [ANALYTICS_PROPERTIES.CURRENT_STREAK]: currentStreak,
      ...properties,
    })
  }
}

// Export singleton instance
export const analytics = Analytics.getInstance()

// Helper functions for common tracking patterns
export const trackPageView = (pageName: string, properties?: Record<string, any>) => {
  analytics.trackPageView(pageName, properties)
}

export const trackFileUpload = (fileName: string, fileSize: number, fileType: string, folderId?: string, properties?: Record<string, any>) => {
  analytics.trackFileUpload(fileName, fileSize, fileType, folderId, properties)
}

export const trackStudySessionStarted = (sessionType: string, properties?: Record<string, any>) => {
  analytics.trackStudySessionStarted(sessionType, properties)
}

export const trackStudySessionCompleted = (duration: number, confidenceScore: number, classesCovered: string[], topicsCovered: string[], properties?: Record<string, any>) => {
  analytics.trackStudySessionCompleted(duration, confidenceScore, classesCovered, topicsCovered, properties)
}

export const trackQuizCompleted = (quizTitle: string, score: number, totalQuestions: number, correctAnswers: number, properties?: Record<string, any>) => {
  analytics.trackQuizCompleted(quizTitle, score, totalQuestions, correctAnswers, properties)
}

export const trackFlashcardSetCompleted = (flashcardTitle: string, totalCards: number, correctCount: number, incorrectCount: number, properties?: Record<string, any>) => {
  analytics.trackFlashcardSetCompleted(flashcardTitle, totalCards, correctCount, incorrectCount, properties)
}

export const trackToolGenerated = (toolType: string, toolTitle: string, properties?: Record<string, any>) => {
  analytics.trackToolGenerated(toolType, toolTitle, properties)
}

export const trackError = (errorType: string, errorMessage: string, properties?: Record<string, any>) => {
  analytics.trackError(errorType, errorMessage, properties)
}

export const trackButtonClick = (buttonText: string, buttonLocation: string, properties?: Record<string, any>) => {
  analytics.trackButtonClick(buttonText, buttonLocation, properties)
}

export const trackLearningPerformanceUpdate = (overallScore: number, quizAverage: number, flashcardAverage: number, totalSessions: number, currentStreak: number, properties?: Record<string, any>) => {
  analytics.trackLearningPerformanceUpdate(overallScore, quizAverage, flashcardAverage, totalSessions, currentStreak, properties)
} 