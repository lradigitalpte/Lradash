"use client"

import { useState, useEffect, useRef } from "react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select"
import { apiClient } from "@/lib/api/client"
import { uploadFileToS3 } from "@/lib/upload"

import { CardActivity } from "./card-detail/CardActivity"
import { CardAttachments } from "./card-detail/CardAttachments"
import { CardChecklist } from "./card-detail/CardChecklist"
import { CardCover } from "./card-detail/CardCover"
import { CardDescription } from "./card-detail/CardDescription"
import { CardHeader } from "./card-detail/CardHeader"
import { CardLabels } from "./card-detail/CardLabels"
import { CardSidebar } from "./card-detail/CardSidebar"

interface Card {
  _id: string
  title: string
  description?: string
  listId: string
  position: number
  labels?: Array<{ name: string; color: string }>
  members?: Array<{ _id: string; name: string; avatar?: string }>
  dueDate?: string
  priority?: "LOW" | "MEDIUM" | "HIGH" | "URGENT"
  checklist?: Array<{ text: string; completed: boolean }>
  attachments?: Array<{ name: string; url: string }>
  coverColor?: string
  status?: string // Added status field
  createdAt?: string // Added for System Context
  creator?: { name: string } // Added for System Context
}

interface CardDetailModalProps {
  card: Card
  boardId: string
  projectId: string
  onClose: () => void
  onUpdate: () => void
}

