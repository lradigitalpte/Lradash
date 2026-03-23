"use client"

import {
  Activity,
  AlertTriangle,
  ArrowLeft,
  CheckCircle2,
  Clock,
  ExternalLink,
  Globe,
  Loader2,
  RefreshCw,
  ShieldCheck
} from "lucide-react"
import Link from "next/link"
import { useParams } from "next/navigation"
import { useEffect, useMemo, useState } from "react"
import { toast } from "sonner"

import { UptimeStatusBars } from "@/components/monitor/UptimeStatusBars"
import { apiClient } from "@/lib/api/client"

/* ---------- Types ---------- */
interface URMonitor {
  id?: string
  friendlyName?: string
  url?: string
  status?: string
  currentStateDuration?: number
  lastIncident?: { status?: string; reason?: string } | null
  interval?: number
  createDateTime?: string
  httpMethodType?: string
  authType?: string
  gracePeriod?: number
  timeout?: number
  successHttpResponseCodes?: string[]
  followRedirections?: boolean
}

interface DailyRatio {
  date: string
  ratio: string
  label: string
  color: string
}

interface PspMonitor {
  monitorId: number
  name: string
  statusClass: string
  dailyRatios?: DailyRatio[]
  "30dRatio"?: { ratio: string; label: string; color: string }
  "90dRatio"?: { ratio: string; label: string; color: string }
  lastDowntime?: { date: string; duration: number; reason: string } | null
}

interface HistoryEntry {
  status: string
  checkedAt: string
}

/* ---------- Helpers ---------- */
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

function formatDowntimeDuration(seconds: number): string {
  if (seconds < 60) {
    return `${seconds}s`
  }
  const m = Math.floor(seconds / 60)
  const h = Math.floor(m / 60)
  if (h > 0) {
    return `${h}h ${m % 60}m`
  }
  return `${m}m`
}

function pspColorToStatus(color: string, ratio: string): "UP" | "DOWN" | "WARNING" | "NONE" {
  if (color === "green") {
    return "UP"
  }
  if (color === "yellow") {
    return "WARNING"
  }
  if (color === "red") {
    return "DOWN"
  }
  const r = parseFloat(ratio)
  if (!isNaN(r)) {
    if (r >= 99) {
      return "UP"
    }
    if (r >= 80) {
      return "WARNING"
    }
    return "DOWN"
  }
  return "NONE"
}

