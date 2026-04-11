"use client"

import {
  ChevronLeft,
  CreditCard,
  DollarSign,
  Globe,
  LayoutDashboard,
  Mail,
  ShieldCheck
} from "lucide-react"
import { useTranslations } from "next-intl"

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
  SidebarRail
} from "@/components/ui/sidebar"
import { useAdminAccess } from "@/hooks/useAdmin"
import { Link, usePathname } from "@/i18n/navigation"
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
  const t = useTranslations("sidebar")
  const pathname = usePathname()
  const isAdmin = useAdminAccess()
  const navItems = ALL_NAV_ITEMS.filter((item) => !item.adminOnly || isAdmin === true)

  const isActive = (href: string) => {
    if (href === "/monitor") {
      return pathname === "/monitor"
    }
    return pathname === href || pathname.startsWith(`${href}/`)
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
                  <span className={PROJECT_SIDEBAR_BRAND_SUBTITLE}>Monitor</span>
                </span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent className="gap-3 bg-slate-950 px-2.5 py-4">
        <SidebarGroup className="gap-1 p-0">
          <SidebarGroupLabel className={PROJECT_SIDEBAR_SECTION_LABEL}>
            Monitoring
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
                      <span className="leading-snug group-data-[collapsible=icon]:hidden">
                        {item.title}
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
            <SidebarMenuButton asChild tooltip="Back to App" className={PROJECT_SIDEBAR_FOOTER_CTA}>
              <Link
                href="/dashboard"
                className="flex w-full items-center gap-3 group-data-[collapsible=icon]:justify-center"
              >
                <ChevronLeft className="shrink-0" />
                <span className="leading-snug group-data-[collapsible=icon]:hidden">
                  Back to App
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
