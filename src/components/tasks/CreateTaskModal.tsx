"use client"

import { format } from "date-fns"
import {
  Plus,
  Calendar as CalendarIcon,
  Package,
  Briefcase,
  Zap,
  Info,
  Target,
  Layers
} from "lucide-react"
import { useState, useEffect } from "react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { apiClient } from "@/lib/api/client"
import { cn } from "@/lib/utils"

interface CreateTaskModalProps {
  projectId?: string // Optional: if provided, creates a project task
  onTaskCreated?: () => void
  trigger?: React.ReactNode
}

export function CreateTaskModal({ projectId, onTaskCreated, trigger }: CreateTaskModalProps) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [projects, setProjects] = useState<any[]>([])
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    priority: "MEDIUM",
    status: "TODO",
    dueDate: undefined as Date | undefined,
    projectId: projectId || "personal"
  })

  // Fetch projects when dialog opens (for project selection)
  useEffect(() => {
    if (open && !projectId) {
      fetchProjects()
    }
  }, [open, projectId])

  const fetchProjects = async () => {
    try {
      const response = await apiClient.get("/api/projects")
      if (response.ok) {
        const data = await response.json()
        setProjects(data || [])
      }
    } catch (error) {
      console.error("Failed to fetch projects:", error)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.title.trim()) {
      toast.error("Please enter a task title")
      return
    }

    setLoading(true)
    try {
      let response

      if (formData.projectId === "personal") {
        // Create personal task
        response = await apiClient.post("/api/tasks", {
          title: formData.title,
          description: formData.description,
          priority: formData.priority,
          status: formData.status,
          dueDate: formData.dueDate?.toISOString()
        })
      } else {
        // Create project task
        response = await apiClient.post(`/api/projects/${formData.projectId}/tasks`, {
          title: formData.title,
          description: formData.description,
          priority: formData.priority,
          status: formData.status,
          dueDate: formData.dueDate?.toISOString()
        })
      }

      if (!response.ok) {
        throw new Error("Failed to create task")
      }

      toast.success("Task created successfully!")
      setOpen(false)
      setFormData({
        title: "",
        description: "",
        priority: "MEDIUM",
        status: "TODO",
        dueDate: undefined,
        projectId: projectId || "personal"
      })

      if (onTaskCreated) {
        onTaskCreated()
      }
    } catch (error) {
      console.error("Error creating task:", error)
      toast.error("Failed to create task. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  const isPersonalTask = formData.projectId === "personal"

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button
            size="lg"
            className="group relative h-14 gap-3 overflow-hidden rounded-2xl bg-slate-900 px-8 text-sm font-black tracking-widest text-white uppercase shadow-2xl transition-all hover:scale-105 dark:bg-white dark:text-slate-900"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-blue-600/20 to-indigo-600/20 opacity-0 transition-opacity group-hover:opacity-100" />
            <Plus className="h-5 w-5 stroke-[3]" />
            New Task
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="overflow-hidden rounded-[2.5rem] border-white/20 bg-white/95 p-0 shadow-2xl backdrop-blur-xl sm:max-w-[700px] dark:border-slate-800/50 dark:bg-slate-900/95">
        <div className="relative">
          {/* Premium Header Background */}
          <div className="absolute top-0 right-0 left-0 -z-10 h-32 bg-gradient-to-br from-blue-600/5 to-indigo-600/5" />
          <div className="absolute top-10 right-10 -z-10 h-32 w-32 rounded-full bg-blue-500/10 blur-3xl" />

          <DialogHeader className="p-10 pb-4">
            <div className="mb-4 flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-900 text-white shadow-xl dark:bg-white dark:text-slate-900">
                <Target className="h-6 w-6 stroke-[2.5]" />
              </div>
              <div>
                <DialogTitle className="text-3xl font-black tracking-tight uppercase">
                  Create Initiative
                </DialogTitle>
                <DialogDescription className="mt-1 text-[10px] font-black tracking-[0.2em] text-slate-400 uppercase">
                  {projectId
                    ? "Adding to specific project stream"
                    : "Personal or project-aligned objective"}
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-8 p-10 pt-0">
            <div className="grid gap-8">
              {/* Project Selection */}
              {!projectId && (
                <div className="space-y-3">
                  <Label
                    htmlFor="project"
                    className="px-1 text-[10px] font-black tracking-[0.2em] text-slate-400 uppercase"
                  >
                    Collaboration Stream
                  </Label>
                  <Select
                    value={formData.projectId}
                    onValueChange={(value) =>{  setFormData({ ...formData, projectId: value }); }}
                  >
                    <SelectTrigger
                      id="project"
                      className="h-14 rounded-2xl border-slate-100 bg-slate-50/50 px-6 font-bold focus:ring-blue-500/20 dark:border-slate-800 dark:bg-slate-950/50"
                    >
                      <SelectValue placeholder="Select task type" />
                    </SelectTrigger>
                    <SelectContent className="rounded-2xl border-slate-100 p-2 shadow-2xl">
                      <SelectItem value="personal" className="rounded-xl px-4 py-3 font-bold">
                        <div className="flex items-center gap-3">
                          <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-blue-50 dark:bg-blue-900/30">
                            <Info className="h-3 w-3 text-blue-600" />
                          </div>
                          Personal Task Flow
                        </div>
                      </SelectItem>
                      {projects.map((project) => (
                        <SelectItem
                          key={project._id}
                          value={project._id}
                          className="rounded-xl px-4 py-3 font-bold"
                        >
                          <div className="flex items-center gap-3">
                            <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-indigo-50 dark:bg-indigo-900/30">
                              <Layers className="h-3 w-3 text-indigo-600" />
                            </div>
                            {project.title}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {/* Title & Description Group */}
              <div className="space-y-6">
                <div className="space-y-3">
                  <Label
                    htmlFor="title"
                    className="px-1 text-[10px] font-black tracking-[0.2em] text-slate-400 uppercase"
                  >
                    Objective Title <span className="text-rose-500">*</span>
                  </Label>
                  <Input
                    id="title"
                    placeholder="What needs to be accomplished?"
                    value={formData.title}
                    onChange={(e) =>{  setFormData({ ...formData, title: e.target.value }); }}
                    className="h-14 rounded-2xl border-slate-100 bg-white px-6 text-lg font-bold transition-all placeholder:text-slate-300 focus:border-blue-500/30 focus:ring-blue-500/20 dark:border-slate-800 dark:bg-slate-950"
                    required
                  />
                </div>

                <div className="space-y-3">
                  <Label
                    htmlFor="description"
                    className="px-1 text-[10px] font-black tracking-[0.2em] text-slate-400 uppercase"
                  >
                    Operational Context
                  </Label>
                  <Textarea
                    id="description"
                    placeholder="Detailed description or requirements..."
                    value={formData.description}
                    onChange={(e) =>{  setFormData({ ...formData, description: e.target.value }); }}
                    rows={4}
                    className="resize-none rounded-[1.5rem] border-slate-100 bg-white px-6 py-4 font-medium transition-all focus:border-blue-500/30 focus:ring-blue-500/20 dark:border-slate-800 dark:bg-slate-950"
                  />
                </div>
              </div>

              {/* Meta Controls Row */}
              <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
                <div className="space-y-3">
                  <Label
                    htmlFor="priority"
                    className="px-1 text-[10px] font-black tracking-[0.2em] text-slate-400 uppercase"
                  >
                    Priority
                  </Label>
                  <Select
                    value={formData.priority}
                    onValueChange={(value) =>{  setFormData({ ...formData, priority: value }); }}
                  >
                    <SelectTrigger
                      id="priority"
                      className="h-12 rounded-xl border-slate-100 bg-slate-50/50 text-[10px] font-black tracking-widest uppercase dark:border-slate-800 dark:bg-slate-950/50"
                    >
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl border-slate-100 p-1 shadow-xl">
                      <SelectItem value="LOW" className="rounded-lg py-2 font-bold text-slate-500">
                        LOW
                      </SelectItem>
                      <SelectItem
                        value="MEDIUM"
                        className="rounded-lg py-2 font-bold text-blue-600"
                      >
                        MEDIUM
                      </SelectItem>
                      <SelectItem value="HIGH" className="rounded-lg py-2 font-bold text-amber-600">
                        HIGH
                      </SelectItem>
                      <SelectItem
                        value="URGENT"
                        className="rounded-lg py-2 font-bold text-rose-600"
                      >
                        URGENT
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-3">
                  <Label
                    htmlFor="status"
                    className="px-1 text-[10px] font-black tracking-[0.2em] text-slate-400 uppercase"
                  >
                    Initial Status
                  </Label>
                  <Select
                    value={formData.status}
                    onValueChange={(value) =>{  setFormData({ ...formData, status: value }); }}
                  >
                    <SelectTrigger
                      id="status"
                      className="h-12 rounded-xl border-slate-100 bg-slate-50/50 text-[10px] font-black tracking-widest uppercase dark:border-slate-800 dark:bg-slate-950/50"
                    >
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl border-slate-100 p-1 shadow-xl">
                      <SelectItem value="TODO" className="rounded-lg py-2 font-bold">
                        TO DO
                      </SelectItem>
                      <SelectItem value="IN_PROGRESS" className="rounded-lg py-2 font-bold">
                        IN PROGRESS
                      </SelectItem>
                      <SelectItem value="DONE" className="rounded-lg py-2 font-bold">
                        COMPLETED
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-3">
                  <Label
                    htmlFor="dueDate"
                    className="px-1 text-[10px] font-black tracking-[0.2em] text-slate-400 uppercase"
                  >
                    Deadline
                  </Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        id="dueDate"
                        variant="outline"
                        className={cn(
                          "h-12 w-full justify-start rounded-xl border-slate-100 bg-slate-50/50 px-4 text-[10px] font-black tracking-widest uppercase dark:border-slate-800 dark:bg-slate-950/50",
                          !formData.dueDate && "text-slate-400"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-3.5 w-3.5 stroke-[2.5]" />
                        {formData.dueDate
                          ? format(formData.dueDate, "MMM dd, yyyy")
                          : "SELECT DATE"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent
                      className="w-auto overflow-hidden rounded-[2rem] border-slate-100 p-0 shadow-2xl"
                      align="center"
                    >
                      <Calendar
                        mode="single"
                        selected={formData.dueDate}
                        onSelect={(date) =>{  setFormData({ ...formData, dueDate: date }); }}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>
              </div>
            </div>

            <DialogFooter className="flex items-center !justify-between pt-4 sm:!justify-between">
              <Button
                type="button"
                variant="ghost"
                onClick={() =>{  setOpen(false); }}
                disabled={loading}
                className="h-14 rounded-2xl px-8 text-[11px] font-black tracking-widest text-slate-400 uppercase transition-colors hover:text-rose-600"
              >
                Abandon
              </Button>
              <Button
                type="submit"
                disabled={loading}
                className="h-14 gap-3 rounded-2xl bg-slate-900 px-10 text-[11px] font-black tracking-widest text-white uppercase shadow-xl shadow-slate-200/50 transition-all hover:scale-105 active:scale-95 dark:bg-white dark:text-slate-900 dark:shadow-none"
              >
                {loading && <Zap className="h-4 w-4 animate-pulse fill-current" />}
                {loading ? "Initializing..." : "Commit Task"}
              </Button>
            </DialogFooter>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  )
}
