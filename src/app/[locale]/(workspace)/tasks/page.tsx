"use client"

import { ColumnDef } from "@tanstack/react-table"
import {
  ArrowUpDown,
  Calendar,
  CheckCircle,
  Clock,
  FileText,
  Filter,
  ListTodo,
  Zap,
  Target,
  User,
  CheckSquare,
  Plus
} from "lucide-react"
import { useMemo, useState, useEffect, useCallback } from "react"
import { toast } from "sonner"

import { StatusBadge, StatCard } from "@/components/common"
import { DataTable } from "@/components/common/DataTable"
import { CreateTaskModal } from "@/components/tasks/CreateTaskModal"
import { TaskDetailModal } from "@/components/tasks/TaskDetailModal"
import { Button } from "@/components/ui/button"
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { apiClient } from "@/lib/api/client"
import { cn, formatDate, isOverdue } from "@/lib/utils"
import { Task } from "@/types/dbInterface"

interface TaskWithProject extends Task {
  projectTitle?: string
  projectId?: string
}

export default function TasksPage() {
  const [tasks, setTasks] = useState<TaskWithProject[]>([])
  const [loading, setLoading] = useState(true)
  const [priorityFilter, setPriorityFilter] = useState<string | null>(null)
  const [statusFilter, setStatusFilter] = useState<string | null>(null)
  const [assigneeFilter, setAssigneeFilter] = useState<string | null>(null)
  const [selectedTask, setSelectedTask] = useState<TaskWithProject | null>(null)
  const [modalOpen, setModalOpen] = useState(false)

  // Fetch tasks from backend. Use `silent` after saves so the full-page loader does not flash.
  const fetchTasks = useCallback(async (options?: { silent?: boolean }) => {
    const silent = options?.silent === true
    try {
      if (!silent) {
        setLoading(true)
      }
      const response = await apiClient.get("/api/tasks")
      if (response.ok) {
        const data = await response.json()

        // Fetch project details for tasks that have projectId
        const tasksWithProjects = await Promise.all(
          data.map(async (task: Task) => {
            if (task.project) {
              try {
                const projectResponse = await apiClient.get(`/api/projects/${task.project}`)
                if (projectResponse.ok) {
                  const project = await projectResponse.json()
                  return {
                    ...task,
                    projectTitle: project.title,
                    projectId: project._id
                  }
                }
              } catch (error) {
                console.error("Failed to fetch project:", error)
              }
            }
            return {
              ...task,
              projectTitle: "Personal task",
              projectId: undefined
            }
          })
        )

        setTasks(tasksWithProjects)
      } else {
        toast.error("Failed to fetch tasks")
      }
    } catch (error) {
      console.error("Error fetching tasks:", error)
      toast.error("Failed to fetch tasks")
    } finally {
      if (!silent) {
        setLoading(false)
      }
    }
  }, [])

  useEffect(() => {
    void fetchTasks()
  }, [fetchTasks])

  // Filter tasks
  const filteredTasks = useMemo(() => {
    return tasks.filter((task) => {
      if (statusFilter && task.status !== statusFilter) {
        return false
      }
      if (priorityFilter && task.priority !== priorityFilter) {
        return false
      }
      if (assigneeFilter && task.assignee?.name !== assigneeFilter) {
        return false
      }
      return true
    })
  }, [tasks, statusFilter, priorityFilter, assigneeFilter])

  // Task stats
  const stats = useMemo(() => {
    return {
      total: tasks.length,
      todo: tasks.filter((t) => t.status === "TODO").length,
      inProgress: tasks.filter((t) => t.status === "IN_PROGRESS").length,
      done: tasks.filter((t) => t.status === "DONE").length,
      overdue: tasks.filter((t) => t.dueDate && isOverdue(t.dueDate) && t.status !== "DONE").length,
      dueToday: tasks.filter((t) => {
        if (!t.dueDate) {
          return false
        }
        const due = new Date(t.dueDate)
        const today = new Date()
        return due.toDateString() === today.toDateString()
      }).length
    }
  }, [tasks])

  // Handle task update
  const handleTaskUpdate = async (updatedTask: Task) => {
    try {
      const response = await apiClient.patch(`/api/tasks/${updatedTask._id}`, updatedTask)
      if (response.ok) {
        const updatedTaskData = (await response.json()) as Task
        toast.success("Task updated")
        setSelectedTask((prev) => {
          if (!prev || String(prev._id) !== String(updatedTaskData._id)) {
            return updatedTaskData as TaskWithProject
          }
          return {
            ...updatedTaskData,
            projectTitle: prev.projectTitle,
            projectId: prev.projectId
          } as TaskWithProject
        })
        setTasks((prev) =>
          prev.map((t) =>
            String(t._id) !== String(updatedTaskData._id)
              ? t
              : ({
                  ...t,
                  ...updatedTaskData,
                  projectTitle: t.projectTitle,
                  projectId: t.projectId
                } as TaskWithProject)
          )
        )
        queueMicrotask(() => {
          void fetchTasks({ silent: true })
        })
      } else {
        toast.error("Could not update task")
      }
    } catch (error) {
      console.error("Update task error:", error)
      toast.error("Network error during task update")
    }
  }

  const handleTaskUpdated = (updatedTask: Task) => {
    setSelectedTask((prev) => {
      if (!prev || String(prev._id) !== String(updatedTask._id)) {
        return updatedTask as TaskWithProject
      }
      return {
        ...updatedTask,
        projectTitle: prev.projectTitle,
        projectId: prev.projectId
      } as TaskWithProject
    })
    setTasks((prev) =>
      prev.map((t) =>
        String(t._id) === String(updatedTask._id)
          ? ({
              ...t,
              ...updatedTask,
              projectTitle: t.projectTitle,
              projectId: t.projectId
            } as TaskWithProject)
          : t
      )
    )
    queueMicrotask(() => {
      void fetchTasks({ silent: true })
    })
  }

  return (
    <div className="relative min-h-full overflow-hidden pb-32">
      {/* Premium Ambient Background */}
      <div className="pointer-events-none absolute top-20 right-[20%] -z-10 h-150 w-150 rounded-full bg-blue-500/5 blur-[140px]" />
      <div className="pointer-events-none absolute bottom-40 left-[10%] -z-10 h-125 w-125 rounded-full bg-indigo-500/5 blur-[120px]" />
      <div className="pointer-events-none absolute top-[40%] left-[30%] -z-10 h-100 w-100 rounded-full bg-emerald-500/5 blur-[100px]" />

      <div className="mx-auto max-w-400 space-y-16 px-10 pt-10 pb-20">
        {/* Cinematic Header Section */}
        <div className="flex flex-col justify-between gap-12 md:flex-row md:items-end">
          <div className="space-y-6">
            <div className="flex items-center gap-4">
              <div className="rounded-full bg-slate-900 px-4 py-1.5 text-white dark:bg-white dark:text-slate-900">
                <span className="text-[10px] font-black tracking-[0.2em] uppercase">Workspace</span>
              </div>
              <div className="h-0.5 w-12 bg-slate-200 dark:bg-slate-800" />
            </div>
            <h1 className="text-5xl leading-[0.95] font-black tracking-tighter text-slate-900 sm:text-6xl md:text-7xl dark:text-white">
              My{" "}
              <span className="bg-linear-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                tasks
              </span>
            </h1>
            <p className="max-w-2xl text-lg leading-relaxed font-medium text-slate-600 dark:text-slate-400">
              {loading
                ? "Loading your tasks…"
                : `Personal tasks and tasks from projects you belong to — created by you or assigned to you (${filteredTasks.length} shown with current filters).`}
            </p>
          </div>
          <div className="flex shrink-0 items-center gap-6 pb-2">
            <CreateTaskModal onTaskCreated={() => void fetchTasks({ silent: true })} />
          </div>
        </div>

        {/* Tactical Stat Grid */}
        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4">
          <StatCard
            title="Total"
            value={stats.total}
            icon={ListTodo}
            className="rounded-3xl border-white/20 bg-white/40 p-5 backdrop-blur-xl dark:border-slate-800/50 dark:bg-slate-900/40"
          />
          <StatCard
            title="To Do"
            value={stats.todo}
            icon={Clock}
            variant="default"
            className="rounded-3xl p-5"
          />
          <StatCard
            title="In Progress"
            value={stats.inProgress}
            icon={Zap}
            variant="primary"
            className="rounded-3xl p-5 shadow-lg shadow-blue-500/10"
          />
          <StatCard
            title="Completed"
            value={stats.done}
            icon={CheckCircle}
            variant="success"
            className="rounded-3xl p-5"
          />
        </div>

        {/* Operational Console */}
        <div className="space-y-10">
          <div className="flex flex-col justify-between gap-8 border-b border-white/10 pb-8 xl:flex-row xl:items-center dark:border-slate-800/50">
            <Tabs defaultValue="all" className="w-full xl:w-auto">
              <TabsList className="h-10 w-full rounded-xl border border-white/20 bg-white/40 p-1 shadow-md backdrop-blur-xl xl:w-auto dark:border-white/5 dark:bg-slate-950/40">
                <TabsTrigger
                  value="all"
                  onClick={() => {
                    setStatusFilter(null)
                    setPriorityFilter(null)
                    setAssigneeFilter(null)
                  }}
                  className="rounded-lg px-5 text-[10px] font-black tracking-widest uppercase transition-all data-[state=active]:bg-slate-900 data-[state=active]:text-white data-[state=active]:shadow-md dark:data-[state=active]:bg-white dark:data-[state=active]:text-slate-900"
                >
                  All tasks
                </TabsTrigger>
                <TabsTrigger
                  value="todo"
                  onClick={() => {
                    setStatusFilter("TODO")
                  }}
                  className="rounded-lg px-5 text-[10px] font-black tracking-widest uppercase transition-all data-[state=active]:bg-blue-600 data-[state=active]:text-white"
                >
                  To Do
                </TabsTrigger>
                <TabsTrigger
                  value="in-progress"
                  onClick={() => {
                    setStatusFilter("IN_PROGRESS")
                  }}
                  className="rounded-lg px-5 text-[10px] font-black tracking-widest uppercase transition-all data-[state=active]:bg-indigo-600 data-[state=active]:text-white"
                >
                  In Progress
                </TabsTrigger>
                <TabsTrigger
                  value="done"
                  onClick={() => {
                    setStatusFilter("DONE")
                  }}
                  className="rounded-lg px-5 text-[10px] font-black tracking-widest uppercase transition-all data-[state=active]:bg-emerald-600 data-[state=active]:text-white"
                >
                  Completed
                </TabsTrigger>
              </TabsList>
            </Tabs>

            <div className="flex flex-wrap gap-4">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="outline"
                    className="h-9 gap-2 rounded-xl border-slate-200 bg-white/80 px-4 text-[10px] font-black tracking-widest uppercase shadow-sm backdrop-blur-xl dark:border-slate-800 dark:bg-slate-950/50"
                  >
                    <Filter className="h-3.5 w-3.5 text-blue-600" />
                    Priority:{" "}
                    <span className="text-blue-600">
                      {priorityFilter === "URGENT"
                        ? "Urgent"
                        : priorityFilter === "HIGH"
                          ? "High"
                          : priorityFilter === "MEDIUM"
                            ? "Medium"
                            : priorityFilter === "LOW"
                              ? "Low"
                              : "Any"}
                    </span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  align="end"
                  className="w-72 rounded-4xl border-slate-100 bg-white/95 p-3 shadow-2xl backdrop-blur-3xl"
                >
                  <DropdownMenuLabel className="p-5 text-[10px] font-black tracking-[0.3em] text-slate-400 uppercase">
                    Priority
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator className="mx-2 mb-2 opacity-50" />
                  <DropdownMenuItem
                    onClick={() => {
                      setPriorityFilter(null)
                    }}
                    className="m-1 gap-4 rounded-xl py-4 font-bold transition-colors"
                  >
                    Any priority
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => {
                      setPriorityFilter("URGENT")
                    }}
                    className="m-1 gap-4 rounded-xl bg-rose-50/50 py-4 font-bold text-rose-600"
                  >
                    Urgent
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => {
                      setPriorityFilter("HIGH")
                    }}
                    className="m-1 gap-4 rounded-xl bg-amber-50/50 py-4 font-bold text-amber-600"
                  >
                    High
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => {
                      setPriorityFilter("MEDIUM")
                    }}
                    className="m-1 gap-4 rounded-xl bg-blue-50/50 py-4 font-bold text-blue-600"
                  >
                    Medium
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => {
                      setPriorityFilter("LOW")
                    }}
                    className="m-1 gap-4 rounded-xl bg-slate-50 py-4 font-bold text-slate-500"
                  >
                    Low Priority
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="outline"
                    className="h-9 gap-2 rounded-xl border-slate-200 bg-white/80 px-4 text-[10px] font-black tracking-widest uppercase shadow-sm backdrop-blur-xl dark:border-slate-800 dark:bg-slate-950/50"
                  >
                    <User className="h-3.5 w-3.5 text-indigo-600" />
                    Assignee: <span className="text-indigo-600">{assigneeFilter || "Anyone"}</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  align="end"
                  className="w-72 rounded-4xl border-slate-100 bg-white/95 p-3 shadow-2xl backdrop-blur-3xl"
                >
                  <DropdownMenuLabel className="p-5 text-[10px] font-black tracking-[0.3em] text-slate-400 uppercase">
                    Assignee
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator className="mx-2 mb-2 opacity-50" />
                  <DropdownMenuItem
                    onClick={() => {
                      setAssigneeFilter(null)
                    }}
                    className="m-1 gap-4 rounded-xl py-4 font-bold"
                  >
                    Anyone
                  </DropdownMenuItem>
                  {Array.from(new Set(tasks.map((t) => t.assignee?.name).filter(Boolean))).map(
                    (name) => (
                      <DropdownMenuItem
                        key={name}
                        onClick={() => {
                          setAssigneeFilter(name!)
                        }}
                        className="m-1 gap-4 rounded-xl py-4 font-bold hover:bg-slate-50"
                      >
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 text-[11px] font-black dark:bg-slate-800">
                          {name?.slice(0, 1)}
                        </div>
                        {name}
                      </DropdownMenuItem>
                    )
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>

          <div className="group relative">
            <div className="absolute inset-x-20 -top-10 bottom-10 -z-10 animate-pulse bg-blue-600/5 blur-[120px]" />

            <Card className="overflow-hidden rounded-3xl border border-slate-100/60 bg-white/90 shadow-[0_8px_40px_-12px_rgba(0,0,0,0.12)] backdrop-blur-xl dark:border-slate-800/50 dark:bg-slate-900/90">
              <CardHeader className="px-6 py-5 pb-3">
                <div className="flex items-center gap-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-900 text-white dark:bg-white dark:text-slate-900">
                    <FileText className="h-5 w-5" />
                  </div>
                  <div>
                    <CardTitle className="text-lg font-black tracking-tight">Task list</CardTitle>
                    <CardDescription className="mt-0.5 text-xs font-medium text-slate-500 normal-case">
                      Tasks you created or that are assigned to you, including from shared projects.
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <div className="px-6 pt-2 pb-6">
                {loading ? (
                  <div className="flex items-center justify-center py-32">
                    <div className="space-y-8 text-center">
                      <div className="relative mx-auto h-24 w-24">
                        <div className="absolute inset-0 rounded-full border-4 border-slate-100 dark:border-slate-800" />
                        <div className="absolute inset-0 animate-[spin_0.8s_linear_infinite] rounded-full border-4 border-blue-600 border-t-transparent" />
                      </div>
                      <p className="text-[11px] font-black tracking-[0.15em] text-slate-400 uppercase">
                        Loading tasks…
                      </p>
                    </div>
                  </div>
                ) : (
                  <TaskTable
                    tasks={filteredTasks}
                    onTaskClick={(task) => {
                      setSelectedTask(task)
                      setModalOpen(true)
                    }}
                  />
                )}
              </div>
            </Card>
          </div>
        </div>
      </div>

      {/* Task Detail Modal */}
      <TaskDetailModal
        task={selectedTask || undefined}
        open={modalOpen}
        onOpenChange={setModalOpen}
        projectId={selectedTask?.projectId}
        onSave={(task) => {
          handleTaskUpdate(task)
          // Keep modal open - only close via explicit close button or delete/archive
        }}
        onTaskUpdated={(task) => {
          // For updates that already patched (like status changes)
          handleTaskUpdated(task)
        }}
      />
    </div>
  )
}

