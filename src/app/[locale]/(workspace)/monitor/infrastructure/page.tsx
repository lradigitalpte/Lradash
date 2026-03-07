"use client"

import {
  Mail,
  Plus,
  Shield,
  Network,
  Server,
  MoreVertical,
  Database,
  Globe,
  Zap,
  Loader2,
  Clock,
  Activity,
  Edit2,
  Trash2
} from "lucide-react"
import { useState, useEffect, useCallback } from "react"
import { toast } from "sonner"

import { AddWebsiteModal } from "@/components/monitor/AddWebsiteModal"
import { UptimeStatusBars } from "@/components/monitor/UptimeStatusBars"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu"
import { apiClient } from "@/lib/api/client"
import { cn } from "@/lib/utils"
import { IMonitor, MonitorStatus } from "@/types/monitor"

export default function InfrastructurePage() {
  const [modalOpen, setModalOpen] = useState(false)
  const [editingMonitor, setEditingMonitor] = useState<IMonitor | null>(null)
  const [monitors, setMonitors] = useState<IMonitor[]>([])
  const [loading, setLoading] = useState(true)

  const fetchMonitors = useCallback(async () => {
    try {
      const response = await apiClient.get("/api/monitor")
      if (response.ok) {
        const data = await response.json()
        setMonitors(data)
      }
    } catch (error) {
      console.error("Failed to fetch monitors:", error)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchMonitors()
  }, [fetchMonitors])

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this monitor?")) {
      return
    }
    try {
      const response = await apiClient.delete(`/api/monitor/${id}`)
      if (response.ok) {
        toast.success("Monitor deleted")
        fetchMonitors()
      }
    } catch (error) {
      toast.error("Failed to delete monitor")
    }
  }

  const handleEdit = (monitor: IMonitor) => {
    setEditingMonitor(monitor)
    setModalOpen(true)
  }

  const infraMonitors = monitors.filter((m) => m.type !== "WEBSITE")
  const emailMonitors = infraMonitors.filter((m) =>
    ["SMTP", "EMAIL", "MX", "IMAP"].includes(m.type)
  )
  const dbMonitors = infraMonitors.filter(
    (m) => ["PORT"].includes(m.type) && !emailMonitors.includes(m)
  )

  return (
    <div className="space-y-8">
      <div className="flex items-end justify-between">
        <div>
          <span className="text-[10px] font-black tracking-[0.2em] text-red-500 uppercase">
            Backbone
          </span>
          <h1 className="text-4xl font-black tracking-tighter">
            System <span className="text-slate-400">Infrastructure</span>
          </h1>
        </div>
        <div className="flex items-center gap-4">
          <div
            className={cn(
              "flex items-center gap-2 rounded-2xl px-4 py-2 transition-all",
              monitors.length > 0 && monitors.every((m) => m.status === MonitorStatus.UP)
                ? "bg-emerald-50 text-emerald-600 dark:bg-emerald-950/30"
                : "bg-amber-50 text-amber-600 dark:bg-amber-950/30"
            )}
          >
            <Zap
              className={cn(
                "h-4 w-4",
                monitors.length > 0 && monitors.every((m) => m.status === MonitorStatus.UP)
                  ? "fill-emerald-500"
                  : "fill-amber-500"
              )}
            />
            <span className="text-[10px] font-black tracking-widest uppercase">
              {monitors.length > 0 && monitors.every((m) => m.status === MonitorStatus.UP)
                ? "All Nodes Active"
                : "Partial Degraded"}
            </span>
          </div>
          <button
            onClick={() => {
              setEditingMonitor(null)
              setModalOpen(true)
            }}
            className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-900 text-white transition-all hover:bg-red-600 dark:bg-white dark:text-slate-900"
          >
            <Plus className="h-5 w-5" />
          </button>
        </div>
      </div>

      <AddWebsiteModal
        open={modalOpen}
        onOpenChange={(open) => {
          setModalOpen(open)
          if (!open) {
            setEditingMonitor(null)
          }
        }}
        onSuccess={fetchMonitors}
        initialData={editingMonitor}
      />

      {loading ? (
        <div className="flex flex-col items-center justify-center gap-4 py-20">
          <Loader2 className="h-8 w-8 animate-spin text-slate-300" />
          <p className="text-[10px] font-black tracking-widest text-slate-400 uppercase">
            Loading backbone status...
          </p>
        </div>
      ) : (
        <div className="grid gap-8 lg:grid-cols-2">
          {/* Email Servers Section */}
          <div className="space-y-6">
            <div className="flex items-center justify-between px-4">
              <h2 className="flex items-center gap-2 text-xl font-black tracking-tight">
                <Mail className="h-5 w-5 text-red-500" />
                Connectivity & Email
              </h2>
            </div>

            <div className="space-y-4">
              {emailMonitors.length > 0 ? (
                emailMonitors.map((m) => (
                  <InfraItem
                    key={m._id}
                    monitor={m}
                    color="red"
                    onDelete={async () => handleDelete(m._id!)}
                    onEdit={() => {
                      handleEdit(m)
                    }}
                  />
                ))
              ) : (
                <p className="px-4 text-[10px] font-medium text-slate-500 italic">
                  No active connectivity monitors.
                </p>
              )}
            </div>
          </div>

          {/* Database & Custom Ports Section */}
          <div className="space-y-6">
            <div className="flex items-center justify-between px-4">
              <h2 className="flex items-center gap-2 text-xl font-black tracking-tight">
                <Database className="h-5 w-5 text-blue-500" />
                Resources & Ports
              </h2>
            </div>

            <div className="space-y-4">
              {dbMonitors.length > 0 ? (
                dbMonitors.map((m) => (
                  <InfraItem
                    key={m._id}
                    monitor={m}
                    color="blue"
                    onDelete={async () => handleDelete(m._id!)}
                    onEdit={() => {
                      handleEdit(m)
                    }}
                  />
                ))
              ) : (
                <p className="px-4 text-[10px] font-medium text-slate-500 italic">
                  No specific resources tracked.
                </p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

const BUCKET_COUNT = 48
const BUCKET_MINUTES = 30

interface CheckResult { timestamp: string; status: string; responseTime?: number }

function buildBarsFromHistory(
  history: CheckResult[],
  createdAt: Date | undefined,
  count: number
): ("UP" | "DOWN" | "WARNING" | "NONE")[] {
  const now = Date.now()
  const windowStart = now - count * BUCKET_MINUTES * 60 * 1000
  const bucketMs = BUCKET_MINUTES * 60 * 1000
  const buckets: ("UP" | "DOWN" | "WARNING" | "NONE")[] = Array(count).fill("NONE")
  for (let i = 0; i < count; i++) {
    const bucketStart = windowStart + i * bucketMs
    const bucketEnd = bucketStart + bucketMs
    if (createdAt && bucketEnd <= new Date(createdAt).getTime()) {continue}
    const inBucket = history.filter((c) => {
      const t = new Date(c.timestamp).getTime()
      return t >= bucketStart && t < bucketEnd
    })
    if (inBucket.length === 0) {continue}
    const latest = inBucket[inBucket.length - 1]
    const s = latest.status.toUpperCase()
    if (s === "UP") {buckets[i] = "UP"}
    else if (s === "WARNING") {buckets[i] = "WARNING"}
    else {buckets[i] = "DOWN"}
  }
  return buckets
}

function InfraItem({ monitor, color, onDelete, onEdit }: any) {
  const { name, target: host, port, status, type, createdAt, responseTime, metadata } = monitor

  const [history, setHistory] = useState<CheckResult[]>([])
  const [historyLoading, setHistoryLoading] = useState(true)

  useEffect(() => {
    if (!monitor._id) {
      setHistoryLoading(false)
      return
    }
    let cancelled = false
    setHistoryLoading(true)
    apiClient
      .get(`/api/monitor/${monitor._id}/history`)
      .then( async (r) => (r.ok ? r.json() : []))
      .then((data: CheckResult[]) => {
        if (!cancelled) {setHistory(data)}
      })
      .catch(() => {
        if (!cancelled) {setHistory([])}
      })
      .finally(() => {
        if (!cancelled) {setHistoryLoading(false)}
      })
    return () => {
      cancelled = true
    }
  }, [monitor._id])

  const colors: any = {
    red: "text-red-500 bg-red-50 dark:bg-red-950/30",
    blue: "text-blue-500 bg-blue-50 dark:bg-blue-950/30",
    emerald: "text-emerald-500 bg-emerald-50 dark:bg-emerald-950/30",
    amber: "text-amber-500 bg-amber-50 dark:bg-amber-950/30",
    indigo: "text-indigo-500 bg-indigo-50 dark:bg-indigo-950/30",
    rose: "text-rose-500 bg-rose-50 dark:bg-rose-950/30"
  }

  const count = BUCKET_COUNT
  const barsData =
    history.length > 0
      ? buildBarsFromHistory(history, createdAt ? new Date(createdAt) : undefined, count)
      : Array(count).fill("NONE" as const)

  const barsForStability = barsData.filter((b) => b !== "NONE")
  const upCount = barsForStability.filter((b) => b === "UP").length
  const stability =
    barsForStability.length > 0
      ? `${Math.round((upCount / barsForStability.length) * 100)}%`
      : historyLoading
        ? "…"
        : "No data"

  // SMTP metadata display
  const isSMTP = type === "SMTP"
  const banner = metadata?.lastBanner || ""
  const authMethods = metadata?.supportedAuthMethods || []
  const tlsVersion = metadata?.tlsVersion || ""

  return (
    <div className="group rounded-[2rem] border border-slate-100 bg-white p-6 shadow-lg transition-all hover:shadow-xl dark:border-slate-800 dark:bg-slate-900">
      <div className="flex items-center gap-4">
        <div
          className={cn(
            "flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl",
            colors[color]
          )}
        >
          <Server className="h-6 w-6" />
        </div>

        <div className="flex-1">
          <div className="flex items-center gap-2">
            <span className="text-[9px] font-black tracking-tighter text-slate-400 uppercase">
              {type}
            </span>
            <h4 className="text-sm font-bold text-slate-900 dark:text-white">{name}</h4>
          </div>
          <p className="text-[11px] font-medium text-slate-500">
            {host}
            {port ? `:${port}` : ""}
          </p>
          {isSMTP && banner && (
            <p className="mt-1 text-[10px] font-medium text-slate-400 italic">{banner}</p>
          )}
        </div>

        <div className="flex items-center gap-6">
          <div className="flex flex-col items-end gap-1">
            <div className="flex items-center gap-3">
              <div
                className={cn(
                  "h-2 w-2 rounded-full",
                  status === "UP"
                    ? "bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.4)]"
                    : status === "WARNING" || status === "PENDING"
                      ? "bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.4)]"
                      : "bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.4)]"
                )}
              />
              <span className="text-[10px] font-black tracking-widest uppercase">{status}</span>
            </div>
            {responseTime && (
              <span className="text-[9px] font-medium text-slate-400">{responseTime}ms</span>
            )}
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="rounded-xl p-1 text-slate-400 transition-colors hover:bg-slate-50 hover:text-slate-900">
                <MoreVertical className="h-4 w-4" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="end"
              className="w-48 rounded-2xl border-slate-100 bg-white p-2 shadow-2xl dark:border-slate-800 dark:bg-slate-900"
            >
              <DropdownMenuItem
                onClick={onEdit}
                className="flex items-center gap-3 rounded-xl px-4 py-3 text-xs font-bold text-slate-600 transition-colors hover:bg-slate-50 hover:text-red-500 dark:text-slate-400 dark:hover:bg-slate-800"
              >
                <Edit2 className="h-4 w-4" />
                Edit details
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={onDelete}
                className="flex items-center gap-3 rounded-xl px-4 py-3 text-xs font-bold text-red-600 transition-colors hover:bg-red-50 dark:hover:bg-red-950/30"
              >
                <Trash2 className="h-4 w-4" />
                Remove node
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* SMTP detailed metadata section */}
      {isSMTP && (authMethods.length > 0 || tlsVersion) && (
        <div className="mt-4 flex flex-col gap-2 border-t border-slate-100 pt-3 dark:border-slate-800">
          <div className="grid grid-cols-2 gap-3 text-[9px]">
            {tlsVersion && (
              <div>
                <span className="font-black tracking-tighter text-slate-400 uppercase">TLS</span>
                <p className="text-slate-600 dark:text-slate-400">{tlsVersion}</p>
              </div>
            )}
            {authMethods.length > 0 && (
              <div>
                <span className="font-black tracking-tighter text-slate-400 uppercase">
                  Auth Methods
                </span>
                <p className="text-slate-600 dark:text-slate-400">{authMethods.join(", ")}</p>
              </div>
            )}
          </div>
        </div>
      )}

      <div className="mt-6 flex flex-col gap-2 opacity-60 transition-opacity group-hover:opacity-100">
        <div className="flex justify-between text-[8px] font-black tracking-widest text-slate-400 uppercase">
          <span>Stability</span>
          <span>{stability}</span>
        </div>
        {historyLoading ? (
          <div className="flex h-6 items-center gap-1">
            <Loader2 className="h-3 w-3 animate-spin text-slate-400" />
            <span className="text-[9px] text-slate-500">Loading history…</span>
          </div>
        ) : (
          <UptimeStatusBars
            data={barsData}
            count={count}
            gap={1}
            className="w-full justify-between"
          />
        )}
        {!historyLoading && history.length === 0 && (
          <p className="text-[9px] text-slate-400">
            History after next checks. Each bar = 30 min window.
          </p>
        )}
      </div>
    </div>
  )
}
