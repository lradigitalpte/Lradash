"use client"

import { LayoutDashboard, Search, BookOpen, ArrowLeft, Calendar, CheckSquare } from "lucide-react"
import { useParams } from "next/navigation"

import { Icons } from "@/components/layout/Icons"
import {
  PROJECT_SIDEBAR_BRAND_SUBTITLE,
  PROJECT_SIDEBAR_BRAND_TITLE,
  PROJECT_SIDEBAR_NAV_ITEM,
  PROJECT_SIDEBAR_SECTION_LABEL,
  PROJECT_SIDEBAR_SHELL
} from "@/components/layout/sidebar-nav-styles"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail
} from "@/components/ui/sidebar"
import { Link, usePathname } from "@/i18n/navigation"
import { cn } from "@/lib/utils"

export function MarketingSubSidebar() {
  const params = useParams()
  const projectId = params?.projectId as string
  const pathname = usePathname()

  const projectBase = `/projects/${projectId}`
  const marketingBase = `${projectBase}/marketing`

  const marketingNavItems = [
    {
      label: "Overview",
      href: marketingBase,
      icon: LayoutDashboard
    },
    {
      label: "SEO Tools",
      href: `${projectBase}/marketing/seo`,
      icon: Search
    },
    {
      label: "SEO Planning",
      href: `${projectBase}/marketing/seo-planning`,
      icon: CheckSquare
    },
    {
      label: "Strategy",
      href: `${projectBase}/marketing/content`,
      icon: BookOpen
    },
    {
      label: "Calendar",
      href: `${projectBase}/marketing/calendar`,
      icon: Calendar
    }
  ]

  const isActive = (href: string) => {
    if (href === marketingBase) {
      return pathname === marketingBase || pathname === `${marketingBase}/`
    }
    return pathname === href || pathname.startsWith(`${href}/`)
  }

  return (
    <Sidebar collapsible="icon" className={cn(PROJECT_SIDEBAR_SHELL, "text-slate-100")}>
      <SidebarHeader className="shrink-0 space-y-3 border-b border-slate-800/90 bg-slate-950 px-2.5 py-3">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              size="lg"
              tooltip="Marketing Hub"
              className="h-auto min-h-[3rem] rounded-xl border border-slate-800/90 bg-slate-900/50 px-2.5 py-2.5 hover:bg-slate-900"
            >
              <Link href={marketingBase} className="gap-3">
                <Icons.logoMark className="size-9 shrink-0" />
                <span className="flex min-w-0 flex-col items-start gap-1 text-left group-data-[collapsible=icon]:hidden">
                  <span className={PROJECT_SIDEBAR_BRAND_TITLE}>Marketing Hub</span>
                  <span className={PROJECT_SIDEBAR_BRAND_SUBTITLE}>Project Growth</span>
                </span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent className="gap-3 bg-slate-950 px-2.5 py-4">
        <SidebarGroup className="gap-1 p-0">
          <SidebarGroupLabel className={PROJECT_SIDEBAR_SECTION_LABEL}>Marketing</SidebarGroupLabel>
          <SidebarMenu className="gap-2">
            {marketingNavItems.map((item) => {
              const active = isActive(item.href)
              const Icon = item.icon
              return (
                <SidebarMenuItem key={item.href}>
                  <SidebarMenuButton
                    asChild
                    isActive={active}
                    tooltip={item.label}
                    className={PROJECT_SIDEBAR_NAV_ITEM}
                  >
                    <Link
                      href={item.href}
                      className="flex w-full items-center gap-2 group-data-[collapsible=icon]:justify-center"
                    >
                      <Icon className="shrink-0" />
                      <span className="leading-snug group-data-[collapsible=icon]:hidden">
                        {item.label}
                      </span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              )
            })}
          </SidebarMenu>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="shrink-0 space-y-3 border-t border-slate-800/90 bg-slate-950 px-2.5 py-3">
        <div className="rounded-xl border border-slate-700/80 bg-slate-900/70 p-3 text-slate-100 shadow-inner group-data-[collapsible=icon]:hidden">
          <p className="mb-1 text-[10px] font-bold tracking-[0.14em] text-slate-400 uppercase">
            SEO Health
          </p>
          <div className="mb-2 flex items-end gap-2">
            <span className="text-2xl font-bold text-white tabular-nums">94%</span>
            <span className="mb-0.5 text-[10px] font-medium text-blue-300">+4% vs last week</span>
          </div>
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-700/80">
            <div className="h-full w-[94%] rounded-full bg-gradient-to-r from-blue-500 to-indigo-400" />
          </div>
        </div>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              tooltip="Back to Project"
              className={cn(
                "h-10 border font-semibold shadow-sm transition-colors",
                "border-red-500/55 bg-red-950/50 text-red-300 hover:bg-red-900/55 hover:text-red-100",
                "dark:border-red-500/45 dark:bg-red-950/60 dark:text-red-200 dark:hover:bg-red-900/50"
              )}
            >
              <Link
                href={projectBase}
                className="flex w-full items-center gap-2 group-data-[collapsible=icon]:justify-center"
              >
                <ArrowLeft className="size-4 shrink-0 text-red-400" />
                <span className="text-[11px] font-bold tracking-wide uppercase group-data-[collapsible=icon]:hidden">
                  Back to Project
                </span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}
