"use client"

import React, { useState, useEffect } from 'react'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Upload, X, File, Loader2, CheckCircle } from "lucide-react"
import { toast } from "sonner"

interface FileUploadProps {
  onFileUploaded?: (fileId: string, filename: string) => void
  className?: string
}

interface UploadedFile {
  id: string
  name: string
  status: 'uploading' | 'success' | 'error'
  error?: string
}

export default function FileUpload({ onFileUploaded, className }: FileUploadProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [selectedFolder, setSelectedFolder] = useState<string>('root')
  const [folders, setFolders] = useState<Array<{ id: string, name: string }>>([])
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([])
  const [isLoadingFolders, setIsLoadingFolders] = useState(false)

  // Ensure selectedFolder is never empty
  useEffect(() => {
    if (!selectedFolder || selectedFolder.trim() === '') {
      setSelectedFolder('root')
    }
  }, [selectedFolder])

  const loadFolders = async () => {
    setIsLoadingFolders(true)
    try {
      const response = await fetch('/api/homework/folders')
      if (response.ok) {
        const data = await response.json()
        // Filter out folders with empty IDs to prevent SelectItem errors
        const validFolders = (data.folders || []).filter((folder: any) => 
          folder && folder.id && typeof folder.id === 'string' && folder.id.trim() !== ''
        )
        setFolders(validFolders)
      }
    } catch (error) {
      console.error('Error loading folders:', error)
    } finally {
      setIsLoadingFolders(false)
    }
  }

  const handleFileUpload = async (files: FileList | null) => {
    if (!files || files.length === 0) return

    const fileArray = Array.from(files)
    
    for (const file of fileArray) {
      const fileId = Date.now().toString() + Math.random().toString(36).substr(2, 9)
      
      // Add file to uploading state
      setUploadedFiles(prev => [...prev, {
        id: fileId,
        name: file.name,
        status: 'uploading'
      }])

      try {
        const formData = new FormData()
        formData.append('file', file)
        if (selectedFolder && selectedFolder !== 'root') {
          formData.append('folderId', selectedFolder)
        }

        console.log(`Uploading file: ${file.name} to folder: ${selectedFolder}`)

        const response = await fetch('/api/homework/upload', {
          method: 'POST',
          body: formData,
        })

        console.log(`Upload response status: ${response.status}`)

        if (!response.ok) {
          let errorMessage = 'Upload failed'
          try {
            const errorData = await response.json()
            errorMessage = errorData.error || errorData.message || `HTTP ${response.status}: Upload failed`
          } catch (parseError) {
            errorMessage = `HTTP ${response.status}: Upload failed`
          }
          throw new Error(errorMessage)
        }

        const data = await response.json()
        console.log('Upload response data:', data)
        
        // Update file status to success
        setUploadedFiles(prev => prev.map(f => 
          f.id === fileId ? { ...f, status: 'success' } : f
        ))

        toast.success(`Uploaded ${file.name} successfully`)
        
        // Call callback if provided
        if (onFileUploaded) {
          onFileUploaded(data.file_id, file.name)
        }

      } catch (error) {
        console.error('Error uploading file:', error)
        
        // Update file status to error
        setUploadedFiles(prev => prev.map(f => 
          f.id === fileId ? { 
            ...f, 
            status: 'error', 
            error: error instanceof Error ? error.message : 'Upload failed' 
          } : f
        ))
        
        toast.error(`Failed to upload ${file.name}: ${error instanceof Error ? error.message : 'Unknown error'}`)
      }
    }
  }

  const removeFile = (fileId: string) => {
    setUploadedFiles(prev => prev.filter(f => f.id !== fileId))
  }

  const handleOpenUpload = () => {
    setIsOpen(true)
    loadFolders()
  }

  return (
    <div className={className}>
      {!isOpen ? (
        <Button
          onClick={handleOpenUpload}
          variant="outline"
          className="w-full"
        >
          <Upload className="w-4 h-4 mr-2" />
          Upload Learning Materials
        </Button>
      ) : (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">Upload Files</CardTitle>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsOpen(false)}
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Folder Selection */}
            <div>
              <label className="text-sm font-medium text-gray-700 mb-2 block">
                Select Folder (Optional)
              </label>
              <Select value={selectedFolder} onValueChange={(value) => {
                // Ensure we never set an empty string as the selected value
                setSelectedFolder(value && value.trim() !== '' ? value : 'root')
              }}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose a folder or upload to root" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="root">Root (No folder)</SelectItem>
                  {isLoadingFolders ? (
                    <SelectItem value="loading" disabled>
                      <Loader2 className="w-4 h-4 animate-spin mr-2" />
                      Loading folders...
                    </SelectItem>
                  ) : (
                    folders
                      .filter(folder => folder && folder.id && folder.id.trim() !== '')
                      .map((folder) => (
                        <SelectItem key={folder.id} value={folder.id}>
                          {folder.name}
                        </SelectItem>
                      ))
                  )}
                </SelectContent>
              </Select>
            </div>

            {/* File Upload Area */}
            <div>
              <label className="text-sm font-medium text-gray-700 mb-2 block">
                Select Files
              </label>
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                <input
                  type="file"
                  multiple
                  accept=".pdf,.doc,.docx,.txt,.png,.jpg,.jpeg"
                  onChange={(e) => handleFileUpload(e.target.files)}
                  className="hidden"
                  id="file-upload"
                />
                <label htmlFor="file-upload" className="cursor-pointer">
                  <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                  <p className="text-sm text-gray-600">
                    Click to upload or drag and drop
                    <br />
                    PDF, DOC, TXT, Images
                  </p>
                </label>
              </div>
            </div>

            {/* Uploaded Files List */}
            {uploadedFiles.length > 0 && (
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">
                  Uploaded Files
                </label>
                <div className="space-y-2 max-h-40 overflow-y-auto">
                  {uploadedFiles.map((file) => (
                    <div
                      key={file.id}
                      className="flex items-center justify-between bg-gray-50 p-2 rounded"
                    >
                      <div className="flex items-center gap-2">
                        <File className="w-4 h-4 text-gray-500" />
                        <span className="text-sm text-gray-700 truncate">
                          {file.name}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        {file.status === 'uploading' && (
                          <Loader2 className="w-4 h-4 animate-spin text-blue-500" />
                        )}
                        {file.status === 'success' && (
                          <CheckCircle className="w-4 h-4 text-green-500" />
                        )}
                        {file.status === 'error' && (
                          <span className="text-xs text-red-500">
                            {file.error}
                          </span>
                        )}
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => removeFile(file.id)}
                        >
                          <X className="w-3 h-3" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}