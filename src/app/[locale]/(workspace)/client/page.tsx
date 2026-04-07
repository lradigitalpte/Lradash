"use client"

import {
  AlertCircle,
  ArrowRight,
  Briefcase,
  CheckCircle2,
  Clock3,
  Download,
  Eye,
  FolderKanban,
  LineChart
} from "lucide-react"
import { useEffect, useState } from "react"

import { StatCard } from "@/components/common"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { apiClient } from "@/lib/api/client"
import { cn, formatDate } from "@/lib/utils"

interface ClientOverviewResponse {
  viewer: {
    id: string
    name: string
    email: string
    orgRole: string
    organizationName: string
  }
  summary: {
    projectCount: number
    totalTasks: number
    doneTasks: number
    inProgressTasks: number
    overdueTasks: number
    completionRate: number
  }
  projects: Array<{
    id: string
    title: string
    description: string
    dueDate?: string
    status: string
    priority: string
    updatedAt: string
    taskStats: {
      total: number
      done: number
      inProgress: number
      todo: number
      overdue: number
      completionRate: number
    }
  }>
}

export default function ClientPortalPage() {
  const [data, setData] = useState<ClientOverviewResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [exporting, setExporting] = useState(false)

  const handleDownloadPdf = async () => {
    try {
      setExporting(true)
      const response = await fetch("/api/client/overview/pdf", {
        method: "GET",
        credentials: "include"
      })

      if (!response.ok) {
        const body = await response.json().catch(() => ({}))
        throw new Error(body.error || "Failed to export PDF")
      }

      const blob = await response.blob()
      const objectUrl = window.URL.createObjectURL(blob)
      const link = document.createElement("a")
      link.href = objectUrl
      link.download = `${data?.viewer.organizationName.toLowerCase().replace(/[^a-z0-9]+/g, "-") || "client"}-report.pdf`
      link.click()
      window.URL.revokeObjectURL(objectUrl)
    } catch (downloadError) {
      setError(downloadError instanceof Error ? downloadError.message : "Failed to export PDF")
    } finally {
      setExporting(false)
    }
  }

  useEffect(() => {
    let mounted = true

    const loadOverview = async () => {
      try {
        const response = await apiClient.get("/api/client/overview")
        if (!response.ok) {
          const body = await response.json().catch(() => ({}))
          throw new Error(body.error || "Failed to load client portal")
        }

        const payload = (await response.json()) as ClientOverviewResponse
        if (mounted) {
          setData(payload)
          setError(null)
        }
      } catch (loadError) {
        if (mounted) {
          setError(loadError instanceof Error ? loadError.message : "Failed to load client portal")
        }
      } finally {
        if (mounted) {
          setLoading(false)
        }
      }
    }

    loadOverview()

    return () => {
      mounted = false
    }
  }, [])

  if (loading) {
    return (
      <div className="mx-auto max-w-[1400px] space-y-8 p-8 lg:p-12">
        <div className="space-y-3">
          <div className="h-4 w-32 animate-pulse rounded-full bg-slate-200 dark:bg-slate-800" />
          <div className="h-12 w-80 animate-pulse rounded-2xl bg-slate-200 dark:bg-slate-800" />
          <div className="h-6 w-[28rem] animate-pulse rounded-2xl bg-slate-200 dark:bg-slate-800" />
        </div>
      </div>
    )
  }

  if (error || !data) {
    return (
      <div className="mx-auto max-w-[900px] p-8 lg:p-12">
        <Card className="rounded-[2rem] border-none bg-white/80 shadow-2xl shadow-slate-200/50 dark:bg-slate-900/70 dark:shadow-none">
          <CardContent className="flex flex-col items-center gap-4 px-8 py-16 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-rose-50 text-rose-600 dark:bg-rose-950/40 dark:text-rose-300">
              <AlertCircle className="h-7 w-7" />
            </div>
            <div className="space-y-2">
              <h1 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white">
                Client portal unavailable
              </h1>
              <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
                {error || "We could not load your project overview right now."}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="relative min-h-full pb-16">
      <div className="pointer-events-none absolute top-16 right-[8%] -z-10 h-[420px] w-[420px] rounded-full bg-blue-500/5 blur-[110px]" />
      <div className="pointer-events-none absolute bottom-24 left-[6%] -z-10 h-[360px] w-[360px] rounded-full bg-emerald-500/5 blur-[90px]" />

      <div className="mx-auto max-w-[1500px] space-y-10 p-8 lg:p-12">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="space-y-3">
            <div className="inline-flex items-center gap-2 rounded-full border border-blue-100 bg-blue-50 px-3 py-1 text-[10px] font-black tracking-[0.2em] text-blue-600 uppercase dark:border-blue-900 dark:bg-blue-950/40 dark:text-blue-300">
              <Eye className="h-3.5 w-3.5" />
              Client Portal
            </div>
            <div className="space-y-2">
              <h1 className="text-5xl leading-[0.92] font-black tracking-tighter text-slate-900 dark:text-white">
                Project reporting for {data.viewer.organizationName}
              </h1>
              <p className="max-w-3xl text-base font-medium text-slate-500 dark:text-slate-400">
                A restricted view of the work your team shared with you. This surface is
                intentionally limited to delivery status, timelines, and high-level progress.
              </p>
            </div>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-stretch">
            <div className="rounded-[1.75rem] border border-slate-200/70 bg-white/80 px-5 py-4 shadow-xl shadow-slate-200/40 dark:border-slate-800 dark:bg-slate-900/80 dark:shadow-none">
              <p className="text-[10px] font-black tracking-[0.2em] text-slate-400 uppercase">
                Signed in as
              </p>
              <p className="mt-2 text-sm font-black text-slate-900 uppercase dark:text-white">
                {data.viewer.name}
              </p>
              <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
                {data.viewer.email}
              </p>
            </div>
            <Button
              onClick={handleDownloadPdf}
              disabled={exporting}
              className="h-auto rounded-[1.75rem] bg-slate-900 px-5 py-4 text-[11px] font-black tracking-[0.2em] text-white uppercase shadow-xl hover:bg-slate-800 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-100"
            >
              <Download className="mr-2 h-4 w-4" />
              {exporting ? "Exporting..." : "Download PDF"}
            </Button>
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
          <StatCard
            title="Assigned Projects"
            value={data.summary.projectCount}
            subtitle="Visible to your client portal"
            icon={Briefcase}
            variant="default"
          />
          <StatCard
            title="Tasks Completed"
            value={data.summary.doneTasks}
            subtitle={`${data.summary.completionRate}% overall completion`}
            icon={CheckCircle2}
            variant="success"
          />
          <StatCard
            title="Active Work"
            value={data.summary.inProgressTasks}
            subtitle="Items currently in motion"
            icon={Clock3}
            variant="primary"
          />
          <StatCard
            title="Needs Attention"
            value={data.summary.overdueTasks}
            subtitle="Overdue items across your projects"
            icon={AlertCircle}
            variant={data.summary.overdueTasks > 0 ? "danger" : "default"}
          />
        </div>

        <Card className="rounded-[2.5rem] border-none bg-white/80 shadow-2xl shadow-slate-200/50 dark:bg-slate-900/70 dark:shadow-none">
          <CardHeader className="px-8 pt-8 pb-4 lg:px-10 lg:pt-10">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600 dark:bg-blue-950/40 dark:text-blue-300">
                <LineChart className="h-5 w-5" />
              </div>
              <div>
                <CardTitle className="text-xl font-black tracking-tight text-slate-900 dark:text-white">
                  Delivery overview
                </CardTitle>
                <CardDescription className="text-[10px] font-black tracking-[0.2em] text-slate-400 uppercase">
                  Live project status shared with clients
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-5 px-8 pb-8 lg:px-10 lg:pb-10">
            {data.projects.length === 0 ? (
              <div className="rounded-[2rem] border border-dashed border-slate-200 bg-slate-50 px-6 py-12 text-center dark:border-slate-800 dark:bg-slate-950/40">
                <FolderKanban className="mx-auto mb-3 h-8 w-8 text-slate-300 dark:text-slate-700" />
                <p className="text-sm font-black text-slate-900 uppercase dark:text-white">
                  No projects shared yet
                </p>
                <p className="mt-2 text-sm font-medium text-slate-500 dark:text-slate-400">
                  Your project manager has not assigned any projects to this client account yet.
                </p>
              </div>
            ) : (
              data.projects.map((project) => (
                <div
                  key={project.id}
                  className="rounded-[2rem] border border-slate-200/70 bg-slate-50/60 p-6 dark:border-slate-800 dark:bg-slate-950/30"
                >
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <span
                          className={cn(
                            "inline-flex rounded-full px-3 py-1 text-[10px] font-black tracking-[0.2em] uppercase",
                            project.taskStats.overdue > 0
                              ? "bg-rose-100 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300"
                              : "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300"
                          )}
                        >
                          {project.taskStats.overdue > 0 ? "At risk" : "On track"}
                        </span>
                        <span className="text-[10px] font-black tracking-[0.2em] text-slate-400 uppercase">
                          {project.priority} priority
                        </span>
                      </div>
                      <h2 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white">
                        {project.title}
                      </h2>
                      <p className="max-w-3xl text-sm font-medium text-slate-500 dark:text-slate-400">
                        {project.description || "No public project summary has been added yet."}
                      </p>
                    </div>
                    <div className="min-w-[220px] rounded-[1.5rem] bg-white/80 px-4 py-4 shadow-sm dark:bg-slate-900/70">
                      <p className="text-[10px] font-black tracking-[0.2em] text-slate-400 uppercase">
                        Last updated
                      </p>
                      <p className="mt-2 text-sm font-bold text-slate-900 dark:text-white">
                        {formatDate(project.updatedAt)}
                      </p>
                      <p className="mt-3 text-[10px] font-black tracking-[0.2em] text-slate-400 uppercase">
                        Due date
                      </p>
                      <p className="mt-2 text-sm font-bold text-slate-900 dark:text-white">
                        {project.dueDate ? formatDate(project.dueDate) : "Not scheduled"}
                      </p>
                    </div>
                  </div>

                  <div className="mt-6 grid gap-4 md:grid-cols-4">
                    <div className="rounded-[1.5rem] bg-white/80 px-4 py-4 dark:bg-slate-900/70">
                      <p className="text-[10px] font-black tracking-[0.2em] text-slate-400 uppercase">
                        Total tasks
                      </p>
                      <p className="mt-2 text-2xl font-black text-slate-900 dark:text-white">
                        {project.taskStats.total}
                      </p>
                    </div>
                    <div className="rounded-[1.5rem] bg-white/80 px-4 py-4 dark:bg-slate-900/70">
                      <p className="text-[10px] font-black tracking-[0.2em] text-slate-400 uppercase">
                        Completed
                      </p>
                      <p className="mt-2 text-2xl font-black text-emerald-600 dark:text-emerald-300">
                        {project.taskStats.done}
                      </p>
                    </div>
                    <div className="rounded-[1.5rem] bg-white/80 px-4 py-4 dark:bg-slate-900/70">
                      <p className="text-[10px] font-black tracking-[0.2em] text-slate-400 uppercase">
                        In progress
                      </p>
                      <p className="mt-2 text-2xl font-black text-blue-600 dark:text-blue-300">
                        {project.taskStats.inProgress}
                      </p>
                    </div>
                    <div className="rounded-[1.5rem] bg-white/80 px-4 py-4 dark:bg-slate-900/70">
                      <p className="text-[10px] font-black tracking-[0.2em] text-slate-400 uppercase">
                        Overdue
                      </p>
                      <p className="mt-2 text-2xl font-black text-rose-600 dark:text-rose-300">
                        {project.taskStats.overdue}
                      </p>
                    </div>
                  </div>

                  <div className="mt-6 space-y-3 rounded-[1.5rem] bg-white/80 px-5 py-5 dark:bg-slate-900/70">
                    <div className="flex items-center justify-between gap-3">
                      <p className="text-[10px] font-black tracking-[0.2em] text-slate-400 uppercase">
                        Completion progress
                      </p>
                      <p className="text-sm font-black text-slate-900 dark:text-white">
                        {project.taskStats.completionRate}%
                      </p>
                    </div>
                    <Progress
                      value={project.taskStats.completionRate}
                      className="h-3 rounded-full"
                    />
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        <Card className="rounded-[2rem] border-none bg-gradient-to-r from-slate-900 to-blue-950 text-white shadow-2xl shadow-slate-300/30 dark:shadow-none">
          <CardContent className="flex flex-col gap-4 px-8 py-8 lg:flex-row lg:items-center lg:justify-between">
            <div className="space-y-2">
              <p className="text-[10px] font-black tracking-[0.2em] text-blue-300 uppercase">
                Delivered
              </p>
              <h3 className="text-2xl font-black tracking-tight">
                Live dashboard, PDF exports, and weekly digests
              </h3>
              <p className="max-w-2xl text-sm font-medium text-slate-300">
                Clients can now track progress in-app, download a report PDF, and receive scheduled
                weekly summary emails. The next phase focuses on share controls per project.
              </p>
            </div>
            <Button className="h-12 rounded-2xl bg-white px-6 text-[11px] font-black tracking-[0.2em] text-slate-900 uppercase hover:bg-slate-100">
              Share Controls Next
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