export function CardDetailModal({
  card,
  boardId,
  projectId,
  onClose,
  onUpdate
}: CardDetailModalProps) {
  const [title, setTitle] = useState(card.title)
  const [description, setDescription] = useState(card.description || "")
  const [labels, setLabels] = useState(card.labels || [])
  const [checklist, setChecklist] = useState(card.checklist || [])
  const [coverColor, setCoverColor] = useState(card.coverColor)
  const [dueDate, setDueDate] = useState<string | null>(card.dueDate ?? null)
  const [status, setStatus] = useState(card.status || "TODO")
  const [saving, setSaving] = useState(false)
  const [attaching, setAttaching] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Sync state with prop if card changes (e.g. from background refresh)
  useEffect(() => {
    if (card) {
      setTitle(card.title)
      setDescription(card.description || "")
      setLabels(card.labels || [])
      setChecklist(card.checklist || [])
      setCoverColor(card.coverColor)
      setDueDate(card.dueDate ?? null)
      setStatus(card.status || "TODO")
    }
  }, [card])

  const updateTask = async (updates: any) => {
    setSaving(true)
    try {
      const accessToken = localStorage.getItem("accessToken")
      const response = await fetch(`/api/tasks/${card._id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`
        },
        body: JSON.stringify(updates)
      })

      if (!response.ok) {
        throw new Error("Failed to update task")
      }
      onUpdate()
    } catch (error) {
      console.error("Update task error:", error)
      toast.error("Failed to update task")
    } finally {
      setSaving(false)
    }
  }

  const handleUpdateTitle = (newTitle: string) => {
    setTitle(newTitle)
    updateTask({ title: newTitle })
  }

  const handleUpdateDescription = (newDescription: string) => {
    setDescription(newDescription)
    updateTask({ description: newDescription })
  }

  const handleToggleChecklistItem = (index: number) => {
    const newChecklist = [...checklist]
    newChecklist[index].completed = !newChecklist[index].completed
    setChecklist(newChecklist)
    updateTask({ checklist: newChecklist })
  }

  const handleAddChecklistItem = (text: string) => {
    const newChecklist = [...checklist, { text, completed: false }]
    setChecklist(newChecklist)
    updateTask({ checklist: newChecklist })
  }

  const handleDeleteChecklistItem = (index: number) => {
    const newChecklist = checklist.filter((_, i) => i !== index)
    setChecklist(newChecklist)
    updateTask({ checklist: newChecklist })
  }

  const handleAddLabel = (label: { name: string; color: string }) => {
    const newLabels = [...labels, label]
    setLabels(newLabels)
    updateTask({ labels: newLabels })
  }

  const handleRemoveLabel = (index: number) => {
    const newLabels = labels.filter((_, i) => i !== index)
    setLabels(newLabels)
    updateTask({ labels: newLabels })
  }

  const handleChangeCover = (color: string) => {
    setCoverColor(color)
    updateTask({ coverColor: color })
  }

  const handleDueDateChange = (date: string | null) => {
    setDueDate(date)
    updateTask({ dueDate: date ?? undefined })
  }

  const handleSelectWorkPackage = (wpId: string | null) => {
    updateTask({ workPackage: wpId })
  }

  const handleAttachFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    e.target.value = ""
    if (!file) {
      return
    }

    setAttaching(true)
    try {
      const { publicUrl } = await uploadFileToS3(file, { boardId, taskId: card._id })

      const newAttachment = {
        name: file.name,
        url: publicUrl,
        type: file.type || "application/octet-stream",
        size: file.size,
        createdAt: new Date()
      }

      const updated = await apiClient.patch(`/api/tasks/${card._id}`, {
        attachments: [...(card.attachments || []), newAttachment]
      })

      if (!updated.ok) {
        throw new Error("Failed to save attachment")
      }

      // Also create a project-side document entry (linked asset)
      const sizeLabel =
        file.size < 1024
          ? `${file.size} B`
          : file.size < 1024 * 1024
            ? `${(file.size / 1024).toFixed(1)} KB`
            : `${(file.size / (1024 * 1024)).toFixed(1)} MB`

      await apiClient.post(`/api/projects/${projectId}/documents`, {
        name: file.name,
        type: file.type?.startsWith("image/")
          ? "Image"
          : file.type?.startsWith("video/")
            ? "Video"
            : file.type?.includes("pdf")
              ? "PDF"
              : "File",
        size: sizeLabel,
        folder: "From tasks",
        url: publicUrl,
        taskId: card._id,
        taskTitle: card.title
      })

      toast.success("File attached")
      onUpdate()
    } catch (err: any) {
      toast.error(err?.message || "Failed to attach file")
    } finally {
      setAttaching(false)
    }
  }

  const handleStatusChange = (newStatus: string) => {
    setStatus(newStatus)
    updateTask({ status: newStatus })
  }

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent
        className="flex !h-[90vh] max-h-[90vh] !w-[95vw] !max-w-[95vw] flex-col overflow-hidden rounded-[2.5rem] border-white/20 bg-white/80 p-0 pt-0 shadow-2xl shadow-slate-200/50 backdrop-blur-2xl sm:max-w-[95vw] lg:!max-w-[1000px] dark:border-slate-800/50 dark:bg-slate-900/80 dark:shadow-none"
        aria-describedby={undefined}
      >
        <DialogTitle className="sr-only">Task Details</DialogTitle>
        <input
          type="file"
          ref={fileInputRef}
          className="hidden"
          onChange={handleAttachFile}
          accept="image/*,video/*,audio/*,.pdf,.doc,.docx,.txt,.md,.csv,.xls,.xlsx,.json,.zip,application/zip,application/x-zip-compressed"
        />
        <div className="relative flex h-full flex-col overflow-hidden">
          {/* Extra Glow for Premium Feel */}
          <div className="pointer-events-none absolute -top-20 -right-20 h-64 w-64 rounded-full bg-blue-500/10 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-20 -left-20 h-64 w-64 rounded-full bg-indigo-500/10 blur-3xl" />

          {/* Cover */}
          {coverColor && <CardCover color={coverColor} onChangeColor={handleChangeCover} />}

          {/* Header */}
          <div className="shrink-0 px-10 pt-10 pb-4">
            <CardHeader title={title} onUpdateTitle={handleUpdateTitle} onClose={onClose} />
          </div>

          {/* Content - Scrollable */}
          <div className="custom-scrollbar flex-1 overflow-y-auto px-10 pb-10">
            <div className="grid grid-cols-1 gap-12 lg:grid-cols-[1fr_280px]">
              {/* Left Column - Main Content */}
              <div className="space-y-10">
                {/* Labels */}
                {labels.length > 0 && (
                  <CardLabels
                    labels={labels}
                    onAddLabel={handleAddLabel}
                    onRemoveLabel={handleRemoveLabel}
                  />
                )}

                {/* Description */}
                <div className="rounded-[2rem] border border-slate-100/50 bg-slate-50/50 p-8 dark:border-slate-800/30 dark:bg-slate-800/20">
                  <CardDescription
                    description={description}
                    onUpdateDescription={handleUpdateDescription}
                  />
                </div>

                {/* Checklist */}
                {checklist.length > 0 && (
                  <div className="rounded-[2rem] border border-white/20 bg-white/40 p-8 dark:border-slate-800/30 dark:bg-slate-900/40">
                    <CardChecklist
                      items={checklist}
                      onToggleItem={handleToggleChecklistItem}
                      onAddItem={handleAddChecklistItem}
                      onDeleteItem={handleDeleteChecklistItem}
                    />
                  </div>
                )}

                {/* Activity */}
                <div className="pt-4">
                  <CardActivity cardId={card._id} />
                </div>
              </div>

              {/* Right Column - Sidebar */}
              <div className="space-y-8 pt-2 lg:sticky lg:top-0 lg:self-start">
                {/* Status Selector */}
                <div className="space-y-3">
                  <h3 className="text-[10px] font-black tracking-[0.2em] text-slate-400 uppercase">
                    Status
                  </h3>
                  <Select value={status} onValueChange={handleStatusChange}>
                    <SelectTrigger className="h-12 rounded-2xl border-slate-100 bg-slate-50 text-sm font-bold dark:border-slate-800 dark:bg-slate-800">
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="TODO">To Do</SelectItem>
                      <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
                      <SelectItem value="DONE">Completed</SelectItem>
                      <SelectItem value="ARCHIVED">Archived</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <CardSidebar
                  card={card}
                  boardId={boardId}
                  projectId={projectId}
                  labels={labels}
                  onAddLabel={handleAddLabel}
                  onRemoveLabel={handleRemoveLabel}
                  onAddChecklistItem={handleAddChecklistItem}
                  onChangeCover={handleChangeCover}
                  dueDate={dueDate}
                  onDueDateChange={handleDueDateChange}
                  onSelectWorkPackage={handleSelectWorkPackage}
                  onAttachment={() => {
                    if (!attaching) {
                      fileInputRef.current?.click()
                    }
                  }}
                />
              </div>
            </div>
          </div>
        </div>
      </DialogContent>

      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(148, 163, 184, 0.2);
          border-radius: 10px;
        }
        .dark .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(51, 65, 85, 0.4);
        }
      `}</style>
    </Dialog>
  )
}
