"use client"

import { X, TrendingUp } from "lucide-react"
import { useState, useEffect } from "react"

import { Button } from "@/components/ui/button"
import { apiClient } from "@/lib/api/client"

interface SocialStrategy {
  id: string
  name: string
  targetReach: number
  actualReach?: number
  targetEngagement: number
  actualEngagement?: number
  roi?: number
}

interface UpdateResultsModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: (results: { actualReach: number; actualEngagement: number; roi: number }) => void
  strategy: any | null
  projectId: string
}

export function UpdateResultsModal({
  open,
  onOpenChange,
  onSuccess,
  strategy,
  projectId
}: UpdateResultsModalProps) {
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    actualReach: 0,
    actualEngagement: 0,
    roi: 0
  })

  useEffect(() => {
    if (strategy && open) {
      setFormData({
        actualReach: strategy.actualReach || 0,
        actualEngagement: strategy.actualEngagement || 0,
        roi: strategy.roi || 0
      })
    }
  }, [strategy, open])

  if (!open || !strategy) {
    return null
  }

  const reachPercent =
    strategy.targetReach > 0 ? Math.round((formData.actualReach / strategy.targetReach) * 100) : 0
  const engagementPercent =
    strategy.targetEngagement > 0
      ? Math.round((formData.actualEngagement / strategy.targetEngagement) * 100)
      : 0

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      // Call the API to update results
      const response = await apiClient.put(`/api/projects/${projectId}/marketing/strategies`, {
        id: strategy.id,
        actualReach: formData.actualReach,
        actualEngagement: formData.actualEngagement,
        roi: formData.roi
      })

      if (!response.ok) {
        throw new Error("Failed to update results")
      }

      onSuccess(formData)
      onOpenChange(false)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-xl rounded-3xl border border-slate-200 bg-white shadow-2xl dark:border-slate-800 dark:bg-slate-900">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 p-6 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-emerald-600" />
            <h2 className="text-lg font-black text-slate-900 dark:text-white">Update Results</h2>
          </div>
          <button
            onClick={() =>{  onOpenChange(false); }}
            className="rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="space-y-6 p-6">
          {/* Strategy Info */}
          <div className="rounded-2xl bg-slate-50 p-4 dark:bg-slate-800/50">
            <p className="text-[10px] font-black tracking-widest text-slate-500 uppercase dark:text-slate-400">
              Strategy
            </p>
            <p className="mt-1 text-sm font-bold text-slate-900 dark:text-white">{strategy.name}</p>
            <div className="mt-3 grid grid-cols-2 gap-4">
              <div>
                <p className="text-[9px] font-black text-slate-500 uppercase dark:text-slate-400">
                  Target Reach
                </p>
                <p className="text-lg font-black text-blue-600">
                  {strategy.targetReach.toLocaleString()}
                </p>
              </div>
              <div>
                <p className="text-[9px] font-black text-slate-500 uppercase dark:text-slate-400">
                  Target Engagement
                </p>
                <p className="text-lg font-black text-purple-600">
                  {strategy.targetEngagement.toLocaleString()}
                </p>
              </div>
            </div>
          </div>

          {/* Actual Reach */}
          <div>
            <label className="text-[10px] font-black tracking-widest text-slate-500 uppercase dark:text-slate-400">
              Actual Reach
            </label>
            <input
              type="number"
              value={formData.actualReach}
              onChange={(e) =>{ 
                setFormData({ ...formData, actualReach: parseInt(e.target.value) || 0 }); }
              }
              className="mt-2 h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm font-medium focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 dark:border-slate-700 dark:bg-slate-800"
            />
            <div className="mt-2 flex items-center justify-between">
              <div className="h-2 flex-1 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-700">
                <div
                  className="h-full bg-blue-500 transition-all"
                  style={{ width: `${Math.min(reachPercent, 100)}%` }}
                />
              </div>
              <span className="ml-3 text-sm font-bold text-blue-600">{reachPercent}%</span>
            </div>
          </div>

          {/* Actual Engagement */}
          <div>
            <label className="text-[10px] font-black tracking-widest text-slate-500 uppercase dark:text-slate-400">
              Actual Engagement
            </label>
            <input
              type="number"
              value={formData.actualEngagement}
              onChange={(e) =>{ 
                setFormData({ ...formData, actualEngagement: parseInt(e.target.value) || 0 }); }
              }
              className="mt-2 h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm font-medium focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 dark:border-slate-700 dark:bg-slate-800"
            />
            <div className="mt-2 flex items-center justify-between">
              <div className="h-2 flex-1 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-700">
                <div
                  className="h-full bg-purple-500 transition-all"
                  style={{ width: `${Math.min(engagementPercent, 100)}%` }}
                />
              </div>
              <span className="ml-3 text-sm font-bold text-purple-600">{engagementPercent}%</span>
            </div>
          </div>

          {/* ROI */}
          <div>
            <label className="text-[10px] font-black tracking-widest text-slate-500 uppercase dark:text-slate-400">
              ROI % (Return on Investment)
            </label>
            <div className="mt-2 flex items-center gap-2">
              <input
                type="number"
                value={formData.roi}
                onChange={(e) =>{  setFormData({ ...formData, roi: parseInt(e.target.value) || 0 }); }}
                className="h-10 flex-1 rounded-xl border border-slate-200 bg-white px-3 text-sm font-medium focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 dark:border-slate-700 dark:bg-slate-800"
              />
              <span className="text-2xl font-black text-emerald-600">%</span>
            </div>
          </div>

          {/* Summary */}
          <div className="rounded-2xl border-2 border-emerald-200 bg-emerald-50/50 p-4 dark:border-emerald-900/50 dark:bg-emerald-500/5">
            <p className="text-[10px] font-black tracking-widest text-emerald-700 uppercase dark:text-emerald-400">
              Performance Summary
            </p>
            <div className="mt-3 space-y-1.5 text-sm">
              <p className="text-slate-700 dark:text-slate-300">
                <span className="font-bold text-blue-600">Reach Goal:</span> {reachPercent}%
                achieved
              </p>
              <p className="text-slate-700 dark:text-slate-300">
                <span className="font-bold text-purple-600">Engagement Goal:</span>{" "}
                {engagementPercent}% achieved
              </p>
              <p className="text-slate-700 dark:text-slate-300">
                <span className="font-bold text-emerald-600">ROI:</span> {formData.roi}% return
              </p>
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
              className="flex-1 rounded-xl bg-emerald-600 text-white hover:bg-emerald-700 disabled:opacity-50"
            >
              {loading ? (
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
              ) : (
                "Save Results"
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
