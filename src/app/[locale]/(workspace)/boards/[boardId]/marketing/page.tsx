"use client"

import { BarChart3, TrendingUp, Users } from "lucide-react"

import { Button } from "@/components/ui/button"

export default function BoardMarketingPage() {
  return (
    <div className="space-y-8 p-8">
      <div className="flex flex-col justify-between gap-6 md:flex-row md:items-end">
        <div className="space-y-2">
          <h1 className="text-4xl font-black tracking-tighter text-slate-900 dark:text-white">
            Marketing Intelligence
          </h1>
          <p className="max-w-lg text-sm font-medium text-slate-500 italic dark:text-slate-400">
            Monitor search authority and content performance.
          </p>
        </div>
        <Button className="h-11 rounded-xl bg-blue-600 px-6 font-bold text-white uppercase">
          Campaign Setup
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-4">
        {[
          { label: "Total Traffic", value: "—", icon: TrendingUp, color: "blue" },
          { label: "Search Impressions", value: "—", icon: Users, color: "emerald" },
          { label: "New Leads", value: "—", icon: Users, color: "purple" },
          { label: "Conversion Rate", value: "—", icon: BarChart3, color: "rose" }
        ].map((kpi, i) => (
          <div
            key={i}
            className="rounded-2xl border bg-white p-6 shadow-lg dark:border-slate-800 dark:bg-slate-900"
          >
            <div className="mb-4 flex items-start justify-between">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-100 text-blue-600 dark:bg-blue-900">
                <kpi.icon className="h-5 w-5" />
              </div>
            </div>
            <p className="mb-1 text-xs font-black text-slate-400 uppercase">{kpi.label}</p>
            <h3 className="text-2xl font-black">—</h3>
          </div>
        ))}
      </div>
    </div>
  )
}
