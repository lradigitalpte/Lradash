"use client"

import {
  CalendarDays,
  CheckSquare,
  ChevronDown,
  ChevronRight,
  FolderKanban,
  Home,
  LayoutDashboard,
  Plus,
  Settings,
  Users,
  FileText,
  Shield,
  Activity,
  BarChart3,
  Box,
  Eye
} from "lucide-react"
import { useTranslations } from "next-intl"
import { useEffect, useState } from "react"

import { Icons } from "@/components/layout/Icons"
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
  SidebarMenuItem
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
  badge?: number
  accentColor?: string
}

interface NavGroup {
  label: string
  items: NavItem[]
}

export default function AppSidebar() {
  const t = useTranslations("sidebar")
  const pathname = usePathname()
  const { myBoards, teamBoards, loading } = useBoards()
  const isAdmin = useAdminAccess()
  const [orgRole, setOrgRole] = useState<string | null>(null)
  const [myBoardsOpen, setMyBoardsOpen] = useState(true)
  const [teamBoardsOpen, setTeamBoardsOpen] = useState(true)
  const [workspaceNavOpen, setWorkspaceNavOpen] = useState(true)
  const [insightsNavOpen, setInsightsNavOpen] = useState(true)
  const [adminNavOpen, setAdminNavOpen] = useState(true)

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

  const baseNavItems: NavItem[] = [
    { title: "Dashboard", href: "/dashboard", icon: LayoutDashboard, accentColor: "blue" },
    { title: "Workspace", href: "/boards", icon: Home, accentColor: "indigo" },
    { title: "Projects", href: "/projects", icon: FolderKanban, accentColor: "purple" },
    { title: "Tasks", href: "/tasks", icon: CheckSquare, accentColor: "emerald" },
    { title: "Calendar", href: "/calendar", icon: CalendarDays, accentColor: "orange" },
    { title: "Reports", href: "/reports", icon: FileText, accentColor: "amber" },
    { title: "Minutes", href: "/minutes", icon: FileText, accentColor: "indigo" },
    { title: "Monitor", href: "/monitor", icon: Activity, accentColor: "red" }
  ]

  const dashboardItem = baseNavItems.find((item) => item.href === "/dashboard")!
  const workspaceGroupItems = baseNavItems.filter((item) =>
    ["/boards", "/projects", "/tasks", "/calendar"].includes(item.href)
  )
  const insightsGroupItems = [
    ...baseNavItems.filter((item) => ["/reports", "/minutes", "/monitor"].includes(item.href)),
    ...(isAdmin
      ? ([
          { title: "Analytics", href: "/analytics", icon: BarChart3, accentColor: "indigo" }
        ] as NavItem[])
      : [])
  ]
  const adminGroupItems = isAdmin
    ? ([
        { title: "Team", href: "/team", icon: Users, accentColor: "rose" },
        { title: "Admin", href: "/admin", icon: Shield, accentColor: "violet" }
      ] as NavItem[])
    : []

  const mainNavGroups: Array<NavGroup | NavItem> = isClient
    ? [
        { title: "Client Portal", href: "/client", icon: Eye, accentColor: "blue" },
        {
          label: "Client",
          items: [{ title: "Settings", href: "/settings", icon: Settings, accentColor: "slate" }]
        }
      ]
    : [
        dashboardItem,
        { label: "Workspace", items: workspaceGroupItems },
        { label: "Insights", items: insightsGroupItems },
        ...(adminGroupItems.length > 0
          ? ([{ label: "Admin", items: adminGroupItems }] as NavGroup[])
          : [])
      ]

  const isActive = (href: string) => {
    if (href === "/boards") {
      return pathname === "/boards"
    }
    return pathname.startsWith(href)
  }

  return (
    <Sidebar className="border-r border-slate-200/60 bg-slate-50/50 backdrop-blur-2xl dark:border-slate-800/60 dark:bg-slate-950/50">
      <SidebarHeader className="mb-4 bg-linear-to-r from-slate-900 to-blue-950 px-3 py-3 shadow-xl">
        <Link href="/dashboard" className="group flex items-center gap-3">
          <Icons.projectLogo className="h-20 w-20 transition-transform duration-300 group-hover:scale-105" />
          <div className="flex flex-col">
            <span className="text-[10px] font-black tracking-widest text-blue-300 uppercase">
              Workspace
            </span>
          </div>
        </Link>
      </SidebarHeader>

      <SidebarContent className="px-4">
        <div className="flex-1 overflow-y-auto [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          <SidebarGroup className="py-2">
            <SidebarGroupLabel className="mb-4 px-4 text-[10px] font-black tracking-[0.2em] text-slate-400 uppercase">
              Main Menu
            </SidebarGroupLabel>
            <SidebarMenu className="space-y-1">
              {mainNavGroups.map((groupOrItem) => {
                if ("href" in groupOrItem) {
                  const item = groupOrItem
                  const active = isActive(item.href)
                  return (
                    <SidebarMenuItem key={item.href}>
                      <SidebarMenuButton
                        asChild
                        isActive={active}
                        className={cn(
                          "group/item relative h-12 overflow-hidden rounded-[1.25rem] px-4 transition-all duration-300",
                          active
                            ? "border border-slate-100 bg-white text-blue-600 shadow-xl shadow-slate-200/50 dark:border-slate-800 dark:bg-slate-900 dark:shadow-none"
                            : "text-slate-500 hover:bg-white/80 hover:text-slate-900 dark:hover:bg-slate-900/50 dark:hover:text-white"
                        )}
                      >
                        <Link href={item.href} className="flex items-center gap-4">
                          <div
                            className={cn(
                              "flex h-9 w-9 items-center justify-center rounded-xl transition-all duration-500 group-hover/item:scale-110",
                              active
                                ? "rotate-3 bg-blue-600 text-white shadow-lg shadow-blue-500/30"
                                : "bg-slate-100 text-slate-400 group-hover/item:bg-white group-hover/item:text-blue-500 dark:bg-slate-800 dark:group-hover/item:bg-slate-700"
                            )}
                          >
                            <item.icon className="h-5 w-5 stroke-[2.5]" />
                          </div>
                          <span className="mt-0.5 text-[11px] leading-none font-black tracking-widest uppercase">
                            {item.title}
                          </span>
                          {active && (
                            <div className="absolute top-0 right-0 bottom-0 w-1 rounded-full bg-blue-600" />
                          )}
                          {item.badge && (
                            <span className="ml-auto flex h-5 min-w-5 items-center justify-center rounded-lg bg-rose-500 px-1 text-[10px] font-black text-white shadow-lg shadow-rose-500/20">
                              {item.badge}
                            </span>
                          )}
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  )
                }

                const group = groupOrItem
                const groupOpen =
                  group.label === "Workspace"
                    ? workspaceNavOpen
                    : group.label === "Insights"
                      ? insightsNavOpen
                      : adminNavOpen

                const setGroupOpen =
                  group.label === "Workspace"
                    ? setWorkspaceNavOpen
                    : group.label === "Insights"
                      ? setInsightsNavOpen
                      : setAdminNavOpen

                return (
                  <SidebarMenuItem key={group.label} className="pt-2">
                    <Collapsible open={groupOpen} onOpenChange={setGroupOpen}>
                      <div className="mb-2 flex items-center justify-between px-4">
                        <CollapsibleTrigger asChild>
                          <button className="group flex items-center gap-2 text-[10px] font-black tracking-[0.2em] text-slate-400 uppercase transition-colors hover:text-blue-600">
                            <div className="flex h-5 w-5 items-center justify-center rounded-lg border border-slate-200 transition-colors group-hover:border-blue-500/50 dark:border-slate-800">
                              {groupOpen ? (
                                <ChevronDown className="h-3 w-3 stroke-3" />
                              ) : (
                                <ChevronRight className="h-3 w-3 stroke-3" />
                              )}
                            </div>
                            {group.label}
                          </button>
                        </CollapsibleTrigger>
                      </div>

                      <CollapsibleContent className="px-0">
                        <SidebarMenu className="space-y-1">
                          {group.items.map((item) => {
                            const active = isActive(item.href)
                            return (
                              <SidebarMenuItem key={item.href}>
                                <SidebarMenuButton
                                  asChild
                                  isActive={active}
                                  className={cn(
                                    "group/item relative h-12 overflow-hidden rounded-[1.25rem] px-4 transition-all duration-300",
                                    active
                                      ? "border border-slate-100 bg-white text-blue-600 shadow-xl shadow-slate-200/50 dark:border-slate-800 dark:bg-slate-900 dark:shadow-none"
                                      : "text-slate-500 hover:bg-white/80 hover:text-slate-900 dark:hover:bg-slate-900/50 dark:hover:text-white"
                                  )}
                                >
                                  <Link href={item.href} className="flex items-center gap-4">
                                    <div
                                      className={cn(
                                        "flex h-9 w-9 items-center justify-center rounded-xl transition-all duration-500 group-hover/item:scale-110",
                                        active
                                          ? "rotate-3 bg-blue-600 text-white shadow-lg shadow-blue-500/30"
                                          : "bg-slate-100 text-slate-400 group-hover/item:bg-white group-hover/item:text-blue-500 dark:bg-slate-800 dark:group-hover/item:bg-slate-700"
                                      )}
                                    >
                                      <item.icon className="h-5 w-5 stroke-[2.5]" />
                                    </div>
                                    <span className="mt-0.5 text-[11px] leading-none font-black tracking-widest uppercase">
                                      {item.title}
                                    </span>
                                    {active && (
                                      <div className="absolute top-0 right-0 bottom-0 w-1 rounded-full bg-blue-600" />
                                    )}
                                    {item.badge && (
                                      <span className="ml-auto flex h-5 min-w-5 items-center justify-center rounded-lg bg-rose-500 px-1 text-[10px] font-black text-white shadow-lg shadow-rose-500/20">
                                        {item.badge}
                                      </span>
                                    )}
                                  </Link>
                                </SidebarMenuButton>
                              </SidebarMenuItem>
                            )
                          })}
                        </SidebarMenu>
                      </CollapsibleContent>
                    </Collapsible>
                  </SidebarMenuItem>
                )
              })}
            </SidebarMenu>
          </SidebarGroup>

          {!isClient && (
            <SidebarGroup className="py-6">
              <Collapsible open={myBoardsOpen} onOpenChange={setMyBoardsOpen}>
                <div className="mb-4 flex items-center justify-between px-4">
                  <CollapsibleTrigger asChild>
                    <button className="group flex items-center gap-2 text-[10px] font-black tracking-[0.2em] text-slate-400 uppercase transition-colors hover:text-blue-600">
                      <div className="flex h-5 w-5 items-center justify-center rounded-lg border border-slate-200 transition-colors group-hover:border-blue-500/50 dark:border-slate-800">
                        {myBoardsOpen ? (
                          <ChevronDown className="h-3 w-3 stroke-3" />
                        ) : (
                          <ChevronRight className="h-3 w-3 stroke-3" />
                        )}
                      </div>
                      {t("myBoards")}
                    </button>
                  </CollapsibleTrigger>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 rounded-xl border border-blue-500/10 bg-blue-500/5 text-blue-600 shadow-sm transition-all hover:bg-blue-500 hover:text-white"
                    asChild
                  >
                    <Link href="/boards?new=true">
                      <Plus className="h-4 w-4 stroke-3" />
                    </Link>
                  </Button>
                </div>
                <CollapsibleContent className="px-2">
                  <SidebarMenu className="space-y-1">
                    {loading ? (
                      <div className="space-y-3 px-2 py-2">
                        {[1, 2, 3].map((i) => (
                          <div
                            key={i}
                            className="h-10 animate-pulse rounded-2xl border border-white/60 bg-white/40 dark:border-white/5 dark:bg-white/5"
                          />
                        ))}
                      </div>
                    ) : myBoards?.length === 0 ? (
                      <div className="rounded-4xl border border-dashed border-slate-200 bg-slate-100/30 px-6 py-8 text-center dark:border-slate-800 dark:bg-white/5">
                        <Box className="mx-auto mb-2 h-6 w-6 text-slate-300 opacity-30" />
                        <p className="text-[9px] font-black tracking-widest text-slate-400 uppercase italic">
                          No Active Boards
                        </p>
                      </div>
                    ) : (
                      myBoards?.map((board) => (
                        <SidebarMenuItem key={board._id}>
                          <SidebarMenuButton
                            asChild
                            isActive={pathname.endsWith(`/boards/${board._id}/projects`)}
                            className={cn(
                              "group/sub h-11 rounded-2xl px-4 transition-all duration-300",
                              pathname.endsWith(`/boards/${board._id}/projects`)
                                ? "border border-slate-100 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900"
                                : "text-slate-500 hover:bg-white/60 dark:hover:bg-slate-900/30"
                            )}
                          >
                            <Link
                              href={`/boards/${board._id}/projects`}
                              className="flex items-center gap-3"
                            >
                              <div className="relative">
                                <div className="absolute inset-0 scale-150 rounded-full bg-blue-500/20 blur-sm group-hover/sub:animate-pulse" />
                                <div className="relative h-2 w-2 rounded-full bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.6)]" />
                              </div>
                              <span className="mt-0.5 truncate text-[11px] font-black tracking-wider uppercase">
                                {board.title}
                              </span>
                            </Link>
                          </SidebarMenuButton>
                        </SidebarMenuItem>
                      ))
                    )}
                  </SidebarMenu>
                </CollapsibleContent>
              </Collapsible>
            </SidebarGroup>
          )}
        </div>
      </SidebarContent>

      <SidebarFooter className="p-6">
        <div className="group relative">
          <div className="absolute -inset-1 rounded-4xl bg-linear-to-r from-slate-200 to-slate-100 opacity-25 blur transition duration-1000 group-hover:opacity-100 dark:from-slate-800 dark:to-slate-900" />
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton
                asChild
                className="h-14 rounded-[1.75rem] border border-slate-100 bg-white/60 px-5 shadow-2xl shadow-slate-200/50 backdrop-blur-xl transition-all hover:bg-white dark:border-slate-800 dark:bg-slate-900/60 dark:shadow-none dark:hover:bg-slate-800"
              >
                <Link href="/settings" className="flex items-center gap-4">
                  <div className="flex h-9 w-9 transform items-center justify-center rounded-xl bg-slate-900 text-white shadow-lg transition-transform group-hover:rotate-12 dark:bg-white dark:text-slate-900">
                    <Settings className="h-5 w-5 stroke-2" />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[11px] leading-none font-black tracking-widest uppercase">
                      Settings
                    </span>
                    <span className="mt-1 text-[9px] font-bold tracking-tighter text-slate-400 uppercase">
                      {isClient ? "Client Preferences" : "Platform Core"}
                    </span>
                  </div>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </div>
      </SidebarFooter>
    </Sidebar>
  )
}
