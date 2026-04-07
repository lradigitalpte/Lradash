"use client"

import {
  AlignLeft,
  Calendar as CalendarIcon,
  CheckSquare,
  Eye,
  Link2,
  Loader2,
  MessageSquare,
  MoreHorizontal,
  Paperclip,
  Tag,
  Trash2,
  User,
  X,
  Plus,
  Check,
  Activity,
  UserPlus,
  ClipboardCheck,
  ExternalLink
} from "lucide-react"
import Link from "next/link"
import { useParams } from "next/navigation"
import { useRef, useState, useEffect } from "react"
import { toast } from "sonner"

import { UserAvatar, ProgressBar } from "@/components/common"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { apiClient } from "@/lib/api/client"
import { uploadFileToS3 } from "@/lib/upload"
import { cn, formatDate, isOverdue } from "@/lib/utils"
import { Task } from "@/types/dbInterface"

import { CardActivity } from "../kanban/card-detail/CardActivity"
import { CardChecklist } from "../kanban/card-detail/CardChecklist"
import { CardDescription } from "../kanban/card-detail/CardDescription"
import { CardHeader } from "../kanban/card-detail/CardHeader"
import { CardLabels } from "../kanban/card-detail/CardLabels"
import { CardSidebar } from "../kanban/card-detail/CardSidebar"

import { MemberPicker } from "./MemberPicker"

interface TaskDetailModalProps {
  task?: Task & { projectTitle?: string }
  projectId?: string
  open: boolean
  onOpenChange: (open: boolean) => void
  onSave?: (task: Task) => void
  onTaskUpdated?: (task: Task) => void // For updates that already patched
}

