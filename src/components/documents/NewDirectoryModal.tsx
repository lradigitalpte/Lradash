"use client"

import { Folder, AlertCircle, Loader2 } from "lucide-react"
import { useState } from "react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { apiClient } from "@/lib/api/client"

interface NewDirectoryModalProps {
  projectId: string
  open: boolean
  onOpenChange: (open: boolean) => void
  onFolderCreated?: (folder: { _id: string; name: string }) => void
}

export function NewDirectoryModal({
  projectId,
  open,
  onOpenChange,
  onFolderCreated
}: NewDirectoryModalProps) {
  const [folderName, setFolderName] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [creating, setCreating] = useState(false)

  const handleCreate = async () => {
    setError(null)

    const trimmed = folderName.trim()
    if (!trimmed) {
      setError("Folder name is required")
      return
    }
    if (trimmed.length > 50) {
      setError("Folder name must be 50 characters or less")
      return
    }
    if (!/^[a-zA-Z0-9\s\-_]+$/.test(trimmed)) {
      setError("Only letters, numbers, spaces, hyphens and underscores allowed")
      return
    }

    setCreating(true)
    try {
      const res = await apiClient.post(`/api/projects/${projectId}/folders`, { name: trimmed })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || "Failed to create folder")
      }
      const folder = await res.json()
      toast.success(`Folder "${trimmed}" created`)
      onFolderCreated?.(folder)
      setFolderName("")
      onOpenChange(false)
    } catch (err: any) {
      setError(err.message || "Failed to create folder")
    } finally {
      setCreating(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-100">
        <DialogHeader>
          <DialogTitle>Create New Directory</DialogTitle>
          <DialogDescription>Organize your assets by creating a new folder</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Folder icon */}
          <div className="flex items-center justify-center p-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-amber-100 dark:bg-amber-900/30">
              <Folder className="h-8 w-8 text-amber-600" />
            </div>
          </div>

          {/* Input */}
          <div className="space-y-2">
            <Label htmlFor="folder-name" className="text-sm font-bold">
              Folder Name
            </Label>
            <Input
              id="folder-name"
              placeholder="e.g. Design Files, Documentation, Assets"
              value={folderName}
              onChange={(e) => {
                setFolderName(e.target.value)
                setError(null)
              }}
              onKeyDown={async (e) => e.key === "Enter" && handleCreate()}
              disabled={creating}
              className="rounded-xl"
            />
            <p className="text-xs text-slate-500">{folderName.length}/50 characters</p>
          </div>

          {/* Error */}
          {error && (
            <div className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700 dark:border-red-900/30 dark:bg-red-900/20 dark:text-red-400">
              <AlertCircle className="h-4 w-4 shrink-0" />
              {error}
            </div>
          )}

          {/* Info */}
          <div className="rounded-lg bg-slate-50 p-3 text-xs text-slate-600 dark:bg-slate-900/30 dark:text-slate-400">
            Files uploaded to this project can be assigned to this folder.
          </div>

          {/* Buttons */}
          <div className="flex gap-3 pt-2">
            <Button
              variant="outline"
              onClick={() => {
                setFolderName("")
                setError(null)
                onOpenChange(false)
              }}
              disabled={creating}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              onClick={handleCreate}
              disabled={creating || !folderName.trim()}
              className="flex-1 bg-blue-600 hover:bg-blue-700"
            >
              {creating ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating...
                </>
              ) : (
                "Create Folder"
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
