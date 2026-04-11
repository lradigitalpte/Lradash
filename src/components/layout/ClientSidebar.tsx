"use client"

import { Eye, Settings } from "lucide-react"

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

interface ClientSidebarProps {
  user?: {
    name?: string
    email?: string
  } | null
}

const navItems = [
  { title: "Overview", href: "/client", icon: Eye },
  { title: "Settings", href: "/settings", icon: Settings }
]

export default function ClientSidebar({ user }: ClientSidebarProps) {
  const pathname = usePathname()

  const isActive = (href: string) => {
    if (href === "/client") {
      return pathname === "/client" || pathname.startsWith("/client/")
    }
    return pathname.startsWith(href)
  }

  const initials = user?.name
    ? user.name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : "C"

  return (
    <Sidebar collapsible="icon" className={cn(PROJECT_SIDEBAR_SHELL, "text-slate-100")}>
      <SidebarHeader className="shrink-0 border-b border-slate-800/90 bg-slate-950 px-2.5 py-3">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              size="lg"
              tooltip="Client portal"
              className="h-auto min-h-[3rem] rounded-xl border border-slate-800/90 bg-slate-900/50 px-2.5 py-2.5 hover:bg-slate-900"
            >
              <Link href="/client" className="gap-3">
                <Icons.logoMark className="size-9 shrink-0" />
                <span className="flex min-w-0 flex-col items-start gap-1 text-left group-data-[collapsible=icon]:hidden">
                  <span className={PROJECT_SIDEBAR_BRAND_TITLE}>Client portal</span>
                  <span className={PROJECT_SIDEBAR_BRAND_SUBTITLE}>Account</span>
                </span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent className="gap-3 bg-slate-950 px-2.5 py-4">
        <SidebarGroup className="gap-1 p-0">
          <SidebarGroupLabel className={PROJECT_SIDEBAR_SECTION_LABEL}>
            Navigation
          </SidebarGroupLabel>
          <SidebarMenu className="gap-2">
            {navItems.map((item) => {
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
      </SidebarContent>

      <SidebarFooter className="shrink-0 border-t border-slate-800/90 bg-slate-950 px-2.5 py-3">
        <div className="flex items-center gap-2 rounded-xl border border-slate-700/80 bg-slate-900/60 px-2.5 py-2.5 text-xs text-slate-200 group-data-[collapsible=icon]:hidden">
          <div className="flex size-8 shrink-0 items-center justify-center rounded-md bg-blue-600 text-[11px] font-semibold text-white">
            {initials}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate font-medium">{user?.name ?? "Client"}</p>
            {user?.email && <p className="truncate text-[11px] text-slate-500">{user.email}</p>}
          </div>
        </div>
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}