export function TaskDetailModal({
  task,
  projectId,
  open,
  onOpenChange,
  onSave,
  onTaskUpdated
}: TaskDetailModalProps) {
  const params = useParams()
  const locale = (params?.locale as string) || "en"
  const [editedTitle, setEditedTitle] = useState(task?.title || "")
  const [editedDescription, setEditedDescription] = useState(task?.description || "")
  const [checklist, setChecklist] = useState<any[]>(task?.checklist || [])
  const [labels, setLabels] = useState<any[]>(
    task?.labels || [
      { name: "Frontend", color: "blue" },
      { name: "Urgent", color: "red" }
    ]
  )
  const [status, setStatus] = useState(task?.status || "TODO")
  const [priority, setPriority] = useState(task?.priority || "MEDIUM")
  const [attaching, setAttaching] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (task) {
      setEditedTitle(task.title)
      setEditedDescription(task.description || "")
      setChecklist(task.checklist || [])
      setStatus(task.status)
      setPriority(task.priority || "MEDIUM")
    }
  }, [task])

  useEffect(() => {
    if (!open || !task?._id || !onTaskUpdated) {
      return
    }

    let cancelled = false

    const refreshLatestTask = async () => {
      try {
        const response = await apiClient.get(`/api/tasks/${task._id}`)
        if (!response.ok) {
          return
        }
        const latestTask = await response.json()
        if (!cancelled) {
          onTaskUpdated(latestTask)
        }
      } catch {
        // best-effort refresh only
      }
    }

    refreshLatestTask()

    return () => {
      cancelled = true
    }
  }, [open, task?._id, onTaskUpdated])

  if (!task) {
    return null
  }

  const taskOverdue = task.dueDate && isOverdue(task.dueDate) && status !== "DONE"

  const handleUpdateTitle = (newTitle: string) => {
    setEditedTitle(newTitle)
    onSave?.({ ...task, title: newTitle } as Task)
  }

  const handleUpdateDescription = (newDescription: string) => {
    setEditedDescription(newDescription)
    onSave?.({ ...task, description: newDescription } as Task)
  }

  const handleToggleChecklistItem = (index: number) => {
    const newChecklist = [...checklist]
    newChecklist[index].completed = !newChecklist[index].completed
    setChecklist(newChecklist)
    onSave?.({ ...task, checklist: newChecklist } as Task)
  }

  const handleAddChecklistItem = (text: string) => {
    const newItem = { text, completed: false }
    const newChecklist = [...checklist, newItem]
    setChecklist(newChecklist)
    onSave?.({ ...task, checklist: newChecklist } as Task)
  }

  const handleDeleteChecklistItem = (index: number) => {
    const newChecklist = checklist.filter((_, i) => i !== index)
    setChecklist(newChecklist)
    onSave?.({ ...task, checklist: newChecklist } as Task)
  }

  const handleStatusChange = async (newStatus: string) => {
    setStatus(newStatus)
    try {
      const response = await apiClient.patch(`/api/tasks/${task._id}`, {
        status: newStatus
      })
      if (response.ok) {
        const updatedTask = await response.json()
        toast.success(`Status updated to ${newStatus.replace("_", " ")}`)
        // Call the special callback that doesn't patch again
        onTaskUpdated?.(updatedTask)
      } else {
        toast.error("Failed to update status")
        setStatus(task.status)
      }
    } catch (error) {
      toast.error("Failed to update status")
      setStatus(task.status)
    }
  }

  const handleAddLabel = (label: { name: string; color: string }) => {
    const newLabels = [...labels, label]
    setLabels(newLabels)
    onSave?.({ ...task, labels: newLabels } as any)
  }

  const handleRemoveLabel = (index: number) => {
    const newLabels = labels.filter((_, i) => i !== index)
    setLabels(newLabels)
    onSave?.({ ...task, labels: newLabels } as any)
  }

  const handleDueDateChange = async (date: string | null) => {
    try {
      const response = await apiClient.patch(`/api/tasks/${task._id}`, {
        dueDate: date ?? undefined
      })
      if (response.ok) {
        const updatedTask = await response.json()
        onTaskUpdated?.(updatedTask)
        toast.success(date ? "Due date set" : "Due date cleared")
      }
    } catch {
      toast.error("Failed to update due date")
    }
  }

  const handleArchive = async () => {
    try {
      const response = await apiClient.patch(`/api/tasks/${task._id}`, {
        ...task,
        status: "ARCHIVED"
      })
      if (response.ok) {
        toast.success("Initiative archived")
        onOpenChange(false)
        onSave?.({ ...task, status: "ARCHIVED" } as any)
      }
    } catch (error) {
      toast.error("Failed to archive initiative")
    }
  }

  const handleDelete = async () => {
    if (confirm("Are you sure you want to permanently delete this initiative?")) {
      try {
        const response = await apiClient.delete(`/api/tasks/${task._id}`)
        if (response.ok) {
          toast.success("Initiative purged from system")
          onOpenChange(false)
          // We need a way to tell the parent to remove it from the list
          onSave?.({ ...task, status: "DELETED" } as any)
        }
      } catch (error) {
        toast.error("Failed to delete initiative")
      }
    }
  }

  const handleChangeCover = (color: string) => {
    onSave?.({ ...task, coverColor: color } as any)
  }

  const handleAttachFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    e.target.value = ""
    if (!file) {
      return
    }
    setAttaching(true)

    const effectiveProjectId = projectId ?? (task as any)?.project ?? undefined
    const effectiveBoardId = (task as any)?.board ?? undefined
    try {
      const { publicUrl } = await uploadFileToS3(file, {
        projectId: effectiveProjectId,
        boardId: effectiveBoardId,
        taskId: task._id?.toString?.() ?? (task as any)._id
      })
      const newAttachment = {
        name: file.name,
        url: publicUrl,
        type: file.type || "application/octet-stream",
        size: file.size,
        createdAt: new Date()
      }
      const newAttachments = [...(task.attachments || []), newAttachment]
      const patchRes = await apiClient.patch(`/api/tasks/${task._id}`, {
        attachments: newAttachments
      })
      if (!patchRes.ok) {
        throw new Error("Failed to save attachment")
      }
      const updatedTask = await patchRes.json()
      onTaskUpdated?.(updatedTask)
      toast.success("File attached")
      if (effectiveProjectId) {
        const sizeLabel =
          file.size < 1024
            ? `${file.size} B`
            : file.size < 1024 * 1024
              ? `${(file.size / 1024).toFixed(1)} KB`
              : `${(file.size / (1024 * 1024)).toFixed(1)} MB`
        await apiClient.post(`/api/projects/${effectiveProjectId}/documents`, {
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
          taskId: task._id?.toString?.() ?? (task as any)._id,
          taskTitle: task.title
        })
      }
    } catch (err: any) {
      toast.error(err?.message || "Failed to attach file")
    } finally {
      setAttaching(false)
    }
  }

  const handleRemoveAttachment = async (index: number) => {
    const newAttachments = task.attachments?.filter((_, i) => i !== index) ?? []
    try {
      const res = await apiClient.patch(`/api/tasks/${task._id}`, {
        attachments: newAttachments
      })
      if (res.ok) {
        const updatedTask = await res.json()
        onTaskUpdated?.(updatedTask)
        toast.success("Attachment removed")
      } else {
        throw new Error("Failed to remove")
      }
    } catch {
      toast.error("Failed to remove attachment")
    }
  }

  const handleSelectWorkPackage = async (wpId: string | null) => {
    if (!task?._id) {
      return
    }
    try {
      const patchRes = await apiClient.patch(`/api/tasks/${task._id}`, {
        workPackage: wpId ?? undefined
      })
      if (patchRes.ok) {
        const updatedTask = await patchRes.json()
        onTaskUpdated?.(updatedTask)
        toast.success(wpId ? "Work package assigned" : "Work package cleared")
      } else {
        toast.error("Failed to update work package")
      }
    } catch {
      toast.error("Failed to update work package")
    }
  }

  // Adapter for CardSidebar since it expects a Card type
  const cardAdapter = {
    ...task,
    _id: task._id.toString(),
    listId: status,
    position: 0,
    labels: labels,
    priority: priority as any,
    checklist: checklist.map((c) => ({ text: c.title || c.text, completed: !!c.completed })),
    members: task.assignee ? [task.assignee] : [],
    coverColor: task.coverColor,
    workPackage: (task as any).workPackage
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="flex !h-[90vh] max-h-[90vh] !w-[95vw] !max-w-[95vw] flex-col overflow-hidden rounded-[2.5rem] border-white/20 bg-white/80 p-0 pt-0 shadow-2xl shadow-slate-200/50 backdrop-blur-2xl sm:max-w-[95vw] lg:!max-w-[1100px] dark:border-slate-800/50 dark:bg-slate-900/80 dark:shadow-none"
        aria-describedby={undefined}
      >
        <div className="relative flex h-full flex-col overflow-hidden">
          {/* Cover Color Banner */}
          {task.coverColor && (
            <div
              className="relative h-32 w-full shrink-0 overflow-hidden"
              style={{ backgroundColor: task.coverColor }}
            >
              <div className="absolute inset-0 bg-gradient-to-b from-black/20 to-transparent" />
              <div className="absolute inset-0 opacity-30 backdrop-blur-[2px]" />
            </div>
          )}

          {/* Decorative Glows */}
          <div className="-v-10 pointer-events-none absolute -top-20 -right-20 h-80 w-80 rounded-full bg-blue-500/10 blur-3xl" />
          <div className="-v-10 pointer-events-none absolute -bottom-20 -left-20 h-80 w-80 rounded-full bg-indigo-500/10 blur-3xl" />

          {/* Header Section */}
          <div className="relative shrink-0 px-10 pt-12 pb-6">
            <div className="mb-6 flex items-center gap-3">
              <span className="rounded-full border border-blue-100 bg-blue-50 px-3 py-1 text-[10px] font-black tracking-[0.2em] text-blue-600 uppercase shadow-sm dark:border-blue-800 dark:bg-blue-900/30 dark:text-blue-400">
                {task.projectTitle || "Personal Task"}
              </span>
              <div className="h-1 w-1 rounded-full bg-slate-200 dark:bg-slate-700" />
              <span className="text-[10px] font-black tracking-[0.2em] text-slate-400 uppercase italic">
                #{task._id.toString().slice(-6)}
              </span>
            </div>

            <CardHeader
              title={editedTitle}
              onUpdateTitle={handleUpdateTitle}
              onClose={() => {
                onOpenChange(false)
              }}
            />
          </div>

          {/* Main Content Area - Scrollable */}
          <div className="custom-scrollbar relative flex-1 overflow-y-auto px-10 pb-12">
            <div className="grid grid-cols-1 gap-12 lg:grid-cols-[1fr_300px]">
              {/* Left Column - Details */}
              <div className="space-y-12">
                {/* Meta Information Summary */}
                <div className="flex flex-wrap items-start gap-8">
                  {labels.length > 0 && (
                    <CardLabels
                      labels={labels}
                      onAddLabel={handleAddLabel}
                      onRemoveLabel={handleRemoveLabel}
                    />
                  )}
                </div>

                {/* Description */}
                <div className="pt-4">
                  <CardDescription
                    description={editedDescription}
                    onUpdateDescription={handleUpdateDescription}
                  />
                </div>

                {/* Checklist */}
                <div className="rounded-[2.5rem] border border-white/20 bg-white/40 p-8 shadow-xl shadow-slate-200/40 dark:border-slate-800/30 dark:bg-slate-900/40 dark:shadow-none">
                  <CardChecklist
                    items={checklist.map((c) => ({
                      text: c.title || c.text,
                      completed: !!c.completed
                    }))}
                    onToggleItem={handleToggleChecklistItem}
                    onAddItem={handleAddChecklistItem}
                    onDeleteItem={handleDeleteChecklistItem}
                  />
                </div>

                {/* Attachments Section */}
                <div className="space-y-8">
                  <div className="flex items-center justify-between px-2">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-indigo-600 text-white shadow-lg shadow-indigo-500/20">
                        <Paperclip className="h-5 w-5 stroke-[2.5]" />
                      </div>
                      <div>
                        <h3 className="text-xl font-black tracking-tight text-slate-900 uppercase dark:text-white">
                          Data Assets
                        </h3>
                        <p className="text-[10px] font-black tracking-[0.2em] text-slate-400 uppercase">
                          Linked resources & intelligence
                        </p>
                      </div>
                    </div>
                    <input
                      type="file"
                      ref={fileInputRef}
                      className="hidden"
                      onChange={handleAttachFile}
                      accept="image/*,video/*,audio/*,.pdf,.doc,.docx,.txt,.md,.csv,.xls,.xlsx,.json,.zip,application/zip,application/x-zip-compressed"
                    />
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={attaching || !projectId}
                      onClick={() => fileInputRef.current?.click()}
                      className="h-10 rounded-xl border-slate-200 px-6 text-[10px] font-black tracking-widest uppercase hover:bg-slate-50 dark:border-slate-800 dark:hover:bg-slate-800"
                    >
                      {attaching ? (
                        <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <Plus className="mr-2 h-3.5 w-3.5" />
                      )}
                      {attaching ? "Uploading…" : "Attach file"}
                    </Button>
                  </div>

                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    {task.attachments && task.attachments.length > 0 ? (
                      task.attachments.map((file, idx) => (
                        <div
                          key={idx}
                          className="group relative flex items-center gap-4 rounded-2xl border border-slate-100 bg-white/50 p-4 transition-all duration-500 hover:border-blue-500/30 hover:shadow-xl hover:shadow-blue-500/5 dark:border-slate-800 dark:bg-slate-900/50"
                        >
                          <a
                            href={file.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-slate-100 transition-colors group-hover:bg-blue-600 group-hover:text-white dark:bg-slate-800"
                          >
                            <Link2 className="h-5 w-5" />
                          </a>
                          <div className="min-w-0 flex-1">
                            <a
                              href={file.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="block truncate text-sm font-bold tracking-tight text-slate-900 underline-offset-2 hover:underline dark:text-white"
                            >
                              {file.name}
                            </a>
                            <p className="text-[10px] font-black tracking-widest text-slate-400 uppercase">
                              {(file.size || 0) / 1024 > 1024
                                ? `${((file.size || 0) / (1024 * 1024)).toFixed(1)} MB`
                                : `${((file.size || 0) / 1024).toFixed(1)} KB`}
                            </p>
                          </div>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={async () => handleRemoveAttachment(idx)}
                            className="text-slate-300 opacity-0 transition-all group-hover:opacity-100 hover:text-rose-600"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      ))
                    ) : (
                      <div className="col-span-full flex flex-col items-center justify-center rounded-[2rem] border border-dashed border-slate-200 bg-slate-50/20 py-12 text-slate-400 dark:border-slate-800 dark:bg-slate-900/20">
                        <Paperclip className="mb-4 h-8 w-8 opacity-20" />
                        <p className="text-[10px] font-black tracking-[0.2em] uppercase">
                          Zero linked assets discovered
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Activity Feed */}
                <div className="border-t border-slate-100 pt-6 dark:border-slate-800">
                  <div className="mb-8 flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-blue-600 text-white shadow-lg shadow-blue-500/20">
                      <Activity className="h-5 w-5 stroke-[2.5]" />
                    </div>
                    <div>
                      <h3 className="text-xl font-black tracking-tight text-slate-900 uppercase dark:text-white">
                        Audit Log
                      </h3>
                      <p className="text-[10px] font-black tracking-[0.2em] text-slate-400 uppercase">
                        Real-time task evolution
                      </p>
                    </div>
                  </div>
                  <CardActivity
                    key={`activity-${task._id}-${new Date(task.updatedAt).getTime()}`}
                    cardId={task._id.toString()}
                  />
                </div>
              </div>

              {/* Right Column - Actions & Stats */}
              <div className="space-y-8">
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

                <div className="space-y-3">
                  <h3 className="text-[10px] font-black tracking-[0.2em] text-slate-400 uppercase">
                    Assigned To
                  </h3>
                  {task.assignee ? (
                    <div className="group flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-blue-400 to-blue-600 text-xs font-bold text-white shadow-lg">
                        {task.assignee?.name?.charAt(0).toUpperCase()}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-bold text-slate-900 dark:text-white">
                          {task.assignee?.name}
                        </p>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 opacity-0 transition-opacity group-hover:opacity-100"
                        onClick={() => {
                          onSave?.({ ...task, assignee: null } as any)
                          toast.success("Task unassigned")
                        }}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  ) : (
                    <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50/50 p-3 dark:border-slate-700 dark:bg-slate-900/30">
                      <MemberPicker
                        projectId={projectId}
                        onSelect={(member) => {
                          onSave?.({ ...task, assignee: member } as any)
                          toast.success(`Task assigned to ${member?.name}`)
                        }}
                        className="w-full"
                      />
                    </div>
                  )}
                </div>

                {/* Completion Timeline link — only for project tasks */}
                {projectId && task._id && (
                  <div className="space-y-3">
                    <h3 className="text-[10px] font-black tracking-[0.2em] text-slate-400 uppercase">
                      Completion
                    </h3>
                    <Link
                      href={`/${locale}/projects/${projectId}/tasks/${task._id}/completion`}
                      onClick={() => {
                        onOpenChange(false)
                      }}
                    >
                      <div className="group flex cursor-pointer items-center justify-between rounded-2xl border border-slate-100 bg-slate-50 px-4 py-3 transition-all hover:border-blue-200 hover:bg-blue-50 dark:border-slate-800 dark:bg-slate-800/40 dark:hover:border-blue-800 dark:hover:bg-blue-900/20">
                        <div className="flex items-center gap-3">
                          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-blue-100 text-blue-600 dark:bg-blue-900/40">
                            <ClipboardCheck className="h-4 w-4" />
                          </div>
                          <div>
                            <p className="text-[11px] font-black text-slate-700 dark:text-slate-200">
                              Completion Timeline
                            </p>
                            <p className="text-[9px] font-bold tracking-wider text-slate-400 uppercase">
                              Submit & review evidence
                            </p>
                          </div>
                        </div>
                        <ExternalLink className="h-3.5 w-3.5 text-slate-300 transition-colors group-hover:text-blue-500" />
                      </div>
                    </Link>
                  </div>
                )}

                <CardSidebar
                  card={cardAdapter as any}
                  boardId={(task as any)?.board || undefined}
                  projectId={(task as any)?.project || undefined}
                  labels={labels}
                  onAddLabel={handleAddLabel}
                  onRemoveLabel={handleRemoveLabel}
                  onAddChecklistItem={handleAddChecklistItem}
                  onChangeCover={handleChangeCover}
                  dueDate={
                    task.dueDate != null
                      ? typeof task.dueDate === "string"
                        ? task.dueDate
                        : new Date(task.dueDate).toISOString()
                      : undefined
                  }
                  onDueDateChange={handleDueDateChange}
                  onSelectWorkPackage={handleSelectWorkPackage}
                  onAttachment={() => fileInputRef.current?.click()}
                  onArchive={handleArchive}
                  onDelete={handleDelete}
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
