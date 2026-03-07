"use client"

import { Upload, AlertCircle, CheckCircle2, Folder } from "lucide-react"
import { useState, useRef } from "react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle
} from "@/components/ui/dialog"
import { Progress } from "@/components/ui/progress"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select"
import { apiClient } from "@/lib/api/client"
import { cn } from "@/lib/utils"

interface UploadModalProps {
  projectId?: string
  boardId?: string
  folders?: { _id: string; name: string }[]
  open: boolean
  onOpenChange: (open: boolean) => void
  onUploadSuccess?: (doc: any) => void
}

const ALLOWED_TYPES = {
  image: ["image/jpeg", "image/png", "image/gif", "image/webp", "image/svg+xml"],
  video: ["video/mp4", "video/quicktime", "video/x-msvideo", "video/x-matroska"],
  audio: ["audio/mpeg", "audio/wav", "audio/ogg", "audio/webm", "audio/flac"],
  document: ["application/pdf", "text/plain", "text/markdown"],
  spreadsheet: [
    "application/vnd.ms-excel",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    "text/csv"
  ],
  code: ["application/json", "text/html", "text/css", "text/javascript", "application/typescript"]
}

const MAX_FILE_SIZE = 100 * 1024 * 1024 // 100 MB

export function UploadModal({
  projectId,
  boardId,
  folders = [],
  open,
  onOpenChange,
  onUploadSuccess
}: UploadModalProps) {
  const isBoard = Boolean(boardId)
  const [file, setFile] = useState<File | null>(null)
  const [uploading, setUploading] = useState(false)
  const [progress, setProgress] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const [selectedFolder, setSelectedFolder] = useState("General")
  const fileInputRef = useRef<HTMLInputElement>(null)
  const dragRef = useRef<HTMLDivElement>(null)

  const allowedExtensions = Object.values(ALLOWED_TYPES)
    .flat()
    .map((type) => {
      const ext = type.split("/")[1]
      return ext === "quicktime" ? ".mov" : `.${ext}`
    })

  const getFileCategory = (mimeType: string) => {
    for (const [category, types] of Object.entries(ALLOWED_TYPES)) {
      if (types.includes(mimeType)) {
        return category
      }
    }
    return "file"
  }

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) {
      return bytes + " B"
    }
    if (bytes < 1024 * 1024) {
      return (bytes / 1024).toFixed(1) + " KB"
    }
    return (bytes / (1024 * 1024)).toFixed(1) + " MB"
  }

  const validateFile = (f: File): string | null => {
    if (!isFileTypeAllowed(f.type, f.name)) {
      return `File type not supported. Allowed: images, videos, audio, documents, spreadsheets, code files`
    }
    if (f.size > MAX_FILE_SIZE) {
      return `File exceeds 100 MB limit (${formatFileSize(f.size)})`
    }
    return null
  }

  const isFileTypeAllowed = (mimeType: string, fileName: string) => {
    if (mimeType && Object.values(ALLOWED_TYPES).flat().includes(mimeType)) {
      return true
    }
    // Fallback: check by extension
    const ext = fileName.split(".").pop()?.toLowerCase()
    const supportedExts = [
      "pdf",
      "txt",
      "md",
      "json",
      "html",
      "css",
      "js",
      "ts",
      "csv",
      "xls",
      "xlsx",
      "mov",
      "mp4",
      "avi",
      "mkv",
      "mp3",
      "wav",
      "ogg",
      "flac",
      "jpg",
      "jpeg",
      "png",
      "gif",
      "webp",
      "svg"
    ]
    return ext ? supportedExts.includes(ext) : false
  }

  const handleFile = (f: File) => {
    setError(null)
    const validationError = validateFile(f)
    if (validationError) {
      setError(validationError)
      return
    }
    setFile(f)
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (dragRef.current) {
      dragRef.current.classList.add("ring-2", "ring-blue-500")
    }
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    if (dragRef.current) {
      dragRef.current.classList.remove("ring-2", "ring-blue-500")
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (dragRef.current) {
      dragRef.current.classList.remove("ring-2", "ring-blue-500")
    }
    const f = e.dataTransfer.files?.[0]
    if (f) {
      handleFile(f)
    }
  }

  const handleUpload = async () => {
    if (!file) {
      return
    }

    setUploading(true)
    setProgress(0)
    setError(null)

    try {
      // Step 1: Get presigned URL
      setProgress(20)
      const presignedRes = await apiClient.post("/api/upload/presigned", {
        fileName: file.name,
        fileType: file.type || "application/octet-stream",
        ...(isBoard && boardId ? { boardId, subFolder: "documents" } : { projectId })
      })
      if (!presignedRes.ok) {
        throw new Error("Could not get upload URL")
      }
      const { uploadUrl, publicUrl } = await presignedRes.json()

      // Step 2: Upload to S3
      setProgress(50)
      const s3Res = await fetch(uploadUrl, {
        method: "PUT",
        body: file,
        headers: { "Content-Type": file.type || "application/octet-stream" }
      })
      if (!s3Res.ok) {
        throw new Error(`S3 upload failed (${s3Res.status})`)
      }

      // Step 3: Save to DB
      setProgress(80)
      let type = "File"
      if (file.type.includes("image")) {
        type = "Image"
      } else if (file.type.includes("video")) {
        type = "Video"
      } else if (file.type.includes("audio")) {
        type = "Audio"
      } else if (file.type.includes("pdf")) {
        type = "PDF"
      }

      const sizeLabel = formatFileSize(file.size)

      const dbRes =
        isBoard && boardId
          ? await apiClient.post(`/api/boards/${boardId}/documents`, {
              name: file.name,
              type,
              size: sizeLabel,
              url: publicUrl
            })
          : await apiClient.post(`/api/projects/${projectId}/documents`, {
              name: file.name,
              type,
              size: sizeLabel,
              folder: selectedFolder,
              url: publicUrl
            })
      if (!dbRes.ok) {
        throw new Error("Failed to save document")
      }

      const newDoc = await dbRes.json()
      setProgress(100)
      toast.success(`${file.name} uploaded successfully`)
      onUploadSuccess?.(newDoc)

      // Reset and close
      setTimeout(() => {
        setFile(null)
        setProgress(0)
        setSelectedFolder("General")
        onOpenChange(false)
      }, 500)
    } catch (err: any) {
      console.error("Upload error:", err)
      setError(err.message || "Upload failed")
      toast.error(err.message || "Upload failed")
    } finally {
      setUploading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Upload Resource</DialogTitle>
          <DialogDescription>
            Upload images, videos, audio, documents, and more (max 100 MB)
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* ── Folder picker – project only ── */}
          {!isBoard && (
            <div className="space-y-1.5">
              <label className="text-xs font-bold tracking-wide text-slate-500 uppercase">
                Save to folder
              </label>
              <Select value={selectedFolder} onValueChange={setSelectedFolder} disabled={uploading}>
                <SelectTrigger className="rounded-xl">
                  <div className="flex items-center gap-2">
                    <Folder className="h-4 w-4 text-amber-500" />
                    <SelectValue />
                  </div>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="General">General</SelectItem>
                  {folders.map((f) => (
                    <SelectItem key={f._id} value={f.name}>
                      {f.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* ── File area ── */}
          {!file ? (
            <>
              {/* Drag and drop area */}
              <div
                ref={dragRef}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className="flex cursor-pointer flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50/50 p-8 transition-colors hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-900/20"
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900/30">
                  <Upload className="h-6 w-6 text-blue-600" />
                </div>
                <div className="text-center">
                  <p className="font-bold text-slate-900 dark:text-white">
                    Drag and drop your file here
                  </p>
                  <p className="text-sm text-slate-500">or click to browse</p>
                </div>
              </div>

              <input
                ref={fileInputRef}
                type="file"
                className="hidden"
                onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
                accept={allowedExtensions.join(",")}
              />

              {/* Size limit info */}
              <div className="flex items-center gap-2 rounded-lg border border-blue-200 bg-blue-50 p-3 text-sm text-blue-700 dark:border-blue-900/30 dark:bg-blue-900/20 dark:text-blue-400">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>Max 100 MB · Images, Video, Audio, PDF, TXT, MD</span>
              </div>
            </>
          ) : (
            <>
              {/* File selected card */}
              <div className="flex items-start gap-3 rounded-xl border border-green-200 bg-green-50 p-4 dark:border-green-900/30 dark:bg-green-900/10">
                <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-green-600" />
                <div className="min-w-0 flex-1">
                  <p className="truncate font-bold text-slate-900 dark:text-white">{file.name}</p>
                  <p className="text-xs text-slate-500">
                    {formatFileSize(file.size)} &bull; {getFileCategory(file.type)}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setFile(null)
                    setError(null)
                  }}
                  disabled={uploading}
                  className="text-xs font-bold text-slate-400 hover:text-red-500 disabled:pointer-events-none"
                >
                  Change
                </button>
              </div>

              {uploading && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-bold text-slate-900 dark:text-white">Uploading...</span>
                    <span className="text-xs text-slate-500">{progress}%</span>
                  </div>
                  <Progress value={progress} className="h-2" />
                </div>
              )}
            </>
          )}

          {error && (
            <div className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700 dark:border-red-900/30 dark:bg-red-900/20 dark:text-red-400">
              <AlertCircle className="h-4 w-4 shrink-0" />
              {error}
            </div>
          )}

          {/* Footer buttons */}
          <div className="flex gap-3 pt-1">
            <Button
              variant="outline"
              onClick={() => {
                setFile(null)
                setError(null)
                setSelectedFolder("General")
                onOpenChange(false)
              }}
              disabled={uploading}
              className="flex-1"
            >
              Cancel
            </Button>
            {file && (
              <Button
                onClick={handleUpload}
                disabled={uploading}
                className="flex-1 bg-blue-600 hover:bg-blue-700"
              >
                {uploading ? "Uploading..." : "Upload"}
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
