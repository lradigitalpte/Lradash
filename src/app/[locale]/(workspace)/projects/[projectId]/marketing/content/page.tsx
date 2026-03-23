"use client"

import {
  Plus,
  Trash2,
  Edit2,
  AlertCircle,
  TrendingUp,
  Calendar,
  Target,
  Gauge,
  Eye,
  Share2,
  CheckCircle2,
  Clock,
  Zap,
  Star
} from "lucide-react"
import Link from "next/link"
import { useParams } from "next/navigation"
import { useState, useEffect } from "react"

import { CreateStrategyModal } from "@/components/content/CreateStrategyModal"
import { EditStrategyModal } from "@/components/content/EditStrategyModal"
import { UpdateResultsModal } from "@/components/content/UpdateResultsModal"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { apiClient } from "@/lib/api/client"
import { cn } from "@/lib/utils"

const STRATEGY_TYPES = {
  organic: { icon: <Gauge className="h-5 w-5" />, label: "Organic Growth", color: "emerald" },
  ads: { icon: <Target className="h-5 w-5" />, label: "Paid Ads", color: "blue" },
  viral: { icon: <Zap className="h-5 w-5" />, label: "Viral Content", color: "yellow" },
  community: { icon: <Share2 className="h-5 w-5" />, label: "Community", color: "purple" },
  influencer: { icon: <Star className="h-5 w-5" />, label: "Influencer", color: "pink" },
  analytics: { icon: <Eye className="h-5 w-5" />, label: "Analytics", color: "indigo" }
}

const STATUS_CONFIG = {
  planning: {
    label: "Planning",
    color: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300",
    badge: "Schedule"
  },
  active: {
    label: "Active",
    color: "bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-300",
    badge: "Live"
  },
  in_progress: {
    label: "In Progress",
    color: "bg-yellow-100 text-yellow-700 dark:bg-yellow-500/20 dark:text-yellow-300",
    badge: "Building"
  },
  success: {
    label: "Success",
    color: "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300",
    badge: "Complete"
  }
}

interface SocialStrategy {
  id: string
  name: string
  type: keyof typeof STRATEGY_TYPES
  status: keyof typeof STATUS_CONFIG
  description: string
  implementation: string[]
  targetReach?: number
  actualReach?: number
  targetEngagement?: number
  actualEngagement?: number
  roi?: number
  platforms: string[]
  startDate?: string
  endDate?: string
}

