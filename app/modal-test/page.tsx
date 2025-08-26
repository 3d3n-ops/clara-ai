"use client"

import React from 'react'
import ModalVoiceRoom from '@/components/modal-voice-room'

export default function ModalTestPage() {
  const handleEndSession = () => {
    console.log('Session ended, redirecting...')
    // You can redirect to another page or show a completion message
  }

  return (
    <div className="min-h-screen">
      <ModalVoiceRoom onEndSession={handleEndSession} />
    </div>
  )
} 