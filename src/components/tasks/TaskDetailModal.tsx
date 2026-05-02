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
import { cn, isOverdue } from "@/lib/utils"
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
  const [attachmentModalOpen, setAttachmentModalOpen] = useState(false)
  const [attachmentMode, setAttachmentMode] = useState<"file" | "link">("file")
  const [linkUrl, setLinkUrl] = useState("")
  const [linkName, setLinkName] = useState("")
  const [addingLink, setAddingLink] = useState(false)
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

  if (!task) {
    return null
  }

  const taskOverdue = task.dueDate && isOverdue(task.dueDate) && status !== "DONE"
  const assignedUsers =
    Array.isArray((task as any).assignees) && (task as any).assignees.length > 0
      ? (task as any).assignees
      : task.assignee
        ? [task.assignee]
        : []
  const createdAtLabel = new Date(task.createdAt).toLocaleString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  })
  const createdAtDateOnlyLabel = new Date(task.createdAt).toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric"
  })
  const loggedAtDate = (() => {
    const taskId = task._id?.toString?.() ?? ""
    if (taskId.length >= 8) {
      const ts = Number.parseInt(taskId.slice(0, 8), 16)
      if (!Number.isNaN(ts) && ts > 0) {
        return new Date(ts * 1000)
      }
    }
    return new Date(task.updatedAt)
  })()
  const updatedAtLabel = new Date(task.updatedAt).toLocaleString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  })
  const loggedAtLabel = loggedAtDate.toLocaleString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  })

  const patchTask = async (
    payload: Record<string, unknown>,
    successMessage?: string
  ): Promise<Task | null> => {
    try {
      const response = await apiClient.patch(`/api/tasks/${task._id}`, payload)
      if (!response.ok) {
        toast.error("Failed to update task")
        return null
      }
      const updatedTask = await response.json()
      if (successMessage) {
        toast.success(successMessage)
      }
      onTaskUpdated?.(updatedTask)
      return updatedTask
    } catch {
      toast.error("Failed to update task")
      return null
    }
  }

  const handleUpdateTitle = async (newTitle: string) => {
    setEditedTitle(newTitle)
    await patchTask({ title: newTitle }, "Title updated")
  }

  const handleUpdateDescription = async (newDescription: string) => {
    setEditedDescription(newDescription)
    await patchTask({ description: newDescription }, "Description updated")
  }

  const handleToggleChecklistItem = async (index: number) => {
    const newChecklist = [...checklist]
    newChecklist[index].completed = !newChecklist[index].completed
    setChecklist(newChecklist)
    await patchTask({ checklist: newChecklist })
  }

  const handleAddChecklistItem = async (text: string) => {
    const newItem = { text, completed: false }
    const newChecklist = [...checklist, newItem]
    setChecklist(newChecklist)
    await patchTask({ checklist: newChecklist }, "Checklist updated")
  }

  const handleDeleteChecklistItem = async (index: number) => {
    const newChecklist = checklist.filter((_, i) => i !== index)
    setChecklist(newChecklist)
    await patchTask({ checklist: newChecklist })
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
    patchTask({ labels: newLabels }, "Label added")
  }

  const handleRemoveLabel = (index: number) => {
    const newLabels = labels.filter((_, i) => i !== index)
    setLabels(newLabels)
    patchTask({ labels: newLabels }, "Label removed")
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
    patchTask({ coverColor: color }, "Cover updated")
  }

  const handleAssignMember = async (member: any) => {
    const existingIds = assignedUsers
      .map((u: any) => String(u.id || u._id))
      .filter((id: string) => Boolean(id))
    const memberId = String(member?.id || member?._id || "")
    if (!memberId) {
      return
    }
    if (existingIds.includes(memberId)) {
      toast.info("User already assigned")
      return
    }
    const assigneeIds = [...existingIds, memberId]
    await patchTask(
      { assigneeIds, assigneeId: assigneeIds[0] },
      `Assigned to ${member?.name || "member"}`
    )
  }

  const handleRemoveAssignee = async (memberId: string) => {
    const assigneeIds = assignedUsers
      .map((u: any) => String(u.id || u._id))
      .filter((id: string) => Boolean(id) && id !== memberId)
    await patchTask(
      { assigneeIds, assigneeId: assigneeIds.length > 0 ? assigneeIds[0] : undefined },
      "Assignee updated"
    )
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

  const normalizeLinkUrl = (rawUrl: string): string | null => {
    const trimmed = rawUrl.trim()
    if (!trimmed) {
      return null
    }

    const withProtocol = /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`
    try {
      const parsed = new URL(withProtocol)
      if (!parsed.hostname) {
        return null
      }
      return parsed.toString()
    } catch {
      return null
    }
  }

  const handleAttachLink = async (): Promise<boolean> => {
    const normalizedUrl = normalizeLinkUrl(linkUrl)
    if (!normalizedUrl) {
      toast.error("Enter a valid URL")
      return false
    }

    setAddingLink(true)
    try {
      const effectiveProjectId = projectId ?? (task as any)?.project ?? undefined
      const displayName = linkName.trim() || new URL(normalizedUrl).hostname
      const newAttachment = {
        name: displayName,
        url: normalizedUrl,
        type: "link",
        size: 0,
        createdAt: new Date()
      }

      const patchRes = await apiClient.patch(`/api/tasks/${task._id}`, {
        attachments: [...(task.attachments || []), newAttachment]
      })

      if (!patchRes.ok) {
        throw new Error("Failed to save link")
      }

      const updatedTask = await patchRes.json()
      onTaskUpdated?.(updatedTask)

      if (effectiveProjectId) {
        await apiClient.post(`/api/projects/${effectiveProjectId}/documents`, {
          name: displayName,
          type: "Link",
          size: "Link",
          folder: "From tasks",
          url: normalizedUrl,
          taskId: task._id?.toString?.() ?? (task as any)._id,
          taskTitle: task.title
        })
      }

      setLinkUrl("")
      setLinkName("")
      toast.success("Link attached")
      return true
    } catch (err: any) {
      toast.error(err?.message || "Failed to attach link")
      return false
    } finally {
      setAddingLink(false)
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
        <div className="relative flex h-full min-h-0 flex-col overflow-hidden">
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
                {task.projectTitle || "Personal Tasks Accumulation"}
              </span>
              <div className="h-1 w-1 rounded-full bg-slate-200 dark:bg-slate-700" />
              <span className="text-[10px] font-black tracking-[0.2em] text-slate-400 uppercase italic">
                #{task._id.toString().slice(-6)}
              </span>
            </div>

            <div className="mb-5 flex flex-wrap items-center gap-2 text-[10px] font-black tracking-widest text-slate-400 uppercase">
              {!task.isBackdated ? (
                <span className="rounded-full border border-slate-200 bg-slate-50 px-2 py-1 dark:border-slate-700 dark:bg-slate-800">
                  Created {createdAtLabel}
                </span>
              ) : (
                <>
                  <span className="rounded-full border border-amber-200 bg-amber-50 px-2 py-1 text-amber-700 dark:border-amber-800/60 dark:bg-amber-900/20 dark:text-amber-300">
                    Backdated to {createdAtDateOnlyLabel}
                  </span>
                  <span className="rounded-full border border-slate-200 bg-slate-50 px-2 py-1 dark:border-slate-700 dark:bg-slate-800">
                    Logged at {loggedAtLabel}
                  </span>
                </>
              )}
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
          <div className="custom-scrollbar relative min-h-0 flex-1 overflow-y-auto px-10 pb-12">
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
                      disabled={attaching || addingLink}
                      onClick={() => {
                        setAttachmentMode("file")
                        setAttachmentModalOpen(true)
                      }}
                      className="h-10 rounded-xl border-slate-200 px-6 text-[10px] font-black tracking-widest uppercase hover:bg-slate-50 dark:border-slate-800 dark:hover:bg-slate-800"
                    >
                      {attaching ? (
                        <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <Plus className="mr-2 h-3.5 w-3.5" />
                      )}
                      {attaching ? "Uploading…" : "Attach"}
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
                              {file.type === "link"
                                ? "LINK"
                                : (file.size || 0) / 1024 > 1024
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
                  <div className="space-y-2">
                    {assignedUsers.length > 0 ? (
                      assignedUsers.map((assignee: any) => {
                        const memberId = String(assignee?.id || assignee?._id || "")
                        return (
                          <div key={memberId} className="group flex items-center gap-3">
                            <UserAvatar
                              name={assignee?.name || "User"}
                              image={assignee?.avatar}
                              size="sm"
                            />
                            <div className="min-w-0 flex-1">
                              <p className="truncate text-sm font-bold text-slate-900 dark:text-white">
                                {assignee?.name}
                              </p>
                            </div>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 opacity-0 transition-opacity group-hover:opacity-100"
                              onClick={() => {
                                if (memberId) {
                                  handleRemoveAssignee(memberId)
                                }
                              }}
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        )
                      })
                    ) : (
                      <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
                        No assignees yet
                      </p>
                    )}
                  </div>
                  <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50/50 p-3 dark:border-slate-700 dark:bg-slate-900/30">
                    <MemberPicker
                      projectId={projectId}
                      onSelect={handleAssignMember}
                      currentAssigneeId={
                        assignedUsers[0]
                          ? String(assignedUsers[0].id || assignedUsers[0]._id)
                          : undefined
                      }
                      className="w-full"
                    />
                  </div>
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

          {attachmentModalOpen && (
            <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/35 p-4 backdrop-blur-[1px]">
              <div className="w-full max-w-md rounded-3xl border border-white/20 bg-white/95 p-5 shadow-2xl dark:border-slate-700 dark:bg-slate-900/95">
                <div className="mb-4 flex items-center justify-between">
                  <div>
                    <h4 className="text-sm font-black tracking-wider text-slate-900 uppercase dark:text-white">
                      Attach To Task
                    </h4>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      Choose what you want to add
                    </p>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => {
                      setAttachmentModalOpen(false)
                    }}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>

                <div className="mb-4 grid grid-cols-2 gap-2">
                  <Button
                    type="button"
                    variant={attachmentMode === "file" ? "default" : "outline"}
                    className="h-10 rounded-xl text-xs font-black tracking-widest uppercase"
                    onClick={() => {
                      setAttachmentMode("file")
                    }}
                  >
                    <Paperclip className="mr-2 h-3.5 w-3.5" />
                    File
                  </Button>
                  <Button
                    type="button"
                    variant={attachmentMode === "link" ? "default" : "outline"}
                    className="h-10 rounded-xl text-xs font-black tracking-widest uppercase"
                    onClick={() => {
                      setAttachmentMode("link")
                    }}
                  >
                    <Link2 className="mr-2 h-3.5 w-3.5" />
                    Link
                  </Button>
                </div>

                {attachmentMode === "file" ? (
                  <div className="space-y-3">
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      Upload documents, images, spreadsheets, PDFs, and more.
                    </p>
                    <Button
                      type="button"
                      disabled={attaching}
                      onClick={() => {
                        setAttachmentModalOpen(false)
                        fileInputRef.current?.click()
                      }}
                      className="h-10 w-full rounded-xl text-xs font-black tracking-widest uppercase"
                    >
                      {attaching ? (
                        <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <Plus className="mr-2 h-3.5 w-3.5" />
                      )}
                      {attaching ? "Uploading..." : "Choose File"}
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <Input
                      value={linkUrl}
                      onChange={(e) => {
                        setLinkUrl(e.target.value)
                      }}
                      placeholder="Paste URL (example.com/doc)"
                      className="h-10 rounded-xl border-slate-200 bg-white/80 dark:border-slate-800 dark:bg-slate-900/70"
                    />
                    <Input
                      value={linkName}
                      onChange={(e) => {
                        setLinkName(e.target.value)
                      }}
                      placeholder="Link title (optional)"
                      className="h-10 rounded-xl border-slate-200 bg-white/80 dark:border-slate-800 dark:bg-slate-900/70"
                    />
                    <Button
                      type="button"
                      disabled={addingLink || !linkUrl.trim()}
                      onClick={async () => {
                        const ok = await handleAttachLink()
                        if (ok) {
                          setAttachmentModalOpen(false)
                        }
                      }}
                      className="h-10 w-full rounded-xl text-xs font-black tracking-widest uppercase"
                    >
                      {addingLink ? (
                        <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <Link2 className="mr-2 h-3.5 w-3.5" />
                      )}
                      {addingLink ? "Adding..." : "Attach Link"}
                    </Button>
                  </div>
                )}
              </div>
            </div>
          )}
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
