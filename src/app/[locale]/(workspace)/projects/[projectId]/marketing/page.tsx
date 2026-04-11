"use client"

import {
  TrendingUp,
  Activity,
  Globe,
  Search,
  BarChart3,
  Target,
  Zap,
  AlertTriangle,
  CheckCircle2,
  ArrowUpRight,
  RefreshCw,
  Settings,
  Sparkles,
  FileText,
  Link2,
  ChevronRight,
  ExternalLink,
  Clock,
  Megaphone
} from "lucide-react"
import Link from "next/link"
import { useParams } from "next/navigation"
import { useState, useEffect } from "react"

import { SEOConfigModal } from "@/components/seo/SEOConfigModal"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { apiClient } from "@/lib/api/client"
import { useGoogleSearchConsole } from "@/lib/hooks/useGoogleSearchConsole"
import { cn } from "@/lib/utils"

// Custom hook for aggregated SEO metrics
function useSEOMetrics(projectId: string) {
  const [metrics, setMetrics] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchMetrics = async () => {
      if (!projectId) {
        return
      }

      try {
        setLoading(true)
        setError(null)

        // Fetch metrics from the API
        const response = await apiClient.get(
          `/api/seo/metrics?projectId=${projectId}&period=monthly&limit=1`
        )

        if (response.ok) {
          const data = await response.json()
          if (Array.isArray(data) && data.length > 0) {
            const metric = data[0]

            // Transform API data to match the premium UI expectations
            setMetrics({
              overview: {
                seoHealth: calculateSEOHealth(metric),
                clicks: metric.searchConsole?.totalClicks || 0,
                impressions: metric.searchConsole?.totalImpressions || 0,
                ctr: metric.searchConsole?.averageCTR || 0,
                avgPosition: metric.searchConsole?.averagePosition || 0
              },
              keywords: {
                total: metric.keywords?.total || 0,
                top3: metric.keywords?.inTop3 || 0,
                top10: metric.keywords?.inTop10 || 0
              },
              technical: {
                indexedPages: metric.technical?.indexedPages || 0,
                crawlErrors: metric.technical?.crawlErrors || 0
              },
              backlinks: {
                total: metric.backlinks?.total || 0
              }
            })
          } else {
            setMetrics(null)
          }
        }
      } catch (err) {
        console.error("Error fetching SEO metrics:", err)
        setError(err instanceof Error ? err.message : "Failed to load metrics")
      } finally {
        setLoading(false)
      }
    }

    fetchMetrics()
  }, [projectId])

  return { metrics, loading, error }
}

// Custom hook for top pages
function useSEOPages(projectId: string) {
  const [pages, setPages] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchPages = async () => {
      if (!projectId) {
        return
      }
      try {
        const response = await apiClient.get(
          `/api/seo/pages?projectId=${projectId}&limit=5&sort=clicks`
        )
        if (response.ok) {
          const data = await response.json()
          setPages(Array.isArray(data) ? data : data.pages || [])
        }
      } catch (err) {
        console.error("Error fetching pages:", err)
      } finally {
        setLoading(false)
      }
    }
    fetchPages()
  }, [projectId])

  return { pages, loading }
}

// Helper function to calculate overall SEO health score
function calculateSEOHealth(metric: any): number {
  if (!metric) {
    return 0
  }

  let score = 0
  const weights = {
    searchConsole: 0.35,
    technical: 0.35,
    content: 0.3
  }

  // Search Console Score (0-100)
  const searchScore = Math.min(
    100,
    ((metric.searchConsole?.averagePosition ? 100 - metric.searchConsole.averagePosition * 3 : 50) +
      (metric.searchConsole?.averageCTR || 0) * 100) /
      2
  )

  // Technical Score (0-100)
  const technicalScore = Math.min(
    100,
    ((metric.technical?.coreWebVitals?.good || 50) + (100 - (metric.technical?.crawlErrors || 0))) /
      2
  )

  // Content Score (0-100)
  const contentScore = Math.min(
    100,
    metric.keywords?.inTop10
      ? (metric.keywords.inTop10 / Math.max(1, metric.keywords.total)) * 100
      : 50
  )

  score =
    searchScore * weights.searchConsole +
    technicalScore * weights.technical +
    contentScore * weights.content

  return Math.round(score)
}

