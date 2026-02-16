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
  ChevronRight
} from "lucide-react"
import Link from "next/link"
import { useParams } from "next/navigation"
import { useState, useEffect } from "react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { apiClient } from "@/lib/api/client"
import { useGoogleSearchConsole } from "@/lib/hooks/useGoogleSearchConsole"
import { cn } from "@/lib/utils"

// Custom hooks for SEO data
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

        const response = await apiClient.get(
          `/api/seo/metrics?projectId=${projectId}&period=monthly&limit=1`
        )

        if (response.ok) {
          const data = await response.json()
          if (Array.isArray(data) && data.length > 0) {
            const metric = data[0]

            // Transform API data to match the UI expectations
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
        } else {
          throw new Error("Failed to fetch metrics")
        }
      } catch (err) {
        console.error("Error fetching SEO metrics:", err)
        setError(err instanceof Error ? err.message : "Failed to load metrics")
        setMetrics(null)
      } finally {
        setLoading(false)
      }
    }

    fetchMetrics()
  }, [projectId])

  return { metrics, loading, error }
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

export default function MarketingHubPage() {
  const { projectId, locale } = useParams()
  const { metrics, loading: metricsLoading } = useSEOMetrics(projectId as string)
  const { connectionStatus } = useGoogleSearchConsole(projectId as string)

  const isConnected = connectionStatus?.connected
  const seoHealth = metrics?.overview?.seoHealth || 0

  return (
    <div className="space-y-10 p-8 pb-32 font-sans">
      {/* 1. Header */}
      <div className="flex flex-col justify-between gap-8 lg:flex-row lg:items-end">
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 transform items-center justify-center rounded-2xl bg-emerald-600 text-white shadow-xl shadow-emerald-500/20 transition-all duration-500 hover:rotate-6">
              <BarChart3 className="h-6 w-6" />
            </div>
            <div>
              <Badge
                variant="outline"
                className="h-6 border-slate-200 bg-white px-2 text-[10px] font-black tracking-[0.1em] uppercase shadow-sm dark:bg-slate-900"
              >
                Marketing Hub
              </Badge>
              <div className="mt-1 flex items-center gap-2 text-[10px] font-black tracking-widest text-slate-400">
                <Activity className="h-3 w-3" />
                Real-time tracking
              </div>
            </div>
          </div>
          <h1 className="text-5xl leading-tight font-black tracking-tighter text-slate-900 dark:text-white">
            Project <span className="text-emerald-600">Growth</span>
          </h1>
          <p className="max-w-3xl text-lg leading-relaxed font-medium text-slate-500 italic">
            Monitor search authority, content performance, and lead conversion for your project in
            real-time.
          </p>
        </div>

        <div className="flex shrink-0 items-center gap-3">
          <Button
            onClick={() =>{  window.location.reload(); }}
            variant="outline"
            className="h-14 gap-2 rounded-2xl border-slate-200 bg-white px-6 font-bold transition-all hover:scale-105 dark:bg-slate-900"
          >
            <RefreshCw className="h-4 w-4" />
            Refresh
          </Button>
          <Link href={`/${locale}/projects/${projectId}/marketing/seo`}>
            <Button className="group h-14 gap-2 rounded-2xl bg-emerald-600 px-8 font-black text-white shadow-2xl shadow-emerald-500/30 transition-all hover:scale-105 hover:bg-emerald-700">
              <Settings className="h-5 w-5 transition-transform group-hover:rotate-90" />
              Configure APIs
            </Button>
          </Link>
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
                  Connect your Google Search Console account to see real-time SEO metrics and
                  insights.
                </p>
              </div>
              <Link href={`/${locale}/projects/${projectId}/marketing/seo`}>
                <Button className="gap-2 bg-amber-600 hover:bg-amber-700">
                  <Globe className="h-4 w-4" />
                  Connect Now
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      )}

      {/* 2. Stats Cards */}
      <div className="grid gap-6 pt-4 md:grid-cols-2 lg:grid-cols-4">
        {[
          {
            label: "SEO Health",
            value: metricsLoading ? "..." : `${seoHealth}%`,
            sub: "Overall score",
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
            trend: "+18%"
          },
          {
            label: "Keywords Top 3",
            value: metricsLoading ? "..." : metrics?.keywords?.top3 || 0,
            sub: "High rankings",
            icon: Target,
            color: "purple",
            trend: "+12"
          },
          {
            label: "Avg Position",
            value: metricsLoading ? "..." : `#${(metrics?.overview?.avgPosition || 0).toFixed(1)}`,
            sub: "Search ranking",
            icon: TrendingUp,
            color: "orange",
            trend: "-5.2%"
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
              <p className="mt-2 flex cursor-help items-center gap-1 text-[10px] font-bold tracking-widest text-slate-400 uppercase transition-colors group-hover:text-emerald-500">
                {stat.sub}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        {/* 3. Main Content */}
        <div className="space-y-8 lg:col-span-2">
          {/* SEO Performance Overview */}
          <Card className="overflow-hidden rounded-[2.5rem] border-none bg-white shadow-2xl shadow-slate-200/50 dark:bg-slate-900 dark:shadow-none">
            <CardHeader className="p-10 pb-4">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <CardTitle className="text-2xl font-black">SEO Performance</CardTitle>
                  <CardDescription className="text-[10px] font-black tracking-widest text-slate-400 uppercase">
                    Search visibility metrics
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
                    <span className="text-xs font-black tracking-widest text-slate-400 uppercase">
                      {seoHealth >= 80 ? "Excellent" : seoHealth >= 60 ? "Good" : "Needs Work"}
                    </span>
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
                    label: "Indexed Pages",
                    val: metrics?.technical?.indexedPages || 0,
                    color: "bg-blue-500",
                    sub: "In search index"
                  },
                  {
                    label: "Top 10 Keywords",
                    val: metrics?.keywords?.top10 || 0,
                    color: "bg-emerald-500",
                    sub: "High performing"
                  },
                  {
                    label: "Backlinks",
                    val: metrics?.backlinks?.total || 0,
                    color: "bg-purple-500",
                    sub: "Total links"
                  }
                ].map((metric, i) => (
                  <div
                    key={i}
                    className="group relative space-y-2 overflow-hidden rounded-3xl border border-slate-100 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-950/50"
                  >
                    <div className={cn("absolute top-0 bottom-0 left-0 w-1", metric.color)} />
                    <div className="mb-1 text-[10px] font-black tracking-widest text-slate-400 uppercase">
                      {metric.label}
                    </div>
                    <div className="text-2xl font-black text-slate-900 tabular-nums dark:text-white">
                      {metricsLoading ? "..." : metric.val.toLocaleString()}
                    </div>
                    <div className="truncate text-[10px] font-bold tracking-tighter text-slate-400 uppercase">
                      {metric.sub}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Traffic Sources */}
          <Card className="overflow-hidden rounded-[2.5rem] border-none bg-white shadow-2xl shadow-slate-200/50 dark:bg-slate-900 dark:shadow-none">
            <CardHeader className="p-10 pb-4">
              <div className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="text-2xl font-black">Traffic Insights</CardTitle>
                  <CardDescription className="text-[10px] font-black tracking-widest text-slate-400 uppercase">
                    Search performance breakdown
                  </CardDescription>
                </div>
                <Link href={`/${locale}/projects/${projectId}/marketing/seo`}>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="gap-2 rounded-xl font-bold text-emerald-600 hover:bg-emerald-50 hover:text-emerald-700"
                  >
                    View Details <ArrowUpRight className="h-4 w-4" />
                  </Button>
                </Link>
              </div>
            </CardHeader>
            <CardContent className="p-10 pt-6">
              <div className="space-y-6">
                {[
                  {
                    label: "Impressions",
                    value: metrics?.overview?.impressions || 0,
                    icon: Globe,
                    color: "blue"
                  },
                  {
                    label: "Clicks",
                    value: metrics?.overview?.clicks || 0,
                    icon: Target,
                    color: "emerald"
                  },
                  {
                    label: "CTR",
                    value: `${(metrics?.overview?.ctr || 0).toFixed(2)}%`,
                    icon: TrendingUp,
                    color: "purple"
                  }
                ].map((item, i) => (
                  <div
                    key={i}
                    className="flex items-center justify-between rounded-2xl border border-slate-100 bg-slate-50/50 p-6 dark:border-slate-800 dark:bg-slate-950/20"
                  >
                    <div className="flex items-center gap-4">
                      <div
                        className={cn(
                          "flex h-12 w-12 items-center justify-center rounded-2xl",
                          item.color === "blue"
                            ? "bg-blue-50 text-blue-600"
                            : item.color === "emerald"
                              ? "bg-emerald-50 text-emerald-600"
                              : "bg-purple-50 text-purple-600"
                        )}
                      >
                        <item.icon className="h-5 w-5" />
                      </div>
                      <div>
                        <p className="text-[10px] font-black tracking-widest text-slate-400 uppercase">
                          {item.label}
                        </p>
                        <p className="text-2xl font-black text-slate-900 dark:text-white">
                          {metricsLoading
                            ? "..."
                            : typeof item.value === "number"
                              ? item.value.toLocaleString()
                              : item.value}
                        </p>
                      </div>
                    </div>
                    <ChevronRight className="h-5 w-5 text-slate-300" />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* 4. Sidebar - Quick Access */}
        <div className="space-y-8">
          <h3 className="flex items-center gap-2 px-4 text-[10px] font-black tracking-[0.2em] text-slate-400 uppercase">
            <Activity className="h-3 w-3" />
            Marketing Tools
          </h3>
          <div className="grid grid-cols-1 gap-4">
            {[
              {
                label: "SEO Tools",
                desc: "Search Console",
                icon: Search,
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
                desc: "Planning Calendar",
                icon: Target,
                color: "purple",
                href: "marketing/strategy",
                accent: "bg-purple-50 text-purple-600"
              },
              {
                label: "Link Building",
                desc: "Backlink Analysis",
                icon: Link2,
                color: "orange",
                href: "marketing/hub",
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

          {/* AI Insight Card */}
          <Card className="relative overflow-hidden rounded-[2.5rem] border-none bg-slate-900 p-8 text-white shadow-2xl">
            <div className="absolute top-0 right-0 scale-150 rotate-12 transform p-8 opacity-20">
              <Sparkles className="h-24 w-24" />
            </div>
            <div className="relative space-y-4">
              <div className="flex items-center gap-2">
                <div className="h-2 w-2 rounded-full bg-emerald-500 shadow-lg shadow-emerald-500/50" />
                <span className="text-[10px] font-black tracking-[0.2em] text-emerald-400 uppercase">
                  SEO AI Insights
                </span>
              </div>
              <h4 className="text-xl leading-tight font-black italic">
                {isConnected
                  ? "Your SEO performance is improving steadily."
                  : "Connect Google Search Console to unlock AI-powered insights."}
              </h4>
              <p className="text-xs leading-relaxed font-medium text-slate-400">
                {isConnected
                  ? "Continue optimizing your content strategy and technical SEO to maintain upward momentum."
                  : "Get personalized recommendations and track your search rankings in real-time."}
              </p>
              <Link href={`/${locale}/projects/${projectId}/marketing/seo`}>
                <Button
                  variant="outline"
                  className="h-12 w-full gap-2 rounded-xl border-white/10 bg-white/5 text-[10px] font-black tracking-widest text-white uppercase hover:bg-white/10"
                >
                  {isConnected ? "View Full Report" : "Get Started"}{" "}
                  <ArrowUpRight className="h-3 w-3" />
                </Button>
              </Link>
            </div>
          </Card>
        </div>
      </div>
    </div>
  )
}
