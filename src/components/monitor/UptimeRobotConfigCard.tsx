"use client"

import {
  CheckCircle2,
  ExternalLink,
  KeyRound,
  Link2,
  Loader2,
  Pencil,
  PlugZap,
  ShieldCheck
} from "lucide-react"
import { useEffect, useState } from "react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { apiClient } from "@/lib/api/client"

export function UptimeRobotConfigCard({ isAdmin }: { isAdmin: boolean }) {
  const [loading, setLoading] = useState(true)
  const [configured, setConfigured] = useState(false)
  const [apiToken, setApiToken] = useState("")
  const [statusPageUrl, setStatusPageUrl] = useState("")
  const [editingUrl, setEditingUrl] = useState(false)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (!isAdmin) {
      return
    }
    ;(async () => {
      try {
        setLoading(true)
        const res = await apiClient.get("/api/uptimerobot/config")
        if (!res.ok) {
          setConfigured(false)
          return
        }
        const data = await res.json()
        setConfigured(!!data.configured)
        setStatusPageUrl(data.statusPageUrl ?? "")
      } catch {
        setConfigured(false)
      } finally {
        setLoading(false)
      }
    })()
  }, [isAdmin])

  const handleSave = async () => {
    if (!isAdmin) {
      return
    }
    const hasToken = !!apiToken.trim()
    const hasUrl = !!statusPageUrl.trim()
    if (!hasToken && !hasUrl && !configured) {
      toast.error("Enter an API token or status page URL to save")
      return
    }
    setSaving(true)
    try {
      const body: Record<string, string> = {}
      if (apiToken.trim()) {
        body.apiToken = apiToken.trim()
      }
      // Always send statusPageUrl so it can be cleared or updated
      body.statusPageUrl = statusPageUrl.trim()

      const res = await apiClient.put("/api/uptimerobot/config", body)
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err.error || "Failed to save")
      }
      toast.success("UptimeRobot config saved")
      setConfigured(true)
      setApiToken("")
      setEditingUrl(false)
    } catch (e: any) {
      toast.error(e?.message || "Failed to save")
    } finally {
      setSaving(false)
    }
  }

  if (!isAdmin) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white/60 p-4 text-sm dark:border-slate-800 dark:bg-slate-900/40">
        <div className="flex items-center gap-2">
          <ShieldCheck className="h-4 w-4 text-slate-400" />
          <span className="text-[10px] font-black tracking-widest text-slate-500 uppercase">
            UptimeRobot
          </span>
        </div>
        <p className="mt-2 text-[11px] font-medium text-slate-500">
          Token configuration is admin-only.
        </p>
      </div>
    )
  }

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <PlugZap className="h-4 w-4 text-emerald-600" />
          <span className="text-[10px] font-black tracking-widest text-slate-600 uppercase dark:text-slate-300">
            UptimeRobot Config
          </span>
        </div>
        {loading ? (
          <Loader2 className="h-4 w-4 animate-spin text-slate-400" />
        ) : configured ? (
          <span className="rounded-full bg-emerald-50 px-2 py-1 text-[10px] font-black tracking-widest text-emerald-700 uppercase dark:bg-emerald-900/30 dark:text-emerald-400">
            Connected
          </span>
        ) : (
          <span className="rounded-full bg-amber-50 px-2 py-1 text-[10px] font-black tracking-widest text-amber-700 uppercase dark:bg-amber-900/30 dark:text-amber-400">
            Not set
          </span>
        )}
      </div>

      <div className="mt-3 space-y-3">
        {/* API Token */}
        <div>
          <label className="text-[10px] font-black tracking-widest text-slate-500 uppercase">
            API Token
          </label>
          <div className="relative mt-1">
            <KeyRound className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <Input
              value={apiToken}
              onChange={(e) => {
                setApiToken(e.target.value)
              }}
              type="password"
              placeholder={configured ? "Re-enter to update token" : "Paste your UptimeRobot token"}
              className="h-10 rounded-xl border-slate-200 bg-slate-50 pl-10 text-sm font-bold text-slate-800 placeholder:text-slate-400 dark:border-slate-700 dark:bg-slate-800/50 dark:text-white"
            />
          </div>
        </div>

        {/* Status Page URL */}
        <div>
          <label className="text-[10px] font-black tracking-widest text-slate-500 uppercase">
            Public Status Page URL{" "}
            <span className="font-medium tracking-normal text-slate-400 normal-case">
              (optional)
            </span>
          </label>

          {/* Show saved URL as a read-only chip when set and not editing */}
          {statusPageUrl && !editingUrl ? (
            <div className="mt-1 flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50/60 px-3 py-2 dark:border-emerald-800/40 dark:bg-emerald-900/20">
              <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-emerald-600 dark:text-emerald-400" />
              <a
                href={statusPageUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="min-w-0 flex-1 truncate text-[11px] font-bold text-emerald-700 hover:underline dark:text-emerald-400"
              >
                {statusPageUrl}
              </a>
              <button
                type="button"
                onClick={() => {
                  setEditingUrl(true)
                }}
                className="shrink-0 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
              >
                <Pencil className="h-3.5 w-3.5" />
              </button>
              <a
                href={statusPageUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="shrink-0 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
              >
                <ExternalLink className="h-3.5 w-3.5" />
              </a>
            </div>
          ) : (
            <div className="relative mt-1">
              <Link2 className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <Input
                value={statusPageUrl}
                onChange={(e) => {
                  setStatusPageUrl(e.target.value)
                }}
                type="url"
                placeholder="https://stats.uptimerobot.com/XXXXXXX"
                className="h-10 rounded-xl border-slate-200 bg-slate-50 pl-10 text-sm font-bold text-slate-800 placeholder:text-slate-400 dark:border-slate-700 dark:bg-slate-800/50 dark:text-white"
              />
            </div>
          )}
        </div>

        <Button
          className="w-full rounded-xl bg-slate-900 text-[10px] font-black tracking-widest uppercase hover:bg-red-600 dark:bg-white dark:text-slate-900 dark:hover:bg-red-50"
          disabled={saving}
          onClick={handleSave}
        >
          {saving ? "Saving…" : "Save Config"}
        </Button>
        <p className="text-[10px] leading-relaxed font-medium text-slate-500">
          Token stored server-side. Status page URL unlocks 90-day uptime history.
        </p>
      </div>
    </div>
  )
}
