"use client"

import { format } from "date-fns"
import {
  Package,
  Calendar,
  User,
  Clock,
  Target,
  Layers,
  Zap,
  CheckCircle2,
  Circle,
  ArrowUpRight,
  X,
  BarChart3,
  FileText,
  Settings,
  Plus
} from "lucide-react"
import { useState, useEffect } from "react"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle
} from "@/components/ui/dialog"
import { EditWorkPackageDialog } from "@/components/work-packages/EditWorkPackageDialog"
import { apiClient } from "@/lib/api/client"
import { cn } from "@/lib/utils"

interface WorkPackage {
  _id: string
  title: string
  description?: string
  status: "TODO" | "IN_PROGRESS" | "COMPLETED" | "ON_HOLD"
  priority: "LOW" | "MEDIUM" | "HIGH" | "URGENT"
  dueDate?: Date | string
  progress?: number
  owner?: {
    name: string
    email: string
    avatar?: string
  }
  assignees?: Array<{
    name: string
    email: string
    avatar?: string
  }>
  createdAt: Date | string
  updatedAt: Date | string
}

interface Task {
  _id: string
  title: string
  description?: string
  status: "TODO" | "IN_PROGRESS" | "DONE"
  priority: "LOW" | "MEDIUM" | "HIGH" | "URGENT"
  dueDate?: Date | string
  assignee?: {
    name: string
    email: string
    avatar?: string
  }
}

interface ViewWorkPackageDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  workPackage: WorkPackage | null
  onPackageUpdated?: () => void
}

const STATUS_COLORS = {
  TODO: {
    bg: "bg-slate-100 dark:bg-slate-800",
    text: "text-slate-600 dark:text-slate-400",
    label: "To Do"
  },
  IN_PROGRESS: {
    bg: "bg-blue-100 dark:bg-blue-950",
    text: "text-blue-600 dark:text-blue-400",
    label: "In Progress"
  },
  COMPLETED: {
    bg: "bg-emerald-100 dark:bg-emerald-950",
    text: "text-emerald-600 dark:text-emerald-400",
    label: "Completed"
  },
  ON_HOLD: {
    bg: "bg-amber-100 dark:bg-amber-950",
    text: "text-amber-600 dark:text-amber-400",
    label: "On Hold"
  }
}

const PRIORITY_COLORS = {
  LOW: "bg-slate-100 text-slate-600",
  MEDIUM: "bg-blue-100 text-blue-600",
  HIGH: "bg-orange-100 text-orange-600",
  URGENT: "bg-rose-100 text-rose-600"
}

