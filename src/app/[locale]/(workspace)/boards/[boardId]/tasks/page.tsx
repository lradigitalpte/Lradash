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
  User,
  Zap,
  Sparkles,
  Layers,
  Target,
  ArrowUpRight,
  Info
} from "lucide-react"
import Link from "next/link"
import { useParams } from "next/navigation"
import { useState, useEffect, useMemo } from "react"

import { CreateTaskDialog } from "@/components/tasks/CreateTaskDialog"
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
import { cn } from "@/lib/utils"

export default function BoardTasksPage() {
  const params = useParams()
  const boardId = params?.boardId as string
  const locale = params?.locale as string
  const [project, setProject] = useState<any>(null)
  const [tasks, setTasks] = useState<any[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [filterStatus, setFilterStatus] = useState<string>("ALL")
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (boardId) {
      fetchProject()
    }
  }, [boardId])

  const fetchProject = async () => {
    try {
      setLoading(true)
      const response = await apiClient.get(`/api/projects/${boardId}`)
      if (!response.ok) {
        return
      }
      const data = await response.json()
      setProject(data)
      setTasks(data.tasks || [])
    } catch (err) {
      console.error("Failed to fetch project:", err)
    } finally {
      setLoading(false)
    }
  }

  const filteredTasks = useMemo(() => {
    return tasks.filter((task) => {
      const matchesSearch =
        task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        task.description?.toLowerCase().includes(searchQuery.toLowerCase())
      const matchesFilter = filterStatus === "ALL" || task.status === filterStatus
      return matchesSearch && matchesFilter
    })
  }, [tasks, searchQuery, filterStatus])

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
      <div className="flex min-h-[600px] flex-col items-center justify-center space-y-4 bg-slate-50/50 dark:bg-slate-950/50">
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
    <div className="min-h-full space-y-10 bg-slate-50/30 p-8 pb-32 font-sans dark:bg-slate-950/30">
      {/* 1. Navigation & Breadcrumb */}
      <div className="flex items-center gap-4">
        <Link href={`/${locale}/boards/${boardId}`}>
          <Button
            variant="ghost"
            className="h-9 rounded-full border border-slate-200/50 px-4 text-xs font-bold tracking-widest text-slate-500 uppercase shadow-sm hover:bg-white dark:hover:bg-slate-900"
          >
            <ArrowLeft className="mr-2 h-3 w-3" />
            Project Dashboard
          </Button>
        </Link>
        <div className="mx-2 h-4 w-[1px] bg-slate-300" />
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
          <CreateTaskDialog projectId={boardId} onTaskCreated={fetchProject} />
        </div>
      </div>

      {/* 3. Intelligence Stats Dashboard */}
      <div className="grid gap-6 pt-4 md:grid-cols-4">
        {[
          {
            label: "Total Tasks",
            value: tasks.length,
            icon: Layers,
            color: "blue",
            sub: "Total tasks"
          },
          {
            label: "Pending",
            value: tasks.filter((t) => t.status === "TODO").length,
            icon: Target,
            color: "slate",
            sub: "To be started"
          },
          {
            label: "In Progress",
            value: tasks.filter((t) => t.status === "IN_PROGRESS" || t.status === "DOING").length,
            icon: Zap,
            color: "orange",
            sub: "Currently working"
          },
          {
            label: "Completed",
            value: tasks.filter((t) => t.status === "DONE").length,
            icon: CheckCircle2,
            color: "green",
            sub: "Finished units"
          }
        ].map((stat, idx) => (
          <Card
            key={idx}
            className="group overflow-hidden rounded-[2rem] border-none bg-white shadow-2xl shadow-slate-200/50 transition-all hover:-translate-y-1 dark:bg-slate-900 dark:shadow-none"
          >
            <CardContent className="p-8">
              <div className="mb-4 flex items-center justify-between">
                <div
                  className={cn(
                    "flex h-12 w-12 items-center justify-center rounded-2xl shadow-inner transition-colors",
                    stat.color === "blue"
                      ? "bg-blue-50 text-blue-600"
                      : stat.color === "orange"
                        ? "bg-orange-50 text-orange-600"
                        : stat.color === "green"
                          ? "bg-green-50 text-green-600"
                          : "bg-slate-50 text-slate-600"
                  )}
                >
                  <stat.icon className="h-5 w-5" />
                </div>
                <div className="text-[10px] font-black tracking-widest text-slate-300 uppercase transition-colors group-hover:text-blue-500">
                  Live
                </div>
              </div>
              <div className="mb-1 text-[10px] font-black tracking-[0.2em] text-slate-400 uppercase">
                {stat.label}
              </div>
              <div className="text-3xl font-black text-slate-900 dark:text-white">{stat.value}</div>
              <p className="mt-2 block text-[9px] font-bold tracking-widest text-slate-400 uppercase">
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
      <Card className="overflow-hidden rounded-[2.5rem] border-none bg-white shadow-2xl shadow-slate-200/50 dark:bg-slate-900">
        <Table>
          <TableHeader className="h-16 bg-slate-50/50 dark:bg-slate-900/50">
            <TableRow className="border-b border-slate-100 dark:border-slate-800">
              <TableHead className="w-20 pl-8" />
              <TableHead className="text-[10px] font-black tracking-widest text-slate-400 uppercase">
                Task Name
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
              <TableHead className="w-20 pr-8" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredTasks.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="py-32 text-center">
                  <div className="flex flex-col items-center gap-6">
                    <div className="relative flex h-24 w-24 items-center justify-center overflow-hidden rounded-[2rem] bg-slate-50 shadow-inner dark:bg-slate-950">
                      <Sparkles className="h-10 w-10 text-slate-200" />
                      <div className="absolute top-0 right-0 h-1/2 w-1/2 bg-blue-500/5 blur-2xl" />
                    </div>
                    <div className="space-y-1">
                      <h3 className="text-2xl font-black italic">No tasks found</h3>
                      <p className="mx-auto max-w-xs font-medium text-slate-400">
                        No tasks match your current filter parameters or have been created yet.
                      </p>
                    </div>
                    <Link href={`/${locale}/boards/${boardId}/board`}>
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
              filteredTasks.map((task) => (
                <TableRow
                  key={task._id}
                  className="group h-24 border-b border-slate-50 transition-colors hover:bg-slate-50/50 dark:border-slate-800/50 dark:hover:bg-slate-800/30"
                >
                  <TableCell className="pl-8">
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-slate-100 bg-white shadow-sm transition-transform group-hover:scale-110 dark:border-slate-700 dark:bg-slate-800">
                      {getStatusIcon(task.status)}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col">
                      <span className="text-base font-black text-slate-900 transition-colors group-hover:text-blue-600 dark:text-white">
                        {task.title}
                      </span>
                      <div className="mt-0.5 flex items-center gap-2">
                        <span className="text-[10px] font-black tracking-tighter text-slate-400 uppercase">
                          Task
                        </span>
                        {task.description && (
                          <span className="max-w-[200px] truncate text-[10px] font-bold text-slate-300 italic">
                            {" "}
                            - {task.description}
                          </span>
                        )}
                      </div>
                    </div>
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
                      <div className="flex items-center gap-3">
                        <Avatar className="h-10 w-10 rounded-2xl border-4 border-white shadow-xl transition-transform group-hover:-translate-y-1 dark:border-slate-900">
                          <AvatarImage src={task.assignee.avatar} />
                          <AvatarFallback className="bg-blue-600 text-xs font-black text-white">
                            {task.assignee.name?.slice(0, 1).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex flex-col">
                          <span className="text-xs font-black text-slate-900 dark:text-white">
                            {task.assignee.name}
                          </span>
                          <span className="text-[8px] text-[9px] font-bold tracking-widest text-slate-400 uppercase">
                            Assignee
                          </span>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 font-medium text-slate-300 italic">
                        <User className="h-4 w-4" />
                        <span className="text-xs text-[9px] font-bold tracking-widest uppercase">
                          Unassigned
                        </span>
                      </div>
                    )}
                  </TableCell>
                  <TableCell>
                    {task.dueDate ? (
                      <div className="flex flex-col">
                        <span className="flex items-center gap-1.5 text-sm font-black tabular-nums">
                          <Calendar className="h-3 w-3 text-slate-300" />
                          {new Date(task.dueDate).toLocaleDateString("en-US", {
                            month: "short",
                            day: "numeric",
                            year: "numeric"
                          })}
                        </span>
                        <span className="mt-0.5 text-[9px] font-black tracking-widest text-slate-300 uppercase">
                          Deadline
                        </span>
                      </div>
                    ) : (
                      <span className="text-xs font-black tracking-widest text-slate-300 uppercase">
                        TBD
                      </span>
                    )}
                  </TableCell>
                  <TableCell className="pr-8">
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
                        <DropdownMenuItem className="group gap-3 rounded-xl py-3 font-bold">
                          <Zap className="h-4 w-4 text-blue-500 group-hover:scale-110" />
                          Update Task
                        </DropdownMenuItem>
                        <DropdownMenuItem className="group gap-3 rounded-xl py-3 font-bold">
                          <Target className="h-4 w-4 text-purple-500 group-hover:scale-110" />
                          Change Assignee
                        </DropdownMenuItem>
                        <DropdownMenuSeparator className="my-2" />
                        <DropdownMenuItem className="gap-3 rounded-xl bg-rose-50/50 py-3 font-bold text-rose-600 hover:bg-rose-50">
                          <MoreHorizontal className="h-4 w-4" />
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

      {/* 6. System Footer Hint */}
      <div className="flex items-center justify-between rounded-[2rem] border border-white/20 bg-white/40 px-10 py-6 backdrop-blur-sm dark:bg-slate-900/40">
        <div className="flex items-center gap-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100 text-blue-600 shadow-inner">
            <Info className="h-5 w-5" />
          </div>
          <p className="max-w-lg text-xs leading-relaxed font-bold text-slate-500 italic">
            All tasks are synchronized in real-time with the project board and calendar modules.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="link"
            className="group gap-2 p-0 text-[10px] font-black tracking-[0.2em] text-blue-600 uppercase"
          >
            View Activity Logs
            <ChevronRight className="h-3 w-3 transition-transform group-hover:translate-x-1" />
          </Button>
        </div>
      </div>
    </div>
  )
}
