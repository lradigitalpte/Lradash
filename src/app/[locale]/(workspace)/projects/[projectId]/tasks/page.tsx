"use client"

import {
  Plus,
  Search,
  Filter as FilterIcon,
  Clock,
  CheckCircle2,
  Circle,
  ArrowLeft,
  CheckSquare,
  Activity,
  Calendar,
  ChevronRight,
  ChevronLeft,
  User,
  Zap,
  Sparkles,
  Layers,
  Target,
  Info,
  UserPlus,
  Trash2,
  Edit,
  RefreshCw,
  Eye,
  ClipboardCheck
} from "lucide-react"
import Link from "next/link"
import { useParams } from "next/navigation"
import { useState, useEffect, useMemo } from "react"
import { toast } from "sonner"

import { UserAvatar } from "@/components/common"
import { ChangeTaskOwnerModal } from "@/components/tasks/ChangeTaskOwnerModal"
import { ConvertToBoardTaskModal } from "@/components/tasks/ConvertToBoardTaskModal"
import { CreateTaskDialog } from "@/components/tasks/CreateTaskDialog"
import { EditTaskModal } from "@/components/tasks/EditTaskModal"
import { TaskDetailModal } from "@/components/tasks/TaskDetailModal"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table"
import { apiClient } from "@/lib/api/client"
import { cn, isOverdue } from "@/lib/utils"

/** Last 6 hex chars of Mongo id — stable, scannable reference */
function taskShortId(taskId: string | undefined): string {
  if (!taskId || taskId.length < 6) {
    return "—"
  }
  return taskId.slice(-6).toUpperCase()
}

