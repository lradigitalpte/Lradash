"use client"

import {
  Plus,
  Search,
  Filter as FilterIcon,
  MoreHorizontal,
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
  Eye
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
  DropdownMenuSeparator,
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

export default function TasksPage() {
  const params = useParams()
  const projectId = (params?.projectId || params?.boardId) as string
  const locale = params?.locale as string
  const [project, setProject] = useState<any>(null)
  const [tasks, setTasks] = useState<any[]>([])
  const [workPackages, setWorkPackages] = useState<any[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [filterStatus, setFilterStatus] = useState<string>("ALL")
  const [myTasksOnly, setMyTasksOnly] = useState(false)
  const [currentUser, setCurrentUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [currentPage, setCurrentPage] = useState(1)
  const PAGE_SIZE = 10

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
    // Update the task in the local state
    setTasks((prevTasks) =>
      prevTasks.map((task) => (task._id === updatedTask._id ? updatedTask : task))
    )

    // Close any open modals
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
      const matchesSearch =
        task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        task.description?.toLowerCase().includes(searchQuery.toLowerCase())
      const matchesFilter = filterStatus === "ALL" || task.status === filterStatus
      const matchesMine =
        !myTasksOnly ||
        (currentUser &&
          (task.assignee?._id === currentUser.id ||
            task.assignee?.id === currentUser.id ||
            task.assignee === currentUser.id))
      return matchesSearch && matchesFilter && matchesMine
    })
  }, [tasks, searchQuery, filterStatus, myTasksOnly, currentUser])

  // Reset to page 1 whenever filters change
  useEffect(() => {
    setCurrentPage(1)
  }, [searchQuery, filterStatus, myTasksOnly])

  const totalPages = Math.max(1, Math.ceil(filteredTasks.length / PAGE_SIZE))
  const pagedTasks = filteredTasks.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE)

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
        <div className="flex flex-col gap-4 md:flex-row">
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
          <div className="flex shrink-0 gap-2">
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
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="outline"
                  className="h-12 gap-2 rounded-2xl border-slate-100 bg-white px-6 font-bold transition-all hover:bg-slate-50 dark:bg-slate-900"
                >
                  <FilterIcon className="h-4 w-4 text-blue-600" />
                  Filter:{" "}
                  <span className="text-blue-600">
                    {filterStatus === "ALL" ? "All" : filterStatus.replace("_", " ")}
                  </span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56 rounded-2xl border-slate-100 p-2 shadow-2xl">
                <DropdownMenuItem
                  onClick={() => {
                    setFilterStatus("ALL")
                  }}
                  className="group rounded-xl py-3 font-bold"
                >
                  <Layers className="mr-2 h-4 w-4 text-slate-400 group-hover:text-blue-500" />
                  All Tasks
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => {
                    setFilterStatus("TODO")
                  }}
                  className="group rounded-xl py-3 font-bold"
                >
                  <Circle className="mr-2 h-4 w-4 text-slate-300 group-hover:text-slate-500" />
                  Backlog
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => {
                    setFilterStatus("IN_PROGRESS")
                  }}
                  className="group rounded-xl py-3 font-bold"
                >
                  <Zap className="mr-2 h-4 w-4 text-orange-500 group-hover:scale-110" />
                  In Progress
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => {
                    setFilterStatus("DONE")
                  }}
                  className="group rounded-xl py-3 font-bold"
                >
                  <CheckCircle2 className="mr-2 h-4 w-4 text-emerald-500 group-hover:scale-110" />
                  Completed
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            <Button
              variant="outline"
              className="h-12 w-12 animate-in rounded-2xl border-slate-100 bg-white p-0 font-bold transition-all fade-in hover:bg-slate-50 dark:bg-slate-900"
            >
              <MoreHorizontal className="h-5 w-5 text-slate-400" />
            </Button>
          </div>
        </div>
      </div>

      {/* 5. Tasks Table */}
      <Card className="overflow-hidden rounded-3xl border border-slate-100/60 bg-white shadow-sm dark:border-slate-800/50 dark:bg-slate-900">
        <Table>
          <TableHeader className="h-10 bg-slate-50/50 dark:bg-slate-900/50">
            <TableRow className="border-b border-slate-100 dark:border-slate-800">
              <TableHead className="w-14 pl-6" />
              <TableHead className="text-[10px] font-black tracking-widest text-slate-400 uppercase">
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
              <TableHead className="w-14 pr-6" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredTasks.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="py-32 text-center">
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
                  className="group h-12 border-b border-slate-50 transition-colors hover:bg-slate-50/50 dark:border-slate-800/50 dark:hover:bg-slate-800/30"
                >
                  <TableCell className="pl-6">
                    <div className="flex h-8 w-8 items-center justify-center rounded-xl border border-slate-100 bg-white shadow-sm transition-transform group-hover:scale-110 dark:border-slate-700 dark:bg-slate-800">
                      {getStatusIcon(task.status)}
                    </div>
                  </TableCell>
                  <TableCell>
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
                  <TableCell className="pr-6">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-10 w-10 rounded-xl transition-colors hover:bg-white dark:hover:bg-slate-800"
                        >
                          <MoreHorizontal className="h-5 w-5 text-slate-400" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent
                        align="end"
                        className="w-56 rounded-2xl border-slate-100 p-2 shadow-2xl"
                      >
                        <DropdownMenuItem
                          onClick={(e) => {
                            e.preventDefault()
                            handleViewDetails(task)
                          }}
                          className="group gap-3 rounded-xl py-3 font-bold hover:bg-blue-50"
                        >
                          <Eye className="h-4 w-4 text-blue-500 group-hover:scale-110" />
                          View Details
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={(e) => {
                            e.preventDefault()
                            handleEdit(task)
                          }}
                          className="group gap-3 rounded-xl py-3 font-bold hover:bg-blue-50"
                        >
                          <Edit className="h-4 w-4 text-blue-500 group-hover:scale-110" />
                          Edit Task
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={(e) => {
                            e.preventDefault()
                            handleChangeOwner(task)
                          }}
                          className="group gap-3 rounded-xl py-3 font-bold hover:bg-purple-50"
                        >
                          <UserPlus className="h-4 w-4 text-purple-500 group-hover:scale-110" />
                          Change Assignee
                        </DropdownMenuItem>
                        {!task.project && (
                          <DropdownMenuItem
                            onClick={(e) => {
                              e.preventDefault()
                              handleConvertToBoard(task)
                            }}
                            className="group gap-3 rounded-xl py-3 font-bold hover:bg-green-50"
                          >
                            <RefreshCw className="h-4 w-4 text-green-500 group-hover:scale-110" />
                            Convert to Board Task
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuSeparator className="my-2" />
                        <DropdownMenuItem
                          onClick={(e) => {
                            e.preventDefault()
                            handleDelete(task._id)
                          }}
                          className="gap-3 rounded-xl bg-rose-50/50 py-3 font-bold text-rose-600 hover:bg-rose-50"
                        >
                          <Trash2 className="h-4 w-4" />
                          Delete Task
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
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
              Showing {(currentPage - 1) * PAGE_SIZE + 1} to{" "}
              {Math.min(currentPage * PAGE_SIZE, filteredTasks.length)} of {filteredTasks.length}
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
          <Button
            variant="link"
            className="group gap-1.5 p-0 text-[10px] font-black tracking-widest text-blue-600 uppercase"
          >
            View Activity Logs
            <ChevronRight className="h-3 w-3 transition-transform group-hover:translate-x-1" />
          </Button>
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
