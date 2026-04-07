"use client"

import { Eye, Settings } from "lucide-react"

import { Icons } from "@/components/layout/Icons"
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
    <Sidebar className="border-r border-slate-200/60 bg-slate-50/50 backdrop-blur-2xl dark:border-slate-800/60 dark:bg-slate-950/50">
      {/* ── Header ── */}
      <SidebarHeader className="mb-4 bg-linear-to-r from-slate-900 to-blue-950 px-3 py-3 shadow-xl">
        <div className="flex items-center gap-3">
          <Icons.projectLogo className="h-20 w-20" />
          <div className="flex flex-col">
            <span className="text-[10px] font-black tracking-widest text-blue-300 uppercase">
              Client Portal
            </span>
          </div>
        </div>
      </SidebarHeader>

      {/* ── Navigation ── */}
      <SidebarContent className="px-4">
        <div className="flex-1 overflow-y-auto [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          <SidebarGroup className="py-2">
            <SidebarGroupLabel className="mb-4 px-4 text-[10px] font-black tracking-[0.2em] text-slate-400 uppercase">
              Main Menu
            </SidebarGroupLabel>

            <SidebarMenu className="space-y-1">
              {navItems.map((item) => {
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
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                )
              })}
            </SidebarMenu>
          </SidebarGroup>
        </div>
      </SidebarContent>

      {/* ── Footer – user identity ── */}
      <SidebarFooter className="p-6">
        <div className="group relative">
          <div className="absolute -inset-1 rounded-[2rem] bg-linear-to-r from-slate-200 to-slate-100 opacity-25 blur transition duration-1000 group-hover:opacity-100 dark:from-slate-800 dark:to-slate-900" />
          <div className="relative flex items-center gap-3 rounded-[1.75rem] border border-slate-100 bg-white/60 px-5 py-3 shadow-2xl shadow-slate-200/50 backdrop-blur-xl dark:border-slate-800 dark:bg-slate-900/60 dark:shadow-none">
            {/* avatar */}
            <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl bg-blue-600 text-[11px] font-black text-white shadow-lg shadow-blue-500/30">
              {initials}
            </div>
            {/* name / email */}
            <div className="flex min-w-0 flex-col">
              <span className="truncate text-[11px] leading-none font-black tracking-widest uppercase">
                {user?.name ?? "Client"}
              </span>
              {user?.email && (
                <span className="mt-1 truncate text-[9px] font-bold tracking-tighter text-slate-400">
                  {user.email}
                </span>
              )}
            </div>
          </div>
        </div>
      </SidebarFooter>
    </Sidebar>
  )
}
