"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useUser } from "@clerk/nextjs"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useRouter } from "next/navigation"
import { Folder, Plus, Loader2, X } from "lucide-react"
import { toast } from "sonner"

interface ClassFolder {
  id: string
  name: string
  description?: string
}

interface SavedFolder {
  id: string
  name: string
  description?: string
  created_at: string
}

export default function OnboardingPage() {
  const { user } = useUser()
  const router = useRouter()
  const [step, setStep] = useState(0)
  const [formData, setFormData] = useState({
    gradeLevel: "",
    learningGoals: "",
  })
  const [classFolders, setClassFolders] = useState<ClassFolder[]>([])
  const [newClassName, setNewClassName] = useState("")
  const [newClassDescription, setNewClassDescription] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    // Auto-advance through welcome messages
    if (step < 3) {
      const timer = setTimeout(
        () => {
          setStep(step + 1)
        },
        step === 0 ? 3000 : 4000,
      ) // First message shows for 3s, others for 4s

      return () => clearTimeout(timer)
    }
  }, [step])

  const addClassFolder = () => {
    if (newClassName.trim()) {
      const newFolder: ClassFolder = {
        id: Date.now().toString(),
        name: newClassName.trim(),
        description: newClassDescription.trim(),
      }
      setClassFolders([...classFolders, newFolder])
      setNewClassName("")
      setNewClassDescription("")
    }
  }

  const removeClassFolder = (id: string) => {
    setClassFolders(classFolders.filter((folder) => folder.id !== id))
  }

  const createFolder = async (folder: ClassFolder): Promise<SavedFolder> => {
    // Create folder in backend
    const folderResponse = await fetch('/api/homework/folders', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: folder.name,
        description: folder.description || '',
        user_id: user?.id || 'anonymous'
      }),
    })

    if (!folderResponse.ok) {
      throw new Error('Failed to create folder')
    }

    const folderData = await folderResponse.json()
    return folderData.folder
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      // Create all folders
      const savedFolders: SavedFolder[] = []
      
      for (const folder of classFolders) {
        try {
          const savedFolder = await createFolder(folder)
          savedFolders.push(savedFolder)
          toast.success(`Created folder "${folder.name}"`)
        } catch (error) {
          toast.error(`Failed to create folder "${folder.name}": ${error instanceof Error ? error.message : 'Unknown error'}`)
          throw error
        }
      }

      // Store onboarding data in localStorage for backward compatibility
      const onboardingData = {
        ...formData,
        classFolders: savedFolders.map((folder) => ({
          id: folder.id,
          name: folder.name,
          description: folder.description,
          created_at: folder.created_at
        })),
      }

      localStorage.setItem("userFolders", JSON.stringify(savedFolders))
      localStorage.setItem("onboardingData", JSON.stringify(onboardingData))

      toast.success('Setup completed successfully!')
      
      // Redirect to dashboard
      router.push("/dashboard")
    } catch (error) {
      console.error('Error during onboarding:', error)
      toast.error('Failed to complete setup. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  if (step === 0) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center max-w-2xl mx-auto px-6">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 opacity-0 animate-fade-in">
            Hi {user?.firstName}! I'm Clara, your AI learning assistant and I'm so happy to help you learn better
          </h1>
        </div>
      </div>
    )
  }

  if (step === 1) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center max-w-2xl mx-auto px-6">
          <p className="text-4xl md:text-3xl text-gray-700 opacity-0 animate-fade-in leading-relaxed">
            I'll help you learn using various science-backed studying strategies that will help you supercharge your
            learning experience
          </p>
        </div>
      </div>
    )
  }

  if (step === 2) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center max-w-2xl mx-auto px-6">
          <p className="text-4xl md:text-3xl text-gray-700 opacity-0 animate-fade-in leading-relaxed">
            To get started, let's get you all set by telling me what classes you're taking, what grade level you're in,
            and how you want me to help you learn!
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-4xl mx-auto px-6">
        <div className="text-center mb-8 opacity-0 animate-fade-in">
          <h2 className="text-3xl font-bold text-gray-900 mb-2">Let's get started!</h2>
          <p className="text-gray-600">Tell me about yourself and organize your learning materials.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8 opacity-0 animate-fade-in-delayed">
          {/* Basic Information */}
          <Card>
            <CardHeader>
              <CardTitle>Basic Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="gradeLevel" className="text-sm font-medium text-gray-700">
                  What grade level are you in?
                </Label>
                <Select onValueChange={(value) => handleInputChange("gradeLevel", value)}>
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Select your grade level" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="elementary">Elementary School</SelectItem>
                    <SelectItem value="middle">Middle School</SelectItem>
                    <SelectItem value="high">High School</SelectItem>
                    <SelectItem value="college">College</SelectItem>
                    <SelectItem value="graduate">Graduate School</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="learningGoals" className="text-sm font-medium text-gray-700">
                  What are your learning goals?
                </Label>
                <Textarea
                  id="learningGoals"
                  placeholder="e.g., Improve test scores, better understanding of concepts, study more efficiently..."
                  value={formData.learningGoals}
                  onChange={(e) => handleInputChange("learningGoals", e.target.value)}
                  className="mt-1"
                  rows={3}
                />
              </div>
            </CardContent>
          </Card>

          {/* Classes and Folders */}
          <Card>
            <CardHeader>
              <CardTitle>Your Classes</CardTitle>
              <p className="text-sm text-gray-600">
                Add your classes to organize your study sessions. You can upload learning materials later when you start studying.
              </p>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Add New Class */}
              <div className="space-y-2">
                <div className="flex gap-2">
                  <Input
                    placeholder="Enter class name (e.g., Math, Science, History)"
                    value={newClassName}
                    onChange={(e) => setNewClassName(e.target.value)}
                    onKeyPress={(e) => e.key === "Enter" && (e.preventDefault(), addClassFolder())}
                  />
                  <Button type="button" onClick={addClassFolder} disabled={!newClassName.trim()}>
                    <Plus className="w-4 h-4 mr-2" />
                    Add Class
                  </Button>
                </div>
                <Input
                  placeholder="Description (optional)"
                  value={newClassDescription}
                  onChange={(e) => setNewClassDescription(e.target.value)}
                  onKeyPress={(e) => e.key === "Enter" && (e.preventDefault(), addClassFolder())}
                />
              </div>

              {/* Class Folders */}
              <div className="space-y-4">
                {classFolders.map((folder) => (
                  <Card key={folder.id} className="border-l-4 border-l-blue-500">
                    <CardContent className="pt-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Folder className="w-5 h-5 text-blue-500" />
                          <div>
                            <h4 className="font-medium text-gray-900">{folder.name}</h4>
                            {folder.description && (
                              <p className="text-sm text-gray-500">{folder.description}</p>
                            )}
                          </div>
                        </div>
                        <Button type="button" variant="ghost" size="sm" onClick={() => removeClassFolder(folder.id)}>
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}

                {classFolders.length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    <Folder className="w-12 h-12 mx-auto mb-2 opacity-50" />
                    <p>Add your first class to get started!</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          <Button
            type="submit"
            className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3"
            disabled={!formData.gradeLevel || !formData.learningGoals || classFolders.length === 0 || isSubmitting}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Setting up your account...
              </>
            ) : (
              'Complete Setup'
            )}
          </Button>
        </form>
      </div>
    </div>
  )
}
