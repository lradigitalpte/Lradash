"use client"

import {
  Search,
  TrendingUp,
  ArrowUpRight,
  CheckCircle2,
  AlertCircle,
  Menu,
  MousePointer2,
  Share2,
  Layout,
  Smartphone,
  Zap,
  ChevronDown,
  BarChart3
} from "lucide-react"
import Link from "next/link"
import { useParams } from "next/navigation"
import { useState } from "react"

import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { useGoogleSearchConsole } from "@/lib/hooks/useGoogleSearchConsole"
import { useSEOData } from "@/lib/hooks/useSEOData"

export default function SEOPage() {
  const { locale, projectId } = useParams()
  const { score, recommendations, loading, updateRecommendationStatus } = useSEOData(
    projectId as string
  )
  const { connectionStatus } = useGoogleSearchConsole(projectId as string)

  const handleConvertToTask = async (recommendationId: string) => {
    // TODO: Create actual task via API
    await updateRecommendationStatus(recommendationId, "converted-to-task")
  }

  return (
    <div className="space-y-8 p-8 pb-20">
      {/* Header with SEO Score */}
      <div className="flex flex-col justify-between gap-8 lg:flex-row lg:items-center">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <div className="flex h-6 items-center justify-center rounded-md border border-emerald-500/20 bg-emerald-500/10 px-2">
              <span className="text-[9px] font-black tracking-[0.2em] text-emerald-600 uppercase">
                Search Strategy
              </span>
            </div>
            <div className="h-1 w-1 rounded-full bg-slate-300 dark:bg-slate-700" />
            <span className="text-[10px] font-bold tracking-widest text-slate-400 uppercase">
              Optimized
            </span>
          </div>
          <h1 className="text-4xl font-black tracking-tighter text-slate-900 dark:text-white">
            SEO <span className="text-emerald-600">Recommendations</span>
          </h1>
          <p className="max-w-lg text-xs font-medium text-slate-500 italic">
            HubSpot-powered insights to improve your search rank and build domain authority.
          </p>
        </div>

        <div className="flex items-center gap-6 rounded-[2rem] border border-slate-100 bg-white p-6 shadow-xl dark:border-slate-800 dark:bg-slate-900">
          <div className="flex flex-col items-center">
            <span className="mb-2 text-[10px] font-black tracking-widest text-slate-400 uppercase">
              Overall SEO Score
            </span>
            <div className="relative flex h-20 w-20 items-center justify-center">
              <svg className="h-full w-full rotate-[-90deg]">
                <circle
                  cx="40"
                  cy="40"
                  r="35"
                  className="fill-none stroke-slate-100 stroke-[6] dark:stroke-slate-800"
                />
                <circle
                  cx="40"
                  cy="40"
                  r="35"
                  className="stroke-dasharray-[220] fill-none stroke-emerald-500 stroke-[6]"
                  style={{
                    strokeDashoffset: loading ? 220 : 220 - (220 * (score?.overallScore || 0)) / 100
                  }}
                />
              </svg>
              <span className="absolute text-xl font-black">
                {loading ? "..." : score?.overallScore || 0}
              </span>
            </div>
          </div>
          <div className="h-12 w-px bg-slate-100 dark:bg-slate-800" />
          <div className="space-y-3">
            <div className="flex items-center gap-4">
              <div className="h-2 w-2 rounded-full bg-emerald-500" />
              <span className="text-[11px] font-bold tracking-wider text-slate-500 uppercase">
                On-Page
              </span>
              <span className="ml-auto text-xs font-black">
                {loading ? "..." : score?.categories.onPage || 0}%
              </span>
            </div>
            <div className="flex items-center gap-4">
              <div className="h-2 w-2 rounded-full bg-blue-500" />
              <span className="text-[11px] font-bold tracking-wider text-slate-500 uppercase">
                Technical
              </span>
              <span className="ml-auto text-xs font-black">
                {loading ? "..." : score?.categories.technical || 0}%
              </span>
            </div>
            <div className="flex items-center gap-4">
              <div className="h-2 w-2 rounded-full bg-purple-500" />
              <span className="text-[11px] font-bold tracking-wider text-slate-500 uppercase">
                Content
              </span>
              <span className="ml-auto text-xs font-black">
                {loading ? "..." : score?.categories.content || 0}%
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        {/* Main Recommendation Feed */}
        <div className="space-y-6 lg:col-span-2">
          <div className="flex items-center justify-between px-2">
            <h3 className="text-lg font-black tracking-tight text-slate-900 uppercase dark:text-white">
              Active Recommendations
            </h3>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-black tracking-widest text-slate-400 uppercase">
                Sort by:
              </span>
              <button className="flex items-center gap-1 text-[10px] font-black tracking-widest text-blue-600 uppercase">
                Impact <ChevronDown className="h-3 w-3" />
              </button>
            </div>
          </div>

          <div className="space-y-4">
            {loading ? (
              <div className="py-12 text-center text-slate-400">Loading recommendations...</div>
            ) : recommendations && recommendations.length > 0 ? (
              recommendations.map((item) => {
                const IconComponent =
                  item.category === "technical"
                    ? Zap
                    : item.category === "on-page"
                      ? Layout
                      : item.category === "content"
                        ? Search
                        : Smartphone
                const isConverted = item.status === "converted-to-task"
                return (
                  <div key={item.id} className="group relative">
                    <div className="absolute -inset-0.5 rounded-[2rem] bg-gradient-to-r from-blue-500/20 to-purple-500/20 opacity-0 blur-sm transition duration-500 group-hover:opacity-100" />
                    <div className="relative flex flex-col gap-6 rounded-[2rem] border border-slate-100 bg-white p-6 shadow-lg shadow-slate-200/40 md:flex-row dark:border-slate-800 dark:bg-slate-900 dark:shadow-none">
                      <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-slate-50 shadow-inner transition-transform duration-500 group-hover:scale-110 dark:bg-slate-800">
                        <IconComponent className="h-6 w-6 text-blue-600" />
                      </div>
                      <div className="flex-1 space-y-2">
                        <div className="flex flex-wrap items-center gap-2">
                          <span
                            className={cn(
                              "rounded-md px-2 py-0.5 text-[9px] font-black tracking-widest uppercase",
                              item.impact === "high"
                                ? "border border-rose-500/20 bg-rose-500/10 text-rose-600"
                                : "border border-blue-500/20 bg-blue-500/10 text-blue-600"
                            )}
                          >
                            {item.impact} Impact
                          </span>
                          <span className="rounded-md border border-slate-200 bg-slate-100 px-2 py-0.5 text-[9px] font-black tracking-widest text-slate-500 uppercase dark:border-slate-700 dark:bg-slate-800">
                            {item.difficulty}
                          </span>
                          <span className="ml-auto text-[10px] font-bold tracking-tighter text-slate-400 uppercase">
                            {item.category}
                          </span>
                        </div>
                        <h4 className="text-base font-black text-slate-900 transition-colors group-hover:text-blue-600 dark:text-white">
                          {item.title}
                        </h4>
                        <p className="text-xs leading-relaxed font-medium text-slate-500 dark:text-slate-400">
                          {item.description}
                        </p>
                        <div className="flex items-center gap-4 pt-2">
                          {isConverted ? (
                            <Button
                              variant="ghost"
                              className="h-8 rounded-lg border border-emerald-500/20 bg-emerald-500/10 px-4 text-[10px] font-black tracking-widest text-emerald-600 uppercase"
                            >
                              <CheckCircle2 className="mr-2 h-3 w-3" /> View on Board
                            </Button>
                          ) : (
                            <Button
                              onClick={ async () => handleConvertToTask(item.id)}
                              variant="ghost"
                              className="group/btn h-8 rounded-lg border border-blue-500/20 px-4 text-[10px] font-black tracking-widest text-blue-600 uppercase hover:bg-blue-50 dark:hover:bg-blue-900/20"
                            >
                              <ArrowUpRight className="mr-2 h-3 w-3 transition-transform group-hover/btn:translate-x-0.5 group-hover/btn:-translate-y-0.5" />
                              Convert to Task
                            </Button>
                          )}
                          <Button
                            variant="ghost"
                            className="h-8 rounded-lg p-0 px-4 text-[10px] font-black tracking-widest text-slate-400 uppercase hover:text-slate-900 dark:hover:text-white"
                          >
                            Ignore
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                )
              })
            ) : (
              <div className="py-12 text-center text-slate-400">
                No recommendations yet. Add recommendations to get started.
              </div>
            )}
          </div>
        </div>

        {/* Sidebar Tools */}
        <div className="space-y-8">
          {/* Topic Authority Card */}
          <div className="relative overflow-hidden rounded-[2.5rem] bg-gradient-to-br from-indigo-900 to-slate-950 p-8 text-white shadow-2xl shadow-indigo-900/20">
            <div className="absolute top-0 right-0 -mt-16 -mr-16 h-32 w-32 rounded-full bg-blue-500/20 blur-[40px]" />
            <div className="relative z-10 space-y-6">
              <div className="space-y-1">
                <h3 className="text-xl font-black">Plan Strategy</h3>
                <p className="text-[10px] font-black tracking-[0.2em] text-blue-400 uppercase">
                  Content Clusters
                </p>
              </div>
              <p className="text-xs leading-relaxed text-slate-300 italic">
                Connect your core topics to supporting sub-topics to build search engine authority.
              </p>
              <div className="space-y-4">
                {[
                  { topic: "Project Management", progress: 85 },
                  { topic: "Team Collaboration", progress: 42 },
                  { topic: "Agile Workflows", progress: 12 }
                ].map((t, i) => (
                  <div key={i} className="space-y-1.5">
                    <div className="flex items-center justify-between text-[11px] font-bold tracking-tight uppercase">
                      <span>{t.topic}</span>
                      <span className="text-blue-400">{t.progress}%</span>
                    </div>
                    <div className="h-1.5 overflow-hidden rounded-full bg-white/10">
                      <div
                        className="h-full rounded-full bg-blue-500 transition-all duration-1000"
                        style={{ width: `${t.progress}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
              <Button className="h-11 w-full rounded-xl bg-white text-[10px] font-black tracking-widest text-indigo-950 uppercase shadow-lg hover:bg-slate-100">
                Discover More Topics
              </Button>
            </div>
          </div>

          {/* Integration Status */}
          <div className="rounded-[2.5rem] border border-slate-100 bg-white p-8 shadow-xl shadow-slate-200/50 dark:border-slate-800 dark:bg-slate-900 dark:shadow-none">
            <h4 className="mb-6 text-sm font-black tracking-tight text-slate-900 uppercase dark:text-white">
              Integrations
            </h4>
            <div className="space-y-4">
              <div className="flex items-center justify-between rounded-2xl bg-slate-50 p-4 dark:bg-slate-800/50">
                <div className="flex items-center gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white shadow-sm dark:bg-slate-900">
                    <Search className="h-4 w-4 text-blue-600" />
                  </div>
                  <span className="text-[11px] font-bold tracking-tight uppercase">
                    Google Console
                  </span>
                </div>
                <div className="flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-2 py-0.5">
                  <div className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-500" />
                  <span className="text-[9px] font-black text-emerald-600 uppercase">Live</span>
                </div>
              </div>

              <div className="flex items-center justify-between rounded-2xl bg-slate-50 p-4 opacity-50 dark:bg-slate-800/50">
                <div className="flex items-center gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white shadow-sm dark:bg-slate-900">
                    <BarChart3 className="h-4 w-4 text-orange-600" />
                  </div>
                  <span className="text-[11px] font-bold tracking-tight uppercase">
                    Google Analytics
                  </span>
                </div>
                <Link href={`/${locale}/projects/${projectId}/marketing/connect`}>
                  <Button
                    variant="ghost"
                    className="h-6 px-2 text-[9px] font-black text-blue-600 uppercase"
                  >
                    Connect
                  </Button>
                </Link>
              </div>
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
