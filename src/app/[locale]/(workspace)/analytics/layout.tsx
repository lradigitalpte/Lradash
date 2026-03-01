"use client"

import { BarChart3, Users, Zap } from "lucide-react"

import { Link, usePathname } from "@/i18n/navigation"
import { cn } from "@/lib/utils"

const tabs = [
  { href: "/analytics/projects", label: "Project & Tasks", icon: BarChart3 },
  { href: "/analytics/team", label: "Team Performance", icon: Users },
  { href: "/analytics/velocity", label: "Velocity & Boards", icon: Zap }
]

export default function AnalyticsLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()

  return (
    <div className="relative min-h-full pb-20">
      <div className="pointer-events-none absolute top-20 right-[10%] -z-10 h-[500px] w-[500px] rounded-full bg-indigo-500/5 blur-[120px]" />
      <div className="pointer-events-none absolute bottom-20 left-[5%] -z-10 h-[400px] w-[400px] rounded-full bg-violet-500/5 blur-[100px]" />

      <div className="mx-auto max-w-[1600px] px-8 pt-10 lg:px-12">
        {/* Header */}
        <div className="mb-8 flex items-center gap-5">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-600 to-violet-700 text-white shadow-lg shadow-indigo-500/20">
            <BarChart3 className="h-8 w-8 stroke-[2]" />
          </div>
          <div>
            <h1 className="text-3xl font-black tracking-tight text-slate-900 dark:text-white">
              Analytics
            </h1>
            <p className="mt-0.5 text-sm text-slate-500">
              Data-driven insights across your workspace
            </p>
          </div>
        </div>

        {/* Tab bar */}
        <div className="mb-8 flex w-fit gap-1 rounded-2xl border border-slate-200/60 bg-slate-100/60 p-1 dark:border-slate-800/60 dark:bg-slate-900/60">
          {tabs.map((tab) => {
            const active = pathname.startsWith(tab.href)
            return (
              <Link
                key={tab.href}
                href={tab.href}
                className={cn(
                  "flex items-center gap-2 rounded-xl px-5 py-2.5 text-[11px] font-black tracking-widest uppercase transition-all duration-200",
                  active
                    ? "bg-white text-indigo-600 shadow-md dark:bg-slate-800 dark:text-indigo-400"
                    : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
                )}
              >
                <tab.icon className="h-4 w-4" />
                {tab.label}
              </Link>
            )
          })}
        </div>
      </div>

      <div className="mx-auto max-w-[1600px] px-8 lg:px-12">{children}</div>
    </div>
  )
}