export function ViewWorkPackageDialog({
  open,
  onOpenChange,
  workPackage,
  onPackageUpdated
}: ViewWorkPackageDialogProps) {
  const [activeTab, setActiveTab] = useState<"overview" | "tasks" | "timeline">("overview")
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [tasks, setTasks] = useState<Task[]>([])
  const [loadingTasks, setLoadingTasks] = useState(false)

  // Fetch tasks when dialog opens and on tasks tab
  useEffect(() => {
    if (open && activeTab === "tasks" && workPackage) {
      fetchTasks()
    }
  }, [open, activeTab, workPackage])

  const fetchTasks = async () => {
    if (!workPackage) {
      return
    }

    setLoadingTasks(true)
    try {
      const response = await apiClient.get(`/api/workpackages/${workPackage._id}/tasks`)

      if (response.ok) {
        const data = await response.json()
        setTasks(Array.isArray(data) ? data : data.tasks || [])
      }
    } catch (error) {
      console.error("Failed to fetch tasks:", error)
    } finally {
      setLoadingTasks(false)
    }
  }

  const handlePackageUpdated = () => {
    if (onPackageUpdated) {
      onPackageUpdated()
    }
  }

  if (!workPackage) {
    return null
  }

  const statusInfo = STATUS_COLORS[workPackage.status] || STATUS_COLORS.TODO
  const priorityInfo = PRIORITY_COLORS[workPackage.priority] || PRIORITY_COLORS.MEDIUM

  const getStatusIcon = () => {
    switch (workPackage.status) {
      case "COMPLETED":
        return <CheckCircle2 className="h-5 w-5 text-emerald-500" />
      case "IN_PROGRESS":
        return <Zap className="h-5 w-5 animate-pulse text-blue-500" />
      case "ON_HOLD":
        return <Clock className="h-5 w-5 text-amber-500" />
      default:
        return <Circle className="h-5 w-5 text-slate-300" />
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="overflow-hidden rounded-[2.5rem] border-white/20 bg-white/95 p-0 shadow-2xl backdrop-blur-xl sm:max-w-[800px] dark:border-slate-800/50 dark:bg-slate-900/95">
        <div className="relative">
          {/* Premium Header Background */}
          <div className="absolute top-0 right-0 left-0 -z-10 h-40 bg-gradient-to-br from-blue-600/10 via-indigo-600/5 to-purple-600/10" />
          <div className="absolute top-20 right-20 -z-10 h-40 w-40 rounded-full bg-blue-500/10 blur-3xl" />

          {/* Header */}
          <div className="relative px-10 pt-10 pb-6">
            <div className="mb-6 flex items-start justify-between">
              <div className="flex items-center gap-4">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl border-4 border-white/80 bg-gradient-to-br from-blue-600 to-indigo-700 text-white shadow-xl dark:border-slate-900">
                  <Package className="h-7 w-7" />
                </div>
                <div className="space-y-1">
                  <div className="flex items-center gap-3">
                    <Badge
                      variant="secondary"
                      className={cn(
                        "h-5 rounded-full px-3 text-[9px] font-black tracking-tighter uppercase",
                        statusInfo.bg,
                        statusInfo.text
                      )}
                    >
                      {statusInfo.label}
                    </Badge>
                    <Badge
                      variant="outline"
                      className={cn(
                        "h-5 rounded-full px-3 text-[9px] font-black tracking-tighter uppercase",
                        priorityInfo
                      )}
                    >
                      {workPackage.priority}
                    </Badge>
                  </div>
                  <DialogTitle className="text-3xl font-black tracking-tight text-slate-900 dark:text-white">
                    {workPackage.title}
                  </DialogTitle>
                </div>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => {
                  onOpenChange(false)
                }}
                className="h-10 w-10 rounded-xl transition-colors hover:bg-white dark:hover:bg-slate-800"
              >
                <X className="h-5 w-5 text-slate-400" />
              </Button>
            </div>

            {/* Tab Navigation */}
            <div className="flex gap-2 rounded-2xl border border-slate-100 bg-slate-50/50 p-1.5 dark:border-slate-800 dark:bg-slate-950/50">
              {[
                { id: "overview" as const, label: "Overview", icon: Layers },
                { id: "tasks" as const, label: "Tasks", icon: Target },
                { id: "timeline" as const, label: "Timeline", icon: BarChart3 }
              ].map((tab) => (
                <Button
                  key={tab.id}
                  variant="ghost"
                  onClick={() => {
                    setActiveTab(tab.id)
                  }}
                  className={cn(
                    "h-11 gap-2 rounded-xl px-6 font-bold transition-all",
                    activeTab === tab.id
                      ? "bg-white text-blue-600 shadow-lg dark:bg-slate-900 dark:text-blue-400"
                      : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
                  )}
                >
                  <tab.icon className="h-4 w-4" />
                  {tab.label}
                </Button>
              ))}
            </div>
          </div>

          {/* Content Area */}
          <div className="px-10 pb-10">
            {activeTab === "overview" && (
              <div className="space-y-6">
                {/* Description */}
                {workPackage.description && (
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <FileText className="h-4 w-4 text-blue-600" />
                      <span className="text-[10px] font-black tracking-[0.2em] text-slate-400 uppercase">
                        Description
                      </span>
                    </div>
                    <Card className="rounded-2xl border-none bg-slate-50/50 shadow-sm dark:bg-slate-950/50">
                      <CardContent className="p-6">
                        <p className="leading-relaxed text-slate-700 dark:text-slate-300">
                          {workPackage.description}
                        </p>
                      </CardContent>
                    </Card>
                  </div>
                )}

                {/* Key Details Grid */}
                <div className="grid gap-4 md:grid-cols-2">
                  {/* Owner */}
                  <Card className="rounded-2xl border-none bg-white shadow-lg dark:bg-slate-900">
                    <CardContent className="p-6">
                      <div className="mb-3 flex items-center gap-2">
                        <User className="h-4 w-4 text-purple-500" />
                        <span className="text-[10px] font-black tracking-[0.2em] text-slate-400 uppercase">
                          Package Owner
                        </span>
                      </div>
                      <div className="flex items-center gap-3">
                        <Avatar className="h-10 w-10 rounded-xl border-4 border-white shadow-lg dark:border-slate-800">
                          <AvatarImage src={workPackage.owner?.avatar} />
                          <AvatarFallback className="bg-purple-600 text-xs font-black text-white">
                            {workPackage.owner?.name?.slice(0, 1).toUpperCase() || "U"}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex flex-col">
                          <span className="text-sm font-black text-slate-900 dark:text-white">
                            {workPackage.owner?.name || "Unassigned"}
                          </span>
                          <span className="text-xs font-medium text-slate-500">
                            {workPackage.owner?.email || "No email"}
                          </span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Due Date */}
                  <Card className="rounded-2xl border-none bg-white shadow-lg dark:bg-slate-900">
                    <CardContent className="p-6">
                      <div className="mb-3 flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-blue-500" />
                        <span className="text-[10px] font-black tracking-[0.2em] text-slate-400 uppercase">
                          Due Date
                        </span>
                      </div>
                      {workPackage.dueDate ? (
                        <div className="space-y-1">
                          <span className="text-lg font-black text-slate-900 dark:text-white">
                            {format(new Date(workPackage.dueDate), "MMM dd, yyyy")}
                          </span>
                          <span className="text-[10px] font-black tracking-widest text-slate-400 uppercase">
                            Target Completion
                          </span>
                        </div>
                      ) : (
                        <span className="text-sm font-medium text-slate-400 italic">
                          No due date set
                        </span>
                      )}
                    </CardContent>
                  </Card>

                  {/* Progress */}
                  <Card className="rounded-2xl border-none bg-white shadow-lg dark:bg-slate-900">
                    <CardContent className="p-6">
                      <div className="mb-3 flex items-center gap-2">
                        <BarChart3 className="h-4 w-4 text-emerald-500" />
                        <span className="text-[10px] font-black tracking-[0.2em] text-slate-400 uppercase">
                          Progress
                        </span>
                      </div>
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-2xl font-black text-slate-900 dark:text-white">
                            {workPackage.progress || 0}%
                          </span>
                          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-50 dark:bg-emerald-950">
                            {getStatusIcon()}
                          </div>
                        </div>
                        <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                          <div
                            className="h-full bg-gradient-to-r from-blue-600 to-indigo-600 transition-all"
                            style={{ width: `${workPackage.progress || 0}%` }}
                          />
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Assignees */}
                  <Card className="rounded-2xl border-none bg-white shadow-lg dark:bg-slate-900">
                    <CardContent className="p-6">
                      <div className="mb-3 flex items-center gap-2">
                        <Layers className="h-4 w-4 text-orange-500" />
                        <span className="text-[10px] font-black tracking-[0.2em] text-slate-400 uppercase">
                          Assignees
                        </span>
                      </div>
                      {workPackage.assignees && workPackage.assignees.length > 0 ? (
                        <div className="flex -space-x-2 overflow-hidden">
                          {workPackage.assignees.slice(0, 5).map((assignee, idx) => (
                            <Avatar
                              key={idx}
                              className="h-10 w-10 rounded-xl border-2 border-white shadow-lg dark:border-slate-900"
                            >
                              <AvatarImage src={assignee.avatar} />
                              <AvatarFallback className="bg-blue-600 text-[10px] font-black text-white">
                                {assignee.name?.slice(0, 1).toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                          ))}
                          {workPackage.assignees.length > 5 && (
                            <div className="flex h-10 w-10 items-center justify-center rounded-xl border-2 border-white bg-slate-100 text-xs font-black text-slate-600 shadow-lg dark:border-slate-900 dark:bg-slate-800 dark:text-slate-400">
                              +{workPackage.assignees.length - 5}
                            </div>
                          )}
                        </div>
                      ) : (
                        <span className="text-sm font-medium text-slate-400 italic">
                          No assignees
                        </span>
                      )}
                    </CardContent>
                  </Card>
                </div>

                {/* Footer Stats */}
                <div className="flex items-center justify-between rounded-2xl border border-slate-100 bg-slate-50/50 px-6 py-4 dark:border-slate-800 dark:bg-slate-950/50">
                  <div className="flex gap-8">
                    <div>
                      <span className="block text-[10px] font-black tracking-widest text-slate-400 uppercase">
                        Created
                      </span>
                      <span className="block text-sm font-black text-slate-900 dark:text-white">
                        {format(new Date(workPackage.createdAt), "MMM dd, yyyy")}
                      </span>
                    </div>
                    <div>
                      <span className="block text-[10px] font-black tracking-widest text-slate-400 uppercase">
                        Last Updated
                      </span>
                      <span className="block text-sm font-black text-slate-900 dark:text-white">
                        {format(new Date(workPackage.updatedAt), "MMM dd, yyyy")}
                      </span>
                    </div>
                  </div>
                  <Button
                    className="h-10 gap-2 rounded-xl bg-slate-900 px-6 font-bold text-white shadow-lg dark:bg-white dark:text-slate-900"
                    onClick={() => {
                      setEditDialogOpen(true)
                    }}
                  >
                    <Settings className="h-4 w-4" />
                    Edit Package
                  </Button>
                </div>
              </div>
            )}

            {activeTab === "tasks" && (
              <div className="space-y-4">
                {loadingTasks ? (
                  <div className="flex items-center justify-center py-12">
                    <div className="flex h-16 w-16 animate-pulse items-center justify-center rounded-2xl bg-blue-50 text-blue-600 dark:bg-blue-950 dark:text-blue-400">
                      <Target className="h-8 w-8" />
                    </div>
                  </div>
                ) : tasks.length === 0 ? (
                  <div className="flex flex-col items-center justify-center space-y-4 py-12">
                    <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-50 text-blue-600 dark:bg-blue-950 dark:text-blue-400">
                      <Target className="h-8 w-8" />
                    </div>
                    <div className="text-center">
                      <h3 className="text-xl font-black text-slate-900 dark:text-white">
                        No Tasks Yet
                      </h3>
                      <p className="mt-2 text-sm font-medium text-slate-500">
                        Tasks associated with this work package will appear here
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {tasks.map((task) => (
                      <Card
                        key={task._id}
                        className="rounded-2xl border-slate-100 bg-white shadow-sm transition-all hover:shadow-lg dark:border-slate-800 dark:bg-slate-900"
                      >
                        <CardContent className="flex items-center gap-4 p-4">
                          {/* Status Icon */}
                          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-slate-100 bg-slate-50 dark:border-slate-700 dark:bg-slate-950">
                            {task.status === "DONE" ? (
                              <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                            ) : task.status === "IN_PROGRESS" ? (
                              <Zap className="h-5 w-5 animate-pulse text-blue-500" />
                            ) : (
                              <Circle className="h-5 w-5 text-slate-300" />
                            )}
                          </div>

                          {/* Task Info */}
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <span className="text-base font-black text-slate-900 dark:text-white">
                                {task.title}
                              </span>
                              <Badge
                                variant="secondary"
                                className={cn(
                                  "h-5 rounded-full px-2 text-[9px] font-black tracking-tighter uppercase",
                                  task.priority === "HIGH"
                                    ? "bg-rose-50 text-rose-600"
                                    : task.priority === "MEDIUM"
                                      ? "bg-amber-50 text-amber-600"
                                      : "bg-slate-100 text-slate-500"
                                )}
                              >
                                {task.priority || "LOW"}
                              </Badge>
                            </div>
                            {task.description && (
                              <p className="mt-1 text-sm font-medium text-slate-500 dark:text-slate-400">
                                {task.description}
                              </p>
                            )}
                          </div>

                          {/* Assignee & Due Date */}
                          <div className="flex shrink-0 items-center gap-4">
                            {task.assignee ? (
                              <div className="flex items-center gap-2">
                                <Avatar className="h-8 w-8 rounded-lg border-2 border-white dark:border-slate-900">
                                  <AvatarImage src={task.assignee.avatar} />
                                  <AvatarFallback className="bg-blue-600 text-[10px] font-black text-white">
                                    {task.assignee.name?.slice(0, 1).toUpperCase()}
                                  </AvatarFallback>
                                </Avatar>
                              </div>
                            ) : task.dueDate ? (
                              <div className="flex items-center gap-1 text-sm font-black text-slate-600 dark:text-slate-400">
                                <Calendar className="h-3 w-3" />
                                {format(new Date(task.dueDate), "MMM dd")}
                              </div>
                            ) : null}
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </div>
            )}

            {activeTab === "timeline" && (
              <div className="flex flex-col items-center justify-center space-y-4 py-12">
                <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-purple-50 text-purple-600 dark:bg-purple-950 dark:text-purple-400">
                  <BarChart3 className="h-8 w-8" />
                </div>
                <div className="text-center">
                  <h3 className="text-xl font-black text-slate-900 dark:text-white">
                    Timeline View
                  </h3>
                  <p className="mt-2 text-sm font-medium text-slate-500">
                    Timeline visualization will appear here
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </DialogContent>

      {/* Edit Package Dialog */}
      <EditWorkPackageDialog
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
        workPackage={workPackage as any}
        onPackageUpdated={handlePackageUpdated}
      />
    </Dialog>
  )
}
