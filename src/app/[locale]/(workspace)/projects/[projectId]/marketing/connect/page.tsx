"use client"

import {
  ShieldCheck,
  Search,
  ArrowRight,
  Lock,
  Globe,
  CheckCircle2,
  AlertCircle,
  ChevronLeft,
  Settings
} from "lucide-react"
import Link from "next/link"
import { useParams } from "next/navigation"
import { useState } from "react"

import { Button } from "@/components/ui/button"

export default function ConnectPage() {
  const { locale, projectId } = useParams()
  const [step, setStep] = useState(1)
  const [isConnecting, setIsConnecting] = useState(false)

  const steps = [
    { title: "Authentication", icon: Lock },
    { title: "Site Property", icon: Globe },
    { title: "Data Migration", icon: Search },
    { title: "Ready", icon: CheckCircle2 }
  ]

  const handleConnect = () => {
    setIsConnecting(true)
    setTimeout(() => {
      setIsConnecting(false)
      setStep(2)
    }, 2000)
  }

  return (
    <div className="mx-auto max-w-4xl space-y-12 p-8 pb-20">
      {/* Header */}
      <div className="space-y-4 text-center">
        <Link
          href={`/${locale}/projects/${projectId}/marketing/seo`}
          className="group mb-4 inline-flex items-center gap-2 text-[10px] font-black tracking-widest text-slate-400 uppercase transition-colors hover:text-blue-600"
        >
          <ChevronLeft className="h-3 w-3 transition-transform group-hover:-translate-x-1" />
          Back to SEO Tools
        </Link>
        <div className="flex justify-center">
          <div className="flex h-20 w-20 items-center justify-center rounded-3xl bg-blue-600 shadow-2xl shadow-blue-500/40">
            <Search className="h-10 w-10 text-white" />
          </div>
        </div>
        <h1 className="text-4xl font-black tracking-tighter text-slate-900 dark:text-white">
          Connect <span className="text-blue-600">Search Console</span>
        </h1>
        <p className="mx-auto max-w-sm text-sm font-medium text-slate-500">
          Sync your project with Google's search data to unlock AI-powered growth insights and
          real-time tracking.
        </p>
      </div>

      {/* Progress Steps */}
      <div className="relative">
        <div className="absolute top-1/2 left-0 -z-10 h-0.5 w-full -translate-y-1/2 bg-slate-100 dark:bg-slate-800" />
        <div className="flex justify-between">
          {steps.map((s, i) => (
            <div key={i} className="flex flex-col items-center gap-3">
              <div
                className={cn(
                  "flex h-10 w-10 items-center justify-center rounded-full border-2 transition-all duration-500",
                  step > i + 1
                    ? "border-emerald-500 bg-emerald-500 text-white"
                    : step === i + 1
                      ? "border-blue-600 bg-blue-600 text-white shadow-lg shadow-blue-500/20"
                      : "border-slate-200 bg-white text-slate-300 dark:border-slate-800 dark:bg-slate-900"
                )}
              >
                {step > i + 1 ? (
                  <CheckCircle2 className="h-5 w-5" />
                ) : (
                  <s.icon className="h-5 w-5" />
                )}
              </div>
              <span
                className={cn(
                  "text-[9px] font-black tracking-widest uppercase",
                  step === i + 1 ? "text-slate-900 dark:text-white" : "text-slate-400"
                )}
              >
                {s.title}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Step Content */}
      <div className="flex min-h-[400px] flex-col justify-center rounded-[3rem] border border-slate-100 bg-white p-12 shadow-2xl shadow-slate-200/40 dark:border-slate-800 dark:bg-slate-900 dark:shadow-none">
        {step === 1 && (
          <div className="animate-in space-y-8 text-center duration-500 fade-in slide-in-from-bottom-4">
            <div className="space-y-4">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-amber-50 dark:bg-amber-900/20">
                <ShieldCheck className="h-8 w-8 text-amber-600" />
              </div>
              <h2 className="text-2xl font-black tracking-tight">Authorize Project Access</h2>
              <p className="mx-auto max-w-md text-xs leading-relaxed font-medium text-slate-500">
                We need read-only access to your Search Console data to pull impressions, clicks,
                and rankings. We never modify your site settings.
              </p>
            </div>
            <Button
              onClick={handleConnect}
              disabled={isConnecting}
              className="mx-auto h-14 w-full max-w-md rounded-2xl bg-blue-600 px-10 text-xs font-black tracking-widest text-white uppercase shadow-xl shadow-blue-500/20 hover:bg-blue-700"
            >
              {isConnecting ? "Redirecting to Google..." : "Connect your Google Account"}
            </Button>
            <p className="flex items-center justify-center gap-2 text-[10px] font-bold text-slate-400">
              <Globe className="h-3 w-3" /> Secure Google OAuth 2.0 Encryption
            </p>
          </div>
        )}

        {step === 2 && (
          <div className="animate-in space-y-8 duration-500 fade-in slide-in-from-bottom-4">
            <div className="space-y-2">
              <h2 className="text-2xl font-black tracking-tight">Select Site Property</h2>
              <p className="text-xs font-medium text-slate-500">
                Which Search Console property matches this project?
              </p>
            </div>
            <div className="space-y-3">
              {[
                { url: "https://example-project.com", type: "Domain Property" },
                { url: "https://www.example-project.com", type: "URL Prefix" },
                { url: "https://blog.example-project.com", type: "URL Prefix" }
              ].map((site, i) => (
                <div
                  key={i}
                  onClick={() =>{  setStep(3); }}
                  className="group cursor-pointer rounded-2xl border border-slate-100 p-6 transition-all hover:border-blue-500/50 hover:bg-blue-500/5 dark:border-slate-800"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-50 transition-colors group-hover:bg-blue-600 group-hover:text-white dark:bg-slate-800">
                        <Globe className="h-5 w-5" />
                      </div>
                      <div className="space-y-0.5">
                        <p className="text-[10px] font-black text-slate-400 uppercase transition-colors group-hover:text-blue-600">
                          {site.type}
                        </p>
                        <p className="text-sm font-bold text-slate-900 dark:text-white">
                          {site.url}
                        </p>
                      </div>
                    </div>
                    <ArrowRight className="h-5 w-5 text-slate-300 transition-transform group-hover:translate-x-1 group-hover:text-blue-600" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="animate-in space-y-8 text-center duration-500 fade-in zoom-in">
            <div className="relative mx-auto h-24 w-24">
              <div className="absolute inset-0 rounded-full border-4 border-blue-600/10" />
              <div className="absolute inset-0 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
              <div className="absolute inset-0 flex items-center justify-center">
                <Search className="h-8 w-8 text-blue-600" />
              </div>
            </div>
            <div className="space-y-2">
              <h2 className="text-2xl font-black tracking-tight">Syncing History</h2>
              <p className="mx-auto max-w-sm text-xs font-medium text-slate-500">
                We're pulling the last 16 months of search performance data. This usually takes
                about 30 seconds.
              </p>
            </div>
            <div className="mx-auto max-w-xs space-y-2">
              <p className="text-left text-[10px] font-black tracking-widest text-blue-600 uppercase">
                Processing Queries...
              </p>
              <div className="h-2 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                <div className="h-full w-2/3 animate-pulse rounded-full bg-blue-600" />
              </div>
            </div>
            <Button
              onClick={() =>{  setStep(4); }}
              variant="ghost"
              className="text-[10px] font-black tracking-widest text-slate-400 uppercase"
            >
              Skip Wait (Mocked)
            </Button>
          </div>
        )}

        {step === 4 && (
          <div className="animate-in space-y-8 text-center duration-700 fade-in slide-in-from-bottom-4">
            <div className="space-y-4">
              <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-emerald-500 text-white shadow-2xl shadow-emerald-500/40">
                <CheckCircle2 className="h-10 w-10" />
              </div>
              <h2 className="text-3xl font-black tracking-tighter">Connection Active</h2>
              <p className="mx-auto max-w-sm text-sm font-medium text-slate-500">
                Successfully connected to **example-project.com**. Your dashboard is now alive with
                live search data.
              </p>
            </div>
            <Link href={`/${locale}/projects/${projectId}/marketing/seo`} className="block">
              <Button className="mx-auto h-14 w-full max-w-md rounded-2xl bg-emerald-600 px-10 text-xs font-black tracking-widest text-white uppercase shadow-xl shadow-emerald-500/20 hover:bg-emerald-700">
                Go to Dashboard
              </Button>
            </Link>
          </div>
        )}
      </div>

      {/* FAQ / Support */}
      <div className="grid grid-cols-1 gap-8 pt-8 md:grid-cols-2">
        <div className="flex gap-4">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-50 dark:bg-slate-800">
            <Lock className="h-5 w-5 text-slate-400" />
          </div>
          <div>
            <p className="mb-1 text-[10px] font-black tracking-widest text-slate-900 uppercase dark:text-white">
              Privacy First
            </p>
            <p className="text-xs leading-relaxed font-medium text-slate-500">
              We never store your search query data on our servers beyond what's needed for
              analysis. You can disconnect at any time.
            </p>
          </div>
        </div>
        <div className="flex gap-4">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-50 dark:bg-slate-800">
            <Settings className="h-5 w-5 text-slate-400" />
          </div>
          <div>
            <p className="mb-1 text-[10px] font-black tracking-widest text-slate-900 uppercase dark:text-white">
              Auto-Sync
            </p>
            <p className="text-xs leading-relaxed font-medium text-slate-500">
              Once connected, your project will automatically sync with Google daily at 2:00 AM UTC.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

function cn(...inputs: any[]) {
  return inputs.filter(Boolean).join(" ")
}
