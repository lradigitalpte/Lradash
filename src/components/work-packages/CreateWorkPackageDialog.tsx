"use client"

import { format } from "date-fns"
import { Plus, Calendar as CalendarIcon, Package } from "lucide-react"
import { useState } from "react"
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

interface CreateWorkPackageDialogProps {
  projectId: string
  onWorkPackageCreated?: () => void
  trigger?: React.ReactNode
}

export function CreateWorkPackageDialog({
  projectId,
  onWorkPackageCreated,
  trigger
}: CreateWorkPackageDialogProps) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    priority: "MEDIUM",
    status: "TODO",
    startDate: undefined as Date | undefined,
    dueDate: undefined as Date | undefined,
    estimatedHours: ""
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.title.trim()) {
      toast.error("Please enter a work package title")
      return
    }

    setLoading(true)
    try {
      const response = await apiClient.post(`/api/projects/${projectId}/work-packages`, {
        ...formData,
        startDate: formData.startDate?.toISOString(),
        dueDate: formData.dueDate?.toISOString(),
        estimatedHours: formData.estimatedHours ? parseInt(formData.estimatedHours) : undefined
      })

      if (!response.ok) {
        throw new Error("Failed to create work package")
      }

      toast.success("Work package created successfully!")
      setOpen(false)
      setFormData({
        title: "",
        description: "",
        priority: "MEDIUM",
        status: "TODO",
        startDate: undefined,
        dueDate: undefined,
        estimatedHours: ""
      })

      if (onWorkPackageCreated) {
        onWorkPackageCreated()
      }
    } catch (error) {
      console.error("Error creating work package:", error)
      toast.error("Failed to create work package. Please try again.")
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
            New Work Package
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-[650px]">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <div className="rounded-lg bg-primary/10 p-2">
              <Package className="h-5 w-5 text-primary" />
            </div>
            <div>
              <DialogTitle>Create New Work Package</DialogTitle>
              <DialogDescription>
                A work package is a larger unit of work that can contain multiple tasks
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            {/* Title */}
            <div className="grid gap-2">
              <Label htmlFor="wp-title">
                Title <span className="text-destructive">*</span>
              </Label>
              <Input
                id="wp-title"
                placeholder="e.g., User Authentication System"
                value={formData.title}
                onChange={(e) =>{  setFormData({ ...formData, title: e.target.value }); }}
                required
              />
            </div>

            {/* Description */}
            <div className="grid gap-2">
              <Label htmlFor="wp-description">Description</Label>
              <Textarea
                id="wp-description"
                placeholder="Describe the scope and objectives of this work package..."
                value={formData.description}
                onChange={(e) =>{  setFormData({ ...formData, description: e.target.value }); }}
                rows={4}
              />
            </div>

            {/* Priority and Status Row */}
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="wp-priority">Priority</Label>
                <Select
                  value={formData.priority}
                  onValueChange={(value) =>{  setFormData({ ...formData, priority: value }); }}
                >
                  <SelectTrigger id="wp-priority">
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
                <Label htmlFor="wp-status">Status</Label>
                <Select
                  value={formData.status}
                  onValueChange={(value) =>{  setFormData({ ...formData, status: value }); }}
                >
                  <SelectTrigger id="wp-status">
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

            {/* Date Range */}
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="wp-startDate">Start Date</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      id="wp-startDate"
                      variant="outline"
                      className={cn(
                        "justify-start text-left font-normal",
                        !formData.startDate && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {formData.startDate ? format(formData.startDate, "PPP") : "Pick a date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={formData.startDate}
                      onSelect={(date) =>{  setFormData({ ...formData, startDate: date }); }}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="wp-dueDate">Due Date</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      id="wp-dueDate"
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

            {/* Estimated Hours */}
            <div className="grid gap-2">
              <Label htmlFor="wp-hours">Estimated Hours (optional)</Label>
              <Input
                id="wp-hours"
                type="number"
                min="0"
                placeholder="e.g., 40"
                value={formData.estimatedHours}
                onChange={(e) =>{  setFormData({ ...formData, estimatedHours: e.target.value }); }}
              />
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
              {loading ? "Creating..." : "Create Work Package"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
