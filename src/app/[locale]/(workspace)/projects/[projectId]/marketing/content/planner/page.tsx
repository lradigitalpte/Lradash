"use client"

import {
  Target,
  Search,
  Map,
  Layers,
  MessageSquare,
  Star,
  ChevronLeft,
  ArrowRight,
  TrendingUp,
  Plus,
  Zap,
  CheckCircle2,
  Trash2
} from "lucide-react"
import Link from "next/link"
import { useParams } from "next/navigation"
import { useState } from "react"

import { Button } from "@/components/ui/button"

export default function PlannerPage() {
  const { locale, projectId } = useParams()
  const [clusters, setClusters] = useState([
    {
      id: 1,
      name: "AI Project Management",
      subtopics: ["LLM for Tasks", "Auto-scheduling"],
      authority: 84
    },
    {
      id: 2,
      name: "Remote Team Efficiency",
      subtopics: ["Async Workflows", "Timezone Sync"],
      authority: 56
    }
  ])
  const [newTopic, setNewTopic] = useState("")

  const addTopic = () => {
    if (newTopic.trim()) {
      setClusters([
        ...clusters,
        {
          id: Date.now(),
          name: newTopic,
          subtopics: [],
          authority: 0
        }
      ])
      setNewTopic("")
    }
  }

  return (
    <div className="space-y-12 p-8 pb-20">
      {/* Header */}
      <div className="flex flex-col justify-between gap-6 md:flex-row md:items-end">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Link
              href={`/${locale}/projects/${projectId}/marketing/content`}
              className="group mr-2 flex items-center gap-2 text-[10px] font-black tracking-widest text-slate-400 uppercase transition-colors hover:text-purple-600"
            >
              <ChevronLeft className="h-3 w-3 transition-transform group-hover:-translate-x-1" />
              Content Strategy
            </Link>
            <div className="h-1 w-1 rounded-full bg-slate-300 dark:bg-slate-700" />
            <span className="text-[10px] font-bold tracking-widest text-slate-400 uppercase">
              Workspace
            </span>
          </div>
          <h1 className="text-4xl font-black tracking-tighter text-slate-900 dark:text-white">
            Cluster <span className="text-purple-600">Planner</span>
          </h1>
          <p className="max-w-lg text-xs font-medium text-slate-500 italic">
            Map out your content hierarchy and plan topic clusters for maximum domain authority.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="group relative">
            <input
              value={newTopic}
              onChange={(e) =>{  setNewTopic(e.target.value); }}
              onKeyPress={(e) => e.key === "Enter" && addTopic()}
              placeholder="New Pillar Page Topic..."
              className="h-11 w-64 rounded-xl border border-slate-200 bg-white px-6 text-xs font-bold outline-none placeholder:text-slate-400 focus:ring-2 focus:ring-purple-500/20 dark:border-slate-800 dark:bg-slate-900"
            />
            <Button
              onClick={addTopic}
              className="absolute top-1.5 right-1.5 h-8 w-8 rounded-lg bg-purple-600 p-0 text-white shadow-lg hover:bg-purple-700"
            >
              <Plus className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-12 lg:grid-cols-3">
        {/* Planner Workspace */}
        <div className="space-y-8 lg:col-span-2">
          <div className="grid grid-cols-1 gap-8">
            {clusters.map((cluster) => (
              <div
                key={cluster.id}
                className="group relative rounded-[3rem] border border-slate-100 bg-white p-8 shadow-2xl shadow-slate-200/40 dark:border-slate-800 dark:bg-slate-900 dark:shadow-none"
              >
                <div className="absolute top-8 right-8 flex items-center gap-4">
                  <div className="flex flex-col items-end">
                    <span className="text-[10px] font-black tracking-widest text-slate-400 uppercase">
                      Authority
                    </span>
                    <span className="text-lg font-black text-purple-600">{cluster.authority}%</span>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-10 w-10 rounded-2xl text-slate-300 transition-colors hover:text-rose-500"
                  >
                    <Trash2 className="h-5 w-5" />
                  </Button>
                </div>

                <div className="space-y-8">
                  <div className="flex items-center gap-4">
                    <div className="flex h-14 w-14 items-center justify-center rounded-3xl bg-purple-600 shadow-xl shadow-purple-500/30">
                      <Layers className="h-7 w-7 text-white" />
                    </div>
                    <div>
                      <h3 className="text-2xl font-black tracking-tight text-slate-900 uppercase dark:text-white">
                        {cluster.name}
                      </h3>
                      <p className="text-[10px] font-black tracking-widest text-slate-400 uppercase">
                        Pillar Page Topic
                      </p>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-black tracking-[0.2em] text-slate-400 uppercase">
                        Sub-topic Clusters
                      </span>
                      <Button
                        variant="ghost"
                        className="p-0 text-[10px] font-black text-blue-600 uppercase hover:bg-transparent"
                      >
                        + Add Sub-topic
                      </Button>
                    </div>
                    <div className="flex flex-wrap gap-3">
                      {cluster.subtopics.map((sub, i) => (
                        <div
                          key={i}
                          className="group flex items-center gap-3 rounded-2xl border border-slate-100 bg-slate-50 px-5 py-3 transition-all hover:border-purple-500/30 dark:border-slate-800 dark:bg-slate-800/50"
                        >
                          <div className="h-2 w-2 rounded-full bg-purple-500" />
                          <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                            {sub}
                          </span>
                          <ArrowRight className="h-3 w-3 text-slate-300 transition-all group-hover:translate-x-0.5 group-hover:text-purple-500" />
                        </div>
                      ))}
                      {cluster.subtopics.length === 0 && (
                        <div className="bg-dashed rounded-2xl border-2 border-slate-100 px-5 py-3 text-xs text-slate-400 italic dark:border-slate-800">
                          No sub-topics added yet...
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center justify-between rounded-3xl border border-blue-500/10 bg-blue-500/5 p-6">
                    <div className="flex items-center gap-4 text-xs font-bold text-slate-500">
                      <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                      <span>This cluster is ready for implementation.</span>
                    </div>
                    <Button className="h-10 rounded-xl bg-slate-900 text-[10px] font-black tracking-widest text-white uppercase shadow-lg transition-transform active:scale-95 dark:bg-white dark:text-slate-900">
                      Generate Content Drafts
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Intelligence Sidebar */}
        <div className="space-y-8">
          <div className="relative overflow-hidden rounded-[3rem] bg-slate-950 p-8 text-white shadow-2xl shadow-purple-900/20">
            <div className="absolute top-0 right-0 -mt-16 -mr-16 h-32 w-32 rounded-full bg-purple-500/20 blur-[40px]" />
            <div className="relative z-10 space-y-6">
              <div className="space-y-1">
                <h3 className="text-xl font-black italic">Authority Logic</h3>
                <p className="text-[10px] font-black tracking-[0.2em] text-purple-400 uppercase">
                  Internal Link Mapping
                </p>
              </div>
              <p className="text-xs leading-relaxed font-medium text-slate-400">
                Linking 3 or more sub-topics to a pillar page increases topical authority by an
                estimated **24%**.
              </p>
              <div className="space-y-4 pt-4">
                {[
                  { l: "Cluster Depth", v: "High", c: "emerald" },
                  { l: "Link Strategy", v: "Optimized", c: "blue" },
                  { l: "Keyword Density", v: "Moderate", c: "amber" }
                ].map((stat, i) => (
                  <div key={i} className="flex items-center justify-between">
                    <span className="text-[11px] font-bold tracking-wider text-slate-500 uppercase">
                      {stat.l}
                    </span>
                    <span className={cn("text-xs font-black", `text-${stat.c}-500`)}>{stat.v}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="rounded-[3rem] border border-slate-100 bg-white p-8 shadow-xl shadow-slate-200/50 dark:border-slate-800 dark:bg-slate-900 dark:shadow-none">
            <h4 className="mb-6 text-sm font-black tracking-tight text-slate-900 uppercase dark:text-white">
              Suggested Pillar Pages
            </h4>
            <div className="space-y-4">
              {[
                { name: "Resource Optimization", vol: "2.4k search/mo" },
                { name: "Kanban Best Practices", vol: "1.8k search/mo" },
                { name: "Scrum for Hybrid Teams", vol: "940 search/mo" }
              ].map((s, i) => (
                <div
                  key={i}
                  className="group flex cursor-pointer items-center justify-between rounded-2xl bg-slate-50 p-4 transition-colors hover:bg-purple-50/50 dark:bg-slate-800/50 dark:hover:bg-purple-500/5"
                >
                  <div>
                    <p className="text-xs font-black text-slate-900 dark:text-white">{s.name}</p>
                    <p className="text-[10px] font-bold tracking-tighter text-slate-400 uppercase">
                      {s.vol}
                    </p>
                  </div>
                  <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg">
                    <Plus className="h-4 w-4 text-purple-600" />
                  </Button>
                </div>
              ))}
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
