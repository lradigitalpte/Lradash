"use client"

import { format } from "date-fns"
import { Plus, Calendar as CalendarIcon, Package } from "lucide-react"
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

interface CreateTaskDialogProps {
  projectId: string
  workPackageId?: string // Optional: pre-select a work package
  onTaskCreated?: () => void
  trigger?: React.ReactNode
}

export function CreateTaskDialog({
  projectId,
  workPackageId,
  onTaskCreated,
  trigger
}: CreateTaskDialogProps) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [workPackages, setWorkPackages] = useState<any[]>([])
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    priority: "MEDIUM",
    status: "TODO",
    dueDate: undefined as Date | undefined,
    workPackageId: workPackageId || "none"
  })

  // Fetch work packages when dialog opens
  useEffect(() => {
    if (open) {
      fetchWorkPackages()
    }
  }, [open])

  const fetchWorkPackages = async () => {
    try {
      const response = await apiClient.get(`/api/projects/${projectId}/work-packages`)
      if (response.ok) {
        const data = await response.json()
        setWorkPackages(data || [])
      }
    } catch (error) {
      console.error("Failed to fetch work packages:", error)
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
      const response = await apiClient.post(`/api/projects/${projectId}/tasks`, {
        ...formData,
        dueDate: formData.dueDate?.toISOString(),
        workPackageId: formData.workPackageId === "none" ? undefined : formData.workPackageId
      })

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
        workPackageId: workPackageId || "none"
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

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button size="lg">
            <Plus className="mr-2 h-5 w-5" />
            Create Task
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Create New Task</DialogTitle>
          <DialogDescription>
            Add a new task to your project. Fill in the details below.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            {/* Title */}
            <div className="grid gap-2">
              <Label htmlFor="title">
                Title <span className="text-destructive">*</span>
              </Label>
              <Input
                id="title"
                placeholder="Enter task title"
                value={formData.title}
                onChange={(e) =>{  setFormData({ ...formData, title: e.target.value }); }}
                required
              />
            </div>

            {/* Description */}
            <div className="grid gap-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                placeholder="Enter task description (optional)"
                value={formData.description}
                onChange={(e) =>{  setFormData({ ...formData, description: e.target.value }); }}
                rows={4}
              />
            </div>

            {/* Work Package */}
            <div className="grid gap-2">
              <Label htmlFor="workPackage" className="flex items-center gap-2">
                <Package className="h-4 w-4" />
                Work Package (Optional)
              </Label>
              <Select
                value={formData.workPackageId}
                onValueChange={(value) =>{  setFormData({ ...formData, workPackageId: value }); }}
              >
                <SelectTrigger id="workPackage">
                  <SelectValue placeholder="Select a work package or leave empty" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None (Standalone Task)</SelectItem>
                  {workPackages.map((wp) => (
                    <SelectItem key={wp._id} value={wp._id}>
                      {wp.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                Link this task to a larger work package (feature/epic)
              </p>
            </div>

            {/* Priority and Status Row */}
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="priority">Priority</Label>
                <Select
                  value={formData.priority}
                  onValueChange={(value) =>{  setFormData({ ...formData, priority: value }); }}
                >
                  <SelectTrigger id="priority">
                    <SelectValue placeholder="Select priority" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="LOW">Low</SelectItem>
                    <SelectItem value="MEDIUM">Medium</SelectItem>
                    <SelectItem value="HIGH">High</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="status">Status</Label>
                <Select
                  value={formData.status}
                  onValueChange={(value) =>{  setFormData({ ...formData, status: value }); }}
                >
                  <SelectTrigger id="status">
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="TODO">To Do</SelectItem>
                    <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
                    <SelectItem value="DONE">Done</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Due Date */}
            <div className="grid gap-2">
              <Label htmlFor="dueDate">Due Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    id="dueDate"
                    variant="outline"
                    className={cn(
                      "justify-start text-left font-normal",
                      !formData.dueDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {formData.dueDate ? format(formData.dueDate, "PPP") : "Pick a date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
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

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() =>{  setOpen(false); }}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Creating..." : "Create Task"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
