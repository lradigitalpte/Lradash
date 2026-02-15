"use client"

import { X, ArrowRight, Plus, Loader2 } from "lucide-react"
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
import { apiClient } from "@/lib/api/client"

interface Project {
  _id: string
  title: string
  boardId?: string
}

interface ConvertToBoardTaskModalProps {
  task?: {
    _id: string
    title: string
    description?: string
  }
  open: boolean
  onOpenChange: (open: boolean) => void
  onTaskConverted?: (task: any) => void
}

export function ConvertToBoardTaskModal({
  task,
  open,
  onOpenChange,
  onTaskConverted
}: ConvertToBoardTaskModalProps) {
  const [projects, setProjects] = useState<Project[]>([])
  const [selectedProjectId, setSelectedProjectId] = useState<string>("")
  const [loading, setLoading] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)

  useEffect(() => {
    if (open) {
      fetchProjects()
    }
  }, [open])

  const fetchProjects = async () => {
    try {
      setLoading(true)
      const response = await apiClient.get("/api/projects")
      if (response.ok) {
        const data = await response.json()
        setProjects(Array.isArray(data) ? data : data.projects || [])
      }
    } catch (error) {
      console.error("Failed to fetch projects:", error)
      toast.error("Failed to fetch projects")
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async () => {
    if (!task || !selectedProjectId) {
      return
    }

    setIsProcessing(true)
    try {
      const response = await apiClient.patch(`/api/tasks/${task._id}/convert-to-board-task`, {
        projectId: selectedProjectId
      })

      if (response.ok) {
        const convertedTask = await response.json()
        toast.success("Task converted to board task successfully")
        onTaskConverted?.(convertedTask)
        onOpenChange(false)
      } else {
        const errorData = await response.json()
        toast.error(errorData.error || "Failed to convert task")
      }
    } catch (error) {
      console.error("Error converting task:", error)
      toast.error("Failed to convert task")
    } finally {
      setIsProcessing(false)
    }
  }

  const selectedProject = projects.find((p) => p._id === selectedProjectId)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl rounded-[2.5rem] border-white/20 bg-white/80 p-0 pt-0 shadow-2xl shadow-slate-200/50 backdrop-blur-2xl dark:border-slate-800/50 dark:bg-slate-900/80">
        <div className="flex h-full flex-col overflow-hidden">
          {/* Header */}
          <div className="relative px-10 pt-12 pb-6">
            <div className="flex items-center justify-between">
              <div>
                <DialogTitle className="text-2xl font-black tracking-tight text-slate-900 uppercase dark:text-white">
                  Convert to Board Task
                </DialogTitle>
                <p className="mt-1 text-sm font-medium text-slate-500">
                  Transform this task into a board task and add it to a project
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

          {/* Content */}
          <div className="flex-1 overflow-y-auto px-10 pb-12">
            <div className="space-y-8">
              {/* Task Info */}
              <div className="space-y-3">
                <h3 className="text-[10px] font-black tracking-[0.2em] text-slate-400 uppercase">
                  Current Task Details
                </h3>
                <div className="rounded-[2rem] border border-slate-100 bg-slate-50 p-6 shadow-sm dark:border-slate-800/50 dark:bg-slate-800/50">
                  <h4 className="text-lg font-black tracking-tight text-slate-900 uppercase dark:text-white">
                    {task?.title}
                  </h4>
                  {task?.description && (
                    <p className="mt-2 text-sm font-medium text-slate-500 dark:text-slate-400">
                      {task.description}
                    </p>
                  )}
                </div>
              </div>

              {/* Project Selection */}
              <div className="space-y-3">
                <h3 className="text-[10px] font-black tracking-[0.2em] text-slate-400 uppercase">
                  Select Project
                </h3>
                <Select value={selectedProjectId} onValueChange={setSelectedProjectId}>
                  <SelectTrigger className="h-12 rounded-2xl border-slate-200 bg-slate-50 text-sm font-medium dark:border-slate-800 dark:bg-slate-800">
                    <SelectValue placeholder="Choose a project..." />
                  </SelectTrigger>
                  <SelectContent>
                    {loading ? (
                      <div className="flex items-center justify-center py-4 text-slate-400">
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        <span>Loading projects...</span>
                      </div>
                    ) : projects.length === 0 ? (
                      <SelectItem value="" disabled>
                        <div className="flex items-center gap-2">
                          <Plus className="h-4 w-4" />
                          <span>No projects available</span>
                        </div>
                      </SelectItem>
                    ) : (
                      projects.map((project) => (
                        <SelectItem key={project._id} value={project._id}>
                          <div className="flex items-center gap-3">
                            <div className="flex h-8 w-8 items-center justify-center rounded-2xl bg-slate-100 shadow-sm dark:bg-slate-800">
                              <Plus className="h-4 w-4" />
                            </div>
                            <div className="flex-1 text-left">
                              <span className="text-sm font-black text-slate-900 dark:text-white">
                                {project.title}
                              </span>
                              <p className="text-[9px] font-bold tracking-widest text-slate-400 uppercase">
                                {project.boardId ? "Board available" : "No board"}
                              </p>
                            </div>
                            {project.boardId && (
                              <Badge className="h-5 rounded-full bg-green-50 px-2 text-[8px] font-black tracking-tighter text-green-600 uppercase">
                                Active
                              </Badge>
                            )}
                          </div>
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              </div>

              {/* Selected Project Preview */}
              {selectedProject && (
                <div className="space-y-3">
                  <h3 className="text-[10px] font-black tracking-[0.2em] text-slate-400 uppercase">
                    Preview
                  </h3>
                  <div className="rounded-[2rem] border border-blue-200 bg-blue-50/30 p-6 shadow-sm dark:border-blue-800/30 dark:bg-blue-900/10">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-blue-600 text-white shadow-lg shadow-blue-500/20">
                        <ArrowRight className="h-5 w-5" />
                      </div>
                      <div>
                        <h4 className="text-lg font-black tracking-tight text-blue-900 dark:text-blue-100">
                          Board Task Added To
                        </h4>
                        <p className="text-sm font-medium text-blue-700 dark:text-blue-300">
                          {selectedProject.title}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Benefits */}
              <div className="space-y-3">
                <h3 className="text-[10px] font-black tracking-[0.2em] text-slate-400 uppercase">
                  Benefits of Conversion
                </h3>
                <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
                  <div className="flex items-start gap-3 rounded-2xl border border-slate-100 bg-slate-50 p-4 dark:border-slate-800/50 dark:bg-slate-800/50">
                    <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-blue-100 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400">
                      <Plus className="h-4 w-4" />
                    </div>
                    <div>
                      <h4 className="text-sm font-black text-slate-900 dark:text-white">
                        Enhanced Tracking
                      </h4>
                      <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
                        Kanban view
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3 rounded-2xl border border-slate-100 bg-slate-50 p-4 dark:border-slate-800/50 dark:bg-slate-800/50">
                    <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-green-100 text-green-600 dark:bg-green-900/20 dark:text-green-400">
                      <div className="h-2 w-2 rounded-full bg-current" />
                    </div>
                    <div>
                      <h4 className="text-sm font-black text-slate-900 dark:text-white">
                        Better Organization
                      </h4>
                      <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
                        Grouped by project
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3 rounded-2xl border border-slate-100 bg-slate-50 p-4 dark:border-slate-800/50 dark:bg-slate-800/50">
                    <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-purple-100 text-purple-600 dark:bg-purple-900/20 dark:text-purple-400">
                      <div className="h-2 w-2 rounded-full bg-current" />
                    </div>
                    <div>
                      <h4 className="text-sm font-black text-slate-900 dark:text-white">
                        Team Collaboration
                      </h4>
                      <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
                        Shared workspace
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="border-t border-slate-100 bg-white/50 dark:border-slate-800 dark:bg-slate-900/50">
            <div className="flex items-center justify-between px-10 py-6">
              <div className="text-sm font-medium text-slate-500 dark:text-slate-400">
                The task will be moved to the selected project's board
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
                  disabled={!selectedProjectId || isProcessing}
                  className="h-10 rounded-xl bg-slate-900 px-6 font-bold text-white shadow-lg hover:bg-blue-600 dark:bg-white dark:text-slate-900 dark:hover:bg-blue-600"
                >
                  {isProcessing ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Converting...
                    </>
                  ) : (
                    <>
                      <ArrowRight className="mr-2 h-4 w-4" />
                      Convert to Board Task
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
