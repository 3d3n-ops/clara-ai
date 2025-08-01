"use client"

import React, { useState, useEffect, useMemo, useCallback, Suspense } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Home, Folder, Settings, Menu, X, Plus, Upload, FileText, Star, TrendingUp, Target, Award, Loader2 } from "lucide-react"
import Link from "next/link"
import { useUser } from "@clerk/nextjs"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { Input } from "@/components/ui/input"
import { LoadingSpinner, LoadingCard } from "../components/loading-spinner"
import { usePageView, useUserTracking } from "@/hooks/use-analytics"

// Lazy load the file upload component
const FileUpload = React.lazy(() => import('../../components/homework/file-upload'))

interface ClassFolder {
  id: string
  name: string
  description?: string
  created_at: string
  files?: File[]
  file_count?: number
}

interface LearningStats {
  currentStreak: number
  totalSessions: number
  lastStudyDate: string | null
  learningPerformance: {
    quizScore: number
    flashcardScore: number
    overallScore: number
    totalQuizzes: number
    totalFlashcards: number
  }
}

export default function DashboardPage() {
  const { user } = useUser()
  const router = useRouter()
  const { trackUserAction } = useUserTracking()
  const [activeTab, setActiveTab] = useState("home")
  const [folders, setFolders] = useState<ClassFolder[]>([])
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [selectedFolder, setSelectedFolder] = useState<ClassFolder | null>(null)
  const [isLoadingFolders, setIsLoadingFolders] = useState(true)
  const [isCreatingFolder, setIsCreatingFolder] = useState(false)
  const [newFolderName, setNewFolderName] = useState("")
  const [newFolderDescription, setNewFolderDescription] = useState("")
  const [isUploading, setIsUploading] = useState(false)
  
  // Track page view
  usePageView('Dashboard')

  const [learningStats, setLearningStats] = useState<LearningStats>({
    currentStreak: 0,
    totalSessions: 0,
    lastStudyDate: null,
    learningPerformance: {
      quizScore: 0,
      flashcardScore: 0,
      overallScore: 0,
      totalQuizzes: 0,
      totalFlashcards: 0
    }
  })

  // Memoized values for better performance
  const totalFiles = useMemo(() => 
    folders.reduce((sum, folder) => sum + (folder.file_count || 0), 0), 
    [folders]
  )

  const totalFolders = useMemo(() => folders.length, [folders])

  useEffect(() => {
    fetchFolders()
  }, [])

  useEffect(() => {
    // Load learning stats from localStorage
    const savedStats = localStorage.getItem("learningStats")
    if (savedStats) {
      try {
        const parsedStats = JSON.parse(savedStats)
        // Handle migration from old format to new format
        if (parsedStats.longestStreak !== undefined) {
          // Migrate old format to new format
          const newStats: LearningStats = {
            currentStreak: parsedStats.currentStreak || 0,
            totalSessions: parsedStats.totalSessions || 0,
            lastStudyDate: parsedStats.lastStudyDate || null,
            learningPerformance: {
              quizScore: 75, // Default values for demo
              flashcardScore: 80,
              overallScore: 77,
              totalQuizzes: 5,
              totalFlashcards: 8
            }
          }
          setLearningStats(newStats)
          localStorage.setItem("learningStats", JSON.stringify(newStats))
        } else {
          setLearningStats(parsedStats)
        }
      } catch (error) {
        console.error('Error parsing learning stats:', error)
      }
    }
  }, [])

  const fetchFolders = useCallback(async () => {
    setIsLoadingFolders(true)
    try {
      const response = await fetch('/api/homework/folders')
      const data = await response.json()
      
      if (data.success) {
        // Simplified folder fetching - don't fetch file counts immediately
        setFolders(data.folders || [])
      } else {
        console.error('Failed to fetch folders:', data.error)
        toast.error('Failed to load folders')
      }
    } catch (error) {
      console.error('Error fetching folders:', error)
      toast.error('Failed to load folders')
    } finally {
      setIsLoadingFolders(false)
    }
  }, [])

  const createFolder = useCallback(async () => {
    if (!newFolderName.trim()) return

    setIsCreatingFolder(true)
    try {
      const response = await fetch('/api/homework/folders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: newFolderName.trim(),
          description: newFolderDescription.trim(),
        }),
      })

      const data = await response.json()
      
      if (data.success) {
        setFolders(prev => [...prev, data.folder])
        setNewFolderName("")
        setNewFolderDescription("")
        toast.success('Folder created successfully!')
        
        // Track folder creation
        trackUserAction('folder_created', {
          folder_name: newFolderName.trim(),
          folder_description: newFolderDescription.trim(),
          folder_id: data.folder.id,
        })
      } else {
        toast.error(data.error || 'Failed to create folder')
        trackUserAction('folder_creation_failed', {
          folder_name: newFolderName.trim(),
          error: data.error,
        })
      }
    } catch (error) {
      console.error('Error creating folder:', error)
      toast.error('Failed to create folder')
      trackUserAction('folder_creation_error', {
        folder_name: newFolderName.trim(),
        error: error instanceof Error ? error.message : 'Unknown error',
      })
    } finally {
      setIsCreatingFolder(false)
    }
  }, [newFolderName, newFolderDescription, trackUserAction])

  const handleFileUpload = useCallback(async (folderId: string, files: FileList | null) => {
    if (!files || files.length === 0) return

    setIsUploading(true)
    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i]
        const formData = new FormData()
        formData.append('file', file)
        formData.append('folderId', folderId)

        const response = await fetch('/api/homework/upload', {
          method: 'POST',
          body: formData,
        })

        const data = await response.json()
        
        if (data.success) {
          toast.success(`Uploaded ${file.name} successfully!`)
        } else {
          toast.error(`Failed to upload ${file.name}: ${data.error}`)
        }
      }
      
      // Refresh folders to update file counts
      await fetchFolders()
    } catch (error) {
      console.error('Error uploading files:', error)
      toast.error('Failed to upload files')
    } finally {
      setIsUploading(false)
    }
  }, [fetchFolders])

  const completeStudySession = useCallback(() => {
    trackUserAction('study_session_navigation', {
      destination: '/chat/study',
      source: 'dashboard',
    })
    router.push('/chat/study')
  }, [router, trackUserAction])

  const startHomeworkHelp = useCallback(() => {
    trackUserAction('homework_help_navigation', {
      destination: '/chat/homework',
      source: 'dashboard',
    })
    router.push('/chat/homework')
  }, [router, trackUserAction])

  const getPerformanceColor = useCallback((score: number) => {
    if (score >= 80) return "text-green-600"
    if (score >= 60) return "text-yellow-600"
    return "text-red-600"
  }, [])

  const getPerformanceBadge = useCallback((score: number) => {
    if (score >= 80) return "bg-green-100 text-green-800"
    if (score >= 60) return "bg-yellow-100 text-yellow-800"
    return "bg-red-100 text-red-800"
  }, [])

  const renderHomeTab = () => (
    <div className="p-8">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card className="bg-gradient-to-r from-blue-500 to-blue-600 text-white">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-100 text-sm font-medium">Current Streak</p>
                <p className="text-3xl font-bold">{learningStats.currentStreak}</p>
                <p className="text-blue-100 text-sm">days in a row</p>
              </div>
              <div className="w-12 h-12 bg-blue-400 rounded-full flex items-center justify-center">
                <span className="text-2xl">🔥</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-r from-green-500 to-green-600 text-white">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-green-100 text-sm font-medium">Study Sessions</p>
                <p className="text-3xl font-bold">{learningStats.totalSessions}</p>
                <p className="text-green-100 text-sm">completed</p>
              </div>
              <div className="w-12 h-12 bg-green-400 rounded-full flex items-center justify-center">
                <span className="text-2xl">📚</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-r from-purple-500 to-purple-600 text-white">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-purple-100 text-sm font-medium">Learning Performance</p>
                <p className={`text-3xl font-bold ${getPerformanceColor(learningStats.learningPerformance.overallScore)}`}>
                  {learningStats.learningPerformance.overallScore}%
                </p>
                <p className="text-purple-100 text-sm">overall score</p>
              </div>
              <div className="w-12 h-12 bg-purple-400 rounded-full flex items-center justify-center">
                <Award className="w-6 h-6 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Performance Breakdown */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="w-5 h-5 text-blue-600" />
              Quiz Performance
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Average Score</span>
              <span className={`font-semibold ${getPerformanceColor(learningStats.learningPerformance.quizScore)}`}>
                {learningStats.learningPerformance.quizScore}%
              </span>
            </div>
            <Progress 
              value={learningStats.learningPerformance.quizScore} 
              className="h-2"
            />
            <div className="flex items-center justify-between text-sm text-gray-500">
              <span>
                {learningStats.learningPerformance.totalQuizzes === 0 
                  ? "No quizzes taken yet" 
                  : `${learningStats.learningPerformance.totalQuizzes} quizzes taken`}
              </span>
              <Badge variant="secondary" className={getPerformanceBadge(learningStats.learningPerformance.quizScore)}>
                {getPerformanceBadge(learningStats.learningPerformance.quizScore)}
              </Badge>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Star className="w-5 h-5 text-yellow-600" />
              Flashcard Performance
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Average Score</span>
              <span className={`font-semibold ${getPerformanceColor(learningStats.learningPerformance.flashcardScore)}`}>
                {learningStats.learningPerformance.flashcardScore}%
              </span>
            </div>
            <Progress 
              value={learningStats.learningPerformance.flashcardScore} 
              className="h-2"
            />
            <div className="flex items-center justify-between text-sm text-gray-500">
              <span>
                {learningStats.learningPerformance.totalFlashcards === 0 
                  ? "No flashcard sets yet" 
                  : `${learningStats.learningPerformance.totalFlashcards} flashcard sets`}
              </span>
              <Badge variant="secondary" className={getPerformanceBadge(learningStats.learningPerformance.flashcardScore)}>
                {getPerformanceBadge(learningStats.learningPerformance.flashcardScore)}
              </Badge>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Welcome Section */}
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-blue-600 mb-4">Hello, {user?.firstName}!</h1>
          <p className="text-xl text-gray-600 mb-8">Let's recap everything you learned today!</p>
          <div className="space-x-4">
            <Button
              className="bg-black hover:bg-gray-800 text-white px-8 py-3 rounded-full"
              onClick={completeStudySession}
            >
              Voice AI study
            </Button>
            <Button variant="outline" className="px-8 py-3 rounded-full bg-transparent" onClick={startHomeworkHelp}>
              Text AI study
            </Button>
          </div>

          {/* Motivational Message */}
          {learningStats.currentStreak > 0 ? (
            <div className="mt-6 p-4 bg-blue-50 rounded-lg">
              <p className="text-blue-800 font-medium">
                {learningStats.currentStreak === 1
                  ? "Great start! You're building a learning habit! 🌱"
                  : learningStats.currentStreak < 7
                    ? `Amazing! You're on a ${learningStats.currentStreak}-day streak! Keep it up! 🚀`
                    : learningStats.currentStreak < 30
                      ? `Incredible! ${learningStats.currentStreak} days of consistent learning! You're unstoppable! ⭐`
                      : `Legendary! ${learningStats.currentStreak} days straight! You're a learning champion! 👑`}
              </p>
            </div>
          ) : (
            <div className="mt-6 p-4 bg-green-50 rounded-lg">
              <p className="text-green-800 font-medium">
                Welcome to your learning journey! Start with a Voice AI study session to begin tracking your progress! 🚀
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Recent Activity */}
      <div className="mt-8">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Activity</h3>
        <Card>
          <CardContent className="p-6">
            {learningStats.totalSessions > 0 ? (
              <div className="space-y-3">
                <div className="flex items-center justify-between py-2 border-b border-gray-100">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                      <span className="text-green-600 text-sm">✓</span>
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">Learning Session Completed</p>
                      <p className="text-sm text-gray-500">
                        {learningStats.lastStudyDate
                          ? new Date(learningStats.lastStudyDate).toLocaleDateString()
                          : "Today"}
                      </p>
                    </div>
                  </div>
                  <span className="text-sm text-gray-400">Latest</span>
                </div>

                {learningStats.currentStreak > 1 && (
                  <div className="flex items-center justify-between py-2">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                        <span className="text-blue-600 text-sm">🔥</span>
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">Streak Milestone</p>
                        <p className="text-sm text-gray-500">
                          {learningStats.currentStreak} days of consistent learning
                        </p>
                      </div>
                    </div>
                    <span className="text-sm text-gray-400">Ongoing</span>
                  </div>
                )}

                {learningStats.learningPerformance.totalQuizzes > 0 && (
                  <div className="flex items-center justify-between py-2">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                        <Target className="w-4 h-4 text-purple-600" />
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">Quiz Performance</p>
                        <p className="text-sm text-gray-500">
                          {learningStats.learningPerformance.quizScore}% average score
                        </p>
                      </div>
                    </div>
                    <Badge variant="secondary" className={getPerformanceBadge(learningStats.learningPerformance.quizScore)}>
                      {getPerformanceBadge(learningStats.learningPerformance.quizScore)}
                    </Badge>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <p>No learning sessions yet. Start your first session to begin tracking your progress!</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )

  const renderFoldersTab = () => (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-900">My Classes</h2>
        <div className="flex gap-2">
          <Input
            placeholder="Class name"
            value={newFolderName}
            onChange={(e) => setNewFolderName(e.target.value)}
            className="w-48"
          />
          <Input
            placeholder="Description (optional)"
            value={newFolderDescription}
            onChange={(e) => setNewFolderDescription(e.target.value)}
            className="w-48"
          />
          <Button 
            onClick={createFolder} 
            disabled={!newFolderName.trim() || isCreatingFolder}
            className="bg-blue-600 hover:bg-blue-700"
          >
            {isCreatingFolder ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Creating...
              </>
            ) : (
              <>
                <Plus className="w-4 h-4 mr-2" />
                Add Class
              </>
            )}
          </Button>
        </div>
      </div>

      {isLoadingFolders ? (
        <LoadingCard text="Loading your classes..." />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {folders.map((folder) => (
            <Card key={folder.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <Folder className="w-5 h-5 text-blue-600" />
                    <div>
                      <div>{folder.name}</div>
                      {folder.description && (
                        <p className="text-sm text-gray-500 font-normal">{folder.description}</p>
                      )}
                    </div>
                  </span>
                  <Badge variant="secondary">{folder.file_count || 0} files</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="text-center py-4 text-gray-500">
                  <Upload className="w-8 h-8 mx-auto mb-2 text-gray-400" />
                  <p className="text-sm">No files uploaded yet</p>
                </div>

                <div className="border-t pt-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Upload Files
                  </label>
                  <Suspense fallback={<LoadingSpinner size={24} text="Loading upload..." />}>
                    <FileUpload onFileUploaded={(fileId, filename) => {
                      toast.success(`Uploaded ${filename} successfully!`)
                      // Refresh folders to update file count
                      fetchFolders()
                    }} />
                  </Suspense>
                </div>
              </CardContent>
            </Card>
          ))}

          {folders.length === 0 && (
            <div className="col-span-full text-center py-12 text-gray-500">
              <Folder className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p className="text-lg font-medium mb-2">No classes yet</p>
              <p className="text-sm">Add your first class to start organizing your study materials!</p>
            </div>
          )}
        </div>
      )}
    </div>
  )

  const renderSettingsTab = () => (
    <div className="p-8">
      <div className="max-w-4xl mx-auto">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Settings</h2>
        
        <div className="space-y-6">
          {/* Profile Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                  <span className="text-blue-600 text-sm font-medium">
                    {user?.firstName?.charAt(0) || 'U'}
                  </span>
                </div>
                Profile Settings
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    First Name
                  </label>
                  <Input
                    value={user?.firstName || ''}
                    disabled
                    className="bg-gray-50"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email
                  </label>
                  <Input
                    value={user?.emailAddresses?.[0]?.emailAddress || ''}
                    disabled
                    className="bg-gray-50"
                  />
                </div>
              </div>
              <p className="text-sm text-gray-500">
                Profile information is managed through your Clerk account.
              </p>
            </CardContent>
          </Card>

          {/* Learning Preferences */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="w-5 h-5 text-green-600" />
                Learning Preferences
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Study Session Duration
                  </label>
                  <select className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
                    <option value="15">15 minutes</option>
                    <option value="30" selected>30 minutes</option>
                    <option value="45">45 minutes</option>
                    <option value="60">1 hour</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Notification Frequency
                  </label>
                  <select className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
                    <option value="daily" selected>Daily</option>
                    <option value="weekly">Weekly</option>
                    <option value="never">Never</option>
                  </select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Data Management */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-orange-600" />
                Data Management
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-medium text-gray-900">Learning Statistics</h4>
                  <p className="text-sm text-gray-500">
                    Reset your learning progress and statistics
                  </p>
                </div>
                <Button
                  variant="outline"
                  onClick={() => {
                    if (confirm('Are you sure you want to reset your learning statistics? This action cannot be undone.')) {
                      localStorage.removeItem("learningStats")
                      setLearningStats({
                        currentStreak: 0,
                        totalSessions: 0,
                        lastStudyDate: null,
                        learningPerformance: {
                          quizScore: 0,
                          flashcardScore: 0,
                          overallScore: 0,
                          totalQuizzes: 0,
                          totalFlashcards: 0
                        }
                      })
                      toast.success('Learning statistics reset successfully')
                    }
                  }}
                >
                  Reset Stats
                </Button>
              </div>
              
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-medium text-gray-900">Uploaded Files</h4>
                  <p className="text-sm text-gray-500">
                    {totalFiles} files uploaded
                  </p>
                </div>
                <Button
                  variant="outline"
                  onClick={() => {
                    if (confirm('Are you sure you want to delete all uploaded files? This action cannot be undone.')) {
                      toast.info('File deletion feature coming soon')
                    }
                  }}
                >
                  Clear Files
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Account Actions */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="w-5 h-5 text-red-600" />
                Account Actions
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-medium text-gray-900">Sign Out</h4>
                  <p className="text-sm text-gray-500">
                    Sign out of your account
                  </p>
                </div>
                <Button
                  variant="outline"
                  onClick={() => {
                    // This would typically use Clerk's signOut method
                    toast.info('Sign out feature coming soon')
                  }}
                >
                  Sign Out
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <div
        className={`${sidebarCollapsed ? "w-16" : "w-64"} bg-white border-r border-gray-200 transition-all duration-300`}
      >
        <div className="p-6 flex items-center justify-between">
          {!sidebarCollapsed && <h1 className="text-xl font-semibold text-gray-900">Clara.ai</h1>}
          <Button variant="ghost" size="sm" onClick={() => setSidebarCollapsed(!sidebarCollapsed)} className="p-2">
            {sidebarCollapsed ? <Menu className="w-5 h-5" /> : <X className="w-5 h-5" />}
          </Button>
        </div>

        <nav className="px-6 space-y-2">
          <button
            onClick={() => setActiveTab("home")}
            className={`w-full flex items-center ${sidebarCollapsed ? "justify-center" : "space-x-3"} rounded-lg px-3 py-2 text-left transition-colors ${
              activeTab === "home"
                ? "bg-blue-50 text-blue-700"
                : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
            }`}
            title={sidebarCollapsed ? "Home" : ""}
          >
            <Home className="w-5 h-5" />
            {!sidebarCollapsed && <span>Home</span>}
          </button>
          <button
            onClick={() => setActiveTab("folders")}
            className={`w-full flex items-center ${sidebarCollapsed ? "justify-center" : "space-x-3"} rounded-lg px-3 py-2 text-left transition-colors ${
              activeTab === "folders"
                ? "bg-blue-50 text-blue-700"
                : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
            }`}
            title={sidebarCollapsed ? "Folders" : ""}
          >
            <Folder className="w-5 h-5" />
            {!sidebarCollapsed && <span>Classes</span>}
          </button>
          <button
            onClick={() => setActiveTab("settings")}
            className={`w-full flex items-center ${sidebarCollapsed ? "justify-center" : "space-x-3"} rounded-lg px-3 py-2 text-left transition-colors ${
              activeTab === "settings"
                ? "bg-blue-50 text-blue-700"
                : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
            }`}
            title={sidebarCollapsed ? "Settings" : ""}
          >
            <Settings className="w-5 h-5" />
            {!sidebarCollapsed && <span>Settings</span>}
          </button>
        </nav>
      </div>

      {/* Main Content */}
      <div className="flex-1">
        {activeTab === "home" && renderHomeTab()}
        {activeTab === "folders" && renderFoldersTab()}
        {activeTab === "settings" && renderSettingsTab()}
      </div>
    </div>
  )
}
