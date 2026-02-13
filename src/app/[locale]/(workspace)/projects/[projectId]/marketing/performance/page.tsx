"use client"

import {
  BarChart3,
  TrendingUp,
  Search,
  MousePointer2,
  Target,
  Calendar,
  ChevronDown,
  ArrowUpRight,
  TrendingDown,
  Globe,
  Filter,
  Download,
  Plus
} from "lucide-react"
import Link from "next/link"
import { useParams } from "next/navigation"

import { Button } from "@/components/ui/button"
import { useGoogleSearchConsole } from "@/lib/hooks/useGoogleSearchConsole"

export default function PerformancePage() {
  const { locale, projectId } = useParams()
  const { searchData, loading } = useGoogleSearchConsole(projectId as string)
  return (
    <div className="space-y-8 p-8 pb-20">
      {/* Header */}
      <div className="flex flex-col justify-between gap-6 md:flex-row md:items-end">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <div className="flex h-6 items-center justify-center rounded-md border border-amber-500/20 bg-amber-500/10 px-2">
              <span className="text-[9px] font-black tracking-[0.2em] text-amber-600 uppercase">
                Analytics Hub
              </span>
            </div>
            <div className="h-1 w-1 rounded-full bg-slate-300 dark:bg-slate-700" />
            <span className="text-[10px] font-bold tracking-widest text-slate-400 uppercase">
              Performance Insights
            </span>
          </div>
          <h1 className="text-4xl font-black tracking-tighter text-slate-900 dark:text-white">
            Marketing <span className="text-amber-600">Reporting</span>
          </h1>
          <p className="max-w-lg text-xs font-medium text-slate-500 italic">
            Detailed reports on search visibility, engagement, and conversion performance.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            className="h-11 rounded-xl border-slate-200 px-4 text-slate-600 dark:border-slate-800 dark:text-slate-400"
          >
            <Calendar className="mr-2 h-4 w-4" /> Last 30 Days
          </Button>
          <Link href={`/${locale}/projects/${projectId}/marketing/reporting/builder`}>
            <Button className="h-11 rounded-xl bg-slate-900 px-6 text-[11px] font-bold tracking-widest text-white uppercase shadow-lg dark:bg-white dark:text-slate-900">
              <Plus className="mr-2 h-4 w-4" /> Build Custom Report
            </Button>
          </Link>
          <Button className="h-11 rounded-xl bg-amber-600 px-6 text-[11px] font-bold tracking-widest text-white uppercase shadow-lg shadow-amber-500/20 hover:bg-amber-700">
            <Download className="mr-2 h-4 w-4" /> Export Report
          </Button>
        </div>
      </div>

      {/* Google Search Console Metrics (HubSpot Styled) */}
      <div className="rounded-[2.5rem] border border-slate-100 bg-white p-8 shadow-2xl shadow-slate-200/40 dark:border-slate-800 dark:bg-slate-900 dark:shadow-none">
        <div className="mb-8 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-50 shadow-inner dark:bg-blue-900/20">
              <Search className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <h3 className="text-xl font-black text-slate-900 dark:text-white">
                Google Search Console
              </h3>
              <p className="text-[10px] font-black tracking-[0.2em] text-slate-400 uppercase">
                Search Visibility Data
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="h-2 w-2 animate-pulse rounded-full bg-emerald-500" />
            <span className="text-[10px] font-black tracking-widest text-emerald-600 uppercase">
              Live Connection
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-8 md:grid-cols-4">
          {[
            { label: "Total Clicks", value: "2.4k", change: "+14.2%", trend: "up" },
            { label: "Total Impressions", value: "84.2k", change: "+8.4%", trend: "up" },
            { label: "Avg. CTR", value: "2.8%", change: "-0.2%", trend: "down" },
            { label: "Avg. Position", value: "12.4", change: "+2.1", trend: "up" }
          ].map((metric, i) => (
            <div key={i} className="space-y-2">
              <p className="text-[10px] font-black tracking-[0.2em] text-slate-400 uppercase">
                {metric.label}
              </p>
              <div className="flex items-end gap-3">
                <h4 className="text-3xl font-black text-slate-900 dark:text-white">
                  {metric.value}
                </h4>
                <div
                  className={cn(
                    "mb-1 flex items-center gap-1 text-[11px] font-black",
                    metric.trend === "up" ? "text-emerald-500" : "text-rose-500"
                  )}
                >
                  {metric.trend === "up" ? (
                    <TrendingUp className="h-3 w-3" />
                  ) : (
                    <TrendingDown className="h-3 w-3" />
                  )}
                  {metric.change}
                </div>
              </div>
              <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-50 dark:bg-slate-800">
                <div
                  className={cn(
                    "h-full rounded-full transition-all duration-1000",
                    metric.trend === "up" ? "bg-emerald-500" : "bg-rose-500"
                  )}
                  style={{ width: "65%" }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
        {/* Top Queries Table */}
        <div className="rounded-[2.5rem] border border-slate-100 bg-white p-8 shadow-xl shadow-slate-200/40 dark:border-slate-800 dark:bg-slate-900 dark:shadow-none">
          <div className="mb-8 flex items-center justify-between">
            <div className="space-y-1">
              <h3 className="text-xl font-black text-slate-900 dark:text-white">
                Top Search Queries
              </h3>
              <p className="text-[10px] font-black tracking-[0.2em] text-slate-400 uppercase">
                Ranking Performance
              </p>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              <Filter className="h-5 w-5" />
            </Button>
          </div>

          <div className="space-y-1">
            <div className="grid grid-cols-4 px-4 py-2 text-[9px] font-black tracking-widest text-slate-400 uppercase">
              <span className="col-span-2">Query</span>
              <span className="text-right">Clicks</span>
              <span className="text-right">Pos.</span>
            </div>
            {[
              { query: "project management software", clicks: "412", pos: "2.4" },
              { query: "agile team collaboration", clicks: "218", pos: "4.1" },
              { query: "remote work efficiency", clicks: "184", pos: "1.2" },
              { query: "saas productivity tools", clicks: "142", pos: "12.8" },
              { query: "best gantt chart app", clicks: "94", pos: "8.4" }
            ].map((row, i) => (
              <div
                key={i}
                className="group grid cursor-pointer grid-cols-4 rounded-xl px-4 py-4 transition-colors hover:bg-slate-50 dark:hover:bg-slate-800/50"
              >
                <span className="col-span-2 text-xs font-bold text-slate-900 transition-colors group-hover:text-blue-600 dark:text-white">
                  {row.query}
                </span>
                <span className="text-right text-xs font-black text-slate-500">{row.clicks}</span>
                <span className="text-right text-xs font-black text-emerald-500">#{row.pos}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Traffic Channels */}
        <div className="relative overflow-hidden rounded-[2.5rem] bg-slate-950 p-8 text-white shadow-2xl shadow-blue-900/20">
          <div className="absolute top-0 right-0 -mt-32 -mr-32 h-64 w-64 rounded-full bg-amber-500/10 blur-[80px]" />

          <div className="relative z-10">
            <div className="mb-8 flex items-center justify-between">
              <div className="space-y-1">
                <h3 className="text-xl font-black italic">Traffic Sources</h3>
                <p className="text-[10px] font-black tracking-[0.2em] text-amber-400 uppercase">
                  Medium Analysis
                </p>
              </div>
            </div>

            <div className="space-y-6 py-4">
              {[
                { channel: "Organic Search", value: "64%", color: "bg-blue-500" },
                { channel: "Direct Traffic", value: "22%", color: "bg-purple-500" },
                { channel: "Social Media", value: "10%", color: "bg-rose-500" },
                { channel: "Referral", value: "4%", color: "bg-emerald-500" }
              ].map((channel, i) => (
                <div key={i} className="space-y-2">
                  <div className="flex items-center justify-between text-[11px] font-bold tracking-tight uppercase">
                    <span>{channel.channel}</span>
                    <span className="text-slate-400">{channel.value}</span>
                  </div>
                  <div className="h-3 overflow-hidden rounded-full bg-white/10">
                    <div
                      className={cn(
                        "h-full rounded-full transition-all duration-1000",
                        channel.color
                      )}
                      style={{ width: channel.value }}
                    />
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-8 flex items-center justify-between rounded-2xl border border-white/10 bg-white/5 p-6">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-600 shadow-lg">
                  <Target className="h-5 w-5 text-white" />
                </div>
                <div>
                  <p className="text-[10px] font-black text-slate-400 uppercase">Total Conv.</p>
                  <p className="text-base font-black italic">428 Monthly</p>
                </div>
              </div>
              <Button
                variant="link"
                className="p-0 text-[10px] font-black tracking-widest text-blue-400 uppercase"
              >
                Settings <ArrowUpRight className="ml-1 h-3 w-3" />
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
