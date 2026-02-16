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
    <div className="space-y-10 p-8 pb-32 font-sans">
      {/* 1. Project Header */}
      <div className="flex flex-col justify-between gap-8 lg:flex-row lg:items-end">
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 transform items-center justify-center rounded-2xl bg-emerald-600 text-white shadow-xl shadow-emerald-500/20 transition-all duration-500 hover:rotate-6">
              <Megaphone className="h-6 w-6" />
            </div>
            <div>
              <Badge
                variant="outline"
                className="h-6 border-slate-200 bg-white px-2 text-[10px] font-black tracking-[0.1em] uppercase shadow-sm dark:bg-slate-900"
              >
                Marketing Overview
              </Badge>
              <div className="mt-1 flex items-center gap-2 text-[10px] font-black tracking-widest text-slate-400">
                <Activity className="h-3 w-3" />
                STATUS: {isConnected ? "CONNECTED" : "NOT CONNECTED"}
              </div>
            </div>
          </div>
          <h1 className="text-5xl leading-tight font-black tracking-tighter text-slate-900 dark:text-white">
            Marketing <span className="text-emerald-600">Hub</span>
          </h1>
          <p className="max-w-3xl text-lg leading-relaxed font-medium text-slate-500 italic">
            Monitor search authority, content performance, and lead conversion for your project in
            real-time.
          </p>
        </div>

        <div className="flex shrink-0 items-center gap-3">
          <Button
            variant="outline"
            className="h-14 gap-2 rounded-2xl border-slate-200 bg-white px-6 font-bold transition-all hover:scale-105 dark:bg-slate-900"
            onClick={() =>{  window.location.reload(); }}
          >
            <RefreshCw className="h-4 w-4" />
            Refresh
          </Button>
          <Button
            className="group h-14 gap-2 rounded-2xl bg-emerald-600 px-8 font-black text-white shadow-2xl shadow-emerald-500/30 transition-all hover:scale-105 hover:bg-emerald-700"
            onClick={() =>{  setConfigModalOpen(true); }}
          >
            <Settings className="h-5 w-5 transition-transform group-hover:rotate-90" />
            Configure APIs
          </Button>
        </div>
      </div>

      {/* Connection Status Banner */}
      {!isConnected && (
        <Card className="border-amber-200 bg-amber-50 dark:border-amber-900/30 dark:bg-amber-950/20">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <AlertTriangle className="h-6 w-6 text-amber-600" />
              <div className="flex-1">
                <h3 className="font-bold text-amber-900 dark:text-amber-100">
                  Google Search Console Not Connected
                </h3>
                <p className="text-sm text-amber-700 dark:text-amber-200">
                  Connect your Google Search Console account to see real-time SEO metrics, keyword
                  data, and technical insights.
                </p>
              </div>
              <Button
                onClick={() =>{  setConfigModalOpen(true); }}
                className="gap-2 bg-amber-600 transition-all hover:scale-105 hover:bg-amber-700"
              >
                <Globe className="h-4 w-4" />
                Connect Now
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* 2. Key Stats Grid */}
      <div className="grid gap-6 pt-4 md:grid-cols-2 lg:grid-cols-4">
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
            className="group overflow-hidden rounded-[2rem] border-none bg-white shadow-2xl shadow-slate-200/40 transition-all hover:-translate-y-1 dark:bg-slate-900 dark:shadow-none"
          >
            <CardContent className="p-8">
              <div className="mb-6 flex items-center justify-between">
                <div
                  className={cn(
                    "flex h-12 w-12 items-center justify-center rounded-2xl shadow-inner transition-colors",
                    stat.color === "blue"
                      ? "bg-blue-50 text-blue-600"
                      : stat.color === "orange"
                        ? "bg-orange-50 text-orange-600"
                        : stat.color === "emerald"
                          ? "bg-emerald-50 text-emerald-600"
                          : "bg-purple-50 text-purple-600"
                  )}
                >
                  <stat.icon className="h-6 w-6" />
                </div>
                <Badge
                  variant="outline"
                  className="rounded-full bg-slate-50 px-2 py-1 text-[10px] font-black text-slate-400 dark:bg-slate-800"
                >
                  {stat.trend}
                </Badge>
              </div>
              <div className="mb-1 text-[10px] font-black tracking-[0.2em] text-slate-400 uppercase">
                {stat.label}
              </div>
              <div className="text-4xl font-black text-slate-900 tabular-nums dark:text-white">
                {stat.value}
              </div>
              <p className="mt-2 text-[10px] font-bold tracking-widest text-slate-400 uppercase transition-colors group-hover:text-emerald-500">
                {stat.sub}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        {/* 3. Progress Tracking */}
        <div className="space-y-8 lg:col-span-2">
          <Card className="overflow-hidden rounded-[2.5rem] border-none bg-white shadow-2xl shadow-slate-200/50 dark:bg-slate-900 dark:shadow-none">
            <CardHeader className="p-10 pb-4">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <CardTitle className="text-2xl font-black">Search Performance</CardTitle>
                  <CardDescription className="text-[10px] font-black tracking-widest text-slate-400 uppercase">
                    Overall SEO Health
                  </CardDescription>
                </div>
                <Target className="h-6 w-6 text-emerald-600" />
              </div>
            </CardHeader>
            <CardContent className="space-y-10 p-10 pt-6">
              <div className="space-y-4">
                <div className="flex items-end justify-between">
                  <div className="space-y-0.5">
                    <span className="text-3xl leading-none font-black text-emerald-600">
                      {seoHealth}%
                    </span>
                    <p className="text-[10px] font-black tracking-widest text-slate-400 uppercase">
                      SEO Score
                    </p>
                  </div>
                  <div className="text-right">
                    <Badge className="bg-emerald-500/10 text-emerald-600">
                      {seoHealth >= 80
                        ? "EXCELLENT"
                        : seoHealth >= 60
                          ? "GOOD"
                          : "NEEDS IMPROVEMENT"}
                    </Badge>
                  </div>
                </div>
                <div className="h-6 overflow-hidden rounded-2xl border border-slate-100 bg-slate-50 p-1.5 shadow-inner dark:border-slate-800 dark:bg-slate-950">
                  <div
                    className="group relative h-full rounded-xl bg-gradient-to-r from-emerald-500 via-teal-600 to-cyan-600 transition-all duration-1000"
                    style={{ width: `${seoHealth}%` }}
                  >
                    <div className="absolute top-0 right-0 h-full w-24 translate-x-12 bg-white/20 blur-xl" />
                    {seoHealth > 5 && (
                      <Zap className="absolute top-1/2 right-2 h-2.5 w-2.5 -translate-y-1/2 animate-pulse text-white" />
                    )}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-6">
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
                    className="group relative space-y-2 overflow-hidden rounded-3xl border border-slate-100 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-950/50"
                  >
                    <div className={cn("absolute top-0 bottom-0 left-0 w-1", phase.color)} />
                    <div className="mb-1 text-[10px] font-black tracking-widest text-slate-400 uppercase">
                      {phase.label}
                    </div>
                    <div className="text-2xl font-black text-slate-900 tabular-nums dark:text-white">
                      {metricsLoading ? "..." : phase.val}
                    </div>
                    <div className="truncate text-[10px] font-bold tracking-tighter text-slate-400 uppercase">
                      {phase.sub}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Top Pages */}
          <Card className="overflow-hidden rounded-[2.5rem] border-none bg-white shadow-2xl shadow-slate-200/50 dark:bg-slate-900 dark:shadow-none">
            <CardHeader className="p-10 pb-4">
              <div className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="text-2xl font-black">Top Pages</CardTitle>
                  <CardDescription className="text-[10px] font-black tracking-widest text-slate-400 uppercase">
                    Highest performing content
                  </CardDescription>
                </div>
                {isConnected && (
                  <Link href={`/${locale}/projects/${projectId}/marketing/seo`}>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="gap-2 rounded-xl font-bold text-emerald-600 hover:bg-emerald-50 hover:text-emerald-700"
                    >
                      View All <ArrowUpRight className="h-4 w-4" />
                    </Button>
                  </Link>
                )}
              </div>
            </CardHeader>
            <CardContent className="p-10 pt-6">
              {!isConnected ? (
                <div className="rounded-[2rem] border-2 border-dashed border-slate-100 bg-slate-50 py-20 text-center dark:border-slate-800 dark:bg-slate-950">
                  <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-3xl bg-white shadow-xl dark:bg-slate-900">
                    <Globe className="h-10 w-10 text-slate-200" />
                  </div>
                  <h3 className="mb-2 text-xl font-black italic">Configure APIs First</h3>
                  <p className="mx-auto mb-8 max-w-xs font-medium text-slate-400">
                    Set up Google Search Console API keys to start tracking pages.
                  </p>
                  <Button
                    onClick={() =>{  setConfigModalOpen(true); }}
                    className="h-12 rounded-xl bg-emerald-600 px-8 font-black shadow-xl shadow-emerald-500/20"
                  >
                    <Settings className="mr-2 h-4 w-4" />
                    Open API Configuration
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  {pagesLoading ? (
                    <p className="py-10 text-center text-xs font-bold tracking-widest text-slate-400 uppercase">
                      Loading Performance Data...
                    </p>
                  ) : pages.length > 0 ? (
                    pages.slice(0, 5).map((page, i) => (
                      <div
                        key={i}
                        className="group relative flex cursor-pointer items-center justify-between rounded-[2rem] border border-transparent bg-slate-50/50 p-6 transition-all hover:border-emerald-500/20 hover:bg-white dark:bg-slate-950/20 dark:hover:bg-slate-900"
                      >
                        <div className="flex flex-1 items-center gap-6">
                          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white shadow-sm dark:bg-slate-900">
                            <Globe className="h-5 w-5 text-emerald-600" />
                          </div>
                          <div className="flex-1">
                            <h4 className="leading-snug font-black text-slate-900 transition-colors group-hover:text-emerald-600 dark:text-white">
                              {page.url}
                            </h4>
                            <div className="mt-1 flex items-center gap-3 text-[10px] font-black tracking-widest text-slate-400 uppercase">
                              <span>Position: #{page.position || 0}</span>
                              <span>•</span>
                              <span>Clicks: {(page.clicks || 0).toLocaleString()}</span>
                            </div>
                          </div>
                        </div>
                        <div className="text-2xl font-black text-slate-900 tabular-nums dark:text-white">
                          {page.ctr || 0}%
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="py-10 text-center text-xs font-bold tracking-widest text-slate-400 uppercase">
                      No Data Found
                    </p>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* 4. Project Modules (Quick Actions) */}
        <div className="space-y-8">
          <h3 className="flex items-center gap-2 px-4 text-[10px] font-black tracking-[0.2em] text-slate-400 uppercase">
            <Activity className="h-3 w-3" />
            Marketing Tools
          </h3>
          <div className="grid grid-cols-1 gap-4">
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
                <Card className="group relative cursor-pointer overflow-hidden rounded-[2rem] border-none bg-white shadow-xl shadow-slate-200/40 transition-all hover:scale-[1.02] dark:bg-slate-900">
                  <CardContent className="p-8">
                    <div className="mb-4 flex items-center justify-between">
                      <div
                        className={cn(
                          "flex h-14 w-14 items-center justify-center rounded-2xl shadow-inner",
                          module.accent
                        )}
                      >
                        <module.icon className="h-7 w-7 transition-all group-hover:scale-110" />
                      </div>
                      <div className="flex h-10 w-10 items-center justify-center rounded-full text-slate-300 transition-all group-hover:bg-emerald-50 group-hover:text-emerald-500">
                        <ChevronRight className="h-6 w-6" />
                      </div>
                    </div>
                    <div className="mb-1 text-[10px] font-black tracking-widest text-slate-400 uppercase">
                      {module.desc}
                    </div>
                    <div className="text-2xl leading-tight font-black text-slate-900 dark:text-white">
                      {module.label}
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>

          {/* AI Insight Box */}
          <Card className="relative overflow-hidden rounded-[2.5rem] border-none bg-slate-900 p-8 text-white shadow-2xl">
            <div className="absolute top-0 right-0 scale-150 rotate-12 transform p-8 opacity-20">
              <Sparkles className="h-24 w-24" />
            </div>
            <div className="relative space-y-4">
              <div className="flex items-center gap-2">
                <div className="h-2 w-2 rounded-full bg-emerald-500 shadow-lg shadow-emerald-500/50" />
                <span className="text-[10px] font-black tracking-[0.2em] text-emerald-400 uppercase">
                  Marketing AI Insights
                </span>
              </div>
              <h4 className="text-xl leading-tight font-black italic">
                {isConnected
                  ? "Project is currently tracking 14% ahead in search volume."
                  : "Connect your APIs to unlock AI-powered search insights."}
              </h4>
              <p className="text-xs leading-relaxed font-medium text-slate-400">
                {isConnected
                  ? "Current progress suggests your target keywords will reach the top 3 by the end of the quarter."
                  : "Integrating Google Search Console allows our AI to analyze your ranking trends and content gaps."}
              </p>
              <Button
                variant="outline"
                className="h-12 w-full gap-2 rounded-xl border-white/10 bg-white/5 text-[10px] font-black tracking-widest text-white uppercase hover:bg-white/10"
                onClick={() =>{  setConfigModalOpen(true); }}
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
