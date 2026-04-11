"use client"

import {
  Calendar,
  CheckSquare,
  DollarSign,
  FileText,
  GanttChart,
  Home,
  LayoutGrid,
  ListTodo,
  Megaphone,
  MessageSquare,
  Settings,
  Users
} from "lucide-react"
import { useParams } from "next/navigation"
import { useCallback, useEffect, useState, type ElementType } from "react"

import { Icons } from "@/components/layout/Icons"
import {
  PROJECT_SIDEBAR_BRAND_SUBTITLE,
  PROJECT_SIDEBAR_BRAND_TITLE,
  PROJECT_SIDEBAR_FOOTER_CTA,
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
  SidebarRail,
  SidebarSeparator
} from "@/components/ui/sidebar"
import { Link, usePathname } from "@/i18n/navigation"
import { apiClient } from "@/lib/api/client"
import { cn } from "@/lib/utils"

interface NavItem {
  /** Stable id — used to freeze items in the sidebar without removing routes */
  id: string
  label: string
  href: string
  icon: ElementType
  badge?: number
}

/**
 * Routes stay available; toggle to show again in the sidebar when ready.
 * Do not delete nav definitions below — only `showInSidebar` controls visibility.
 */
const PROJECT_NAV_UI_HIDDEN_IDS = new Set<string>(["gantt"])

const buildAllNavItems = (basePath: string, announcementsUnreadCount: number): NavItem[] => [
  { id: "overview", label: "Overview", href: basePath, icon: Home },
  {
    id: "work-packages",
    label: "Work Packages",
    href: `${basePath}/work-packages`,
    icon: ListTodo
  },
  { id: "tasks", label: "Tasks", href: `${basePath}/tasks`, icon: CheckSquare },
  { id: "gantt", label: "Gantt Chart", href: `${basePath}/gantt`, icon: GanttChart },
  { id: "board", label: "Board", href: `${basePath}/board`, icon: LayoutGrid },
  { id: "calendar", label: "Calendar", href: `${basePath}/calendar`, icon: Calendar },
  { id: "team", label: "Team", href: `${basePath}/team`, icon: Users },
  {
    id: "announcements",
    label: "Announcements",
    href: `${basePath}/announcements`,
    icon: MessageSquare,
    badge: announcementsUnreadCount > 0 ? announcementsUnreadCount : undefined
  },
  { id: "marketing", label: "Marketing", href: `${basePath}/marketing`, icon: Megaphone },
  { id: "documents", label: "Documents", href: `${basePath}/documents`, icon: FileText },
  { id: "costs", label: "Costs", href: `${basePath}/costs`, icon: DollarSign },
  { id: "settings", label: "Settings", href: `${basePath}/settings`, icon: Settings }
]

interface NavSection {
  title: string
  itemIds: string[]
}

const PROJECT_NAV_SECTIONS: NavSection[] = [
  { title: "Home", itemIds: ["overview"] },
  { title: "Work", itemIds: ["work-packages", "tasks", "board"] },
  { title: "Planning", itemIds: ["calendar"] },
  { title: "People", itemIds: ["team", "announcements"] },
  { title: "Growth & content", itemIds: ["marketing", "documents"] },
  { title: "Finance", itemIds: ["costs"] },
  { title: "Project", itemIds: ["settings"] }
]

