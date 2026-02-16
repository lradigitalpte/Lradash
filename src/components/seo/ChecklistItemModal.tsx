"use client"

import { Loader2, Plus, Pencil } from "lucide-react"
import { useState, useEffect } from "react"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
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

interface ChecklistItem {
  _id?: string
  title: string
  description: string
  category: "research" | "onpage" | "technical" | "content" | "links"
  notes?: string
  completed?: boolean
}

interface ChecklistItemModalProps {
  projectId: string
  open: boolean
  onOpenChange: (open: boolean) => void
  onSave: () => void
  item?: ChecklistItem | null
  mode: "create" | "edit"
}

const CATEGORIES = [
  { value: "research", label: "Keyword Research", icon: "🔍" },
  { value: "onpage", label: "On-Page SEO", icon: "📄" },
  { value: "technical", label: "Technical SEO", icon: "⚡" },
  { value: "content", label: "Content Strategy", icon: "🎯" },
  { value: "links", label: "Link Building", icon: "🔗" }
]

export function ChecklistItemModal({
  projectId,
  open,
  onOpenChange,
  onSave,
  item,
  mode
}: ChecklistItemModalProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [formData, setFormData] = useState<ChecklistItem>({
    title: "",
    description: "",
    category: "research",
    notes: ""
  })

  useEffect(() => {
    if (item && mode === "edit") {
      setFormData({
        title: item.title,
        description: item.description,
        category: item.category,
        notes: item.notes || ""
      })
    } else if (mode === "create") {
      setFormData({
        title: "",
        description: "",
        category: "research",
        notes: ""
      })
    }
  }, [item, mode, open])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.title.trim() || !formData.description.trim()) {
      setError("Title and description are required")
      return
    }

    setLoading(true)
    setError(null)

    try {
      const url =
        mode === "create"
          ? `/api/projects/${projectId}/marketing/seo-checklist`
          : `/api/projects/${projectId}/marketing/seo-checklist/${item?._id}`

      const response =
        mode === "create"
          ? await apiClient.post(url, formData)
          : await apiClient.patch(url, formData)

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || "Failed to save item")
      }

      onSave()
      onOpenChange(false)

      // Reset form
      setFormData({
        title: "",
        description: "",
        category: "research",
        notes: ""
      })
    } catch (err) {
      console.error("Error saving checklist item:", err)
      setError(err instanceof Error ? err.message : "Failed to save item")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader className="sr-only">
          <DialogTitle>{mode === "create" ? "Add New Task" : "Edit Task"}</DialogTitle>
          <DialogDescription>
            {mode === "create"
              ? "Create a new checklist item to track your SEO progress"
              : "Update the details of this checklist item"}
          </DialogDescription>
        </DialogHeader>
        {/* Premium Header */}
        <div className="relative -mx-6 -mt-6 mb-8 overflow-hidden rounded-3xl bg-gradient-to-r from-teal-600 via-teal-500 to-cyan-600 p-8">
          <div className="absolute top-0 right-0 -mt-12 -mr-12 h-32 w-32 rounded-full bg-white/10 blur-2xl" />
          <div className="relative space-y-3">
            <div className="flex items-center gap-2">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/30 bg-white/20 shadow-lg backdrop-blur-xl">
                {mode === "create" ? (
                  <Plus className="h-5 w-5 text-white" />
                ) : (
                  <Pencil className="h-5 w-5 text-white" />
                )}
              </div>
              <span className="text-[10px] font-black tracking-[0.2em] text-teal-100 uppercase">
                SEO Checklist
              </span>
            </div>
            <h2 className="text-3xl font-black tracking-tighter text-white">
              {mode === "create" ? "Add New Task" : "Edit Task"}
            </h2>
            <p className="max-w-xl text-sm font-medium text-teal-100">
              {mode === "create"
                ? "Create a new checklist item to track your SEO progress"
                : "Update the details of this checklist item"}
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Error Message */}
          {error && (
            <div className="rounded-3xl border border-rose-200/50 bg-rose-50/80 p-4 shadow-lg shadow-rose-200/30 backdrop-blur-xl dark:border-rose-900/30 dark:bg-rose-950/20 dark:shadow-none">
              <p className="text-sm font-semibold text-rose-700 dark:text-rose-300">⚠️ {error}</p>
            </div>
          )}

          {/* Title Field */}
          <div className="space-y-2">
            <Label htmlFor="title" className="text-xs font-black tracking-wider uppercase">
              Task Title
            </Label>
            <Input
              id="title"
              placeholder="e.g., Optimize Title Tags"
              value={formData.title}
              onChange={(e) =>{  setFormData({ ...formData, title: e.target.value }); }}
              disabled={loading}
              className="h-11 rounded-2xl border-slate-200/50 bg-white/50 text-base font-medium placeholder:text-slate-400 focus:border-teal-400 focus:ring-teal-400/20 dark:border-slate-800/50 dark:bg-slate-900/50"
            />
          </div>

          {/* Category Field */}
          <div className="space-y-2">
            <Label htmlFor="category" className="text-xs font-black tracking-wider uppercase">
              Category
            </Label>
            <Select
              value={formData.category}
              onValueChange={(value) =>{ 
                setFormData({ ...formData, category: value as ChecklistItem["category"] }); }
              }
              disabled={loading}
            >
              <SelectTrigger className="h-11 rounded-2xl border-slate-200/50 bg-white/50 text-base font-medium focus:border-teal-400 focus:ring-teal-400/20 dark:border-slate-800/50 dark:bg-slate-900/50">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="rounded-2xl">
                {CATEGORIES.map((cat) => (
                  <SelectItem key={cat.value} value={cat.value} className="text-base">
                    <span className="flex items-center gap-2">
                      <span>{cat.icon}</span>
                      <span>{cat.label}</span>
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Description Field */}
          <div className="space-y-2">
            <Label htmlFor="description" className="text-xs font-black tracking-wider uppercase">
              Description
            </Label>
            <Textarea
              id="description"
              placeholder="Describe what needs to be done..."
              value={formData.description}
              onChange={(e) =>{  setFormData({ ...formData, description: e.target.value }); }}
              disabled={loading}
              rows={3}
              className="resize-none rounded-2xl border-slate-200/50 bg-white/50 text-base font-medium placeholder:text-slate-400 focus:border-teal-400 focus:ring-teal-400/20 dark:border-slate-800/50 dark:bg-slate-900/50"
            />
          </div>

          {/* Notes Field */}
          <div className="space-y-2">
            <Label htmlFor="notes" className="text-xs font-black tracking-wider uppercase">
              Additional Notes (Optional)
            </Label>
            <Textarea
              id="notes"
              placeholder="Any additional context, links, or reminders..."
              value={formData.notes}
              onChange={(e) =>{  setFormData({ ...formData, notes: e.target.value }); }}
              disabled={loading}
              rows={3}
              className="resize-none rounded-2xl border-slate-200/50 bg-white/50 text-base font-medium placeholder:text-slate-400 focus:border-teal-400 focus:ring-teal-400/20 dark:border-slate-800/50 dark:bg-slate-900/50"
            />
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 border-t border-slate-100/50 pt-4 dark:border-slate-800/50">
            <Button
              type="button"
              onClick={() =>{  onOpenChange(false); }}
              variant="outline"
              className="h-11 flex-1 rounded-2xl text-sm font-bold"
              disabled={loading}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="h-11 flex-1 gap-2 rounded-2xl bg-gradient-to-r from-teal-600 to-cyan-600 text-sm font-bold text-white shadow-lg shadow-teal-500/30 transition-all hover:shadow-teal-500/40 disabled:opacity-50"
              disabled={loading}
            >
              {loading && <Loader2 className="h-4 w-4 animate-spin" />}
              {loading ? "Saving..." : mode === "create" ? "Create Task" : "Save Changes"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