export default function SocialMediaStrategyPage() {
  const { locale, projectId } = useParams()
  const [strategies, setStrategies] = useState<SocialStrategy[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchStrategies = async () => {
      try {
        setLoading(true)
        // Try to fetch from API
        const response = await apiClient.get(`/api/projects/${projectId}/marketing/strategies`)
        if (response.ok) {
          const data = await response.json()
          // Map API response to interface (API uses title/implementationSteps, we use name/implementation)
          const mappedStrategies = (data.strategies || []).map((strategy: any) => ({
            id: strategy._id || strategy.id,
            name: strategy.title || strategy.name,
            type: strategy.type,
            status: strategy.status,
            description: strategy.description,
            implementation: strategy.implementationSteps || strategy.implementation || [],
            targetReach: strategy.metrics?.targetReach || strategy.targetReach,
            actualReach: strategy.metrics?.actualReach || strategy.actualReach || 0,
            targetEngagement: strategy.metrics?.targetEngagement || strategy.targetEngagement,
            actualEngagement: strategy.metrics?.actualEngagement || strategy.actualEngagement || 0,
            roi: strategy.roi || 0,
            platforms: strategy.platforms || [],
            startDate: strategy.startDate,
            endDate: strategy.endDate
          }))
          setStrategies(mappedStrategies)
        } else {
          // If API fails, set empty state (no mock data)
          setStrategies([])
        }
      } catch (err) {
        console.error("Error fetching strategies:", err)
        setStrategies([])
      } finally {
        setLoading(false)
      }
    }

    fetchStrategies()
  }, [projectId])

  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [showResultsModal, setShowResultsModal] = useState(false)
  const [selectedStrategy, setSelectedStrategy] = useState<SocialStrategy | null>(null)

  const handleCreateStrategy = (newStrategy: SocialStrategy) => {
    setStrategies([...strategies, newStrategy])
  }

  const handleUpdateStrategy = (updatedStrategy: SocialStrategy) => {
    setStrategies(strategies.map((s) => (s.id === updatedStrategy.id ? updatedStrategy : s)))
  }

  const handleUpdateResults = (results: {
    actualReach: number
    actualEngagement: number
    roi: number
  }) => {
    if (!selectedStrategy) {
      return
    }
    setStrategies(strategies.map((s) => (s.id === selectedStrategy.id ? { ...s, ...results } : s)))
  }

  const handleOpenEdit = (strategy: SocialStrategy) => {
    setSelectedStrategy(strategy)
    setShowEditModal(true)
  }

  const handleOpenResults = (strategy: SocialStrategy) => {
    setSelectedStrategy(strategy)
    setShowResultsModal(true)
  }

  const handleDelete = (id: string) => {
    if (
      typeof window !== "undefined" &&
      window.confirm("Delete this strategy? This cannot be undone.")
    ) {
      const deleteStrategy = async () => {
        try {
          const response = await apiClient.delete(
            `/api/projects/${projectId}/marketing/strategies?id=${id}`
          )
          if (response.ok) {
            setStrategies(strategies.filter((s) => s.id !== id))
          }
        } catch (err) {
          console.error("Failed to delete strategy:", err)
        }
      }
      deleteStrategy()
    }
  }

  const editingStrategy = strategies.find((s) => s.id === selectedStrategy?.id) || selectedStrategy

  const totalStrategies = strategies.length
  const activeStrategies = strategies.filter(
    (s) => s.status === "active" || s.status === "in_progress"
  ).length
  const successfulStrategies = strategies.filter((s) => s.status === "success").length
  const avgROI =
    strategies.filter((s) => s.roi).length > 0
      ? Math.round(
          strategies.reduce((sum, s) => sum + (s.roi || 0), 0) /
            strategies.filter((s) => s.roi).length
        )
      : 0

  return (
    <div className="space-y-8 p-8 pb-20">
      {/* Header */}
      <div className="flex flex-col justify-between gap-6 md:flex-row md:items-end">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <div className="flex h-6 items-center justify-center rounded-md border border-purple-500/20 bg-purple-500/10 px-2">
              <span className="text-[9px] font-black tracking-[0.2em] text-purple-600 uppercase">
                Marketing Strategy
              </span>
            </div>
            <div className="h-1 w-1 rounded-full bg-slate-300 dark:bg-slate-700" />
            <span className="text-[10px] font-bold tracking-widest text-slate-400 uppercase">
              Social Media Management
            </span>
          </div>
          <h1 className="text-4xl font-black tracking-tighter text-slate-900 dark:text-white">
            Social <span className="text-purple-600">Strategy</span>
          </h1>
          <p className="max-w-lg text-xs font-medium text-slate-500 italic">
            Plan, implement, and track social media strategies across platforms.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Link href={`/${locale}/projects/${projectId}/marketing/calendar`}>
            <Button className="mr-3 h-11 rounded-xl bg-slate-900 px-6 text-[11px] font-bold tracking-widest text-white shadow-lg dark:bg-white dark:text-slate-900">
              <Calendar className="mr-2 h-4 w-4" /> Calendar
            </Button>
          </Link>
          <Button
            onClick={() => {
              setShowCreateModal(true)
            }}
            className="h-11 rounded-xl bg-purple-600 px-6 text-[11px] font-bold tracking-widest text-white uppercase shadow-lg shadow-purple-500/20 hover:bg-purple-700"
          >
            <Plus className="mr-2 h-4 w-4" /> New Strategy
          </Button>
        </div>
      </div>

      {/* Metrics */}
      {loading ? (
        <div className="grid grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="h-24 animate-pulse rounded-2xl border border-slate-100 bg-slate-50 dark:border-slate-800 dark:bg-slate-900/50"
            />
          ))}
        </div>
      ) : totalStrategies > 0 ? (
        <div className="grid grid-cols-4 gap-4">
          <div className="rounded-2xl border border-slate-100 bg-white p-4 shadow-lg shadow-slate-200/20 dark:border-slate-800 dark:bg-slate-900 dark:shadow-none">
            <p className="text-[10px] font-black tracking-widest text-slate-400 uppercase">
              Total Strategies
            </p>
            <p className="mt-2 text-3xl font-black text-slate-900 dark:text-white">
              {totalStrategies}
            </p>
          </div>
          <div className="rounded-2xl border border-slate-100 bg-white p-4 shadow-lg shadow-slate-200/20 dark:border-slate-800 dark:bg-slate-900 dark:shadow-none">
            <p className="text-[10px] font-black tracking-widest text-slate-400 uppercase">
              Active
            </p>
            <p className="mt-2 text-3xl font-black text-slate-900 dark:text-white">
              {activeStrategies}
            </p>
          </div>
          <div className="rounded-2xl border border-slate-100 bg-white p-4 shadow-lg shadow-slate-200/20 dark:border-slate-800 dark:bg-slate-900 dark:shadow-none">
            <p className="text-[10px] font-black tracking-widest text-slate-400 uppercase">
              Successful
            </p>
            <p className="mt-2 text-3xl font-black text-slate-900 dark:text-white">
              {successfulStrategies}
            </p>
          </div>
          <div className="rounded-2xl border border-slate-100 bg-white p-4 shadow-lg shadow-slate-200/20 dark:border-slate-800 dark:bg-slate-900 dark:shadow-none">
            <p className="text-[10px] font-black tracking-widest text-slate-400 uppercase">
              Avg ROI
            </p>
            <p className="mt-2 text-3xl font-black text-purple-600 dark:text-purple-400">
              {avgROI}%
            </p>
          </div>
        </div>
      ) : null}

      {/* Strategy Grid */}
      <div className="rounded-[2.5rem] border border-slate-100 bg-white p-8 shadow-2xl shadow-slate-200/40 dark:border-slate-800 dark:bg-slate-900 dark:shadow-none">
        <div className="mb-8 flex items-center justify-between">
          <div className="space-y-1">
            <h3 className="text-xl font-black text-slate-900 dark:text-white">Active Strategies</h3>
            <p className="text-[10px] font-black tracking-[0.2em] text-slate-400 uppercase">
              Implementation & Results
            </p>
          </div>
        </div>

        {strategies.length === 0 && !loading ? (
          <div className="rounded-2xl border-2 border-dashed border-slate-300 bg-slate-50 p-12 text-center dark:border-slate-700 dark:bg-slate-800/50">
            <AlertCircle className="mx-auto mb-4 h-12 w-12 text-slate-300 dark:text-slate-600" />
            <h4 className="text-lg font-bold text-slate-600 dark:text-slate-300">
              No strategies yet
            </h4>
            <p className="mt-2 text-sm text-slate-500">Create your first strategy to get started</p>
            <Button
              onClick={() => {
                setShowCreateModal(true)
              }}
              className="mt-4 rounded-xl bg-purple-600 px-6 text-[11px] font-bold tracking-widest text-white uppercase hover:bg-purple-700"
            >
              <Plus className="mr-2 h-4 w-4" /> Create Strategy
            </Button>
          </div>
        ) : loading ? (
          <div className="py-8 text-center text-slate-400">Loading strategies...</div>
        ) : (
          <div className="space-y-4">
            {strategies.map((strategy) => {
              const typeConfig = STRATEGY_TYPES[strategy.type]
              const statusConfig = STATUS_CONFIG[strategy.status]
              const reach = strategy.actualReach || 0
              const targetReach = strategy.targetReach || 1
              const reachPercent = Math.min((reach / targetReach) * 100, 100)
              const engagement = strategy.actualEngagement || 0
              const targetEngagement = strategy.targetEngagement || 1
              const engagementPercent = Math.min((engagement / targetEngagement) * 100, 100)

              return (
                <div
                  key={strategy.id}
                  className="group rounded-2xl border border-slate-100 bg-slate-50 p-6 transition-all hover:border-purple-500/30 hover:shadow-lg dark:border-slate-800 dark:bg-slate-800/50"
                >
                  {/* Header */}
                  <div className="mb-4 flex items-start justify-between">
                    <div className="flex gap-4">
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white shadow-sm dark:bg-slate-900">
                        {typeConfig.icon}
                      </div>
                      <div className="flex-1">
                        <h4 className="text-lg font-black text-slate-900 dark:text-white">
                          {strategy.name}
                        </h4>
                        <p className="mt-1 text-xs font-bold text-slate-500 dark:text-slate-400">
                          {strategy.description}
                        </p>
                        <div className="mt-2 flex flex-wrap gap-2">
                          <span
                            className={cn(
                              "rounded-lg px-2 py-1 text-[9px] font-bold tracking-widest uppercase",
                              statusConfig.color
                            )}
                          >
                            {statusConfig.badge} {statusConfig.label}
                          </span>
                          {strategy.platforms.map((p) => (
                            <span
                              key={p}
                              className="rounded-lg bg-slate-200 px-2 py-1 text-[9px] font-bold text-slate-700 dark:bg-slate-700 dark:text-slate-300"
                            >
                              {p}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => {
                          handleOpenResults(strategy)
                        }}
                        className="rounded-lg p-2 text-slate-400 transition-colors hover:bg-emerald-100 hover:text-emerald-600 dark:hover:bg-emerald-500/20 dark:hover:text-emerald-400"
                        title="Update results"
                      >
                        <TrendingUp className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => {
                          handleOpenEdit(strategy)
                        }}
                        className="rounded-lg p-2 text-slate-400 transition-colors hover:bg-slate-200 hover:text-slate-600 dark:hover:bg-slate-700"
                      >
                        <Edit2 className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => {
                          handleDelete(strategy.id)
                        }}
                        className="rounded-lg p-2 text-slate-400 transition-colors hover:bg-red-100 hover:text-red-600 dark:hover:bg-red-500/20"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>

                  {/* Implementation */}
                  <div className="mb-4 grid grid-cols-2 gap-4">
                    <div>
                      <p className="mb-2 text-[9px] font-black tracking-[0.2em] text-slate-400 uppercase">
                        Implementation Plan
                      </p>
                      <ul className="space-y-1">
                        {strategy.implementation.map((step, idx) => (
                          <li
                            key={idx}
                            className="flex gap-2 text-[10px] font-bold text-slate-600 dark:text-slate-400"
                          >
                            <span className="text-purple-600">•</span> {step}
                          </li>
                        ))}
                      </ul>
                    </div>
                    <div>
                      <p className="mb-2 text-[9px] font-black tracking-[0.2em] text-slate-400 uppercase">
                        Timeline
                      </p>
                      <div className="space-y-1 text-[10px] font-bold text-slate-600 dark:text-slate-400">
                        <div className="flex items-center gap-2">
                          <Calendar className="h-3 w-3" />
                          {strategy.startDate
                            ? new Date(strategy.startDate).toLocaleDateString()
                            : "TBD"}
                        </div>
                        <div className="flex items-center gap-2">
                          <Clock className="h-3 w-3" />
                          {strategy.endDate
                            ? new Date(strategy.endDate).toLocaleDateString()
                            : "TBD"}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Results */}
                  <div className="border-t border-slate-200 pt-4 dark:border-slate-700">
                    <p className="mb-3 text-[9px] font-black tracking-[0.2em] text-slate-400 uppercase">
                      Results & Performance
                    </p>
                    <div className="grid grid-cols-3 gap-4">
                      {/* Reach */}
                      <div>
                        <div className="mb-2 flex items-center justify-between">
                          <div className="flex items-center gap-1">
                            <Eye className="h-3 w-3 text-blue-600" />
                            <span className="text-[10px] font-bold text-slate-600 dark:text-slate-400">
                              Reach
                            </span>
                          </div>
                          <span className="text-[10px] font-black text-slate-900 dark:text-white">
                            {reachPercent.toFixed(0)}%
                          </span>
                        </div>
                        <div className="h-2 w-full overflow-hidden rounded-full bg-slate-200 dark:bg-slate-700">
                          <div
                            className="h-full rounded-full bg-blue-600"
                            style={{ width: `${reachPercent}%` }}
                          />
                        </div>
                        <div className="mt-1 text-[9px] text-slate-500">
                          {reach.toLocaleString()} / {targetReach.toLocaleString()}
                        </div>
                      </div>

                      {/* Engagement */}
                      <div>
                        <div className="mb-2 flex items-center justify-between">
                          <div className="flex items-center gap-1">
                            <Share2 className="h-3 w-3 text-purple-600" />
                            <span className="text-[10px] font-bold text-slate-600 dark:text-slate-400">
                              Engagement
                            </span>
                          </div>
                          <span className="text-[10px] font-black text-slate-900 dark:text-white">
                            {engagementPercent.toFixed(0)}%
                          </span>
                        </div>
                        <div className="h-2 w-full overflow-hidden rounded-full bg-slate-200 dark:bg-slate-700">
                          <div
                            className="h-full rounded-full bg-purple-600"
                            style={{ width: `${engagementPercent}%` }}
                          />
                        </div>
                        <div className="mt-1 text-[9px] text-slate-500">
                          {engagement.toLocaleString()} / {targetEngagement.toLocaleString()}
                        </div>
                      </div>

                      {/* ROI */}
                      <div>
                        <div className="mb-2 flex items-center justify-between">
                          <div className="flex items-center gap-1">
                            <TrendingUp className="h-3 w-3 text-emerald-600" />
                            <span className="text-[10px] font-bold text-slate-600 dark:text-slate-400">
                              ROI
                            </span>
                          </div>
                          <span className="text-[10px] font-black text-emerald-600">
                            {strategy.roi || 0}%
                          </span>
                        </div>
                        <div className="h-2 w-full overflow-hidden rounded-full bg-slate-200 dark:bg-slate-700">
                          <div
                            className="h-full rounded-full bg-emerald-600"
                            style={{
                              width: `${Math.min(((strategy.roi || 0) / 250) * 100, 100)}%`
                            }}
                          />
                        </div>
                        <div className="mt-1 text-[9px] text-slate-500">Return on investment</div>
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Tips */}
      <div className="rounded-[2.5rem] border border-slate-100 bg-linear-to-br from-slate-50 to-slate-100 p-8 dark:border-slate-800 dark:from-slate-900 dark:to-slate-800">
        <div className="flex gap-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-600 text-xl font-black text-white">
            <Zap className="h-5 w-5" />
          </div>
          <div className="space-y-2">
            <h3 className="font-black text-slate-900 dark:text-white">Strategy Tips</h3>
            <ul className="space-y-1 text-sm text-slate-700 dark:text-slate-300">
              <li>• Set specific, measurable targets (reach, engagement, ROI)</li>
              <li>• Track implementation steps to stay accountable</li>
              <li>• Monitor actual vs. target metrics regularly</li>
              <li>
                • Update status as strategies progress (Planning → Active → In Progress → Success)
              </li>
              <li>• Use calendar to schedule posts and campaigns aligned with strategies</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Modals */}
      <CreateStrategyModal
        open={showCreateModal}
        onOpenChange={setShowCreateModal}
        onSuccess={handleCreateStrategy}
        projectId={projectId as string}
      />
      <EditStrategyModal
        open={showEditModal}
        onOpenChange={setShowEditModal}
        onSuccess={handleUpdateStrategy}
        strategy={editingStrategy}
        projectId={projectId as string}
      />
      <UpdateResultsModal
        open={showResultsModal}
        onOpenChange={setShowResultsModal}
        onSuccess={handleUpdateResults}
        strategy={selectedStrategy}
        projectId={projectId as string}
      />
    </div>
  )
}
