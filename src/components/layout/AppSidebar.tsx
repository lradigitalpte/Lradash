"use client"

import {
  Activity,
  BarChart3,
  CalendarDays,
  CheckSquare,
  ChevronDown,
  ChevronRight,
  ClipboardList,
  FileText,
  FolderKanban,
  Home,
  LayoutDashboard,
  Plus,
  Settings,
  Shield,
  Users
} from "lucide-react"
import { useTranslations } from "next-intl"
import { useEffect, useState } from "react"

import { Icons } from "@/components/layout/Icons"
import {
  PROJECT_SIDEBAR_BRAND_SUBTITLE,
  PROJECT_SIDEBAR_BRAND_TITLE,
  PROJECT_SIDEBAR_NAV_ITEM,
  PROJECT_SIDEBAR_SECTION_LABEL,
  PROJECT_SIDEBAR_SHELL,
  UNIFIED_SIDEBAR_SETTINGS_FOOTER
} from "@/components/layout/sidebar-nav-styles"
import { Button } from "@/components/ui/button"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
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
  SidebarRail,
  SidebarSeparator
} from "@/components/ui/sidebar"
import { useAdminAccess } from "@/hooks/useAdmin"
import { useBoards } from "@/hooks/useBoards"
import { Link, usePathname } from "@/i18n/navigation"
import { apiClient } from "@/lib/api/client"
import { cn } from "@/lib/utils"

interface NavItem {
  title: string
  href: string
  icon: React.ElementType
}

