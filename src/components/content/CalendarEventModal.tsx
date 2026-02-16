"use client"

import { X, AlertCircle } from "lucide-react"
import { useState, useEffect } from "react"

import { Button } from "@/components/ui/button"

const STATUS_OPTIONS = [
  { value: "planning", label: "🗓️ Planning" },
  { value: "building", label: "🔨 Building" },
  { value: "active", label: "▶️ Active" },
  { value: "strong", label: "✅ Strong" }
]

interface CalendarEvent {
  id: string
  strategyId: string
  strategyName: string
  title: string
  date: Date
  status: string
  notes?: string
}

interface CalendarEventModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: (event: CalendarEvent) => void
  event?: CalendarEvent | null
  strategies: any[]
  projectId: string
}

export function CalendarEventModal({
  open,
  onOpenChange,
  onSuccess,
  event,
  strategies,
  projectId
}: CalendarEventModalProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [formData, setFormData] = useState<Partial<CalendarEvent>>({
    title: "",
    strategyId: "",
    strategyName: "",
    date: new Date(),
    status: "planning",
    notes: ""
  })

  useEffect(() => {
    if (event && open) {
      setFormData({
        ...event,
        date: event.date instanceof Date ? event.date : new Date(event.date)
      })
    } else if (!event && open) {
      setFormData({
        title: "",
        strategyId: "",
        strategyName: "",
        date: new Date(),
        status: "planning",
        notes: ""
      })
    }
  }, [event, open])

  const isEditMode = !!event

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")

    if (!formData.title?.trim()) {
      setError("Event title is required")
      return
    }

    if (!formData.strategyId) {
      setError("Please select a strategy")
      return
    }

    if (!formData.date) {
      setError("Please select a date")
      return
    }

    setLoading(true)

    try {
      const newEvent: CalendarEvent = {
        id: event?.id || Date.now().toString(),
        title: formData.title,
        strategyId: formData.strategyId,
        strategyName: (formData.strategyName || ""),
        date: formData.date instanceof Date ? formData.date : new Date(formData.date),
        status: (formData.status || "planning"),
        notes: formData.notes
      }

      onSuccess(newEvent)
      onOpenChange(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred")
    } finally {
      setLoading(false)
    }
  }

  if (!open) {
    return null
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-xl rounded-3xl border border-slate-200 bg-white shadow-2xl dark:border-slate-800 dark:bg-slate-900">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 p-6 dark:border-slate-800">
          <h2 className="text-lg font-black text-slate-900 dark:text-white">
            {isEditMode ? "Edit Event" : "Create Event"}
          </h2>
          <button
            onClick={() =>{  onOpenChange(false); }}
            className="rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="space-y-4 p-6">
          {error && (
            <div className="flex items-center gap-3 rounded-xl bg-red-50 p-3 text-sm text-red-700 dark:bg-red-500/10 dark:text-red-400">
              <AlertCircle className="h-4 w-4 shrink-0" />
              {error}
            </div>
          )}

          {/* Title */}
          <div>
            <label className="text-[10px] font-black tracking-widest text-slate-500 uppercase dark:text-slate-400">
              Event Title *
            </label>
            <input
              type="text"
              required
              value={formData.title || ""}
              onChange={(e) =>{  setFormData({ ...formData, title: e.target.value }); }}
              placeholder="e.g., Publish pillar page"
              className="mt-2 h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm font-medium placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 dark:border-slate-700 dark:bg-slate-800 dark:placeholder:text-slate-500"
            />
          </div>

          {/* Strategy */}
          <div>
            <label className="text-[10px] font-black tracking-widest text-slate-500 uppercase dark:text-slate-400">
              Strategy *
            </label>
            <select
              value={formData.strategyId || ""}
              onChange={(e) => {
                const strategy = strategies.find((s) => s._id === e.target.value)
                setFormData({
                  ...formData,
                  strategyId: e.target.value,
                  strategyName: strategy?.title || ""
                })
              }}
              className="mt-2 h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm font-medium focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 dark:border-slate-700 dark:bg-slate-800"
            >
              <option value="">Select a strategy</option>
              {strategies.map((strategy) => (
                <option key={strategy._id} value={strategy._id}>
                  {strategy.title}
                </option>
              ))}
            </select>
          </div>

          {/* Date */}
          <div>
            <label className="text-[10px] font-black tracking-widest text-slate-500 uppercase dark:text-slate-400">
              Publish Date *
            </label>
            <input
              type="date"
              required
              value={formData.date instanceof Date ? formData.date.toISOString().split("T")[0] : ""}
              onChange={(e) =>{  setFormData({ ...formData, date: new Date(e.target.value) }); }}
              className="mt-2 h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm font-medium focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 dark:border-slate-700 dark:bg-slate-800"
            />
          </div>

          {/* Status */}
          <div>
            <label className="text-[10px] font-black tracking-widest text-slate-500 uppercase dark:text-slate-400">
              Status
            </label>
            <select
              value={formData.status || "planning"}
              onChange={(e) =>{  setFormData({ ...formData, status: e.target.value }); }}
              className="mt-2 h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm font-medium focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 dark:border-slate-700 dark:bg-slate-800"
            >
              {STATUS_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          {/* Notes */}
          <div>
            <label className="text-[10px] font-black tracking-widest text-slate-500 uppercase dark:text-slate-400">
              Notes
            </label>
            <textarea
              value={formData.notes || ""}
              onChange={(e) =>{  setFormData({ ...formData, notes: e.target.value }); }}
              placeholder="Add any notes about this event..."
              rows={3}
              className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-medium placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 dark:border-slate-700 dark:bg-slate-800 dark:placeholder:text-slate-500"
            />
          </div>

          {/* Actions */}
          <div className="flex gap-2 border-t border-slate-100 pt-4 dark:border-slate-800">
            <Button
              type="button"
              variant="outline"
              onClick={() =>{  onOpenChange(false); }}
              className="flex-1 rounded-xl text-slate-600 dark:text-slate-300"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={loading}
              className="flex-1 rounded-xl bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? (
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
              ) : isEditMode ? (
                "Save Changes"
              ) : (
                "Create Event"
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
