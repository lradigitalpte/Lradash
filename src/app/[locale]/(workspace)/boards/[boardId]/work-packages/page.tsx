"use client"

import { format } from "date-fns"
import { Package, Plus, Search, X, Calendar, User, Trash2 } from "lucide-react"
import { useParams } from "next/navigation"
import { useEffect, useState } from "react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select"
import { cn } from "@/lib/utils"

interface WorkPackage {
  _id: string
  title: string
  description?: string
  status: "TODO" | "IN_PROGRESS" | "COMPLETED" | "ON_HOLD"
  priority: "LOW" | "MEDIUM" | "HIGH" | "URGENT"
  dueDate?: Date
  progress?: number
  owner: {
    name: string
    email: string
    avatar?: string
  }
  assignees?: Array<{
    name: string
    email: string
    avatar?: string
  }>
  createdAt: Date
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

export default function BoardWorkPackagesPage() {
  const params = useParams()
  const boardId = params.boardId as string
  const [workPackages, setWorkPackages] = useState<WorkPackage[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [isCreating, setIsCreating] = useState(false)
  const [openDialog, setOpenDialog] = useState(false)
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    priority: "MEDIUM",
    dueDate: ""
  })

  useEffect(() => {
    fetchWorkPackages()
  }, [boardId])

  const fetchWorkPackages = async () => {
    try {
      const accessToken = localStorage.getItem("accessToken")
      const response = await fetch(`/api/workpackages?boardId=${boardId}`, {
        headers: {
          Authorization: `Bearer ${accessToken}`
        }
      })

      if (response.ok) {
        const data = await response.json()
        setWorkPackages(data.workPackages || [])
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

    setIsCreating(true)
    try {
      const accessToken = localStorage.getItem("accessToken")
      const response = await fetch("/api/workpackages", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          title: formData.title,
          description: formData.description,
          priority: formData.priority,
          dueDate: formData.dueDate ? new Date(formData.dueDate).toISOString() : null,
          boardId
        })
      })

      if (response.ok) {
        const data = await response.json()
        setWorkPackages([...workPackages, data.workPackage])
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
      const accessToken = localStorage.getItem("accessToken")
      const response = await fetch(`/api/workpackages/${id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${accessToken}`
        }
      })

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

  const filteredPackages = workPackages.filter((wp) => {
    const matchesSearch = wp.title.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = statusFilter === "all" || wp.status === statusFilter
    return matchesSearch && matchesStatus
  })

