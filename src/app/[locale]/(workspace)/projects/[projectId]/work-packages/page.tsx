"use client"

import { format } from "date-fns"
import {
  Package,
  Plus,
  Search,
  Calendar,
  Trash2,
  ArrowLeft,
  Badge as BadgeIcon,
  Layers,
  Target,
  Zap,
  CheckCircle2,
  Circle,
  MoreHorizontal,
  FileDown,
  FilterIcon,
  ArrowUpRight,
  User,
  Sparkles,
  Eye,
  UserCheck
} from "lucide-react"
import { useLocale } from "next-intl"
import Link from "next/link"
import { useParams } from "next/navigation"
import { useEffect, useState, useMemo } from "react"
import { toast } from "sonner"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from "@/components/ui/dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table"
import { ChangeOwnerDialog } from "@/components/work-packages/ChangeOwnerDialog"
import { EditWorkPackageDialog } from "@/components/work-packages/EditWorkPackageDialog"
import { ViewWorkPackageDialog } from "@/components/work-packages/ViewWorkPackageDialog"
import { apiClient } from "@/lib/api/client"
import { cn } from "@/lib/utils"

interface WorkPackage {
  _id: string
  title: string
  description?: string
  status: "TODO" | "IN_PROGRESS" | "COMPLETED" | "ON_HOLD"
  priority: "LOW" | "MEDIUM" | "HIGH" | "URGENT"
  dueDate?: Date
  progress?: number
  projectId?: string
  owner: {
    _id: string
    name: string
    email: string
    avatar?: string
  }
  assignees?: Array<{
    _id: string
    name: string
    email: string
    avatar?: string
  }>
  createdAt: Date
  updatedAt: Date
}

