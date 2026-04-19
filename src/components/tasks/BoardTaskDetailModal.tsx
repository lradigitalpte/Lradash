"use client"

import { Calendar as CalendarIcon, Loader2, Paperclip, Plus, Trash2, Link2 } from "lucide-react"
import { useRef, useState, useEffect } from "react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Dialog, DialogContent } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
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
import { cn } from "@/lib/utils"

interface BoardTaskDetailModalProps {
  task: any
  boardId: string
  open: boolean
  onOpenChange: (open: boolean) => void
  onTaskUpdated: (task: any) => void
}

export function BoardTaskDetailModal({
  task,
  boardId,
  open,
  onOpenChange,
  onTaskUpdated
}: BoardTaskDetailModalProps) {
  const [title, setTitle] = useState(task?.title ?? "")
  const [description, setDescription] = useState(task?.description ?? "")
  const [status, setStatus] = useState(task?.status ?? "TODO")
  const [priority, setPriority] = useState(task?.priority ?? "MEDIUM")
  const [dueDate, setDueDate] = useState<string>(task?.dueDate ? task.dueDate.slice(0, 10) : "")
  const [attaching, setAttaching] = useState(false)
  const [attachmentModalOpen, setAttachmentModalOpen] = useState(false)
  const [attachmentMode, setAttachmentMode] = useState<"file" | "link">("file")
  const [linkUrl, setLinkUrl] = useState("")
  const [linkName, setLinkName] = useState("")
  const [addingLink, setAddingLink] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (task) {
      setTitle(task.title ?? "")
      setDescription(task.description ?? "")
      setStatus(task.status ?? "TODO")
      setPriority(task.priority ?? "MEDIUM")
      setDueDate(task.dueDate ? task.dueDate.slice(0, 10) : "")
    }
  }, [task])

  if (!task) {
    return null
  }

  const taskId = task._id?.toString?.() ?? task._id

  const patchTask = async (updates: Record<string, unknown>) => {
    const res = await apiClient.patch(`/api/boards/${boardId}/tasks/${taskId}`, updates)
    if (!res.ok) {
      throw new Error("Update failed")
    }
    const updated = await res.json()
    onTaskUpdated(updated)
    return updated
  }

  const handleBlurTitle = () => {
    if (title.trim() && title !== task.title) {
      patchTask({ title: title.trim() }).then(() => toast.success("Title updated"))
    }
  }

  const handleBlurDescription = () => {
    if (description !== (task.description ?? "")) {
      patchTask({ description: description ?? "" }).then(() => toast.success("Description updated"))
    }
  }

  const handleStatusChange = (v: string) => {
    setStatus(v)
    patchTask({ status: v }).then(() => toast.success("Status updated"))
  }

  const handlePriorityChange = (v: string) => {
    setPriority(v)
    patchTask({ priority: v }).then(() => toast.success("Priority updated"))
  }

  const handleDueDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = e.target.value
    setDueDate(v)
    patchTask({ dueDate: v || null }).then(() => toast.success("Due date updated"))
  }

  const handleAttachFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !boardId || !taskId) {
      return
    }
    e.target.value = ""
    setAttaching(true)
    try {
      const { publicUrl } = await uploadFileToS3(file, { boardId, taskId })
      const attachments = [
        ...(task.attachments || []),
        { name: file.name, url: publicUrl, size: file.size }
      ]
      const updated = await patchTask({ attachments })
      onTaskUpdated(updated)
      toast.success("File attached")
    } catch {
      toast.error("Failed to attach file")
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
      const displayName = linkName.trim() || new URL(normalizedUrl).hostname
      const attachments = [
        ...(task.attachments || []),
        { name: displayName, url: normalizedUrl, type: "link", size: 0 }
      ]
      const updated = await patchTask({ attachments })
      onTaskUpdated(updated)
      setLinkUrl("")
      setLinkName("")
      toast.success("Link attached")
      return true
    } catch {
      toast.error("Failed to attach link")
      return false
    } finally {
      setAddingLink(false)
    }
  }

  const handleRemoveAttachment = async (index: number) => {
    const attachments = (task.attachments || []).filter((_: any, i: number) => i !== index)
    try {
      const updated = await patchTask({ attachments })
      onTaskUpdated(updated)
      toast.success("Attachment removed")
    } catch {
      toast.error("Failed to remove")
    }
  }

  const attachments = task.attachments || []

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="relative flex max-h-[90vh] flex-col overflow-hidden rounded-[2rem] border-none p-0 shadow-2xl sm:max-w-[520px]">
        <div className="shrink-0 bg-gradient-to-br from-slate-900 to-slate-800 px-6 py-5 text-white dark:from-slate-800 dark:to-slate-900">
          <h2 className="text-xl font-black tracking-tight">Task details</h2>
          <p className="text-sm text-slate-300">Edit title, status, priority and attachments.</p>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto bg-white p-6 dark:bg-slate-950">
          <div className="space-y-6">
            <div className="space-y-3">
              <Label className="text-[10px] font-black tracking-widest text-slate-400 uppercase">
                Title
              </Label>
              <Input
                value={title}
                onChange={(e) => {
                  setTitle(e.target.value)
                }}
                onBlur={handleBlurTitle}
                placeholder="Task title"
                className="h-11 rounded-xl border-slate-200 bg-slate-50 text-base font-semibold dark:border-slate-800 dark:bg-slate-900"
              />
              <Label className="text-[10px] font-black tracking-widest text-slate-400 uppercase">
                Description
              </Label>
              <Textarea
                value={description}
                onChange={(e) => {
                  setDescription(e.target.value)
                }}
                onBlur={handleBlurDescription}
                placeholder="Optional description"
                className="min-h-[80px] resize-none rounded-xl border-slate-200 bg-slate-50 dark:border-slate-800 dark:bg-slate-900"
              />
            </div>

            <div className="flex flex-wrap gap-4">
              <div className="space-y-1">
                <Label className="text-[10px] font-black tracking-widest text-slate-400 uppercase">
                  Status
                </Label>
                <Select value={status} onValueChange={handleStatusChange}>
                  <SelectTrigger
                    className={cn(
                      "h-11 w-[140px] rounded-xl border-slate-200 bg-slate-50 dark:border-slate-800 dark:bg-slate-900"
                    )}
                  >
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl">
                    <SelectItem value="TODO">To Do</SelectItem>
                    <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
                    <SelectItem value="DONE">Done</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label className="text-[10px] font-black tracking-widest text-slate-400 uppercase">
                  Priority
                </Label>
                <Select value={priority} onValueChange={handlePriorityChange}>
                  <SelectTrigger
                    className={cn(
                      "h-11 w-[120px] rounded-xl border-slate-200 bg-slate-50 dark:border-slate-800 dark:bg-slate-900"
                    )}
                  >
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl">
                    <SelectItem value="LOW">Low</SelectItem>
                    <SelectItem value="MEDIUM">Medium</SelectItem>
                    <SelectItem value="HIGH">High</SelectItem>
                    <SelectItem value="URGENT">Urgent</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label className="flex items-center gap-1 text-[10px] font-black tracking-widest text-slate-400 uppercase">
                  <CalendarIcon className="h-3.5 w-3.5" /> Due date
                </Label>
                <input
                  type="date"
                  value={dueDate}
                  onChange={handleDueDateChange}
                  className="h-11 w-full min-w-[140px] rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm dark:border-slate-800 dark:bg-slate-900"
                />
              </div>
            </div>

            <div className="border-t border-slate-100 pt-4 dark:border-slate-800">
              <div className="mb-3 flex items-center justify-between">
                <span className="flex items-center gap-2 text-[10px] font-black tracking-widest text-slate-400 uppercase">
                  <Paperclip className="h-4 w-4" />
                  Attachments
                </span>
                <input
                  type="file"
                  ref={fileInputRef}
                  className="hidden"
                  onChange={handleAttachFile}
                  accept="image/*,.pdf,.doc,.docx,.txt,.md,.csv,.xls,.xlsx,.zip,application/zip,application/x-zip-compressed"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={attaching || addingLink}
                  onClick={() => {
                    setAttachmentMode("file")
                    setAttachmentModalOpen(true)
                  }}
                  className="rounded-xl border-slate-200 font-bold dark:border-slate-700"
                >
                  {attaching ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Plus className="h-4 w-4" />
                  )}
                  {attaching ? "Uploading…" : "Attach"}
                </Button>
              </div>
              {attachments.length === 0 ? (
                <p className="text-sm font-medium text-slate-500">No attachments</p>
              ) : (
                <ul className="space-y-2">
                  {attachments.map((att: any, idx: number) => (
                    <li
                      key={idx}
                      className="flex items-center justify-between gap-2 rounded-xl border border-slate-100 bg-slate-50 px-4 py-2.5 dark:border-slate-800 dark:bg-slate-900/50"
                    >
                      <a
                        href={att.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="truncate text-sm font-semibold text-slate-900 hover:text-blue-600 hover:underline dark:text-slate-100"
                      >
                        {att.name}
                      </a>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 shrink-0 rounded-lg text-slate-400 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950/30"
                        onClick={async () => handleRemoveAttachment(idx)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>

        {attachmentModalOpen && (
          <div className="absolute inset-0 z-30 flex items-center justify-center bg-black/35 p-4 backdrop-blur-[1px]">
            <div className="w-full max-w-md rounded-3xl border border-white/20 bg-white/95 p-5 shadow-2xl dark:border-slate-700 dark:bg-slate-900/95">
              <div className="mb-4 flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-black tracking-wider text-slate-900 uppercase dark:text-white">
                    Attach To Task
                  </h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Choose file upload or link
                  </p>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="rounded-lg px-2"
                  onClick={() => {
                    setAttachmentModalOpen(false)
                  }}
                >
                  Close
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
              ) : (
                <div className="space-y-3">
                  <Input
                    value={linkUrl}
                    onChange={(e) => {
                      setLinkUrl(e.target.value)
                    }}
                    placeholder="Paste URL"
                    className="h-10 rounded-xl border-slate-200 bg-slate-50 dark:border-slate-800 dark:bg-slate-900"
                  />
                  <Input
                    value={linkName}
                    onChange={(e) => {
                      setLinkName(e.target.value)
                    }}
                    placeholder="Title (optional)"
                    className="h-10 rounded-xl border-slate-200 bg-slate-50 dark:border-slate-800 dark:bg-slate-900"
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
      </DialogContent>
    </Dialog>
  )
}
