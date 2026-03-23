"use client"

import {
  Activity,
  Globe,
  Mail,
  ShieldCheck,
  CreditCard,
  ChevronLeft,
  LayoutDashboard,
  Plus,
  DollarSign
} from "lucide-react"
import { usePathname } from "next/navigation"

import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarGroup,
  SidebarGroupLabel
} from "@/components/ui/sidebar"
import { useAdminAccess } from "@/hooks/useAdmin"
import { Link } from "@/i18n/navigation"
import { cn } from "@/lib/utils"

const ALL_NAV_ITEMS = [
  { title: "Overview", href: "/monitor", icon: LayoutDashboard, adminOnly: false },
  { title: "Costs & Spend", href: "/monitor/costs", icon: DollarSign, adminOnly: true },
  { title: "Websites", href: "/monitor/websites-ur", icon: Globe, adminOnly: false },
  { title: "Infrastructure", href: "/monitor/infrastructure-ur", icon: Mail, adminOnly: false },
  { title: "SSL & Domains", href: "/monitor/ssl", icon: ShieldCheck, adminOnly: false },
  {
    title: "UptimeRobot Config",
    href: "/monitor/uptimerobot-config",
    icon: ShieldCheck,
    adminOnly: true
  },
  { title: "Subscriptions", href: "/monitor/subscriptions", icon: CreditCard, adminOnly: true }
]

export default function MonitorSidebar() {
  const pathname = usePathname()
  const isAdmin = useAdminAccess()
  const navItems = ALL_NAV_ITEMS.filter((item) => !item.adminOnly || isAdmin === true)

  const isActive = (href: string) => {
    if (href === "/monitor") {
      return pathname === "/monitor" || pathname === "/en/monitor"
    }
    return pathname.includes(href)
  }

  return (
    <Sidebar className="border-r border-slate-200/60 bg-slate-50/50 backdrop-blur-2xl dark:border-slate-800/60 dark:bg-slate-950/50">
      <SidebarHeader className="bg-gradient-to-r from-red-600 to-rose-700 px-6 py-8 shadow-xl">
        <div className="flex flex-col gap-4">
          <Link
            href="/dashboard"
            className="group flex w-fit items-center gap-2 text-[10px] font-black tracking-widest text-white/70 uppercase transition-colors hover:text-white"
          >
            <ChevronLeft className="h-4 w-4 transition-transform group-hover:-translate-x-1" />
            Back to App
          </Link>
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/20 shadow-inner backdrop-blur-md">
              <Activity className="h-6 w-6 text-white" />
            </div>
            <div className="flex flex-col">
              <span className="text-sm font-black tracking-widest text-white uppercase">
                Monitor
              </span>
              <span className="text-[10px] font-medium text-white/60 italic">
                System Infrastructure
              </span>
            </div>
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent className="px-4 py-6">
        <SidebarGroup>
          <SidebarGroupLabel className="mb-4 px-4 text-[10px] font-black tracking-[0.2em] text-slate-400 uppercase">
            Monitoring
          </SidebarGroupLabel>
          <SidebarMenu className="space-y-2">
            {navItems.map((item) => {
              const active = isActive(item.href)
              return (
                <SidebarMenuItem key={item.href}>
                  <SidebarMenuButton
                    asChild
                    isActive={active}
                    className={cn(
                      "group/item relative h-14 overflow-hidden rounded-2xl px-4 transition-all duration-300",
                      active
                        ? "border border-red-100 bg-white text-red-600 shadow-lg shadow-red-100/50 dark:border-red-900/30 dark:bg-slate-900 dark:shadow-none"
                        : "text-slate-500 hover:bg-white/80 hover:text-slate-900 dark:hover:bg-slate-900/50 dark:hover:text-white"
                    )}
                  >
                    <Link href={item.href} className="flex items-center gap-4">
                      <div
                        className={cn(
                          "flex h-10 w-10 items-center justify-center rounded-xl transition-all duration-500 group-hover/item:scale-110",
                          active
                            ? "rotate-3 bg-red-600 text-white shadow-lg shadow-red-500/30"
                            : "bg-slate-100 text-slate-400 group-hover/item:bg-white group-hover/item:text-red-500 dark:bg-slate-800 dark:group-hover/item:bg-slate-700"
                        )}
                      >
                        <item.icon className="h-5 w-5 stroke-[2.5]" />
                      </div>
                      <span className="text-[11px] font-black tracking-widest uppercase">
                        {item.title}
                      </span>
                      {active && (
                        <div className="absolute top-0 right-0 bottom-0 w-1 rounded-full bg-red-600" />
                      )}
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              )
            })}
          </SidebarMenu>
        </SidebarGroup>

        <div className="mt-auto px-4 py-6">
          <button className="group flex w-full items-center gap-3 rounded-[1.25rem] bg-slate-900 p-4 font-black text-white transition-all hover:bg-red-600 dark:bg-white dark:text-slate-900">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/20">
              <Plus className="h-4 w-4" />
            </div>
            <span className="text-[10px] tracking-widest uppercase">Quick Add</span>
          </button>
        </div>
      </SidebarContent>
    </Sidebar>
  )
}
