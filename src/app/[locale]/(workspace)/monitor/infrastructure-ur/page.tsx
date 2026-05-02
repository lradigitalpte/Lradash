"use client"

import {
  Activity,
  Edit2,
  Loader2,
  Mail,
  MoreVertical,
  Plus,
  RefreshCw,
  Send,
  ShieldCheck,
  Trash2,
  X
} from "lucide-react"
import Link from "next/link"
import { useParams } from "next/navigation"
import { useEffect, useMemo, useRef, useState } from "react"
import { toast } from "sonner"

import { SmtpProfilesPanel } from "@/components/monitor/SmtpProfilesPanel"
import { UptimeStatusBars } from "@/components/monitor/UptimeStatusBars"
import { apiClient } from "@/lib/api/client"

/* ---------- Types ---------- */
interface URMonitor {
  id?: string
  friendlyName?: string
  url?: string
  target?: string
  status?: string
  currentStateDuration?: number
  interval?: number
  port?: number | null
  lastIncident?: { status?: string; reason?: string } | null
}

interface HistoryEntry {
  status: string
  checkedAt: string
}
type HistoryMap = Record<string, HistoryEntry[]>

interface PortFormData {
  friendlyName: string
  host: string
  port: number
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

function isPortEmailLike(m: URMonitor) {
  // UptimeRobot PORT monitors for email often come back as:
  //   { type: "PORT", port: 25, url: "smtp.example.com" }
  // so we should filter by known email ports, not by whether `url` contains ":".
  const p = m.port ?? null
  const knownEmailPorts = new Set<number>([25, 587, 465, 143, 993, 110, 995])
  if (p && knownEmailPorts.has(p)) {
    return true
  }

  // Fallback: if UR returns "host:port" in some fields, keep it.
  const t = (m.target ?? m.url ?? "").toString().toLowerCase()
  if (!t) {
    return false
  }
  if (t.startsWith("http://") || t.startsWith("https://")) {
    return false
  }
  return t.includes(":")
}

function displayTarget(m: URMonitor) {
  return (m.target ?? m.url ?? "").toString() || "—"
}

/* ---------- Port Monitor Form Modal ---------- */
function PortMonitorModal({
  mode,
  initial,
  onClose,
  onSave
}: {
  mode: "add" | "edit"
  initial?: Partial<PortFormData & { id: string }>
  onClose: () => void
  onSave: () => void
}) {
  const [form, setForm] = useState<PortFormData>({
    friendlyName: initial?.friendlyName ?? "",
    host: initial?.host ?? "",
    port: initial?.port ?? 25,
    interval: initial?.interval ?? 300
  })
  const [saving, setSaving] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.friendlyName.trim()) {
      return toast.error("Name is required")
    }
    if (!form.host.trim()) {
      return toast.error("Host is required")
    }
    // UR expects host/IP (e.g. mail.example.com), not an email address (e.g. user@mail.example.com).
    if (form.host.includes("@")) {
      return toast.error('Enter host/IP only (e.g. "mail.example.com"), not an email address')
    }
    if (!form.port) {
      return toast.error("Port is required")
    }

