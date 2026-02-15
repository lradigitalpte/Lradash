"use client"

import { Bell, Search, Zap, Activity } from "lucide-react"
import { useState } from "react"

import { SearchInput } from "@/components/common"
import { Breadcrumbs } from "@/components/layout/Breadcrumbs"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu"
import { Separator } from "@/components/ui/separator"
import { SidebarTrigger } from "@/components/ui/sidebar"
import { cn } from "@/lib/utils"

import LanguageSwitcher from "./LanguageSwitcher"
import ThemeToggle from "./ThemeToggle"
import { UserNav } from "./UserNav"

// Mock notifications - in real app, this would come from a hook
const mockNotifications = [
  {
    id: "1",
    title: "New Task: Architectural Wireframes",
    description: "You have been assigned to create the architectural wireframes.",
    time: "5m ago",
    read: false,
    priority: "high"
  },
  {
    id: "2",
    title: "New Comment: Design Review",
    description: "John left a comment on the Design Review board.",
    time: "1h ago",
    read: false,
    priority: "medium"
  },
  {
    id: "3",
    title: "Project Milestone: System Setup",
    description: "The system setup phase has been successfully completed.",
    time: "2h ago",
    read: true,
    priority: "low"
  }
]

export default function Header() {
  const [searchOpen, setSearchOpen] = useState(false)
  const unreadCount = mockNotifications.filter((n) => !n.read).length

  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-200/60 bg-white/60 backdrop-blur-xl supports-[backdrop-filter]:bg-white/60 dark:border-slate-800/60 dark:bg-slate-950/60">
      <div className="flex h-16 items-center gap-4 px-6 lg:px-10">
        {/* Left section */}
        <div className="flex items-center gap-4">
          <SidebarTrigger className="h-10 w-10 rounded-xl transition-colors hover:bg-slate-100 dark:hover:bg-slate-800" />
          <Separator orientation="vertical" className="h-6 opacity-30" />
        </div>

        {/* Center section - Breadcrumbs & Operational Status */}
        <div className="hidden flex-1 items-center gap-6 md:flex">
          <Breadcrumbs />
          <div className="h-1 w-1 rounded-full bg-slate-300 dark:bg-slate-700" />
          <div className="flex items-center gap-2 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-1">
            <div className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-500" />
            <span className="text-[9px] font-black tracking-[0.2em] text-emerald-600 uppercase">
              Status: Active
            </span>
          </div>
        </div>

        {/* Right section */}
        <div className="ml-auto flex items-center gap-3">
          {/* Active Search Context */}
          <div
            className={cn(
              "group relative transition-all duration-500",
              searchOpen ? "w-80" : "w-10"
            )}
          >
            {searchOpen ? (
              <div className="relative">
                <Search className="absolute top-1/2 left-4 z-10 h-4 w-4 -translate-y-1/2 text-blue-500" />
                <input
                  autoFocus
                  type="text"
                  placeholder="Search projects..."
                  className="h-10 w-full rounded-2xl border-none bg-slate-50 pr-6 pl-12 text-xs font-bold shadow-inner transition-all placeholder:text-slate-400 focus:ring-2 focus:ring-blue-500/20 dark:bg-slate-900"
                  onBlur={() => {
                    setSearchOpen(false)
                  }}
                />
              </div>
            ) : (
              <Button
                variant="ghost"
                size="icon"
                className="h-10 w-10 rounded-xl text-slate-400 hover:bg-blue-50 hover:text-blue-600 dark:hover:bg-blue-900/20"
                onClick={() => {
                  setSearchOpen(true)
                }}
              >
                <Search className="h-4.5 w-4.5 stroke-[2.5]" />
                <span className="sr-only">Search</span>
              </Button>
            )}
          </div>

          <Separator orientation="vertical" className="mx-1 h-6 opacity-30" />

          {/* Notifications Cluster */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="group relative h-10 w-10 rounded-xl transition-all hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <Bell className="h-4.5 w-4.5 stroke-[2.5] text-slate-400 group-hover:text-slate-900 dark:group-hover:text-white" />
                {unreadCount > 0 && (
                  <span className="absolute top-2 right-2 flex h-4 w-4 animate-in items-center justify-center rounded-lg bg-blue-600 text-[10px] font-black text-white shadow-lg shadow-blue-500/40 duration-300 zoom-in">
                    {unreadCount}
                  </span>
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="end"
              className="w-96 rounded-[2rem] border-slate-200/60 bg-white/95 p-2 shadow-2xl backdrop-blur-xl dark:border-slate-800/60 dark:bg-slate-900/95"
            >
              <DropdownMenuLabel className="p-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <h4 className="text-sm font-black tracking-widest text-slate-900 uppercase dark:text-white">
                      Notifications
                    </h4>
                    <p className="text-[10px] font-black tracking-[0.2em] text-slate-400 uppercase">
                      Activity Pulse
                    </p>
                  </div>
                  {unreadCount > 0 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 rounded-xl px-4 text-[10px] font-black tracking-widest text-blue-600 uppercase hover:bg-blue-50 dark:hover:bg-blue-900/20"
                    >
                      Mark as Read
                    </Button>
                  )}
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator className="mx-2 opacity-50" />
              <div className="custom-scrollbar max-h-[400px] overflow-y-auto px-1 py-2">
                {mockNotifications.map((notification) => (
                  <DropdownMenuItem
                    key={notification.id}
                    className={cn(
                      "mb-1 flex cursor-pointer flex-col items-start gap-2 rounded-2xl p-4 transition-all",
                      !notification.read
                        ? "bg-slate-50 dark:bg-slate-800/50"
                        : "hover:bg-slate-50 dark:hover:bg-slate-800/30"
                    )}
                  >
                    <div className="flex w-full items-start justify-between gap-4">
                      <div className="flex items-center gap-2">
                        {!notification.read && (
                          <div className="h-1.5 w-1.5 rounded-full bg-blue-600 shadow-[0_0_8px_rgba(37,99,235,0.6)]" />
                        )}
                        <span className="text-[11px] font-black tracking-tight text-slate-900 uppercase dark:text-white">
                          {notification.title}
                        </span>
                      </div>
                      <span className="text-[9px] font-black tracking-widest text-slate-400 uppercase">
                        {notification.time}
                      </span>
                    </div>
                    <p className="pl-1 text-xs leading-relaxed font-medium text-slate-500 italic dark:text-slate-400">
                      {notification.description}
                    </p>
                  </DropdownMenuItem>
                ))}
              </div>
              <DropdownMenuSeparator className="mx-2 opacity-50" />
              <DropdownMenuItem className="justify-center rounded-2xl p-4 text-[10px] font-black tracking-[0.2em] text-blue-600 uppercase transition-all hover:bg-blue-50 dark:hover:bg-blue-900/20">
                View All Notifications
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Core Access Matrix */}
          <div className="ml-2 flex items-center gap-1.5 rounded-2xl border border-slate-200/50 bg-slate-100/50 p-1.5 dark:border-slate-800/50 dark:bg-slate-900/50">
            <ThemeToggle />
            <Separator orientation="vertical" className="mx-1 h-6 opacity-30" />
            <UserNav />
          </div>
        </div>
      </div>
    </header>
  )
}
