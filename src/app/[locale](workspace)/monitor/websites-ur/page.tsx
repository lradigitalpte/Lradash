"use client"

import { Globe, Loader2, Plus, Activity, ShieldCheck } from "lucide-react"
import { useEffect, useMemo, useState } from "react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { apiClient } from "@/lib/api/client"

interface URMonitor {
  id?: string
  monitorId?: string
  friendlyName?: string
  name?: string
  url?: string
  target?: string
  type?: any
  monitorType?: any
  status?: string
  lastCheckTime?: string
}

function normalizeMonitorId(m: URMonitor) {
  return m.id ?? m.monitorId ?? ""
}

function monitorDisplayName(m: URMonitor) {
  return (m.friendlyName ?? m.name ?? "").toString() || "Untitled monitor"
}

function monitorDisplayTarget(m: URMonitor) {
  const t = (m.url ?? m.target ?? "").toString()
  if (t) {
    return t
  }
  return "—"
}

function isHttpLike(m: URMonitor) {
  const t = (m.url ?? m.target ?? "").toString().toLowerCase()
  if (t.includes("http://") || t.includes("https://")) {
    return true
  }
  // fallback: check type string-ish
  const typeStr = JSON.stringify(m.type ?? m.monitorType ?? "").toLowerCase()
  return typeStr.includes("http") || typeStr.includes("website") || typeStr.includes("https")
}

