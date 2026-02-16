"use client"

import { X, AlertCircle } from "lucide-react"
import { useState, useEffect } from "react"

import { Button } from "@/components/ui/button"
import { apiClient } from "@/lib/api/client"
import { cn } from "@/lib/utils"

const STRATEGY_TYPE_OPTIONS = [
  { value: "organic", label: "🌱 Organic Growth", icon: "🌱" },
  { value: "ads", label: "📢 Paid Ads", icon: "📢" },
  { value: "viral", label: "⚡ Viral Content", icon: "⚡" },
  { value: "community", label: "👥 Community", icon: "👥" },
  { value: "influencer", label: "⭐ Influencer", icon: "⭐" },
  { value: "analytics", label: "📊 Analytics", icon: "📊" }
]

const PLATFORM_OPTIONS = [
  "LinkedIn",
  "Twitter",
  "Facebook",
  "Instagram",
  "TikTok",
  "YouTube",
  "Google Ads",
  "Email"
]

interface SocialStrategy {
  id: string
  name: string
  type: string
  status: string
  description: string
  implementation: string[]
  targetReach: number
  actualReach?: number
  targetEngagement: number
  actualEngagement?: number
  roi?: number
  platforms: string[]
  startDate?: string
  endDate?: string
}

interface EditStrategyModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: (strategy: any) => void
  strategy: any | null
  projectId: string
}

