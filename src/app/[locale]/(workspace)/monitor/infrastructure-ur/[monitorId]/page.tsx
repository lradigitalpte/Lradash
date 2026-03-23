"use client"

import { Activity, ArrowLeft, Clock, Loader2, Mail, RefreshCw, ShieldCheck } from "lucide-react"
import Link from "next/link"
import { useParams } from "next/navigation"
import { useEffect, useMemo, useState } from "react"
import { toast } from "sonner"

import { UptimeStatusBars } from "@/components/monitor/UptimeStatusBars"
import { apiClient } from "@/lib/api/client"

interface URMonitor {
  id?: string
  friendlyName?: string
  url?: string
  target?: string
  status?: string
  currentStateDuration?: number
  lastIncident?: {
    status?: string
    reason?: string
    id?: string
  } | null
  interval?: number
  createDateTime?: string
  port?: number | null
  gracePeriod?: number
  timeout?: number
}

interface HistoryEntry {
  status: string
  checkedAt: string
}

function formatDuration(seconds: number): string {
  const d = Math.floor(seconds / 86400)
  const h = Math.floor((seconds % 86400) / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  if (d > 0) {
    return `${d} day${d !== 1 ? "s" : ""} ${h}h`
  }
  if (h > 0) {
    return `${h}h ${m}m`
  }
  return `${m} min`
}

function historyToBars(history: HistoryEntry[]): ("UP" | "DOWN" | "WARNING" | "NONE")[] {
  return history.map((s) => {
    const st = s.status.toUpperCase()
    if (st === "DOWN") {
      return "DOWN"
    }
    if (st === "WARNING") {
      return "WARNING"
    }
    if (st === "UP") {
      return "UP"
    }
    return "NONE"
  })
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline justify-between gap-4 border-b border-slate-50 py-1.5 last:border-0 dark:border-slate-800">
      <span className="text-[11px] font-black tracking-wider text-slate-400 uppercase dark:text-slate-500">
        {label}
      </span>
      <span className="text-right text-[12px] font-bold text-slate-900 dark:text-white">
        {value}
      </span>
    </div>
  )
}

