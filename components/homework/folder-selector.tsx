"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Folder, Plus, ChevronDown, ChevronUp } from "lucide-react"

interface Folder {
  id: string
  name: string
  description: string
  created_at: string
  file_count?: number
}

interface FolderSelectorProps {
  selectedFolderId: string | null
  onFolderSelect: (folderId: string | null) => void
  userId: string
}

export default function FolderSelector({ selectedFolderId, onFolderSelect, userId }: FolderSelectorProps) {
  const [folders, setFolders] = useState<Folder[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [newFolderName, setNewFolderName] = useState("")
  const [newFolderDescription, setNewFolderDescription] = useState("")
  const [isCreating, setIsCreating] = useState(false)

  useEffect(() => {
    fetchFolders()
  }, [])

  const fetchFolders = async () => {
    setIsLoading(true)
    try {
      const response = await fetch('/api/homework/folders')
      const data = await response.json()
      
      if (data.success) {
        setFolders(data.folders || [])
      }
    } catch (error) {
      console.error('Error fetching folders:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const createFolder = async () => {
    if (!newFolderName.trim()) return

    setIsCreating(true)
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
        setFolders(prev => [data.folder, ...prev])
        setNewFolderName("")
        setNewFolderDescription("")
        setShowCreateDialog(false)
      }
    } catch (error) {
      console.error('Error creating folder:', error)
    } finally {
      setIsCreating(false)
    }
  }

  const selectedFolder = folders.find(f => f.id === selectedFolderId)

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium text-gray-900">Active Folder</h3>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowCreateDialog(true)}
          className="text-xs"
        >
          <Plus className="w-3 h-3 mr-1" />
          New Folder
        </Button>
      </div>

      {isLoading ? (
        <div className="text-center py-4">
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mx-auto"></div>
          <p className="text-xs text-gray-500 mt-2">Loading folders...</p>
        </div>
      ) : (
        <div className="space-y-2">
          {selectedFolder ? (
            <Card className="border-blue-200 bg-blue-50">
              <CardContent className="p-3">
                <div className="flex items-center gap-2">
                  <Folder className="w-4 h-4 text-blue-600" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-blue-900 truncate">
                      {selectedFolder.name}
                    </p>
                    {selectedFolder.description && (
                      <p className="text-xs text-blue-700 truncate">
                        {selectedFolder.description}
                      </p>
                    )}
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onFolderSelect(null)}
                    className="h-6 w-6 p-0 text-blue-600 hover:text-blue-800"
                  >
                    ×
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="text-center py-4 border-2 border-dashed border-gray-300 rounded-lg">
              <Folder className="w-8 h-8 text-gray-400 mx-auto mb-2" />
              <p className="text-sm text-gray-500">No folder selected</p>
              <p className="text-xs text-gray-400 mt-1">
                Select a folder to organize your files
              </p>
            </div>
          )}

          {folders.length > 0 && (
            <div className="space-y-1">
              <p className="text-xs text-gray-500">Available folders:</p>
              {folders.map((folder) => (
                <button
                  key={folder.id}
                  onClick={() => onFolderSelect(folder.id)}
                  className={`w-full text-left p-2 rounded text-xs transition-colors ${
                    selectedFolderId === folder.id
                      ? 'bg-blue-100 text-blue-900'
                      : 'hover:bg-gray-100 text-gray-700'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <Folder className="w-3 h-3" />
                    <span className="truncate">{folder.name}</span>
                    {folder.file_count && (
                      <span className="text-xs text-gray-500 ml-auto">
                        {folder.file_count} files
                      </span>
                    )}
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Create Folder Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Create New Folder</DialogTitle>
            <DialogDescription>
              Create a new folder to organize your study materials.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="folder-name">Folder Name</Label>
              <Input
                id="folder-name"
                value={newFolderName}
                onChange={(e) => setNewFolderName(e.target.value)}
                placeholder="e.g., Math 101, Biology Notes"
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="folder-description">Description (Optional)</Label>
              <Input
                id="folder-description"
                value={newFolderDescription}
                onChange={(e) => setNewFolderDescription(e.target.value)}
                placeholder="Brief description of this folder"
                className="mt-1"
              />
            </div>
            <div className="flex gap-2 justify-end">
              <Button
                variant="outline"
                onClick={() => setShowCreateDialog(false)}
                disabled={isCreating}
              >
                Cancel
              </Button>
              <Button
                onClick={createFolder}
                disabled={!newFolderName.trim() || isCreating}
              >
                {isCreating ? "Creating..." : "Create Folder"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}