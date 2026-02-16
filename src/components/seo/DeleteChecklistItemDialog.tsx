"use client"

import { Loader2, Trash2, AlertTriangle } from "lucide-react"
import { useState } from "react"

import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogHeader,
  AlertDialogTitle
} from "@/components/ui/alert-dialog"
import { Button } from "@/components/ui/button"

interface DeleteChecklistItemDialogProps {
  projectId: string
  itemId: string
  itemTitle: string
  open: boolean
  onOpenChange: (open: boolean) => void
  onDelete: () => void
}

export function DeleteChecklistItemDialog({
  projectId,
  itemId,
  itemTitle,
  open,
  onOpenChange,
  onDelete
}: DeleteChecklistItemDialogProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleDelete = async () => {
    setLoading(true)
    setError(null)

    try {
      const response = await fetch(`/api/projects/${projectId}/marketing/seo-checklist/${itemId}`, {
        method: "DELETE"
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || "Failed to delete item")
      }

      onDelete()
      onOpenChange(false)
    } catch (err) {
      console.error("Error deleting checklist item:", err)
      setError(err instanceof Error ? err.message : "Failed to delete item")
    } finally {
      setLoading(false)
    }
  }

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="rounded-3xl border-rose-200/50 bg-white sm:max-w-md dark:border-rose-900/30 dark:bg-slate-950">
        {/* Premium Destructive Header */}
        <div className="relative -mx-6 -mt-6 mb-6 overflow-hidden rounded-3xl bg-gradient-to-r from-rose-600 via-rose-500 to-red-600 p-6">
          <div className="absolute top-0 right-0 -mt-8 -mr-8 h-24 w-24 rounded-full bg-white/10 blur-2xl" />
          <div className="relative space-y-2">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg border border-white/30 bg-white/20 backdrop-blur-xl">
                <AlertTriangle className="h-4 w-4 text-white" />
              </div>
              <span className="text-[9px] font-black tracking-[0.2em] text-rose-100 uppercase">
                Delete Task
              </span>
            </div>
            <h2 className="text-2xl font-black tracking-tighter text-white">Are you sure?</h2>
          </div>
        </div>

        <div className="space-y-4">
          <p className="text-sm text-slate-600 dark:text-slate-400">
            You are about to permanently delete:
          </p>

          <div className="rounded-2xl border border-slate-200 bg-slate-50/50 p-4 dark:border-slate-800 dark:bg-slate-900/50">
            <p className="text-sm font-bold text-slate-900 dark:text-white">{itemTitle}</p>
          </div>

          <div className="rounded-2xl border border-amber-200/50 bg-amber-50/50 p-3 dark:border-amber-900/30 dark:bg-amber-950/20">
            <p className="flex items-start gap-2 text-xs text-amber-800 dark:text-amber-200">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
              <span>
                This action cannot be undone. All associated data will be permanently removed.
              </span>
            </p>
          </div>

          {/* Error Message */}
          {error && (
            <div className="rounded-2xl border border-rose-200/50 bg-rose-50/80 p-3 dark:border-rose-900/30 dark:bg-rose-950/20">
              <p className="text-sm font-semibold text-rose-700 dark:text-rose-300">⚠️ {error}</p>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-3 pt-2">
            <Button
              type="button"
              onClick={() =>{  onOpenChange(false); }}
              variant="outline"
              className="h-10 flex-1 rounded-2xl text-sm font-bold"
              disabled={loading}
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={handleDelete}
              className="h-10 flex-1 gap-2 rounded-2xl bg-gradient-to-r from-rose-600 to-red-600 text-sm font-bold text-white shadow-lg shadow-rose-500/30 transition-all hover:shadow-rose-500/40 disabled:opacity-50"
              disabled={loading}
            >
              {loading && <Loader2 className="h-4 w-4 animate-spin" />}
              {loading ? (
                "Deleting..."
              ) : (
                <>
                  <Trash2 className="h-4 w-4" />
                  Delete Task
                </>
              )}
            </Button>
          </div>
        </div>
      </AlertDialogContent>
    </AlertDialog>
  )
}