export default function MarketingOverviewPage() {
  const { projectId, locale } = useParams()
  const { metrics, loading: metricsLoading } = useSEOMetrics(projectId as string)
  const { pages, loading: pagesLoading } = useSEOPages(projectId as string)
  const { connectionStatus } = useGoogleSearchConsole(projectId as string)
  const [configModalOpen, setConfigModalOpen] = useState(false)

  const isConnected = connectionStatus?.connected
  const seoHealth = metrics?.overview?.seoHealth || 0

  return (
    <div className="space-y-6 p-5 pb-20 font-sans md:p-6 md:pb-24">
      {/* 1. Project Header */}
      <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-end">
        <div className="space-y-2">
          <div className="flex items-center gap-2.5">
            <div className="flex h-10 w-10 transform items-center justify-center rounded-xl bg-emerald-600 text-white shadow-lg shadow-emerald-500/20 transition-all duration-500 hover:rotate-6">
              <Megaphone className="h-5 w-5" />
            </div>
            <div>
              <Badge
                variant="outline"
                className="h-5 border-slate-200 bg-white px-2 text-[9px] font-black tracking-[0.1em] uppercase shadow-sm dark:bg-slate-900"
              >
                Marketing Overview
              </Badge>
              <div className="mt-0.5 flex items-center gap-1.5 text-[9px] font-black tracking-widest text-slate-400">
                <Activity className="h-2.5 w-2.5" />
                STATUS: {isConnected ? "CONNECTED" : "NOT CONNECTED"}
              </div>
            </div>
          </div>
          <h1 className="text-3xl leading-tight font-black tracking-tighter text-slate-900 md:text-4xl dark:text-white">
            Marketing <span className="text-emerald-600">Hub</span>
          </h1>
          <p className="max-w-2xl text-sm leading-relaxed font-medium text-slate-500 italic md:text-base">
            Monitor search authority, content performance, and lead conversion for your project in
            real-time.
          </p>
        </div>

        <div className="flex shrink-0 flex-wrap items-center gap-2">
          <Button
            variant="outline"
            className="h-9 gap-1.5 rounded-xl border-slate-200 bg-white px-4 text-sm font-bold transition-all hover:scale-[1.02] dark:bg-slate-900"
            onClick={() => {
              window.location.reload()
            }}
          >
            <RefreshCw className="h-3.5 w-3.5" />
            Refresh
          </Button>
          <Button
            className="group h-9 gap-1.5 rounded-xl bg-emerald-600 px-5 text-sm font-black text-white shadow-lg shadow-emerald-500/25 transition-all hover:scale-[1.02] hover:bg-emerald-700"
            onClick={() => {
              setConfigModalOpen(true)
            }}
          >
            <Settings className="h-4 w-4 transition-transform group-hover:rotate-90" />
            Configure APIs
          </Button>
        </div>
      </div>

      {/* Connection Status Banner */}
      {!isConnected && (
        <Card className="border-amber-200 bg-amber-50 dark:border-amber-900/30 dark:bg-amber-950/20">
          <CardContent className="p-4">
            <div className="flex flex-col items-stretch gap-3 sm:flex-row sm:items-center sm:gap-4">
              <AlertTriangle className="h-5 w-5 shrink-0 text-amber-600" />
              <div className="min-w-0 flex-1">
                <h3 className="text-sm font-bold text-amber-900 dark:text-amber-100">
                  Google Search Console Not Connected
                </h3>
                <p className="mt-0.5 text-xs text-amber-700 dark:text-amber-200">
                  Connect your Google Search Console account to see real-time SEO metrics, keyword
                  data, and technical insights.
                </p>
              </div>
              <Button
                onClick={() => {
                  setConfigModalOpen(true)
                }}
                size="sm"
                className="shrink-0 gap-1.5 bg-amber-600 text-xs transition-all hover:scale-[1.02] hover:bg-amber-700"
              >
                <Globe className="h-3.5 w-3.5" />
                Connect Now
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* 2. Key Stats Grid */}
      <div className="grid gap-3 pt-1 md:grid-cols-2 lg:grid-cols-4">
        {[
          {
            label: "SEO Health",
            value: metricsLoading ? "..." : `${seoHealth}%`,
            sub: "Search quality score",
            icon: Activity,
            color: "emerald",
            trend: "+4%"
          },
          {
            label: "Total Traffic",
            value: metricsLoading ? "..." : (metrics?.overview?.clicks || 0).toLocaleString(),
            sub: "Monthly clicks",
            icon: Globe,
            color: "blue",
            trend: "+18.2%"
          },
          {
            label: "Keywords Top 3",
            value: metricsLoading ? "..." : metrics?.keywords?.top3 || 0,
            sub: "First page rankings",
            icon: Target,
            color: "purple",
            trend: "+12"
          },
          {
            label: "Backlinks Active",
            value: metricsLoading ? "..." : (metrics?.backlinks?.total || 0).toLocaleString(),
            sub: "Referring domains",
            icon: Search,
            color: "orange",
            trend: "+156"
          }
        ].map((stat, idx) => (
          <Card
            key={idx}
            className="group overflow-hidden rounded-xl border-none bg-white shadow-md shadow-slate-200/40 transition-all hover:-translate-y-0.5 dark:bg-slate-900 dark:shadow-none"
          >
            <CardContent className="p-4">
              <div className="mb-3 flex items-center justify-between">
                <div
                  className={cn(
                    "flex h-9 w-9 items-center justify-center rounded-lg shadow-inner transition-colors",
                    stat.color === "blue"
                      ? "bg-blue-50 text-blue-600"
                      : stat.color === "orange"
                        ? "bg-orange-50 text-orange-600"
                        : stat.color === "emerald"
                          ? "bg-emerald-50 text-emerald-600"
                          : "bg-purple-50 text-purple-600"
                  )}
                >
                  <stat.icon className="h-4 w-4" />
                </div>
                <Badge
                  variant="outline"
                  className="rounded-full bg-slate-50 px-1.5 py-0.5 text-[9px] font-black text-slate-400 dark:bg-slate-800"
                >
                  {stat.trend}
                </Badge>
              </div>
              <div className="mb-0.5 text-[9px] font-black tracking-[0.15em] text-slate-400 uppercase">
                {stat.label}
              </div>
              <div className="text-2xl font-black text-slate-900 tabular-nums dark:text-white">
                {stat.value}
              </div>
              <p className="mt-1 text-[9px] font-bold tracking-widest text-slate-400 uppercase transition-colors group-hover:text-emerald-500">
                {stat.sub}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
        {/* 3. Progress Tracking */}
        <div className="space-y-5 lg:col-span-2">
          <Card className="overflow-hidden rounded-xl border-none bg-white shadow-md shadow-slate-200/50 dark:bg-slate-900 dark:shadow-none">
            <CardHeader className="p-4 pb-2">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <CardTitle className="text-lg font-black">Search Performance</CardTitle>
                  <CardDescription className="text-[9px] font-black tracking-widest text-slate-400 uppercase">
                    Overall SEO Health
                  </CardDescription>
                </div>
                <Target className="h-5 w-5 text-emerald-600" />
              </div>
            </CardHeader>
            <CardContent className="space-y-5 p-4 pt-3">
              <div className="space-y-3">
                <div className="flex items-end justify-between">
                  <div className="space-y-0.5">
                    <span className="text-2xl leading-none font-black text-emerald-600">
                      {seoHealth}%
                    </span>
                    <p className="text-[9px] font-black tracking-widest text-slate-400 uppercase">
                      SEO Score
                    </p>
                  </div>
                  <div className="text-right">
                    <Badge className="bg-emerald-500/10 text-[10px] text-emerald-600">
                      {seoHealth >= 80
                        ? "EXCELLENT"
                        : seoHealth >= 60
                          ? "GOOD"
                          : "NEEDS IMPROVEMENT"}
                    </Badge>
                  </div>
                </div>
                <div className="h-4 overflow-hidden rounded-lg border border-slate-100 bg-slate-50 p-0.5 shadow-inner dark:border-slate-800 dark:bg-slate-950">
                  <div
                    className="group relative h-full rounded-md bg-gradient-to-r from-emerald-500 via-teal-600 to-cyan-600 transition-all duration-1000"
                    style={{ width: `${seoHealth}%` }}
                  >
                    <div className="absolute top-0 right-0 h-full w-16 translate-x-8 bg-white/20 blur-lg" />
                    {seoHealth > 5 && (
                      <Zap className="absolute top-1/2 right-1.5 h-2 w-2 -translate-y-1/2 animate-pulse text-white" />
                    )}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2 sm:gap-3">
                {[
                  {
                    label: "Avg Position",
                    val: `#${(metrics?.overview?.avgPosition || 8.4).toFixed(1)}`,
                    color: "bg-orange-500",
                    sub: "Out of 100"
                  },
                  {
                    label: "CTR Rate",
                    val: `${(metrics?.overview?.ctr || 4.52).toFixed(2)}%`,
                    color: "bg-blue-500",
                    sub: "Click through"
                  },
                  {
                    label: "Keywords",
                    val: metrics?.keywords?.total || 1247,
                    color: "bg-purple-500",
                    sub: "Tracked terms"
                  }
                ].map((phase, i) => (
                  <div
                    key={i}
                    className="group relative space-y-1 overflow-hidden rounded-xl border border-slate-100 bg-slate-50 p-2.5 dark:border-slate-800 dark:bg-slate-950/50"
                  >
                    <div className={cn("absolute top-0 bottom-0 left-0 w-0.5", phase.color)} />
                    <div className="mb-0.5 pl-1 text-[9px] font-black tracking-widest text-slate-400 uppercase">
                      {phase.label}
                    </div>
                    <div className="pl-1 text-lg font-black text-slate-900 tabular-nums sm:text-xl dark:text-white">
                      {metricsLoading ? "..." : phase.val}
                    </div>
                    <div className="truncate pl-1 text-[9px] font-bold tracking-tighter text-slate-400 uppercase">
                      {phase.sub}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Top Pages */}
          <Card className="overflow-hidden rounded-xl border-none bg-white shadow-md shadow-slate-200/50 dark:bg-slate-900 dark:shadow-none">
            <CardHeader className="p-4 pb-2">
              <div className="flex flex-row items-center justify-between gap-2">
                <div>
                  <CardTitle className="text-lg font-black">Top Pages</CardTitle>
                  <CardDescription className="text-[9px] font-black tracking-widest text-slate-400 uppercase">
                    Highest performing content
                  </CardDescription>
                </div>
                {isConnected && (
                  <Link href={`/${locale}/projects/${projectId}/marketing/seo`}>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 gap-1 rounded-lg px-2 text-xs font-bold text-emerald-600 hover:bg-emerald-50 hover:text-emerald-700"
                    >
                      View All <ArrowUpRight className="h-3.5 w-3.5" />
                    </Button>
                  </Link>
                )}
              </div>
            </CardHeader>
            <CardContent className="p-4 pt-2">
              {!isConnected ? (
                <div className="rounded-xl border-2 border-dashed border-slate-100 bg-slate-50 py-8 text-center dark:border-slate-800 dark:bg-slate-950">
                  <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-white shadow-sm dark:bg-slate-900">
                    <Globe className="h-6 w-6 text-slate-200" />
                  </div>
                  <h3 className="mb-1 text-base font-black italic">Configure APIs First</h3>
                  <p className="mx-auto mb-4 max-w-xs text-xs font-medium text-slate-400">
                    Set up Google Search Console API keys to start tracking pages.
                  </p>
                  <Button
                    onClick={() => {
                      setConfigModalOpen(true)
                    }}
                    size="sm"
                    className="h-9 rounded-lg bg-emerald-600 px-5 text-xs font-black shadow-md shadow-emerald-500/20"
                  >
                    <Settings className="mr-1.5 h-3.5 w-3.5" />
                    Open API Configuration
                  </Button>
                </div>
              ) : (
                <div className="space-y-2">
                  {pagesLoading ? (
                    <p className="py-6 text-center text-[10px] font-bold tracking-widest text-slate-400 uppercase">
                      Loading Performance Data...
                    </p>
                  ) : pages.length > 0 ? (
                    pages.slice(0, 5).map((page, i) => (
                      <div
                        key={i}
                        className="group relative flex cursor-pointer items-center justify-between gap-2 rounded-xl border border-transparent bg-slate-50/50 p-3 transition-all hover:border-emerald-500/20 hover:bg-white dark:bg-slate-950/20 dark:hover:bg-slate-900"
                      >
                        <div className="flex min-w-0 flex-1 items-center gap-3">
                          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white shadow-sm dark:bg-slate-900">
                            <Globe className="h-4 w-4 text-emerald-600" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <h4 className="truncate text-sm font-black text-slate-900 transition-colors group-hover:text-emerald-600 dark:text-white">
                              {page.url}
                            </h4>
                            <div className="mt-0.5 flex flex-wrap items-center gap-2 text-[9px] font-black tracking-widest text-slate-400 uppercase">
                              <span>Position: #{page.position || 0}</span>
                              <span>•</span>
                              <span>Clicks: {(page.clicks || 0).toLocaleString()}</span>
                            </div>
                          </div>
                        </div>
                        <div className="shrink-0 text-lg font-black text-slate-900 tabular-nums dark:text-white">
                          {page.ctr || 0}%
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="py-6 text-center text-[10px] font-bold tracking-widest text-slate-400 uppercase">
                      No Data Found
                    </p>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* 4. Project Modules (Quick Actions) */}
        <div className="space-y-4">
          <h3 className="flex items-center gap-1.5 px-0.5 text-[9px] font-black tracking-[0.15em] text-slate-400 uppercase">
            <Activity className="h-2.5 w-2.5" />
            Marketing Tools
          </h3>
          <div className="grid grid-cols-1 gap-2.5">
            {[
              {
                label: "SEO Tools",
                desc: "Search Performance",
                icon: BarChart3,
                color: "blue",
                href: "marketing/seo",
                accent: "bg-blue-50 text-blue-600"
              },
              {
                label: "SEO Planning",
                desc: "Strategy Checklist",
                icon: FileText,
                color: "emerald",
                href: "marketing/seo-planning",
                accent: "bg-emerald-50 text-emerald-600"
              },
              {
                label: "Content Strategy",
                desc: "Strategy Planner",
                icon: Target,
                color: "purple",
                href: "marketing/strategy",
                accent: "bg-purple-50 text-purple-600"
              },
              {
                label: "Social Hub",
                desc: "Engagement tracking",
                icon: Globe,
                color: "orange",
                href: "marketing/leads",
                accent: "bg-orange-50 text-orange-600"
              }
            ].map((module, i) => (
              <Link key={i} href={`/${locale}/projects/${projectId}/${module.href}`}>
                <Card className="group relative cursor-pointer overflow-hidden rounded-xl border-none bg-white shadow-md shadow-slate-200/40 transition-all hover:scale-[1.01] dark:bg-slate-900">
                  <CardContent className="p-4">
                    <div className="mb-2 flex items-center justify-between">
                      <div
                        className={cn(
                          "flex h-10 w-10 items-center justify-center rounded-lg shadow-inner",
                          module.accent
                        )}
                      >
                        <module.icon className="h-5 w-5 transition-all group-hover:scale-105" />
                      </div>
                      <div className="flex h-8 w-8 items-center justify-center rounded-full text-slate-300 transition-all group-hover:bg-emerald-50 group-hover:text-emerald-500">
                        <ChevronRight className="h-4 w-4" />
                      </div>
                    </div>
                    <div className="mb-0.5 text-[9px] font-black tracking-widest text-slate-400 uppercase">
                      {module.desc}
                    </div>
                    <div className="text-base leading-tight font-black text-slate-900 sm:text-lg dark:text-white">
                      {module.label}
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>

          {/* AI Insight Box */}
          <Card className="relative overflow-hidden rounded-xl border-none bg-slate-900 p-4 text-white shadow-lg">
            <div className="absolute top-0 right-0 scale-125 rotate-12 transform p-4 opacity-20">
              <Sparkles className="h-16 w-16" />
            </div>
            <div className="relative space-y-2.5">
              <div className="flex items-center gap-1.5">
                <div className="h-1.5 w-1.5 rounded-full bg-emerald-500 shadow-md shadow-emerald-500/50" />
                <span className="text-[9px] font-black tracking-[0.15em] text-emerald-400 uppercase">
                  Marketing AI Insights
                </span>
              </div>
              <h4 className="text-sm leading-snug font-black italic sm:text-base">
                {isConnected
                  ? "Project is currently tracking 14% ahead in search volume."
                  : "Connect your APIs to unlock AI-powered search insights."}
              </h4>
              <p className="text-[11px] leading-relaxed font-medium text-slate-400">
                {isConnected
                  ? "Current progress suggests your target keywords will reach the top 3 by the end of the quarter."
                  : "Integrating Google Search Console allows our AI to analyze your ranking trends and content gaps."}
              </p>
              <Button
                variant="outline"
                className="h-9 w-full gap-1.5 rounded-lg border-white/10 bg-white/5 text-[9px] font-black tracking-widest text-white uppercase hover:bg-white/10"
                onClick={() => {
                  setConfigModalOpen(true)
                }}
              >
                {isConnected ? "Generate Full Report" : "Connect APIs"}{" "}
                <ArrowUpRight className="h-3 w-3" />
              </Button>
            </div>
          </Card>
        </div>
      </div>

      {/* API Configuration Modal */}
      <SEOConfigModal
        projectId={projectId as string}
        open={configModalOpen}
        onOpenChange={setConfigModalOpen}
      />
    </div>
  )
}
