"use client"

import { Loader2, Globe, Check } from "lucide-react"
import { useParams, useRouter } from "next/navigation"
import { useState, useEffect } from "react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { apiClient } from "@/lib/api/client"

export default function SelectSitePage() {
  const params = useParams()
  const router = useRouter()
  const projectId = params.projectId as string
  const locale = params.locale as string

  const [sites, setSites] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [selecting, setSelecting] = useState(false)
  const [selectedSite, setSelectedSite] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchSites = async () => {
      try {
        setLoading(true)
        setError(null)
        const response = await apiClient.get(`/api/seo/google/sites?projectId=${projectId}`)

        if (!response.ok) {
          const data = await response.json()
          throw new Error(data.error || "Failed to fetch websites")
        }

        const data = await response.json()
        setSites(data.sites || [])

        if (!data.sites || data.sites.length === 0) {
          setError(data.message || "No websites found in your Google Search Console")
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load websites")
      } finally {
        setLoading(false)
      }
    }

    if (projectId) {
      fetchSites()
    }
  }, [projectId])

  const handleSelectSite = async (siteUrl: string) => {
    setSelecting(true)
    setError(null)

    try {
      const response = await apiClient.post(`/api/seo/google/select-site`, {
        projectId,
        websiteUrl: siteUrl
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || "Failed to select website")
      }

      // Redirect to SEO page with success message
      setTimeout(() => {
        router.push(`/${locale}/projects/${projectId}/marketing/seo?google_connected=true`)
      }, 1000)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to select website")
    } finally {
      setSelecting(false)
    }
  }

  return (
    <div className="min-h-screen bg-linear-to-br from-slate-50 to-slate-100 p-6 dark:from-slate-950 dark:to-slate-900">
      <div className="mx-auto max-w-2xl space-y-6">
        {/* Header */}
        <div className="space-y-2 text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-blue-200/50 bg-blue-50/50 px-4 py-2 dark:border-blue-900/30 dark:bg-blue-950/30">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-600">
              <Globe className="h-4 w-4 text-white" />
            </div>
            <span className="text-sm font-bold text-blue-600 dark:text-blue-400">
              Select Website
            </span>
          </div>
          <h1 className="text-4xl font-black tracking-tight text-slate-900 dark:text-white">
            Choose Your Website
          </h1>
          <p className="text-slate-500 dark:text-slate-400">
            Select which website you want to monitor with SEO Tools
          </p>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="flex items-center justify-center py-12">
            <div className="space-y-4 text-center">
              <Loader2 className="mx-auto h-12 w-12 animate-spin text-blue-600" />
              <p className="text-slate-600 dark:text-slate-400">Loading your websites...</p>
            </div>
          </div>
        )}

        {/* Error State */}
        {error && !loading && (
          <Card className="border-rose-200/50 bg-rose-50/50 dark:border-rose-900/30 dark:bg-rose-950/20">
            <CardContent className="pt-6">
              <p className="text-sm text-rose-700 dark:text-rose-300">{error}</p>
              <div className="mt-4 flex gap-3">
                <Button onClick={() =>{  window.history.back(); }} variant="outline" className="flex-1">
                  Go Back
                </Button>
                <Button
                  onClick={() =>{  router.push(`/${locale}/projects/${projectId}/marketing/seo`); }}
                  className="flex-1 bg-blue-600 hover:bg-blue-700"
                >
                  Return to SEO
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Sites List */}
        {!loading && sites.length > 0 && (
          <div className="space-y-4">
            {sites.map((site) => (
              <Card
                key={site.url}
                className={`cursor-pointer border-2 transition-all ${
                  selectedSite === site.url
                    ? "border-blue-600 bg-blue-50 dark:bg-blue-950/30"
                    : "border-slate-200 hover:border-blue-300 dark:border-slate-800 dark:hover:border-blue-700"
                }`}
                onClick={() =>{  setSelectedSite(site.url); }}
              >
                <CardContent className="p-6">
                  <div className="flex items-center gap-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-linear-to-br from-blue-600 to-indigo-600 text-white">
                      <Globe className="h-6 w-6" />
                    </div>
                    <div className="flex-1">
                      <p className="font-bold break-all text-slate-900 dark:text-white">
                        {site.displayName}
                      </p>
                      <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                        {site.type === "domain" ? "Domain property" : "URL prefix property"}
                      </p>
                    </div>
                    {selectedSite === site.url && <Check className="h-6 w-6 text-blue-600" />}
                  </div>
                </CardContent>
              </Card>
            ))}

            {/* Action Buttons */}
            <div className="flex gap-3 pt-4">
              <Button
                onClick={() =>{  router.back(); }}
                variant="outline"
                className="flex-1"
                disabled={selecting}
              >
                Cancel
              </Button>
              <Button
                onClick={() => {
                  if (selectedSite) {
                    handleSelectSite(selectedSite)
                  }
                }}
                className="flex-1 gap-2 bg-blue-600 hover:bg-blue-700"
                disabled={!selectedSite || selecting}
              >
                {selecting && <Loader2 className="h-4 w-4 animate-spin" />}
                {selecting ? "Confirming..." : "Confirm Selection"}
              </Button>
            </div>
          </div>
        )}

        {/* No Sites State */}
        {!loading && sites.length === 0 && !error && (
          <Card>
            <CardContent className="py-12 text-center">
              <Globe className="mx-auto mb-4 h-16 w-16 text-slate-300 dark:text-slate-700" />
              <p className="mb-4 text-slate-600 dark:text-slate-400">
                No websites found in your Google Search Console account
              </p>
              <Button
                onClick={() =>{  router.push(`/${locale}/projects/${projectId}/marketing/seo`); }}
                className="bg-blue-600 hover:bg-blue-700"
              >
                Return to SEO
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