export default function InfrastructureURMonitorDetailPage() {
  const params = useParams()
  const locale = (params?.locale ?? "en") as string
  const monitorIdParam = params?.monitorId
  const monitorId = (Array.isArray(monitorIdParam) ? monitorIdParam[0] : monitorIdParam)!

  const [loading, setLoading] = useState(true)
  const [monitor, setMonitor] = useState<URMonitor | null>(null)
  const [history, setHistory] = useState<HistoryEntry[]>([])
  const [refreshing, setRefreshing] = useState(false)

  async function load() {
    if (!monitorId) {
      return
    }
    setLoading(true)
    try {
      const [listRes, histRes] = await Promise.all([
        apiClient.get("/api/uptimerobot/monitors"),
        apiClient.get(`/api/uptimerobot/history/${monitorId}?limit=48`)
      ])
      if (listRes.ok) {
        const data = await listRes.json()
        const list: URMonitor[] = Array.isArray(data)
          ? data
          : Array.isArray(data?.data)
            ? data.data
            : []
        const found = list.find((m) => String(m.id) === monitorId)
        if (found) {
          setMonitor(found)
        }
      }
      if (histRes.ok) {
        setHistory(await histRes.json())
      }
    } catch {
      toast.error("Failed to load monitor details")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void load()
  }, [monitorId])

  async function handleRefresh() {
    setRefreshing(true)
    await Promise.all([
      load(),
      apiClient.post("/api/uptimerobot/snapshot", {}).catch(() => undefined)
    ])
    setRefreshing(false)
    toast.success("Refreshed & snapshot saved")
  }

  const bars = useMemo(() => historyToBars(history), [history])
  const up = String(monitor?.status ?? "")
    .toUpperCase()
    .includes("UP")
  const durationSec = monitor?.currentStateDuration ?? 0

  const uptimePct = useMemo(() => {
    if (!bars.length) {
      return null
    }
    const upCount = bars.filter((b) => b === "UP").length
    return Math.round((upCount / bars.length) * 1000) / 10
  }, [bars])

  const displayTarget = String(monitor?.target ?? monitor?.url ?? "—")

  return (
    <div className="mx-auto max-w-5xl space-y-6 px-4 py-8 text-slate-900 dark:text-white">
      {/* Back link */}
      <div className="flex items-center justify-between">
        <Link
          href={`/${locale}/monitor/infrastructure-ur`}
          className="inline-flex items-center gap-2 text-[11px] font-black tracking-widest text-slate-500 uppercase transition-colors hover:text-red-500"
        >
          <ArrowLeft className="h-3 w-3" />
          Back to Infrastructure
        </Link>
        <button
          onClick={handleRefresh}
          disabled={refreshing || loading}
          className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-[11px] font-black text-slate-500 transition-all hover:border-red-200 hover:text-red-500 disabled:opacity-40 dark:border-slate-800 dark:bg-slate-900/40 dark:text-slate-400"
        >
          <RefreshCw className={`h-3 w-3 ${refreshing ? "animate-spin" : ""}`} />
          Refresh
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center gap-3 rounded-[2rem] border border-slate-100 bg-white p-16 dark:border-slate-800 dark:bg-slate-900/40">
          <Loader2 className="h-8 w-8 animate-spin text-slate-300" />
          <p className="text-[12px] font-black tracking-widest text-slate-400 uppercase">
            Loading…
          </p>
        </div>
      ) : !monitor ? (
        <div className="rounded-[2rem] border border-slate-100 bg-white p-16 text-center dark:border-slate-800 dark:bg-slate-900/40">
          <Mail className="mx-auto mb-4 h-10 w-10 text-slate-300" />
          <p className="text-sm font-bold text-slate-400">Monitor not found</p>
        </div>
      ) : (
        <>
          {/* Hero card */}
          <div className="rounded-[2rem] border border-slate-100 bg-white p-8 dark:border-slate-800 dark:bg-slate-900/40">
            <div className="flex flex-wrap items-start justify-between gap-6">
              <div className="flex items-start gap-4">
                <div className="flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-2xl bg-slate-100 dark:bg-slate-800">
                  <Mail className="h-7 w-7 text-slate-500 dark:text-slate-300" />
                </div>
                <div>
                  <h1 className="text-2xl font-black tracking-tighter">
                    {monitor.friendlyName ?? "Monitor"}
                  </h1>
                  <p className="mt-1 text-sm font-bold text-slate-400">{displayTarget}</p>
                  {monitor.port && (
                    <p className="mt-0.5 text-[11px] font-bold text-slate-500">
                      Port {monitor.port}
                    </p>
                  )}
                </div>
              </div>

              <div className="flex flex-col items-end gap-2">
                <span
                  className={`rounded-full px-5 py-1.5 text-[11px] font-black uppercase ${
                    up
                      ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300"
                      : "bg-red-50 text-red-600 dark:bg-red-500/10 dark:text-red-300"
                  }`}
                >
                  {up ? "Stable" : "Down"}
                </span>
                {durationSec > 0 && (
                  <div className="flex items-center gap-1.5 text-[11px] font-bold text-slate-500 dark:text-slate-400">
                    <Clock className="h-3 w-3" />
                    {up ? "Stable for" : "Down for"} {formatDuration(durationSec)}
                  </div>
                )}
                {uptimePct !== null && (
                  <div className="flex items-center gap-1.5 text-[11px] font-bold text-slate-500 dark:text-slate-400">
                    <ShieldCheck className="h-3 w-3 text-emerald-500" />
                    {uptimePct}% stable (recorded)
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Stability history */}
          <div className="rounded-[2rem] border border-slate-100 bg-white p-6 dark:border-slate-800 dark:bg-slate-900/40">
            <div className="mb-4 flex items-center justify-between">
              <p className="text-[10px] font-black tracking-widest text-slate-400 uppercase">
                Stability History
              </p>
              <p className="text-[10px] font-black tracking-widest text-slate-400 uppercase">
                {bars.length} checks recorded
              </p>
            </div>

            {bars.length > 0 ? (
              <>
                <UptimeStatusBars
                  data={bars}
                  count={bars.length}
                  gap={2}
                  barHeightClassName="h-12"
                  className="w-full justify-between"
                />
                <div className="mt-3 flex justify-between text-[9px] font-medium text-slate-400 italic">
                  <span>Oldest</span>
                  <span>Checked every {Math.round((monitor.interval ?? 300) / 60)} min</span>
                  <span>Now</span>
                </div>
              </>
            ) : (
              <div className="flex flex-col items-center gap-3 rounded-2xl bg-slate-50 py-10 dark:bg-slate-800/40">
                <Activity className="h-8 w-8 text-slate-300" />
                <p className="text-sm font-bold text-slate-400">No history recorded yet</p>
                <p className="text-center text-[11px] font-medium text-slate-500">
                  History builds as you visit monitoring pages.
                  <br />
                  Click Refresh above to save a snapshot now.
                </p>
              </div>
            )}
          </div>

          {/* Details grid */}
          <div className="grid gap-6 md:grid-cols-2">
            <div className="rounded-[2rem] border border-slate-100 bg-white p-6 dark:border-slate-800 dark:bg-slate-900/40">
              <p className="mb-4 text-[10px] font-black tracking-widest text-slate-400 uppercase">
                Monitor Config
              </p>
              <DetailRow
                label="Check interval"
                value={`Every ${Math.round((monitor.interval ?? 300) / 60)} min`}
              />
              {monitor.port != null && <DetailRow label="Port" value={String(monitor.port)} />}
              <DetailRow label="Timeout" value={`${monitor.timeout ?? 30}s`} />
              <DetailRow label="Grace period" value={`${monitor.gracePeriod ?? 0}s`} />
              {monitor.createDateTime && (
                <DetailRow
                  label="Created"
                  value={new Date(monitor.createDateTime).toLocaleDateString("en-GB", {
                    day: "numeric",
                    month: "short",
                    year: "numeric"
                  })}
                />
              )}
            </div>

            <div className="rounded-[2rem] border border-slate-100 bg-white p-6 dark:border-slate-800 dark:bg-slate-900/40">
              <p className="mb-4 text-[10px] font-black tracking-widest text-slate-400 uppercase">
                Last Incident
              </p>
              {monitor.lastIncident ? (
                <div>
                  <DetailRow label="Incident status" value={monitor.lastIncident.status ?? "—"} />
                  {monitor.lastIncident.reason && (
                    <DetailRow label="Reason" value={monitor.lastIncident.reason} />
                  )}
                </div>
              ) : (
                <div className="flex items-center gap-3 rounded-xl bg-emerald-50 p-4 dark:bg-emerald-500/10">
                  <ShieldCheck className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                  <p className="text-[12px] font-bold text-emerald-700 dark:text-emerald-300">
                    No incidents recorded
                  </p>
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  )
}