  const statuses = {
    todo: workPackages.filter((wp) => wp.status === "TODO").length,
    inProgress: workPackages.filter((wp) => wp.status === "IN_PROGRESS").length,
    completed: workPackages.filter((wp) => wp.status === "COMPLETED").length
  }

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="animate-pulse text-slate-400">Loading work packages...</div>
      </div>
    )
  }

  return (
    <div className="min-h-full space-y-8 bg-slate-50/50 p-8 dark:bg-slate-950/50">
      {/* Header */}
      <div className="flex flex-col justify-between gap-6 md:flex-row md:items-end">
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-700 text-white shadow-lg shadow-blue-500/30">
              <Package className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-4xl font-black tracking-tighter text-slate-900 dark:text-white">
                Work Packages
              </h1>
              <p className="mt-1 text-[10px] font-black tracking-[0.2em] text-slate-400 uppercase">
                Organize & Track
              </p>
            </div>
          </div>
          <p className="mt-2 ml-16 max-w-2xl text-sm font-medium text-slate-500 italic dark:text-slate-400">
            High-level objectives and epics containing multiple operational tasks
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

      {/* Stats */}
      {workPackages.length > 0 && (
        <div className="grid grid-cols-3 gap-4">
          {[
            { label: "To Do", value: statuses.todo, color: "slate" },
            { label: "In Progress", value: statuses.inProgress, color: "blue" },
            { label: "Completed", value: statuses.completed, color: "emerald" }
          ].map((stat) => (
            <div
              key={stat.label}
              className={cn(
                "rounded-2xl border p-4 backdrop-blur-sm",
                stat.color === "slate" &&
                  "border-slate-200 bg-slate-50 dark:border-slate-800 dark:bg-slate-900/30",
                stat.color === "blue" &&
                  "border-blue-200 bg-blue-50 dark:border-blue-900/30 dark:bg-blue-950/20",
                stat.color === "emerald" &&
                  "border-emerald-200 bg-emerald-50 dark:border-emerald-900/30 dark:bg-emerald-950/20"
              )}
            >
              <p className="text-xs font-black tracking-widest text-slate-500 uppercase dark:text-slate-400">
                {stat.label}
              </p>
              <p
                className={cn(
                  "mt-2 text-3xl font-black",
                  stat.color === "slate" && "text-slate-900 dark:text-white",
                  stat.color === "blue" && "text-blue-600 dark:text-blue-400",
                  stat.color === "emerald" && "text-emerald-600 dark:text-emerald-400"
                )}
              >
                {stat.value}
              </p>
            </div>
          ))}
        </div>
      )}

      {/* Search & Filter */}
      {workPackages.length > 0 && (
        <div className="flex flex-col gap-4 md:flex-row md:items-center">
          <div className="relative flex-1">
            <Search className="absolute top-1/2 left-4 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <Input
              placeholder="Search work packages..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value)
              }}
              className="rounded-xl border-slate-200 pl-10 dark:border-slate-800"
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[180px] rounded-xl border-slate-200 dark:border-slate-800">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="TODO">To Do</SelectItem>
              <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
              <SelectItem value="COMPLETED">Completed</SelectItem>
              <SelectItem value="ON_HOLD">On Hold</SelectItem>
            </SelectContent>
          </Select>
        </div>
      )}

      {/* Work Packages Table */}
      {filteredPackages.length > 0 ? (
        <div className="overflow-hidden rounded-3xl border border-slate-200/60 bg-white/80 backdrop-blur-xl dark:border-slate-800/60 dark:bg-slate-950/80">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800">
                <th className="px-6 py-4 text-left text-xs font-black tracking-widest text-slate-500 uppercase dark:text-slate-400">
                  Title
                </th>
                <th className="px-6 py-4 text-left text-xs font-black tracking-widest text-slate-500 uppercase dark:text-slate-400">
                  Status
                </th>
                <th className="px-6 py-4 text-left text-xs font-black tracking-widest text-slate-500 uppercase dark:text-slate-400">
                  Priority
                </th>
                <th className="px-6 py-4 text-left text-xs font-black tracking-widest text-slate-500 uppercase dark:text-slate-400">
                  Owner
                </th>
                <th className="px-6 py-4 text-left text-xs font-black tracking-widest text-slate-500 uppercase dark:text-slate-400">
                  Due Date
                </th>
                <th className="px-6 py-4 text-right text-xs font-black tracking-widest text-slate-500 uppercase dark:text-slate-400">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredPackages.map((wp) => (
                <tr
                  key={wp._id}
                  className="border-b border-slate-100 transition-colors hover:bg-slate-50 dark:border-slate-800/50 dark:hover:bg-slate-900/50"
                >
                  <td className="px-6 py-4">
                    <div>
                      <p className="font-semibold text-slate-900 dark:text-white">{wp.title}</p>
                      {wp.description && (
                        <p className="mt-1 line-clamp-1 text-xs text-slate-500 dark:text-slate-400">
                          {wp.description}
                        </p>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={cn(
                        "inline-block rounded-lg px-3 py-1 text-xs font-bold",
                        STATUS_COLORS[wp.status].bg,
                        STATUS_COLORS[wp.status].text
                      )}
                    >
                      {STATUS_COLORS[wp.status].label}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={cn(
                        "text-sm font-semibold capitalize",
                        PRIORITY_COLORS[wp.priority]
                      )}
                    >
                      {wp.priority}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      {wp.owner.avatar ? (
                        <img
                          src={wp.owner.avatar}
                          alt={wp.owner.name}
                          className="h-6 w-6 rounded-full"
                        />
                      ) : (
                        <div className="flex h-6 w-6 items-center justify-center rounded-full bg-blue-600 text-xs font-bold text-white">
                          {wp.owner.name.charAt(0).toUpperCase()}
                        </div>
                      )}
                      <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                        {wp.owner.name}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    {wp.dueDate ? (
                      <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
                        <Calendar className="h-4 w-4" />
                        {format(new Date(wp.dueDate), "MMM dd, yyyy")}
                      </div>
                    ) : (
                      <span className="text-sm text-slate-400 italic">No date</span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button
                      onClick={async () => handleDeleteWorkPackage(wp._id)}
                      className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-rose-100 hover:text-rose-600 dark:hover:bg-rose-950/30"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="rounded-3xl border border-slate-200/60 bg-white/80 p-24 text-center backdrop-blur-xl dark:border-slate-800/60 dark:bg-slate-900/40">
          <div className="mx-auto mb-10 flex h-24 w-24 items-center justify-center rounded-2xl bg-slate-100 dark:bg-slate-800">
            <Package className="h-12 w-12 text-slate-300 dark:text-slate-600" />
          </div>
          <h3 className="mb-4 text-3xl font-black text-slate-900 dark:text-white">
            No Work Packages
          </h3>
          <p className="mx-auto mb-12 max-w-md text-slate-500 italic dark:text-slate-400">
            {searchTerm || statusFilter !== "all"
              ? "No work packages match your filters."
              : "No work packages have been created yet. Create your first package to organize major work items."}
          </p>
          {!searchTerm && statusFilter === "all" && (
            <Dialog open={openDialog} onOpenChange={setOpenDialog}>
              <DialogTrigger asChild>
                <Button className="rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-700 px-6 font-semibold text-white">
                  <Plus className="mr-2 h-4 w-4" />
                  Create First Work Package
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
          )}
        </div>
      )}
    </div>
  )
}
