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
  AlertTriangle,
  UserPlus,
  User,
  CheckSquare,
  Plus
} from "lucide-react"
import { useMemo, useState, useEffect } from "react"
import { toast } from "sonner"

import { StatusBadge, UserAvatar, StatCard } from "@/components/common"
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

  // Fetch tasks from backend
  const fetchTasks = async () => {
    try {
      setLoading(true)
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
              projectTitle: "Personal Task",
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
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchTasks()
  }, [])

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
      // Check if this update has already been patched (contains updatedAt from server)
      // If it came from a direct API response, just update the state without patching again
      const response = await apiClient.patch(`/api/tasks/${updatedTask._id}`, updatedTask)
      if (response.ok) {
        const updatedTaskData = await response.json()
        toast.success("Initiative parameters synchronized")
        // Update selectedTask with the fresh data so modal shows updated info
        setSelectedTask(updatedTaskData)
        // Refetch all tasks to keep list in sync
        fetchTasks()
      } else {
        toast.error("Data synchronization failure")
      }
    } catch (error) {
      console.error("Update task error:", error)
      toast.error("Network error during task update")
    }
  }

  // Handle task update that was already patched (from modal direct updates)
  const handleTaskUpdated = (updatedTask: Task) => {
    // Just update the state without doing another patch
    setSelectedTask(updatedTask)
    // Refetch all tasks to keep list in sync
    fetchTasks()
  }

  return (
    <div className="relative min-h-full overflow-hidden pb-32">
      {/* Premium Ambient Background */}
      <div className="pointer-events-none absolute top-20 right-[20%] -z-10 h-[600px] w-[600px] rounded-full bg-blue-500/5 blur-[140px]" />
      <div className="pointer-events-none absolute bottom-40 left-[10%] -z-10 h-[500px] w-[500px] rounded-full bg-indigo-500/5 blur-[120px]" />
      <div className="pointer-events-none absolute top-[40%] left-[30%] -z-10 h-[400px] w-[400px] rounded-full bg-emerald-500/5 blur-[100px]" />

      <div className="mx-auto max-w-[1600px] space-y-16 px-10 pt-10 pb-20">
        {/* Cinematic Header Section */}
        <div className="flex flex-col justify-between gap-12 md:flex-row md:items-end">
          <div className="space-y-6">
            <div className="flex items-center gap-4">
              <div className="rounded-full bg-slate-900 px-4 py-1.5 text-white dark:bg-white dark:text-slate-900">
                <span className="text-[10px] font-black tracking-[0.3em] uppercase italic">
                  Task Logic v2.0
                </span>
              </div>
              <div className="h-0.5 w-12 bg-slate-200 dark:bg-slate-800" />
            </div>
            <h1 className="text-7xl leading-[0.85] font-black tracking-tighter text-slate-900 dark:text-white">
              Objective{" "}
              <span className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                Intelligence
              </span>
            </h1>
            <p className="max-w-2xl text-xl leading-relaxed font-medium text-slate-500 italic opacity-80 dark:text-slate-400">
              {loading
                ? "Decrypting initiative stream..."
                : `Monitoring ${filteredTasks.length} mission-critical objectives across active operational sectors.`}
            </p>
          </div>
          <div className="flex shrink-0 items-center gap-6 pb-2">
            <div className="mr-4 hidden flex-col items-end gap-1 lg:flex">
              <span className="text-[10px] font-black tracking-widest text-slate-400 uppercase">
                Security Clearance
              </span>
              <span className="text-sm font-bold text-slate-900 dark:text-white">
                Admin Level 4
              </span>
            </div>
            <CreateTaskModal onTaskCreated={fetchTasks} />
          </div>
        </div>

        {/* Tactical Stat Grid */}
        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
          <StatCard
            title="Total Capacity"
            value={stats.total}
            icon={ListTodo}
            className="rounded-[2.5rem] border-white/20 bg-white/40 p-8 backdrop-blur-xl dark:border-slate-800/50 dark:bg-slate-900/40"
          />
          <StatCard
            title="Backlog"
            value={stats.todo}
            icon={Clock}
            variant="default"
            className="rounded-[2.5rem] p-8"
          />
          <StatCard
            title="Processing"
            value={stats.inProgress}
            icon={Zap}
            variant="primary"
            className="rounded-[2.5rem] p-8 shadow-2xl shadow-blue-500/10"
          />
          <StatCard
            title="Resolved"
            value={stats.done}
            icon={CheckCircle}
            variant="success"
            className="rounded-[2.5rem] p-8"
          />
          <StatCard
            title="SLA Breach"
            value={stats.overdue}
            icon={Target}
            variant={stats.overdue > 0 ? "danger" : "default"}
            className="rounded-[2.5rem] border-rose-100/20 p-8 shadow-2xl shadow-rose-500/10"
          />
          <StatCard
            title="Critical today"
            value={stats.dueToday}
            icon={AlertTriangle}
            variant={stats.dueToday > 0 ? "warning" : "default"}
            className="rounded-[2.5rem] border-amber-100/20 p-8"
          />
        </div>

        {/* Operational Console */}
        <div className="space-y-10">
          <div className="flex flex-col justify-between gap-8 border-b border-white/10 pb-8 xl:flex-row xl:items-center dark:border-slate-800/50">
            <Tabs defaultValue="all" className="w-full xl:w-auto">
              <TabsList className="h-18 w-full rounded-[2rem] border border-white/20 bg-white/40 p-2 shadow-2xl backdrop-blur-3xl xl:w-auto dark:border-white/5 dark:bg-slate-950/40">
                <TabsTrigger
                  value="all"
                  onClick={() => {
                    setStatusFilter(null)
                    setPriorityFilter(null)
                    setAssigneeFilter(null)
                  }}
                  className="rounded-2xl px-10 text-[11px] font-black tracking-[0.2em] uppercase transition-all duration-300 data-[state=active]:bg-slate-900 data-[state=active]:text-white data-[state=active]:shadow-2xl dark:data-[state=active]:bg-white dark:data-[state=active]:text-slate-900"
                >
                  All Objectives
                </TabsTrigger>
                <TabsTrigger
                  value="todo"
                  onClick={() => {
                    setStatusFilter("TODO")
                  }}
                  className="rounded-2xl px-10 text-[11px] font-black tracking-[0.2em] uppercase transition-all duration-300 data-[state=active]:bg-blue-600 data-[state=active]:text-white"
                >
                  To Do
                </TabsTrigger>
                <TabsTrigger
                  value="in-progress"
                  onClick={() => {
                    setStatusFilter("IN_PROGRESS")
                  }}
                  className="rounded-2xl px-10 text-[11px] font-black tracking-[0.2em] uppercase transition-all duration-300 data-[state=active]:bg-indigo-600 data-[state=active]:text-white"
                >
                  In Progress
                </TabsTrigger>
                <TabsTrigger
                  value="done"
                  onClick={() => {
                    setStatusFilter("DONE")
                  }}
                  className="rounded-2xl px-10 text-[11px] font-black tracking-[0.2em] uppercase transition-all duration-300 data-[state=active]:bg-emerald-600 data-[state=active]:text-white"
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
                    className="h-14 gap-3 rounded-2xl border-white/20 bg-white/50 px-8 text-[10px] font-black tracking-[0.2em] uppercase shadow-2xl backdrop-blur-2xl transition-all hover:scale-105 active:scale-95 dark:border-slate-800 dark:bg-slate-950/50"
                  >
                    <Filter className="h-4 w-4 text-blue-600" />
                    Priority: <span className="text-blue-600">{priorityFilter || "Standard"}</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  align="end"
                  className="shadow-3xl w-72 rounded-[2rem] border-slate-100 bg-white/95 p-3 backdrop-blur-3xl"
                >
                  <DropdownMenuLabel className="p-5 text-[10px] font-black tracking-[0.3em] text-slate-400 uppercase">
                    Classification Levels
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator className="mx-2 mb-2 opacity-50" />
                  <DropdownMenuItem
                    onClick={() => {
                      setPriorityFilter(null)
                    }}
                    className="m-1 gap-4 rounded-xl py-4 font-bold transition-colors"
                  >
                    Default Stream
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => {
                      setPriorityFilter("URGENT")
                    }}
                    className="m-1 gap-4 rounded-xl bg-rose-50/50 py-4 font-bold text-rose-600"
                  >
                    Urgent Breach
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => {
                      setPriorityFilter("HIGH")
                    }}
                    className="m-1 gap-4 rounded-xl bg-amber-50/50 py-4 font-bold text-amber-600"
                  >
                    High Vulnerability
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => {
                      setPriorityFilter("MEDIUM")
                    }}
                    className="m-1 gap-4 rounded-xl bg-blue-50/50 py-4 font-bold text-blue-600"
                  >
                    Standard Protocol
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
                    className="h-14 gap-3 rounded-2xl border-white/20 bg-white/50 px-8 text-[10px] font-black tracking-[0.2em] uppercase shadow-2xl backdrop-blur-2xl transition-all hover:scale-105 active:scale-95 dark:border-slate-800 dark:bg-slate-950/50"
                  >
                    <User className="h-4 w-4 text-indigo-600" />
                    Assignee: <span className="text-indigo-600">{assigneeFilter || "Global"}</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  align="end"
                  className="shadow-3xl w-72 rounded-[2rem] border-slate-100 bg-white/95 p-3 backdrop-blur-3xl"
                >
                  <DropdownMenuLabel className="p-5 text-[10px] font-black tracking-[0.3em] text-slate-400 uppercase">
                    Personnel Surveillance
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator className="mx-2 mb-2 opacity-50" />
                  <DropdownMenuItem
                    onClick={() => {
                      setAssigneeFilter(null)
                    }}
                    className="m-1 gap-4 rounded-xl py-4 font-bold"
                  >
                    All Operators
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

            <Card className="overflow-hidden rounded-[3.5rem] border border-none border-white/20 bg-white/90 shadow-[0_64px_128px_-32px_rgba(0,0,0,0.15)] backdrop-blur-3xl transition-all duration-700 dark:border-white/5 dark:bg-slate-900/90 dark:shadow-none">
              <CardHeader className="p-16 pb-6">
                <div className="flex items-center gap-8">
                  <div className="shadow-3xl group relative flex h-20 w-20 items-center justify-center overflow-hidden rounded-[2rem] bg-slate-900 text-white dark:bg-white dark:text-slate-900">
                    <div className="absolute inset-0 bg-gradient-to-br from-blue-600/20 to-indigo-600/20 opacity-0 transition-opacity group-hover:opacity-100" />
                    <FileText className="relative z-10 h-10 w-10" />
                  </div>
                  <div>
                    <CardTitle className="text-4xl font-black tracking-tight uppercase">
                      Data Stream
                    </CardTitle>
                    <CardDescription className="mt-3 text-[10px] font-black tracking-[0.5em] text-slate-400 uppercase opacity-60">
                      Verified initiative matrix & operational status
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <div className="p-16 pt-8">
                {loading ? (
                  <div className="flex items-center justify-center py-32">
                    <div className="space-y-8 text-center">
                      <div className="relative mx-auto h-24 w-24">
                        <div className="absolute inset-0 rounded-full border-4 border-slate-100 dark:border-slate-800" />
                        <div className="absolute inset-0 animate-[spin_0.8s_linear_infinite] rounded-full border-4 border-blue-600 border-t-transparent" />
                      </div>
                      <p className="text-[11px] font-black tracking-[0.4em] text-slate-400 uppercase">
                        establishing neural link...
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
        <span className="pl-6 text-[11px] font-black tracking-[0.3em] text-slate-400 uppercase">
          Objective Matrix
        </span>
      ),
      cell: ({ row }) => (
        <div className="group/row flex items-center gap-8 py-6 pl-6">
          <div
            className={cn(
              "h-16 w-3.5 rounded-full shadow-sm transition-all duration-700",
              row.original.status === "DONE"
                ? "bg-emerald-500 shadow-emerald-500/20"
                : row.original.status === "IN_PROGRESS"
                  ? "animate-pulse bg-blue-600 shadow-blue-500/20"
                  : "bg-slate-200 dark:bg-slate-800"
            )}
          />
          <div className="space-y-2.5">
            <span className="block text-xl leading-tight font-black tracking-tight text-slate-900 uppercase transition-all group-hover/row:text-blue-600 dark:text-white">
              {row.original.title}
            </span>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 rounded-xl border border-slate-200/50 bg-slate-100/50 px-3 py-1.5 transition-all group-hover/row:border-blue-200 dark:border-slate-800 dark:bg-slate-800/50">
                <Target className="h-3.5 w-3.5 text-slate-400 group-hover/row:text-blue-600" />
                <span className="text-[11px] font-black tracking-widest text-slate-500 uppercase group-hover/row:text-blue-600">
                  {row.original.projectTitle}
                </span>
              </div>
              {row.original.checklist && row.original.checklist.length > 0 && (
                <div className="flex items-center gap-2 rounded-lg bg-slate-50 px-2 py-1 text-slate-400 dark:bg-slate-800/30">
                  <CheckSquare className="h-3.5 w-3.5" />
                  <span className="text-[10px] font-black tracking-widest uppercase">
                    {row.original.checklist.filter((i) => i.completed).length}/
                    {row.original.checklist.length} Verified
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
        <span className="text-[11px] font-black tracking-[0.3em] text-slate-400 uppercase">
          Execution
        </span>
      ),
      cell: ({ row }) => (
        <StatusBadge
          type="status"
          value={row.original.status}
          size="sm"
          className="h-11 rounded-2xl px-6 font-black shadow-sm"
        />
      )
    },
    {
      accessorKey: "priority",
      header: () => (
        <span className="text-[11px] font-black tracking-[0.3em] text-slate-400 uppercase">
          Impact
        </span>
      ),
      cell: ({ row }) => (
        <StatusBadge
          type="priority"
          value={row.original.priority || "medium"}
          size="sm"
          className="h-11 rounded-2xl px-6 font-black shadow-sm"
        />
      )
    },
    {
      accessorKey: "assignee",
      header: () => (
        <span className="text-[11px] font-black tracking-[0.3em] text-slate-400 uppercase">
          Operator
        </span>
      ),
      cell: ({ row }) =>
        row.original.assignee ? (
          <div className="flex items-center gap-5 py-2">
            <div className="group/avatar relative">
              <UserAvatar
                name={row.original.assignee.name}
                size="lg"
                className="shadow-2xl ring-4 ring-white transition-transform group-hover/avatar:scale-110 dark:ring-slate-900"
              />
              <div className="absolute -right-1 -bottom-1 h-5 w-5 rounded-full border-4 border-white bg-emerald-500 shadow-lg dark:border-slate-900" />
            </div>
            <div className="flex flex-col">
              <span className="mb-1 text-[11px] leading-none font-black tracking-[0.1em] text-slate-900 uppercase dark:text-white">
                {row.original.assignee.name}
              </span>
              <span className="text-[9px] font-bold tracking-widest text-slate-400 uppercase">
                Active Status
              </span>
            </div>
          </div>
        ) : (
          <div className="group/assign flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl border-2 border-dashed border-slate-200 transition-all duration-500 group-hover/assign:border-blue-600 group-hover/assign:bg-blue-50/50 dark:border-slate-800">
              <UserPlus className="h-5 w-5 text-slate-300 group-hover/assign:text-blue-600" />
            </div>
            <div className="flex flex-col">
              <span className="text-[10px] font-black tracking-widest text-slate-300 uppercase italic group-hover/assign:text-blue-600">
                Pending
              </span>
              <span className="text-[8px] font-bold tracking-widest text-slate-200 uppercase">
                Assignment Required
              </span>
            </div>
          </div>
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
          Timeline
          <ArrowUpDown className="h-4 w-4 stroke-[3]" />
        </button>
      ),
      cell: ({ row }) => {
        if (!row.original.dueDate) {
          return (
            <div className="flex items-center gap-3 text-slate-300 italic">
              <div className="h-2 w-2 rounded-full bg-slate-100 dark:bg-slate-800" />
              <div className="flex flex-col">
                <span className="text-[10px] font-black tracking-widest uppercase">Open Ended</span>
                <span className="text-[8px] font-bold">No Expiry set</span>
              </div>
            </div>
          )
        }
        const overdue = isOverdue(row.original.dueDate)
        return (
          <div
            className={cn(
              "flex h-16 flex-col justify-center gap-1 rounded-2xl border px-6 shadow-xl transition-all",
              overdue && row.original.status !== "DONE"
                ? "border-rose-100/50 bg-rose-50/30 text-rose-700 shadow-rose-500/5"
                : "border-slate-100 bg-slate-50/30 text-slate-600 dark:border-slate-800 dark:bg-slate-900/30"
            )}
          >
            <div className="flex items-center gap-3">
              <Clock
                className={cn(
                  "h-4 w-4 stroke-[2.5]",
                  overdue ? "animate-pulse text-rose-600" : "text-slate-400"
                )}
              />
              <span className="text-[11px] leading-none font-black tracking-[0.2em] uppercase">
                {formatDate(row.original.dueDate)}
              </span>
            </div>
            {overdue && row.original.status !== "DONE" && (
              <span className="mt-1 pl-7 text-[9px] font-black tracking-widest text-rose-500 uppercase italic">
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
        searchPlaceholder="Filter neural initiative matrix..."
        pageSize={10}
        enableColumnVisibility={true}
        onRowClick={(task) => onTaskClick?.(task)}
      />
    </div>
  )
}
