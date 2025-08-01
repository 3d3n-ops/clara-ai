"use client"

import React, { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Lightbulb, Mic, MessageSquare, Users, Play, StopCircle } from 'lucide-react'
import ModalVoiceRoom from '@/components/modal-voice-room'

export default function VoiceTestPage() {
  const [isInSession, setIsInSession] = useState(false)

  const startSession = () => {
    setIsInSession(true)
  }

  const endSession = () => {
    setIsInSession(false)
  }

  if (isInSession) {
    return <ModalVoiceRoom onEndSession={endSession} />
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto p-4">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">
              Clara AI Voice Assistant
            </h1>
            <p className="text-xl text-gray-600 mb-6">
              Test your Modal-deployed voice agent with real-time conversation
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Connection Status */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Mic className="h-5 w-5 text-blue-600" />
                  Voice Agent
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary">Modal Deployed</Badge>
                    <Badge variant="outline">LiveKit Ready</Badge>
                  </div>
                  <p className="text-sm text-gray-600">
                    Your Clara AI agent is deployed on Modal and ready to connect via LiveKit.
                  </p>
                  <Button 
                    onClick={startSession}
                    className="w-full"
                    size="lg"
                  >
                    <Play className="h-4 w-4 mr-2" />
                    Start Voice Session
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Features */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Lightbulb className="h-5 w-5 text-yellow-600" />
                  Features
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span className="text-sm">Real-time voice conversation</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span className="text-sm">Visual content generation</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span className="text-sm">Study assistance</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span className="text-sm">Multimodal interactions</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Commands */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MessageSquare className="h-5 w-5 text-purple-600" />
                  Voice Commands
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="text-sm">
                    <strong>Visual Generation:</strong>
                    <ul className="mt-1 space-y-1 text-gray-600">
                      <li>• "Create diagram"</li>
                      <li>• "Make flashcards"</li>
                      <li>• "Show quiz"</li>
                      <li>• "Visualize this"</li>
                    </ul>
                  </div>
                  <div className="text-sm">
                    <strong>Study Help:</strong>
                    <ul className="mt-1 space-y-1 text-gray-600">
                      <li>• "Explain photosynthesis"</li>
                      <li>• "Help me study math"</li>
                      <li>• "Test my knowledge"</li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Deployment Info */}
          <Card className="mt-8">
            <CardHeader>
              <CardTitle>Modal Deployment Status</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">✓</div>
                  <div className="text-sm font-medium">Agent Deployed</div>
                  <div className="text-xs text-gray-500">Modal Cloud</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">✓</div>
                  <div className="text-sm font-medium">Webhooks Configured</div>
                  <div className="text-xs text-gray-500">LiveKit Integration</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-purple-600">✓</div>
                  <div className="text-sm font-medium">Frontend Ready</div>
                  <div className="text-xs text-gray-500">React + LiveKit</div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Instructions */}
          <Card className="mt-8">
            <CardHeader>
              <CardTitle>How to Test</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-sm font-medium">1</div>
                  <div>
                    <h4 className="font-medium">Start Session</h4>
                    <p className="text-sm text-gray-600">Click "Start Voice Session" to connect to Clara AI</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-sm font-medium">2</div>
                  <div>
                    <h4 className="font-medium">Allow Microphone</h4>
                    <p className="text-sm text-gray-600">Grant microphone permissions when prompted</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-sm font-medium">3</div>
                  <div>
                    <h4 className="font-medium">Start Talking</h4>
                    <p className="text-sm text-gray-600">Speak naturally or type messages to interact with Clara</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-sm font-medium">4</div>
                  <div>
                    <h4 className="font-medium">Try Commands</h4>
                    <p className="text-sm text-gray-600">Use voice commands to generate visual content</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
} 