export default function TasksPage() {
  const params = useParams()
  const projectId = (params?.projectId || params?.boardId) as string
  const locale = params?.locale as string
  const [project, setProject] = useState<any>(null)
  const [tasks, setTasks] = useState<any[]>([])
  const [workPackages, setWorkPackages] = useState<any[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [filterStatus, setFilterStatus] = useState<string>("ALL")
  const [filterPriority, setFilterPriority] = useState<string>("ALL")
  const [filterDueDate, setFilterDueDate] = useState<string>("ALL")
  const [showCompleted, setShowCompleted] = useState(true)
  const [sortBy, setSortBy] = useState<string>("CREATED_DESC")
  const [pageSize, setPageSize] = useState(10)
  const [myTasksOnly, setMyTasksOnly] = useState(false)
  const [currentUser, setCurrentUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [currentPage, setCurrentPage] = useState(1)

  // Modal states
  const [viewTaskModalOpen, setViewTaskModalOpen] = useState(false)
  const [editTaskModalOpen, setEditTaskModalOpen] = useState(false)
  const [changeOwnerModalOpen, setChangeOwnerModalOpen] = useState(false)
  const [convertToBoardModalOpen, setConvertToBoardModalOpen] = useState(false)
  const [selectedTask, setSelectedTask] = useState<any>(null)

  useEffect(() => {
    if (projectId) {
      fetchData()
    }
    fetchCurrentUser()
  }, [projectId])

  const fetchCurrentUser = async () => {
    try {
      const res = await apiClient.get("/api/auth/me")
      if (res.ok) {
        const data = await res.json()
        setCurrentUser(data)
      }
    } catch {}
  }

  const fetchData = async () => {
    try {
      setLoading(true)

      // Fetch project info
      const projectRes = await apiClient.get(`/api/projects/${projectId}`)
      if (projectRes.ok) {
        const projectData = await projectRes.json()
        setProject(projectData)
      }

      // Fetch tasks from backend API
      const tasksRes = await apiClient.get(`/api/projects/${projectId}/tasks`)
      if (tasksRes.ok) {
        const tasksData = await tasksRes.json()
        setTasks(Array.isArray(tasksData) ? tasksData : tasksData.tasks || [])
      }

      // Fetch work packages
      const wpRes = await apiClient.get(`/api/projects/${projectId}/work-packages`)
      if (wpRes.ok) {
        const wpData = await wpRes.json()
        setWorkPackages(Array.isArray(wpData) ? wpData : wpData.workPackages || [])
      }
    } catch (err) {
      console.error("Failed to fetch data:", err)
      toast.error("Failed to load project data")
    } finally {
      setLoading(false)
    }
  }

  const handleTaskCreated = () => {
    // Refresh tasks after creation
    fetchData()
  }

  const handleTaskUpdated = (updatedTask: any) => {
    setTasks((prevTasks) =>
      prevTasks.map((task) => (task._id === updatedTask._id ? updatedTask : task))
    )
    if (selectedTask && selectedTask._id === updatedTask._id) {
      setSelectedTask(updatedTask)
    }
    setEditTaskModalOpen(false)
    setChangeOwnerModalOpen(false)
  }

  const handleViewDetails = (task: any) => {
    setSelectedTask(task)
    setViewTaskModalOpen(true)
  }

  const handleEdit = (task: any) => {
    setSelectedTask(task)
    setEditTaskModalOpen(true)
  }

  const handleChangeOwner = (task: any) => {
    setSelectedTask(task)
    setChangeOwnerModalOpen(true)
  }

  const handleConvertToBoard = (task: any) => {
    setSelectedTask(task)
    setConvertToBoardModalOpen(true)
  }

  const handleDelete = async (taskId: string) => {
    if (confirm("Are you sure you want to permanently delete this task?")) {
      try {
        const response = await apiClient.delete(`/api/tasks/${taskId}`)
        if (response.ok) {
          toast.success("Task deleted successfully")
          // Refresh tasks after deletion
          fetchData()
        } else {
          const errorData = await response.json()
          toast.error(errorData.error || "Failed to delete task")
        }
      } catch (error) {
        console.error("Error deleting task:", error)
        toast.error("Failed to delete task")
      }
    }
  }

  const filteredTasks = useMemo(() => {
    return tasks.filter((task) => {
      if (task.deletedAt) {
        return false
      }
      const matchesSearch =
        task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        task.description?.toLowerCase().includes(searchQuery.toLowerCase())
      const matchesStatus = filterStatus === "ALL" || task.status === filterStatus
      const matchesPriority =
        filterPriority === "ALL" || (task.priority || "MEDIUM") === filterPriority
      const matchesDue =
        filterDueDate === "ALL" ||
        (filterDueDate === "OVERDUE" &&
          task.dueDate &&
          new Date(task.dueDate) < new Date() &&
          task.status !== "DONE") ||
        (filterDueDate === "THIS_WEEK" &&
          task.dueDate &&
          (() => {
            const d = new Date(task.dueDate)
            const now = new Date()
            const start = new Date(now)
            start.setDate(now.getDate() - now.getDay())
            start.setHours(0, 0, 0, 0)
            const end = new Date(start)
            end.setDate(start.getDate() + 7)
            return d >= start && d < end
          })()) ||
        (filterDueDate === "THIS_MONTH" &&
          task.dueDate &&
          (() => {
            const d = new Date(task.dueDate)
            const now = new Date()
            return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear()
          })()) ||
        (filterDueDate === "NO_DATE" && !task.dueDate)
      const matchesCompleted = showCompleted || task.status !== "DONE"
      const matchesMine =
        !myTasksOnly ||
        (currentUser &&
          (task.assignee?._id === currentUser.id ||
            task.assignee?.id === currentUser.id ||
            task.assignee === currentUser.id))
      return (
        matchesSearch &&
        matchesStatus &&
        matchesPriority &&
        matchesDue &&
        matchesCompleted &&
        matchesMine
      )
    })
  }, [
    tasks,
    searchQuery,
    filterStatus,
    filterPriority,
    filterDueDate,
    showCompleted,
    myTasksOnly,
    currentUser
  ])

  const sortedTasks = useMemo(() => {
    const list = [...filteredTasks]
    const priorityOrder: Record<string, number> = {
      URGENT: 0,
      HIGH: 1,
      MEDIUM: 2,
      LOW: 3
    }
    list.sort((a, b) => {
      if (sortBy === "CREATED_DESC" || sortBy === "CREATED_ASC") {
        const aT = a.createdAt ? new Date(a.createdAt).getTime() : 0
        const bT = b.createdAt ? new Date(b.createdAt).getTime() : 0
        if (aT !== bT) {
          return sortBy === "CREATED_DESC" ? bT - aT : aT - bT
        }
        return String(b._id || "").localeCompare(String(a._id || ""))
      }
      if (sortBy === "DUE_DATE_ASC") {
        const aD = a.dueDate ? new Date(a.dueDate).getTime() : Infinity
        const bD = b.dueDate ? new Date(b.dueDate).getTime() : Infinity
        return aD - bD
      }
      if (sortBy === "DUE_DATE_DESC") {
        const aD = a.dueDate ? new Date(a.dueDate).getTime() : 0
        const bD = b.dueDate ? new Date(b.dueDate).getTime() : 0
        return bD - aD
      }
      if (sortBy === "PRIORITY") {
        const aP = priorityOrder[a.priority || "MEDIUM"] ?? 2
        const bP = priorityOrder[b.priority || "MEDIUM"] ?? 2
        return aP - bP
      }
      if (sortBy === "TITLE") {
        return (a.title || "").localeCompare(b.title || "")
      }
      if (sortBy === "STATUS") {
        const order: Record<string, number> = { TODO: 0, IN_PROGRESS: 1, DONE: 2 }
        return (order[a.status] ?? 0) - (order[b.status] ?? 0)
      }
      return 0
    })
    return list
  }, [filteredTasks, sortBy])

  useEffect(() => {
    setCurrentPage(1)
  }, [
    searchQuery,
    filterStatus,
    filterPriority,
    filterDueDate,
    showCompleted,
    myTasksOnly,
    sortBy,
    pageSize
  ])

  const totalPages = Math.max(1, Math.ceil(sortedTasks.length / pageSize))
  const pagedTasks = sortedTasks.slice((currentPage - 1) * pageSize, currentPage * pageSize)
  const activeFilterCount = [
    filterStatus !== "ALL",
    filterPriority !== "ALL",
    filterDueDate !== "ALL",
    !showCompleted,
    myTasksOnly
  ].filter(Boolean).length

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "DONE":
        return <CheckCircle2 className="h-5 w-5 text-emerald-500" />
      case "IN_PROGRESS":
      case "DOING":
        return <Zap className="h-5 w-5 animate-pulse text-blue-500" />
      default:
        return <Circle className="h-5 w-5 text-slate-300" />
    }
  }

  if (loading && tasks.length === 0) {
    return (
      <div className="flex min-h-96 flex-col items-center justify-center space-y-4 bg-slate-50/50 dark:bg-slate-950/50">
        <div className="flex h-12 w-12 animate-pulse items-center justify-center rounded-2xl bg-blue-600/10">
          <Activity className="h-6 w-6 text-blue-600" />
        </div>
        <p className="font-sans text-[10px] font-black tracking-[0.2em] text-slate-400 uppercase">
          Loading tasks...
        </p>
      </div>
    )
  }

  return (
    <div className="relative min-h-screen w-full space-y-10 overflow-hidden bg-white p-8 pb-32 font-sans md:overflow-auto dark:bg-slate-950">
      {/* 1. Navigation & Breadcrumb */}
      <div className="flex items-center gap-4">
        <Link href={`/${locale}/projects/${projectId}`}>
          <Button
            variant="ghost"
            className="h-9 rounded-full border border-slate-200/50 px-4 text-xs font-bold tracking-widest text-slate-500 uppercase shadow-sm hover:bg-white dark:hover:bg-slate-900"
          >
            <ArrowLeft className="mr-2 h-3 w-3" />
            Project Dashboard
          </Button>
        </Link>
        <div className="mx-2 h-4 w-px bg-slate-300" />
        <span className="text-[10px] font-black tracking-widest text-slate-400 uppercase">
          Workspace / Tasks
        </span>
      </div>

      {/* 2. Premium Header */}
      <div className="flex flex-col justify-between gap-6 md:flex-row md:items-end">
        <div className="space-y-3">
          <div className="mb-1 flex items-center gap-3">
            <div className="flex h-12 w-12 transform items-center justify-center rounded-2xl bg-slate-900 text-white shadow-xl transition-transform hover:scale-110 dark:bg-white dark:text-slate-900">
              <CheckSquare className="h-6 w-6" />
            </div>
            <Badge
              variant="outline"
              className="h-6 border-slate-200 bg-white px-2 text-[10px] font-black tracking-widest uppercase dark:bg-slate-900"
            >
              Project Tasks
            </Badge>
          </div>
          <h1 className="text-4xl leading-tight font-black tracking-tight text-slate-900 dark:text-white">
            Project Tasks
          </h1>
          <p className="max-w-2xl leading-relaxed font-medium text-slate-500 italic">
            Overview of all tasks assigned to{" "}
            <span className="text-blue-600 underline decoration-blue-500/30 underline-offset-4">
              "{project?.title || "Workspace"}"
            </span>
          </p>
        </div>
        <div className="shrink-0 origin-bottom-right scale-110">
          <CreateTaskDialog projectId={projectId} onTaskCreated={handleTaskCreated} />
        </div>
      </div>

      {/* 3. Stats */}
      <div className="grid gap-6 pt-4 md:grid-cols-4">
        {[
          {
            label: "Total",
            value: tasks.length,
            icon: Layers,
            color: "blue",
            sub: "All tasks"
          },
          {
            label: "To Do",
            value: tasks.filter((t) => t.status === "TODO").length,
            icon: Target,
            color: "slate",
            sub: "Not started"
          },
          {
            label: "In Progress",
            value: tasks.filter((t) => t.status === "IN_PROGRESS" || t.status === "DOING").length,
            icon: Zap,
            color: "orange",
            sub: "Active"
          },
          {
            label: "Completed",
            value: tasks.filter((t) => t.status === "DONE").length,
            icon: CheckCircle2,
            color: "green",
            sub: "Done"
          }
        ].map((stat, idx) => (
          <Card
            key={idx}
            className="group overflow-hidden rounded-3xl border-none bg-white shadow-md shadow-slate-200/50 transition-all hover:-translate-y-0.5 dark:bg-slate-900 dark:shadow-none"
          >
            <CardContent className="p-5">
              <div className="mb-3 flex items-center justify-between">
                <div
                  className={cn(
                    "flex h-9 w-9 items-center justify-center rounded-xl transition-colors",
                    stat.color === "blue"
                      ? "bg-blue-50 text-blue-600"
                      : stat.color === "orange"
                        ? "bg-orange-50 text-orange-600"
                        : stat.color === "green"
                          ? "bg-green-50 text-green-600"
                          : "bg-slate-50 text-slate-600"
                  )}
                >
                  <stat.icon className="h-4 w-4" />
                </div>
                <div className="text-[9px] font-black tracking-widest text-slate-300 uppercase transition-colors group-hover:text-blue-500">
                  Live
                </div>
              </div>
              <div className="mb-0.5 text-[10px] font-black tracking-[0.2em] text-slate-400 uppercase">
                {stat.label}
              </div>
              <div className="text-2xl font-black text-slate-900 dark:text-white">{stat.value}</div>
              <p className="mt-1 block text-[9px] font-bold tracking-widest text-slate-400 uppercase">
                {stat.sub}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* 4. Filter & Search Bar */}
      <div className="sticky top-4 z-20 space-y-4 rounded-3xl border border-white/20 bg-white/70 p-4 shadow-2xl shadow-slate-200/40 backdrop-blur-xl dark:border-slate-800/50 dark:bg-slate-900/70 dark:shadow-none">
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-4 md:flex-row md:items-center">
            <div className="group relative flex-1">
              <Search className="absolute top-1/2 left-4 h-4 w-4 -translate-y-1/2 text-slate-400 transition-colors group-focus-within:text-blue-500" />
              <Input
                placeholder="Find a task by title or description..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value)
                }}
                className="h-12 rounded-2xl border-none bg-slate-50 pl-12 text-sm font-medium transition-all placeholder:font-medium placeholder:italic focus:ring-4 focus:ring-blue-500/10 dark:bg-slate-950"
              />
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Button
                variant={myTasksOnly ? "default" : "outline"}
                onClick={() => {
                  setMyTasksOnly(!myTasksOnly)
                }}
                className={cn(
                  "h-12 gap-2 rounded-2xl px-5 font-bold transition-all",
                  myTasksOnly
                    ? "bg-blue-600 text-white shadow-lg shadow-blue-500/20"
                    : "border-slate-100 bg-white hover:bg-slate-50 dark:bg-slate-900"
                )}
              >
                <User className="h-4 w-4" />
                {myTasksOnly ? "My Tasks" : "All Tasks"}
              </Button>
              <Button
                variant={showCompleted ? "outline" : "secondary"}
                onClick={() => {
                  setShowCompleted(!showCompleted)
                }}
                className={cn(
                  "h-12 gap-2 rounded-2xl px-5 font-bold",
                  !showCompleted && "bg-slate-100 dark:bg-slate-800"
                )}
              >
                <CheckCircle2 className="h-4 w-4" />
                {showCompleted ? "With completed" : "Hide completed"}
              </Button>
              {activeFilterCount > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setFilterStatus("ALL")
                    setFilterPriority("ALL")
                    setFilterDueDate("ALL")
                  }}
                  className="h-12 rounded-2xl text-xs font-bold text-slate-500"
                >
                  Clear filters ({activeFilterCount})
                </Button>
              )}
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="outline"
                  className="h-10 gap-2 rounded-xl border-slate-100 bg-white px-4 text-xs font-bold dark:bg-slate-900"
                >
                  <FilterIcon className="h-3.5 w-3.5 text-blue-600" />
                  Status:{" "}
                  {filterStatus === "ALL"
                    ? "All"
                    : filterStatus === "TODO"
                      ? "To Do"
                      : filterStatus.replace("_", " ")}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-52 rounded-2xl p-2">
                {[
                  { value: "ALL", label: "All" },
                  { value: "TODO", label: "To Do" },
                  { value: "IN_PROGRESS", label: "In Progress" },
                  { value: "DONE", label: "Completed" }
                ].map((opt) => (
                  <DropdownMenuItem
                    key={opt.value}
                    onClick={() => {
                      setFilterStatus(opt.value)
                    }}
                    className="rounded-xl py-2.5 font-bold"
                  >
                    {opt.label}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="outline"
                  className="h-10 gap-2 rounded-xl border-slate-100 bg-white px-4 text-xs font-bold dark:bg-slate-900"
                >
                  <Target className="h-3.5 w-3.5 text-amber-600" />
                  Priority: {filterPriority === "ALL" ? "All" : filterPriority}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-52 rounded-2xl p-2">
                {["ALL", "URGENT", "HIGH", "MEDIUM", "LOW"].map((p) => (
                  <DropdownMenuItem
                    key={p}
                    onClick={() => {
                      setFilterPriority(p)
                    }}
                    className="rounded-xl py-2.5 font-bold"
                  >
                    {p === "ALL" ? "All" : p}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="outline"
                  className="h-10 gap-2 rounded-xl border-slate-100 bg-white px-4 text-xs font-bold dark:bg-slate-900"
                >
                  <Calendar className="h-3.5 w-3.5 text-slate-500" />
                  Due:{" "}
                  {filterDueDate === "ALL"
                    ? "Any"
                    : filterDueDate === "OVERDUE"
                      ? "Overdue"
                      : filterDueDate === "THIS_WEEK"
                        ? "This week"
                        : filterDueDate === "THIS_MONTH"
                          ? "This month"
                          : "No date"}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-52 rounded-2xl p-2">
                {[
                  { value: "ALL", label: "Any" },
                  { value: "OVERDUE", label: "Overdue" },
                  { value: "THIS_WEEK", label: "This week" },
                  { value: "THIS_MONTH", label: "This month" },
                  { value: "NO_DATE", label: "No date set" }
                ].map((opt) => (
                  <DropdownMenuItem
                    key={opt.value}
                    onClick={() => {
                      setFilterDueDate(opt.value)
                    }}
                    className="rounded-xl py-2.5 font-bold"
                  >
                    {opt.label}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="outline"
                  className="h-10 gap-2 rounded-xl border-slate-100 bg-white px-4 text-xs font-bold dark:bg-slate-900"
                >
                  Sort:{" "}
                  {sortBy === "CREATED_DESC"
                    ? "Newest first"
                    : sortBy === "CREATED_ASC"
                      ? "Oldest first"
                      : sortBy === "DUE_DATE_ASC"
                        ? "Due (soonest)"
                        : sortBy === "DUE_DATE_DESC"
                          ? "Due (latest)"
                          : sortBy === "PRIORITY"
                            ? "Priority"
                            : sortBy === "TITLE"
                              ? "Title"
                              : "Status"}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-52 rounded-2xl p-2">
                {[
                  { value: "CREATED_DESC", label: "Created (newest first)" },
                  { value: "CREATED_ASC", label: "Created (oldest first)" },
                  { value: "DUE_DATE_ASC", label: "Due date (soonest first)" },
                  { value: "DUE_DATE_DESC", label: "Due date (latest first)" },
                  { value: "PRIORITY", label: "Priority" },
                  { value: "TITLE", label: "Title A–Z" },
                  { value: "STATUS", label: "Status" }
                ].map((opt) => (
                  <DropdownMenuItem
                    key={opt.value}
                    onClick={() => {
                      setSortBy(opt.value)
                    }}
                    className="rounded-xl py-2.5 font-bold"
                  >
                    {opt.label}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="outline"
                  className="h-10 gap-2 rounded-xl border-slate-100 bg-white px-4 text-xs font-bold dark:bg-slate-900"
                >
                  {pageSize} per page
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-40 rounded-2xl p-2">
                {[10, 25, 50].map((n) => (
                  <DropdownMenuItem
                    key={n}
                    onClick={() => {
                      setPageSize(n)
                    }}
                    className="rounded-xl py-2.5 font-bold"
                  >
                    {n} per page
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>

      {/* 5. Tasks Table */}
      <Card className="overflow-x-auto rounded-3xl border border-slate-100/60 bg-white shadow-sm dark:border-slate-800/50 dark:bg-slate-900">
        <Table className="min-w-[800px]">
          <TableHeader className="sticky top-0 z-10 h-11 bg-slate-50/95 backdrop-blur-sm dark:bg-slate-900/95">
            <TableRow className="border-b border-slate-100 dark:border-slate-800">
              <TableHead className="w-14 pl-6" />
              <TableHead
                className="w-[88px] text-[10px] font-black tracking-widest text-slate-400 uppercase"
                title="Short task ID (last 6 characters)"
              >
                ID
              </TableHead>
              <TableHead className="min-w-[200px] text-[10px] font-black tracking-widest text-slate-400 uppercase">
                Task Name
              </TableHead>
              <TableHead className="text-[10px] font-black tracking-widest text-slate-400 uppercase">
                Status
              </TableHead>
              <TableHead className="text-[10px] font-black tracking-widest text-slate-400 uppercase">
                Priority
              </TableHead>
              <TableHead className="text-[10px] font-black tracking-widest text-slate-400 uppercase">
                Assigned To
              </TableHead>
              <TableHead className="text-[10px] font-black tracking-widest text-slate-400 uppercase">
                Due Date
              </TableHead>
              <TableHead className="min-w-[200px] pr-6 text-right text-[10px] font-black tracking-widest text-slate-400 uppercase">
                Actions
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredTasks.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="py-32 text-center">
                  <div className="flex flex-col items-center gap-6">
                    <div className="relative flex h-24 w-24 items-center justify-center overflow-hidden rounded-4xl bg-slate-50 shadow-inner dark:bg-slate-950">
                      <Sparkles className="h-10 w-10 text-slate-200" />
                      <div className="absolute top-0 right-0 h-1/2 w-1/2 bg-blue-500/5 blur-2xl" />
                    </div>
                    <div className="space-y-1">
                      <h3 className="text-2xl font-black italic">No tasks found</h3>
                      <p className="mx-auto max-w-xs font-medium text-slate-400">
                        No tasks match your current filter parameters or have been created yet.
                      </p>
                    </div>
                    <Link href={`/${locale}/projects/${projectId}/board`}>
                      <Button className="group mt-4 h-14 overflow-hidden rounded-2xl bg-slate-900 px-8 font-black text-white shadow-2xl dark:bg-white dark:text-slate-900">
                        <div className="absolute inset-0 translate-y-full bg-blue-600 transition-transform duration-300 group-hover:translate-y-0" />
                        <span className="relative flex items-center gap-2">
                          Create New Task <Plus className="h-4 w-4" />
                        </span>
                      </Button>
                    </Link>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              pagedTasks.map((task) => (
                <TableRow
                  key={task._id}
                  className="group border-b border-slate-50 transition-colors hover:bg-slate-50/50 dark:border-slate-800/50 dark:hover:bg-slate-800/30"
                >
                  <TableCell className="py-3 pl-6 align-middle">
                    <div className="flex h-8 w-8 items-center justify-center rounded-xl border border-slate-100 bg-white shadow-sm transition-transform group-hover:scale-110 dark:border-slate-700 dark:bg-slate-800">
                      {getStatusIcon(task.status)}
                    </div>
                  </TableCell>
                  <TableCell className="py-3 align-middle">
                    <span
                      className="inline-flex min-w-[4.5rem] font-mono text-xs font-bold tracking-tight text-slate-600 tabular-nums dark:text-slate-300"
                      title={task._id ? `Task id: ${task._id}` : undefined}
                    >
                      #{taskShortId(task._id)}
                    </span>
                  </TableCell>
                  <TableCell className="py-3 align-middle">
                    <div className="flex flex-col">
                      <span className="text-base font-black text-slate-900 transition-colors group-hover:text-blue-600 dark:text-white">
                        {task.title}
                      </span>
                      <div className="mt-0.5 flex flex-wrap items-center gap-2">
                        <span className="text-[10px] font-black tracking-tighter text-slate-400 uppercase">
                          Task
                        </span>
                        {task.description && (
                          <span className="max-w-50 truncate text-[10px] font-bold text-slate-300 italic">
                            {" "}
                            - {task.description}
                          </span>
                        )}
                        {task.workPackage && (
                          <Badge
                            variant="secondary"
                            className="ml-auto px-1.5 py-0.5 text-[8px] font-bold tracking-tighter"
                          >
                            {typeof task.workPackage === "string"
                              ? "WP"
                              : task.workPackage.title || "Work Package"}
                          </Badge>
                        )}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    {(() => {
                      const s = task.status
                      const map: Record<string, { label: string; cls: string }> = {
                        TODO: { label: "To Do", cls: "bg-slate-100 text-slate-500" },
                        IN_PROGRESS: { label: "In Progress", cls: "bg-blue-50 text-blue-600" },
                        DOING: { label: "In Progress", cls: "bg-blue-50 text-blue-600" },
                        DONE: { label: "Completed", cls: "bg-emerald-50 text-emerald-600" }
                      }
                      const item = map[s] ?? { label: s, cls: "bg-slate-100 text-slate-500" }
                      return (
                        <Badge
                          variant="secondary"
                          className={cn(
                            "h-5 rounded-full px-2 text-[9px] font-black tracking-tighter uppercase",
                            item.cls
                          )}
                        >
                          {item.label}
                        </Badge>
                      )
                    })()}
                  </TableCell>
                  <TableCell>
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
                  </TableCell>
                  <TableCell>
                    {task.assignee ? (
                      <div className="flex items-center gap-2">
                        <UserAvatar
                          name={task.assignee.name}
                          image={task.assignee.avatar}
                          size="sm"
                        />
                        <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                          {task.assignee.name}
                        </span>
                      </div>
                    ) : (
                      <span className="text-[10px] font-bold tracking-widest text-slate-300 uppercase italic">
                        Unassigned
                      </span>
                    )}
                  </TableCell>
                  <TableCell>
                    {task.dueDate ? (
                      (() => {
                        const overdue = isOverdue(task.dueDate) && task.status !== "DONE"
                        return (
                          <div
                            className={cn(
                              "inline-flex flex-col gap-0.5 rounded-lg border px-2.5 py-1.5",
                              overdue
                                ? "border-rose-200 bg-rose-50 dark:border-rose-900/40 dark:bg-rose-900/10"
                                : "border-slate-100 bg-slate-50 dark:border-slate-800 dark:bg-slate-900/40"
                            )}
                          >
                            <div className="flex items-center gap-1.5">
                              <Clock
                                className={cn(
                                  "h-3 w-3",
                                  overdue ? "animate-pulse text-rose-500" : "text-slate-400"
                                )}
                              />
                              <span
                                className={cn(
                                  "text-[11px] font-bold uppercase tabular-nums",
                                  overdue ? "text-rose-600" : "text-slate-600 dark:text-slate-300"
                                )}
                              >
                                {new Date(task.dueDate).toLocaleDateString("en-US", {
                                  month: "short",
                                  day: "numeric",
                                  year: "numeric"
                                })}
                              </span>
                            </div>
                            <span
                              className={cn(
                                "text-[9px] font-bold tracking-widest uppercase",
                                overdue ? "text-rose-400" : "text-slate-300"
                              )}
                            >
                              {overdue ? "Critical Delay" : "Deadline"}
                            </span>
                          </div>
                        )
                      })()
                    ) : (
                      <div className="flex items-center gap-1.5 text-slate-300">
                        <div className="h-1.5 w-1.5 rounded-full bg-slate-200 dark:bg-slate-700" />
                        <div className="flex flex-col">
                          <span className="text-[10px] font-bold tracking-wide text-slate-400 uppercase">
                            Open Ended
                          </span>
                          <span className="text-[9px] text-slate-300 dark:text-slate-600">
                            No expiry set
                          </span>
                        </div>
                      </div>
                    )}
                  </TableCell>
                  <TableCell className="pr-4 align-middle">
                    <div className="flex flex-wrap items-center justify-end gap-0.5">
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        title="View details"
                        aria-label="View details"
                        onClick={() => {
                          handleViewDetails(task)
                        }}
                        className="h-9 w-9 shrink-0 rounded-lg text-slate-600 hover:bg-blue-50 hover:text-blue-600 dark:text-slate-300 dark:hover:bg-blue-950/40 dark:hover:text-blue-400"
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        title="Completion timeline"
                        aria-label="Completion timeline"
                        className="h-9 w-9 shrink-0 rounded-lg text-slate-600 hover:bg-emerald-50 hover:text-emerald-600 dark:text-slate-300 dark:hover:bg-emerald-950/40 dark:hover:text-emerald-400"
                        asChild
                      >
                        <Link
                          href={`/${locale}/projects/${projectId}/tasks/${task._id}/completion`}
                        >
                          <ClipboardCheck className="h-4 w-4" />
                        </Link>
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        title="Edit task"
                        aria-label="Edit task"
                        onClick={() => {
                          handleEdit(task)
                        }}
                        className="h-9 w-9 shrink-0 rounded-lg text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-white"
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        title="Change assignee"
                        aria-label="Change assignee"
                        onClick={() => {
                          handleChangeOwner(task)
                        }}
                        className="h-9 w-9 shrink-0 rounded-lg text-slate-600 hover:bg-violet-50 hover:text-violet-600 dark:text-slate-300 dark:hover:bg-violet-950/40 dark:hover:text-violet-400"
                      >
                        <UserPlus className="h-4 w-4" />
                      </Button>
                      {!task.project && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          title="Convert to board task"
                          aria-label="Convert to board task"
                          onClick={() => {
                            handleConvertToBoard(task)
                          }}
                          className="h-9 w-9 shrink-0 rounded-lg text-slate-600 hover:bg-green-50 hover:text-green-600 dark:text-slate-300 dark:hover:bg-green-950/40 dark:hover:text-green-400"
                        >
                          <RefreshCw className="h-4 w-4" />
                        </Button>
                      )}
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        title="Delete task"
                        aria-label="Delete task"
                        onClick={() => {
                          handleDelete(task._id)
                        }}
                        className="h-9 w-9 shrink-0 rounded-lg text-rose-500 hover:bg-rose-50 hover:text-rose-600 dark:text-rose-400 dark:hover:bg-rose-950/50"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </Card>

      {/* 6. Footer: Pagination + Hint */}
      <div className="space-y-4">
        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between rounded-2xl border border-slate-100 bg-white px-5 py-3 dark:border-slate-800 dark:bg-slate-900">
            <span className="text-[11px] font-bold text-slate-400">
              Showing {(currentPage - 1) * pageSize + 1} to{" "}
              {Math.min(currentPage * pageSize, sortedTasks.length)} of {sortedTasks.length}
            </span>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={currentPage === 1}
                onClick={() => {
                  setCurrentPage((p) => Math.max(1, p - 1))
                }}
                className="h-8 gap-1.5 rounded-xl border-slate-100 px-3 text-[10px] font-black tracking-widest uppercase disabled:opacity-40"
              >
                <ChevronLeft className="h-3.5 w-3.5" />
                Previous
              </Button>
              <div className="flex items-center gap-1">
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                  <button
                    key={page}
                    onClick={() => {
                      setCurrentPage(page)
                    }}
                    className={cn(
                      "h-8 w-8 rounded-lg text-[11px] font-black transition-all",
                      page === currentPage
                        ? "bg-slate-900 text-white dark:bg-white dark:text-slate-900"
                        : "text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
                    )}
                  >
                    {page}
                  </button>
                ))}
              </div>
              <Button
                variant="outline"
                size="sm"
                disabled={currentPage === totalPages}
                onClick={() => {
                  setCurrentPage((p) => Math.min(totalPages, p + 1))
                }}
                className="h-8 gap-1.5 rounded-xl border-slate-100 px-3 text-[10px] font-black tracking-widest uppercase disabled:opacity-40"
              >
                Next
                <ChevronRight className="h-3.5 w-3.5" />
              </Button>
            </div>
            <span className="text-[11px] font-bold text-slate-400">
              Page {currentPage} of {totalPages}
            </span>
          </div>
        )}

        {/* Hint row */}
        <div className="flex items-center justify-between rounded-2xl border border-slate-100/60 bg-white/40 px-6 py-4 backdrop-blur-sm dark:border-slate-800/50 dark:bg-slate-900/40">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
              <Info className="h-4 w-4" />
            </div>
            <p className="text-xs font-bold text-slate-500 italic">
              Tasks are shared across all project members. Use &quot;My Tasks&quot; to filter your
              own.
            </p>
          </div>
          <Link href={`/${locale}/projects/${projectId}/tasks/activity`}>
            <Button
              variant="link"
              className="group gap-1.5 p-0 text-[10px] font-black tracking-widest text-blue-600 uppercase"
            >
              View Activity Logs
              <ChevronRight className="h-3 w-3 transition-transform group-hover:translate-x-1" />
            </Button>
          </Link>
        </div>
      </div>

      {/* Task Detail Modal */}
      {selectedTask && (
        <TaskDetailModal
          task={selectedTask}
          projectId={projectId}
          open={viewTaskModalOpen}
          onOpenChange={setViewTaskModalOpen}
          onTaskUpdated={handleTaskUpdated}
        />
      )}

      {/* Edit Task Modal */}
      {selectedTask && (
        <EditTaskModal
          task={selectedTask}
          open={editTaskModalOpen}
          onOpenChange={setEditTaskModalOpen}
          onTaskUpdated={handleTaskUpdated}
        />
      )}

      {/* Change Owner Modal */}
      {selectedTask && (
        <ChangeTaskOwnerModal
          task={selectedTask}
          projectId={projectId}
          open={changeOwnerModalOpen}
          onOpenChange={setChangeOwnerModalOpen}
          onTaskUpdated={handleTaskUpdated}
        />
      )}

      {/* Convert to Board Task Modal */}
      {selectedTask && (
        <ConvertToBoardTaskModal
          task={selectedTask}
          open={convertToBoardModalOpen}
          onOpenChange={setConvertToBoardModalOpen}
          onTaskConverted={handleTaskUpdated}
        />
      )}
    </div>
  )
}
