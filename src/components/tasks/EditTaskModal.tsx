"use client"

import { X, Save } from "lucide-react"
import { useState, useEffect } from "react"
import { toast } from "sonner"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
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

interface Task {
  _id: string
  title: string
  description?: string
  status: "TODO" | "IN_PROGRESS" | "DONE" | "ARCHIVED"
  priority: "LOW" | "MEDIUM" | "HIGH" | "URGENT"
  assignee?: { id: string; name: string }
  dueDate?: string
  project?: string
}

interface EditTaskModalProps {
  task?: Task
  open: boolean
  onOpenChange: (open: boolean) => void
  onTaskUpdated?: (task: Task) => void
}

export function EditTaskModal({ task, open, onOpenChange, onTaskUpdated }: EditTaskModalProps) {
  const [editedTitle, setEditedTitle] = useState(task?.title || "")
  const [editedDescription, setEditedDescription] = useState(task?.description || "")
  const [status, setStatus] = useState(task?.status || "TODO")
  const [priority, setPriority] = useState(task?.priority || "MEDIUM")
  const [dueDate, setDueDate] = useState(
    task?.dueDate ? new Date(task.dueDate).toISOString().split("T")[0] : ""
  )
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  useEffect(() => {
    if (task) {
      setEditedTitle(task.title)
      setEditedDescription(task.description || "")
      setStatus(task.status)
      setPriority(task.priority || "MEDIUM")
      setDueDate(task.dueDate ? new Date(task.dueDate).toISOString().split("T")[0] : "")
    }
  }, [task])

  const handleSubmit = async () => {
    if (!task) {
      return
    }

    if (!editedTitle.trim()) {
      setError("Title is required")
      return
    }

    setLoading(true)
    setError("")

    try {
      const response = await apiClient.patch(`/api/tasks/${task._id}`, {
        title: editedTitle.trim(),
        description: editedDescription.trim() || undefined,
        status,
        priority,
        dueDate: dueDate ? new Date(dueDate) : undefined
      })

      if (response.ok) {
        const updatedTask = await response.json()
        toast.success("Task updated successfully")
        onTaskUpdated?.(updatedTask)
        onOpenChange(false)
      } else {
        const errorData = await response.json()
        setError(errorData.error || "Failed to update task")
      }
    } catch (error) {
      console.error("Error updating task:", error)
      setError("Failed to update task")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl rounded-[2.5rem] border-white/20 bg-white/80 p-0 pt-0 shadow-2xl shadow-slate-200/50 backdrop-blur-2xl dark:border-slate-800/50 dark:bg-slate-900/80">
        <div className="flex h-full flex-col overflow-hidden">
          {/* Header */}
          <div className="relative px-10 pt-12 pb-6">
            <div className="flex items-center justify-between">
              <div>
                <DialogTitle className="text-2xl font-black tracking-tight text-slate-900 uppercase dark:text-white">
                  Edit Task
                </DialogTitle>
                <p className="mt-1 text-sm font-medium text-slate-500">
                  Modify task details and properties
                </p>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => {
                  onOpenChange(false)
                }}
                className="h-10 w-10 rounded-xl text-slate-400 hover:bg-white/50 hover:text-slate-600 dark:hover:bg-slate-800"
              >
                <X className="h-5 w-5" />
              </Button>
            </div>
          </div>

          {/* Form Content */}
          <div className="flex-1 overflow-y-auto px-10 pb-12">
            <div className="space-y-8">
              {/* Task Title */}
              <div className="space-y-2">
                <label className="text-[10px] font-black tracking-[0.2em] text-slate-400 uppercase">
                  Task Title
                </label>
                <Input
                  value={editedTitle}
                  onChange={(e) => {
                    setEditedTitle(e.target.value)
                  }}
                  placeholder="Enter task title..."
                  className="h-12 rounded-2xl border-slate-200 bg-slate-50 px-6 text-sm font-medium transition-all focus-visible:ring-blue-500/20 dark:border-slate-800 dark:bg-slate-800"
                />
                {error && <p className="text-sm text-red-500">{error}</p>}
              </div>

              {/* Task Description */}
              <div className="space-y-2">
                <label className="text-[10px] font-black tracking-[0.2em] text-slate-400 uppercase">
                  Description
                </label>
                <Textarea
                  value={editedDescription}
                  onChange={(e) => {
                    setEditedDescription(e.target.value)
                  }}
                  placeholder="Add task description..."
                  className="min-h-[120px] rounded-2xl border-slate-200 bg-slate-50 px-6 text-sm font-medium transition-all focus-visible:ring-blue-500/20 dark:border-slate-800 dark:bg-slate-800"
                />
              </div>

              {/* Status and Priority Row */}
              <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                {/* Status */}
                <div className="space-y-2">
                  <label className="text-[10px] font-black tracking-[0.2em] text-slate-400 uppercase">
                    Status
                  </label>
                  <Select
                    value={status}
                    onValueChange={(value) => {
                      setStatus(value as typeof status)
                    }}
                  >
                    <SelectTrigger className="h-12 rounded-2xl border-slate-200 bg-slate-50 text-sm font-medium dark:border-slate-800 dark:bg-slate-800">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="TODO">
                        <div className="flex items-center gap-2">
                          <div className="h-2 w-2 rounded-full bg-slate-300" />
                          <span>To Do</span>
                        </div>
                      </SelectItem>
                      <SelectItem value="IN_PROGRESS">
                        <div className="flex items-center gap-2">
                          <div className="h-2 w-2 animate-pulse rounded-full bg-orange-500" />
                          <span>In Progress</span>
                        </div>
                      </SelectItem>
                      <SelectItem value="DONE">
                        <div className="flex items-center gap-2">
                          <div className="h-2 w-2 rounded-full bg-emerald-500" />
                          <span>Completed</span>
                        </div>
                      </SelectItem>
                      <SelectItem value="ARCHIVED">
                        <div className="flex items-center gap-2">
                          <div className="h-2 w-2 rounded-full bg-slate-400" />
                          <span>Archived</span>
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Priority */}
                <div className="space-y-2">
                  <label className="text-[10px] font-black tracking-[0.2em] text-slate-400 uppercase">
                    Priority
                  </label>
                  <Select
                    value={priority}
                    onValueChange={(value) => {
                      setPriority(value as typeof priority)
                    }}
                  >
                    <SelectTrigger className="h-12 rounded-2xl border-slate-200 bg-slate-50 text-sm font-medium dark:border-slate-800 dark:bg-slate-800">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="LOW">
                        <Badge className="h-5 rounded-full bg-slate-100 px-2 text-[9px] font-black tracking-tighter text-slate-500 uppercase">
                          Low
                        </Badge>
                      </SelectItem>
                      <SelectItem value="MEDIUM">
                        <Badge className="h-5 rounded-full bg-amber-50 px-2 text-[9px] font-black tracking-tighter text-amber-600 uppercase">
                          Medium
                        </Badge>
                      </SelectItem>
                      <SelectItem value="HIGH">
                        <Badge className="h-5 rounded-full bg-rose-50 px-2 text-[9px] font-black tracking-tighter text-rose-600 uppercase">
                          High
                        </Badge>
                      </SelectItem>
                      <SelectItem value="URGENT">
                        <Badge className="h-5 rounded-full bg-red-50 px-2 text-[9px] font-black tracking-tighter text-red-600 uppercase">
                          Urgent
                        </Badge>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Due Date */}
              <div className="space-y-2">
                <label className="text-[10px] font-black tracking-[0.2em] text-slate-400 uppercase">
                  Due Date
                </label>
                <Input
                  type="date"
                  value={dueDate}
                  onChange={(e) => {
                    setDueDate(e.target.value)
                  }}
                  className="h-12 rounded-2xl border-slate-200 bg-slate-50 px-6 text-sm font-medium transition-all focus-visible:ring-blue-500/20 dark:border-slate-800 dark:bg-slate-800"
                />
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="border-t border-slate-100 bg-white/50 dark:border-slate-800 dark:bg-slate-900/50">
            <div className="flex items-center justify-between px-10 py-6">
              <div className="text-sm font-medium text-slate-500 dark:text-slate-400">
                Changes will be saved automatically
              </div>
              <div className="flex gap-3">
                <Button
                  variant="outline"
                  onClick={() => {
                    onOpenChange(false)
                  }}
                  className="h-10 rounded-xl border-slate-200 px-6 text-[10px] font-bold tracking-widest uppercase hover:bg-slate-50 dark:border-slate-800 dark:hover:bg-slate-800"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleSubmit}
                  disabled={loading}
                  className="h-10 rounded-xl bg-slate-900 px-6 font-bold text-white shadow-lg hover:bg-blue-600 dark:bg-white dark:text-slate-900 dark:hover:bg-blue-600"
                >
                  <Save className="mr-2 h-4 w-4" />
                  {loading ? "Saving..." : "Save Changes"}
                </Button>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
