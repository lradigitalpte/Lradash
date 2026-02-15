"use client"

import { format } from "date-fns"
import { Package, Loader2, Save } from "lucide-react"
import { useState, useEffect } from "react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { apiClient } from "@/lib/api/client"

interface WorkPackage {
  _id: string
  title: string
  description?: string
  status: "TODO" | "IN_PROGRESS" | "COMPLETED" | "ON_HOLD"
  priority: "LOW" | "MEDIUM" | "HIGH" | "URGENT"
  dueDate?: Date | string
  progress?: number
  projectId: string
}

interface EditWorkPackageDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  workPackage?: (WorkPackage & { projectId?: string }) | null
  onPackageUpdated: () => void
}

export function EditWorkPackageDialog({
  open,
  onOpenChange,
  workPackage,
  onPackageUpdated
}: EditWorkPackageDialogProps) {
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    status: "TODO" as const,
    priority: "MEDIUM" as const,
    dueDate: ""
  })

  // Update form data when work package changes
  useEffect(() => {
    if (workPackage) {
      setFormData({
        title: workPackage.title,
        description: workPackage.description || "",
        status: workPackage.status as typeof formData.status,
        priority: workPackage.priority as typeof formData.priority,
        dueDate: workPackage.dueDate ? format(new Date(workPackage.dueDate), "yyyy-MM-dd") : ""
      })
    }
  }, [workPackage])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.title.trim()) {
      toast.error("Title is required")
      return
    }

    setLoading(true)
    try {
      const response = await apiClient.put(`/api/workpackages/${workPackage?._id}`, {
        title: formData.title,
        description: formData.description,
        status: formData.status,
        priority: formData.priority,
        dueDate: formData.dueDate ? new Date(formData.dueDate).toISOString() : null,
        progress: workPackage?.progress || 0
      })

      if (response.ok) {
        toast.success("Work package updated successfully!")
        onPackageUpdated()
        onOpenChange(false)
      } else {
        toast.error("Failed to update work package")
      }
    } catch (error) {
      console.error("Error updating work package:", error)
      toast.error("Failed to update work package")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="overflow-hidden rounded-[2.5rem] border-white/20 bg-white/95 p-0 shadow-2xl backdrop-blur-xl sm:max-w-[600px] dark:border-slate-800/50 dark:bg-slate-900/95">
        <div className="relative">
          {/* Premium Header Background */}
          <div className="absolute top-0 right-0 left-0 -z-10 h-32 bg-gradient-to-br from-indigo-600/5 to-purple-600/5" />
          <div className="absolute top-10 right-10 -z-10 h-32 w-32 rounded-full bg-indigo-500/10 blur-3xl" />

          <DialogHeader className="p-10 pb-4">
            <div className="mb-4 flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-900 text-white shadow-xl dark:bg-white dark:text-slate-900">
                <Package className="h-6 w-6 stroke-[2.5]" />
              </div>
              <div>
                <DialogTitle className="text-3xl font-black tracking-tight uppercase">
                  Edit Package
                </DialogTitle>
                <DialogDescription className="mt-1 text-[10px] font-black tracking-[0.2em] text-slate-400 uppercase">
                  Update work package details
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-6 px-10 pb-4">
            {/* Title */}
            <div className="space-y-3">
              <Label
                htmlFor="title"
                className="px-1 text-[10px] font-black tracking-[0.2em] text-slate-400 uppercase"
              >
                Title <span className="text-rose-500">*</span>
              </Label>
              <Input
                id="title"
                placeholder="Enter work package title"
                value={formData.title}
                onChange={(e) => {
                  setFormData({ ...formData, title: e.target.value })
                }}
                className="h-14 rounded-2xl border-slate-100 bg-slate-50/50 px-6 text-base font-bold transition-all focus:border-indigo-500/50 focus:ring-4 focus:ring-indigo-500/10 dark:border-slate-800 dark:bg-slate-950/50"
                required
              />
            </div>

            {/* Description */}
            <div className="space-y-3">
              <Label
                htmlFor="description"
                className="px-1 text-[10px] font-black tracking-[0.2em] text-slate-400 uppercase"
              >
                Description
              </Label>
              <Textarea
                id="description"
                placeholder="Describe your work package..."
                value={formData.description}
                onChange={(e) => {
                  setFormData({ ...formData, description: e.target.value })
                }}
                rows={4}
                className="resize-none rounded-[1.5rem] border-slate-100 bg-white px-6 py-4 font-medium transition-all focus:border-indigo-500/30 focus:ring-4 focus:ring-indigo-500/10 dark:border-slate-800 dark:bg-slate-950"
              />
            </div>

            {/* Status & Priority Row */}
            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-3">
                <Label
                  htmlFor="status"
                  className="px-1 text-[10px] font-black tracking-[0.2em] text-slate-400 uppercase"
                >
                  Status
                </Label>
                <Select
                  value={formData.status}
                  onValueChange={(value: any) => {
                    setFormData({ ...formData, status: value })
                  }}
                >
                  <SelectTrigger
                    id="status"
                    className="h-12 rounded-2xl border-slate-100 bg-slate-50/50 px-6 text-[10px] font-black tracking-widest uppercase focus:ring-indigo-500/20 dark:border-slate-800 dark:bg-slate-950/50"
                  >
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="rounded-2xl border-slate-100 p-2 shadow-2xl">
                    <SelectItem value="TODO" className="rounded-xl px-4 py-3 font-bold">
                      To Do
                    </SelectItem>
                    <SelectItem value="IN_PROGRESS" className="rounded-xl px-4 py-3 font-bold">
                      In Progress
                    </SelectItem>
                    <SelectItem value="ON_HOLD" className="rounded-xl px-4 py-3 font-bold">
                      On Hold
                    </SelectItem>
                    <SelectItem value="COMPLETED" className="rounded-xl px-4 py-3 font-bold">
                      Completed
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-3">
                <Label
                  htmlFor="priority"
                  className="px-1 text-[10px] font-black tracking-[0.2em] text-slate-400 uppercase"
                >
                  Priority
                </Label>
                <Select
                  value={formData.priority}
                  onValueChange={(value: any) => {
                    setFormData({ ...formData, priority: value })
                  }}
                >
                  <SelectTrigger
                    id="priority"
                    className="h-12 rounded-2xl border-slate-100 bg-slate-50/50 px-6 text-[10px] font-black tracking-widest uppercase focus:ring-indigo-500/20 dark:border-slate-800 dark:bg-slate-950/50"
                  >
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="rounded-2xl border-slate-100 p-2 shadow-2xl">
                    <SelectItem
                      value="LOW"
                      className="rounded-xl px-4 py-3 font-bold text-slate-500"
                    >
                      Low
                    </SelectItem>
                    <SelectItem
                      value="MEDIUM"
                      className="rounded-xl px-4 py-3 font-bold text-blue-600"
                    >
                      Medium
                    </SelectItem>
                    <SelectItem
                      value="HIGH"
                      className="rounded-xl px-4 py-3 font-bold text-orange-600"
                    >
                      High
                    </SelectItem>
                    <SelectItem
                      value="URGENT"
                      className="rounded-xl px-4 py-3 font-bold text-rose-600"
                    >
                      Urgent
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Due Date */}
            <div className="space-y-3">
              <Label
                htmlFor="dueDate"
                className="px-1 text-[10px] font-black tracking-[0.2em] text-slate-400 uppercase"
              >
                Due Date
              </Label>
              <Input
                id="dueDate"
                type="date"
                value={formData.dueDate}
                onChange={(e) => {
                  setFormData({ ...formData, dueDate: e.target.value })
                }}
                className="h-12 rounded-2xl border-slate-100 bg-slate-50/50 px-6 text-sm font-medium focus:ring-indigo-500/20 dark:border-slate-800 dark:bg-slate-950/50"
              />
            </div>

            {/* Actions */}
            <DialogFooter className="flex items-center !justify-between px-0 pt-4 sm:!justify-between">
              <Button
                type="button"
                variant="ghost"
                onClick={() => {
                  onOpenChange(false)
                }}
                disabled={loading}
                className="h-14 rounded-2xl px-8 text-[11px] font-black tracking-widest text-slate-400 uppercase transition-colors hover:text-rose-600"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={loading}
                className="h-14 gap-3 rounded-2xl bg-slate-900 px-10 text-[11px] font-black tracking-widest text-white uppercase shadow-xl shadow-slate-200/50 transition-all hover:scale-105 active:scale-95 dark:bg-white dark:text-slate-900 dark:shadow-none"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4" />
                    Save Changes
                  </>
                )}
              </Button>
            </DialogFooter>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  )
}
