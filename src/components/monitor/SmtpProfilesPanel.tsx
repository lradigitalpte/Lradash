"use client"

import { Loader2, Pencil, Plus, Send, Server, Trash2 } from "lucide-react"
import { useEffect, useState } from "react"
import { toast } from "sonner"

import { apiClient } from "@/lib/api/client"

interface ProfileRow {
  id: string
  label: string
  host: string
  port: number
  secure: boolean
  authUser: string
  fromName: string
  fromEmail: string
  lastTestAt?: string | null
  lastTestOk?: boolean | null
  lastTestMessage?: string | null
}

export function SmtpProfilesPanel() {
  const [loading, setLoading] = useState(true)
  const [profiles, setProfiles] = useState<ProfileRow[]>([])
  const [canManage, setCanManage] = useState(false)
  const [testTo, setTestTo] = useState("")
  const [testingId, setTestingId] = useState<string | null>(null)
  const [modal, setModal] = useState<null | { mode: "add" | "edit"; profile?: ProfileRow }>(null)

  async function load() {
    setLoading(true)
    try {
      const res = await apiClient.get("/api/monitor/smtp-profiles")
      const data = (await res.json()) as { profiles?: ProfileRow[]; canManage?: boolean }
      if (!res.ok) {
        toast.error("Could not load SMTP profiles")
        return
      }
      setProfiles(Array.isArray(data.profiles) ? data.profiles : [])
      setCanManage(Boolean(data.canManage))
    } catch {
      toast.error("Failed to load SMTP profiles")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void load()
  }, [])

  useEffect(() => {
    try {
      const raw = localStorage.getItem("user")
      if (raw) {
        const j = JSON.parse(raw) as { email?: string }
        if (j.email) {
          setTestTo(j.email)
        }
      }
    } catch {
      // ignore
    }
  }, [])

  async function runTest(profileId: string) {
    setTestingId(profileId)
    try {
      const res = await apiClient.post(`/api/monitor/smtp-profiles/${profileId}/test`, {
        to: testTo.trim() || undefined
      })
      const data = (await res.json()) as { ok?: boolean; error?: string; to?: string }
      if (res.ok && data.ok) {
        toast.success(`Test sent to ${data.to ?? testTo}`)
        await load()
        return
      }
      if (!res.ok) {
        toast.error(data.error || `Failed (${res.status})`)
        await load()
        return
      }
      toast.error(data.error || "Send failed")
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Network error")
    } finally {
      setTestingId(null)
    }
  }

  return (
    <div className="rounded-[1.5rem] border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900/40">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <p className="text-[10px] font-black tracking-[0.2em] text-red-500 uppercase">
            Saved SMTP
          </p>
          <h2 className="mt-1 text-lg font-black tracking-tight text-slate-900 dark:text-white">
            Stored mail servers (encrypted)
          </h2>
          <p className="mt-1 text-[11px] font-medium text-slate-500">
            Passwords are encrypted in the database with{" "}
            <code className="rounded bg-slate-100 px-1 text-[10px] dark:bg-slate-800">
              ENCRYPTION_KEY
            </code>
            . Owner/admin can add or edit. Anyone in the org can run a send test. End-to-end{" "}
            <strong className="font-bold">receive</strong> checks need IMAP/cron and are not
            included yet.
          </p>
        </div>
        {canManage && (
          <button
            type="button"
            onClick={() => {
              setModal({ mode: "add" })
            }}
            className="flex shrink-0 items-center gap-2 rounded-2xl bg-slate-900 px-5 py-2.5 text-xs font-black text-white hover:bg-red-600 dark:bg-white dark:text-slate-900 dark:hover:bg-red-100"
          >
            <Plus className="h-4 w-4" />
            Add profile
          </button>
        )}
      </div>

      <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:items-end">
        <div className="min-w-0 flex-1">
          <label className="mb-1 block text-[10px] font-black tracking-widest text-slate-500 uppercase">
            Test recipient (optional)
          </label>
          <input
            type="email"
            value={testTo}
            onChange={(e) => {
              setTestTo(e.target.value)
            }}
            placeholder="Blank = your account email"
            className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2 text-sm font-bold text-slate-900 placeholder:font-normal dark:border-slate-700 dark:bg-slate-800 dark:text-white"
          />
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center gap-2 py-16 text-slate-400">
          <Loader2 className="h-6 w-6 animate-spin" />
          <span className="text-[10px] font-black uppercase">Loading profiles…</span>
        </div>
      ) : profiles.length === 0 ? (
        <div className="mt-6 flex flex-col items-center rounded-2xl border border-dashed border-slate-200 py-12 dark:border-slate-700">
          <Server className="mb-2 h-10 w-10 text-slate-300" />
          <p className="text-sm font-bold text-slate-500">No saved SMTP profiles yet</p>
          {canManage && (
            <button
              type="button"
              onClick={() => {
                setModal({ mode: "add" })
              }}
              className="mt-3 text-[11px] font-black text-red-600 underline"
            >
              Add your first profile
            </button>
          )}
        </div>
      ) : (
        <div className="mt-6 space-y-3">
          {profiles.map((p) => (
            <div
              key={p.id}
              className="flex flex-col gap-3 rounded-2xl border border-slate-100 bg-slate-50/80 px-4 py-4 sm:flex-row sm:items-center sm:justify-between dark:border-slate-800 dark:bg-slate-950/40"
            >
              <div className="min-w-0">
                <p className="truncate font-black text-slate-900 dark:text-white">{p.label}</p>
                <p className="truncate text-[11px] font-bold text-slate-500">
                  {p.host}:{p.port}
                  {p.secure ? " (TLS)" : ""} · {p.authUser} · from {p.fromEmail}
                </p>
                {p.lastTestAt && (
                  <p className="mt-1 text-[10px] font-bold text-slate-400">
                    Last test: {new Date(p.lastTestAt).toLocaleString()}{" "}
                    {p.lastTestOk === true ? (
                      <span className="text-emerald-600">OK</span>
                    ) : p.lastTestOk === false ? (
                      <span className="text-red-600">Failed</span>
                    ) : null}
                    {p.lastTestMessage ? ` — ${p.lastTestMessage}` : ""}
                  </p>
                )}
              </div>
              <div className="flex flex-shrink-0 flex-wrap items-center gap-2">
                <button
                  type="button"
                  disabled={testingId === p.id}
                  onClick={() => void runTest(p.id)}
                  className="flex items-center gap-1.5 rounded-xl bg-slate-900 px-3 py-2 text-[11px] font-black text-white hover:bg-red-600 disabled:opacity-50 dark:bg-white dark:text-slate-900 dark:hover:bg-red-100"
                >
                  {testingId === p.id ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <Send className="h-3.5 w-3.5" />
                  )}
                  Test send
                </button>
                {canManage && (
                  <>
                    <button
                      type="button"
                      onClick={() => {
                        setModal({ mode: "edit", profile: p })
                      }}
                      className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-[11px] font-black text-slate-600 hover:border-red-200 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300"
                    >
                      <Pencil className="mr-1 inline h-3.5 w-3.5" />
                      Edit
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        if (!confirm(`Delete profile "${p.label}"?`)) {
                          return
                        }
                        void (async () => {
                          const res = await apiClient.delete(`/api/monitor/smtp-profiles/${p.id}`)
                          if (res.ok) {
                            toast.success("Deleted")
                            await load()
                          } else {
                            const err = await res.json().catch(() => ({}))
                            toast.error((err as { error?: string }).error || "Delete failed")
                          }
                        })()
                      }}
                      className="rounded-xl border border-red-100 bg-red-50 px-3 py-2 text-[11px] font-black text-red-700 hover:bg-red-100 dark:border-red-900/40 dark:bg-red-950/30 dark:text-red-300"
                    >
                      <Trash2 className="mr-1 inline h-3.5 w-3.5" />
                      Delete
                    </button>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {modal && (
        <SmtpProfileModal
          mode={modal.mode}
          profile={modal.profile}
          onClose={() => {
            setModal(null)
          }}
          onSaved={() => {
            setModal(null)
            void load()
          }}
        />
      )}
    </div>
  )
}

function SmtpProfileModal({
  mode,
  profile,
  onClose,
  onSaved
}: {
  mode: "add" | "edit"
  profile?: ProfileRow
  onClose: () => void
  onSaved: () => void
}) {
  const [label, setLabel] = useState(profile?.label ?? "")
  const [host, setHost] = useState(profile?.host ?? "")
  const [port, setPort] = useState(profile?.port ?? 587)
  const [secure, setSecure] = useState(profile?.secure ?? false)
  const [authUser, setAuthUser] = useState(
    profile?.authUser === "••••••••" ? "" : (profile?.authUser ?? "")
  )
  const [password, setPassword] = useState("")
  const [fromName, setFromName] = useState(profile?.fromName ?? "")
  const [fromEmail, setFromEmail] = useState(profile?.fromEmail ?? "")
  const [saving, setSaving] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!label.trim() || !host.trim() || !fromEmail.trim()) {
      toast.error("Label, host, and from email are required")
      return
    }
    if (mode === "add") {
      if (!authUser.trim() || !password) {
        toast.error("Auth user and password are required for a new profile")
        return
      }
    }

    setSaving(true)
    try {
      if (mode === "add") {
        const res = await apiClient.post("/api/monitor/smtp-profiles", {
          label: label.trim(),
          host: host.trim(),
          port,
          secure,
          authUser: authUser.trim(),
          password,
          fromName: fromName.trim(),
          fromEmail: fromEmail.trim()
        })
        if (!res.ok) {
          const err = await res.json().catch(() => ({}))
          throw new Error((err as { error?: string }).error || "Save failed")
        }
        toast.success("Profile saved")
        onSaved()
        return
      }

      const body: Record<string, unknown> = {
        label: label.trim(),
        host: host.trim(),
        port,
        secure,
        fromName: fromName.trim(),
        fromEmail: fromEmail.trim()
      }
      if (authUser.trim()) {
        body.authUser = authUser.trim()
      }
      if (password.length > 0) {
        body.password = password
      }

      const res = await apiClient.patch(`/api/monitor/smtp-profiles/${profile?.id}`, body)
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error((err as { error?: string }).error || "Update failed")
      }
      toast.success("Profile updated")
      onSaved()
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Failed")
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-4">
      <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-[2rem] border border-slate-100 bg-white shadow-2xl dark:border-slate-800 dark:bg-slate-900">
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4 dark:border-slate-800">
          <h2 className="text-sm font-black">
            {mode === "add" ? "Add SMTP profile" : "Edit SMTP profile"}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            ✕
          </button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-3 p-6">
          <Field label="Label">
            <input
              value={label}
              onChange={(e) => {
                setLabel(e.target.value)
              }}
              className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm font-bold dark:border-slate-700 dark:bg-slate-800"
              required
            />
          </Field>
          <Field label="Host">
            <input
              value={host}
              onChange={(e) => {
                setHost(e.target.value)
              }}
              placeholder="smtp.gmail.com"
              className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm font-bold dark:border-slate-700 dark:bg-slate-800"
              required
            />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Port">
              <input
                type="number"
                value={port}
                min={1}
                max={65535}
                onChange={(e) => {
                  setPort(Number(e.target.value))
                }}
                className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm font-bold dark:border-slate-700 dark:bg-slate-800"
                required
              />
            </Field>
            <div className="flex items-end pb-2">
              <label className="flex cursor-pointer items-center gap-2 text-xs font-bold">
                <input
                  type="checkbox"
                  checked={secure}
                  onChange={(e) => {
                    setSecure(e.target.checked)
                  }}
                />
                SSL/TLS (465-style)
              </label>
            </div>
          </div>
          <Field label="SMTP username">
            <input
              value={authUser}
              onChange={(e) => {
                setAuthUser(e.target.value)
              }}
              placeholder={mode === "edit" ? "Leave blank to keep current" : ""}
              className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm font-bold dark:border-slate-700 dark:bg-slate-800"
              required={mode === "add"}
            />
          </Field>
          <Field
            label={mode === "edit" ? "Password (leave blank to keep)" : "Password / app password"}
          >
            <input
              type="password"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value)
              }}
              autoComplete="new-password"
              className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm font-bold dark:border-slate-700 dark:bg-slate-800"
            />
          </Field>
          <Field label="From name">
            <input
              value={fromName}
              onChange={(e) => {
                setFromName(e.target.value)
              }}
              className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm font-bold dark:border-slate-700 dark:bg-slate-800"
            />
          </Field>
          <Field label="From email">
            <input
              type="email"
              value={fromEmail}
              onChange={(e) => {
                setFromEmail(e.target.value)
              }}
              className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm font-bold dark:border-slate-700 dark:bg-slate-800"
              required
            />
          </Field>
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 rounded-xl border border-slate-200 py-2.5 text-sm font-black dark:border-slate-700"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex-1 rounded-xl bg-slate-900 py-2.5 text-sm font-black text-white disabled:opacity-50 dark:bg-white dark:text-slate-900"
            >
              {saving ? "Saving…" : mode === "add" ? "Create" : "Save"}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="mb-1 block text-[10px] font-black tracking-widest text-slate-500 uppercase">
        {label}
      </label>
      {children}
    </div>
  )
}
