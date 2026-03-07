"use client"

import { format } from "date-fns"
import { Plus, Calendar as CalendarIcon, Package, User } from "lucide-react"
import { useState, useEffect } from "react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import {
  Dialog,
  DialogContent,
  DialogDescription,
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

interface CreateTaskDialogProps {
  projectId?: string
  boardId?: string
  workPackageId?: string
  onTaskCreated?: () => void
  trigger?: React.ReactNode
}

export function CreateTaskDialog({
  projectId,
  boardId,
  workPackageId,
  onTaskCreated,
  trigger
}: CreateTaskDialogProps) {
  const isBoardTask = Boolean(boardId)
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [workPackages, setWorkPackages] = useState<any[]>([])
  const [members, setMembers] = useState<any[]>([])
  const [userProjects, setUserProjects] = useState<any[]>([])
  const [projectWorkPackages, setProjectWorkPackages] = useState<any[]>([])
  const [workPackageLinkSource, setWorkPackageLinkSource] = useState<
    "none" | "workspace" | "project"
  >("none")
  const [selectedProjectIdForWP, setSelectedProjectIdForWP] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    priority: "MEDIUM",
    status: "TODO",
    dueDate: undefined as Date | undefined,
    workPackageId: workPackageId || "none",
    assigneeId: "none"
  })

  useEffect(() => {
    if (open && !isBoardTask && projectId) {
      fetchWorkPackages(projectId)
      fetchMembers()
    }
  }, [open, isBoardTask, projectId])

  useEffect(() => {
    if (open && isBoardTask && boardId) {
      setFormData((prev) => ({ ...prev, workPackageId: "none" }))
      setWorkPackageLinkSource("none")
      setSelectedProjectIdForWP(null)
      setProjectWorkPackages([])
      fetchBoardWorkPackages()
      fetchUserProjects()
    }
  }, [open, isBoardTask, boardId])

  const fetchUserProjects = async () => {
    try {
      const response = await apiClient.get("/api/projects")
      if (response.ok) {
        const data = await response.json()
        setUserProjects(Array.isArray(data) ? data : (data?.projects ?? []))
      } else {
        setUserProjects([])
      }
    } catch (error) {
      console.error("Failed to fetch projects:", error)
      setUserProjects([])
    }
  }

  const fetchBoardWorkPackages = async () => {
    if (!boardId) return
    try {
      const response = await apiClient.get(
        `/api/workpackages?boardId=${encodeURIComponent(boardId)}`
      )
      if (response.ok) {
        const data = await response.json()
        const list = data?.workPackages ?? data
        setWorkPackages(Array.isArray(list) ? list : [])
      } else {
        setWorkPackages([])
      }
    } catch (error) {
      console.error("Failed to fetch board work packages:", error)
      setWorkPackages([])
    }
  }

  useEffect(() => {
    if (!selectedProjectIdForWP) {
      setProjectWorkPackages([])
      return
    }
    let cancelled = false
    const run = async () => {
      try {
        const response = await apiClient.get(
          `/api/projects/${selectedProjectIdForWP}/work-packages`
        )
        if (cancelled) return
        if (response.ok) {
          const data = await response.json()
          const list = Array.isArray(data) ? data : (data?.workPackages ?? data ?? [])
          setProjectWorkPackages(list)
        } else {
          setProjectWorkPackages([])
        }
      } catch {
        if (!cancelled) setProjectWorkPackages([])
      }
    }
    run()
    return () => {
      cancelled = true
    }
  }, [selectedProjectIdForWP])

  const fetchWorkPackages = async (projectIdToUse: string) => {
    if (!projectIdToUse) return
    try {
      const response = await apiClient.get(`/api/projects/${projectIdToUse}/work-packages`)
      if (response.ok) {
        const data = await response.json()
        setWorkPackages(Array.isArray(data) ? data : (data?.workPackages ?? data ?? []))
      }
    } catch (error) {
      console.error("Failed to fetch work packages:", error)
    }
  }

  const fetchMembers = async () => {
    if (!projectId) return
    try {
      const response = await apiClient.get(`/api/projects/${projectId}/members`)
      if (response.ok) {
        const data = await response.json()
        setMembers(Array.isArray(data) ? data : [])
      }
    } catch (error) {
      console.error("Failed to fetch members:", error)
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
      if (isBoardTask && boardId) {
        const wpId =
          workPackageLinkSource !== "none" &&
          formData.workPackageId &&
          formData.workPackageId !== "none"
            ? formData.workPackageId
            : undefined
        const response = await apiClient.post(`/api/boards/${boardId}/tasks`, {
          title: formData.title,
          description: formData.description,
          priority: formData.priority,
          status: formData.status,
          dueDate: formData.dueDate?.toISOString(),
          workPackageId: wpId
        })
        if (!response.ok) throw new Error("Failed to create task")
        toast.success("Task created!")
        setOpen(false)
        setFormData({ ...formData, title: "", description: "" })
        onTaskCreated?.()
      } else if (projectId) {
        const response = await apiClient.post(`/api/projects/${projectId}/tasks`, {
          ...formData,
          dueDate: formData.dueDate?.toISOString(),
          workPackageId: formData.workPackageId === "none" ? undefined : formData.workPackageId,
          assigneeId: formData.assigneeId === "none" ? undefined : formData.assigneeId
        })
        if (!response.ok) throw new Error("Failed to create task")
        toast.success("Task created successfully!")
        setOpen(false)
        setFormData({
          title: "",
          description: "",
          priority: "MEDIUM",
          status: "TODO",
          dueDate: undefined,
          workPackageId: workPackageId || "none",
          assigneeId: "none"
        })
        onTaskCreated?.()
      }
    } catch (error) {
      console.error("Error creating task:", error)
      toast.error("Failed to create task. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button className="h-12 gap-2 rounded-2xl bg-slate-900 px-6 font-black text-white shadow-xl hover:bg-slate-800 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-100">
            <Plus className="h-5 w-5" />
            Create Task
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="overflow-hidden rounded-[2rem] border-none p-0 shadow-2xl sm:max-w-[520px]">
        <div className="bg-gradient-to-br from-slate-900 to-slate-800 px-6 py-5 text-white dark:from-slate-800 dark:to-slate-900">
          <DialogHeader>
            <DialogTitle className="text-xl font-black tracking-tight">Create New Task</DialogTitle>
            <DialogDescription className="text-sm text-slate-300">
              {isBoardTask ? "Add a task to this workspace." : "Add a new task to your project."}
            </DialogDescription>
          </DialogHeader>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 bg-white p-6 dark:bg-slate-950">
            <div className="space-y-1">
              <Label
                htmlFor="title"
                className="text-[10px] font-black tracking-widest text-slate-400 uppercase"
              >
                Title <span className="text-destructive">*</span>
              </Label>
              <Input
                id="title"
                placeholder="Enter task title"
                value={formData.title}
                onChange={(e) =>{  setFormData({ ...formData, title: e.target.value }); }}
                required
                className="h-11 rounded-xl border-slate-200 bg-slate-50 dark:border-slate-800 dark:bg-slate-900"
              />
            </div>

            <div className="space-y-1">
              <Label
                htmlFor="description"
                className="text-[10px] font-black tracking-widest text-slate-400 uppercase"
              >
                Description
              </Label>
              <Textarea
                id="description"
                placeholder="Optional description"
                value={formData.description}
                onChange={(e) =>{  setFormData({ ...formData, description: e.target.value }); }}
                rows={3}
                className="rounded-xl border-slate-200 bg-slate-50 dark:border-slate-800 dark:bg-slate-900"
              />
            </div>

            {/* Work package: project context or board (workspace + project workflow) */}
            {!isBoardTask && (
              <div className="space-y-1">
                <Label
                  htmlFor="workPackage"
                  className="flex items-center gap-2 text-[10px] font-black tracking-widest text-slate-400 uppercase"
                >
                  <Package className="h-3.5 w-3.5" />
                  Work Package (Optional)
                </Label>
                <Select
                  value={formData.workPackageId}
                  onValueChange={(value) =>{  setFormData({ ...formData, workPackageId: value }); }}
                >
                  <SelectTrigger
                    id="workPackage"
                    className="h-11 rounded-xl border-slate-200 bg-slate-50 dark:border-slate-800 dark:bg-slate-900"
                  >
                    <SelectValue placeholder="Select or leave empty" />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl">
                    <SelectItem value="none">None (Standalone Task)</SelectItem>
                    {workPackages.map((wp) => (
                      <SelectItem key={wp._id} value={wp._id}>
                        {wp.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Board: link to workspace WP or project WP (move task to project workflow) */}
            {isBoardTask && (
              <div className="space-y-3 rounded-xl border border-slate-100 bg-slate-50/50 p-4 dark:border-slate-800 dark:bg-slate-900/30">
                <Label className="flex items-center gap-2 text-[10px] font-black tracking-widest text-slate-400 uppercase">
                  <Package className="h-3.5 w-3.5" />
                  Link to work package (optional)
                </Label>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Link this task to a workspace or project work package to connect it to a project
                  you’re part of.
                </p>
                <div className="space-y-2">
                  <Select
                    value={
                      workPackageLinkSource === "project" && selectedProjectIdForWP
                        ? `project:${selectedProjectIdForWP}`
                        : workPackageLinkSource
                    }
                    onValueChange={(value) => {
                      if (value === "none" || value === "workspace") {
                        setWorkPackageLinkSource(value)
                        setSelectedProjectIdForWP(null)
                        setFormData((prev) => ({ ...prev, workPackageId: "none" }))
                      } else if (value.startsWith("project:")) {
                        const id = value.replace(/^project:/, "")
                        setWorkPackageLinkSource("project")
                        setSelectedProjectIdForWP(id)
                        setFormData((prev) => ({ ...prev, workPackageId: "none" }))
                      }
                    }}
                  >
                    <SelectTrigger className="h-11 rounded-xl border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-900">
                      <SelectValue placeholder="Choose source" />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl">
                      <SelectItem value="none">None</SelectItem>
                      <SelectItem value="workspace">This workspace</SelectItem>
                      {userProjects.map((p) => (
                        <SelectItem key={p._id} value={`project:${p._id}`}>
                          Project: {p.title ?? p.name ?? p._id}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {(workPackageLinkSource === "workspace" ||
                    (workPackageLinkSource === "project" && selectedProjectIdForWP)) && (
                    <Select
                      value={formData.workPackageId}
                      onValueChange={(value) =>{ 
                        setFormData((prev) => ({ ...prev, workPackageId: value })); }
                      }
                    >
                      <SelectTrigger className="h-11 rounded-xl border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-900">
                        <SelectValue placeholder="Select work package" />
                      </SelectTrigger>
                      <SelectContent className="rounded-xl">
                        <SelectItem value="none">None</SelectItem>
                        {workPackageLinkSource === "workspace" &&
                          workPackages.map((wp) => (
                            <SelectItem key={wp._id} value={wp._id}>
                              {wp.title}
                            </SelectItem>
                          ))}
                        {workPackageLinkSource === "project" &&
                          projectWorkPackages.map((wp) => (
                            <SelectItem key={wp._id} value={wp._id}>
                              {wp.title}
                            </SelectItem>
                          ))}
                      </SelectContent>
                    </Select>
                  )}
                </div>
              </div>
            )}

            {!isBoardTask && (
              <>
                <div className="space-y-1">
                  <Label
                    htmlFor="assignee"
                    className="flex items-center gap-2 text-[10px] font-black tracking-widest text-slate-400 uppercase"
                  >
                    <User className="h-3.5 w-3.5" />
                    Assign To
                  </Label>
                  <Select
                    value={formData.assigneeId}
                    onValueChange={(value) =>{  setFormData({ ...formData, assigneeId: value }); }}
                  >
                    <SelectTrigger
                      id="assignee"
                      className="h-11 rounded-xl border-slate-200 bg-slate-50 dark:border-slate-800 dark:bg-slate-900"
                    >
                      <SelectValue placeholder="Select a team member" />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl">
                      <SelectItem value="none">Unassigned</SelectItem>
                      {members.map((member) => (
                        <SelectItem key={member._id || member.id} value={member._id || member.id}>
                          {member.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <Label
                  htmlFor="priority"
                  className="text-[10px] font-black tracking-widest text-slate-400 uppercase"
                >
                  Priority
                </Label>
                <Select
                  value={formData.priority}
                  onValueChange={(value) =>{  setFormData({ ...formData, priority: value }); }}
                >
                  <SelectTrigger
                    id="priority"
                    className="h-11 rounded-xl border-slate-200 bg-slate-50 dark:border-slate-800 dark:bg-slate-900"
                  >
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl">
                    <SelectItem value="LOW">Low</SelectItem>
                    <SelectItem value="MEDIUM">Medium</SelectItem>
                    <SelectItem value="HIGH">High</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label
                  htmlFor="status"
                  className="text-[10px] font-black tracking-widest text-slate-400 uppercase"
                >
                  Status
                </Label>
                <Select
                  value={formData.status}
                  onValueChange={(value) =>{  setFormData({ ...formData, status: value }); }}
                >
                  <SelectTrigger
                    id="status"
                    className="h-11 rounded-xl border-slate-200 bg-slate-50 dark:border-slate-800 dark:bg-slate-900"
                  >
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl">
                    <SelectItem value="TODO">To Do</SelectItem>
                    <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
                    <SelectItem value="DONE">Done</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-1">
              <Label className="text-[10px] font-black tracking-widest text-slate-400 uppercase">
                Due Date
              </Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    id="dueDate"
                    variant="outline"
                    className={cn(
                      "h-11 w-full justify-start rounded-xl border-slate-200 bg-slate-50 text-left font-medium dark:border-slate-800 dark:bg-slate-900",
                      !formData.dueDate && "text-slate-500"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {formData.dueDate ? format(formData.dueDate, "PPP") : "Pick a date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto rounded-xl p-0" align="start">
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

          <div className="flex justify-end gap-3 border-t border-slate-100 bg-white px-6 py-4 dark:border-slate-800 dark:bg-slate-950">
            <Button
              type="button"
              variant="ghost"
              onClick={() =>{  setOpen(false); }}
              disabled={loading}
              className="rounded-xl font-bold"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={loading}
              className="h-11 rounded-xl bg-slate-900 px-6 font-black text-white hover:bg-slate-800 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-100"
            >
              {loading ? "Creating…" : "Create Task"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
