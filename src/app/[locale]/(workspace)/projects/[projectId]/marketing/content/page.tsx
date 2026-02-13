"use client"

import {
  BookOpen,
  Search,
  Plus,
  ChevronRight,
  MoreHorizontal,
  Target,
  BarChart2,
  Share2,
  FileText,
  Zap,
  ArrowRight,
  TrendingUp
} from "lucide-react"
import { Map } from "lucide-react"
import Link from "next/link"
import { useParams } from "next/navigation"

import { Button } from "@/components/ui/button"
import { useContentClusters } from "@/lib/hooks/useContentClusters"

export default function ContentStrategyPage() {
  const { locale, projectId } = useParams()
  const { clusters, loading } = useContentClusters(projectId as string)
  return (
    <div className="space-y-8 p-8 pb-20">
      {/* Header */}
      <div className="flex flex-col justify-between gap-6 md:flex-row md:items-end">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <div className="flex h-6 items-center justify-center rounded-md border border-purple-500/20 bg-purple-500/10 px-2">
              <span className="text-[9px] font-black tracking-[0.2em] text-purple-600 uppercase">
                Authority Builder
              </span>
            </div>
            <div className="h-1 w-1 rounded-full bg-slate-300 dark:bg-slate-700" />
            <span className="text-[10px] font-bold tracking-widest text-slate-400 uppercase">
              Strategy Planning
            </span>
          </div>
          <h1 className="text-4xl font-black tracking-tighter text-slate-900 dark:text-white">
            Content <span className="text-purple-600">Strategy</span>
          </h1>
          <p className="max-w-lg text-xs font-medium text-slate-500 italic">
            Build search authority by organizing content into topics and clusters.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Link href={`/${locale}/projects/${projectId}/marketing/content/planner`}>
            <Button className="mr-3 h-11 rounded-xl bg-slate-900 px-6 text-[11px] font-bold tracking-widest text-white uppercase shadow-lg dark:bg-white dark:text-slate-900">
              <Map className="mr-2 h-4 w-4" /> Open Interactive Planner
            </Button>
          </Link>
          <Button className="h-11 rounded-xl bg-purple-600 px-6 text-[11px] font-bold tracking-widest text-white uppercase shadow-lg shadow-purple-500/20 hover:bg-purple-700">
            Create Topic Cluster
          </Button>
        </div>
      </div>

      {/* Strategy Overview */}
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <div className="rounded-[2.5rem] border border-slate-100 bg-white p-8 shadow-2xl shadow-slate-200/40 dark:border-slate-800 dark:bg-slate-900 dark:shadow-none">
            <div className="mb-8 flex items-center justify-between">
              <div className="space-y-1">
                <h3 className="text-xl font-black text-slate-900 dark:text-white">
                  Topic Clusters
                </h3>
                <p className="text-[10px] font-black tracking-[0.2em] text-slate-400 uppercase">
                  Current Focus Areas
                </p>
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <Plus className="h-5 w-5" />
              </Button>
            </div>

            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              {[
                {
                  title: "Project Efficiency",
                  subtopics: 12,
                  authority: 84,
                  status: "Active",
                  color: "blue"
                },
                {
                  title: "Remote Work Culture",
                  subtopics: 8,
                  authority: 56,
                  status: "Building",
                  color: "purple"
                },
                {
                  title: "Agile Software Dev",
                  subtopics: 15,
                  authority: 92,
                  status: "Strong",
                  color: "emerald"
                },
                {
                  title: "SaaS Scaling",
                  subtopics: 5,
                  authority: 24,
                  status: "Planning",
                  color: "amber"
                }
              ].map((cluster, i) => (
                <div
                  key={i}
                  className="group group cursor-pointer rounded-3xl border border-slate-100 bg-slate-50 p-6 transition-all hover:border-purple-500/30 dark:border-slate-800 dark:bg-slate-800/50"
                >
                  <div className="mb-6 flex items-start justify-between">
                    <div
                      className={cn(
                        "flex h-10 w-10 transform items-center justify-center rounded-xl shadow-lg transition-transform group-hover:scale-110",
                        cluster.color === "blue"
                          ? "bg-blue-600 shadow-blue-500/20"
                          : cluster.color === "purple"
                            ? "bg-purple-600 shadow-purple-500/20"
                            : cluster.color === "emerald"
                              ? "bg-emerald-600 shadow-emerald-500/20"
                              : "bg-amber-600 shadow-amber-500/20"
                      )}
                    >
                      <Target className="h-5 w-5 text-white" />
                    </div>
                    <div
                      className={cn(
                        "rounded-lg px-2 py-1 text-[9px] font-black tracking-widest uppercase",
                        cluster.status === "Strong"
                          ? "bg-emerald-500/10 text-emerald-600"
                          : cluster.status === "Planning"
                            ? "bg-amber-500/10 text-amber-600"
                            : "bg-blue-500/10 text-blue-600"
                      )}
                    >
                      {cluster.status}
                    </div>
                  </div>
                  <h4 className="mb-1 text-base font-black text-slate-900 dark:text-white">
                    {cluster.title}
                  </h4>
                  <div className="flex items-center gap-3 text-[10px] font-bold tracking-widest text-slate-400 uppercase">
                    <span>{cluster.subtopics} Pages</span>
                    <div className="h-1 w-1 rounded-full bg-slate-300" />
                    <span>Avg. Auth {cluster.authority}%</span>
                  </div>
                  <div className="mt-4 flex items-center justify-between border-t border-slate-200/50 pt-4 dark:border-slate-700/50">
                    <div className="flex -space-x-2">
                      {[1, 2, 3].map((j) => (
                        <div
                          key={j}
                          className="h-6 w-6 rounded-full border-2 border-white bg-slate-200 dark:border-slate-900"
                        />
                      ))}
                    </div>
                    <ArrowRight className="h-4 w-4 text-slate-300 transition-colors group-hover:text-purple-600" />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Integration Status / Content Audit */}
          <div className="rounded-[2.5rem] border border-slate-100 bg-white p-8 shadow-xl shadow-slate-200/40 dark:border-slate-800 dark:bg-slate-900 dark:shadow-none">
            <div className="mb-8 flex items-center justify-between">
              <div className="space-y-1">
                <h3 className="text-xl font-black text-slate-900 dark:text-white">Content Audit</h3>
                <p className="text-[10px] font-black tracking-[0.2em] text-slate-400 uppercase">
                  Inventory Health
                </p>
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <BarChart2 className="h-5 w-5" />
              </Button>
            </div>

            <div className="space-y-4">
              {[
                {
                  title: "Project Management Checklist",
                  plays: "2,842",
                  conversions: "12%",
                  trend: "up"
                },
                {
                  title: "Ultimate Guide to Remote Work",
                  plays: "4,120",
                  conversions: "8%",
                  trend: "up"
                },
                {
                  title: "Agile Framework Comparison",
                  plays: "1,240",
                  conversions: "5%",
                  trend: "down"
                }
              ].map((item, i) => (
                <div
                  key={i}
                  className="group flex items-center justify-between rounded-2xl border border-slate-100 bg-slate-50 p-4 transition-colors hover:border-purple-500/30 dark:border-slate-800 dark:bg-slate-800/50"
                >
                  <div className="flex items-center gap-4">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white shadow-sm dark:bg-slate-900">
                      <FileText className="h-5 w-5 text-purple-600" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                        {item.title}
                      </h4>
                      <p className="mt-0.5 text-[10px] font-black tracking-widest text-slate-400 uppercase">
                        {item.plays} Views
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <p className="text-[10px] font-black text-slate-400 uppercase">Conv.</p>
                      <p className="text-sm font-black text-slate-900 dark:text-white">
                        {item.conversions}
                      </p>
                    </div>
                    <div
                      className={cn(
                        "rounded-lg p-1.5",
                        item.trend === "up"
                          ? "bg-emerald-500/10 text-emerald-600"
                          : "bg-rose-500/10 text-rose-600"
                      )}
                    >
                      <TrendingUp
                        className={cn("h-4 w-4", item.trend === "down" && "rotate-180")}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Sidebar: Discovery */}
        <div className="space-y-8">
          <div className="relative overflow-hidden rounded-[2.5rem] bg-gradient-to-br from-slate-900 to-indigo-950 p-8 text-white shadow-2xl shadow-slate-900/30">
            <div className="absolute top-0 right-0 -mt-16 -mr-16 h-32 w-32 rounded-full bg-purple-500/20 blur-[40px]" />
            <div className="relative z-10 space-y-6">
              <div className="space-y-1">
                <h3 className="text-xl font-black italic">Topic Discovery</h3>
                <p className="text-[10px] font-black tracking-[0.2em] text-purple-400 uppercase">
                  Market Intelligence
                </p>
              </div>
              <div className="relative">
                <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Enter a keyword..."
                  className="h-11 w-full rounded-xl border-none bg-white/10 pr-4 pl-10 text-xs font-bold placeholder:text-slate-500 focus:ring-2 focus:ring-purple-500/50"
                />
              </div>
              <div className="space-y-4">
                <p className="text-[10px] font-black tracking-widest text-slate-400 uppercase">
                  Trending Topics
                </p>
                {[
                  { tag: "AI Project Management", volume: "High", competition: "Med" },
                  { tag: "Remote Team Async", volume: "Med", competition: "Low" },
                  { tag: "SaaS Ops 2026", volume: "Low", competition: "Low" }
                ].map((tag, i) => (
                  <div
                    key={i}
                    className="group flex cursor-pointer items-center justify-between rounded-xl bg-white/5 p-3 transition-colors hover:bg-white/10"
                  >
                    <span className="text-[11px] font-bold transition-colors group-hover:text-purple-400">
                      {tag.tag}
                    </span>
                    <div className="flex items-center gap-2">
                      <span className="text-[9px] font-black text-slate-500 uppercase">
                        {tag.volume}
                      </span>
                      <Zap className="h-3 w-3 text-amber-500" />
                    </div>
                  </div>
                ))}
              </div>
              <Button className="h-11 w-full rounded-xl bg-white text-[10px] font-black tracking-widest text-slate-900 uppercase hover:bg-slate-100">
                Refresh Suggestions
              </Button>
            </div>
          </div>

          <div className="rounded-[2.5rem] border border-slate-100 bg-white p-8 shadow-xl shadow-slate-200/50 dark:border-slate-800 dark:bg-slate-900 dark:shadow-none">
            <h4 className="mb-6 text-sm font-black tracking-tight text-slate-900 uppercase dark:text-white">
              Strategy Health
            </h4>
            <div className="space-y-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between text-[10px] font-black tracking-widest uppercase">
                  <span className="text-slate-400">Content Consistency</span>
                  <span className="text-emerald-500">Good</span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                  <div className="h-full w-[78%] rounded-full bg-emerald-500" />
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between text-[10px] font-black tracking-widest uppercase">
                  <span className="text-slate-400">Cluster Completion</span>
                  <span className="text-blue-500">On Track</span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                  <div className="h-full w-[62%] rounded-full bg-blue-500" />
                </div>
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
