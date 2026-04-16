"use client"

import { Activity, ArrowLeft, MessageSquare, RefreshCw } from "lucide-react"
import Link from "next/link"
import { useParams } from "next/navigation"
import { useState, useEffect } from "react"

import { UserAvatar } from "@/components/common"
import { Button } from "@/components/ui/button"
import { apiClient } from "@/lib/api/client"

export default function ProjectTasksActivityPage() {
  const params = useParams()
  const projectId = params?.projectId as string
  const locale = (params?.locale as string) || "en"
  const [data, setData] = useState<{ activities: any[]; projectTitle?: string } | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!projectId) {
      return
    }
    setLoading(true)
    setError(null)
    apiClient
      .get(`/api/projects/${projectId}/tasks/activity`)
      .then(async (r) => {
        if (!r.ok) {
          throw new Error("Failed to load")
        }
        return r.json()
      })
      .then(setData)
      .catch(() => {
        setError("Failed to load activity log")
      })
      .finally(() => {
        setLoading(false)
      })
  }, [projectId])

  return (
    <div className="relative min-h-screen space-y-8 overflow-hidden bg-slate-50/30 p-8 pb-24 dark:bg-slate-950/30">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(#94a3b8_1px,transparent_1px)] [background-size:20px_20px] opacity-38 dark:bg-[radial-gradient(#475569_1px,transparent_1px)] dark:opacity-48" />
      <div className="pointer-events-none absolute top-20 right-[8%] h-[420px] w-[420px] rounded-full bg-blue-500/5 blur-[120px]" />
      <div className="pointer-events-none absolute bottom-10 left-[10%] h-[360px] w-[360px] rounded-full bg-indigo-500/5 blur-[120px]" />
      <div className="relative z-10 space-y-8">
        <div className="flex items-center gap-4">
          <Link href={`/${locale}/projects/${projectId}/tasks`}>
            <Button
              variant="ghost"
              className="h-9 rounded-full border border-slate-200/50 px-4 text-xs font-bold tracking-widest text-slate-500 uppercase shadow-sm hover:bg-white dark:bg-slate-900"
            >
              <ArrowLeft className="mr-2 h-3 w-3" />
              Back to Tasks
            </Button>
          </Link>
          <span className="text-[10px] font-black tracking-widest text-slate-400 uppercase">
            Activity
          </span>
        </div>

        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <h1 className="text-3xl font-black tracking-tight text-slate-900 dark:text-white">
              Task Activity Log
            </h1>
            <p className="mt-2 text-sm font-medium text-slate-500 dark:text-slate-400">
              Comments and updates for tasks in{" "}
              <span className="font-bold text-slate-700 dark:text-slate-300">
                {data?.projectTitle || "this project"}
              </span>
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            className="w-fit gap-2 rounded-xl"
            onClick={() => {
              window.location.reload()
            }}
          >
            <RefreshCw className="h-4 w-4" />
            Refresh
          </Button>
        </div>

        {loading && (
          <div className="flex flex-col items-center justify-center gap-4 py-20">
            <Activity className="h-12 w-12 animate-pulse text-blue-500" />
            <p className="text-xs font-bold text-slate-400">Loading activity…</p>
          </div>
        )}

        {error && (
          <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-center dark:border-red-900/40 dark:bg-red-950/20">
            <p className="font-bold text-red-700 dark:text-red-300">{error}</p>
            <Button
              variant="outline"
              size="sm"
              className="mt-4 rounded-xl"
              onClick={() => {
                window.location.reload()
              }}
            >
              Retry
            </Button>
          </div>
        )}

        {!loading && !error && data && (
          <div className="rounded-2xl border border-slate-100 bg-white dark:border-slate-800 dark:bg-slate-900">
            {data.activities.length === 0 ? (
              <div className="flex flex-col items-center justify-center gap-4 py-20 text-center">
                <MessageSquare className="h-14 w-14 text-slate-200 dark:text-slate-700" />
                <p className="text-sm font-bold text-slate-500 dark:text-slate-400">
                  No activity yet
                </p>
                <p className="max-w-sm text-xs text-slate-400">
                  Comments and status updates on tasks will appear here.
                </p>
                <Link href={`/${locale}/projects/${projectId}/tasks`}>
                  <Button className="mt-2 rounded-xl">View tasks</Button>
                </Link>
              </div>
            ) : (
              <ul className="divide-y divide-slate-100 dark:divide-slate-800">
                {data.activities.map((act) => (
                  <li
                    key={act._id}
                    className="flex gap-4 px-6 py-4 transition-colors hover:bg-slate-50/50 dark:hover:bg-slate-800/30"
                  >
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-100 dark:bg-slate-800">
                      {act.type === "comment" ? (
                        <MessageSquare className="h-5 w-5 text-blue-500" />
                      ) : (
                        <RefreshCw className="h-5 w-5 text-slate-500" />
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-slate-900 dark:text-white">
                        {act.text}
                      </p>
                      <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-slate-500">
                        {act.user && (
                          <span className="flex items-center gap-1.5">
                            <UserAvatar name={act.user.name} image={act.user.avatar} size="xs" />
                            {act.user.name}
                          </span>
                        )}
                        {act.task && (
                          <Link
                            href={`/${locale}/projects/${projectId}/tasks`}
                            className="font-bold text-blue-600 hover:underline dark:text-blue-400"
                          >
                            {act.task.title}
                          </Link>
                        )}
                        <span className="text-slate-400">
                          {act.createdAt ? new Date(act.createdAt).toLocaleString() : "—"}
                        </span>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