export function ProjectWorkspaceSidebar() {
  const params = useParams()
  const projectId = params?.projectId as string
  const pathname = usePathname()
  const [projectTitle, setProjectTitle] = useState("Project")
  const [announcementsUnreadCount, setAnnouncementsUnreadCount] = useState(0)

  const fetchProjectTitle = useCallback(async () => {
    if (!projectId) {
      return
    }
    try {
      const response = await apiClient.get(`/api/projects/${projectId}`)
      if (response.ok) {
        const data = await response.json()
        setProjectTitle(data.title || "Project")
      }
    } catch (err) {
      console.error("Failed to fetch project title:", err)
    }
  }, [projectId])

  const fetchUnreadCount = useCallback(async () => {
    if (!projectId) {
      return
    }
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
    if (projectId) {
      fetchProjectTitle()
    }
  }, [projectId, fetchProjectTitle])

  useEffect(() => {
    fetchUnreadCount()
  }, [fetchUnreadCount, pathname])

  useEffect(() => {
    const onRefresh = async () => fetchUnreadCount()
    window.addEventListener("announcements-unread-refresh", onRefresh)
    return () => {
      window.removeEventListener("announcements-unread-refresh", onRefresh)
    }
  }, [fetchUnreadCount])

  const basePath = `/projects/${projectId}`

  const allNavItems = buildAllNavItems(basePath, announcementsUnreadCount)
  const navById = new Map(allNavItems.map((item) => [item.id, item]))

  const isActive = (href: string) => {
    if (href === basePath) {
      return pathname === basePath
    }
    return pathname === href || pathname.startsWith(`${href}/`)
  }

  const renderNavItem = (item: NavItem) => {
    const Icon = item.icon
    const active = isActive(item.href)
    const badge = item.badge
    return (
      <SidebarMenuItem key={item.id}>
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
            <span className="flex min-w-0 flex-1 items-center gap-3 group-data-[collapsible=icon]:flex-none">
              <Icon className="shrink-0" />
              <span className="min-w-0 flex-1 leading-snug group-data-[collapsible=icon]:hidden">
                {item.label}
              </span>
            </span>
            {badge != null && badge > 0 && (
              <span className="min-w-[1.25rem] shrink-0 rounded-full bg-amber-500/95 px-1.5 py-0.5 text-center text-[10px] font-bold text-white tabular-nums group-data-[collapsible=icon]:hidden">
                {badge > 99 ? "99+" : badge}
              </span>
            )}
          </Link>
        </SidebarMenuButton>
      </SidebarMenuItem>
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
              tooltip={projectTitle}
              className="h-auto min-h-[3rem] rounded-xl border border-slate-800/90 bg-slate-900/50 px-2.5 py-2.5 hover:bg-slate-900"
            >
              <Link href={basePath} className="gap-3">
                <Icons.logoMark className="size-9 shrink-0" />
                <span className="flex min-w-0 flex-col items-start gap-1 text-left group-data-[collapsible=icon]:hidden">
                  <span className={PROJECT_SIDEBAR_BRAND_TITLE}>{projectTitle}</span>
                  <span className={PROJECT_SIDEBAR_BRAND_SUBTITLE}>Project Context</span>
                </span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent className="gap-0 bg-slate-950 px-2.5 py-4">
        {PROJECT_NAV_SECTIONS.map((section, sectionIndex) => {
          const items = section.itemIds
            .filter((id) => !PROJECT_NAV_UI_HIDDEN_IDS.has(id))
            .map((id) => navById.get(id))
            .filter((item): item is NavItem => item != null)

          if (items.length === 0) {
            return null
          }

          return (
            <div key={section.title}>
              {sectionIndex > 0 && <SidebarSeparator className="my-3 bg-slate-700/50" />}
              <SidebarGroup className="gap-1 p-0">
                <SidebarGroupLabel className={PROJECT_SIDEBAR_SECTION_LABEL}>
                  {section.title}
                </SidebarGroupLabel>
                <SidebarMenu className="gap-2">
                  {items.map((item) => renderNavItem(item))}
                </SidebarMenu>
              </SidebarGroup>
            </div>
          )
        })}
      </SidebarContent>

      <SidebarFooter className="shrink-0 border-t border-slate-800/90 bg-slate-950 px-2.5 py-3">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              tooltip="Go Back Home"
              className={PROJECT_SIDEBAR_FOOTER_CTA}
            >
              <Link
                href="/dashboard"
                className="flex w-full items-center gap-3 group-data-[collapsible=icon]:justify-center"
              >
                <Home className="shrink-0" />
                <span className="leading-snug group-data-[collapsible=icon]:hidden">
                  Go Back Home
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
