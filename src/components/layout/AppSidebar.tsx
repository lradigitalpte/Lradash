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
  FileText
} from "lucide-react"
import { useTranslations } from "next-intl"
import { useState } from "react"

import { Icons } from "@/components/layout/Icons"
import { Button } from "@/components/ui/button"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { ScrollArea } from "@/components/ui/scroll-area"
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
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem
} from "@/components/ui/sidebar"
import { useBoards } from "@/hooks/useBoards"
import { Link, usePathname } from "@/i18n/navigation"
import { cn } from "@/lib/utils"

interface NavItem {
  title: string
  href: string
  icon: React.ElementType
  badge?: number
}

export default function AppSidebar() {
  const t = useTranslations("sidebar")
  const pathname = usePathname()
  const { myBoards, teamBoards, loading } = useBoards()
  const [myBoardsOpen, setMyBoardsOpen] = useState(true)
  const [teamBoardsOpen, setTeamBoardsOpen] = useState(true)

  const mainNavItems: NavItem[] = [
    { title: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
    { title: t("overview"), href: "/boards", icon: Home },
    { title: "Projects", href: "/projects", icon: FolderKanban },
    { title: "Tasks", href: "/tasks", icon: CheckSquare },
    { title: "Calendar", href: "/calendar", icon: CalendarDays },
    { title: "Team", href: "/team", icon: Users },
    { title: "Reports", href: "/reports", icon: FileText }
  ]

  const isActive = (href: string) => {
    if (href === "/boards") {
      return pathname === "/boards"
    }
    return pathname.startsWith(href)
  }

  return (
    <Sidebar className="border-r">
      <SidebarHeader className="border-b px-4 py-4">
        <Link href="/dashboard" className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <Icons.projectLogo />
          </div>
          <div className="flex flex-col">
            <span className="text-base font-semibold tracking-tight">LRA Project</span>
            <span className="text-xs text-muted-foreground">Management</span>
          </div>
        </Link>
      </SidebarHeader>

      <SidebarContent>
        <ScrollArea className="h-full">
          {/* Main Navigation */}
          <SidebarGroup className="px-2 py-4">
            <SidebarMenu>
              {mainNavItems.map((item) => (
                <SidebarMenuItem key={item.href}>
                  <SidebarMenuButton
                    asChild
                    isActive={isActive(item.href)}
                    className={cn(
                      "h-10 px-3",
                      isActive(item.href) && "bg-primary/10 text-primary font-medium"
                    )}
                  >
                    <Link href={item.href} className="flex items-center gap-3">
                      <item.icon className="h-4 w-4" />
                      <span>{item.title}</span>
                      {item.badge && (
                        <span className="ml-auto flex h-5 w-5 items-center justify-center rounded-full bg-primary text-xs text-primary-foreground">
                          {item.badge}
                        </span>
                      )}
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroup>

          {/* My Boards Section */}
          <SidebarGroup className="px-2">
            <Collapsible open={myBoardsOpen} onOpenChange={setMyBoardsOpen}>
              <div className="flex items-center justify-between px-1">
                <CollapsibleTrigger asChild>
                  <button className="flex flex-1 items-center gap-2 py-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground hover:text-foreground">
                    {myBoardsOpen ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
                    {t("myBoards")}
                  </button>
                </CollapsibleTrigger>
                <Button variant="ghost" size="icon" className="h-6 w-6" asChild>
                  <Link href="/boards?new=true">
                    <Plus className="h-3 w-3" />
                  </Link>
                </Button>
              </div>
              <CollapsibleContent>
                <SidebarMenu>
                  {loading ? (
                    <div className="space-y-2 px-3 py-2">
                      {[1, 2, 3].map((i) => (
                        <div key={i} className="h-8 animate-pulse rounded-md bg-muted" />
                      ))}
                    </div>
                  ) : myBoards?.length === 0 ? (
                    <div className="px-3 py-4 text-center text-sm text-muted-foreground">
                      No boards yet
                    </div>
                  ) : (
                    myBoards?.map((board) => (
                      <SidebarMenuItem key={board._id}>
                        <SidebarMenuButton
                          asChild
                          isActive={pathname.endsWith(`/boards/${board._id}`)}
                          className="h-9 px-3"
                        >
                          <Link href={`/boards/${board._id}`} className="flex items-center gap-3">
                            <FolderKanban className="h-4 w-4 text-muted-foreground" />
                            <span className="truncate">{board.title}</span>
                          </Link>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    ))
                  )}
                </SidebarMenu>
              </CollapsibleContent>
            </Collapsible>
          </SidebarGroup>

          {/* Team Boards Section */}
          <SidebarGroup className="px-2">
            <Collapsible open={teamBoardsOpen} onOpenChange={setTeamBoardsOpen}>
              <CollapsibleTrigger asChild>
                <button className="flex w-full items-center gap-2 px-1 py-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground hover:text-foreground">
                  {teamBoardsOpen ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
                  {t("teamBoards")}
                </button>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <SidebarMenu>
                  {loading ? (
                    <div className="space-y-2 px-3 py-2">
                      {[1, 2].map((i) => (
                        <div key={i} className="h-8 animate-pulse rounded-md bg-muted" />
                      ))}
                    </div>
                  ) : teamBoards?.length === 0 ? (
                    <div className="px-3 py-4 text-center text-sm text-muted-foreground">
                      No team boards
                    </div>
                  ) : (
                    teamBoards?.map((board) => (
                      <SidebarMenuItem key={board._id}>
                        <SidebarMenuButton
                          asChild
                          isActive={pathname.endsWith(`/boards/${board._id}`)}
                          className="h-9 px-3"
                        >
                          <Link href={`/boards/${board._id}`} className="flex items-center gap-3">
                            <Users className="h-4 w-4 text-muted-foreground" />
                            <span className="truncate">{board.title}</span>
                          </Link>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    ))
                  )}
                </SidebarMenu>
              </CollapsibleContent>
            </Collapsible>
          </SidebarGroup>
        </ScrollArea>
      </SidebarContent>

      <SidebarFooter className="border-t p-2">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton asChild className="h-10 px-3">
              <Link href="/settings" className="flex items-center gap-3">
                <Settings className="h-4 w-4" />
                <span>Settings</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  )
}