export default function AppSidebar() {
  const t = useTranslations("sidebar")
  const pathname = usePathname()
  const { myBoards, loading } = useBoards()
  const isAdmin = useAdminAccess()
  const [orgRole, setOrgRole] = useState<string | null>(null)
  const [myBoardsOpen, setMyBoardsOpen] = useState(false)

  useEffect(() => {
    let mounted = true

    apiClient
      .get("/api/auth/me")
      .then(async (response) => {
        if (!response.ok) {
          return null
        }
        return response.json()
      })
      .then((user) => {
        if (mounted) {
          setOrgRole(user?.orgRole ?? null)
        }
      })
      .catch(() => {
        if (mounted) {
          setOrgRole(null)
        }
      })

    return () => {
      mounted = false
    }
  }, [])

  const isClient = orgRole === "CLIENT"

  const primaryItems: NavItem[] = [
    { title: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
    { title: "Boards", href: "/boards", icon: Home },
    { title: "Projects", href: "/projects", icon: FolderKanban },
    { title: "Tasks", href: "/tasks", icon: CheckSquare },
    { title: "Calendar", href: "/calendar", icon: CalendarDays }
  ]

  const insightItems: NavItem[] = [
    { title: "Reports", href: "/reports", icon: FileText },
    { title: "Minutes", href: "/minutes", icon: ClipboardList },
    { title: "Monitor", href: "/monitor", icon: Activity },
    ...(isAdmin ? [{ title: "Analytics", href: "/analytics", icon: BarChart3 }] : [])
  ]

  const adminItems: NavItem[] = isAdmin
    ? [
        { title: "Team", href: "/team", icon: Users },
        { title: "Admin", href: "/admin", icon: Shield }
      ]
    : []

  const isActive = (href: string) => {
    if (href === "/boards") {
      return pathname === "/boards"
    }
    if (href === "/client") {
      return pathname === "/client" || pathname.startsWith("/client/")
    }
    return pathname === href || pathname.startsWith(`${href}/`)
  }

  if (isClient) {
    return (
      <Sidebar collapsible="icon" className={cn(PROJECT_SIDEBAR_SHELL, "text-slate-100")}>
        <SidebarHeader className="shrink-0 border-b border-slate-800/90 bg-slate-950 px-2.5 py-3">
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton
                asChild
                size="lg"
                tooltip={t("title")}
                className="h-auto min-h-[3rem] rounded-xl border border-slate-800/90 bg-slate-900/50 px-2.5 py-2.5 hover:bg-slate-900"
              >
                <Link href="/client" className="gap-3">
                  <Icons.logoMark className="size-9 shrink-0" />
                  <span className="flex min-w-0 flex-col items-start gap-1 text-left group-data-[collapsible=icon]:hidden">
                    <span className={PROJECT_SIDEBAR_BRAND_TITLE}>{t("title")}</span>
                    <span className={PROJECT_SIDEBAR_BRAND_SUBTITLE}>Client</span>
                  </span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarHeader>
        <SidebarContent className="gap-3 bg-slate-950 px-2.5 py-4">
          <SidebarGroup className="gap-1 p-0">
            <SidebarGroupLabel className={PROJECT_SIDEBAR_SECTION_LABEL}>Menu</SidebarGroupLabel>
            <SidebarMenu className="gap-2">
              <SidebarMenuItem>
                <SidebarMenuButton
                  asChild
                  isActive={isActive("/client")}
                  tooltip="Overview"
                  className={PROJECT_SIDEBAR_NAV_ITEM}
                >
                  <Link
                    href="/client"
                    className="flex w-full items-center gap-2 group-data-[collapsible=icon]:justify-center"
                  >
                    <LayoutDashboard className="shrink-0" />
                    <span className="group-data-[collapsible=icon]:hidden">Overview</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton
                  asChild
                  isActive={isActive("/settings")}
                  tooltip="Settings"
                  className={PROJECT_SIDEBAR_NAV_ITEM}
                >
                  <Link
                    href="/settings"
                    className="flex w-full items-center gap-2 group-data-[collapsible=icon]:justify-center"
                  >
                    <Settings className="shrink-0" />
                    <span className="group-data-[collapsible=icon]:hidden">Settings</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroup>
        </SidebarContent>
        <SidebarRail />
      </Sidebar>
    )
  }

  return (
    <Sidebar collapsible="icon" className={cn(PROJECT_SIDEBAR_SHELL, "text-slate-100")}>
      <SidebarHeader className="shrink-0 border-b border-slate-800/90 bg-slate-950 px-2.5 py-3">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              size="lg"
              tooltip={t("title")}
              className="h-auto min-h-[3rem] rounded-xl border border-slate-800/90 bg-slate-900/50 px-2.5 py-2.5 hover:bg-slate-900"
            >
              <Link href="/dashboard" className="gap-3">
                <Icons.logoMark className="size-9 shrink-0" />
                <span className="flex min-w-0 flex-col items-start gap-1 text-left group-data-[collapsible=icon]:hidden">
                  <span className={PROJECT_SIDEBAR_BRAND_TITLE}>{t("title")}</span>
                  <span className={PROJECT_SIDEBAR_BRAND_SUBTITLE}>Workspace</span>
                </span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent className="gap-3 bg-slate-950 px-2.5 py-4">
        <SidebarGroup className="gap-1 p-0">
          <SidebarGroupLabel className={PROJECT_SIDEBAR_SECTION_LABEL}>Workspace</SidebarGroupLabel>
          <SidebarMenu className="gap-2">
            {primaryItems.map((item) => {
              const active = isActive(item.href)
              return (
                <SidebarMenuItem key={item.href}>
                  <SidebarMenuButton
                    asChild
                    isActive={active}
                    tooltip={item.title}
                    className={PROJECT_SIDEBAR_NAV_ITEM}
                  >
                    <Link
                      href={item.href}
                      className="flex w-full items-center gap-2 group-data-[collapsible=icon]:justify-center"
                    >
                      <item.icon className="shrink-0" />
                      <span className="group-data-[collapsible=icon]:hidden">{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              )
            })}
          </SidebarMenu>
        </SidebarGroup>

        <SidebarSeparator className="mx-1 my-2 bg-slate-700/60" />

        <SidebarGroup className="gap-1 p-0">
          <SidebarGroupLabel className={PROJECT_SIDEBAR_SECTION_LABEL}>Insights</SidebarGroupLabel>
          <SidebarMenu className="gap-2">
            {insightItems.map((item) => {
              const active = isActive(item.href)
              return (
                <SidebarMenuItem key={item.href}>
                  <SidebarMenuButton
                    asChild
                    isActive={active}
                    tooltip={item.title}
                    className={PROJECT_SIDEBAR_NAV_ITEM}
                  >
                    <Link
                      href={item.href}
                      className="flex w-full items-center gap-2 group-data-[collapsible=icon]:justify-center"
                    >
                      <item.icon className="shrink-0" />
                      <span className="group-data-[collapsible=icon]:hidden">{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              )
            })}
          </SidebarMenu>
        </SidebarGroup>

        {adminItems.length > 0 && (
          <>
            <SidebarSeparator className="mx-1 my-2 bg-slate-700/60" />
            <SidebarGroup className="gap-1 p-0">
              <SidebarGroupLabel className={PROJECT_SIDEBAR_SECTION_LABEL}>Admin</SidebarGroupLabel>
              <SidebarMenu className="gap-2">
                {adminItems.map((item) => {
                  const active = isActive(item.href)
                  return (
                    <SidebarMenuItem key={item.href}>
                      <SidebarMenuButton
                        asChild
                        isActive={active}
                        tooltip={item.title}
                        className={PROJECT_SIDEBAR_NAV_ITEM}
                      >
                        <Link
                          href={item.href}
                          className="flex w-full items-center gap-2 group-data-[collapsible=icon]:justify-center"
                        >
                          <item.icon className="shrink-0" />
                          <span className="group-data-[collapsible=icon]:hidden">{item.title}</span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  )
                })}
              </SidebarMenu>
            </SidebarGroup>
          </>
        )}

        <SidebarGroup className="mt-0.5 p-0 group-data-[collapsible=icon]:hidden">
          <div className="rounded-lg border border-slate-700/80 bg-slate-900/50 p-1.5">
            <Collapsible open={myBoardsOpen} onOpenChange={setMyBoardsOpen}>
              <div className="flex items-center justify-between gap-2">
                <CollapsibleTrigger asChild>
                  <button
                    type="button"
                    className="flex flex-1 items-center gap-2 rounded-lg px-2 py-1.5 text-left text-xs font-semibold text-slate-300 transition-colors hover:bg-slate-800/80"
                  >
                    {myBoardsOpen ? (
                      <ChevronDown className="size-3.5 shrink-0 text-slate-500" />
                    ) : (
                      <ChevronRight className="size-3.5 shrink-0 text-slate-500" />
                    )}
                    {t("myBoards")}
                  </button>
                </CollapsibleTrigger>
                <Button
                  variant="ghost"
                  size="icon"
                  className="size-8 shrink-0 rounded-lg text-blue-400 hover:bg-blue-500/15"
                  asChild
                >
                  <Link href="/boards?new=true" aria-label="Create board">
                    <Plus className="size-4" />
                  </Link>
                </Button>
              </div>
              <CollapsibleContent>
                <SidebarMenu className="mt-2 gap-0.5">
                  {loading ? (
                    <div className="space-y-1.5 px-0.5 py-1">
                      {[1, 2].map((i) => (
                        <div key={i} className="h-8 animate-pulse rounded-lg bg-slate-800/60" />
                      ))}
                    </div>
                  ) : !myBoards?.length ? (
                    <p className="px-2 py-2 text-xs leading-relaxed text-slate-500">
                      No boards yet. Create one to get started.
                    </p>
                  ) : (
                    myBoards.map((board) => {
                      const boardPath = `/boards/${board._id}/projects`
                      const boardActive = pathname.includes(`/boards/${board._id}`)
                      return (
                        <SidebarMenuItem key={board._id}>
                          <SidebarMenuButton
                            asChild
                            isActive={boardActive}
                            tooltip={board.title}
                            className={cn(PROJECT_SIDEBAR_NAV_ITEM, "!min-h-8 py-2 text-[12px]")}
                          >
                            <Link
                              href={boardPath}
                              className="flex w-full min-w-0 items-center gap-2 group-data-[collapsible=icon]:justify-center"
                            >
                              <FolderKanban className="shrink-0 opacity-80" />
                              <span className="truncate group-data-[collapsible=icon]:hidden">
                                {board.title}
                              </span>
                            </Link>
                          </SidebarMenuButton>
                        </SidebarMenuItem>
                      )
                    })
                  )}
                </SidebarMenu>
              </CollapsibleContent>
            </Collapsible>
          </div>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="shrink-0 border-t border-slate-800/90 bg-slate-950 px-2.5 py-3">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              isActive={isActive("/settings")}
              tooltip="Settings"
              className={UNIFIED_SIDEBAR_SETTINGS_FOOTER}
            >
              <Link
                href="/settings"
                className="flex w-full items-center gap-3 group-data-[collapsible=icon]:justify-center"
              >
                <Settings className="shrink-0" />
                <span className="group-data-[collapsible=icon]:hidden">Settings</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}
