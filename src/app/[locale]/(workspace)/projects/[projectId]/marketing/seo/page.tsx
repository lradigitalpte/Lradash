"use client"

import {
  Search,
  TrendingUp,
  ArrowUpRight,
  CheckCircle2,
  AlertCircle,
  Shield,
  Zap,
  RefreshCw,
  Settings,
  AlertTriangle,
  Globe,
  BarChart3,
  RotateCcw
} from "lucide-react"
import { useParams } from "next/navigation"
import { useState, useEffect } from "react"

import { SEOConfigModal } from "@/components/seo/SEOConfigModal"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { apiClient } from "@/lib/api/client"
import { cn } from "@/lib/utils"

export default function SEOPage() {
  const { projectId, boardId } = useParams()
  const id = (projectId || boardId) as string

  const [configModalOpen, setConfigModalOpen] = useState(false)
  const [syncing, setSyncing] = useState(false)
  const [loading, setLoading] = useState(true)
  const [metrics, setMetrics] = useState<any>(null)
  const [googleConnected, setGoogleConnected] = useState(false)
  const [connectionStatus, setConnectionStatus] = useState<any>(null)

  // Check Google Connection Status
  useEffect(() => {
    const checkConnection = async () => {
      try {
        const response = await apiClient.get(`/api/seo/google/connect?projectId=${id}`)
        if (response.ok) {
          const data = await response.json()
          setGoogleConnected(data.connected)
          setConnectionStatus(data)

          // If connected, fetch metrics
          if (data.connected) {
            await fetchMetrics()
          } else {
            setLoading(false)
          }
        }
      } catch (err) {
        console.error("Error checking Google connection:", err)
        setLoading(false)
      }
    }

    checkConnection()
  }, [id])

  const fetchMetrics = async () => {
    try {
      setLoading(true)
      const response = await apiClient.get(
        `/api/seo/metrics?projectId=${id}&period=monthly&limit=1`
      )
      if (response.ok) {
        const data = await response.json()
        if (Array.isArray(data) && data.length > 0) {
          setMetrics(data[0])
        }
      }
    } catch (err) {
      console.error("Error fetching metrics:", err)
    } finally {
      setLoading(false)
    }
  }

  const handleSync = async () => {
    setSyncing(true)
    try {
      const response = await apiClient.post(`/api/seo/sync`, { projectId: id })
      if (response.ok) {
        await fetchMetrics()
      }
    } catch (err) {
      console.error("Sync error:", err)
    } finally {
      setSyncing(false)
    }
  }

  const handleResetConnection = async () => {
    if (
      !confirm(
        "Are you sure you want to reset your Google connection? You'll need to re-authenticate."
      )
    ) {
      return
    }

    try {
      const response = await apiClient.delete(`/api/seo/google/connection`, { projectId: id })
      if (response.ok) {
        // Reload page to re-check connection
        window.location.reload()
      }
    } catch (err) {
      console.error("Reset connection error:", err)
      alert("Failed to reset connection. Please try again.")
    }
  }

  const calculateSEOScore = (): number => {
    if (!metrics) return 0

    let score = 0
    const weights = {
      searchConsole: 0.35,
      technical: 0.35,
      content: 0.3
    }

    // Search Console Score (0-100)
    const searchScore = Math.min(
      100,
      ((metrics.searchConsole?.averagePosition
        ? 100 - metrics.searchConsole.averagePosition * 3
        : 50) +
        (metrics.searchConsole?.averageCTR || 0) * 100) /
        2
    )

    // Technical Score (0-100)
    const technicalScore = Math.min(
      100,
      ((metrics.technical?.coreWebVitals?.good || 50) +
        (100 - (metrics.technical?.crawlErrors || 0))) /
        2
    )

    // Content Score (0-100)
    const contentScore = Math.min(
      100,
      metrics.keywords?.inTop10
        ? (metrics.keywords.inTop10 / Math.max(1, metrics.keywords.total)) * 100
        : 50
    )

    score =
      searchScore * weights.searchConsole +
      technicalScore * weights.technical +
      contentScore * weights.content

    return Math.round(score)
  }

  const seoScore = calculateSEOScore()

  return (
    <div className="space-y-8 p-8 pb-12">
      {/* Header */}
      <div className="flex flex-col justify-between gap-6 md:flex-row md:items-end">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <div className="flex h-6 items-center justify-center rounded-md border border-blue-500/20 bg-blue-500/10 px-2">
              <span className="text-[9px] font-black tracking-[0.2em] text-blue-600 uppercase">
                Search Strategy
              </span>
            </div>
            <div className="h-1 w-1 rounded-full bg-slate-300 dark:bg-slate-700" />
            <span className="text-[10px] font-bold tracking-widest text-slate-400 uppercase">
              Optimize Rankings
            </span>
          </div>
          <h1 className="text-4xl font-black tracking-tighter text-slate-900 dark:text-white">
            SEO <span className="text-blue-600">Tools</span>
          </h1>
          <p className="max-w-lg text-xs font-medium text-slate-500 italic">
            Connect Google Search Console to monitor rankings, analyze keywords, and improve
            technical SEO.
          </p>
        </div>
        <div className="flex items-center gap-3">
          {googleConnected && (
            <Button
              onClick={handleSync}
              disabled={syncing}
              variant="outline"
              className="h-11 gap-2 rounded-xl border-slate-200 bg-white px-6 font-bold transition-all hover:scale-105"
            >
              <RefreshCw className={cn("h-4 w-4", syncing && "animate-spin")} />
              {syncing ? "Syncing..." : "Sync Data"}
            </Button>
          )}
          <Button
            onClick={() =>{  setConfigModalOpen(true); }}
            className="h-11 gap-2 rounded-xl bg-blue-600 px-6 font-bold text-white shadow-lg shadow-blue-500/20 transition-all hover:scale-105 hover:bg-blue-700"
          >
            <Settings className="h-4 w-4" />
            {googleConnected ? "Reconfigure" : "Connect Google"}
          </Button>
        </div>
      </div>

      {/* Connection Status Banner */}
      {!googleConnected && (
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
                className="gap-2 bg-amber-600 hover:bg-amber-700"
              >
                <Globe className="h-4 w-4" />
                Connect Now
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Connected Website Info */}
      {googleConnected && connectionStatus?.propertyUrl && (
        <Card className="border-blue-200/50 bg-blue-50/50 dark:border-blue-900/30 dark:bg-blue-950/20">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <CheckCircle2 className="h-6 w-6 text-blue-600" />
              <div className="flex-1">
                <p className="text-xs font-bold tracking-wider text-blue-600 uppercase dark:text-blue-400">
                  Connected Website
                </p>
                <p className="mt-1 text-sm font-medium break-all text-slate-900 dark:text-white">
                  {connectionStatus.propertyUrl.replace("sc-domain:", "")}
                </p>
                {connectionStatus.lastSyncedAt && (
                  <p className="mt-1 text-xs text-blue-700 dark:text-blue-300">
                    Last synced: {new Date(connectionStatus.lastSyncedAt).toLocaleDateString()} at{" "}
                    {new Date(connectionStatus.lastSyncedAt).toLocaleTimeString()}
                  </p>
                )}
              </div>
              <div className="flex gap-2">
                <Button
                  onClick={handleResetConnection}
                  variant="outline"
                  className="gap-2"
                  size="sm"
                >
                  <RotateCcw className="h-4 w-4" />
                  Reset
                </Button>
                <Button
                  onClick={() =>{  setConfigModalOpen(true); }}
                  variant="outline"
                  className="gap-2"
                  size="sm"
                >
                  <Globe className="h-4 w-4" />
                  Change
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Main Content */}
      {!loading && googleConnected ? (
        <div className="space-y-6">
          {/* Overall SEO Score */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Overall SEO Score</CardTitle>
              <CardDescription>
                Based on search performance, technical health, and content quality
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="space-y-2">
                  <p className="text-6xl font-black text-slate-900 dark:text-white">{seoScore}</p>
                  <Badge
                    className={cn(
                      seoScore >= 80
                        ? "bg-emerald-500/10 text-emerald-600"
                        : seoScore >= 60
                          ? "bg-yellow-500/10 text-yellow-600"
                          : "bg-rose-500/10 text-rose-600"
                    )}
                  >
                    {seoScore >= 80 ? "Excellent" : seoScore >= 60 ? "Good" : "Needs Work"}
                  </Badge>
                </div>
                <div className="flex-1 space-y-4">
                  <div>
                    <div className="mb-2 flex items-center justify-between">
                      <span className="text-sm font-bold text-slate-600 dark:text-slate-400">
                        On-Page SEO
                      </span>
                      <span className="font-black">
                        {metrics?.keywords?.inTop10
                          ? Math.round(
                              (metrics.keywords.inTop10 / Math.max(1, metrics.keywords.total)) * 100
                            )
                          : 0}
                        %
                      </span>
                    </div>
                    <Progress
                      value={
                        metrics?.keywords?.inTop10
                          ? Math.round(
                              (metrics.keywords.inTop10 / Math.max(1, metrics.keywords.total)) * 100
                            )
                          : 0
                      }
                      className="h-2"
                    />
                  </div>
                  <div>
                    <div className="mb-2 flex items-center justify-between">
                      <span className="text-sm font-bold text-slate-600 dark:text-slate-400">
                        Technical SEO
                      </span>
                      <span className="font-black">
                        {metrics?.technical?.coreWebVitals?.good || 0}%
                      </span>
                    </div>
                    <Progress
                      value={metrics?.technical?.coreWebVitals?.good || 0}
                      className="h-2"
                    />
                  </div>
                  <div>
                    <div className="mb-2 flex items-center justify-between">
                      <span className="text-sm font-bold text-slate-600 dark:text-slate-400">
                        Content Quality
                      </span>
                      <span className="font-black">
                        {metrics?.conversions?.rate ? Math.round(metrics.conversions.rate) : 0}%
                      </span>
                    </div>
                    <Progress
                      value={metrics?.conversions?.rate ? Math.round(metrics.conversions.rate) : 0}
                      className="h-2"
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Key Metrics Grid */}
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardContent className="p-6">
                <p className="mb-2 text-[10px] font-black tracking-widest text-slate-400 uppercase">
                  Avg Position
                </p>
                <p className="text-3xl font-black text-slate-900 dark:text-white">
                  #{metrics?.searchConsole?.averagePosition?.toFixed(1) || "0"}
                </p>
                <p className="mt-2 text-xs text-slate-500">
                  {metrics?.searchConsole?.averagePosition < 10
                    ? "Excellent ranking"
                    : "Room for improvement"}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <p className="mb-2 text-[10px] font-black tracking-widest text-slate-400 uppercase">
                  Keywords Top 10
                </p>
                <p className="text-3xl font-black text-emerald-600">
                  {metrics?.keywords?.inTop10 || 0}
                </p>
                <p className="mt-2 text-xs text-slate-500">
                  {metrics?.keywords?.total ? `of ${metrics.keywords.total} total` : "No data"}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <p className="mb-2 text-[10px] font-black tracking-widest text-slate-400 uppercase">
                  Monthly Clicks
                </p>
                <p className="text-3xl font-black text-slate-900 dark:text-white">
                  {metrics?.searchConsole?.totalClicks?.toLocaleString() || "0"}
                </p>
                <p className="mt-2 text-xs text-emerald-600">+12% vs last month</p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <p className="mb-2 text-[10px] font-black tracking-widest text-slate-400 uppercase">
                  Impressions
                </p>
                <p className="text-3xl font-black text-slate-900 dark:text-white">
                  {metrics?.searchConsole?.totalImpressions?.toLocaleString() || "0"}
                </p>
                <p className="mt-2 text-xs text-slate-500">
                  CTR: {metrics?.searchConsole?.averageCTR?.toFixed(2)}%
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Technical SEO */}
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Technical SEO</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-bold">Indexed Pages</span>
                    <span className="text-lg font-black text-slate-900 dark:text-white">
                      {metrics?.technical?.indexedPages || 0}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-bold">Crawl Errors</span>
                    <Badge
                      className={
                        metrics?.technical?.crawlErrors === 0
                          ? "bg-emerald-500/10 text-emerald-600"
                          : "bg-rose-500/10 text-rose-600"
                      }
                    >
                      {metrics?.technical?.crawlErrors || 0}
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Core Web Vitals</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <div className="mb-2 flex items-center justify-between">
                    <span className="text-sm font-bold">Good</span>
                    <span className="font-black text-emerald-600">
                      {metrics?.technical?.coreWebVitals?.good || 0}%
                    </span>
                  </div>
                  <Progress value={metrics?.technical?.coreWebVitals?.good || 0} className="h-2" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Connected Property Info */}
          {connectionStatus?.propertyUrl && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                  Connected Property
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  {connectionStatus.propertyUrl}
                </p>
                {connectionStatus.lastSyncedAt && (
                  <p className="text-xs text-slate-500">
                    Last synced: {new Date(connectionStatus.lastSyncedAt).toLocaleString()}
                  </p>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      ) : loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="space-y-4 text-center">
            <RefreshCw className="mx-auto h-8 w-8 animate-spin text-blue-600" />
            <p className="text-slate-500">Loading SEO data...</p>
          </div>
        </div>
      ) : (
        <Card>
          <CardContent className="p-12 text-center">
            <Shield className="mx-auto mb-4 h-12 w-12 text-slate-300" />
            <h3 className="text-xl font-black">No Data Available</h3>
            <p className="mx-auto mb-6 max-w-xs text-slate-500">
              Connect your Google Search Console account to see comprehensive SEO analytics.
            </p>
          </CardContent>
        </Card>
      )}

      {/* API Configuration Modal */}
      <SEOConfigModal projectId={id} open={configModalOpen} onOpenChange={setConfigModalOpen} />
    </div>
  )
}