// Task Table Component - Ultra Premium Redesign
interface TaskTableProps {
  tasks: TaskWithProject[]
  onTaskClick?: (task: TaskWithProject) => void
}

export function TaskTable({ tasks, onTaskClick }: TaskTableProps) {
  const columns: ColumnDef<TaskWithProject>[] = [
    {
      accessorKey: "title",
      header: () => (
        <span className="pl-6 text-[11px] font-black tracking-[0.2em] text-slate-400 uppercase">
          Task & project
        </span>
      ),
      cell: ({ row }) => (
        <div className="group/row flex items-center gap-4 py-3 pl-4">
          <div
            className={cn(
              "h-8 w-1 shrink-0 rounded-full transition-all duration-300",
              row.original.status === "DONE"
                ? "bg-emerald-500"
                : row.original.status === "IN_PROGRESS"
                  ? "animate-pulse bg-blue-600"
                  : "bg-slate-200 dark:bg-slate-700"
            )}
          />
          <div className="min-w-0 space-y-1">
            <span className="block truncate text-sm font-bold text-slate-900 transition-colors group-hover/row:text-blue-600 dark:text-white">
              {row.original.title}
            </span>
            <div className="flex flex-wrap items-center gap-2">
              <div className="flex items-center gap-1.5 rounded-lg border border-slate-200/50 bg-slate-100/50 px-2 py-0.5 dark:border-slate-800 dark:bg-slate-800/50">
                <Target className="h-3 w-3 text-slate-400 group-hover/row:text-blue-600" />
                <span className="text-[10px] font-bold tracking-wider text-slate-500 uppercase group-hover/row:text-blue-600">
                  {row.original.projectTitle}
                </span>
              </div>
              {row.original.checklist && row.original.checklist.length > 0 && (
                <div className="flex items-center gap-1 rounded-md bg-slate-50 px-1.5 py-0.5 text-slate-400 dark:bg-slate-800/30">
                  <CheckSquare className="h-3 w-3" />
                  <span className="text-[10px] font-bold tracking-wider uppercase">
                    {row.original.checklist.filter((i) => i.completed).length}/
                    {row.original.checklist.length} checklist
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      )
    },
    {
      accessorKey: "status",
      header: () => (
        <span className="text-[11px] font-black tracking-[0.2em] text-slate-400 uppercase">
          Status
        </span>
      ),
      cell: ({ row }) => (
        <StatusBadge
          type="status"
          value={row.original.status}
          size="sm"
          className="h-6 rounded-lg px-2.5 text-[10px] font-bold tracking-wide"
        />
      )
    },
    {
      accessorKey: "priority",
      header: () => (
        <span className="text-[11px] font-black tracking-[0.2em] text-slate-400 uppercase">
          Priority
        </span>
      ),
      cell: ({ row }) => (
        <StatusBadge
          type="priority"
          value={row.original.priority || "medium"}
          size="sm"
          className="h-6 rounded-lg px-2.5 text-[10px] font-bold tracking-wide"
        />
      )
    },

    {
      accessorKey: "dueDate",
      header: ({ column }) => (
        <button
          className="flex items-center gap-3 text-[11px] font-black tracking-[0.3em] text-slate-400 uppercase transition-all hover:text-slate-600"
          onClick={() => {
            column.toggleSorting(column.getIsSorted() === "asc")
          }}
        >
          Due
          <ArrowUpDown className="h-4 w-4 stroke-3" />
        </button>
      ),
      cell: ({ row }) => {
        if (!row.original.dueDate) {
          return (
            <div className="flex items-center gap-2 text-slate-300">
              <div className="h-1.5 w-1.5 rounded-full bg-slate-200 dark:bg-slate-700" />
              <div className="flex flex-col">
                <span className="text-[10px] font-bold tracking-wide text-slate-400 uppercase">
                  Open Ended
                </span>
                <span className="text-[9px] text-slate-300 dark:text-slate-600">No Expiry set</span>
              </div>
            </div>
          )
        }
        const overdue = isOverdue(row.original.dueDate)
        return (
          <div
            className={cn(
              "inline-flex flex-col gap-0.5 rounded-lg border px-3 py-1.5",
              overdue && row.original.status !== "DONE"
                ? "border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-900/40 dark:bg-rose-900/10"
                : "border-slate-100 bg-slate-50 text-slate-600 dark:border-slate-800 dark:bg-slate-900/40"
            )}
          >
            <div className="flex items-center gap-1.5">
              <Clock
                className={cn(
                  "h-3 w-3",
                  overdue && row.original.status !== "DONE"
                    ? "animate-pulse text-rose-500"
                    : "text-slate-400"
                )}
              />
              <span
                className={cn(
                  "text-[11px] font-bold tracking-wide uppercase",
                  overdue && row.original.status !== "DONE" ? "text-rose-600" : ""
                )}
              >
                {formatDate(row.original.dueDate)}
              </span>
            </div>
            {overdue && row.original.status !== "DONE" && (
              <span className="pl-4 text-[9px] font-bold tracking-widest text-rose-400 uppercase">
                Critical Delay
              </span>
            )}
          </div>
        )
      }
    }
  ]

  return (
    <div className="relative">
      <DataTable
        columns={columns}
        data={tasks}
        searchPlaceholder="Search by task title…"
        pageSize={10}
        enableColumnVisibility={true}
        onRowClick={(task) => onTaskClick?.(task)}
      />
    </div>
  )
}
