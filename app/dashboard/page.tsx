"use client"

import type React from "react"

import { useUser } from "@clerk/nextjs"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Home, MessageSquare, Settings, Upload } from "lucide-react"
import { useState, useEffect } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"

export default function DashboardPage() {
  const { user } = useUser()
  const router = useRouter()
  const [currentSubject, setCurrentSubject] = useState(0)
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([])
  const [uploadError, setUploadError] = useState<string | null>(null)
  const [isUploading, setIsUploading] = useState(false)

  const subjects = [
    "Calculus II",
    "Biology",
    "Data Structures and Algorithms",
    "Physics",
    "Organic Chemistry",
    "Linear Algebra",
    "Statistics",
    "Computer Science",
  ]

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentSubject((prev) => (prev + 1) % subjects.length)
    }, 2000)

    return () => clearInterval(interval)
  }, [subjects.length])

  // File validation function
  const validateFiles = (files: File[]): boolean => {
    const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10MB
    const ALLOWED_TYPES = [
      'application/pdf', 
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 
      'application/vnd.openxmlformats-officedocument.presentationml.presentation',
      'image/png', 
      'image/jpeg', 
      'text/plain'
    ]

    for (const file of files) {
      // Check file type
      if (!ALLOWED_TYPES.includes(file.type)) {
        setUploadError(`Unsupported file type: ${file.name}. Allowed types: PDF, DOCX, PPTX, TXT, PNG, JPG`)
        return false
      }

      // Check file size
      if (file.size > MAX_FILE_SIZE) {
        setUploadError(`File ${file.name} is too large. Maximum file size is 10MB.`)
        return false
      }
    }

    return true
  }

  const startTutorSession = async () => {
    // Clear previous errors
    setUploadError(null)

    // Explicit check for uploaded files
    if (uploadedFiles.length === 0) {
      setUploadError('Please upload a file before starting a tutor session')
      return
    }

    // Validate files before upload
    if (!validateFiles(uploadedFiles)) {
      return
    }

    // Prevent multiple simultaneous uploads
    if (isUploading) return

    try {
      setIsUploading(true)

      // Create FormData for file upload
      const formData = new FormData()
      uploadedFiles.forEach(file => {
        formData.append('file', file)
      })

      // Send files to backend
      const response = await fetch(`${process.env.NEXT_PUBLIC_LOCAL_API_URL}/file-upload/`, {
        method: 'POST',
        body: formData
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || 'File upload failed')
      }

      const { cache_key } = await response.json()
      
      // Store cache key in localStorage for tutor session
      localStorage.setItem('sessionCacheKey', cache_key)
      localStorage.setItem('sessionFiles', JSON.stringify(uploadedFiles.map(file => ({ name: file.name, size: file.size }))))
      
      // Navigate to tutor session
      router.push('/tutor-session')
    } catch (error) {
      console.error('Upload error:', error)
      setUploadError(error instanceof Error ? error.message : 'An unexpected error occurred')
    } finally {
      setIsUploading(false)
    }
  }

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files
    if (files) {
      const newFiles = Array.from(files)
      
      // Validate files
      if (validateFiles(newFiles)) {
        setUploadedFiles(newFiles)
        setUploadError(null)
      }
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <div className="w-64 bg-white border-r border-gray-200">
        <div className="p-6">
          <h1 className="text-xl font-semibold text-gray-900">Clara.ai</h1>
        </div>

        <nav className="px-6 space-y-2">
          <Link
            href="/dashboard"
            className="w-full flex items-center space-x-3 rounded-lg px-3 py-2 text-left text-gray-900 bg-gray-100"
          >
            <Home className="w-5 h-5" />
            <span>Home</span>
          </Link>
          <Link
            href="/chat/homework"
            className="w-full flex items-center space-x-3 rounded-lg px-3 py-2 text-left text-gray-600 hover:text-gray-900 hover:bg-gray-50"
          >
            <MessageSquare className="w-5 h-5" />
            <span>Assistant</span>
          </Link>
          <button className="w-full flex items-center space-x-3 rounded-lg px-3 py-2 text-left text-gray-600 hover:text-gray-900 hover:bg-gray-50">
            <Settings className="w-5 h-5" />
            <span>Settings</span>
          </button>
        </nav>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="text-center max-w-2xl">
          {/* Gradient Orb */}
          <div className="mb-8 flex justify-center">
            <div
              className="w-48 h-48 rounded-full bg-gradient-to-br from-blue-400 via-purple-500 to-blue-600 shadow-2xl animate-pulse"
              style={{
                background: `url('/images/gradient-1.png')`,
                backgroundSize: "cover",
                backgroundPosition: "center",
              }}
            />
          </div>

          {/* Dynamic Header */}
          <h1 className="text-4xl font-bold text-gray-900 mb-8">
            Let's dive deep into{" "}
            <span key={currentSubject} className="text-blue-600 inline-block animate-fade-in">
              {subjects[currentSubject]}
            </span>{" "}
            today
          </h1>

          {/* File Upload Section */}
          {uploadedFiles.length > 0 && (
            <div className="mb-6">
              <Card className="bg-green-50 border-green-200">
                <CardContent className="p-4">
                  <h3 className="font-medium text-green-800 mb-2">Uploaded Files:</h3>
                  <div className="space-y-1">
                    {uploadedFiles.map((file, index) => (
                      <div key={index} className="text-sm text-green-700">
                        📄 {file.name} ({(file.size / 1024 / 1024).toFixed(2)} MB)
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Error Message */}
          {uploadError && (
            <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
              {uploadError}
            </div>
          )}

          {/* Action Buttons */}
          <div className="space-y-4">
            <div className="flex gap-4 justify-center">
              <Button
                onClick={startTutorSession}
                disabled={uploadedFiles.length === 0 || isUploading}
                className="bg-black hover:bg-gray-800 text-white px-8 py-3 text-lg font-medium rounded-full"
              >
                {isUploading ? 'Uploading...' : 'Tutor me!'}
              </Button>
              <Link href="/chat/homework">
                <Button
                  variant="outline"
                  className="px-8 py-3 text-lg font-medium rounded-full bg-white border-gray-300"
                >
                  Assistant mode
                </Button>
              </Link>
            </div>

            {/* File Upload */}
            <div className="mt-6">
              <input
                type="file"
                multiple
                accept=".pdf,.doc,.docx,.txt,.png,.jpg,.jpeg,.ppt,.pptx"
                onChange={handleFileUpload}
                className="hidden"
                id="lecture-upload"
              />
              <label htmlFor="lecture-upload">
                <Button
                  variant="outline"
                  className="cursor-pointer bg-white border-dashed border-2 border-gray-300 hover:border-blue-400 px-6 py-3"
                  asChild
                >
                  <div className="flex items-center gap-2">
                    <Upload className="w-5 h-5" />
                    Upload your lectures
                  </div>
                </Button>
              </label>
              <p className="text-sm text-gray-500 mt-2">PDF, DOC, TXT, Images, PowerPoint supported (max 10MB)</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
