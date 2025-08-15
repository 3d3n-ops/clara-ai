"use client"

import React, { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Play } from "lucide-react"
import { SignInButton } from "@clerk/nextjs"
import { AuthButtons } from "./components/auth-buttons"
import Link from "next/link"
import { useUser } from "@clerk/nextjs"
import { LoadingSpinner } from "./components/loading-spinner"
import { usePageView } from "@/hooks/use-analytics"

export default function LandingPage() {
  const { isSignedIn } = useUser()
  const [isLoading, setIsLoading] = useState(true)
  const [isClient, setIsClient] = useState(false)
  
  // Track page view
  usePageView('Landing Page')

  useEffect(() => {
    setIsClient(true)
    const timer = setTimeout(() => {
      setIsLoading(false)
    }, 300)

    return () => clearTimeout(timer)
  }, [])

  if (!isClient || isLoading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <LoadingSpinner size={48} text="Loading Clara.ai..." />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Navigation */}
      <nav className="container mx-auto px-6 py-6">
        <div className="flex items-center justify-between">
          <div className="text-xl font-semibold text-gray-900">Clara.ai</div>
          <div className="flex items-center space-x-6">
            <Link href="/blog" className="text-gray-600 hover:text-gray-900">
              Blog
            </Link>
            <Link href="/pricing" className="text-gray-600 hover:text-gray-900">
              Pricing
            </Link>
            <Link href="/modal-test" className="text-gray-600 hover:text-gray-900">
              Modal Test
            </Link>
            <AuthButtons />
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <main className="container mx-auto px-6 py-20">
        <div className="max-w-4xl mx-auto text-center">
          {/* Main Heading */}
          <h1 className="text-6xl md:text-7xl font-bold mb-4">
            <span className="text-blue-600">Supercharge</span>
            <br />
            <span className="text-gray-900">your learning</span>
          </h1>

          {/* Subtitle */}
          <p className="text-xl text-gray-600 mb-12 max-w-2xl mx-auto">
            Voice AI assistant helping you learn using evidence based research strategies for learning.
          </p>

          {/* CTA Button */}
          {isSignedIn ? (
            <Link href="/dashboard">
              <Button size="lg" className="bg-gray-900 hover:bg-gray-800 text-white px-8 py-3 text-lg font-medium mb-16">
                Go to Dashboard
              </Button>
            </Link>
          ) : (
            <SignInButton mode="modal">
              <Button size="lg" className="bg-gray-900 hover:bg-gray-800 text-white px-8 py-3 text-lg font-medium mb-16">
                Begin learning!
              </Button>
            </SignInButton>
          )}

          {/* Demo Video Section */}
          <div className="max-w-4xl mx-auto">
            <div className="bg-gray-100 rounded-lg overflow-hidden shadow-lg">
              {/* Video Placeholder */}
              <div className="aspect-video bg-gray-200 flex items-center justify-center relative">
                {/* YouTube-style player mockup */}
                <div className="absolute inset-0 bg-gradient-to-br from-gray-300 to-gray-400"></div>

                {/* Play button */}
                <Button
                  size="lg"
                  className="relative z-10 bg-red-600 hover:bg-red-700 text-white rounded-full w-16 h-16 p-0 shadow-lg"
                >
                  <Play className="w-6 h-6 ml-1" fill="currentColor" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-gray-50 py-12 mt-20">
        <div className="container mx-auto px-6">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="mb-6 md:mb-0">
              <div className="text-xl font-semibold text-gray-900 mb-2">Clara.ai</div>
              <p className="text-gray-600">Supercharge your learning with AI</p>
            </div>

            <div className="flex flex-col md:flex-row space-y-4 md:space-y-0 md:space-x-8">
              <div className="flex space-x-6">
                <Link href="/blog" className="text-gray-600 hover:text-gray-900 transition-colors">
                  Blog
                </Link>
                <Link href="/pricing" className="text-gray-600 hover:text-gray-900 transition-colors">
                  Pricing
                </Link>
                <a href="#" className="text-gray-600 hover:text-gray-900 transition-colors">
                  Privacy Policy
                </a>
                <a href="#" className="text-gray-600 hover:text-gray-900 transition-colors">
                  Terms of Service
                </a>
                <a href="#" className="text-gray-600 hover:text-gray-900 transition-colors">
                  Contact
                </a>
              </div>
            </div>
          </div>

          <div className="border-t border-gray-200 mt-8 pt-8 text-center">
            <p className="text-gray-500">© 2024 Clara.ai. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
