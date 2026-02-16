"use client"

import { X, Plus, AlertCircle } from "lucide-react"
import { useParams } from "next/navigation"
import { useState } from "react"

import { Button } from "@/components/ui/button"
import { apiClient } from "@/lib/api/client"
import { cn } from "@/lib/utils"

interface CreateClusterModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
}

export function CreateClusterModal({ open, onOpenChange, onSuccess }: CreateClusterModalProps) {
  const { projectId } = useParams()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [formData, setFormData] = useState({
    name: "",
    status: "planning" as "planning" | "building" | "active" | "strong",
    authorityScore: 0,
    pillarPageUrl: "",
    subtopics: "" // comma-separated
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setLoading(true)

    try {
      const subtopicsArray = formData.subtopics
        .split(",")
        .map((s) => s.trim())
        .filter((s) => s.length > 0)

      const payload = {
        name: formData.name,
        status: formData.status,
        authorityScore: parseInt(formData.authorityScore.toString(), 10) || 0,
        pillarPageUrl: formData.pillarPageUrl || undefined,
        subtopics: subtopicsArray
      }

      const response = await apiClient.post(`/projects/${projectId}/marketing/clusters`, payload)

      if (!response.ok) {
        throw new Error((await response.json())?.message || "Failed to create cluster")
      }

      setFormData({
        name: "",
        status: "planning",
        authorityScore: 0,
        pillarPageUrl: "",
        subtopics: ""
      })
      onOpenChange(false)
      onSuccess()
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
      <div className="w-full max-w-md rounded-3xl border border-slate-200 bg-white shadow-2xl dark:border-slate-800 dark:bg-slate-900">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 p-6 dark:border-slate-800">
          <h2 className="text-lg font-black text-slate-900 dark:text-white">
            Create Topic Cluster
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
              <AlertCircle className="h-4 w-4" />
              {error}
            </div>
          )}

          {/* Name */}
          <div>
            <label className="text-[10px] font-black tracking-widest text-slate-500 uppercase dark:text-slate-400">
              Cluster Name
            </label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) =>{  setFormData({ ...formData, name: e.target.value }); }}
              placeholder="e.g., Project Management"
              className="mt-2 h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm font-medium placeholder:text-slate-400 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 dark:border-slate-700 dark:bg-slate-800 dark:placeholder:text-slate-500"
            />
          </div>

          {/* Status */}
          <div>
            <label className="text-[10px] font-black tracking-widest text-slate-500 uppercase dark:text-slate-400">
              Status
            </label>
            <select
              value={formData.status}
              onChange={(e) =>{  setFormData({ ...formData, status: e.target.value as any }); }}
              className="mt-2 h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm font-medium focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 dark:border-slate-700 dark:bg-slate-800"
            >
              <option value="planning">Planning</option>
              <option value="building">Building</option>
              <option value="active">Active</option>
              <option value="strong">Strong</option>
            </select>
          </div>

          {/* Authority Score */}
          <div>
            <label className="text-[10px] font-black tracking-widest text-slate-500 uppercase dark:text-slate-400">
              Authority Score ({formData.authorityScore}%)
            </label>
            <input
              type="range"
              min="0"
              max="100"
              value={formData.authorityScore}
              onChange={(e) =>{ 
                setFormData({ ...formData, authorityScore: parseInt(e.target.value, 10) }); }
              }
              className="mt-2 h-2 w-full rounded-full bg-slate-200 accent-purple-600 dark:bg-slate-700"
            />
          </div>

          {/* Pillar Page URL */}
          <div>
            <label className="text-[10px] font-black tracking-widest text-slate-500 uppercase dark:text-slate-400">
              Pillar Page URL (Optional)
            </label>
            <input
              type="url"
              value={formData.pillarPageUrl}
              onChange={(e) =>{  setFormData({ ...formData, pillarPageUrl: e.target.value }); }}
              placeholder="https://..."
              className="mt-2 h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm font-medium placeholder:text-slate-400 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 dark:border-slate-700 dark:bg-slate-800 dark:placeholder:text-slate-500"
            />
          </div>

          {/* Subtopics */}
          <div>
            <label className="text-[10px] font-black tracking-widest text-slate-500 uppercase dark:text-slate-400">
              Subtopics (Comma-separated)
            </label>
            <textarea
              value={formData.subtopics}
              onChange={(e) =>{  setFormData({ ...formData, subtopics: e.target.value }); }}
              placeholder="e.g., Team productivity, Remote collaboration, Project planning"
              rows={3}
              className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-medium placeholder:text-slate-400 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 dark:border-slate-700 dark:bg-slate-800 dark:placeholder:text-slate-500"
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
              disabled={loading || !formData.name}
              className="flex-1 rounded-xl bg-purple-600 text-white hover:bg-purple-700 disabled:opacity-50"
            >
              {loading ? (
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
              ) : (
                <>
                  <Plus className="mr-2 h-4 w-4" /> Create
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
