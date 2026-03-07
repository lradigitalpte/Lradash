"use client"

import {
  Calendar,
  MessageSquare,
  LayoutGrid,
  Users,
  Home,
  ListTodo,
  GanttChart,
  FileText,
  Settings,
  CheckSquare,
  Megaphone,
  DollarSign
} from "lucide-react"
import Link from "next/link"
import { useParams, usePathname } from "next/navigation"
import { useState, useEffect, useCallback } from "react"

import Header from "@/components/layout/Header"
import { MarketingSubSidebar } from "@/components/layout/MarketingSubSidebar"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarInset
} from "@/components/ui/sidebar"
import { apiClient } from "@/lib/api/client"
import { cn } from "@/lib/utils"

export default function ProjectLayout({ children }: { children: React.ReactNode }) {
  const params = useParams()
  const projectId = params?.projectId as string
  const locale = params?.locale as string
  const [projectTitle, setProjectTitle] = useState("Project")
  const [announcementsUnreadCount, setAnnouncementsUnreadCount] = useState(0)

  useEffect(() => {
    if (projectId) {
      fetchProjectTitle()
    }
  }, [projectId])

  const pathname = usePathname()
  const fetchUnreadCount = useCallback(async () => {
    if (!projectId) return
    try {
      const res = await apiClient.get(`/api/projects/${projectId}/announcements/unread-count`)
      if (res.ok) {
        const data = await res.json()
        setAnnouncementsUnreadCount(data.count ?? 0)
      }
    } catch {
      // ignore
    }
  }, [projectId])

  useEffect(() => {
    fetchUnreadCount()
  }, [fetchUnreadCount, pathname])

  useEffect(() => {
    const onRefresh =  async () => fetchUnreadCount()
    window.addEventListener("announcements-unread-refresh", onRefresh)
    return () =>{  window.removeEventListener("announcements-unread-refresh", onRefresh); }
  }, [fetchUnreadCount])

  const fetchProjectTitle = async () => {
    try {
      const response = await apiClient.get(`/api/projects/${projectId}`)
      if (response.ok) {
        const data = await response.json()
        setProjectTitle(data.title || "Project")
      }
    } catch (err) {
      console.error("Failed to fetch project title:", err)
    }
  }

  const navItems: { label: string; href: string; icon: typeof Home; badge?: number }[] = [
    { label: "Overview", href: `/${locale}/projects/${projectId}`, icon: Home },
    {
      label: "Work Packages",
      href: `/${locale}/projects/${projectId}/work-packages`,
      icon: ListTodo
    },
    { label: "Tasks", href: `/${locale}/projects/${projectId}/tasks`, icon: CheckSquare },
    { label: "Gantt Chart", href: `/${locale}/projects/${projectId}/gantt`, icon: GanttChart },
    { label: "Board", href: `/${locale}/projects/${projectId}/board`, icon: LayoutGrid },
    { label: "Calendar", href: `/${locale}/projects/${projectId}/calendar`, icon: Calendar },
    { label: "Team", href: `/${locale}/projects/${projectId}/team`, icon: Users },
    {
      label: "Announcements",
      href: `/${locale}/projects/${projectId}/announcements`,
      icon: MessageSquare,
      badge: announcementsUnreadCount > 0 ? announcementsUnreadCount : undefined
    },
    { label: "Marketing", href: `/${locale}/projects/${projectId}/marketing`, icon: Megaphone },
    { label: "Documents", href: `/${locale}/projects/${projectId}/documents`, icon: FileText },
    { label: "Costs", href: `/${locale}/projects/${projectId}/costs`, icon: DollarSign },
    { label: "Settings", href: `/${locale}/projects/${projectId}/settings`, icon: Settings }
  ]

  const isActive = (href: string) => {
    return pathname === href
  }

  const isMarketingMode = pathname.includes("/marketing")

  return (
    <SidebarProvider>
      <div className="flex h-screen w-full overflow-hidden bg-background font-sans">
        {/* Sidebar */}
        {!isMarketingMode ? (
          <Sidebar className="border-r border-slate-200 dark:border-slate-800">
            <SidebarHeader className="border-b border-slate-100 bg-white p-6 dark:border-slate-800/50 dark:bg-slate-900">
              <div className="flex flex-col space-y-1">
                <h2 className="truncate text-lg font-black tracking-tight text-slate-900 uppercase dark:text-white">
                  {projectTitle}
                </h2>
                <p className="text-[10px] font-black tracking-[0.2em] text-slate-400 uppercase">
                  Project Context
                </p>
              </div>
            </SidebarHeader>

            <SidebarContent className="bg-white px-3 py-6 dark:bg-slate-900">
              <SidebarMenu className="space-y-1">
                {navItems.map((item) => {
                  const Icon = item.icon
                  const active = isActive(item.href)
                  const badge = "badge" in item ? item.badge : undefined
                  return (
                    <SidebarMenuItem key={item.href}>
                      <SidebarMenuButton
                        asChild
                        isActive={active}
                        className={cn(
                          "h-11 rounded-xl px-4 transition-all duration-300",
                          active
                            ? "bg-blue-600 text-white shadow-lg shadow-blue-500/20 hover:bg-blue-700 hover:text-white"
                            : "text-slate-500 hover:bg-slate-50 hover:text-slate-900 dark:hover:bg-slate-800/50 dark:hover:text-white"
                        )}
                      >
                        <Link
                          href={item.href}
                          className="flex w-full items-center justify-between gap-2"
                        >
                          <span className="flex items-center gap-4">
                            <Icon
                              className={cn(
                                "h-5 w-5 stroke-2",
                                active ? "text-white" : "text-slate-400"
                              )}
                            />
                            <span className="text-[13px] font-bold tracking-wide">
                              {item.label}
                            </span>
                          </span>
                          {badge != null && badge > 0 && (
                            <span className="min-w-[1.25rem] rounded-full bg-amber-500 px-1.5 py-0.5 text-center text-[10px] font-black text-white">
                              {badge > 99 ? "99+" : badge}
                            </span>
                          )}
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  )
                })}
              </SidebarMenu>
            </SidebarContent>

            <SidebarFooter className="border-t border-slate-100 bg-white p-4 dark:border-slate-800/50 dark:bg-slate-900">
              <SidebarMenu>
                <SidebarMenuItem>
                  <SidebarMenuButton
                    asChild
                    className="group h-12 rounded-xl border border-red-100 bg-red-50 px-4 text-red-600 shadow-sm transition-all duration-300 hover:bg-red-600 hover:text-white dark:border-red-500/20 dark:bg-red-500/10 dark:text-red-400 dark:hover:bg-red-600 dark:hover:text-white"
                  >
                    <Link href={`/${locale}/dashboard`} className="flex items-center gap-4">
                      <Home className="h-5 w-5 stroke-[2.5] transition-transform group-hover:scale-110" />
                      <span className="text-[11px] font-black tracking-widest uppercase">
                        Go Back Home
                      </span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarFooter>
          </Sidebar>
        ) : (
          <MarketingSubSidebar />
        )}

        {/* Main Content Area */}
        <SidebarInset className="flex min-w-0 flex-1 flex-col overflow-hidden bg-[#f8fafc] dark:bg-slate-950">
          {/* Use the Main App Header */}
          <Header />

          {/* Content Wrapper */}
          <main className="relative flex-1 overflow-hidden">
            <div className="custom-scrollbar relative h-full overflow-x-hidden overflow-y-auto">
              {/* Background that covers full scrollable area */}
              <div className="absolute inset-0 -z-10 min-h-screen bg-slate-50/30 dark:bg-slate-950/30">
                {/* Background elements for premium feel */}
                <div className="pointer-events-none absolute top-0 right-0 h-125 w-125 translate-x-1/2 -translate-y-1/2 rounded-full bg-blue-500/5 blur-[120px]" />
                <div className="pointer-events-none absolute bottom-0 left-0 h-125 w-125 -translate-x-1/2 translate-y-1/2 rounded-full bg-indigo-500/5 blur-[120px]" />
              </div>
              {children}
            </div>
          </main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  )
}
