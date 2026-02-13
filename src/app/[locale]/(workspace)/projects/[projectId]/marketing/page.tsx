"use client"

import {
  BarChart3,
  TrendingUp,
  Users,
  Search,
  ArrowUpRight,
  Target,
  Zap,
  ShieldCheck,
  Globe
} from "lucide-react"
import { useParams } from "next/navigation"

import { Button } from "@/components/ui/button"
import { useGoogleSearchConsole } from "@/lib/hooks/useGoogleSearchConsole"
import { useSEOData } from "@/lib/hooks/useSEOData"

export default function MarketingOverviewPage() {
  const { projectId } = useParams()
  const { score, recommendations, loading: seoLoading } = useSEOData(projectId as string)
  const { searchData, loading: googleLoading } = useGoogleSearchConsole(projectId as string)

  const loading = seoLoading || googleLoading

  // Calculate KPIs from real data
  const totalClicks = searchData?.overview.totalClicks || 0
  const totalImpressions = searchData?.overview.totalImpressions || 0
  const clickTrend = searchData?.overview.trend.clicks || 0
  const impressionTrend = searchData?.overview.trend.impressions || 0

  // Mock leads data (would come from another API in production)
  const newLeads = 428
  const leadsTrend = 18.2
  const convRate = 3.24
  const convTrend = -0.4

  return (
    <div className="space-y-8 p-8">
      {/* WOW Header */}
      <div className="flex flex-col justify-between gap-6 md:flex-row md:items-end">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <div className="flex h-6 items-center justify-center rounded-md border border-blue-500/20 bg-blue-500/10 px-2">
              <span className="text-[9px] font-black tracking-[0.2em] text-blue-600 uppercase">
                Growth Optimization
              </span>
            </div>
            <div className="h-1 w-1 rounded-full bg-slate-300 dark:bg-slate-700" />
            <span className="text-[10px] font-bold tracking-widest text-slate-400 uppercase">
              Active Tracking
            </span>
          </div>
          <h1 className="text-4xl font-black tracking-tighter text-slate-900 dark:text-white">
            Marketing <span className="text-blue-600">Intelligence</span>
          </h1>
          <p className="max-w-lg text-xs font-medium text-slate-500 italic">
            Monitor search authority, content performance, and lead conversion for your project in
            real-time.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button className="h-11 rounded-xl border border-slate-200 bg-white px-6 text-[11px] font-bold tracking-widest text-slate-900 uppercase shadow-sm hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:text-white dark:hover:bg-slate-800">
            Export Data
          </Button>
          <Button className="h-11 rounded-xl bg-blue-600 px-6 text-[11px] font-bold tracking-widest text-white uppercase shadow-lg shadow-blue-500/20 hover:bg-blue-700">
            Campaign Setup
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
        {[
          {
            label: "Total Traffic",
            value: loading ? "..." : totalClicks.toLocaleString(),
            change: loading ? "..." : `${clickTrend > 0 ? "+" : ""}${clickTrend.toFixed(1)}%`,
            icon: Globe,
            color: "blue"
          },
          {
            label: "Search Imp.",
            value: loading ? "..." : `${(totalImpressions / 1000).toFixed(1)}k`,
            change: loading
              ? "..."
              : `${impressionTrend > 0 ? "+" : ""}${impressionTrend.toFixed(1)}%`,
            icon: Search,
            color: "emerald"
          },
          {
            label: "New Leads",
            value: newLeads.toLocaleString(),
            change: `+${leadsTrend.toFixed(1)}%`,
            icon: Users,
            color: "purple"
          },
          {
            label: "Conv. Rate",
            value: `${convRate.toFixed(2)}%`,
            change: `${convTrend.toFixed(1)}%`,
            icon: Target,
            color: "rose"
          }
        ].map((kpi, i) => (
          <div
            key={i}
            className="group rounded-[2rem] border border-slate-100 bg-white p-6 shadow-xl shadow-slate-200/50 transition-all duration-300 hover:-translate-y-1 dark:border-slate-800 dark:bg-slate-900 dark:shadow-none"
          >
            <div className="mb-4 flex items-start justify-between">
              <div
                className={cn(
                  "flex h-12 w-12 transform items-center justify-center rounded-2xl shadow-lg transition-transform group-hover:rotate-6",
                  kpi.color === "blue"
                    ? "bg-blue-600 shadow-blue-500/30"
                    : kpi.color === "emerald"
                      ? "bg-emerald-600 shadow-emerald-500/30"
                      : kpi.color === "purple"
                        ? "bg-purple-600 shadow-purple-500/30"
                        : "bg-rose-600 shadow-rose-500/30"
                )}
              >
                <kpi.icon className="h-6 w-6 text-white" />
              </div>
              <div
                className={cn(
                  "rounded-lg px-2 py-1 text-[10px] font-black",
                  kpi.change.startsWith("+")
                    ? "bg-emerald-500/10 text-emerald-600"
                    : "bg-rose-500/10 text-rose-600"
                )}
              >
                {kpi.change}
              </div>
            </div>
            <p className="mb-1 text-[10px] font-black tracking-[0.2em] text-slate-400 uppercase">
              {kpi.label}
            </p>
            <h3 className="text-2xl font-black text-slate-900 dark:text-white">{kpi.value}</h3>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        {/* SEO Recommendations Preview */}
        <div className="space-y-6 lg:col-span-2">
          <div className="rounded-[2.5rem] border border-slate-100 bg-white p-8 shadow-2xl shadow-slate-200/40 dark:border-slate-800 dark:bg-slate-900 dark:shadow-none">
            <div className="mb-8 flex items-center justify-between">
              <div className="space-y-1">
                <h3 className="text-xl font-black text-slate-900 dark:text-white">
                  SEO Recommendations
                </h3>
                <p className="text-[10px] font-black tracking-[0.2em] text-slate-400 uppercase">
                  High Impact Tasks
                </p>
              </div>
              <Button
                variant="link"
                className="p-0 text-[10px] font-black tracking-widest text-blue-600 uppercase"
              >
                View Full Analysis <ArrowUpRight className="ml-1 h-3 w-3" />
              </Button>
            </div>

            <div className="space-y-4">
              {loading ? (
                <div className="py-8 text-center text-slate-400">Loading recommendations...</div>
              ) : recommendations && recommendations.length > 0 ? (
                recommendations
                  .slice(0, 3)
                  .filter((r) => r.impact === "high")
                  .map((rec) => {
                    const IconComponent =
                      rec.category === "technical"
                        ? Zap
                        : rec.category === "on-page"
                          ? ShieldCheck
                          : Search
                    return (
                      <div
                        key={rec.id}
                        className="group flex cursor-pointer items-center justify-between rounded-2xl border border-slate-100 bg-slate-50 p-4 transition-colors hover:border-blue-500/30 dark:border-slate-800 dark:bg-slate-800/50"
                      >
                        <div className="flex items-center gap-4">
                          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white shadow-sm transition-transform group-hover:scale-110 dark:bg-slate-900">
                            <IconComponent className="h-5 w-5 text-blue-600" />
                          </div>
                          <div>
                            <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                              {rec.title}
                            </h4>
                            <p className="mt-0.5 text-[10px] font-black tracking-tighter text-slate-400 uppercase">
                              {rec.category}
                            </p>
                          </div>
                        </div>
                        <div
                          className={cn(
                            "rounded-full px-3 py-1 text-[9px] font-black tracking-widest uppercase",
                            rec.impact === "high"
                              ? "border border-rose-500/20 bg-rose-500/10 text-rose-600"
                              : "border border-blue-500/20 bg-blue-500/10 text-blue-600"
                          )}
                        >
                          {rec.impact} Impact
                        </div>
                      </div>
                    )
                  })
              ) : (
                <div className="py-8 text-center text-slate-400">
                  No recommendations yet. Add recommendations in SEO Tools.
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Search Authority */}
        <div className="space-y-6">
          <div className="relative h-full overflow-hidden rounded-[2.5rem] bg-slate-950 p-8 text-white shadow-2xl shadow-blue-900/40">
            <div className="absolute top-0 right-0 -mt-32 -mr-32 h-64 w-64 rounded-full bg-blue-600/10 blur-[80px]" />

            <div className="relative z-10 space-y-6">
              <div className="space-y-1">
                <h3 className="text-xl font-black italic">Search Authority</h3>
                <p className="text-[10px] font-black tracking-[0.2em] text-blue-400 uppercase">
                  Project Vitality
                </p>
              </div>

              <div className="flex items-center justify-center py-8">
                <div className="relative flex h-40 w-40 items-center justify-center">
                  <svg className="h-full w-full rotate-[-90deg]">
                    <circle
                      cx="80"
                      cy="80"
                      r="70"
                      className="fill-none stroke-blue-950 stroke-[10]"
                    />
                    <circle
                      cx="80"
                      cy="80"
                      r="70"
                      className="stroke-dasharray-[440] stroke-dashoffset-[88] fill-none stroke-blue-500 stroke-[10] transition-all duration-1000"
                    />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-4xl font-black">82</span>
                    <span className="text-[10px] font-black tracking-widest text-blue-400 uppercase">
                      Domain Score
                    </span>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold tracking-wider text-slate-400 uppercase">
                    Keywords in Top 3
                  </span>
                  <span className="text-sm font-black">124</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold tracking-wider text-slate-400 uppercase">
                    Backlinks Active
                  </span>
                  <span className="text-sm font-black">2.4k</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold tracking-wider text-slate-400 uppercase">
                    Avg. Ranking Pos.
                  </span>
                  <span className="text-sm font-black text-emerald-400">#8.4</span>
                </div>
              </div>

              <Button className="h-12 w-full rounded-[1.25rem] bg-white text-[11px] font-black tracking-widest text-slate-950 uppercase hover:bg-slate-100">
                Analytics Deep Dive
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function cn(...inputs: any[]) {
  return inputs.filter(Boolean).join(" ")
}
