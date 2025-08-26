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

  const [processing, setProcessing] = useState(false)

  const subjects = [
    "Calculus II",
    "Biology",
    "Data Structures and Algorithms",
    "Physics",
    "Organic Chemistry",
    "Linear Algebra",
    "Statistics",
    "Computer Science",
    "Calculus I",
    "Philosophy",
    "Distributed Systems",
  ]

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentSubject((prev) => (prev + 1) % subjects.length)
    }, 2000)

    return () => clearInterval(interval)
  }, [subjects.length])

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files
    if (files) {
      const file = files[0]
      // Validate file type
      const allowedTypes = ["application/pdf", "application/vnd.openxmlformats-officedocument.wordprocessingml.document", "text/plain"]
      if (!allowedTypes.includes(file.type)) {
        setUploadError("Invalid file type. Please upload a PDF, DOCX, or TXT file.")
        return
      }

      // Validate file size (e.g., 10MB limit)
      const maxSizeInBytes = 10 * 1024 * 1024
      if (file.size > maxSizeInBytes) {
        setUploadError("File size exceeds 10MB. Please upload a smaller file.")
        return
      }

      setUploadError(null)
      setUploadedFiles(Array.from(files))
    }
  }

  const startTutorSession = async () => {
    if (uploadedFiles.length === 0 || uploadError) {
      // Show a toast or message to the user to upload a valid file
      return
    }

    setProcessing(true)

    const file = uploadedFiles[0]
    const formData = new FormData()
    formData.append("file", file)
    formData.append("user_id", user?.id || "")

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_LOCAL_API_URL}/api/process-lecture`, {
        method: "POST",
        body: formData,
      })

      if (response.ok) {
        const data = await response.json()
        // Store the generated content in localStorage to pass to the next page
        localStorage.setItem("generatedContent", JSON.stringify(data))
        router.push("/tutor-session")
      } else {
        // TODO: Handle error with a toast message
        console.error("Failed to process lecture material")
        setUploadError("Failed to process lecture material. Please try again.")
      }
    } catch (error) {
      console.error("Error processing lecture material:", error)
      setUploadError("An error occurred. Please try again.")
    } finally {
      setProcessing(false)
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
                  {uploadError && <p className="text-red-500 text-sm mt-2">{uploadError}</p>}
                </CardContent>
              </Card>
            </div>
          )}

          {/* Action Buttons */}
          <div className="space-y-4">
            <div className="flex gap-4 justify-center">
              <Button
                onClick={startTutorSession}
                className="bg-black hover:bg-gray-800 text-white px-8 py-3 text-lg font-medium rounded-full"
                disabled={processing}
              >
                {processing ? "Processing..." : "Tutor me!"}
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
                  <span>
                    <Upload className="w-5 h-5" />
                    Upload your lectures
                  </span>
                </Button>
              </label>
              <p className="text-sm text-gray-500 mt-2">PDF, DOC, TXT, Images, PowerPoint supported</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
