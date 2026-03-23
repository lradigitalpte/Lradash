"use client"

import {
  ArrowLeft,
  CheckCircle2,
  Clock,
  AlertCircle,
  ListTodo,
  Calendar,
  User,
  Loader2
} from "lucide-react"
import Link from "next/link"
import { useParams } from "next/navigation"
import { useState, useEffect } from "react"

import { UserAvatar } from "@/components/common"
import { TaskCompletionTimeline } from "@/components/tasks/TaskCompletionTimeline"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { apiClient } from "@/lib/api/client"
import { cn, isOverdue } from "@/lib/utils"

export default function TaskCompletionPage() {
  const params = useParams()
  const projectId = params?.projectId as string
  const taskId = params?.taskId as string
  const locale = params?.locale as string

  const [task, setTask] = useState<any>(null)
  const [isAdmin, setIsAdmin] = useState(false)
  const [loading, setLoading] = useState(true)
  const [taskStatus, setTaskStatus] = useState<string>("")
  const [timelineKey, setTimelineKey] = useState(0)

  useEffect(() => {
    fetchData()
  }, [taskId, projectId])

  const fetchData = async () => {
    setLoading(true)
    try {
      const [taskRes, adminRes] = await Promise.all([
        apiClient.get(`/api/tasks/${taskId}`),
        apiClient.get("/api/admin/me")
      ])

      if (taskRes.ok) {
        const t = await taskRes.json()
        setTask(t)
        setTaskStatus(t.status)
      }

      if (adminRes.ok) {
        const a = await adminRes.json()
        setIsAdmin(a.isAdmin === true)
      }
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const handleTaskApproved = () => {
    setTaskStatus("DONE")
    setTask((prev: any) => (prev ? { ...prev, status: "DONE" } : prev))
  }

  const statusConfig: Record<string, { label: string; cls: string; icon: React.ReactNode }> = {
    TODO: {
      label: "To Do",
      cls: "bg-slate-100 text-slate-600",
      icon: <ListTodo className="h-3 w-3" />
    },
    IN_PROGRESS: {
      label: "In Progress",
      cls: "bg-blue-50 text-blue-600",
      icon: <Clock className="h-3 w-3" />
    },
    DONE: {
      label: "Completed",
      cls: "bg-emerald-50 text-emerald-600",
      icon: <CheckCircle2 className="h-3 w-3" />
    }
  }

  const sc = statusConfig[taskStatus] ?? statusConfig["TODO"]

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center py-20">
        <Loader2 className="h-6 w-6 animate-spin text-slate-400" />
      </div>
    )
  }

  if (!task) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-4 py-20 text-center">
        <AlertCircle className="h-10 w-10 text-rose-400" />
        <p className="text-lg font-black text-slate-700">Task not found</p>
        <Link href={`/${locale}/projects/${projectId}/tasks`}>
          <Button variant="outline" className="rounded-xl">
            Back to Tasks
          </Button>
        </Link>
      </div>
    )
  }

  const overdue = task.dueDate && isOverdue(task.dueDate) && taskStatus !== "DONE"

  return (
    <div className="mx-auto max-w-5xl px-6 py-10">
      {/* Back nav */}
      <Link
        href={`/${locale}/projects/${projectId}/tasks`}
        className="mb-6 inline-flex items-center gap-2 text-[11px] font-black tracking-widest text-slate-400 uppercase transition-colors hover:text-slate-700"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        Back to Tasks
      </Link>

      {/* Task hero card */}
      <div
        className="mb-8 overflow-hidden rounded-3xl border border-slate-100 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900"
        style={task.coverColor ? { borderTop: `4px solid ${task.coverColor}` } : {}}
      >
        <div className="p-8">
          <div className="mb-4 flex flex-wrap items-center gap-3">
            <Badge
              className={cn(
                "gap-1 rounded-full px-2.5 py-1 text-[10px] font-black uppercase",
                sc.cls
              )}
            >
              {sc.icon}
              {sc.label}
            </Badge>
            {task.priority && (
              <Badge
                variant="secondary"
                className={cn(
                  "rounded-full px-2.5 py-1 text-[10px] font-black uppercase",
                  task.priority === "HIGH" || task.priority === "URGENT"
                    ? "bg-rose-50 text-rose-600"
                    : task.priority === "MEDIUM"
                      ? "bg-amber-50 text-amber-600"
                      : "bg-slate-100 text-slate-500"
                )}
              >
                {task.priority}
              </Badge>
            )}
            {overdue && (
              <Badge className="gap-1 rounded-full bg-rose-100 px-2.5 py-1 text-[10px] font-black text-rose-700 uppercase">
                <AlertCircle className="h-3 w-3" />
                Overdue
              </Badge>
            )}
          </div>

          <h1 className="mb-2 text-2xl font-black tracking-tight text-slate-900 dark:text-white">
            {task.title}
          </h1>

          {task.description && (
            <p className="mb-4 text-sm leading-relaxed font-medium text-slate-500 dark:text-slate-400">
              {task.description}
            </p>
          )}

          <div className="flex flex-wrap items-center gap-4 border-t border-slate-50 pt-4 dark:border-slate-800">
            {task.assignee && (
              <div className="flex items-center gap-2">
                <User className="h-3.5 w-3.5 text-slate-400" />
                <UserAvatar name={task.assignee.name} image={task.assignee.avatar} size="xs" />
                <span className="text-[11px] font-bold text-slate-600 dark:text-slate-400">
                  {task.assignee.name}
                </span>
              </div>
            )}
            {task.dueDate && (
              <div
                className={cn(
                  "flex items-center gap-1.5",
                  overdue ? "text-rose-500" : "text-slate-400"
                )}
              >
                <Calendar className="h-3.5 w-3.5" />
                <span className="text-[11px] font-bold">
                  {new Date(task.dueDate).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                    year: "numeric"
                  })}
                </span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Approved banner */}
      {taskStatus === "DONE" && (
        <div className="mb-8 flex items-center gap-3 rounded-2xl border border-emerald-100 bg-emerald-50 px-5 py-4 dark:border-emerald-900/30 dark:bg-emerald-900/10">
          <CheckCircle2 className="h-5 w-5 flex-shrink-0 text-emerald-600" />
          <div>
            <p className="text-sm font-black text-emerald-700">This task has been completed</p>
            <p className="text-[11px] text-emerald-600/70">
              An admin approved a completion submission and marked it as done.
            </p>
          </div>
        </div>
      )}

      {/* Timeline section — handles both submit form and history */}
      <div>
        <h2 className="mb-4 text-[11px] font-black tracking-widest text-slate-400 uppercase">
          Completion Timeline
        </h2>
        <TaskCompletionTimeline
          key={timelineKey}
          taskId={taskId}
          projectId={projectId}
          isAdmin={isAdmin}
          compactMode={taskStatus === "DONE"}
          onTaskApproved={handleTaskApproved}
        />
      </div>
    </div>
  )
}