    setSaving(true)
    try {
      const res =
        mode === "add"
          ? await apiClient.post("/api/uptimerobot/monitors", {
              friendlyName: form.friendlyName.trim(),
              host: form.host.trim(),
              port: form.port,
              type: "PORT",
              interval: form.interval
            })
          : await apiClient.put(`/api/uptimerobot/monitors/${initial?.id}`, {
              friendlyName: form.friendlyName.trim(),
              host: form.host.trim(),
              port: form.port,
              interval: form.interval
            })

      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err.error || "Failed")
      }

      toast.success(mode === "add" ? "Monitor created" : "Monitor updated")
      onSave()
      onClose()
    } catch (e: any) {
      toast.error(e?.message || "Failed to save monitor")
    } finally {
      setSaving(false)
    }
  }

  const commonPorts = [
    { label: "SMTP (25)", value: 25 },
    { label: "SMTP TLS (587)", value: 587 },
    { label: "SMTP SSL (465)", value: 465 },
    { label: "IMAP (143)", value: 143 },
    { label: "IMAPS (993)", value: 993 },
    { label: "POP3 (110)", value: 110 },
    { label: "POP3S (995)", value: 995 },
    { label: "FTP (21)", value: 21 },
    { label: "SSH (22)", value: 22 },
    { label: "Custom", value: 0 }
  ]

  const intervalOptions = [
    { label: "Every 5 min", value: 300 },
    { label: "Every 10 min", value: 600 },
    { label: "Every 15 min", value: 900 },
    { label: "Every 30 min", value: 1800 }
  ]

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-md rounded-[2rem] border border-slate-100 bg-white shadow-2xl dark:border-slate-800 dark:bg-slate-900">
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4 dark:border-slate-800">
          <h2 className="text-sm font-black">
            {mode === "add" ? "Add Port Monitor" : "Edit Monitor"}
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
              placeholder="My Mail Server"
              required
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm font-bold text-slate-900 placeholder:font-normal placeholder:text-slate-400 focus:border-blue-400 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
            />
          </div>
          <div>
            <label className="mb-1 block text-[10px] font-black tracking-widest text-slate-500 uppercase">
              Host / IP *
            </label>
            <input
              value={form.host}
              onChange={(e) => {
                setForm((f) => ({ ...f, host: e.target.value }))
              }}
              placeholder="mail.example.com or 1.2.3.4"
              required
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm font-bold text-slate-900 placeholder:font-normal placeholder:text-slate-400 focus:border-blue-400 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-[10px] font-black tracking-widest text-slate-500 uppercase">
                Common Ports
              </label>
              <select
                value={commonPorts.find((p) => p.value === form.port) ? form.port : 0}
                onChange={(e) => {
                  const v = Number(e.target.value)
                  if (v > 0) {
                    setForm((f) => ({ ...f, port: v }))
                  }
                }}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm font-bold text-slate-900 focus:border-blue-400 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              >
                {commonPorts.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-[10px] font-black tracking-widest text-slate-500 uppercase">
                Port Number *
              </label>
              <input
                value={form.port}
                onChange={(e) => {
                  setForm((f) => ({ ...f, port: Number(e.target.value) }))
                }}
                type="number"
                min={1}
                max={65535}
                required
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm font-bold text-slate-900 focus:border-blue-400 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              />
            </div>
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
export default function InfrastructureURMonitorPage() {
  const params = useParams()
  const locale = (params?.locale ?? "en") as string

  const [loading, setLoading] = useState(true)
  const [monitors, setMonitors] = useState<URMonitor[]>([])
  const [historyMap, setHistoryMap] = useState<HistoryMap>({})
  const [refreshing, setRefreshing] = useState(false)
  const [openMenuId, setOpenMenuId] = useState<string | null>(null)
  const [modal, setModal] = useState<null | { mode: "add" | "edit"; monitor?: URMonitor }>(null)
  const [deleteTarget, setDeleteTarget] = useState<URMonitor | null>(null)
  const snapshotFiredRef = useRef(false)
  const [smtpTo, setSmtpTo] = useState("")
  const [smtpSending, setSmtpSending] = useState(false)

  async function loadMonitors() {
    setLoading(true)
    try {
      const res = await apiClient.get("/api/uptimerobot/monitors")
      if (!res.ok) {
        toast.error("Could not fetch monitors — check UptimeRobot config")
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
      setMonitors(list.filter(isPortEmailLike))
    } catch {
      toast.error("Failed to load monitors")
    } finally {
      setLoading(false)
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
      // non-critical
    }
  }

  async function fireSnapshot() {
    try {
      await apiClient.post("/api/uptimerobot/snapshot", {})
    } catch {
      // silent
    }
  }

  useEffect(() => {
    void loadMonitors()
    void loadHistory()
  }, [])

  useEffect(() => {
    try {
      const raw = localStorage.getItem("user")
      if (raw) {
        const j = JSON.parse(raw) as { email?: string }
        if (j.email) {
          setSmtpTo(j.email)
        }
      }
    } catch {
      // ignore
    }
  }, [])

  useEffect(() => {
    if (!monitors.length || snapshotFiredRef.current) {
      return
    }
    snapshotFiredRef.current = true
    void fireSnapshot()
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
    await Promise.all([loadMonitors(), loadHistory(), fireSnapshot()])
    setRefreshing(false)
    toast.success("Refreshed")
  }

  async function handleSmtpAppTest() {
    setSmtpSending(true)
    try {
      const res = await apiClient.post("/api/monitor/smtp-test", {
        to: smtpTo.trim() || undefined
      })
      const data = (await res.json().catch(() => ({}))) as {
        ok?: boolean
        error?: string
        to?: string
      }
      if (res.status === 401) {
        toast.error("Sign in again to send a test email")
        return
      }
      if (!res.ok) {
        toast.error(data.error || `Request failed (${res.status})`)
        return
      }
      if (data.ok) {
        toast.success(`Test email sent to ${data.to ?? smtpTo}`)
      } else {
        toast.error(data.error || "Send failed")
      }
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Network error"
      toast.error(msg)
    } finally {
      setSmtpSending(false)
    }
  }

  async function handleDelete(m: URMonitor) {
    const id = String(m.id ?? "")
    try {
      const res = await apiClient.delete(`/api/uptimerobot/monitors/${id}`)
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err.error || "Failed to delete")
      }
      toast.success(`${m.friendlyName ?? "Monitor"} deleted`)
      setDeleteTarget(null)
      await loadMonitors()
    } catch (e: any) {
      toast.error(e?.message || "Failed to delete monitor")
    }
  }

  const stats = useMemo(() => {
    const total = monitors.length
    const up = monitors.filter((m) =>
      String(m.status ?? "")
        .toUpperCase()
        .includes("UP")
    ).length
    return { total, up, down: total - up }
  }, [monitors])

  return (
    <div className="space-y-8 text-slate-900 dark:text-white">
      {/* Header */}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <span className="text-[10px] font-black tracking-[0.2em] text-red-500 uppercase">
            Backbone
          </span>
          <h1 className="text-4xl font-black tracking-tighter">
            Infrastructure <span className="text-slate-400">UptimeRobot</span>
          </h1>
        </div>
        <div className="flex flex-wrap gap-3">
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
            Port Monitors
          </p>
          <p className="mt-2 text-3xl font-black">{stats.total}</p>
          <p className="mt-1 text-[11px] font-bold text-slate-400">SMTP / IMAP / POP checks</p>
        </div>
        <div className="rounded-[1.5rem] border border-slate-100 bg-white p-5 dark:border-slate-800 dark:bg-slate-900/40">
          <p className="text-[10px] font-black tracking-widest text-slate-400 uppercase">
            Stability
          </p>
          <p className="mt-2 text-3xl font-black">
            {stats.total > 0 ? `${Math.round((stats.up / stats.total) * 1000) / 10}%` : "—"}
          </p>
          <p className="mt-1 text-[11px] font-bold text-slate-400">Current status coverage</p>
        </div>
        <div className="rounded-[1.5rem] border border-slate-100 bg-white p-5 dark:border-slate-800 dark:bg-slate-900/40">
          <p className="text-[10px] font-black tracking-widest text-slate-400 uppercase">
            Degraded
          </p>
          <p className="mt-2 text-3xl font-black text-red-600">{stats.down}</p>
          <p className="mt-1 text-[11px] font-bold text-slate-400">Currently down/unknown</p>
        </div>
      </div>

      {/* App SMTP: real send test (env-based; not UptimeRobot) */}
      <div className="rounded-[1.5rem] border border-slate-200 bg-gradient-to-br from-slate-50 to-white p-6 dark:border-slate-800 dark:from-slate-900/80 dark:to-slate-900/40">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div className="min-w-0">
            <p className="text-[10px] font-black tracking-[0.2em] text-red-500 uppercase">
              App email
            </p>
            <h2 className="mt-1 text-lg font-black tracking-tight text-slate-900 dark:text-white">
              Send test email (LRADASH SMTP)
            </h2>
            <p className="mt-1 text-[11px] font-medium text-slate-500">
              UptimeRobot above only checks the <strong className="font-bold">port</strong>. This
              button sends a real message using{" "}
              <code className="rounded bg-slate-100 px-1 text-[10px] dark:bg-slate-800">
                SMTP_*
              </code>{" "}
              from your server environment.
            </p>
          </div>
        </div>
        <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="min-w-0 flex-1">
            <label
              htmlFor="smtp-test-to"
              className="mb-1 block text-[10px] font-black tracking-widest text-slate-500 uppercase"
            >
              Recipient
            </label>
            <input
              id="smtp-test-to"
              type="email"
              value={smtpTo}
              onChange={(e) => {
                setSmtpTo(e.target.value)
              }}
              placeholder="you@example.com (blank = your account email)"
              className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-bold text-slate-900 placeholder:font-normal placeholder:text-slate-400 focus:border-red-400 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
            />
          </div>
          <button
            type="button"
            onClick={() => void handleSmtpAppTest()}
            disabled={smtpSending}
            className="flex shrink-0 items-center justify-center gap-2 rounded-2xl bg-slate-900 px-6 py-3 text-sm font-black text-white transition-all hover:bg-red-600 disabled:opacity-50 dark:bg-white dark:text-slate-900 dark:hover:bg-red-100"
          >
            {smtpSending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
            {smtpSending ? "Sending…" : "Send test email"}
          </button>
        </div>
      </div>

      <SmtpProfilesPanel />

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
          <Mail className="mb-4 h-12 w-12 text-slate-200" />
          <p className="text-sm font-bold text-slate-400">No port monitors found</p>
          <p className="mt-2 text-[10px] font-medium text-slate-500 italic">
            Click "Add Monitor" to create an SMTP/IMAP/POP port check.
          </p>
        </div>
      ) : (
        <div className="grid gap-4">
          {monitors.map((m) => {
            const id = String(m.id ?? "")
            const up = String(m.status ?? "")
              .toUpperCase()
              .includes("UP")
            const history = historyMap[id] ?? []
            const bars = historyToBars(history)
            const durationSec = m.currentStateDuration ?? 0

            return (
              <div
                key={id}
                className="overflow-hidden rounded-[2rem] border border-slate-100 bg-white dark:border-slate-800 dark:bg-slate-900/40"
              >
                <div className="flex items-start gap-4 px-6 pt-6 pb-3">
                  <div className="mt-0.5 flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl bg-slate-100 dark:bg-slate-800">
                    <Mail className="h-5 w-5 text-slate-500 dark:text-slate-400" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-black text-slate-900 dark:text-white">
                          {m.friendlyName ?? "Untitled monitor"}
                        </p>
                        <p className="mt-0.5 text-[11px] font-bold text-slate-400">
                          {displayTarget(m)}
                        </p>
                      </div>
                      <div className="flex flex-shrink-0 items-center gap-2">
                        {durationSec > 0 && (
                          <span className="hidden text-[10px] font-bold text-slate-400 sm:block dark:text-slate-500">
                            {up ? "" : "Down "}
                            {formatDuration(durationSec)}
                            {up ? " stable" : ""}
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
                                <Edit2 className="h-3.5 w-3.5" />
                                Edit
                              </button>
                              <button
                                onClick={() => {
                                  setDeleteTarget(m)
                                  setOpenMenuId(null)
                                }}
                                className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-[11px] font-bold text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                                Delete
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="border-t border-slate-50 px-6 pt-3 pb-5 dark:border-slate-800">
                  <div className="mb-2 flex items-center justify-between">
                    <span className="text-[9px] font-black tracking-widest text-slate-400 uppercase">
                      Stability History ({bars.length} checks)
                    </span>
                    <Link
                      href={`/${locale}/monitor/infrastructure-ur/${id}`}
                      className="text-[9px] font-black tracking-widest text-slate-400 uppercase underline underline-offset-2 hover:text-red-500"
                    >
                      Full Details →
                    </Link>
                  </div>

                  {bars.length > 0 ? (
                    <>
                      <UptimeStatusBars
                        data={bars}
                        count={bars.length}
                        gap={2}
                        barHeightClassName="h-10"
                        barWidthClassName="w-2"
                        className="w-full justify-between"
                      />
                      <div className="mt-1.5 flex justify-between text-[9px] font-medium text-slate-400 italic">
                        <span>Oldest</span>
                        <span>Every {Math.round((m.interval ?? 300) / 60)}m checks</span>
                        <span>Now</span>
                      </div>
                    </>
                  ) : (
                    <div className="flex items-center gap-2 rounded-xl bg-slate-50 px-3 py-2.5 dark:bg-slate-800/40">
                      <Activity className="h-3.5 w-3.5 text-slate-300" />
                      <p className="text-[10px] font-bold text-slate-400">
                        Building history — click Refresh or revisit in 3+ min.
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
        <PortMonitorModal
          mode={modal.mode}
          initial={
            modal.monitor
              ? {
                  id: String(modal.monitor.id ?? ""),
                  friendlyName: modal.monitor.friendlyName ?? "",
                  host: displayTarget(modal.monitor),
                  port: modal.monitor.port ?? 25,
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