export default function WebsitesURMonitorPage() {
  const [loading, setLoading] = useState(true)
  const [monitors, setMonitors] = useState<URMonitor[]>([])
  const [uptimeById, setUptimeById] = useState<Record<string, any>>({})

  useEffect(() => {
    ;(async () => {
      setLoading(true)
      try {
        const res = await apiClient.get("/api/uptimerobot/monitors")
        if (!res.ok) {
          toast.error("UptimeRobot not configured or cannot fetch monitors")
          return
        }
        const data = await res.json()
        // data may be object with monitors array; keep it resilient
        const list: URMonitor[] = Array.isArray(data)
          ? data
          : Array.isArray(data.monitors)
            ? data.monitors
            : []
        const filtered = list.filter(isHttpLike)
        setMonitors(filtered)
      } catch {
        toast.error("Failed to fetch UptimeRobot monitors")
      } finally {
        setLoading(false)
      }
    })()
  }, [])

  useEffect(() => {
    if (!monitors.length) {
      return
    }
    // Avoid lots of concurrent calls — the server proxy has caching,
    // but we still keep the UI light.
    const toFetch = monitors
      .slice(0, 8)
      .map((m) => normalizeMonitorId(m))
      .filter(Boolean)
    ;(async () => {
      const next: Record<string, any> = {}
      await Promise.all(
        toFetch.map(async (id) => {
          try {
            const res = await apiClient.get(`/api/uptimerobot/monitors/${id}/stats/uptime`)
            if (res.ok) {
              next[id] = await res.json()
            }
          } catch {
            // ignore per-monitor failures
          }
        })
      )
      setUptimeById(next)
    })()
  }, [monitors])

  const stats = useMemo(() => {
    const total = monitors.length
    const up = monitors.filter((m) =>
      String(m.status ?? "")
        .toLowerCase()
        .includes("up")
    ).length
    const down = total - up
    return { total, up, down }
  }, [monitors])

  return (
    <div className="space-y-8">
      <div className="flex items-end justify-between">
        <div>
          <span className="text-[10px] font-black tracking-[0.2em] text-red-500 uppercase">
            Services
          </span>
          <h1 className="text-4xl font-black tracking-tighter">
            Website <span className="text-slate-400">UptimeRobot</span>
          </h1>
        </div>
        <div className="flex gap-3">
          <div className="flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-2">
            <ShieldCheck className="h-4 w-4 text-emerald-600" />
            <span className="text-[10px] font-black tracking-widest text-emerald-700 uppercase">
              {stats.up}/{stats.total} up
            </span>
          </div>
          <button
            onClick={() =>
              toast.info("Add/Edit monitor will be wired in Step 3 (UptimeRobot CRUD)")
            }
            className="flex items-center gap-2 rounded-2xl bg-slate-900 px-6 py-3 text-sm font-black text-white transition-all hover:bg-red-600 dark:bg-white dark:text-slate-900"
          >
            <Plus className="h-4 w-4" />
            Add Monitor
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
        <div className="rounded-[1.5rem] border border-slate-100 bg-white p-5">
          <p className="text-[10px] font-black tracking-widest text-slate-400 uppercase">
            Monitors
          </p>
          <p className="mt-2 text-3xl font-black">{stats.total}</p>
          <p className="mt-1 text-[11px] font-bold text-slate-400">Tracked by UptimeRobot</p>
        </div>
        <div className="rounded-[1.5rem] border border-slate-100 bg-white p-5">
          <p className="text-[10px] font-black tracking-widest text-slate-400 uppercase">Uptime</p>
          <p className="mt-2 text-3xl font-black">
            {stats.total > 0 ? `${Math.round((stats.up / stats.total) * 1000) / 10}%` : "---"}
          </p>
          <p className="mt-1 text-[11px] font-bold text-slate-400">Based on current status</p>
        </div>
        <div className="rounded-[1.5rem] border border-slate-100 bg-white p-5">
          <p className="text-[10px] font-black tracking-widest text-slate-400 uppercase">
            Degraded
          </p>
          <p className="mt-2 text-3xl font-black text-red-600">{stats.down}</p>
          <p className="mt-1 text-[11px] font-bold text-slate-400">Currently down/unknown</p>
        </div>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center gap-4 py-20">
          <Loader2 className="h-8 w-8 animate-spin text-slate-300" />
          <p className="text-[10px] font-black tracking-widest text-slate-400 uppercase">
            Loading UptimeRobot…
          </p>
        </div>
      ) : monitors.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-[2.5rem] border-2 border-dashed border-slate-100 py-20 dark:border-slate-800">
          <Globe className="mb-4 h-12 w-12 text-slate-200" />
          <p className="text-sm font-bold text-slate-400">No HTTP monitors found</p>
          <p className="mt-2 text-[10px] font-medium text-slate-500 italic">
            Configure UptimeRobot token in the sidebar.
          </p>
        </div>
      ) : (
        <div className="grid gap-6">
          {monitors.map((m) => {
            const id = normalizeMonitorId(m)
            const status = String(m.status ?? "").toUpperCase()
            const up = status.includes("UP") || status === "UP" || status.includes("ON")
            const uptimeData = id ? uptimeById[id] : null
            const avgUptime =
              typeof uptimeData?.avgUptime === "number"
                ? uptimeData.avgUptime
                : typeof uptimeData?.avgUptimePercentage === "number"
                  ? uptimeData.avgUptimePercentage
                  : typeof uptimeData?.avgUptimePercent === "number"
                    ? uptimeData.avgUptimePercent
                    : null
            return (
              <div
                key={id || `${m.friendlyName}-${m.url}`}
                className="rounded-[2rem] border border-slate-100 bg-white p-5"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-black text-slate-900">
                      {monitorDisplayName(m)}
                    </p>
                    <p className="mt-1 text-[11px] font-bold break-words text-slate-400">
                      {monitorDisplayTarget(m)}
                    </p>
                    {avgUptime != null && (
                      <p className="mt-2 text-[10px] font-bold tracking-widest text-slate-500 uppercase">
                        Avg uptime: {Math.round(avgUptime * 10) / 10}%
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <Activity className={`h-4 w-4 ${up ? "text-emerald-600" : "text-red-600"}`} />
                    <span
                      className={`rounded-full px-2 py-1 text-[10px] font-black uppercase ${
                        up ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-600"
                      }`}
                    >
                      {up ? "UP" : "DOWN"}
                    </span>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
