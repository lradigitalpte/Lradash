"use client"

import { Loader2, Eye, EyeOff, CheckCircle2 } from "lucide-react"
import { useState } from "react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { apiClient } from "@/lib/api/client"

interface SEOConfigModalProps {
  projectId: string
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function SEOConfigModal({ projectId, open, onOpenChange }: SEOConfigModalProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [showSecret, setShowSecret] = useState(false)
  const [googleConnected, setGoogleConnected] = useState(false)

  // Google OAuth Credentials
  const [clientId, setClientId] = useState("")
  const [clientSecret, setClientSecret] = useState("")

  const handleConnectGoogle = async () => {
    // If no credentials provided, try direct OAuth with backend-configured app
    if (!clientId && !clientSecret) {
      setLoading(true)
      setError(null)

      try {
        const response = await apiClient.get(`/api/seo/google/connect?projectId=${projectId}`)

        if (!response.ok) {
          throw new Error("Failed to get authorization URL")
        }

        const data = await response.json()

        if (data.authUrl) {
          window.location.href = data.authUrl
        } else {
          setError("Failed to initialize Google connection")
        }
      } catch (err) {
        console.error("Error connecting to Google:", err)
        setError(
          err instanceof Error ? err.message : "An error occurred while connecting to Google"
        )
      } finally {
        setLoading(false)
      }
      return
    }

    // If credentials provided, send them to backend then redirect to OAuth
    if (!clientId || !clientSecret) {
      setError("Please fill in both Client ID and Client Secret")
      return
    }

    setLoading(true)
    setError(null)
    setSuccess(false)

    try {
      // Step 1: Save the credentials
      const configResponse = await apiClient.post(`/api/seo/google/configure`, {
        projectId,
        clientId,
        clientSecret
      })

      if (!configResponse.ok) {
        const data = await configResponse.json()
        throw new Error(data.error || "Failed to save credentials")
      }

      // Step 2: Get the authorization URL
      const connectResponse = await apiClient.get(`/api/seo/google/connect?projectId=${projectId}`)

      if (!connectResponse.ok) {
        throw new Error("Failed to get authorization URL")
      }

      const connectData = await connectResponse.json()

      // Step 3: Redirect to Google OAuth
      if (connectData.authUrl) {
        window.location.href = connectData.authUrl
      } else {
        throw new Error("Failed to initialize Google OAuth")
      }
    } catch (err) {
      console.error("Error connecting to Google:", err)
      setError(err instanceof Error ? err.message : "Failed to save configuration")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-3xl">
        {/* Premium Header with Gradient */}
        <div className="relative -mx-6 -mt-6 mb-8 overflow-hidden rounded-3xl bg-linear-to-r from-blue-600 via-blue-500 to-indigo-700 p-8">
          <div className="absolute top-0 right-0 -mt-12 -mr-12 h-32 w-32 rounded-full bg-white/10 blur-2xl" />
          <div className="relative space-y-3">
            <div className="flex items-center gap-2">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/30 bg-white/20 shadow-lg backdrop-blur-xl">
                <span className="text-lg">🔐</span>
              </div>
              <span className="text-[10px] font-black tracking-[0.2em] text-blue-100 uppercase">
                Google Integration
              </span>
            </div>
            <h2 className="text-3xl font-black tracking-tighter text-white">
              Connect Search Console
            </h2>
            <p className="max-w-xl text-sm font-medium text-blue-100">
              Get real-time insights from your Google Search Console. Monitor rankings, analyze
              keywords, and improve technical SEO for any of your websites.
            </p>
          </div>
        </div>

        <div className="space-y-6 px-0">
          {/* Success Message */}
          {success && (
            <div className="flex items-start gap-4 rounded-3xl border border-emerald-200/50 bg-emerald-50/80 p-4 shadow-lg shadow-emerald-200/30 backdrop-blur-xl dark:border-emerald-500/30 dark:bg-emerald-950/20 dark:shadow-none">
              <CheckCircle2 className="mt-0.5 h-6 w-6 shrink-0 text-emerald-600" />
              <div>
                <p className="text-sm font-black text-emerald-900 dark:text-emerald-100">
                  🎉 Connected Successfully!
                </p>
                <p className="mt-1 text-xs text-emerald-700 dark:text-emerald-300">
                  Your SEO dashboard is now active and pulling real-time data from Google Search
                  Console.
                </p>
              </div>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="rounded-3xl border border-rose-200/50 bg-rose-50/80 p-4 shadow-lg shadow-rose-200/30 backdrop-blur-xl dark:border-rose-900/30 dark:bg-rose-950/20 dark:shadow-none">
              <p className="text-sm font-semibold text-rose-700 dark:text-rose-300">⚠️ {error}</p>
            </div>
          )}

          {/* Connected Badge */}
          {googleConnected && (
            <div className="inline-flex items-center gap-2 rounded-2xl border border-emerald-500/30 bg-emerald-50/80 px-4 py-2 backdrop-blur-xl dark:bg-emerald-950/30">
              <CheckCircle2 className="h-4 w-4 text-emerald-600" />
              <span className="text-xs font-black tracking-wide text-emerald-700 uppercase dark:text-emerald-300">
                Connected
              </span>
            </div>
          )}

          {/* Credentials Input Card */}
          <Card className="rounded-3xl border-slate-200/50 bg-white/80 shadow-2xl shadow-slate-200/40 backdrop-blur-xl dark:border-slate-800/50 dark:bg-slate-950/80 dark:shadow-none">
            <CardHeader className="border-b border-slate-100/50 pb-4 dark:border-slate-800/50">
              <div className="space-y-1">
                <p className="text-[10px] font-black tracking-[0.2em] text-slate-400 uppercase">
                  Step 1: Credentials (Optional)
                </p>
                <h3 className="text-2xl font-black tracking-tight">Enter Google OAuth Keys</h3>
                <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
                  Leave empty to use the default app, or paste your own OAuth credentials from
                  Google Cloud Console
                </p>
              </div>
            </CardHeader>
            <CardContent className="space-y-5 pt-6">
              {/* Client ID Field */}
              <div className="space-y-2">
                <Label htmlFor="client-id" className="text-xs font-black tracking-wider uppercase">
                  Client ID
                </Label>
                <Input
                  id="client-id"
                  placeholder="example: 123456789-abc.apps.googleusercontent.com"
                  value={clientId}
                  onChange={(e) =>{  setClientId(e.target.value); }}
                  disabled={googleConnected || loading}
                  className="rounded-2xl border-slate-200/50 bg-white/50 placeholder:text-slate-400 focus:border-blue-400 focus:ring-blue-400/20 dark:border-slate-800/50 dark:bg-slate-900/50"
                />
              </div>

              {/* Client Secret Field */}
              <div className="space-y-2">
                <Label
                  htmlFor="client-secret"
                  className="text-xs font-black tracking-wider uppercase"
                >
                  Client Secret
                </Label>
                <div className="relative">
                  <Input
                    id="client-secret"
                    type={showSecret ? "text" : "password"}
                    placeholder="example: GOCSPX-xxxxxxxxxxxx"
                    value={clientSecret}
                    onChange={(e) =>{  setClientSecret(e.target.value); }}
                    disabled={googleConnected || loading}
                    className="rounded-2xl border-slate-200/50 bg-white/50 pr-10 placeholder:text-slate-400 focus:border-blue-400 focus:ring-blue-400/20 dark:border-slate-800/50 dark:bg-slate-900/50"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() =>{  setShowSecret(!showSecret); }}
                    className="absolute top-1/2 right-1 h-8 w-8 -translate-y-1/2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
                    disabled={googleConnected || loading}
                  >
                    {showSecret ? (
                      <EyeOff className="h-4 w-4 text-slate-400" />
                    ) : (
                      <Eye className="h-4 w-4 text-slate-400" />
                    )}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Setup Instructions Card */}
          <Card className="rounded-3xl border-blue-200/50 bg-blue-50/50 shadow-lg shadow-blue-200/20 backdrop-blur-xl dark:border-blue-900/30 dark:bg-blue-950/20 dark:shadow-none">
            <CardHeader className="pb-4">
              <p className="text-[10px] font-black tracking-[0.2em] text-blue-600 uppercase dark:text-blue-400">
                Step 2: Setup Instructions (Optional)
              </p>
              <h3 className="mt-1 text-lg font-black tracking-tight">
                How to Get Your Own Credentials
              </h3>
            </CardHeader>
            <CardContent className="space-y-2 text-xs text-blue-900 dark:text-blue-100">
              <p className="font-medium text-blue-800 dark:text-blue-200">
                Only follow these steps if you want to use your own OAuth app instead of the
                default:
              </p>
              <ol className="list-inside list-decimal space-y-2">
                <li>
                  Go to{" "}
                  <a
                    href="https://console.cloud.google.com"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-bold text-blue-600 underline hover:no-underline dark:text-blue-400"
                  >
                    Google Cloud Console
                  </a>
                </li>
                <li>Create a new project or select an existing one</li>
                <li>Enable "Google Search Console API" and "Google Sheets API"</li>
                <li>
                  Go to <span className="font-bold">Credentials</span> →{" "}
                  <span className="font-bold">Create OAuth 2.0 Client ID</span>
                </li>
                <li>
                  Choose <span className="font-bold">Web application</span> as the application type
                </li>
                <li>
                  Add these <span className="font-bold">Authorized redirect URIs</span>:
                  <div className="mt-2 overflow-x-auto rounded-2xl bg-slate-900 p-3 font-mono text-xs text-slate-100">
                    <div>http://localhost:3000/api/seo/google/callback</div>
                    <div>https://lraddash.vercel.app/api/seo/google/callback</div>
                  </div>
                </li>
                <li>
                  Copy your <span className="font-bold">Client ID</span> and{" "}
                  <span className="font-bold">Client Secret</span> and paste them above
                </li>
              </ol>
            </CardContent>
          </Card>

          {/* Multi-Account Info */}
          <div className="rounded-3xl border border-emerald-200/50 bg-emerald-50/50 p-4 shadow-lg shadow-emerald-200/20 backdrop-blur-xl dark:border-emerald-900/30 dark:bg-emerald-950/20 dark:shadow-none">
            <p className="mb-2 text-xs font-bold text-emerald-900 dark:text-emerald-100">
              👥 Multiple Websites?
            </p>
            <p className="text-xs leading-relaxed text-emerald-800 dark:text-emerald-200">
              The system automatically selects the first verified website from your Google Search
              Console. If you have multiple websites and want to monitor a different one, click
              "Change" on the SEO page to reconfigure. Each project monitors exactly one website.
            </p>
          </div>

          {/* Security Info */}
          <div className="rounded-3xl border border-purple-200/50 bg-purple-50/50 p-4 shadow-lg shadow-purple-200/20 backdrop-blur-xl dark:border-purple-900/30 dark:bg-purple-950/20 dark:shadow-none">
            <p className="mb-2 text-xs font-bold text-purple-900 dark:text-purple-100">
              🔒 Security & Privacy
            </p>
            <p className="text-xs leading-relaxed text-purple-800 dark:text-purple-200">
              We only request read-only access to your Search Console data. Your credentials are
              encrypted, securely stored, and never shared with third parties.
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 border-t border-slate-100/50 pt-4 dark:border-slate-800/50">
            <Button
              onClick={() =>{  onOpenChange(false); }}
              variant="outline"
              className="h-11 flex-1 rounded-2xl text-sm font-bold"
              disabled={loading}
            >
              Cancel
            </Button>
            <Button
              onClick={handleConnectGoogle}
              className="h-11 flex-1 gap-2 rounded-2xl bg-linear-to-r from-blue-600 to-indigo-700 text-sm font-bold text-white shadow-lg shadow-blue-500/30 transition-all hover:shadow-blue-500/40 disabled:opacity-50"
              disabled={loading || googleConnected}
            >
              {loading && <Loader2 className="h-4 w-4 animate-spin" />}
              {loading ? "Redirecting to Google..." : "Connect with Google"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
