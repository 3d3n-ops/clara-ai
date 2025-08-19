"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Home, Settings, Send, Mic, FileText, BookOpen, Brain, MessageSquare } from "lucide-react"
import Link from "next/link"
import { usePageView, useUserTracking } from "@/hooks/use-analytics"

// Client-side only wrapper to prevent hydration issues
function ClientOnlyStudySessionPage() {
  const [isMounted, setIsMounted] = useState(false)

  useEffect(() => {
    setIsMounted(true)
  }, [])

  if (!isMounted) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading study session...</p>
        </div>
      </div>
    )
  }

  return <StudySessionPageContent />
}

function StudySessionPageContent() {
  const [message, setMessage] = useState("")
  const [isListening, setIsListening] = useState(false)
  const [chatMessages, setChatMessages] = useState<Array<{role: 'user' | 'assistant', content: string}>>([])
  const [generatedContent, setGeneratedContent] = useState({
    notes: "Your personalized study notes will appear here...",
    diagrams: "Interactive diagrams will be generated based on your materials...",
    summaries: "Key concept summaries will be created for quick review..."
  })
  const { trackUserAction } = useUserTracking()
  
  // Track page view
  usePageView('Study Session')

  // Simulate content generation on mount with fade-in effect
  useEffect(() => {
    const timer = setTimeout(() => {
      setGeneratedContent({
        notes: "📝 **Photosynthesis Overview**\n\n• Light-dependent reactions occur in thylakoids\n• Calvin cycle takes place in the stroma\n• Chlorophyll absorbs light energy\n• ATP and NADPH are produced",
        diagrams: "🧬 **Interactive Diagram: Chloroplast Structure**\n\n[Visual representation of chloroplast with labeled parts]\n\n• Outer membrane\n• Inner membrane\n• Thylakoids\n• Stroma",
        summaries: "⚡ **Key Concepts Summary**\n\n1. **Energy Conversion**: Light → Chemical energy\n2. **Location**: Chloroplasts in plant cells\n3. **Products**: Glucose + Oxygen\n4. **Reactants**: CO₂ + H₂O + Light"
      })
    }, 1500)
    return () => clearTimeout(timer)
  }, [])

  const sendMessage = () => {
    if (!message.trim()) return
    
    setChatMessages(prev => [...prev, { role: 'user', content: message }])
    setMessage("")
    
    // Simulate AI response
    setTimeout(() => {
      setChatMessages(prev => [...prev, { 
        role: 'assistant', 
        content: "I understand you're studying photosynthesis. Let me help explain the light-dependent reactions in more detail..." 
      }])
    }, 1000)

    trackUserAction('chat_message_sent', {
      message_length: message.length,
      session_type: 'study'
    })
  }

  const toggleListening = () => {
    setIsListening(!isListening)
    trackUserAction('voice_toggle', {
      action: isListening ? 'stop' : 'start',
      session_type: 'study'
    })
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex">
      {/* Persistent Sidebar */}
      <div className="w-64 bg-white/80 backdrop-blur-sm border-r border-gray-200/50 flex flex-col">
        <div className="p-6">
          <h1 className="text-xl font-semibold text-gray-900">Clara.ai</h1>
        </div>

        <nav className="px-6 space-y-2 mb-6">
          <Link
            href="/dashboard"
            className="w-full flex items-center space-x-3 rounded-lg px-3 py-2 text-left text-gray-600 hover:text-gray-900 hover:bg-gray-50 transition-colors"
          >
            <Home className="w-5 h-5" />
            <span>Home</span>
          </Link>
          <Link
            href="/chat/study"
            className="w-full flex items-center space-x-3 rounded-lg px-3 py-2 text-left bg-blue-50 text-blue-700 border border-blue-200"
          >
            <MessageSquare className="w-5 h-5" />
            <span>Assistant mode</span>
          </Link>
          <button className="w-full flex items-center space-x-3 rounded-lg px-3 py-2 text-left text-gray-600 hover:text-gray-900 hover:bg-gray-50 transition-colors">
            <Settings className="w-5 h-5" />
            <span>Settings</span>
          </button>
        </nav>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex">
        {/* Left Sidebar - Tutor (1/3) */}
        <div className="w-1/3 bg-white/60 backdrop-blur-sm border-r border-gray-200/50 flex flex-col">
          {/* Gradient Orb Tutor */}
          <div className="flex-1 flex flex-col items-center justify-center p-6 space-y-6">
            <div className="relative animate-fade-in">
              <div className="w-32 h-32 bg-gradient-to-br from-blue-400 via-purple-500 to-pink-500 rounded-full flex items-center justify-center shadow-2xl animate-pulse">
                <div className="w-24 h-24 bg-gradient-to-br from-blue-300 via-purple-400 to-pink-400 rounded-full flex items-center justify-center">
                  <Brain className="w-8 h-8 text-white" />
                </div>
              </div>
              {/* Floating particles */}
              <div className="absolute -top-2 -left-2 w-3 h-3 bg-blue-400 rounded-full animate-bounce delay-100"></div>
              <div className="absolute -top-1 -right-3 w-2 h-2 bg-purple-400 rounded-full animate-bounce delay-300"></div>
              <div className="absolute -bottom-3 -left-1 w-4 h-4 bg-pink-400 rounded-full animate-bounce delay-500"></div>
            </div>

            <div className="text-center space-y-2 animate-fade-in">
              <h2 className="text-xl font-semibold text-gray-900">Clara</h2>
              <p className="text-sm text-gray-600">Your AI Study Assistant</p>
            </div>

            {/* Chat Messages */}
            <div className="w-full max-h-64 overflow-y-auto space-y-3 animate-fade-in">
              {chatMessages.map((msg, index) => (
                <div key={index} className={`p-3 rounded-lg text-sm ${
                  msg.role === 'user' 
                    ? 'bg-blue-100 text-blue-900 ml-4' 
                    : 'bg-gray-100 text-gray-900 mr-4'
                }`}>
                  {msg.content}
                </div>
              ))}
              {chatMessages.length === 0 && (
                <div className="text-center text-gray-500 text-sm">
                  Start a conversation with Clara about your studies!
                </div>
              )}
            </div>
          </div>

          {/* Chat Input */}
          <div className="p-4 border-t border-gray-200/50 space-y-3">
            <div className="flex gap-2">
              <Input
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Ask Clara anything..."
                onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                className="flex-1"
              />
              <Button onClick={sendMessage} size="sm" className="px-3">
                <Send className="w-4 h-4" />
              </Button>
            </div>
            
            <Button
              onClick={toggleListening}
              variant={isListening ? "default" : "outline"}
              className={`w-full transition-all duration-300 ${
                isListening 
                  ? 'bg-red-500 hover:bg-red-600 text-white animate-pulse' 
                  : 'hover:bg-blue-50'
              }`}
            >
              <Mic className="w-4 h-4 mr-2" />
              {isListening ? 'Stop Recording' : 'Start Voice Chat'}
            </Button>
          </div>
        </div>

        {/* Right Content Area (2/3) */}
        <div className="w-2/3 p-6 overflow-y-auto">
          <div className="space-y-6">
            {/* Notes Section */}
            <Card className="animate-fade-in">
              <CardContent className="p-6">
                <div className="flex items-center gap-2 mb-4">
                  <FileText className="w-5 h-5 text-blue-600" />
                  <h3 className="text-lg font-semibold text-gray-900">Study Notes</h3>
                </div>
                <div className="prose prose-sm max-w-none">
                  <pre className="whitespace-pre-wrap font-sans text-gray-700">
                    {generatedContent.notes}
                  </pre>
                </div>
              </CardContent>
            </Card>

            {/* Diagrams Section */}
            <Card className="animate-fade-in delay-300">
              <CardContent className="p-6">
                <div className="flex items-center gap-2 mb-4">
                  <Brain className="w-5 h-5 text-purple-600" />
                  <h3 className="text-lg font-semibold text-gray-900">Visual Diagrams</h3>
                </div>
                <div className="prose prose-sm max-w-none">
                  <pre className="whitespace-pre-wrap font-sans text-gray-700">
                    {generatedContent.diagrams}
                  </pre>
                </div>
              </CardContent>
            </Card>

            {/* Summaries Section */}
            <Card className="animate-fade-in delay-500">
              <CardContent className="p-6">
                <div className="flex items-center gap-2 mb-4">
                  <BookOpen className="w-5 h-5 text-green-600" />
                  <h3 className="text-lg font-semibold text-gray-900">Key Summaries</h3>
                </div>
                <div className="prose prose-sm max-w-none">
                  <pre className="whitespace-pre-wrap font-sans text-gray-700">
                    {generatedContent.summaries}
                  </pre>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}



export default ClientOnlyStudySessionPage
