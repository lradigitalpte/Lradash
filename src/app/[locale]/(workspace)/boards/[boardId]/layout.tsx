"use client"

import { ArrowLeft, FileText, Home, ListTodo, Settings, CheckSquare } from "lucide-react"
import { useParams } from "next/navigation"
import { useState, useEffect, useCallback } from "react"

import Header from "@/components/layout/Header"
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
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarRail
} from "@/components/ui/sidebar"
import { usePathname } from "@/i18n/navigation"
import { Link } from "@/i18n/navigation"
import { apiClient } from "@/lib/api/client"
import { cn } from "@/lib/utils"

export default function BoardLayout({ children }: { children: React.ReactNode }) {
  const params = useParams()
  const boardId = Array.isArray(params?.boardId) ? params.boardId[0] : (params?.boardId!)
  const pathname = usePathname()
  const [boardTitle, setBoardTitle] = useState("Board")

  const base = `/boards/${boardId}`

  const fetchBoardData = useCallback(async () => {
    if (!boardId) {
      return
    }
    try {
      const response = await apiClient.get(`/api/boards/${boardId}`)
      if (response.ok) {
        const data = await response.json()
        setBoardTitle(data.title || "Board")
      }
    } catch (err) {
      console.error("Failed to fetch board title:", err)
    }
  }, [boardId])

  useEffect(() => {
    fetchBoardData()
  }, [fetchBoardData])

  const navItems = [
    { label: "Workspace", href: `${base}/projects`, icon: Home },
    { label: "Tasks", href: `${base}/tasks`, icon: CheckSquare },
    { label: "Work Packages", href: `${base}/work-packages`, icon: ListTodo },
    { label: "Documents", href: `${base}/documents`, icon: FileText },
    { label: "Settings", href: `${base}/settings`, icon: Settings }
  ]

  const isActive = (href: string) => pathname === href || pathname.startsWith(`${href}/`)

  return (
    <SidebarProvider>
      <div className="flex h-screen w-full overflow-hidden bg-background font-sans">
        <Sidebar collapsible="icon" className={cn(PROJECT_SIDEBAR_SHELL, "text-slate-100")}>
          <SidebarHeader className="shrink-0 space-y-3 border-b border-slate-800/90 bg-slate-950 px-2.5 py-3">
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton
                  asChild
                  size="lg"
                  tooltip={boardTitle}
                  className="h-auto min-h-[3rem] rounded-xl border border-slate-800/90 bg-slate-900/50 px-2.5 py-2.5 hover:bg-slate-900"
                >
                  <Link href={`${base}/projects`} className="gap-3">
                    <Icons.logoMark className="size-9 shrink-0" />
                    <span className="flex min-w-0 flex-col items-start gap-1 text-left group-data-[collapsible=icon]:hidden">
                      <span className={PROJECT_SIDEBAR_BRAND_TITLE}>{boardTitle}</span>
                      <span className={PROJECT_SIDEBAR_BRAND_SUBTITLE}>Board workspace</span>
                    </span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarHeader>

          <SidebarContent className="gap-3 bg-slate-950 px-2.5 py-4">
            <SidebarGroup className="gap-1 p-0">
              <SidebarGroupLabel className={PROJECT_SIDEBAR_SECTION_LABEL}>Board</SidebarGroupLabel>
              <SidebarMenu className="gap-2">
                {navItems.map((item) => {
                  const Icon = item.icon
                  const active = isActive(item.href)
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

          <SidebarFooter className="shrink-0 border-t border-slate-800/90 bg-slate-950 px-2.5 py-3">
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton
                  asChild
                  tooltip="Exit board"
                  className={cn(
                    "h-10 border font-semibold shadow-sm transition-colors",
                    "border-red-500/55 bg-red-950/50 text-red-300 hover:bg-red-900/55 hover:text-red-100",
                    "dark:border-red-500/45 dark:bg-red-950/60 dark:text-red-200 dark:hover:bg-red-900/50"
                  )}
                >
                  <Link
                    href="/boards"
                    className="flex w-full items-center gap-2 group-data-[collapsible=icon]:justify-center"
                  >
                    <ArrowLeft className="size-4 shrink-0 text-red-400" />
                    <span className="text-[11px] font-bold tracking-wide uppercase group-data-[collapsible=icon]:hidden">
                      Exit board
                    </span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarFooter>
          <SidebarRail />
        </Sidebar>

        <SidebarInset className="flex flex-col bg-slate-50/80 dark:bg-slate-950/40">
          <Header />
          <main className="flex-1 overflow-y-auto px-5 py-6 md:px-8 md:py-8">{children}</main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  )
}
