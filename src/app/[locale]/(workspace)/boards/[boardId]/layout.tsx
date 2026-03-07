"use client"

import { FileText, Home, ListTodo, Settings, CheckSquare } from "lucide-react"
import Link from "next/link"
import { useParams, usePathname } from "next/navigation"
import { useState, useEffect } from "react"

import Header from "@/components/layout/Header"
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

export default function BoardLayout({ children }: { children: React.ReactNode }) {
  const params = useParams()
  const boardId = params?.boardId as string
  const locale = params?.locale as string
  const [boardTitle, setBoardTitle] = useState("Board")

  useEffect(() => {
    // Fetch board title for sidebar
    if (boardId) {
      fetchBoardData()
    }
  }, [boardId])

  const fetchBoardData = async () => {
    try {
      const response = await apiClient.get(`/api/boards/${boardId}`)
      if (response.ok) {
        const data = await response.json()
        setBoardTitle(data.title || "Board")
      }
    } catch (err) {
      console.error("Failed to fetch board title:", err)
    }
  }

  const navItems = [
    { label: "Workspace", href: `/${locale}/boards/${boardId}/projects`, icon: Home },
    { label: "Tasks", href: `/${locale}/boards/${boardId}/tasks`, icon: CheckSquare },
    {
      label: "Work Packages",
      href: `/${locale}/boards/${boardId}/work-packages`,
      icon: ListTodo
    },
    { label: "Documents", href: `/${locale}/boards/${boardId}/documents`, icon: FileText },
    { label: "Settings", href: `/${locale}/boards/${boardId}/settings`, icon: Settings }
  ]

  const pathname = usePathname()

  const isActive = (href: string) => {
    return pathname === href
  }

  return (
    <SidebarProvider>
      <div className="flex h-screen w-full overflow-hidden bg-background font-sans">
        {/* Sidebar */}
        <Sidebar className="border-r border-slate-200 dark:border-slate-800">
          <SidebarHeader className="border-b border-slate-100 bg-white p-6 dark:border-slate-800/50 dark:bg-slate-900">
            <div className="flex flex-col space-y-1">
              <h2 className="truncate text-lg font-black tracking-[0.05em] tracking-tight text-slate-900 uppercase dark:text-white">
                {boardTitle}
              </h2>
              <p className="text-[10px] font-black tracking-[0.2em] text-slate-400 uppercase">
                Board Context
              </p>
            </div>
          </SidebarHeader>

          <SidebarContent className="bg-white px-3 py-6 dark:bg-slate-900">
            <SidebarMenu className="space-y-1">
              {navItems.map((item) => {
                const Icon = item.icon
                const active = isActive(item.href)
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
                      <Link href={item.href} className="flex items-center gap-4">
                        <Icon
                          className={cn(
                            "h-5 w-5 stroke-[2]",
                            active ? "text-white" : "text-slate-400"
                          )}
                        />
                        <span className="text-[13px] font-bold tracking-wide">{item.label}</span>
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
                  <Link href={`/${locale}/boards`} className="flex items-center gap-4">
                    <Home className="h-5 w-5 stroke-[2.5] transition-transform group-hover:scale-110" />
                    <span className="text-[11px] font-black tracking-widest uppercase">
                      Exit Board
                    </span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarFooter>
        </Sidebar>

        {/* Main Content Area */}
        <SidebarInset className="flex flex-col bg-slate-50/50 dark:bg-slate-950/50">
          <Header />
          <main className="flex-1 overflow-y-auto px-10 py-8">{children}</main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  )
}
