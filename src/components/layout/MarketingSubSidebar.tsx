"use client"

import {
  LayoutDashboard,
  Search,
  BookOpen,
  BarChart3,
  Users2,
  ChevronRight,
  ArrowLeft
} from "lucide-react"
import Link from "next/link"
import { useParams, usePathname } from "next/navigation"

import { cn } from "@/lib/utils"

export function MarketingSubSidebar() {
  const params = useParams()
  const projectId = params?.projectId as string
  const locale = params?.locale as string
  const pathname = usePathname()

  const marketingNavItems = [
    {
      label: "Overview",
      href: `/${locale}/projects/${projectId}/marketing`,
      icon: LayoutDashboard,
      color: "text-blue-500",
      bgColor: "bg-blue-500/10"
    },
    {
      label: "SEO Tools",
      href: `/${locale}/projects/${projectId}/marketing/seo`,
      icon: Search,
      color: "text-emerald-500",
      bgColor: "bg-emerald-500/10"
    },
    {
      label: "Content Strategy",
      href: `/${locale}/projects/${projectId}/marketing/content`,
      icon: BookOpen,
      color: "text-purple-500",
      bgColor: "bg-purple-500/10"
    },
    {
      label: "Performance",
      href: `/${locale}/projects/${projectId}/marketing/performance`,
      icon: BarChart3,
      color: "text-amber-500",
      bgColor: "bg-amber-500/10"
    },
    {
      label: "Lead Gen",
      href: `/${locale}/projects/${projectId}/marketing/leads`,
      icon: Users2,
      color: "text-rose-500",
      bgColor: "bg-rose-500/10"
    }
  ]

  const isActive = (href: string) => {
    if (href.endsWith("/marketing")) {
      return pathname === href
    }
    return pathname.startsWith(href)
  }

  return (
    <div className="flex h-full w-64 flex-col overflow-hidden border-r border-slate-200/60 bg-white dark:border-slate-800/60 dark:bg-slate-950">
      <div className="border-b border-slate-100 p-6 dark:border-slate-800/50">
        <Link
          href={`/${locale}/projects/${projectId}`}
          className="group mb-6 flex items-center gap-2 text-[10px] font-black tracking-widest text-slate-400 uppercase transition-colors hover:text-blue-600"
        >
          <ArrowLeft className="h-3 w-3 transition-transform group-hover:-translate-x-1" />
          Back to Project
        </Link>
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600 shadow-lg shadow-blue-500/20">
            <Search className="h-4 w-4 text-white" />
          </div>
          <div className="flex flex-col">
            <span className="text-xs font-black tracking-widest text-slate-900 uppercase dark:text-white">
              Marketing Hub
            </span>
            <span className="text-[10px] font-bold tracking-tighter text-slate-400 uppercase">
              Project Growth
            </span>
          </div>
        </div>
      </div>

      <nav className="custom-scrollbar flex-1 space-y-1 overflow-y-auto p-4">
        {marketingNavItems.map((item) => {
          const active = isActive(item.href)
          const Icon = item.icon
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "group flex items-center justify-between rounded-xl px-4 py-3 transition-all duration-300",
                active
                  ? "border border-slate-100 bg-slate-50 shadow-sm dark:border-slate-800 dark:bg-slate-900"
                  : "hover:bg-slate-50/50 dark:hover:bg-slate-900/30"
              )}
            >
              <div className="flex items-center gap-3">
                <div
                  className={cn(
                    "flex h-8 w-8 items-center justify-center rounded-lg transition-transform duration-300 group-hover:scale-110",
                    active ? item.bgColor : "bg-slate-100 dark:bg-slate-800"
                  )}
                >
                  <Icon className={cn("h-4 w-4", active ? item.color : "text-slate-400")} />
                </div>
                <span
                  className={cn(
                    "text-[11px] font-black tracking-wider uppercase",
                    active
                      ? "text-slate-900 dark:text-white"
                      : "text-slate-500 group-hover:text-slate-700 dark:group-hover:text-slate-300"
                  )}
                >
                  {item.label}
                </span>
              </div>
              {active && <ChevronRight className="h-3 w-3 text-slate-300" />}
            </Link>
          )
        })}
      </nav>

      <div className="border-t border-slate-100 p-4 dark:border-slate-800/50">
        <div className="rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-700 p-4 text-white shadow-xl shadow-blue-500/20">
          <p className="mb-1 text-[10px] font-black tracking-widest uppercase">SEO Health</p>
          <div className="mb-2 flex items-end gap-2">
            <span className="text-2xl font-black">94%</span>
            <span className="mb-1 text-[10px] font-bold text-blue-200">+4% vs last week</span>
          </div>
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/20">
            <div className="h-full w-[94%] bg-white" />
          </div>
        </div>
      </div>
    </div>
  )
}
