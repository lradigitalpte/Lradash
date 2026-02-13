"use client"

import {
  Users2,
  UserPlus,
  Mail,
  MessageSquare,
  Target,
  Zap,
  ArrowUpRight,
  TrendingUp,
  ChevronRight,
  MousePointer2
} from "lucide-react"

import { Button } from "@/components/ui/button"

export default function LeadsPage() {
  return (
    <div className="space-y-8 p-8 pb-20">
      {/* Header */}
      <div className="flex flex-col justify-between gap-6 md:flex-row md:items-end">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <div className="flex h-6 items-center justify-center rounded-md border border-rose-500/20 bg-rose-500/10 px-2">
              <span className="text-[9px] font-black tracking-[0.2em] text-rose-600 uppercase">
                Growth Engine
              </span>
            </div>
            <div className="h-1 w-1 rounded-full bg-slate-300 dark:bg-slate-700" />
            <span className="text-[10px] font-bold tracking-widest text-slate-400 uppercase">
              Lead Generation
            </span>
          </div>
          <h1 className="text-4xl font-black tracking-tighter text-slate-900 dark:text-white">
            Lead <span className="text-rose-600">Conversion</span>
          </h1>
          <p className="max-w-lg text-xs font-medium text-slate-500 italic">
            Track and optimize how your project content converts visitors into active leads.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button className="h-11 rounded-xl bg-rose-600 px-6 text-[11px] font-bold tracking-widest text-white uppercase shadow-lg shadow-rose-500/20 hover:bg-rose-700">
            Create Lead Flow
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        {/* Conversion Performance */}
        <div className="space-y-8 lg:col-span-2">
          <div className="rounded-[2.5rem] border border-slate-100 bg-white p-8 shadow-2xl shadow-slate-200/40 dark:border-slate-800 dark:bg-slate-900 dark:shadow-none">
            <div className="mb-8 flex items-center justify-between">
              <div className="space-y-1">
                <h3 className="text-xl font-black text-slate-900 dark:text-white">
                  Active Conversion Paths
                </h3>
                <p className="text-[10px] font-black tracking-[0.2em] text-slate-400 uppercase">
                  Forms & CTAs
                </p>
              </div>
            </div>

            <div className="space-y-4">
              {[
                {
                  name: "Newsletter Subscription",
                  type: "Form",
                  conversions: 124,
                  rate: "4.2%",
                  status: "Live"
                },
                {
                  name: "Project Template Download",
                  type: "CTA",
                  conversions: 248,
                  rate: "12.8%",
                  status: "Live"
                },
                {
                  name: "Consultation Booking",
                  type: "Popup",
                  conversions: 42,
                  rate: "1.2%",
                  status: "Paused"
                }
              ].map((path, i) => (
                <div
                  key={i}
                  className="group flex flex-col justify-between rounded-2xl border border-slate-100 bg-slate-50 p-6 transition-all hover:border-rose-500/30 md:flex-row md:items-center dark:border-slate-800 dark:bg-slate-800/50"
                >
                  <div className="mb-4 flex items-center gap-4 md:mb-0">
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white shadow-sm dark:bg-slate-900">
                      <Zap
                        className={cn(
                          "h-6 w-6",
                          path.status === "Live" ? "text-amber-500" : "text-slate-300"
                        )}
                      />
                    </div>
                    <div>
                      <h4 className="text-base font-bold text-slate-900 dark:text-white">
                        {path.name}
                      </h4>
                      <p className="mt-0.5 text-[10px] font-black tracking-widest text-slate-400 uppercase">
                        {path.type}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-8">
                    <div className="text-right">
                      <p className="text-[10px] font-black text-slate-400 uppercase">Conv.</p>
                      <p className="text-lg font-black text-slate-900 dark:text-white">
                        {path.conversions}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-[10px] font-black text-slate-400 uppercase">Rate</p>
                      <p className="text-lg font-black text-blue-600">{path.rate}</p>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="rounded-xl shadow-sm transition-transform group-hover:rotate-6 hover:bg-white active:scale-95 dark:hover:bg-slate-900"
                    >
                      <ChevronRight className="h-5 w-5 text-slate-400" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Lead Scoring Mockup */}
          <div className="relative overflow-hidden rounded-[2.5rem] bg-slate-950 p-8 text-white shadow-2xl shadow-rose-900/40">
            <div className="absolute top-0 right-0 -mt-32 -mr-32 h-64 w-64 rounded-full bg-rose-500/10 blur-[80px]" />
            <div className="relative z-10 flex flex-col items-center gap-8 md:flex-row">
              <div className="flex-1 space-y-4 text-center md:text-left">
                <h3 className="text-2xl font-black italic">Predictive Lead Scoring</h3>
                <p className="text-sm font-medium text-slate-400">
                  Our AI models analyze visitor behavior to identify high-intent leads
                  automatically.
                </p>
                <div className="flex flex-wrap justify-center gap-3 md:justify-start">
                  <div className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-2">
                    <Target className="h-4 w-4 text-rose-500" />
                    <span className="text-[10px] font-black tracking-widest uppercase">
                      Intention Engine
                    </span>
                  </div>
                  <div className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-2">
                    <Zap className="h-4 w-4 text-amber-500" />
                    <span className="text-[10px] font-black tracking-widest uppercase">
                      Activity Pulse
                    </span>
                  </div>
                </div>
              </div>
              <div className="flex shrink-0 flex-col items-center rounded-[2rem] border border-white/10 bg-white/5 p-6 backdrop-blur-xl">
                <div className="mb-1 text-4xl font-black text-rose-500">92</div>
                <div className="text-[10px] font-black tracking-[0.2em] text-slate-400 uppercase">
                  Avg. Lead Quality
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Sidebar: New Leads */}
        <div className="space-y-8">
          <div className="rounded-[2.5rem] border border-slate-100 bg-white p-8 shadow-xl shadow-slate-200/40 dark:border-slate-800 dark:bg-slate-900 dark:shadow-none">
            <h4 className="mb-6 text-sm font-black tracking-tight text-slate-900 uppercase dark:text-white">
              Recent Hot Leads
            </h4>
            <div className="space-y-4">
              {[
                { name: "Alex Rivera", company: "TechFlow Inc.", score: 98, time: "2m ago" },
                { name: "Sarah Chen", company: "GreenGrid Soft", score: 94, time: "15m ago" },
                { name: "Michael Vance", company: "FutureBase", score: 89, time: "1h ago" }
              ].map((lead, i) => (
                <div
                  key={i}
                  className="group flex cursor-pointer items-center justify-between rounded-2xl bg-slate-50 p-4 transition-colors hover:bg-rose-50/50 dark:bg-slate-800/50 dark:hover:bg-rose-500/5"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-rose-500 to-rose-600 text-xs font-black text-white shadow-lg shadow-rose-500/20">
                      {lead.name.charAt(0)}
                    </div>
                    <div>
                      <p className="text-xs font-black text-slate-900 dark:text-white">
                        {lead.name}
                      </p>
                      <p className="text-[10px] font-bold tracking-tighter text-slate-400 uppercase">
                        {lead.company}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-[11px] font-black text-emerald-600">+{lead.score}</p>
                    <p className="text-[9px] font-bold text-slate-400 uppercase">{lead.time}</p>
                  </div>
                </div>
              ))}
            </div>
            <Button
              variant="ghost"
              className="mt-6 w-full text-[10px] font-black tracking-widest text-blue-600 uppercase"
            >
              View All Leads <ArrowUpRight className="ml-1 h-3 w-3" />
            </Button>
          </div>

          <div className="relative overflow-hidden rounded-[2.5rem] bg-gradient-to-br from-slate-900 to-slate-950 p-8 text-white shadow-xl shadow-slate-900/40">
            <div className="absolute right-0 bottom-0 -mr-16 -mb-16 h-32 w-32 rounded-full bg-rose-500/10 blur-[40px]" />
            <div className="relative z-10 space-y-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/10">
                <UserPlus className="h-6 w-6 text-rose-500" />
              </div>
              <h4 className="text-lg leading-tight font-black italic">Growth Recommendations</h4>
              <p className="text-xs leading-relaxed font-medium text-slate-400">
                Your "Project Guide" CTA has 3x higher conversion on mobile. Consider prioritizing
                mobile-first layout features.
              </p>
              <Button className="h-11 w-full rounded-xl bg-rose-600 text-[10px] font-black tracking-widest text-white uppercase shadow-lg shadow-rose-500/20 hover:bg-rose-700">
                Implement Fix
              </Button>
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
