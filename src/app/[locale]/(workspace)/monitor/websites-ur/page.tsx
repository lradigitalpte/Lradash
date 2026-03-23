"use client"

import {
  Activity,
  Edit2,
  ExternalLink,
  Globe,
  Loader2,
  MoreVertical,
  Plus,
  RefreshCw,
  ShieldCheck,
  Trash2,
  X
} from "lucide-react"
import Link from "next/link"
import { useParams } from "next/navigation"
import { useEffect, useMemo, useRef, useState } from "react"
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

interface PspData {
  data?: PspMonitor[]
  status?: string
}

interface HistoryEntry {
  status: string
  checkedAt: string
}
type HistoryMap = Record<string, HistoryEntry[]>

interface MonitorFormData {
  friendlyName: string
  url: string
  interval: number
}

/* ---------- Helpers ---------- */
function formatDuration(seconds: number): string {
  const d = Math.floor(seconds / 86400)
  const h = Math.floor((seconds % 86400) / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  if (d > 0) {
    return `${d}d ${h}h`
  }
  if (h > 0) {
    return `${h}h ${m}m`
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

function pspDailyToBars(
  dailyRatios: DailyRatio[],
  last?: number
): { bars: ("UP" | "DOWN" | "WARNING" | "NONE")[]; labels: string[] } {
  const slice = last ? dailyRatios.slice(-last) : dailyRatios
  return {
    bars: slice.map((d) => pspColorToStatus(d.color, d.ratio)),
    labels: slice.map((d) => {
      const dt = new Date(d.date)
      return dt.toLocaleDateString("en-GB", { day: "numeric", month: "short" })
    })
  }
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

/* ---------- Monitor Form Modal ---------- */
function MonitorModal({
  mode,
  initial,
  onClose,
  onSave
}: {
  mode: "add" | "edit"
  initial?: Partial<MonitorFormData & { id: string }>
  onClose: () => void
  onSave: () => void
}) {
  const [form, setForm] = useState<MonitorFormData>({
    friendlyName: initial?.friendlyName ?? "",
    url: initial?.url ?? "",
    interval: initial?.interval ?? 300
  })
  const [saving, setSaving] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.friendlyName.trim()) {
      return toast.error("Name is required")
    }
    if (!form.url.trim()) {
      return toast.error("URL is required")
    }
    if (!form.url.startsWith("http")) {
      return toast.error("URL must start with http:// or https://")
    }

    setSaving(true)
    try {
      const res =
        mode === "add"
          ? await apiClient.post("/api/uptimerobot/monitors", {
              friendlyName: form.friendlyName.trim(),
              url: form.url.trim(),
              type: "HTTP",
              interval: form.interval
            })
          : await apiClient.put(`/api/uptimerobot/monitors/${initial?.id}`, {
              friendlyName: form.friendlyName.trim(),
              url: form.url.trim(),
              interval: form.interval
            })

      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err.error || "Failed")
      }
      toast.success(mode === "add" ? "Monitor created in UptimeRobot" : "Monitor updated")
      onSave()
      onClose()
    } catch (e: any) {
      toast.error(e?.message || "Failed to save monitor")
    } finally {
      setSaving(false)
    }
  }

  const intervalOptions = [
    { label: "Every 5 min", value: 300 },
    { label: "Every 10 min", value: 600 },
    { label: "Every 15 min", value: 900 },
    { label: "Every 30 min", value: 1800 },
    { label: "Every 1 hour", value: 3600 }
  ]

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-md rounded-[2rem] border border-slate-100 bg-white shadow-2xl dark:border-slate-800 dark:bg-slate-900">
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4 dark:border-slate-800">
          <h2 className="text-sm font-black">
            {mode === "add" ? "Add Website Monitor" : "Edit Monitor"}
          </h2>
          <button
            onClick={onClose}
            className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4 p-6">
          <div>
            <label className="mb-1 block text-[10px] font-black tracking-widest text-slate-500 uppercase">
              Display Name *
            </label>
            <input
              value={form.friendlyName}
              onChange={(e) => {
                setForm((f) => ({ ...f, friendlyName: e.target.value }))
              }}
              placeholder="My Website"
              required
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm font-bold text-slate-900 placeholder:font-normal placeholder:text-slate-400 focus:border-blue-400 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
            />
          </div>
          <div>
            <label className="mb-1 block text-[10px] font-black tracking-widest text-slate-500 uppercase">
              URL *
            </label>
            <input
              value={form.url}
              onChange={(e) => {
                setForm((f) => ({ ...f, url: e.target.value }))
              }}
              placeholder="https://example.com"
              type="url"
              required
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm font-bold text-slate-900 placeholder:font-normal placeholder:text-slate-400 focus:border-blue-400 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
            />
          </div>
          <div>
            <label className="mb-1 block text-[10px] font-black tracking-widest text-slate-500 uppercase">
              Check Interval
            </label>
            <select
              value={form.interval}
              onChange={(e) => {
                setForm((f) => ({ ...f, interval: Number(e.target.value) }))
              }}
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm font-bold text-slate-900 focus:border-blue-400 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
            >
              {intervalOptions.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </div>
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 rounded-xl border border-slate-200 py-2.5 text-sm font-black text-slate-500 hover:bg-slate-50 dark:border-slate-700 dark:hover:bg-slate-800"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex-1 rounded-xl bg-slate-900 py-2.5 text-sm font-black text-white hover:bg-red-600 disabled:opacity-50 dark:bg-white dark:text-slate-900"
            >
              {saving ? "Saving…" : mode === "add" ? "Create Monitor" : "Save Changes"}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

function DeleteConfirm({
  name,
  onConfirm,
  onCancel
}: {
  name: string
  onConfirm: () => void
  onCancel: () => void
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-sm rounded-[2rem] border border-slate-100 bg-white p-8 shadow-2xl dark:border-slate-800 dark:bg-slate-900">
        <h3 className="text-base font-black">Delete monitor?</h3>
        <p className="mt-2 text-sm text-slate-500">
          <strong className="text-slate-800 dark:text-white">{name}</strong> will be permanently
          removed from UptimeRobot.
        </p>
        <div className="mt-6 flex gap-3">
          <button
            onClick={onCancel}
            className="flex-1 rounded-xl border border-slate-200 py-2.5 text-sm font-black text-slate-500 hover:bg-slate-50 dark:border-slate-700 dark:hover:bg-slate-800"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 rounded-xl bg-red-600 py-2.5 text-sm font-black text-white hover:bg-red-700"
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  )
}

/* ---------- Page ---------- */
export default function WebsitesURMonitorPage() {
  const params = useParams()
  const locale = (params?.locale ?? "en") as string

  const [loading, setLoading] = useState(true)
  const [monitors, setMonitors] = useState<URMonitor[]>([])
  const [pspData, setPspData] = useState<PspData | null>(null)
  const [historyMap, setHistoryMap] = useState<HistoryMap>({})
  const [refreshing, setRefreshing] = useState(false)
  const [statusPageUrl, setStatusPageUrl] = useState("")
  const [openMenuId, setOpenMenuId] = useState<string | null>(null)
  const [modal, setModal] = useState<null | { mode: "add" | "edit"; monitor?: URMonitor }>(null)
  const [deleteTarget, setDeleteTarget] = useState<URMonitor | null>(null)
  const snapshotFiredRef = useRef(false)

  async function loadMonitors() {
    setLoading(true)
    try {
      const res = await apiClient.get("/api/uptimerobot/monitors")
      if (!res.ok) {
        toast.error("Could not fetch monitors")
        return
      }
      const data = await res.json()
      const list: URMonitor[] = Array.isArray(data)
        ? data
        : Array.isArray(data?.monitors)
          ? data.monitors
          : Array.isArray(data?.data)
            ? data.data
            : []
      setMonitors(
        list.filter((m) => {
          const t = (m.url ?? "").toLowerCase()
          return t.startsWith("http://") || t.startsWith("https://")
        })
      )
    } catch {
      toast.error("Failed to load monitors")
    } finally {
      setLoading(false)
    }
  }

  async function loadPsp() {
    try {
      const res = await apiClient.get("/api/uptimerobot/psp")
      if (res.ok) {
        setPspData(await res.json())
      }
    } catch {
      /* non-critical */
    }
  }

  async function loadHistory() {
    try {
      const res = await apiClient.get("/api/uptimerobot/history")
      if (res.ok) {
        const d = await res.json()
        setHistoryMap(d.byMonitorId ?? {})
      }
    } catch {
      /* non-critical */
    }
  }

  async function loadConfig() {
    try {
      const res = await apiClient.get("/api/uptimerobot/config")
      if (res.ok) {
        const d = await res.json()
        setStatusPageUrl(d.statusPageUrl ?? "")
      }
    } catch {
      /* non-critical */
    }
  }

  useEffect(() => {
    void Promise.all([loadMonitors(), loadPsp(), loadHistory(), loadConfig()])
  }, [])

  useEffect(() => {
    if (!monitors.length || snapshotFiredRef.current) {
      return
    }
    snapshotFiredRef.current = true
    apiClient.post("/api/uptimerobot/snapshot", {}).catch(() => undefined)
  }, [monitors])

  useEffect(() => {
    const handler = () => {
      setOpenMenuId(null)
    }
    document.addEventListener("click", handler)
    return () => {
      document.removeEventListener("click", handler)
    }
  }, [])

  async function handleRefresh() {
    setRefreshing(true)
    await Promise.all([loadMonitors(), loadPsp(), loadHistory()])
    setRefreshing(false)
    toast.success("Refreshed")
  }

  async function handleDelete(m: URMonitor) {
    const id = String(m.id ?? "")
    try {
      const res = await apiClient.delete(`/api/uptimerobot/monitors/${id}`)
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err.error || "Failed")
      }
      toast.success(`${m.friendlyName ?? "Monitor"} deleted`)
      setDeleteTarget(null)
      await loadMonitors()
    } catch (e: any) {
      toast.error(e?.message || "Failed to delete")
    }
  }

  // Build a lookup: psp monitorId (number) → PspMonitor
  const pspById = useMemo(() => {
    const map: Record<number, PspMonitor> = {}
    for (const pm of pspData?.data ?? []) {
      map[pm.monitorId] = pm
    }
    return map
  }, [pspData])

  const stats = useMemo(() => {
    const total = monitors.length
    const up = monitors.filter((m) =>
      String(m.status ?? "")
        .toUpperCase()
        .includes("UP")
    ).length
    return { total, up, down: total - up }
  }, [monitors])

  const hasPspHistory = (pspData?.data ?? []).some((pm) => (pm.dailyRatios ?? []).length > 0)

  return (
    <div className="space-y-8 text-slate-900 dark:text-white">
      {/* Header */}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <span className="text-[10px] font-black tracking-[0.2em] text-red-500 uppercase">
            Services
          </span>
          <h1 className="text-4xl font-black tracking-tighter">
            Website <span className="text-slate-400">UptimeRobot</span>
          </h1>
        </div>
        <div className="flex flex-wrap gap-3">
          {statusPageUrl && (
            <a
              href={statusPageUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 rounded-2xl border border-blue-200 bg-blue-50 px-4 py-2 text-[11px] font-black text-blue-600 transition-all hover:bg-blue-100 dark:border-blue-900 dark:bg-blue-900/20 dark:text-blue-400"
            >
              <ExternalLink className="h-3.5 w-3.5" />
              Public Status Page
            </a>
          )}
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-2 text-[11px] font-black text-slate-600 transition-all hover:border-red-200 hover:text-red-500 disabled:opacity-50 dark:border-slate-800 dark:bg-slate-900/40 dark:text-slate-300"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${refreshing ? "animate-spin" : ""}`} />
            Refresh
          </button>
          <div className="flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-2 dark:border-slate-800 dark:bg-slate-900/40">
            <ShieldCheck className="h-4 w-4 text-emerald-600" />
            <span className="text-[10px] font-black tracking-widest text-emerald-700 uppercase dark:text-emerald-300">
              {stats.up}/{stats.total} up
            </span>
          </div>
          <button
            onClick={() => {
              setModal({ mode: "add" })
            }}
            className="flex items-center gap-2 rounded-2xl bg-slate-900 px-6 py-3 text-sm font-black text-white transition-all hover:bg-red-600 dark:bg-white dark:text-slate-900"
          >
            <Plus className="h-4 w-4" />
            Add Monitor
          </button>
        </div>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
        <div className="rounded-[1.5rem] border border-slate-100 bg-white p-5 dark:border-slate-800 dark:bg-slate-900/40">
          <p className="text-[10px] font-black tracking-widest text-slate-400 uppercase">
            Monitors
          </p>
          <p className="mt-2 text-3xl font-black">{stats.total}</p>
          <p className="mt-1 text-[11px] font-bold text-slate-400">Tracked by UptimeRobot</p>
        </div>
        <div className="rounded-[1.5rem] border border-slate-100 bg-white p-5 dark:border-slate-800 dark:bg-slate-900/40">
          <p className="text-[10px] font-black tracking-widest text-slate-400 uppercase">
            30d Uptime
          </p>
          <p className="mt-2 text-3xl font-black">
            {(() => {
              const ratios = (pspData?.data ?? [])
                .map((pm) => parseFloat(pm["30dRatio"]?.ratio ?? "0"))
                .filter((r) => !isNaN(r) && r > 0)
              if (!ratios.length) {
                return stats.total > 0
                  ? `${Math.round((stats.up / stats.total) * 1000) / 10}%`
                  : "—"
              }
              return `${(ratios.reduce((a, b) => a + b, 0) / ratios.length).toFixed(2)}%`
            })()}
          </p>
          <p className="mt-1 text-[11px] font-bold text-slate-400">
            {hasPspHistory ? "Real 30-day average" : "Based on current status"}
          </p>
        </div>
        <div className="rounded-[1.5rem] border border-slate-100 bg-white p-5 dark:border-slate-800 dark:bg-slate-900/40">
          <p className="text-[10px] font-black tracking-widest text-slate-400 uppercase">
            Degraded
          </p>
          <p className="mt-2 text-3xl font-black text-red-600">{stats.down}</p>
          <p className="mt-1 text-[11px] font-bold text-slate-400">Currently down/unknown</p>
        </div>
      </div>

      {/* History source banner */}
      {!loading && monitors.length > 0 && !hasPspHistory && !statusPageUrl && (
        <div className="flex items-start gap-3 rounded-2xl border border-amber-200 bg-amber-50 px-5 py-4 dark:border-amber-900/40 dark:bg-amber-900/10">
          <Activity className="mt-0.5 h-4 w-4 flex-shrink-0 text-amber-600 dark:text-amber-400" />
          <div>
            <p className="text-[11px] font-black text-amber-800 dark:text-amber-300">
              Add your UptimeRobot Status Page URL to unlock 90-day history
            </p>
            <p className="mt-0.5 text-[11px] font-medium text-amber-700 dark:text-amber-400">
              Go to <strong>UptimeRobot Config</strong> and paste your{" "}
              <code className="rounded bg-amber-100 px-1 font-mono">
                stats.uptimerobot.com/XXXX
              </code>{" "}
              URL. Instant real history — no page visits needed.
            </p>
          </div>
        </div>
      )}

      {/* Monitor list */}
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
            Click "Add Monitor" to create one, or configure your UptimeRobot token.
          </p>
        </div>
      ) : (
        <div className="grid gap-4">
          {monitors.map((m) => {
            const id = String(m.id ?? "")
            const up = String(m.status ?? "")
              .toUpperCase()
              .includes("UP")
            const durationSec = m.currentStateDuration ?? 0

            // Match PSP data by monitorId (numeric id)
            const pspMon = pspById[Number(id)]
            const hasPsp = !!pspMon?.dailyRatios?.length

            // PSP: show last 30 daily bars
            const { bars: pspBars, labels: pspLabels } = hasPsp
              ? pspDailyToBars(pspMon.dailyRatios!, 30)
              : { bars: [], labels: [] }

            // Fallback: local snapshot history
            const localHistory = historyMap[id] ?? []
            const localBars = localHistoryToBars(localHistory)

            const bars = hasPsp ? pspBars : localBars
            const labels = hasPsp ? pspLabels : undefined
            const barSource = hasPsp
              ? "30 days"
              : localBars.length > 0
                ? `${localBars.length} checks`
                : null

            // 30d ratio text
            const ratio30d = pspMon?.["30dRatio"]?.ratio
              ? `${parseFloat(pspMon["30dRatio"].ratio).toFixed(1)}%`
              : null

            return (
              <div
                key={id}
                className="overflow-hidden rounded-[2rem] border border-slate-100 bg-white dark:border-slate-800 dark:bg-slate-900/40"
              >
                {/* Monitor row */}
                <div className="flex items-start gap-4 px-6 pt-6 pb-3">
                  <div className="mt-0.5 flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl bg-slate-100 dark:bg-slate-800">
                    <Globe className="h-5 w-5 text-slate-500 dark:text-slate-400" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-black text-slate-900 dark:text-white">
                          {m.friendlyName ?? "Untitled monitor"}
                        </p>
                        <a
                          href={m.url ?? "#"}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="mt-0.5 inline-flex items-center gap-1 text-[11px] font-bold text-slate-400 transition-colors hover:text-red-500"
                        >
                          {m.url ?? "—"}
                          <ExternalLink className="h-3 w-3" />
                        </a>
                      </div>
                      <div className="flex flex-shrink-0 items-center gap-2">
                        {ratio30d && (
                          <span className="hidden text-[10px] font-bold text-slate-400 sm:block dark:text-slate-400">
                            {ratio30d} / 30d
                          </span>
                        )}
                        {!ratio30d && durationSec > 0 && (
                          <span className="hidden text-[10px] font-bold text-slate-400 sm:block dark:text-slate-500">
                            {up ? "" : "Down "}
                            {formatDuration(durationSec)}
                            {up ? " operational" : ""}
                          </span>
                        )}
                        <span
                          className={`rounded-full px-3 py-1 text-[10px] font-black uppercase ${
                            up
                              ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300"
                              : "bg-red-50 text-red-600 dark:bg-red-500/10 dark:text-red-300"
                          }`}
                        >
                          {up ? "UP" : "DOWN"}
                        </span>

                        {/* 3-dot menu */}
                        <div className="relative">
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              setOpenMenuId(openMenuId === id ? null : id)
                            }}
                            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
                          >
                            <MoreVertical className="h-4 w-4" />
                          </button>
                          {openMenuId === id && (
                            <div
                              className="absolute top-8 right-0 z-20 min-w-[140px] rounded-2xl border border-slate-100 bg-white p-1.5 shadow-2xl dark:border-slate-800 dark:bg-slate-900"
                              onClick={(e) => {
                                e.stopPropagation()
                              }}
                            >
                              <button
                                onClick={() => {
                                  setModal({ mode: "edit", monitor: m })
                                  setOpenMenuId(null)
                                }}
                                className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-[11px] font-bold text-slate-600 hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-slate-800"
                              >
                                <Edit2 className="h-3.5 w-3.5" /> Edit
                              </button>
                              <button
                                onClick={() => {
                                  setDeleteTarget(m)
                                  setOpenMenuId(null)
                                }}
                                className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-[11px] font-bold text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30"
                              >
                                <Trash2 className="h-3.5 w-3.5" /> Delete
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* History bars */}
                <div className="border-t border-slate-50 px-6 pt-3 pb-5 dark:border-slate-800">
                  <div className="mb-2 flex items-center justify-between">
                    <span className="text-[9px] font-black tracking-widest text-slate-400 uppercase">
                      {hasPsp ? "Uptime (last 30 days)" : `History (${barSource ?? "no data"})`}
                    </span>
                    <Link
                      href={`/${locale}/monitor/websites-ur/${id}`}
                      className="text-[9px] font-black tracking-widest text-slate-400 uppercase underline underline-offset-2 hover:text-red-500"
                    >
                      Details →
                    </Link>
                  </div>

                  {bars.length > 0 ? (
                    <>
                      <UptimeStatusBars
                        data={bars}
                        count={bars.length}
                        labels={labels}
                        gap={2}
                        barHeightClassName="h-10"
                        barWidthClassName="w-2"
                        className="w-full justify-between"
                      />
                      <div className="mt-1.5 flex justify-between text-[9px] font-medium text-slate-400 italic">
                        <span>{hasPsp ? (pspLabels[0] ?? "Oldest") : "Oldest"}</span>
                        <span>
                          {hasPsp
                            ? "Each bar = 1 day"
                            : `Every ${Math.round((m.interval ?? 300) / 60)}m`}
                        </span>
                        <span>Today</span>
                      </div>
                    </>
                  ) : (
                    <div className="flex items-center gap-2 rounded-xl bg-slate-50 px-3 py-2.5 dark:bg-slate-800/40">
                      <Activity className="h-3.5 w-3.5 text-slate-300" />
                      <p className="text-[10px] font-bold text-slate-400">
                        {statusPageUrl
                          ? "Add your status page URL in UptimeRobot Config to see 90d history"
                          : "Add your stats.uptimerobot.com URL in config for instant history"}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {modal && (
        <MonitorModal
          mode={modal.mode}
          initial={
            modal.monitor
              ? {
                  id: String(modal.monitor.id ?? ""),
                  friendlyName: modal.monitor.friendlyName ?? "",
                  url: modal.monitor.url ?? "",
                  interval: modal.monitor.interval ?? 300
                }
              : undefined
          }
          onClose={() => {
            setModal(null)
          }}
          onSave={() => void loadMonitors()}
        />
      )}

      {deleteTarget && (
        <DeleteConfirm
          name={deleteTarget.friendlyName ?? "this monitor"}
          onConfirm={() => void handleDelete(deleteTarget)}
          onCancel={() => {
            setDeleteTarget(null)
          }}
        />
      )}
    </div>
  )
}