function localHistoryToBars(history: HistoryEntry[]): ("UP" | "DOWN" | "WARNING" | "NONE")[] {
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

function RatioChip({ label, ratio, color }: { label: string; ratio: string; color: string }) {
  const pct = parseFloat(ratio).toFixed(2)
  const chipColor =
    color === "green"
      ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300"
      : color === "yellow"
        ? "bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-300"
        : "bg-red-50 text-red-700 dark:bg-red-500/10 dark:text-red-300"
  return (
    <div className={`rounded-2xl px-4 py-3 ${chipColor}`}>
      <p className="text-[9px] font-black tracking-widest uppercase opacity-70">{label}</p>
      <p className="text-2xl font-black">{pct}%</p>
    </div>
  )
}

/* ---------- Page ---------- */
export default function WebsitesURMonitorDetailPage() {
  const params = useParams()
  const locale = (params?.locale ?? "en") as string
  const monitorIdParam = params?.monitorId
  const monitorId = (Array.isArray(monitorIdParam) ? monitorIdParam[0] : monitorIdParam)!

  const [loading, setLoading] = useState(true)
  const [monitor, setMonitor] = useState<URMonitor | null>(null)
  const [pspMon, setPspMon] = useState<PspMonitor | null>(null)
  const [history, setHistory] = useState<HistoryEntry[]>([])
  const [refreshing, setRefreshing] = useState(false)

  async function load() {
    if (!monitorId) {
      return
    }
    setLoading(true)
    try {
      const [listRes, pspRes, histRes] = await Promise.all([
        apiClient.get("/api/uptimerobot/monitors"),
        apiClient.get("/api/uptimerobot/psp"),
        apiClient.get(`/api/uptimerobot/history/${monitorId}?limit=90`)
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

      if (pspRes.ok) {
        const pspData = await pspRes.json()
        const found = (pspData?.data ?? []).find(
          (pm: PspMonitor) => String(pm.monitorId) === monitorId
        )
        if (found) {
          setPspMon(found)
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
    toast.success("Refreshed")
  }

  const up = String(monitor?.status ?? "")
    .toUpperCase()
    .includes("UP")
  const durationSec = monitor?.currentStateDuration ?? 0

  // PSP bars (all 90 days)
  const { pspBars, pspLabels } = useMemo(() => {
    if (!pspMon?.dailyRatios?.length) {
      return { pspBars: [], pspLabels: [] }
    }
    const bars = pspMon.dailyRatios.map((d) => pspColorToStatus(d.color, d.ratio))
    const labels = pspMon.dailyRatios.map((d) => {
      const dt = new Date(d.date)
      return dt.toLocaleDateString("en-GB", { day: "numeric", month: "short" })
    })
    return { pspBars: bars, pspLabels: labels }
  }, [pspMon])

  // Fallback: local snapshots
  const localBars = useMemo(() => localHistoryToBars(history), [history])

  const bars = pspBars.length ? pspBars : localBars
  const labels = pspBars.length ? pspLabels : undefined
  const hasPsp = pspBars.length > 0

  const uptimePct = useMemo(() => {
    if (!bars.length) {
      return null
    }
    const upCount = bars.filter((b) => b === "UP").length
    return Math.round((upCount / bars.length) * 1000) / 10
  }, [bars])

  return (
    <div className="mx-auto max-w-5xl space-y-6 px-4 py-8 text-slate-900 dark:text-white">
      {/* Back + Refresh */}
      <div className="flex items-center justify-between">
        <Link
          href={`/${locale}/monitor/websites-ur`}
          className="inline-flex items-center gap-2 text-[11px] font-black tracking-widest text-slate-500 uppercase transition-colors hover:text-red-500"
        >
          <ArrowLeft className="h-3 w-3" />
          Back to Websites
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
          <Globe className="mx-auto mb-4 h-10 w-10 text-slate-300" />
          <p className="text-sm font-bold text-slate-400">Monitor not found</p>
        </div>
      ) : (
        <>
          {/* Hero */}
          <div className="rounded-[2rem] border border-slate-100 bg-white p-8 dark:border-slate-800 dark:bg-slate-900/40">
            <div className="flex flex-wrap items-start justify-between gap-6">
              <div className="flex items-start gap-4">
                <div className="flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-2xl bg-slate-100 dark:bg-slate-800">
                  <Globe className="h-7 w-7 text-slate-500 dark:text-slate-300" />
                </div>
                <div>
                  <h1 className="text-2xl font-black tracking-tighter">
                    {monitor.friendlyName ?? "Monitor"}
                  </h1>
                  <a
                    href={monitor.url ?? "#"}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-1 inline-flex items-center gap-1.5 text-sm font-bold text-slate-400 transition-colors hover:text-red-500"
                  >
                    {monitor.url ?? "—"}
                    <ExternalLink className="h-3.5 w-3.5" />
                  </a>
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
                  {up ? "Operational" : "Down"}
                </span>
                {durationSec > 0 && (
                  <div className="flex items-center gap-1.5 text-[11px] font-bold text-slate-500 dark:text-slate-400">
                    <Clock className="h-3 w-3" />
                    {up ? "Operational for" : "Down for"} {formatDuration(durationSec)}
                  </div>
                )}
                {uptimePct !== null && (
                  <div className="flex items-center gap-1.5 text-[11px] font-bold text-slate-500 dark:text-slate-400">
                    <ShieldCheck className="h-3 w-3 text-emerald-500" />
                    {uptimePct}% uptime (
                    {hasPsp ? `${pspBars.length}d` : `${localBars.length} checks`})
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* 30d / 90d ratio chips */}
          {(pspMon?.["30dRatio"] || pspMon?.["90dRatio"]) && (
            <div className="grid grid-cols-2 gap-4">
              {pspMon["30dRatio"] && (
                <RatioChip
                  label="30-day uptime"
                  ratio={pspMon["30dRatio"].ratio}
                  color={pspMon["30dRatio"].color}
                />
              )}
              {pspMon["90dRatio"] && (
                <RatioChip
                  label="90-day uptime"
                  ratio={pspMon["90dRatio"].ratio}
                  color={pspMon["90dRatio"].color}
                />
              )}
            </div>
          )}

          {/* Uptime history bars */}
          <div className="rounded-[2rem] border border-slate-100 bg-white p-6 dark:border-slate-800 dark:bg-slate-900/40">
            <div className="mb-4 flex items-center justify-between">
              <p className="text-[10px] font-black tracking-widest text-slate-400 uppercase">
                {hasPsp ? `Uptime History — ${pspBars.length} days` : "Uptime History"}
              </p>
              {hasPsp && (
                <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[9px] font-black tracking-widest text-emerald-700 uppercase dark:bg-emerald-500/10 dark:text-emerald-300">
                  Real data from UptimeRobot
                </span>
              )}
            </div>

            {bars.length > 0 ? (
              <>
                <UptimeStatusBars
                  data={bars}
                  count={bars.length}
                  labels={labels}
                  gap={1}
                  barHeightClassName="h-12"
                  className="w-full justify-between"
                />
                <div className="mt-3 flex justify-between text-[9px] font-medium text-slate-400 italic">
                  <span>{hasPsp ? pspLabels[0] : "Oldest"}</span>
                  <span>
                    {hasPsp
                      ? "Each bar = 1 day (hover for date)"
                      : `Every ${Math.round((monitor.interval ?? 300) / 60)} min`}
                  </span>
                  <span>Today</span>
                </div>
              </>
            ) : (
              <div className="flex flex-col items-center gap-3 rounded-2xl bg-slate-50 py-10 dark:bg-slate-800/40">
                <Activity className="h-8 w-8 text-slate-300" />
                <p className="text-sm font-bold text-slate-400">No history yet</p>
                <p className="text-center text-[11px] font-medium text-slate-500">
                  Add your{" "}
                  <code className="rounded bg-slate-100 px-1 font-mono">
                    stats.uptimerobot.com/XXXX
                  </code>{" "}
                  URL in UptimeRobot Config for 90 days of real history.
                </p>
              </div>
            )}
          </div>

          {/* Last downtime + incidents */}
          {pspMon?.lastDowntime && (
            <div className="rounded-[2rem] border border-amber-100 bg-amber-50 p-6 dark:border-amber-900/30 dark:bg-amber-900/10">
              <div className="mb-3 flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                <p className="text-[10px] font-black tracking-widest text-amber-700 uppercase dark:text-amber-300">
                  Last Downtime
                </p>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <p className="text-[9px] font-black tracking-widest text-amber-600/60 uppercase dark:text-amber-400/60">
                    Date
                  </p>
                  <p className="mt-0.5 text-[12px] font-bold text-amber-900 dark:text-amber-200">
                    {new Date(pspMon.lastDowntime.date).toLocaleDateString("en-GB", {
                      day: "numeric",
                      month: "short",
                      year: "numeric"
                    })}
                  </p>
                </div>
                <div>
                  <p className="text-[9px] font-black tracking-widest text-amber-600/60 uppercase dark:text-amber-400/60">
                    Duration
                  </p>
                  <p className="mt-0.5 text-[12px] font-bold text-amber-900 dark:text-amber-200">
                    {formatDowntimeDuration(pspMon.lastDowntime.duration)}
                  </p>
                </div>
                <div>
                  <p className="text-[9px] font-black tracking-widest text-amber-600/60 uppercase dark:text-amber-400/60">
                    Reason
                  </p>
                  <p className="mt-0.5 text-[12px] font-bold text-amber-900 dark:text-amber-200">
                    {pspMon.lastDowntime.reason}
                  </p>
                </div>
              </div>
            </div>
          )}

          {!pspMon?.lastDowntime && (
            <div className="flex items-center gap-3 rounded-[2rem] border border-emerald-100 bg-emerald-50 p-5 dark:border-emerald-900/30 dark:bg-emerald-900/10">
              <CheckCircle2 className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
              <p className="text-[12px] font-bold text-emerald-700 dark:text-emerald-300">
                No recorded downtime
              </p>
            </div>
          )}

          {/* Monitor config */}
          <div className="grid gap-6 md:grid-cols-2">
            <div className="rounded-[2rem] border border-slate-100 bg-white p-6 dark:border-slate-800 dark:bg-slate-900/40">
              <p className="mb-4 text-[10px] font-black tracking-widest text-slate-400 uppercase">
                Monitor Config
              </p>
              <DetailRow
                label="Check interval"
                value={`Every ${Math.round((monitor.interval ?? 300) / 60)} min`}
              />
              <DetailRow label="HTTP method" value={monitor.httpMethodType ?? "HEAD"} />
              <DetailRow label="Auth" value={monitor.authType ?? "None"} />
              {(monitor.successHttpResponseCodes ?? []).length > 0 && (
                <DetailRow
                  label="Success codes"
                  value={(monitor.successHttpResponseCodes ?? []).join(", ")}
                />
              )}
              <DetailRow label="Timeout" value={`${monitor.timeout ?? 30}s`} />
              <DetailRow label="Grace period" value={`${monitor.gracePeriod ?? 0}s`} />
              <DetailRow
                label="Follow redirects"
                value={monitor.followRedirections ? "Yes" : "No"}
              />
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
                Daily Breakdown (recent)
              </p>
              {(pspMon?.dailyRatios ?? []).length > 0 ? (
                <div className="max-h-64 space-y-1.5 overflow-y-auto pr-1">
                  {[...(pspMon?.dailyRatios ?? [])]
                    .reverse()
                    .slice(0, 14)
                    .map((d) => {
                      const st = pspColorToStatus(d.color, d.ratio)
                      return (
                        <div key={d.date} className="flex items-center justify-between gap-4">
                          <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400">
                            {d.date}
                          </span>
                          <div className="flex items-center gap-2">
                            <span
                              className={`text-[11px] font-black ${
                                st === "UP"
                                  ? "text-emerald-600 dark:text-emerald-400"
                                  : st === "WARNING"
                                    ? "text-amber-600 dark:text-amber-400"
                                    : "text-red-600 dark:text-red-400"
                              }`}
                            >
                              {parseFloat(d.ratio).toFixed(2)}%
                            </span>
                            <span
                              className={`rounded-full px-2 py-0.5 text-[9px] font-black uppercase ${
                                st === "UP"
                                  ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300"
                                  : st === "WARNING"
                                    ? "bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-300"
                                    : "bg-red-50 text-red-700 dark:bg-red-500/10 dark:text-red-300"
                              }`}
                            >
                              {d.label}
                            </span>
                          </div>
                        </div>
                      )
                    })}
                </div>
              ) : (
                <p className="text-[11px] text-slate-400">
                  Configure your status page URL in UptimeRobot Config to see daily breakdown.
                </p>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  )
}
