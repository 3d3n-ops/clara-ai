"use client"

import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Mic, MicOff } from 'lucide-react'
import { useVoiceAgent } from '@/hooks/use-voice-agent'
import { renderVisualContentInRectangle } from '@/components/demo-multimodal-chat'

export default function DemoPage() {
  const [isLoaded, setIsLoaded] = useState(false)
  const [currentSection, setCurrentSection] = useState(1)
  const [isRecording, setIsRecording] = useState(false)

  // Voice agent for sections 2, 3, and 4
  const voiceAgent = useVoiceAgent({
    roomName: `clara-demo-section-${currentSection}`,
    userId: `demo-user-${Date.now()}`
  })

  // Multimodal chat state for section 4
  const [multimodalMessages, setMultimodalMessages] = useState<Array<{id: string, type: 'user' | 'assistant', content: string}>>([])
  const [visualContent, setVisualContent] = useState<any>(null)
  const [multimodalInput, setMultimodalInput] = useState("")
  const [isMultimodalTyping, setIsMultimodalTyping] = useState(false)

  useEffect(() => {
    // Trigger fade-in animation after component mounts
    const timer = setTimeout(() => {
      setIsLoaded(true)
    }, 100)

    return () => clearTimeout(timer)
  }, [])

  const handleBeginClick = () => {
    setCurrentSection(2)
  }

  const handleNextClick = () => {
    setCurrentSection(3)
  }

  const handleNextClick2 = () => {
    setCurrentSection(4)
  }

  const handleNextClick3 = () => {
    setCurrentSection(5)
  }

  const handleNextClick4 = () => {
    setCurrentSection(6)
  }

  const handleNextClick5 = () => {
    setCurrentSection(7)
  }

  const handleNextClick6 = () => {
    setCurrentSection(8)
  }

  const toggleRecording = () => {
    setIsRecording(!isRecording)
    // Integrate with LiveKit voice agent
    voiceAgent.toggleRecording()
    console.log('Voice recording toggled:', !isRecording)
  }

  const handleMultimodalSend = async () => {
    if (!multimodalInput.trim()) return

    const userMessage = {
      id: Date.now().toString(),
      type: 'user' as const,
      content: multimodalInput
    }

    setMultimodalMessages(prev => [...prev, userMessage])
    setMultimodalInput("")
    setIsMultimodalTyping(true)

    try {
      // Send to multimodal chat API
      const response = await fetch('/api/multimodal/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: multimodalInput,
          context: {
            isScreenSharing: false,
            previousMessages: multimodalMessages.slice(-3)
          }
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to get response')
      }

      const data = await response.json()
      
      // Check if response contains visual content commands
      const lowerMessage = multimodalInput.toLowerCase()
      const isVisualRequest = lowerMessage.includes('flashcard') || 
                             lowerMessage.includes('quiz') || 
                             lowerMessage.includes('diagram') ||
                             lowerMessage.includes('create') ||
                             lowerMessage.includes('generate')

      if (isVisualRequest) {
        // Generate visual content based on the request
        const visualType = lowerMessage.includes('flashcard') ? 'flashcard' :
                          lowerMessage.includes('quiz') ? 'quiz' : 'diagram'
        
        const newVisualContent = {
          type: visualType,
          title: `Generated ${visualType} for: ${multimodalInput}`,
          content: generateMockVisualContent(visualType, multimodalInput),
          timestamp: new Date()
        }
        
        setVisualContent(newVisualContent)
      }

      const assistantMessage = {
        id: (Date.now() + 1).toString(),
        type: 'assistant' as const,
        content: data.response || "I'm here to help! Try asking me to create flashcards, quizzes, or diagrams."
      }

      setMultimodalMessages(prev => [...prev, assistantMessage])

    } catch (error) {
      console.error('Error sending multimodal message:', error)
      
      const errorMessage = {
        id: (Date.now() + 1).toString(),
        type: 'assistant' as const,
        content: "Sorry, I'm having trouble processing that. Try asking me to create flashcards, quizzes, or diagrams!"
      }
      
      setMultimodalMessages(prev => [...prev, errorMessage])
    } finally {
      setIsMultimodalTyping(false)
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

  // First Section - Original Landing
  if (currentSection === 1) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center p-4">
        <div className="text-center space-y-8 max-w-2xl mx-auto">
          {/* Main Heading */}
          <h1 
            className={`text-5xl md:text-6xl font-bold text-gray-900 transition-all duration-1000 ease-out ${
              isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
            }`}
          >
            A new mode of learning
          </h1>

          {/* Subtitle */}
          <p 
            className={`text-xl md:text-2xl text-gray-700 font-instrument-serif italic transition-all duration-1000 ease-out delay-300 ${
              isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
            }`}
          >
            that's interactive, personalized, and multimodal.
          </p>

          {/* Circular Background Image */}
          <div 
            className={`relative w-64 h-64 mx-auto transition-all duration-1000 ease-out delay-600 ${
              isLoaded ? 'opacity-100 scale-100' : 'opacity-0 scale-95'
            }`}
          >
            <div 
              className="absolute inset-0 rounded-full overflow-hidden"
              style={{
                background: `url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjU2IiBoZWlnaHQ9IjI1NiIgdmlld0JveD0iMCAwIDI1NiAyNTYiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIyNTYiIGhlaWdodD0iMjU2IiBmaWxsPSJ1cmwoI2dyYWRpZW50KSIvPgo8ZGVmcz4KPGxpbmVhckdyYWRpZW50IGlkPSJncmFkaWVudCIgeDE9IjAiIHkxPSIwIiB4Mj0iMjU2IiB5Mj0iMjU2IiBncmFkaWVudFVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+CjxzdG9wIG9mZnNldD0iMCUiIHN0eWxlPSJzdG9wLWNvbG9yOiNmZmY7c3RvcC1vcGFjaXR5OjEiLz4KPHN0b3Agb2Zmc2V0PSIxNSUiIHN0eWxlPSJzdG9wLWNvbG9yOiNmMGYwZmY7c3RvcC1vcGFjaXR5OjEiLz4KPHN0b3Agb2Zmc2V0PSI0MCUiIHN0eWxlPSJzdG9wLWNvbG9yOiNjN2M3ZTg7c3RvcC1vcGFjaXR5OjEiLz4KPHN0b3Agb2Zmc2V0PSI2MCUiIHN0eWxlPSJzdG9wLWNvbG9yOiM5M2M1ZmQ7c3RvcC1vcGFjaXR5OjEiLz4KPHN0b3Agb2Zmc2V0PSI4MCUiIHN0eWxlPSJzdG9wLWNvbG9yOiM2MGE1ZmE7c3RvcC1vcGFjaXR5OjEiLz4KPHN0b3Agb2Zmc2V0PSIxMDAlIiBzdHlsZT0ic3RvcC1jb2xvcjojM2I4MmY2O3N0b3Atb3BhY2l0eToxIi8+CjwvbGluZWFyR3JhZGllbnQ+CjwvZGVmcz4KPC9zdmc+')`,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                filter: 'blur(2px)',
              }}
            />
            <div 
              className="absolute inset-2 rounded-full overflow-hidden"
              style={{
                background: `url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjU2IiBoZWlnaHQ9IjI1NiIgdmlld0JveD0iMCAwIDI1NiAyNTYiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIyNTYiIGhlaWdodD0iMjU2IiBmaWxsPSJ1cmwoI2dyYWRpZW50KSIvPgo8ZGVmcz4KPGxpbmVhckdyYWRpZW50IGlkPSJncmFkaWVudCIgeDE9IjAiIHkxPSIwIiB4Mj0iMjU2IiB5Mj0iMjU2IiBncmFkaWVudFVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+CjxzdG9wIG9mZnNldD0iMCUiIHN0eWxlPSJzdG9wLWNvbG9yOiNmZmY7c3RvcC1vcGFjaXR5OjEiLz4KPHN0b3Agb2Zmc2V0PSIxNSUiIHN0eWxlPSJzdG9wLWNvbG9yOiNmMGYwZmY7c3RvcC1vcGFjaXR5OjEiLz4KPHN0b3Agb2Zmc2V0PSI0MCUiIHN0eWxlPSJzdG9wLWNvbG9yOiNjN2M3ZTg7c3RvcC1vcGFjaXR5OjEiLz4KPHN0b3Agb2Zmc2V0PSI2MCUiIHN0eWxlPSJzdG9wLWNvbG9yOiM5M2M1ZmQ7c3RvcC1vcGFjaXR5OjEiLz4KPHN0b3Agb2Zmc2V0PSI4MCUiIHN0eWxlPSJzdG9wLWNvbG9yOiM2MGE1ZmE7c3RvcC1vcGFjaXR5OjEiLz4KPHN0b3Agb2Zmc2V0PSIxMDAlIiBzdHlsZT0ic3RvcC1jb2xvcjojM2I4MmY2O3N0b3Atb3BhY2l0eToxIi8+CjwvbGluZWFyR3JhZGllbnQ+CjwvZGVmcz4KPC9zdmc+')`,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
              }}
            />
          </div>

          {/* Call to Action Button */}
          <div 
            className={`transition-all duration-1000 ease-out delay-900 ${
              isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
            }`}
          >
            <Button 
              size="lg" 
              className="bg-black hover:bg-gray-800 text-white px-8 py-3 text-lg font-semibold rounded-lg transition-all duration-300 hover:scale-105"
              onClick={handleBeginClick}
            >
              Begin!
            </Button>
          </div>
        </div>
      </div>
    )
  }

  // Second Section - Voice Assistant (Text above rectangle with mic)
  if (currentSection === 2) {
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center p-4">
        {/* Heading - Above rectangle */}
        <h2 
          className={`text-3xl md:text-4xl font-instrument-serif italic text-gray-900 mb-8 text-center transition-all duration-1000 ease-out ${
            isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
          }`}
        >
          It's interactive!
        </h2>

        {/* Main Interactive Container */}
        <div 
          className={`relative w-full max-w-6xl h-[500px] mb-8 transition-all duration-1000 ease-out delay-600 ${
            isLoaded ? 'opacity-100 scale-100' : 'opacity-0 scale-95'
          }`}
        >
          {/* Background Container with Border */}
          <div 
            className="absolute inset-0 rounded-2xl border-2 border-blue-400 overflow-hidden shadow-lg"
            style={{
              background: `url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iODAwIiBoZWlnaHQ9IjQwMCIgdmlld0JveD0iMCAwIDgwMCA0MDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSI4MDAiIGhlaWdodD0iNDAwIiBmaWxsPSJ1cmwoI2dyYWRpZW50KSIvPgo8ZGVmcz4KPGxpbmVhckdyYWRpZW50IGlkPSJncmFkaWVudCIgeDE9IjAiIHkxPSIwIiB4Mj0iODAwIiB5Mj0iNDAwIiBncmFkaWVudFVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+CjxzdG9wIG9mZnNldD0iMCUiIHN0eWxlPSJzdG9wLWNvbG9yOiNkZGZmZGQ7c3RvcC1vcGFjaXR5OjEiLz4KPHN0b3Agb2Zmc2V0PSIyMCUiIHN0eWxlPSJzdG9wLWNvbG9yOiNjY2ZmY2M7c3RvcC1vcGFjaXR5OjEiLz4KPHN0b3Agb2Zmc2V0PSI0MCUiIHN0eWxlPSJzdG9wLWNvbG9yOiNhYWZmYWE7c3RvcC1vcGFjaXR5OjEiLz4KPHN0b3Agb2Zmc2V0PSI2MCUiIHN0eWxlPSJzdG9wLWNvbG9yOiM4OGZmYTg7c3RvcC1vcGFjaXR5OjEiLz4KPHN0b3Agb2Zmc2V0PSI4MCUiIHN0eWxlPSJzdG9wLWNvbG9yOiM2NmZmZjY7c3RvcC1vcGFjaXR5OjEiLz4KPHN0b3Agb2Zmc2V0PSIxMDAlIiBzdHlsZT0ic3RvcC1jb2xvcjojNDRmZmY0O3N0b3Atb3BhY2l0eToxIi8+CjwvbGluZWFyR3JhZGllbnQ+CjwvZGVmcz4KPC9zdmc+')`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              filter: 'blur(3px)',
            }}
          />
          
          {/* Central White Circle Cutout with Mic */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="relative">
              {/* White Circle Background */}
              <div className="w-32 h-32 bg-white rounded-full shadow-lg flex items-center justify-center">
                {/* Mic Icon */}
                <button
                  onClick={toggleRecording}
                  className={`w-16 h-16 rounded-full flex items-center justify-center transition-all duration-300 ${
                    voiceAgent.isRecording || voiceAgent.isProcessing
                      ? 'bg-red-500 hover:bg-red-600 animate-pulse' 
                      : 'bg-gray-200 hover:bg-gray-300'
                  }`}
                >
                  {voiceAgent.isProcessing ? (
                    <div className="w-8 h-8 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : voiceAgent.isRecording ? (
                    <MicOff className="w-8 h-8 text-white" />
                  ) : (
                    <Mic className="w-8 h-8 text-gray-600" />
                  )}
                </button>
              </div>
              
              {/* Recording Indicator */}
              {(voiceAgent.isRecording || voiceAgent.isProcessing) && (
                <div className="absolute -top-2 -right-2 w-4 h-4 bg-red-500 rounded-full animate-ping" />
              )}
              
              {/* Connection Status */}
              {voiceAgent.error && (
                <div className="absolute -bottom-8 left-1/2 transform -translate-x-1/2 text-xs text-red-500 bg-red-100 px-2 py-1 rounded">
                  {voiceAgent.error}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Next Button - Bottom Right */}
        <div 
          className={`flex justify-end w-full max-w-6xl transition-all duration-1000 ease-out delay-900 ${
            isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
          }`}
        >
          <Button 
            variant="outline"
            className="bg-gray-100 border-gray-300 text-gray-900 hover:bg-gray-200 px-6 py-2 rounded-lg"
            onClick={handleNextClick}
          >
            Next
          </Button>
        </div>
      </div>
    )
  }

  // Third Section - Personalized (Text in top-left, plain white circle)
  if (currentSection === 3) {
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center p-4">
        {/* Heading - Above rectangle */}
        <h2 
          className={`text-3xl md:text-4xl font-instrument-serif italic text-gray-900 mb-8 text-center transition-all duration-1000 ease-out ${
            isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
          }`}
        >
          It's personalized!
        </h2>

        {/* Main Interactive Container */}
        <div 
          className={`relative w-full max-w-6xl h-[500px] mb-8 transition-all duration-1000 ease-out delay-600 ${
            isLoaded ? 'opacity-100 scale-100' : 'opacity-0 scale-95'
          }`}
        >
          {/* Background Container with Border */}
          <div 
            className="absolute inset-0 rounded-2xl border-2 border-blue-400 overflow-hidden shadow-lg"
            style={{
              background: `url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iODAwIiBoZWlnaHQ9IjQwMCIgdmlld0JveD0iMCAwIDgwMCA0MDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSI4MDAiIGhlaWdodD0iNDAwIiBmaWxsPSJ1cmwoI2dyYWRpZW50KSIvPgo8ZGVmcz4KPGxpbmVhckdyYWRpZW50IGlkPSJncmFkaWVudCIgeDE9IjAiIHkxPSIwIiB4Mj0iODAwIiB5Mj0iNDAwIiBncmFkaWVudFVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+CjxzdG9wIG9mZnNldD0iMCUiIHN0eWxlPSJzdG9wLWNvbG9yOiNmZmY7c3RvcC1vcGFjaXR5OjEiLz4KPHN0b3Agb2Zmc2V0PSIyMCUiIHN0eWxlPSJzdG9wLWNvbG9yOiNmMGYwZmY7c3RvcC1vcGFjaXR5OjEiLz4KPHN0b3Agb2Zmc2V0PSIzMCUiIHN0eWxlPSJzdG9wLWNvbG9yOiNmY2YwZmY7c3RvcC1vcGFjaXR5OjEiLz4KPHN0b3Agb2Zmc2V0PSI0NSUiIHN0eWxlPSJzdG9wLWNvbG9yOiNmZmYwZmY7c3RvcC1vcGFjaXR5OjEiLz4KPHN0b3Agb2Zmc2V0PSI2MCUiIHN0eWxlPSJzdG9wLWNvbG9yOiNmZmYwZmY7c3RvcC1vcGFjaXR5OjEiLz4KPHN0b3Agb2Zmc2V0PSI3NSUiIHN0eWxlPSJzdG9wLWNvbG9yOiNmZmYwZmY7c3RvcC1vcGFjaXR5OjEiLz4KPHN0b3Agb2Zmc2V0PSI5MCUiIHN0eWxlPSJzdG9wLWNvbG9yOiNmZmYwZmY7c3RvcC1vcGFjaXR5OjEiLz4KPHN0b3Agb2Zmc2V0PSIxMDAlIiBzdHlsZT0ic3RvcC1jb2xvcjojZmZmO3N0b3Atb3BhY2l0eToxIi8+CjwvbGluZWFyR3JhZGllbnQ+CjwvZGVmcz4KPC9zdmc+')`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              filter: 'blur(3px)',
            }}
          />
          
          {/* Central White Circle Cutout with Mic */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="relative">
              {/* White Circle Background */}
              <div className="w-32 h-32 bg-white rounded-full shadow-lg flex items-center justify-center">
                {/* Mic Icon */}
                <button
                  onClick={toggleRecording}
                  className={`w-16 h-16 rounded-full flex items-center justify-center transition-all duration-300 ${
                    voiceAgent.isRecording || voiceAgent.isProcessing
                      ? 'bg-red-500 hover:bg-red-600 animate-pulse' 
                      : 'bg-gray-200 hover:bg-gray-300'
                  }`}
                >
                  {voiceAgent.isProcessing ? (
                    <div className="w-8 h-8 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : voiceAgent.isRecording ? (
                    <MicOff className="w-8 h-8 text-white" />
                  ) : (
                    <Mic className="w-8 h-8 text-gray-600" />
                  )}
                </button>
              </div>
              
              {/* Recording Indicator */}
              {(voiceAgent.isRecording || voiceAgent.isProcessing) && (
                <div className="absolute -top-2 -right-2 w-4 h-4 bg-red-500 rounded-full animate-ping" />
              )}
              
              {/* Connection Status */}
              {voiceAgent.error && (
                <div className="absolute -bottom-8 left-1/2 transform -translate-x-1/2 text-xs text-red-500 bg-red-100 px-2 py-1 rounded">
                  {voiceAgent.error}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Next Button - Bottom Right */}
        <div 
          className={`flex justify-end w-full max-w-6xl transition-all duration-1000 ease-out delay-900 ${
            isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
          }`}
        >
          <Button 
            variant="outline"
            className="bg-gray-100 border-gray-300 text-gray-900 hover:bg-gray-200 px-6 py-2 rounded-lg"
            onClick={handleNextClick2}
          >
            Next
          </Button>
        </div>
      </div>
    )
  }

  // Fourth Section - Multimodal
  if (currentSection === 4) {
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center p-4">
        {/* Heading - Above rectangle */}
        <h2 
          className={`text-3xl md:text-4xl font-instrument-serif italic text-gray-900 mb-8 text-center transition-all duration-1000 ease-out ${
            isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
          }`}
        >
          It's multimodal!
        </h2>

        {/* Main Content Area */}
        <div className="flex-1 flex items-center justify-center">
          <div 
            className={`relative w-full max-w-7xl h-[600px] transition-all duration-1000 ease-out delay-600 ${
              isLoaded ? 'opacity-100 scale-100' : 'opacity-0 scale-95'
            }`}
          >
            {/* Left Section - Gray Rectangle for Multimodal Content */}
            <div className="absolute left-0 top-0 w-2/3 h-full">
              <div className="w-full h-full bg-gray-200 rounded-2xl shadow-lg overflow-hidden">
                {/* Visual Content Display */}
                {renderVisualContentInRectangle(visualContent)}
              </div>
            </div>

            {/* Right Section - Circular Mic Element */}
            <div className="absolute right-8 top-1/2 transform -translate-y-1/2">
              <div className="relative">
                {/* Circular Background with Yellow/Pink Gradient */}
                <div 
                  className="w-40 h-40 rounded-full shadow-lg flex items-center justify-center"
                  style={{
                    background: `url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTYwIiBoZWlnaHQ9IjE2MCIgdmlld0JveD0iMCAwIDE2MCAxNjAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIxNjAiIGhlaWdodD0iMTYwIiBmaWxsPSJ1cmwoI2dyYWRpZW50KSIvPgo8ZGVmcz4KPGxpbmVhckdyYWRpZW50IGlkPSJncmFkaWVudCIgeDE9IjAiIHkxPSIwIiB4Mj0iMTYwIiB5Mj0iMTYwIiBncmFkaWVudFVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+CjxzdG9wIG9mZnNldD0iMCUiIHN0eWxlPSJzdG9wLWNvbG9yOiNmZmZmMDA7c3RvcC1vcGFjaXR5OjEiLz4KPHN0b3Agb2Zmc2V0PSIzMCUiIHN0eWxlPSJzdG9wLWNvbG9yOiNmZmZmMDA7c3RvcC1vcGFjaXR5OjEiLz4KPHN0b3Agb2Zmc2V0PSI2MCUiIHN0eWxlPSJzdG9wLWNvbG9yOiNmZmZmMDA7c3RvcC1vcGFjaXR5OjEiLz4KPHN0b3Agb2Zmc2V0PSI4MCUiIHN0eWxlPSJzdG9wLWNvbG9yOiNmZmZmMDA7c3RvcC1vcGFjaXR5OjEiLz4KPHN0b3Agb2Zmc2V0PSIxMDAlIiBzdHlsZT0ic3RvcC1jb2xvcjojZmZmZmZmO3N0b3Atb3BhY2l0eToxIi8+CjwvbGluZWFyR3JhZGllbnQ+CjwvZGVmcz4KPC9zdmc+')`,
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                  }}
                >
                  {/* Mic Icon */}
                  <button
                    onClick={toggleRecording}
                    className={`w-16 h-16 rounded-full flex items-center justify-center transition-all duration-300 ${
                      voiceAgent.isRecording || voiceAgent.isProcessing
                        ? 'bg-red-500 hover:bg-red-600 animate-pulse' 
                        : 'bg-white hover:bg-gray-100 shadow-lg'
                    }`}
                  >
                    {voiceAgent.isProcessing ? (
                      <div className="w-8 h-8 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : voiceAgent.isRecording ? (
                      <MicOff className="w-8 h-8 text-white" />
                    ) : (
                      <Mic className="w-8 h-8 text-gray-600" />
                    )}
                  </button>
                </div>
                
                {/* Recording Indicator */}
                {(voiceAgent.isRecording || voiceAgent.isProcessing) && (
                  <div className="absolute -top-2 -right-2 w-4 h-4 bg-red-500 rounded-full animate-ping" />
                )}
                
                {/* Connection Status */}
                {voiceAgent.error && (
                  <div className="absolute -bottom-8 left-1/2 transform -translate-x-1/2 text-xs text-red-500 bg-red-100 px-2 py-1 rounded">
                    {voiceAgent.error}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Chat Input Section */}
        <div className={`w-full max-w-7xl mt-6 transition-all duration-1000 ease-out delay-900 ${
          isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
        }`}>
          <div className="flex gap-2 items-center">
            <Input
              value={multimodalInput}
              onChange={(e) => setMultimodalInput(e.target.value)}
              onKeyPress={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault()
                  handleMultimodalSend()
                }
              }}
              placeholder="Ask me to create flashcards, quizzes, or diagrams..."
              className="flex-1"
            />
            <Button
              onClick={handleMultimodalSend}
              disabled={!multimodalInput.trim() || isMultimodalTyping}
              size="sm"
            >
              Send
            </Button>
          </div>
          
          {/* Chat Messages */}
          {multimodalMessages.length > 0 && (
            <div className="mt-4 max-h-32 overflow-y-auto space-y-2">
              {multimodalMessages.slice(-3).map((message) => (
                <div
                  key={message.id}
                  className={`flex gap-2 text-sm ${
                    message.type === 'user' ? 'justify-end' : 'justify-start'
                  }`}
                >
                  <div
                    className={`max-w-[80%] rounded-lg px-3 py-2 ${
                      message.type === 'user'
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-100 text-gray-900'
                    }`}
                  >
                    {message.content}
                  </div>
                </div>
              ))}
              {isMultimodalTyping && (
                <div className="flex gap-2 justify-start">
                  <div className="bg-gray-100 rounded-lg px-3 py-2 text-sm">
                    <div className="flex space-x-1">
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Next Button - Bottom Right */}
        <div 
          className={`flex justify-end w-full max-w-7xl mt-4 transition-all duration-1000 ease-out delay-900 ${
            isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
          }`}
        >
          <Button 
            variant="outline"
            className="bg-gray-100 border-gray-300 text-gray-900 hover:bg-gray-200 px-6 py-2 rounded-lg"
            onClick={handleNextClick3}
          >
            Next
          </Button>
        </div>
      </div>
    )
  }

  // Fifth Section - "We are revolutionizing the way humans will learn forever"
  if (currentSection === 5) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center p-4">
        <div className="text-center space-y-8 max-w-4xl mx-auto">
          {/* Main Heading */}
          <h1 
            className={`text-5xl md:text-6xl font-bold text-gray-900 transition-all duration-1000 ease-out ${
              isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
            }`}
          >
            We are revolutionizing the way
          </h1>
          
          {/* Second Line */}
          <h2 
            className={`text-5xl md:text-6xl font-bold text-gray-900 transition-all duration-1000 ease-out delay-300 ${
              isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
            }`}
          >
            humans will learn{' '}
            <span className="font-instrument-serif italic text-4xl md:text-5xl">forever</span>
          </h2>

          {/* Next Button */}
          <div 
            className={`mt-12 transition-all duration-1000 ease-out delay-600 ${
              isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
            }`}
          >
            <Button 
              variant="outline"
              className="bg-gray-100 border-gray-300 text-gray-900 hover:bg-gray-200 px-6 py-2 rounded-lg"
              onClick={handleNextClick4}
            >
              Next
            </Button>
          </div>
        </div>
      </div>
    )
  }

  // Sixth Section - List of "No more" statements
  if (currentSection === 6) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center p-4">
        <div className="text-center space-y-8 max-w-4xl mx-auto">
          {/* List of Points */}
          <div 
            className={`space-y-6 transition-all duration-1000 ease-out ${
              isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
            }`}
          >
            <p className="text-3xl md:text-4xl">
              <span className="font-bold">No more</span>{' '}
              <span className="font-instrument-serif italic">outdated textbooks</span>
            </p>
            <p className="text-3xl md:text-4xl">
              <span className="font-bold">No more</span>{' '}
              <span className="font-instrument-serif italic">boring lectures</span>
            </p>
            <p className="text-3xl md:text-4xl">
              <span className="font-bold">No more</span>{' '}
              <span className="font-instrument-serif italic">Youtube tutorials</span>
            </p>
            <p className="text-3xl md:text-4xl">
              <span className="font-bold">No more</span>{' '}
              <span className="font-instrument-serif italic">lame teachers & tutors</span>
            </p>
          </div>

          {/* Next Button */}
          <div 
            className={`mt-12 transition-all duration-1000 ease-out delay-600 ${
              isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
            }`}
          >
            <Button 
              variant="outline"
              className="bg-gray-100 border-gray-300 text-gray-900 hover:bg-gray-200 px-6 py-2 rounded-lg"
              onClick={handleNextClick5}
            >
              Next
            </Button>
          </div>
        </div>
      </div>
    )
  }

  // Seventh Section - "This is the turning point of learning" with QR Code
  if (currentSection === 7) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center p-4">
        <div className="text-center space-y-8 max-w-2xl mx-auto">
          {/* Main Heading */}
          <h1 
            className={`text-5xl md:text-6xl font-bold text-gray-900 transition-all duration-1000 ease-out ${
              isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
            }`}
          >
            This is the turning point of learning
          </h1>

          {/* QR Code Placeholder */}
          <div 
            className={`w-64 h-64 bg-gray-200 rounded-lg shadow-lg mx-auto transition-all duration-1000 ease-out delay-600 ${
              isLoaded ? 'opacity-100 scale-100' : 'opacity-0 scale-95'
            }`}
          >
            <div className="w-full h-full flex items-center justify-center">
              <p className="text-gray-500 font-medium">QR Code Placeholder</p>
            </div>
          </div>
        </div>
      </div>
    )
  }
}
