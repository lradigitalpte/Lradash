"use client"

import {
  DollarSign,
  Loader2,
  CreditCard,
  ChevronDown,
  ChevronRight,
  FolderOpen,
  Activity,
  Link as LinkIcon
} from "lucide-react"
import { useState, useEffect } from "react"

import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { Link } from "@/i18n/navigation"
import { apiClient } from "@/lib/api/client"
import { cn } from "@/lib/utils"

interface ProjectSummary {
  projectId: string
  title: string
  totalMonthly: number
  costLineItemCount: number
  linkedMonitorCount: number
  costLineItems: {
    _id: string
    name: string
    type: string
    amount: number
    currency: string
    frequency: string
  }[]
  linkedMonitors: {
    _id: string
    name: string
    type: string
    price?: number
    currency?: string
    status: string
  }[]
}

interface SpendResponse {
  grandTotalMonthly: number
  projects: ProjectSummary[]
  subscriptionCount: number
}

export default function MonitorCostsPage() {
  const [data, setData] = useState<SpendResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [openProjects, setOpenProjects] = useState<Set<string>>(new Set())

  useEffect(() => {
    const fetchSpend = async () => {
      try {
        setLoading(true)
        const res = await apiClient.get("/api/monitor/spend")
        if (res.ok) {
          const json = await res.json()
          setData(json)
        }
      } catch (error) {
        console.error("Failed to fetch spend:", error)
      } finally {
        setLoading(false)
      }
    }
    fetchSpend()
  }, [])

  const toggleProject = (projectId: string) => {
    setOpenProjects((prev) => {
      const next = new Set(prev)
      if (next.has(projectId)) {
        next.delete(projectId)
      } else {
        next.add(projectId)
      }
      return next
    })
  }

  const formatFreq = (f: string) => {
    const map: Record<string, string> = {
      ONE_TIME: "One-time",
      WEEKLY: "Weekly",
      MONTHLY: "Monthly",
      ANNUAL: "Annual"
    }
    return map[f] || f
  }

  if (loading) {
    return (
      <div className="flex min-h-[40vh] flex-col items-center justify-center gap-2">
        <Loader2 className="h-10 w-10 animate-spin text-red-500" />
        <span className="text-[10px] font-black tracking-widest text-slate-400 uppercase">
          Loading...
        </span>
      </div>
    )
  }

  if (!data) {
    return (
      <div className="rounded-[2.5rem] border border-slate-100 bg-white p-12 shadow-2xl dark:border-slate-800 dark:bg-slate-900">
        <p className="text-center text-sm font-bold text-slate-400">
          Failed to load spend summary.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-10">
      {/* Header */}
      <div>
        <span className="text-[10px] font-black tracking-[0.2em] text-red-500 uppercase">
          Finance
        </span>
        <h1 className="text-4xl font-black tracking-tighter">
          Costs & <span className="text-slate-400">Spend</span>
        </h1>
        <p className="mt-2 max-w-xl text-sm font-medium text-slate-500 italic dark:text-slate-400">
          All project cost lists and subscriptions in one place. Total spend across the org.
        </p>
      </div>

      {/* Stats grid */}
      <div className="grid gap-6 md:grid-cols-2">
        <div className="rounded-[2rem] bg-slate-900 p-8 text-white shadow-2xl">
          <DollarSign className="mb-4 h-8 w-8 text-red-500" />
          <p className="text-[10px] font-black tracking-widest text-slate-400 uppercase">
            Total monthly spend
          </p>
          <h2 className="text-4xl font-black tracking-tighter">
            $
            {data.grandTotalMonthly.toLocaleString(undefined, {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2
            })}
          </h2>
          <p className="mt-2 text-xs font-medium text-slate-500 italic">
            Cost line items + subscriptions (linked or not)
          </p>
        </div>

        <div className="rounded-[2rem] border border-slate-100 bg-white p-8 shadow-xl dark:border-slate-800 dark:bg-slate-900">
          <CreditCard className="mb-4 h-8 w-8 text-red-500" />
          <p className="text-[10px] font-black tracking-widest text-slate-400 uppercase">
            Subscriptions
          </p>
          <h2 className="text-4xl font-black tracking-tighter text-slate-900 dark:text-white">
            {data.subscriptionCount}
          </h2>
          <p className="mt-2 text-xs font-medium text-slate-500 italic dark:text-slate-400">
            Track and manage all subscriptions
          </p>
          <Link
            href="/monitor/subscriptions"
            className="mt-4 inline-block rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-[11px] font-black tracking-wider text-slate-700 uppercase transition-colors hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
          >
            View Subscriptions table
          </Link>
        </div>
      </div>

      {/* By project */}
      <div className="overflow-hidden rounded-[2.5rem] border border-slate-100 bg-white shadow-2xl dark:border-slate-800 dark:bg-slate-900">
        <div className="flex items-center gap-3 border-b border-slate-50 px-8 py-6 dark:border-slate-800">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-red-500/10">
            <FolderOpen className="h-6 w-6 text-red-600 dark:text-red-400" />
          </div>
          <div>
            <h2 className="text-xl font-black tracking-tight">By project</h2>
            <p className="text-[10px] font-medium text-slate-500 dark:text-slate-400">
              Each project&apos;s cost list and linked subscriptions. Totals feed into the number
              above.
            </p>
          </div>
        </div>
        <div className="space-y-2 p-6 pt-2">
          {data.projects.length === 0 ? (
            <p className="py-12 text-center text-sm font-bold text-slate-400">
              No projects with costs yet. Add cost line items and link subscriptions from a
              project&apos;s Costs page.
            </p>
          ) : (
            data.projects.map((proj) => {
              const isOpen = openProjects.has(proj.projectId)
              const hasItems = proj.costLineItems.length > 0 || proj.linkedMonitors.length > 0
              return (
                <Collapsible
                  key={proj.projectId}
                  open={isOpen}
                  onOpenChange={() => {
                    toggleProject(proj.projectId)
                  }}
                >
                  <CollapsibleTrigger asChild>
                    <button
                      type="button"
                      className={cn(
                        "flex w-full items-center justify-between rounded-2xl border px-5 py-4 text-left transition-colors",
                        hasItems
                          ? "border-slate-200 hover:bg-slate-50 dark:border-slate-800 dark:hover:bg-slate-800/50"
                          : "border-slate-100 dark:border-slate-800"
                      )}
                    >
                      <span className="flex items-center gap-2 text-sm font-bold text-slate-900 dark:text-white">
                        {isOpen ? (
                          <ChevronDown className="h-4 w-4 text-slate-400" />
                        ) : (
                          <ChevronRight className="h-4 w-4 text-slate-400" />
                        )}
                        {proj.title}
                      </span>
                      <span className="font-black text-slate-900 dark:text-white">
                        $
                        {proj.totalMonthly.toLocaleString(undefined, {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2
                        })}{" "}
                        <span className="text-xs font-medium text-slate-500">/ mo</span>
                      </span>
                    </button>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <div className="mt-2 space-y-4 rounded-2xl border border-slate-100 bg-slate-50/50 px-5 py-4 dark:border-slate-800 dark:bg-slate-900/30">
                      {proj.costLineItems.length > 0 && (
                        <div>
                          <p className="mb-2 text-[10px] font-black tracking-widest text-slate-400 uppercase">
                            Cost line items
                          </p>
                          <ul className="space-y-1.5">
                            {proj.costLineItems.map((item) => (
                              <li key={item._id} className="flex justify-between text-sm">
                                <span className="font-medium text-slate-900 dark:text-white">
                                  {item.name} <span className="text-slate-400">({item.type})</span>
                                </span>
                                <span className="font-bold text-slate-700 dark:text-slate-300">
                                  {item.currency} {item.amount} / {formatFreq(item.frequency)}
                                </span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                      {proj.linkedMonitors.length > 0 && (
                        <div>
                          <p className="mb-2 flex items-center gap-1 text-[10px] font-black tracking-widest text-slate-400 uppercase">
                            <Activity className="h-3.5 w-3.5" />
                            Linked subscriptions / monitors
                          </p>
                          <ul className="space-y-1.5">
                            {proj.linkedMonitors.map((m) => (
                              <li key={m._id} className="flex justify-between text-sm">
                                <span className="font-medium text-slate-900 dark:text-white">
                                  {m.name} <span className="text-slate-400">({m.type})</span>
                                </span>
                                <span className="font-bold text-slate-700 dark:text-slate-300">
                                  {m.currency || "USD"} {m.price?.toLocaleString() ?? "—"}
                                </span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                      {!hasItems && (
                        <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
                          No cost items or linked monitors.
                        </p>
                      )}
                      <div className="pt-2">
                        <Link
                          href={`/projects/${proj.projectId}/costs`}
                          className="inline-flex items-center gap-1.5 rounded-lg bg-slate-100 px-3 py-1.5 text-[10px] font-bold text-slate-600 transition-colors hover:bg-slate-200 hover:text-slate-900 dark:bg-slate-800 dark:text-slate-400 dark:hover:bg-slate-700"
                        >
                          <LinkIcon className="h-3.5 w-3.5" />
                          Open project Costs
                        </Link>
                      </div>
                    </div>
                  </CollapsibleContent>
                </Collapsible>
              )
            })
          )}
        </div>
      </div>
    </div>
  )
}