const STATUS_COLORS: Record<string, { bg: string; text: string; label: string }> = {
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

const PRIORITY_COLORS: Record<string, string> = {
  LOW: "text-slate-500",
  MEDIUM: "text-blue-500",
  HIGH: "text-orange-500",
  URGENT: "text-rose-500"
}

export default function ProjectWorkPackagesPage() {
  const params = useParams()
  const locale = useLocale()
  const projectId = params.projectId as string
  const [workPackages, setWorkPackages] = useState<WorkPackage[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [filterStatus, setFilterStatus] = useState<string>("ALL")
  const [isCreating, setIsCreating] = useState(false)
  const [openDialog, setOpenDialog] = useState(false)
  const [viewDialogOpen, setViewDialogOpen] = useState(false)
  const [changeOwnerDialogOpen, setChangeOwnerDialogOpen] = useState(false)
  const [selectedWorkPackage, setSelectedWorkPackage] = useState<WorkPackage | null>(null)
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    priority: "MEDIUM",
    dueDate: ""
  })

  useEffect(() => {
    fetchWorkPackages()
  }, [projectId])

  const fetchWorkPackages = async () => {
    try {
      // Make sure we're on the client side before making API calls
      if (typeof window === "undefined") {
        setLoading(false)
        return
      }

      const response = await apiClient.get(`/api/projects/${projectId}/work-packages`)

      if (response.ok) {
        const data = await response.json()
        setWorkPackages(Array.isArray(data) ? data : [])
      } else {
        toast.error("Failed to fetch work packages")
      }
    } catch (error) {
      console.error("Error fetching work packages:", error)
      toast.error("Failed to load work packages")
    } finally {
      setLoading(false)
    }
  }

  const handleCreateWorkPackage = async () => {
    if (!formData.title.trim()) {
      toast.error("Title is required")
      return
    }

    // Make sure we're on the client side before making API calls
    if (typeof window === "undefined") {
      toast.error("Cannot create work package at this time")
      return
    }

    setIsCreating(true)
    try {
      const response = await apiClient.post(`/api/projects/${projectId}/work-packages`, {
        title: formData.title,
        description: formData.description,
        priority: formData.priority,
        dueDate: formData.dueDate ? new Date(formData.dueDate).toISOString() : null
      })

      if (response.ok) {
        const data = await response.json()
        setWorkPackages([...workPackages, data])
        setFormData({ title: "", description: "", priority: "MEDIUM", dueDate: "" })
        setOpenDialog(false)
        toast.success("Work package created successfully!")
      } else {
        toast.error("Failed to create work package")
      }
    } catch (error) {
      console.error("Error creating work package:", error)
      toast.error("Failed to create work package")
    } finally {
      setIsCreating(false)
    }
  }

  const handleDeleteWorkPackage = async (id: string) => {
    if (!confirm("Are you sure you want to delete this work package?")) {
      return
    }

    try {
      // Make sure we're on the client side before making API calls
      if (typeof window === "undefined") {
        toast.error("Cannot delete work package at this time")
        return
      }

      const response = await apiClient.delete(`/api/workpackages/${id}`)

      if (response.ok) {
        setWorkPackages(workPackages.filter((wp) => wp._id !== id))
        toast.success("Work package deleted successfully!")
      } else {
        toast.error("Failed to delete work package")
      }
    } catch (error) {
      console.error("Error deleting work package:", error)
      toast.error("Failed to delete work package")
    }
  }

  const filteredTasks = useMemo(() => {
    return workPackages.filter((task) => {
      const matchesSearch =
        task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        task.description?.toLowerCase().includes(searchQuery.toLowerCase())
      const matchesFilter = filterStatus === "ALL" || task.status === filterStatus
      return matchesSearch && matchesFilter
    })
  }, [workPackages, searchQuery, filterStatus])

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "COMPLETED":
        return <CheckCircle2 className="h-5 w-5 text-emerald-500" />
      case "IN_PROGRESS":
        return <Zap className="h-5 w-5 animate-pulse text-blue-500" />
      default:
        return <Circle className="h-5 w-5 text-slate-300" />
    }
  }

  const handleViewDetails = (wp: WorkPackage) => {
    setSelectedWorkPackage({
      ...wp,
      projectId: projectId
    })
    setViewDialogOpen(true)
  }

  const handleChangeOwner = (wp: WorkPackage) => {
    setSelectedWorkPackage({
      ...wp,
      projectId: projectId
    })
    setChangeOwnerDialogOpen(true)
  }

  const handleOwnerChanged = () => {
    fetchWorkPackages()
  }

  if (loading && workPackages.length === 0) {
    return (
      <div className="flex min-h-96 flex-col items-center justify-center space-y-4 bg-slate-50/50 dark:bg-slate-950/50">
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
    <div className="relative min-h-screen w-full space-y-10 overflow-hidden bg-white p-8 pb-32 font-sans md:overflow-auto dark:bg-slate-950">
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
        <div className="mx-2 h-4 w-px bg-slate-300" />
        <span className="text-[10px] font-black tracking-widest text-slate-400 uppercase">
          Workspace / Work Packages
        </span>
      </div>

      {/* 2. Premium Header Section */}
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
              "{projectId}"
            </span>
          </p>
        </div>
        <Dialog open={openDialog} onOpenChange={setOpenDialog}>
          <DialogTrigger asChild>
            <Button className="h-12 gap-2 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-700 px-6 font-bold text-white shadow-lg shadow-blue-500/25">
              <Plus className="h-4 w-4" />
              New Package
            </Button>
          </DialogTrigger>
          <DialogContent className="rounded-3xl border-slate-200/60 bg-white/80 backdrop-blur-xl dark:border-slate-800/60 dark:bg-slate-950/80">
            <DialogHeader>
              <DialogTitle className="text-2xl font-black">Create Work Package</DialogTitle>
              <DialogDescription>
                Add a new work package to organize your project deliverables
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div>
                <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                  Title *
                </label>
                <Input
                  placeholder="Work package title"
                  value={formData.title}
                  onChange={(e) => {
                    setFormData({ ...formData, title: e.target.value })
                  }}
                  className="mt-2 rounded-xl border-slate-200 dark:border-slate-800"
                />
              </div>
              <div>
                <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                  Description
                </label>
                <textarea
                  placeholder="Describe your work package..."
                  value={formData.description}
                  onChange={(e) => {
                    setFormData({ ...formData, description: e.target.value })
                  }}
                  className="mt-2 w-full rounded-xl border border-slate-200 bg-white/60 p-3 text-sm dark:border-slate-800 dark:bg-slate-900/60"
                  rows={3}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                    Priority
                  </label>
                  <Select
                    value={formData.priority}
                    onValueChange={(value) => {
                      setFormData({ ...formData, priority: value })
                    }}
                  >
                    <SelectTrigger className="mt-2 rounded-xl border-slate-200 dark:border-slate-800">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="LOW">Low</SelectItem>
                      <SelectItem value="MEDIUM">Medium</SelectItem>
                      <SelectItem value="HIGH">High</SelectItem>
                      <SelectItem value="URGENT">Urgent</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                    Due Date
                  </label>
                  <input
                    type="date"
                    value={formData.dueDate}
                    onChange={(e) => {
                      setFormData({ ...formData, dueDate: e.target.value })
                    }}
                    className="mt-2 w-full rounded-xl border border-slate-200 bg-white/60 px-3 py-2 text-sm dark:border-slate-800 dark:bg-slate-900/60"
                  />
                </div>
              </div>
              <Button
                onClick={handleCreateWorkPackage}
                disabled={isCreating}
                className="w-full rounded-xl bg-gradient-to-r from-blue-600 to-indigo-700 font-semibold text-white"
              >
                {isCreating ? "Creating..." : "Create Work Package"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* 3. Filters & Actions */}
      <div className="sticky top-4 z-20 space-y-4 rounded-3xl border border-white/20 bg-white/70 p-4 shadow-2xl shadow-slate-200/40 backdrop-blur-xl dark:border-slate-800/50 dark:bg-slate-900/70 dark:shadow-none">
        <div className="flex flex-col gap-4 md:flex-row">
          <div className="group relative flex-1">
            <Search className="absolute top-1/2 left-4 h-4 w-4 -translate-y-1/2 text-slate-400 transition-colors group-focus-within:text-blue-500" />
            <Input
              placeholder="Search work packages by title..."
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
                  className="h-12 gap-2 rounded-2xl border-slate-100 bg-white px-6 font-bold dark:bg-slate-900"
                >
                  <FilterIcon className="h-4 w-4 text-blue-600" />
                  Filter:{" "}
                  <span className="text-blue-600">
                    {filterStatus === "ALL" ? "All Packages" : filterStatus.replace("_", " ")}
                  </span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56 rounded-2xl border-slate-100 p-2 shadow-2xl">
                <DropdownMenuItem
                  onClick={() => {
                    setFilterStatus("ALL")
                  }}
                  className="rounded-xl py-3 font-bold"
                >
                  All Packages
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => {
                    setFilterStatus("TODO")
                  }}
                  className="rounded-xl py-3 font-bold"
                >
                  To Do
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => {
                    setFilterStatus("IN_PROGRESS")
                  }}
                  className="rounded-xl py-3 font-bold"
                >
                  In Progress
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => {
                    setFilterStatus("COMPLETED")
                  }}
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

      {/* 4. Progress Dashboard */}
      <div className="grid gap-6 md:grid-cols-4">
        {[
          {
            label: "Total Packages",
            value: workPackages.length,
            icon: Package,
            color: "blue",
            sub: "All packages"
          },
          {
            label: "To Do",
            value: workPackages.filter((t) => t.status === "TODO").length,
            icon: Target,
            color: "slate",
            sub: "Awaiting start"
          },
          {
            label: "In Progress",
            value: workPackages.filter((t) => t.status === "IN_PROGRESS").length,
            icon: Zap,
            color: "orange",
            sub: "Active packages"
          },
          {
            label: "Completed",
            value: workPackages.filter((t) => t.status === "COMPLETED").length,
            icon: CheckCircle2,
            color: "green",
            sub: "Finished packages"
          }
        ].map((stat, idx) => (
          <Card
            key={idx}
            className="group overflow-hidden rounded-4xl border-none bg-white shadow-2xl shadow-slate-200/50 transition-all hover:-translate-y-1 dark:bg-slate-900 dark:shadow-none"
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

      {/* 5. Work Package Table */}
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
                Owner
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
                    <Dialog open={openDialog} onOpenChange={setOpenDialog}>
                      <DialogTrigger asChild>
                        <Button className="h-14 rounded-2xl bg-slate-900 px-8 font-black text-white shadow-xl transition-all hover:scale-105 dark:bg-white dark:text-slate-900">
                          Create First Work Package
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="rounded-3xl border-slate-200/60 bg-white/80 backdrop-blur-xl dark:border-slate-800/60 dark:bg-slate-950/80">
                        <DialogHeader>
                          <DialogTitle className="text-2xl font-black">
                            Create Work Package
                          </DialogTitle>
                          <DialogDescription>
                            Add a new work package to organize your project deliverables
                          </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4 py-4">
                          <div>
                            <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                              Title *
                            </label>
                            <Input
                              placeholder="Work package title"
                              value={formData.title}
                              onChange={(e) => {
                                setFormData({ ...formData, title: e.target.value })
                              }}
                              className="mt-2 rounded-xl border-slate-200 dark:border-slate-800"
                            />
                          </div>
                          <div>
                            <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                              Description
                            </label>
                            <textarea
                              placeholder="Describe your work package..."
                              value={formData.description}
                              onChange={(e) => {
                                setFormData({ ...formData, description: e.target.value })
                              }}
                              className="mt-2 w-full rounded-xl border border-slate-200 bg-white/60 p-3 text-sm dark:border-slate-800 dark:bg-slate-900/60"
                              rows={3}
                            />
                          </div>
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                                Priority
                              </label>
                              <Select
                                value={formData.priority}
                                onValueChange={(value) => {
                                  setFormData({ ...formData, priority: value })
                                }}
                              >
                                <SelectTrigger className="mt-2 rounded-xl border-slate-200 dark:border-slate-800">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="LOW">Low</SelectItem>
                                  <SelectItem value="MEDIUM">Medium</SelectItem>
                                  <SelectItem value="HIGH">High</SelectItem>
                                  <SelectItem value="URGENT">Urgent</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                            <div>
                              <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                                Due Date
                              </label>
                              <input
                                type="date"
                                value={formData.dueDate}
                                onChange={(e) => {
                                  setFormData({ ...formData, dueDate: e.target.value })
                                }}
                                className="mt-2 w-full rounded-xl border border-slate-200 bg-white/60 px-3 py-2 text-sm dark:border-slate-800 dark:bg-slate-900/60"
                              />
                            </div>
                          </div>
                          <Button
                            onClick={handleCreateWorkPackage}
                            disabled={isCreating}
                            className="w-full rounded-xl bg-gradient-to-r from-blue-600 to-indigo-700 font-semibold text-white"
                          >
                            {isCreating ? "Creating..." : "Create Work Package"}
                          </Button>
                        </div>
                      </DialogContent>
                    </Dialog>
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
                          <span className="max-w-50 truncate text-[10px] font-medium text-slate-400 italic">
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
                    {task.owner ? (
                      <div className="flex items-center gap-3">
                        <Avatar className="h-10 w-10 rounded-2xl border-4 border-white shadow-xl transition-transform group-hover:scale-110 dark:border-slate-900">
                          <AvatarImage src={task.owner.avatar} />
                          <AvatarFallback className="bg-slate-900 text-xs font-black text-white">
                            {task.owner.name?.slice(0, 1).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex flex-col">
                          <span className="text-xs font-black text-slate-900 dark:text-white">
                            {task.owner.name}
                          </span>
                          <span className="text-[9px] font-black tracking-widest text-slate-400 uppercase">
                            Owner
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
                          {format(new Date(task.dueDate), "MMM dd, yyyy")}
                        </span>
                        <span className="mt-0.5 text-[9px] font-black tracking-widest text-slate-300 uppercase">
                          Due Date
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
                        <DropdownMenuItem
                          onClick={() => {
                            handleViewDetails(task)
                          }}
                          className="group gap-3 rounded-xl py-3 font-bold"
                        >
                          <Eye className="h-4 w-4 text-blue-500 transition-transform group-hover:scale-125" />
                          View Details
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => {
                            handleChangeOwner(task)
                          }}
                          className="gap-3 rounded-xl py-3 font-bold"
                        >
                          <UserCheck className="h-4 w-4 text-purple-500" />
                          Change Owner
                        </DropdownMenuItem>
                        <DropdownMenuSeparator className="my-2" />
                        <DropdownMenuItem
                          onClick={async () => handleDeleteWorkPackage(task._id)}
                          className="gap-3 rounded-xl bg-rose-50/50 py-3 font-bold text-rose-600 hover:bg-rose-50"
                        >
                          <Trash2 className="h-4 w-4" />
                          Delete Package
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

      {/* 6. Strategic Footer */}
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

      {/* 7. View Details Dialog */}
      {selectedWorkPackage && (
        <ViewWorkPackageDialog
          open={viewDialogOpen}
          onOpenChange={setViewDialogOpen}
          workPackage={selectedWorkPackage}
          onPackageUpdated={handleOwnerChanged}
        />
      )}

      {/* 8. Change Owner Dialog */}
      {selectedWorkPackage && selectedWorkPackage.owner && (
        <ChangeOwnerDialog
          open={changeOwnerDialogOpen}
          onOpenChange={setChangeOwnerDialogOpen}
          workPackageId={selectedWorkPackage._id}
          currentOwner={selectedWorkPackage.owner}
          projectId={projectId}
          onOwnerChanged={handleOwnerChanged}
        />
      )}
    </div>
  )
}

function statColor(status: string) {
  switch (status) {
    case "COMPLETED":
      return "bg-emerald-50 text-emerald-600 border-emerald-100"
    case "IN_PROGRESS":
      return "bg-blue-50 text-blue-600 border-blue-100"
    default:
      return "bg-slate-100 text-slate-500 border-slate-200"
  }
}
