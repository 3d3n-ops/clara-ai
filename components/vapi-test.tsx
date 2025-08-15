"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Mic, MicOff, Volume2 } from "lucide-react"
import { useVapiVoice } from "@/hooks/use-vapi-voice"

export default function VapiTest() {
  const [isConnected, setIsConnected] = useState(false)
  const [messages, setMessages] = useState<string[]>([])
  
  const {
    state,
    connect,
    disconnect,
    toggleRecording,
    isConnected: vapiConnected,
    isRecording,
    isProcessing,
    error
  } = useVapiVoice({
    onMessageReceived: (message) => {
      setMessages(prev => [...prev, message])
    },
    onError: (error) => {
      console.error('Vapi error:', error)
    }
  })

  const handleConnect = async () => {
    try {
      await connect()
      setIsConnected(true)
    } catch (error) {
      console.error('Failed to connect:', error)
    }
  }

  const handleDisconnect = () => {
    disconnect()
    setIsConnected(false)
    setMessages([])
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-2xl mx-auto space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Vapi Voice Test</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Connection Status */}
                         <div className="flex items-center space-x-4">
               <div className={`w-3 h-3 rounded-full ${vapiConnected ? 'bg-green-500' : 'bg-red-500'}`} />
               <span className="text-sm">
                 {vapiConnected ? 'Connected' : 'Disconnected'}
               </span>
             </div>

            {/* Error Display */}
            {error && (
              <div className="p-3 bg-red-100 border border-red-300 rounded text-red-700 text-sm">
                {error}
              </div>
            )}

            {/* Control Buttons */}
                         <div className="flex space-x-4">
               {!vapiConnected ? (
                 <Button onClick={handleConnect} className="flex items-center space-x-2">
                   <Volume2 className="w-4 h-4" />
                   <span>Connect to Clara</span>
                 </Button>
               ) : (
                <>
                  <Button onClick={handleDisconnect} variant="outline">
                    Disconnect
                  </Button>
                  <Button 
                    onClick={toggleRecording}
                    variant={isRecording ? "destructive" : "default"}
                    className="flex items-center space-x-2"
                  >
                    {isRecording ? (
                      <>
                        <MicOff className="w-4 h-4" />
                        <span>Stop Recording</span>
                      </>
                    ) : (
                      <>
                        <Mic className="w-4 h-4" />
                        <span>Start Recording</span>
                      </>
                    )}
                  </Button>
                </>
              )}
            </div>

            {/* Status Display */}
                         <div className="text-sm text-gray-600">
               <p>Status: {isRecording ? 'Recording' : isProcessing ? 'Processing' : 'Idle'}</p>
               <p>Connected: {vapiConnected ? 'Yes' : 'No'}</p>
             </div>

            {/* Messages */}
            {messages.length > 0 && (
              <div className="space-y-2">
                <h3 className="font-medium">Messages:</h3>
                <div className="max-h-64 overflow-y-auto space-y-2">
                  {messages.map((message, index) => (
                    <div key={index} className="p-2 bg-white border rounded text-sm">
                      {message}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Instructions */}
        <Card>
          <CardHeader>
            <CardTitle>Instructions</CardTitle>
          </CardHeader>
          <CardContent>
            <ol className="list-decimal list-inside space-y-2 text-sm">
              <li>Click "Connect to Clara" to establish a connection</li>
              <li>Click "Start Recording" to begin voice interaction</li>
              <li>Speak to Clara and watch for responses</li>
              <li>Try voice commands like "create diagram" or "make flashcards"</li>
              <li>Click "Stop Recording" when done</li>
              <li>Click "Disconnect" to end the session</li>
            </ol>
          </CardContent>
        </Card>
      </div>
    </div>
  )
} 