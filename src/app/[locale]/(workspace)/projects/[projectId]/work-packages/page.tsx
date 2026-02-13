"use client"

import {
  Plus,
  Search,
  Filter as FilterIcon,
  Download,
  MoreHorizontal,
  Clock,
  CheckCircle2,
  Circle,
  ArrowLeft,
  Package,
  Info,
  Zap,
  Sparkles,
  Layers,
  Target,
  ArrowUpRight,
  ChevronRight,
  User,
  Calendar,
  Activity,
  FileDown
} from "lucide-react"
import Link from "next/link"
import { useParams } from "next/navigation"
import { useState, useEffect, useMemo } from "react"

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
import { CreateWorkPackageDialog } from "@/components/work-packages/CreateWorkPackageDialog"
import { WorkPackageHierarchyInfo } from "@/components/work-packages/WorkPackageHierarchyInfo"
import { apiClient } from "@/lib/api/client"
import { cn } from "@/lib/utils"

export default function WorkPackagesPage() {
  const params = useParams()
  const projectId = params?.projectId as string
  const locale = params?.locale as string
  const [project, setProject] = useState<any>(null)
  const [tasks, setTasks] = useState<any[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [filterStatus, setFilterStatus] = useState<string>("ALL")
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (projectId) {
      fetchProject()
    }
  }, [projectId])

  const fetchProject = async () => {
    try {
      setLoading(true)
      const response = await apiClient.get(`/api/projects/${projectId}`)
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
          <Package className="h-6 w-6 text-blue-600" />
        </div>
        <p className="font-sans text-[10px] font-black tracking-[0.2em] text-slate-400 uppercase">
          Loading Work Packages...
        </p>
      </div>
    )
  }

  return (
    <div className="min-h-full space-y-12 bg-slate-50/30 p-8 pb-32 font-sans dark:bg-slate-950/30">
      {/* 1. Navigation & Context */}
      <div className="flex items-center gap-4">
        <Link href={`/${locale}/projects/${projectId}`}>
          <Button
            variant="ghost"
            className="h-9 rounded-full border border-slate-200/50 px-4 text-xs font-bold tracking-widest text-slate-500 uppercase shadow-sm hover:bg-white dark:hover:bg-slate-900"
          >
            <ArrowLeft className="mr-2 h-3 w-3" />
            Back to Project
          </Button>
        </Link>
        <div className="mx-2 h-4 w-[1px] bg-slate-300" />
        <span className="text-[10px] font-black tracking-widest text-slate-400 uppercase">
          Workspace / Work Packages
        </span>
      </div>

      {/* 2. Package Hierarchy Section */}
      <div className="grid gap-8">
        <WorkPackageHierarchyInfo />
      </div>

      {/* 3. Premium Header Section */}
      <div className="flex flex-col justify-between gap-6 md:flex-row md:items-end">
        <div className="space-y-3">
          <div className="mb-1 flex items-center gap-3">
            <div className="flex h-12 w-12 transform items-center justify-center rounded-2xl bg-blue-600 text-white shadow-xl shadow-blue-500/20 transition-transform hover:scale-110">
              <Layers className="h-6 w-6" />
            </div>
            <Badge
              variant="outline"
              className="h-6 border-slate-200 bg-white px-2 text-[10px] font-black tracking-widest uppercase dark:bg-slate-900"
            >
              Deliverables
            </Badge>
          </div>
          <h1 className="text-4xl leading-tight font-black tracking-tight text-slate-900 dark:text-white">
            Work Packages
          </h1>
          <p className="max-w-2xl leading-relaxed font-medium text-slate-500 italic">
            Project deliverables and status for{" "}
            <span className="text-blue-600 underline decoration-blue-500/30 underline-offset-4">
              "{project?.title || "Project"}"
            </span>
          </p>
        </div>
        <div className="flex shrink-0 origin-bottom-right scale-110 items-center gap-3">
          <CreateWorkPackageDialog projectId={projectId} onWorkPackageCreated={fetchProject} />
        </div>
      </div>

      {/* 4. Filters & Actions */}
      <div className="sticky top-4 z-20 space-y-4 rounded-3xl border border-white/20 bg-white/70 p-4 shadow-2xl shadow-slate-200/40 backdrop-blur-xl dark:border-slate-800/50 dark:bg-slate-900/70 dark:shadow-none">
        <div className="flex flex-col gap-4 md:flex-row">
          <div className="group relative flex-1">
            <Search className="absolute top-1/2 left-4 h-4 w-4 -translate-y-1/2 text-slate-400 transition-colors group-focus-within:text-blue-500" />
            <Input
              placeholder="Search work packages by title..."
              value={searchQuery}
              onChange={(e) =>{  setSearchQuery(e.target.value); }}
              className="h-12 rounded-2xl border-none bg-slate-50 pl-12 text-sm font-medium transition-all placeholder:font-medium placeholder:italic focus:ring-4 focus:ring-blue-500/10 dark:bg-slate-950"
            />
          </div>
          <div className="flex shrink-0 gap-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="outline"
                  className="h-12 gap-2 rounded-2xl border-slate-100 bg-white px-6 font-bold dark:bg-slate-900"
                >
                  <FilterIcon className="h-4 w-4 text-blue-600" />
                  Filter:{" "}
                  <span className="text-blue-600">
                    {filterStatus === "ALL" ? "All Tasks" : filterStatus.replace("_", " ")}
                  </span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56 rounded-2xl border-slate-100 p-2 shadow-2xl">
                <DropdownMenuItem
                  onClick={() =>{  setFilterStatus("ALL"); }}
                  className="rounded-xl py-3 font-bold"
                >
                  All Tasks
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() =>{  setFilterStatus("TODO"); }}
                  className="rounded-xl py-3 font-bold"
                >
                  To Do
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() =>{  setFilterStatus("IN_PROGRESS"); }}
                  className="rounded-xl py-3 font-bold"
                >
                  In Progress
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() =>{  setFilterStatus("DONE"); }}
                  className="rounded-xl py-3 font-bold"
                >
                  Completed
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            <Button
              variant="outline"
              className="group h-12 gap-2 rounded-2xl border-slate-100 bg-white px-6 font-bold dark:bg-slate-900"
            >
              <FileDown className="h-4 w-4 transition-transform group-hover:translate-y-0.5" />
              Export Data
            </Button>
          </div>
        </div>
      </div>

      {/* 5. Progress Dashboard */}
      <div className="grid gap-6 md:grid-cols-4">
        {[
          {
            label: "Total Tasks",
            value: tasks.length,
            icon: Package,
            color: "blue",
            sub: "All packages"
          },
          {
            label: "To Do",
            value: tasks.filter((t) => t.status === "TODO").length,
            icon: Target,
            color: "slate",
            sub: "Awaiting start"
          },
          {
            label: "In Progress",
            value: tasks.filter((t) => t.status === "IN_PROGRESS" || t.status === "DOING").length,
            icon: Zap,
            color: "orange",
            sub: "Active tasks"
          },
          {
            label: "Completed",
            value: tasks.filter((t) => t.status === "DONE").length,
            icon: CheckCircle2,
            color: "green",
            sub: "Finished tasks"
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
                <div className="text-[10px] font-black tracking-widest text-slate-300 uppercase">
                  Stats
                </div>
              </div>
              <div className="mb-1 text-[10px] font-black tracking-[0.2em] text-slate-400 uppercase">
                {stat.label}
              </div>
              <div className="text-3xl font-black text-slate-900 tabular-nums dark:text-white">
                {stat.value}
              </div>
              <p className="mt-2 text-[9px] font-bold tracking-widest text-slate-400 uppercase">
                {stat.sub}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* 6. Work Package Table */}
      <Card className="overflow-hidden rounded-[2.5rem] border-none bg-white shadow-2xl shadow-slate-200/50 dark:bg-slate-900">
        <Table>
          <TableHeader className="h-16 bg-slate-50/50 dark:bg-slate-900/50">
            <TableRow className="border-b border-slate-100 dark:border-slate-800">
              <TableHead className="w-16 pl-8" />
              <TableHead className="text-[10px] font-black tracking-widest text-slate-400 uppercase">
                Package Title
              </TableHead>
              <TableHead className="text-[10px] font-black tracking-widest text-slate-400 uppercase">
                Status
              </TableHead>
              <TableHead className="text-[10px] font-black tracking-widest text-slate-400 uppercase">
                Assigned To
              </TableHead>
              <TableHead className="text-[10px] font-black tracking-widest text-slate-400 uppercase">
                Due Date
              </TableHead>
              <TableHead className="w-16 pr-8" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredTasks.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="py-32 text-center text-slate-400">
                  <div className="flex flex-col items-center gap-6">
                    <div className="flex h-20 w-20 items-center justify-center rounded-[2.5rem] bg-slate-50 text-slate-200 dark:bg-white/5">
                      <Package className="h-10 w-10" />
                    </div>
                    <div className="space-y-1">
                      <h3 className="text-2xl font-black text-slate-900 italic dark:text-white">
                        No Packages
                      </h3>
                      <p className="text-sm font-medium opacity-60">
                        No work packages found in this project.
                      </p>
                    </div>
                    <Link href={`/${locale}/projects/${projectId}/board`}>
                      <Button className="h-14 rounded-2xl bg-slate-900 px-8 font-black text-white shadow-xl transition-all hover:scale-105 dark:bg-white dark:text-slate-900">
                        Create First Work Package
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
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-slate-100 bg-white shadow-sm transition-transform group-hover:rotate-6 dark:border-slate-700 dark:bg-slate-800">
                      {getStatusIcon(task.status)}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col">
                      <span className="text-base font-black text-slate-900 transition-colors group-hover:text-blue-600 dark:text-white">
                        {task.title}
                      </span>
                      <div className="mt-0.5 flex items-center gap-2">
                        <Badge
                          variant="outline"
                          className="h-4 border-slate-100 bg-slate-50 px-2 text-[9px] font-black uppercase"
                        >
                          Verified
                        </Badge>
                        {task.description && (
                          <span className="max-w-[200px] truncate text-[10px] font-medium text-slate-400 italic">
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
                        statColor(task.status)
                      )}
                    >
                      {task.status?.replace("_", " ")}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {task.assignee ? (
                      <div className="flex items-center gap-3">
                        <Avatar className="h-10 w-10 rounded-2xl border-4 border-white shadow-xl transition-transform group-hover:scale-110 dark:border-slate-900">
                          <AvatarImage src={task.assignee.avatar} />
                          <AvatarFallback className="bg-slate-900 text-xs font-black text-white">
                            {task.assignee.name?.slice(0, 1).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex flex-col">
                          <span className="text-xs font-black text-slate-900 dark:text-white">
                            {task.assignee.name}
                          </span>
                          <span className="text-[9px] font-black tracking-widest text-slate-400 uppercase">
                            Assigned To
                          </span>
                        </div>
                      </div>
                    ) : (
                      <span className="text-[9px] font-black tracking-widest text-slate-300 uppercase italic">
                        Unassigned
                      </span>
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
                          Final SLA
                        </span>
                      </div>
                    ) : (
                      <span className="text-[9px] font-black tracking-widest text-slate-300 uppercase">
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
                          <ArrowUpRight className="h-4 w-4 text-blue-500 transition-transform group-hover:scale-125" />
                          Expand Analytics
                        </DropdownMenuItem>
                        <DropdownMenuItem className="gap-3 rounded-xl py-3 font-bold">
                          <User className="h-4 w-4 text-purple-500" />
                          Reassign Lead
                        </DropdownMenuItem>
                        <DropdownMenuSeparator className="my-2" />
                        <DropdownMenuItem className="gap-3 rounded-xl bg-rose-50/50 py-3 font-bold text-rose-600 hover:bg-rose-50">
                          <MoreHorizontal className="h-4 w-4" />
                          Purge Record
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

      {/* 7. Strategic Footer */}
      <div className="group relative flex items-center justify-between overflow-hidden rounded-[2.5rem] bg-slate-900 px-10 py-8 text-white shadow-2xl dark:bg-white dark:text-slate-900">
        <div className="absolute top-0 right-0 h-64 w-64 bg-blue-600/20 blur-[100px] transition-colors group-hover:bg-blue-600/40" />
        <div className="relative z-10 flex items-center gap-6">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-white/20 bg-white/10 backdrop-blur-md">
            <Sparkles className="h-6 w-6" />
          </div>
          <div className="space-y-1">
            <h4 className="text-xl font-black">Strategic Overview Established</h4>
            <p className="text-sm font-medium opacity-60">
              All work packages are automatically synchronized with the main project timeline and
              resource allocation maps.
            </p>
          </div>
        </div>
        <div className="relative z-10 shrink-0">
          <Button className="h-12 gap-2 rounded-xl bg-white px-8 font-black text-slate-900 transition-all hover:scale-105 dark:bg-slate-900 dark:text-white">
            View Blueprint
            <ArrowUpRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  )
}

function statColor(status: string) {
  switch (status) {
    case "DONE":
      return "bg-emerald-50 text-emerald-600 border-emerald-100"
    case "IN_PROGRESS":
    case "DOING":
      return "bg-blue-50 text-blue-600 border-blue-100"
    default:
      return "bg-slate-100 text-slate-500 border-slate-200"
  }
}
