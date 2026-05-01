"use client"

import { formatDistanceToNow } from "date-fns"
import {
  AlertCircle,
  ArrowLeft,
  BarChart3,
  CalendarClock,
  CalendarRange,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  CircleDashed,
  Eye,
  Filter,
  ListTodo,
  Loader2,
  Paperclip,
  Search,
  UserRound,
  X
} from "lucide-react"
import { useSearchParams } from "next/navigation"
import { useEffect, useMemo, useState } from "react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from "@/components/ui/dialog"
import { Link } from "@/i18n/navigation"
import { apiClient } from "@/lib/api/client"
import { cn } from "@/lib/utils"

interface AdminTask {
  _id: string
  title: string
  description: string
  status: "TODO" | "IN_PROGRESS" | "DONE"
  priority: "LOW" | "MEDIUM" | "HIGH" | "URGENT"
  createdAt: string
  dueDate: string | null
  project: { _id: string; title: string } | null
  assignee: { _id: string; name: string; email: string; avatar: string | null } | null
  assignees: { _id: string; name: string; email: string; avatar: string | null }[]
  attachmentCount: number
  attachments: { name: string; url: string; type: string; size: number }[]
}
interface AdminProjectOption {
  _id: string
  title: string
}
interface AdminAssigneeOption {
  _id: string
  name: string
}

const STATUS_STYLES: Record<AdminTask["status"], string> = {
  TODO: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300",
  IN_PROGRESS: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300",
  DONE: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300"
}

const PRIORITY_STYLES: Record<AdminTask["priority"], string> = {
  LOW: "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300",
  MEDIUM: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300",
  HIGH: "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300",
  URGENT: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300"
}

