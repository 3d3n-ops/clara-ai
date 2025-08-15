export const VAPI_CONFIG = {
  // Your Clara agent ID
  AGENT_ID: '4102aa12-fb39-4c0f-82c3-15f4f752f2f6',
  
  // Agent configuration
  ASSISTANT: {
    name: "Clara",
    model: "gpt-4o-mini",
    voice: "clara",
    systemPrompt: `You are Clara, a helpful voice AI assistant designed to help students with their studies.

Your personality:
- Friendly, encouraging, and patient
- Use evidence-based learning techniques
- Ask probing questions to test understanding
- Provide clear explanations with examples
- Adapt to the student's learning pace

Your capabilities:
- Help with homework and study sessions
- Explain complex concepts in simple terms
- Use active recall and spaced repetition techniques
- Provide study tips and learning strategies
- Answer questions across various subjects
- Generate visual content (diagrams, flashcards, quizzes) based on voice commands

Visual Generation Commands:
- "create diagram" or "draw this" - Generate visual diagrams
- "make flashcards" or "create cards" - Generate study flashcards
- "show quiz" or "test me" - Generate interactive quizzes
- "visualize" or "show me" - Create visual representations

Keep responses conversational and engaging. Always encourage the student and celebrate their progress.`
  },
  
  // Function definitions for visual content generation
  FUNCTIONS: [
    {
      name: "generate_diagram",
      description: "Generate a visual diagram based on the user's request",
      parameters: {
        type: "object",
        properties: {
          topic: {
            type: "string",
            description: "The topic or subject for the diagram"
          },
          prompt: {
            type: "string",
            description: "Detailed prompt for diagram generation"
          }
        },
        required: ["topic"]
      }
    },
    {
      name: "generate_flashcards",
      description: "Generate study flashcards based on the user's request",
      parameters: {
        type: "object",
        properties: {
          topic: {
            type: "string",
            description: "The topic or subject for the flashcards"
          },
          prompt: {
            type: "string",
            description: "Detailed prompt for flashcard generation"
          },
          count: {
            type: "number",
            description: "Number of flashcards to generate (default: 5)"
          }
        },
        required: ["topic"]
      }
    },
    {
      name: "generate_quiz",
      description: "Generate an interactive quiz based on the user's request",
      parameters: {
        type: "object",
        properties: {
          topic: {
            type: "string",
            description: "The topic or subject for the quiz"
          },
          prompt: {
            type: "string",
            description: "Detailed prompt for quiz generation"
          },
          questionCount: {
            type: "number",
            description: "Number of questions to generate (default: 5)"
          }
        },
        required: ["topic"]
      }
    },
    {
      name: "generate_mindmap",
      description: "Generate a mindmap based on the user's request",
      parameters: {
        type: "object",
        properties: {
          topic: {
            type: "string",
            description: "The central topic for the mindmap"
          },
          prompt: {
            type: "string",
            description: "Detailed prompt for mindmap generation"
          }
        },
        required: ["topic"]
      }
    }
  ],
  
  // Voice configuration
  VOICE: {
    provider: "11labs",
    voiceId: "clara", // You can customize this
    speed: 1.0,
    stability: 0.5,
    clarity: 0.75
  },
  
  // Transcription configuration
  TRANSCRIPTION: {
    provider: "deepgram",
    model: "nova-3",
    language: "en-US",
    punctuate: true,
    smartFormat: true
  }
}

export const VAPI_EVENTS = {
  CALL_START: 'call-start',
  CALL_END: 'call-end',
  SPEECH_START: 'speech-start',
  SPEECH_END: 'speech-end',
  MESSAGE: 'message',
  FUNCTION_CALL: 'function-call',
  ERROR: 'error'
} as const

export type VapiEventType = typeof VAPI_EVENTS[keyof typeof VAPI_EVENTS] 