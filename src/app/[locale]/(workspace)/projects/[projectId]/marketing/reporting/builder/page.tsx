"use client"

import {
  BarChart3,
  TrendingUp,
  Layout,
  Download,
  Share2,
  Plus,
  Trash2,
  GripVertical,
  ChevronLeft,
  FileText,
  Mail,
  Copy,
  Check
} from "lucide-react"
import Link from "next/link"
import { useParams } from "next/navigation"
import { useState } from "react"

import { Button } from "@/components/ui/button"

export default function ReportBuilderPage() {
  const { locale, projectId } = useParams()
  const [selectedMetrics, setSelectedMetrics] = useState([
    { id: "traffic", name: "Total Traffic Overview", type: "Chart", color: "blue" },
    { id: "seo", name: "SEO Performance Breakdown", type: "Table", color: "emerald" }
  ])
  const [isExporting, setIsExporting] = useState(false)
  const [hasCopied, setHasCopied] = useState(false)

  const availableMetrics = [
    { id: "leads", name: "Lead Conversion Velocity", type: "Chart", color: "rose" },
    { id: "keywords", name: "Top Ranking Keywords", type: "Table", color: "amber" },
    { id: "competitors", name: "Competitor Benchmarking", type: "Comparison", color: "purple" },
    { id: "backlinks", name: "Backlink Profile Growth", type: "Chart", color: "blue" }
  ]

  const addMetric = (metric: any) => {
    if (!selectedMetrics.find((m) => m.id === metric.id)) {
      setSelectedMetrics([...selectedMetrics, metric])
    }
  }

  const removeMetric = (id: string) => {
    setSelectedMetrics(selectedMetrics.filter((m) => m.id !== id))
  }

  const handleExport = () => {
    setIsExporting(true)
    setTimeout(() =>{  setIsExporting(false); }, 3000)
  }

  const copyLink = () => {
    setHasCopied(true)
    setTimeout(() =>{  setHasCopied(false); }, 2000)
  }

  return (
    <div className="flex h-[calc(100vh-64px)] overflow-hidden bg-slate-50/50 dark:bg-slate-950/50">
      {/* Sidebar: Available Metrics */}
      <div className="custom-scrollbar z-10 w-80 space-y-8 overflow-y-auto border-r border-slate-200 bg-white p-8 shadow-xl dark:border-slate-800 dark:bg-slate-900">
        <div className="space-y-1">
          <Link
            href={`/${locale}/projects/${projectId}/marketing/performance`}
            className="group mb-4 flex items-center gap-2 text-[10px] font-black tracking-widest text-slate-400 uppercase transition-colors hover:text-blue-600"
          >
            <ChevronLeft className="h-3 w-3 transition-transform group-hover:-translate-x-1" />
            Back to Reporting
          </Link>
          <h2 className="text-xl font-black tracking-[0.05em] tracking-tight uppercase">
            Metric <span className="text-blue-600">Hub</span>
          </h2>
          <p className="text-[10px] font-black tracking-[0.2em] text-slate-400 uppercase">
            Drag items to report
          </p>
        </div>

        <div className="space-y-4">
          {availableMetrics.map((m) => (
            <div
              key={m.id}
              className="group cursor-pointer rounded-2xl border border-slate-100 bg-slate-50/50 p-4 shadow-sm transition-all hover:border-blue-500/30 hover:bg-white hover:shadow-md dark:border-slate-800 dark:bg-slate-800/20 dark:hover:bg-slate-800"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div
                    className={cn(
                      "flex h-8 w-8 items-center justify-center rounded-lg transition-transform group-active:scale-95",
                      m.color === "blue"
                        ? "bg-blue-600 shadow-blue-500/20"
                        : m.color === "emerald"
                          ? "bg-emerald-600 shadow-emerald-500/20"
                          : m.color === "rose"
                            ? "bg-rose-600 shadow-rose-500/20"
                            : m.color === "amber"
                              ? "bg-amber-600 shadow-amber-500/20"
                              : "bg-purple-600 shadow-purple-500/20"
                    )}
                  >
                    <BarChart3 className="h-4 w-4 text-white" />
                  </div>
                  <div className="space-y-0.5">
                    <p className="text-[10px] font-black tracking-widest text-slate-400 uppercase">
                      {m.type}
                    </p>
                    <p className="text-[11px] leading-tight font-bold text-slate-900 dark:text-white">
                      {m.name}
                    </p>
                  </div>
                </div>
                {!selectedMetrics.find((sm) => sm.id === m.id) && (
                  <Button
                    onClick={() =>{  addMetric(m); }}
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 rounded-lg transition-colors hover:bg-blue-600 hover:text-white"
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>

        <div className="pt-8">
          <div className="relative overflow-hidden rounded-[2rem] bg-slate-950 p-6 text-white">
            <div className="absolute top-0 right-0 -mt-12 -mr-12 h-24 w-24 rounded-full bg-blue-500/10 blur-[40px]" />
            <div className="relative z-10 space-y-3 text-center">
              <div className="mx-auto mb-2 flex h-10 w-10 items-center justify-center rounded-xl bg-white/10">
                <Mail className="h-5 w-5 text-blue-400" />
              </div>
              <p className="text-[11px] font-black tracking-widest uppercase italic">
                Stakeholder Ready
              </p>
              <p className="text-[10px] font-medium text-slate-400">
                Automatic recurring emails of this report.
              </p>
              <Button
                variant="outline"
                className="h-10 w-full rounded-xl border-white/20 text-[9px] font-black tracking-widest text-white uppercase hover:bg-white/10"
              >
                Schedule Send
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Report Canvas */}
      <div className="custom-scrollbar flex-1 overflow-y-auto bg-[radial-gradient(#e2e8f0_1px,transparent_1px)] [background-size:20px_20px] p-12 dark:bg-[radial-gradient(#1e293b_1px,transparent_1px)]">
        <div className="mx-auto max-w-4xl space-y-8">
          {/* Canvas Header */}
          <div className="mb-12 flex flex-col justify-between gap-6 md:flex-row md:items-center">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <FileText className="h-4 w-4 text-slate-400" />
                <span className="text-[10px] font-black tracking-[0.2em] text-slate-400 uppercase">
                  {projectId} / Marketing
                </span>
              </div>
              <h1 className="flex items-center gap-3 text-3xl font-black tracking-tighter text-slate-900 dark:text-white">
                Marketing <span className="text-slate-400 italic">Progress</span> Report
                <div className="h-2 w-2 animate-pulse rounded-full bg-blue-600" />
              </h1>
            </div>
            <div className="flex items-center gap-3">
              <Button
                onClick={copyLink}
                variant="outline"
                className="h-11 gap-2 rounded-xl border-slate-200 bg-white px-4 text-[11px] font-black tracking-widest uppercase dark:border-slate-800 dark:bg-slate-900"
              >
                {hasCopied ? (
                  <Check className="h-4 w-4 text-emerald-500" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
                {hasCopied ? "Copied" : "Share Link"}
              </Button>
              <Button
                onClick={handleExport}
                className="h-11 gap-2 rounded-xl bg-blue-600 px-6 text-[11px] font-black tracking-widest text-white uppercase shadow-xl shadow-blue-500/20 hover:bg-blue-700"
              >
                {isExporting ? (
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                ) : (
                  <Download className="h-4 w-4" />
                )}
                {isExporting ? "Exporting..." : "Download PDF"}
              </Button>
            </div>
          </div>

          {/* Canvas Zones */}
          <div className="space-y-6">
            {selectedMetrics.map((m) => (
              <div
                key={m.id}
                className="group relative animate-in rounded-[2.5rem] border border-slate-100 bg-white p-8 shadow-xl shadow-slate-200/40 duration-500 fade-in slide-in-from-bottom-6 dark:border-slate-800 dark:bg-slate-900 dark:shadow-none"
              >
                <div className="absolute top-4 right-4 opacity-0 transition-opacity group-hover:opacity-100">
                  <Button
                    onClick={() =>{  removeMetric(m.id); }}
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 rounded-lg text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/20"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
                <div className="absolute top-4 left-4 cursor-grab opacity-0 transition-opacity group-hover:opacity-100 active:cursor-grabbing">
                  <GripVertical className="h-4 w-4 text-slate-300" />
                </div>

                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-xl font-black tracking-tight">{m.name}</h3>
                      <p className="text-[10px] font-black tracking-widest text-slate-400 uppercase">
                        Reporting Period: Jan 01 - Jan 31
                      </p>
                    </div>
                  </div>

                  {/* Mock Visual Content */}
                  <div className="relative flex h-48 items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-slate-50 transition-colors group-hover:border-blue-500/30 dark:border-slate-700 dark:bg-slate-800/50">
                    <div className="flex flex-col items-center gap-3 text-slate-400">
                      <BarChart3 className="h-8 w-8 opacity-20" />
                      <span className="text-[10px] font-black tracking-widest uppercase">
                        Live Preview for {m.id}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ))}

            {selectedMetrics.length === 0 && (
              <div className="rounded-[2.5rem] border-2 border-dashed border-slate-200 bg-white/50 p-20 text-center dark:border-slate-800 dark:bg-slate-900/50">
                <div className="mx-auto max-w-xs space-y-4">
                  <Plus className="mx-auto h-12 w-12 text-slate-300" />
                  <h3 className="text-xl font-black text-slate-400">Your Canvas is Empty</h3>
                  <p className="text-xs leading-relaxed font-medium text-slate-400">
                    Select metrics from the sidebar to populate your progress report for
                    stakeholders.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

function cn(...inputs: any[]) {
  return inputs.filter(Boolean).join(" ")
}