export default function AdminTasksPage() {
  const searchParams = useSearchParams()
  const [tasks, setTasks] = useState<AdminTask[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [search, setSearch] = useState("")
  const [page, setPage] = useState(1)
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, totalPages: 1 })
  const [limit, setLimit] = useState(10)
  const [mineOnly, setMineOnly] = useState(false)
  const [sort, setSort] = useState<"created_desc" | "created_asc">("created_desc")
  const [projectId, setProjectId] = useState(searchParams.get("projectId") || "")
  const [projects, setProjects] = useState<AdminProjectOption[]>([])
  const [assignees, setAssignees] = useState<AdminAssigneeOption[]>([])
  const [assigneeId, setAssigneeId] = useState("")
  const [dateFrom, setDateFrom] = useState("")
  const [dateTo, setDateTo] = useState("")
  const [hasAttachmentsOnly, setHasAttachmentsOnly] = useState(false)
  const [stats, setStats] = useState({
    total: 0,
    todo: 0,
    inProgress: 0,
    done: 0,
    completionRate: 0
  })
  const [selectedTask, setSelectedTask] = useState<AdminTask | null>(null)
  const [taskModalOpen, setTaskModalOpen] = useState(false)
  const getAssigneeLabel = (task: AdminTask) => {
    if (task.assignee?.name) {
      return task.assignee.name
    }
    if (task.assignees?.length) {
      return task.assignees.map((person) => person.name).join(", ")
    }
    return "Unassigned"
  }

  useEffect(() => {
    const timeout = setTimeout(() => {
      void fetchTasks()
    }, 250)
    return () => {
      clearTimeout(timeout)
    }
  }, [
    page,
    search,
    limit,
    mineOnly,
    sort,
    projectId,
    assigneeId,
    dateFrom,
    dateTo,
    hasAttachmentsOnly
  ])

  useEffect(() => {
    const projectIdFromUrl = searchParams.get("projectId") || ""
    setPage(1)
    setProjectId(projectIdFromUrl)
  }, [searchParams])

  useEffect(() => {
    void fetchProjects()
    void fetchAssignees()
  }, [])

  const fetchProjects = async () => {
    try {
      const response = await apiClient.get("/api/admin/projects")
      if (!response.ok) {
        return
      }
      const data = await response.json()
      const opts = (data.projects ?? []).map((p: any) => ({ _id: p._id, title: p.title }))
      setProjects(opts)
    } catch {}
  }

  const fetchAssignees = async () => {
    try {
      const response = await apiClient.get("/api/admin/users")
      if (!response.ok) {
        return
      }
      const data = await response.json()
      const opts = (data.users ?? []).map((user: any) => ({ _id: user._id, name: user.name }))
      setAssignees(opts)
    } catch {}
  }

  const fetchTasks = async () => {
    setLoading(true)
    try {
      const response = await apiClient.get(
        `/api/admin/tasks?page=${page}&limit=${limit}&q=${encodeURIComponent(search)}&mine=${
          mineOnly ? "1" : "0"
        }&sort=${sort}&projectId=${encodeURIComponent(projectId)}&assigneeId=${encodeURIComponent(
          assigneeId
        )}&dateFrom=${encodeURIComponent(dateFrom)}&dateTo=${encodeURIComponent(
          dateTo
        )}&hasAttachments=${hasAttachmentsOnly ? "1" : "0"}`
      )
      if (!response.ok) {
        throw new Error("Failed to load tasks")
      }
      const data = await response.json()
      setTasks(data.tasks ?? [])
      setPagination(data.pagination ?? { page: 1, limit, total: 0, totalPages: 1 })
      setStats(data.stats ?? { total: 0, todo: 0, inProgress: 0, done: 0, completionRate: 0 })
      setError(null)
    } catch (e: any) {
      setError(e.message ?? "Failed to load tasks")
    } finally {
      setLoading(false)
    }
  }

  const pageNumbers = useMemo(() => {
    const totalPages = pagination.totalPages
    const start = Math.max(1, page - 2)
    const end = Math.min(totalPages, page + 2)
    const pages: number[] = []
    for (let p = start; p <= end; p++) {
      pages.push(p)
    }
    return pages
  }, [page, pagination.totalPages])

  const activeFilterCount = useMemo(() => {
    return [
      Boolean(projectId),
      Boolean(assigneeId),
      Boolean(dateFrom),
      Boolean(dateTo),
      hasAttachmentsOnly,
      mineOnly
    ].filter(Boolean).length
  }, [projectId, assigneeId, dateFrom, dateTo, hasAttachmentsOnly, mineOnly])

  if (error) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-red-100">
            <AlertCircle className="h-8 w-8 text-red-500" />
          </div>
          <h2 className="text-xl font-black text-slate-900 dark:text-white">Access Denied</h2>
          <p className="mt-2 text-sm text-slate-500">{error}</p>
          <Link href="/admin/projects">
            <Button className="mt-4">Back to Projects</Button>
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="relative min-h-full pb-20">
      <div className="pointer-events-none absolute top-20 right-[10%] -z-10 h-[380px] w-[380px] rounded-full bg-blue-500/5 blur-[100px]" />

      <div className="mx-auto max-w-[1400px] space-y-8 p-8 lg:p-12">
        <div className="flex flex-col justify-between gap-6 pt-4 md:flex-row md:items-end">
          <div className="flex items-center gap-4">
            <Link href="/admin/projects">
              <Button variant="ghost" size="sm" className="gap-2 rounded-xl text-slate-500">
                <ArrowLeft className="h-4 w-4" />
                Projects
              </Button>
            </Link>
            <div className="flex items-center gap-4">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-600 to-cyan-700 text-white shadow-lg shadow-blue-500/20">
                <ListTodo className="h-7 w-7 stroke-[2]" />
              </div>
              <div>
                <h1 className="text-3xl font-black tracking-tight text-slate-900 dark:text-white">
                  All Tasks
                </h1>
                <p className="mt-0.5 text-sm text-slate-500">
                  {pagination.total} task{pagination.total !== 1 ? "s" : ""} across all projects
                </p>
              </div>
            </div>
          </div>
          <Badge className="rounded-xl border-0 bg-slate-100 px-3 py-1.5 text-xs font-black text-slate-700 dark:bg-slate-800 dark:text-slate-300">
            {activeFilterCount} active filter{activeFilterCount !== 1 ? "s" : ""}
          </Badge>
        </div>

        <Card className="border-slate-200/70 bg-white/80 shadow-sm dark:border-slate-800/70 dark:bg-slate-950/70">
          <CardContent className="space-y-3 p-4">
            <div className="grid gap-2 md:grid-cols-4">
              <select
                value={projectId}
                onChange={(e) => {
                  setPage(1)
                  setProjectId(e.target.value)
                }}
                className="h-9 rounded-xl border border-slate-200 bg-white px-3 text-xs font-bold dark:border-slate-700 dark:bg-slate-900"
              >
                <option value="">All projects</option>
                {projects.map((project) => (
                  <option key={project._id} value={project._id}>
                    {project.title}
                  </option>
                ))}
              </select>
              <select
                value={assigneeId}
                onChange={(e) => {
                  setPage(1)
                  setAssigneeId(e.target.value)
                }}
                className="h-9 rounded-xl border border-slate-200 bg-white px-3 text-xs font-bold dark:border-slate-700 dark:bg-slate-900"
              >
                <option value="">All assignees</option>
                {assignees.map((assignee) => (
                  <option key={assignee._id} value={assignee._id}>
                    {assignee.name}
                  </option>
                ))}
              </select>
              <select
                value={sort}
                onChange={(e) => {
                  setPage(1)
                  setSort(e.target.value as "created_desc" | "created_asc")
                }}
                className="h-9 rounded-xl border border-slate-200 bg-white px-3 text-xs font-bold dark:border-slate-700 dark:bg-slate-900"
              >
                <option value="created_desc">Newest to oldest</option>
                <option value="created_asc">Oldest to newest</option>
              </select>
              <select
                value={limit}
                onChange={(e) => {
                  setPage(1)
                  setLimit(Number(e.target.value))
                }}
                className="h-9 rounded-xl border border-slate-200 bg-white px-3 text-xs font-bold dark:border-slate-700 dark:bg-slate-900"
              >
                <option value={10}>10 / page</option>
                <option value={20}>20 / page</option>
                <option value={50}>50 / page</option>
              </select>
            </div>
            <div className="grid gap-2 md:grid-cols-4">
              <div className="relative">
                <CalendarRange className="pointer-events-none absolute top-1/2 left-3 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
                <input
                  type="date"
                  value={dateFrom}
                  onChange={(e) => {
                    setPage(1)
                    setDateFrom(e.target.value)
                  }}
                  className="h-9 w-full rounded-xl border border-slate-200 bg-white px-3 pl-8 text-xs font-bold dark:border-slate-700 dark:bg-slate-900"
                />
              </div>
              <div className="relative">
                <CalendarRange className="pointer-events-none absolute top-1/2 left-3 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
                <input
                  type="date"
                  value={dateTo}
                  onChange={(e) => {
                    setPage(1)
                    setDateTo(e.target.value)
                  }}
                  className="h-9 w-full rounded-xl border border-slate-200 bg-white px-3 pl-8 text-xs font-bold dark:border-slate-700 dark:bg-slate-900"
                />
              </div>
              <Button
                type="button"
                variant={mineOnly ? "default" : "outline"}
                className="h-9 rounded-xl text-xs font-bold"
                onClick={() => {
                  setPage(1)
                  setMineOnly((v) => !v)
                }}
              >
                <UserRound className="mr-1 h-3.5 w-3.5" />
                My tasks
              </Button>
              <Button
                type="button"
                variant={hasAttachmentsOnly ? "default" : "outline"}
                className="h-9 rounded-xl text-xs font-bold"
                onClick={() => {
                  setPage(1)
                  setHasAttachmentsOnly((v) => !v)
                }}
              >
                <Paperclip className="mr-1 h-3.5 w-3.5" />
                Has attachments
              </Button>
            </div>
            <div className="flex justify-end">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-8 rounded-lg text-xs"
                onClick={() => {
                  setPage(1)
                  setProjectId("")
                  setAssigneeId("")
                  setSort("created_desc")
                  setLimit(10)
                  setDateFrom("")
                  setDateTo("")
                  setMineOnly(false)
                  setHasAttachmentsOnly(false)
                }}
              >
                <X className="mr-1 h-3.5 w-3.5" />
                Reset filters
              </Button>
            </div>
          </CardContent>
        </Card>

        <div className="grid gap-4 md:grid-cols-4">
          <Card className="border-slate-200/60 bg-gradient-to-br from-slate-50 to-white dark:border-slate-800/60 dark:from-slate-900 dark:to-slate-950">
            <CardContent className="p-4">
              <p className="text-[10px] font-black tracking-wider text-slate-400 uppercase">
                Total
              </p>
              <p className="mt-1 text-2xl font-black">{stats.total}</p>
            </CardContent>
          </Card>
          <Card className="border-slate-200/60 bg-gradient-to-br from-slate-50 to-white dark:border-slate-800/60 dark:from-slate-900 dark:to-slate-950">
            <CardContent className="p-4">
              <p className="text-[10px] font-black tracking-wider text-slate-400 uppercase">
                To Do
              </p>
              <p className="mt-1 text-2xl font-black">{stats.todo}</p>
            </CardContent>
          </Card>
          <Card className="border-slate-200/60 bg-gradient-to-br from-blue-50/60 to-white dark:border-slate-800/60 dark:from-blue-950/20 dark:to-slate-950">
            <CardContent className="p-4">
              <p className="text-[10px] font-black tracking-wider text-slate-400 uppercase">
                In Progress
              </p>
              <p className="mt-1 text-2xl font-black">{stats.inProgress}</p>
            </CardContent>
          </Card>
          <Card className="border-slate-200/60 bg-gradient-to-br from-emerald-50/60 to-white dark:border-slate-800/60 dark:from-emerald-950/20 dark:to-slate-950">
            <CardContent className="p-4">
              <p className="text-[10px] font-black tracking-wider text-slate-400 uppercase">Done</p>
              <p className="mt-1 text-2xl font-black">{stats.done}</p>
            </CardContent>
          </Card>
        </div>

        <Card className="border-slate-200/60 dark:border-slate-800/60">
          <CardContent className="flex flex-col gap-4 p-4 md:flex-row md:items-center md:justify-between">
            <div className="min-w-0 flex-1 space-y-2">
              <div className="flex items-center gap-2 text-sm font-black">
                <BarChart3 className="h-4 w-4 text-blue-600" />
                Task status distribution
              </div>
              <div className="space-y-2">
                <div>
                  <div className="mb-1 flex items-center justify-between text-xs">
                    <span>To Do</span>
                    <span>{stats.todo}</span>
                  </div>
                  <div className="h-2 rounded-full bg-slate-100 dark:bg-slate-800">
                    <div
                      className="h-full rounded-full bg-slate-400"
                      style={{ width: `${stats.total ? (stats.todo / stats.total) * 100 : 0}%` }}
                    />
                  </div>
                </div>
                <div>
                  <div className="mb-1 flex items-center justify-between text-xs">
                    <span>In Progress</span>
                    <span>{stats.inProgress}</span>
                  </div>
                  <div className="h-2 rounded-full bg-slate-100 dark:bg-slate-800">
                    <div
                      className="h-full rounded-full bg-blue-500"
                      style={{
                        width: `${stats.total ? (stats.inProgress / stats.total) * 100 : 0}%`
                      }}
                    />
                  </div>
                </div>
                <div>
                  <div className="mb-1 flex items-center justify-between text-xs">
                    <span>Done</span>
                    <span>{stats.done}</span>
                  </div>
                  <div className="h-2 rounded-full bg-slate-100 dark:bg-slate-800">
                    <div
                      className="h-full rounded-full bg-emerald-500"
                      style={{ width: `${stats.total ? (stats.done / stats.total) * 100 : 0}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>
            <div className="flex flex-col items-center gap-3">
              <div className="relative">
                <div
                  className="h-28 w-28 rounded-full shadow-inner"
                  style={{
                    background: `conic-gradient(#10b981 ${
                      stats.total ? (stats.done / stats.total) * 100 : 0
                    }%, #3b82f6 0 ${
                      stats.total ? ((stats.done + stats.inProgress) / stats.total) * 100 : 0
                    }%, #94a3b8 0 100%)`
                  }}
                />
                <div className="absolute inset-3 flex items-center justify-center rounded-full bg-white dark:bg-slate-950">
                  <div className="text-center">
                    <p className="text-lg font-black text-slate-900 dark:text-white">
                      {stats.completionRate}%
                    </p>
                    <p className="text-[10px] font-bold tracking-wider text-slate-400 uppercase">
                      Done
                    </p>
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-2 text-[10px] font-bold">
                <div className="flex items-center gap-1 text-slate-500">
                  <span className="h-2 w-2 rounded-full bg-slate-400" />
                  To Do
                </div>
                <div className="flex items-center gap-1 text-blue-600">
                  <span className="h-2 w-2 rounded-full bg-blue-500" />
                  Progress
                </div>
                <div className="flex items-center gap-1 text-emerald-600">
                  <span className="h-2 w-2 rounded-full bg-emerald-500" />
                  Done
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="relative">
          <Search className="absolute top-1/2 left-4 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search tasks..."
            value={search}
            onChange={(e) => {
              setPage(1)
              setSearch(e.target.value)
            }}
            className="h-11 w-full rounded-2xl border border-slate-200/80 bg-white pr-4 pl-11 text-sm text-slate-900 placeholder-slate-400 shadow-sm transition outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-400/20 dark:border-slate-800 dark:bg-slate-900 dark:text-white"
          />
        </div>

        <Card className="border-slate-200/60 shadow-lg dark:border-slate-800/60">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-black tracking-widest uppercase">
              Tasks · Page {pagination.page} of {pagination.totalPages}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 pt-3">
            {loading ? (
              <div className="flex h-40 items-center justify-center">
                <Loader2 className="h-6 w-6 animate-spin text-slate-400" />
              </div>
            ) : tasks.length === 0 ? (
              <div className="py-16 text-center text-slate-400">
                <CircleDashed className="mx-auto mb-2 h-8 w-8" />
                No tasks found
              </div>
            ) : (
              tasks.map((task) => (
                <div
                  key={task._id}
                  className="block rounded-2xl border border-slate-100 bg-white/80 p-4 shadow-sm transition hover:border-blue-200 hover:bg-blue-50/40 hover:shadow-md dark:border-slate-800 dark:bg-slate-900/50 dark:hover:border-blue-900/50 dark:hover:bg-blue-950/10"
                >
                  <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                    <div className="min-w-0">
                      <div className="mb-1 flex items-center gap-2">
                        <Badge variant="outline" className="h-5 rounded-md px-1.5 text-[10px]">
                          {task.project?.title || "No project"}
                        </Badge>
                        {task.attachmentCount > 0 ? (
                          <Badge className="h-5 rounded-md border-0 bg-slate-200 px-1.5 text-[10px] font-bold text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                            <Paperclip className="mr-1 h-3 w-3" />
                            {task.attachmentCount}
                          </Badge>
                        ) : null}
                      </div>
                      <p className="truncate text-sm font-black text-slate-900 dark:text-white">
                        {task.title}
                      </p>
                      {task.description ? (
                        <p className="mt-2 line-clamp-2 text-xs text-slate-500">
                          {task.description}
                        </p>
                      ) : null}
                    </div>
                    <div className="flex flex-wrap items-center gap-2 md:justify-end">
                      <Badge
                        className={cn(
                          "border-0 text-[10px] font-black",
                          STATUS_STYLES[task.status]
                        )}
                      >
                        {task.status.replace("_", " ")}
                      </Badge>
                      <Badge
                        className={cn(
                          "border-0 text-[10px] font-black",
                          PRIORITY_STYLES[task.priority]
                        )}
                      >
                        {task.priority}
                      </Badge>
                    </div>
                  </div>
                  <div className="mt-3 flex flex-wrap items-center gap-4 text-xs text-slate-500">
                    <span className="inline-flex items-center gap-1">
                      <CalendarClock className="h-3.5 w-3.5" />
                      Created {formatDistanceToNow(new Date(task.createdAt), { addSuffix: true })}
                    </span>
                    {task.dueDate ? (
                      <span className="inline-flex items-center gap-1">
                        <CheckCircle2 className="h-3.5 w-3.5" />
                        Due {new Date(task.dueDate).toLocaleDateString()}
                      </span>
                    ) : null}
                    <span>Assignee: {getAssigneeLabel(task)}</span>
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      className="ml-auto h-7 rounded-lg px-2 text-[10px]"
                      onClick={(e) => {
                        e.stopPropagation()
                        setSelectedTask(task)
                        setTaskModalOpen(true)
                      }}
                    >
                      <Eye className="mr-1 h-3.5 w-3.5" />
                      Details
                    </Button>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-xs text-slate-500">
            Showing {(pagination.page - 1) * pagination.limit + (tasks.length > 0 ? 1 : 0)}-
            {(pagination.page - 1) * pagination.limit + tasks.length} of {pagination.total}
          </p>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              className="rounded-xl"
              onClick={() => {
                setPage((p) => Math.max(1, p - 1))
              }}
              disabled={page <= 1 || loading}
            >
              <ChevronLeft className="mr-1 h-4 w-4" />
              Prev
            </Button>
            {pageNumbers.map((p) => (
              <Button
                key={p}
                variant={p === page ? "default" : "outline"}
                size="sm"
                className="h-8 min-w-8 rounded-xl"
                onClick={() => {
                  setPage(p)
                }}
                disabled={loading}
              >
                {p}
              </Button>
            ))}
            <Button
              variant="outline"
              size="sm"
              className="rounded-xl"
              onClick={() => {
                setPage((p) => Math.min(pagination.totalPages, p + 1))
              }}
              disabled={page >= pagination.totalPages || loading}
            >
              Next
              <ChevronRight className="ml-1 h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
      <Dialog open={taskModalOpen} onOpenChange={setTaskModalOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{selectedTask?.title || "Task Details"}</DialogTitle>
            <DialogDescription>
              {selectedTask?.project?.title || "No project"} · {selectedTask?.status || "-"}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <p className="text-sm text-slate-600 dark:text-slate-300">
              {selectedTask?.description || "No description"}
            </p>
            <div className="grid grid-cols-2 gap-2 text-xs text-slate-500">
              <div>Priority: {selectedTask?.priority || "-"}</div>
              <div>Assignee: {selectedTask ? getAssigneeLabel(selectedTask) : "Unassigned"}</div>
              <div>
                Created:{" "}
                {selectedTask?.createdAt
                  ? new Date(selectedTask.createdAt).toLocaleDateString()
                  : "-"}
              </div>
              <div>
                Due:{" "}
                {selectedTask?.dueDate ? new Date(selectedTask.dueDate).toLocaleDateString() : "-"}
              </div>
            </div>
            <div className="space-y-2">
              <p className="text-[10px] font-black tracking-wider text-slate-500 uppercase">
                Attachments
              </p>
              {selectedTask?.attachments?.length ? (
                selectedTask.attachments.map((attachment, index) => (
                  <a
                    key={`${attachment.url}-${index}`}
                    href={attachment.url}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center justify-between rounded-lg border border-slate-200 px-3 py-2 text-xs hover:bg-slate-50 dark:border-slate-800 dark:hover:bg-slate-900"
                  >
                    <span className="truncate pr-2">{attachment.name}</span>
                    <span className="text-slate-400">Open</span>
                  </a>
                ))
              ) : (
                <p className="text-xs text-slate-400">No attachments</p>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setTaskModalOpen(false)
              }}
            >
              Close
            </Button>
            {selectedTask?.project?._id ? (
              <Link href={`/projects/${selectedTask.project._id}/tasks?taskId=${selectedTask._id}`}>
                <Button
                  onClick={() => {
                    setTaskModalOpen(false)
                  }}
                >
                  Open Task
                </Button>
              </Link>
            ) : null}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