export function EditStrategyModal({
  open,
  onOpenChange,
  onSuccess,
  strategy,
  projectId
}: EditStrategyModalProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [formData, setFormData] = useState<SocialStrategy | null>(null)

  useEffect(() => {
    if (strategy && open) {
      setFormData(JSON.parse(JSON.stringify(strategy)))
    }
  }, [strategy, open])

  if (!open || !formData) {
    return null
  }

  const handleTogglePlatform = (platform: string) => {
    if (!formData) {
      return
    }
    setFormData((prev) => ({
      ...prev!,
      platforms: prev!.platforms.includes(platform)
        ? prev!.platforms.filter((p) => p !== platform)
        : [...prev!.platforms, platform]
    }))
  }

  const handleImplementationChange = (index: number, value: string) => {
    if (!formData) {
      return
    }
    const newImplementation = [...formData.implementation]
    newImplementation[index] = value
    setFormData((prev) => ({ ...prev!, implementation: newImplementation }))
  }

  const handleAddImplementationStep = () => {
    if (!formData) {
      return
    }
    setFormData((prev) => ({
      ...prev!,
      implementation: [...prev!.implementation, ""]
    }))
  }

  const handleRemoveImplementationStep = (index: number) => {
    if (!formData) {
      return
    }
    setFormData((prev) => ({
      ...prev!,
      implementation: prev!.implementation.filter((_, i) => i !== index)
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")

    if (!formData.name.trim()) {
      setError("Strategy name is required")
      return
    }

    if (formData.platforms.length === 0) {
      setError("Select at least one platform")
      return
    }

    setLoading(true)

    try {
      const implementationSteps = formData.implementation.filter((step) => step.trim())
      if (implementationSteps.length === 0) {
        setError("Add at least one implementation step")
        setLoading(false)
        return
      }

      const updatePayload = {
        id: formData.id,
        title: formData.name,
        type: formData.type,
        status: formData.status,
        description: formData.description,
        platforms: formData.platforms,
        implementationSteps: implementationSteps
      }

      // Call the API to update
      const response = await apiClient.put(
        `/api/projects/${projectId}/marketing/strategies`,
        updatePayload
      )

      if (!response.ok) {
        throw new Error("Failed to update strategy")
      }

      const updatedStrategy = {
        ...formData,
        implementation: implementationSteps
      }

      onSuccess(updatedStrategy)
      onOpenChange(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/50 p-4">
      <div className="my-8 w-full max-w-2xl rounded-3xl border border-slate-200 bg-white shadow-2xl dark:border-slate-800 dark:bg-slate-900">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 p-6 dark:border-slate-800">
          <h2 className="text-lg font-black text-slate-900 dark:text-white">Edit Strategy</h2>
          <button
            onClick={() =>{  onOpenChange(false); }}
            className="rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="max-h-[70vh] space-y-4 overflow-y-auto p-6">
          {error && (
            <div className="flex items-center gap-3 rounded-xl bg-red-50 p-3 text-sm text-red-700 dark:bg-red-500/10 dark:text-red-400">
              <AlertCircle className="h-4 w-4 flex-shrink-0" />
              {error}
            </div>
          )}

          {/* Name */}
          <div>
            <label className="text-[10px] font-black tracking-widest text-slate-500 uppercase dark:text-slate-400">
              Strategy Name *
            </label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) =>{  setFormData({ ...formData, name: e.target.value }); }}
              className="mt-2 h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm font-medium placeholder:text-slate-400 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 dark:border-slate-700 dark:bg-slate-800 dark:placeholder:text-slate-500"
            />
          </div>

          {/* Type & Status */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-[10px] font-black tracking-widest text-slate-500 uppercase dark:text-slate-400">
                Strategy Type
              </label>
              <select
                value={formData.type}
                onChange={(e) =>{  setFormData({ ...formData, type: e.target.value }); }}
                className="mt-2 h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm font-medium focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 dark:border-slate-700 dark:bg-slate-800"
              >
                {STRATEGY_TYPE_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-[10px] font-black tracking-widest text-slate-500 uppercase dark:text-slate-400">
                Status
              </label>
              <select
                value={formData.status}
                onChange={(e) =>{  setFormData({ ...formData, status: e.target.value }); }}
                className="mt-2 h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm font-medium focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 dark:border-slate-700 dark:bg-slate-800"
              >
                <option value="planning">🗓️ Planning</option>
                <option value="active">▶️ Active</option>
                <option value="in_progress">⚙️ In Progress</option>
                <option value="success">✅ Success</option>
              </select>
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="text-[10px] font-black tracking-widest text-slate-500 uppercase dark:text-slate-400">
              Description
            </label>
            <textarea
              value={formData.description}
              onChange={(e) =>{  setFormData({ ...formData, description: e.target.value }); }}
              rows={2}
              className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-medium placeholder:text-slate-400 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 dark:border-slate-700 dark:bg-slate-800 dark:placeholder:text-slate-500"
            />
          </div>

          {/* Platforms */}
          <div>
            <label className="text-[10px] font-black tracking-widest text-slate-500 uppercase dark:text-slate-400">
              Platforms *
            </label>
            <div className="mt-2 grid grid-cols-4 gap-2">
              {PLATFORM_OPTIONS.map((platform) => (
                <button
                  key={platform}
                  type="button"
                  onClick={() =>{  handleTogglePlatform(platform); }}
                  className={cn(
                    "rounded-lg px-2 py-2 text-[10px] font-bold uppercase transition-all",
                    formData.platforms.includes(platform)
                      ? "bg-purple-600 text-white shadow-lg shadow-purple-500/30"
                      : "bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
                  )}
                >
                  {platform}
                </button>
              ))}
            </div>
          </div>

          {/* Implementation Steps */}
          <div>
            <div className="mb-2 flex items-center justify-between">
              <label className="text-[10px] font-black tracking-widest text-slate-500 uppercase dark:text-slate-400">
                Implementation Steps
              </label>
              <button
                type="button"
                onClick={handleAddImplementationStep}
                className="text-[10px] font-bold text-purple-600 hover:text-purple-700 dark:text-purple-400"
              >
                + Add Step
              </button>
            </div>
            <div className="space-y-2">
              {formData.implementation.map((step, idx) => (
                <div key={idx} className="flex gap-2">
                  <input
                    type="text"
                    value={step}
                    onChange={(e) =>{  handleImplementationChange(idx, e.target.value); }}
                    placeholder={`Step ${idx + 1}...`}
                    className="h-10 flex-1 rounded-xl border border-slate-200 bg-white px-3 text-sm font-medium placeholder:text-slate-400 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 dark:border-slate-700 dark:bg-slate-800 dark:placeholder:text-slate-500"
                  />
                  {formData.implementation.length > 1 && (
                    <button
                      type="button"
                      onClick={() =>{  handleRemoveImplementationStep(idx); }}
                      className="rounded-lg px-3 text-slate-400 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-500/10"
                    >
                      ✕
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Targets */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-[10px] font-black tracking-widest text-slate-500 uppercase dark:text-slate-400">
                Target Reach
              </label>
              <input
                type="number"
                value={formData.targetReach}
                onChange={(e) =>{ 
                  setFormData({ ...formData, targetReach: parseInt(e.target.value) }); }
                }
                className="mt-2 h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm font-medium focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 dark:border-slate-700 dark:bg-slate-800"
              />
            </div>
            <div>
              <label className="text-[10px] font-black tracking-widest text-slate-500 uppercase dark:text-slate-400">
                Target Engagement
              </label>
              <input
                type="number"
                value={formData.targetEngagement}
                onChange={(e) =>{ 
                  setFormData({ ...formData, targetEngagement: parseInt(e.target.value) }); }
                }
                className="mt-2 h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm font-medium focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 dark:border-slate-700 dark:bg-slate-800"
              />
            </div>
          </div>

          {/* Dates */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-[10px] font-black tracking-widest text-slate-500 uppercase dark:text-slate-400">
                Start Date
              </label>
              <input
                type="date"
                value={formData.startDate || ""}
                onChange={(e) =>{  setFormData({ ...formData, startDate: e.target.value }); }}
                className="mt-2 h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm font-medium focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 dark:border-slate-700 dark:bg-slate-800"
              />
            </div>
            <div>
              <label className="text-[10px] font-black tracking-widest text-slate-500 uppercase dark:text-slate-400">
                End Date
              </label>
              <input
                type="date"
                value={formData.endDate || ""}
                onChange={(e) =>{  setFormData({ ...formData, endDate: e.target.value }); }}
                className="mt-2 h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm font-medium focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 dark:border-slate-700 dark:bg-slate-800"
              />
            </div>
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
              className="flex-1 rounded-xl bg-purple-600 text-white hover:bg-purple-700 disabled:opacity-50"
            >
              {loading ? (
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
              ) : (
                "Save Changes"
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
