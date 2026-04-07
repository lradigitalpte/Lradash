"use client"

import { formatDistanceToNow } from "date-fns"
import {
  Bell,
  Search,
  CheckCheck,
  UserPlus,
  Edit3,
  CheckCircle2,
  PlusCircle,
  MessageSquare,
  AtSign,
  Megaphone,
  RefreshCw,
  X
} from "lucide-react"
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
import { useNotifications } from "@/hooks/useNotifications"
import { useRouter } from "@/i18n/navigation"
import { getNotificationRoute } from "@/lib/notifications/routing"
import { cn } from "@/lib/utils"

import LanguageSwitcher from "./LanguageSwitcher"
import ThemeToggle from "./ThemeToggle"
import { UserNav } from "./UserNav"

export default function Header() {
  const [searchOpen, setSearchOpen] = useState(false)
  const {
    notifications,
    unreadCount,
    loading,
    markRead,
    markAllRead,
    clearAll,
    dismissNotification
  } = useNotifications()
  const router = useRouter()

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case "task_assigned":
        return <UserPlus className="h-4 w-4 text-violet-500" />
      case "task_updated":
        return <Edit3 className="h-4 w-4 text-amber-500" />
      case "task_completed":
        return <CheckCircle2 className="h-4 w-4 text-emerald-500" />
      case "task_deadline_reminder":
        return <Bell className="h-4 w-4 text-amber-500" />
      case "task_created":
        return <PlusCircle className="h-4 w-4 text-blue-500" />
      case "status_change":
        return <RefreshCw className="h-4 w-4 text-orange-500" />
      case "mention":
        return <AtSign className="h-4 w-4 text-pink-500" />
      case "comment_reply":
        return <MessageSquare className="h-4 w-4 text-cyan-500" />
      case "announcement_created":
        return <Megaphone className="h-4 w-4 text-indigo-500" />
      default:
        return <Bell className="h-4 w-4 text-slate-400" />
    }
  }

  const getNotificationAccent = (type: string) => {
    switch (type) {
      case "task_assigned":
        return "border-l-violet-500"
      case "task_updated":
        return "border-l-amber-500"
      case "task_completed":
        return "border-l-emerald-500"
      case "task_deadline_reminder":
        return "border-l-amber-500"
      case "task_created":
        return "border-l-blue-500"
      case "status_change":
        return "border-l-orange-500"
      case "mention":
        return "border-l-pink-500"
      case "comment_reply":
        return "border-l-cyan-500"
      case "announcement_created":
        return "border-l-indigo-500"
      default:
        return "border-l-slate-300"
    }
  }

  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-200/60 bg-white/60 backdrop-blur-xl supports-backdrop-filter:bg-white/60 dark:border-slate-800/60 dark:bg-slate-950/60">
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
              className="w-96 rounded-4xl border-slate-200/60 bg-white/95 p-2 shadow-2xl backdrop-blur-xl dark:border-slate-800/60 dark:bg-slate-900/95"
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
                      onClick={(e) => {
                        e.preventDefault()
                        markAllRead()
                      }}
                    >
                      <CheckCheck className="mr-1.5 h-3.5 w-3.5" />
                      Mark all read
                    </Button>
                  )}
                  {notifications.length > 0 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 rounded-xl px-4 text-[10px] font-black tracking-widest text-slate-500 uppercase hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800"
                      onClick={(e) => {
                        e.preventDefault()
                        clearAll()
                      }}
                    >
                      Clear all
                    </Button>
                  )}
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator className="mx-2 opacity-50" />
              <div className="custom-scrollbar max-h-100 overflow-y-auto px-1 py-2">
                {loading && (
                  <div className="flex flex-col items-center gap-2 py-10">
                    <div className="h-6 w-6 animate-spin rounded-full border-2 border-slate-300 border-t-blue-500 dark:border-slate-700" />
                    <span className="text-[10px] font-black tracking-widest text-slate-400 uppercase">
                      Loading notifications…
                    </span>
                  </div>
                )}
                {!loading && notifications.length === 0 && (
                  <div className="flex flex-col items-center gap-3 py-10">
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 dark:bg-slate-800">
                      <Bell className="h-5 w-5 text-slate-300 dark:text-slate-600" />
                    </div>
                    <div className="text-center">
                      <p className="text-[11px] font-bold text-slate-500 dark:text-slate-400">
                        No notifications yet
                      </p>
                      <p className="text-[10px] text-slate-400 dark:text-slate-500">
                        You&apos;re all caught up!
                      </p>
                    </div>
                  </div>
                )}
                {!loading &&
                  notifications.map((notification) => (
                    <DropdownMenuItem
                      key={notification.id}
                      className={cn(
                        "mb-1.5 flex cursor-pointer flex-col items-start gap-2 rounded-xl border-l-[3px] p-3.5 transition-all",
                        getNotificationAccent(notification.type),
                        !notification.read
                          ? "bg-sky-50/80 hover:bg-sky-100/70 dark:bg-blue-950/20 dark:hover:bg-blue-900/30"
                          : "border-l-transparent hover:bg-slate-100/80 dark:hover:bg-slate-800/40"
                      )}
                      onClick={() => {
                        if (!notification.read) {
                          markRead(notification.id)
                        }

                        const target = getNotificationRoute({
                          type: notification.type,
                          taskId: notification.taskId,
                          projectId: notification.projectId
                        })
                        router.push(target)
                      }}
                    >
                      <div className="flex w-full items-start gap-3">
                        <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white shadow-sm dark:bg-slate-800">
                          {getNotificationIcon(notification.type)}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-start justify-between gap-2">
                            <span
                              className={cn(
                                "line-clamp-1 text-[12px] leading-tight",
                                !notification.read
                                  ? "font-bold text-slate-900 dark:text-white"
                                  : "font-semibold text-slate-700 dark:text-slate-300"
                              )}
                            >
                              {notification.title || "Notification"}
                            </span>
                            {!notification.read && (
                              <div className="mt-1 h-2 w-2 shrink-0 rounded-full bg-blue-600 shadow-[0_0_6px_rgba(37,99,235,0.5)]" />
                            )}
                            {notification.read && (
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-5 w-5 shrink-0 rounded-md text-slate-400 hover:bg-slate-200 hover:text-slate-700 dark:hover:bg-slate-700 dark:hover:text-slate-200"
                                onClick={(e) => {
                                  e.preventDefault()
                                  e.stopPropagation()
                                  dismissNotification(notification.id)
                                }}
                              >
                                <X className="h-3 w-3" />
                                <span className="sr-only">Dismiss notification</span>
                              </Button>
                            )}
                          </div>
                          <p className="mt-1 line-clamp-2 text-[11px] leading-relaxed text-slate-500 dark:text-slate-400">
                            {notification.body || "You have a new activity update."}
                          </p>
                          <div className="mt-1.5 flex items-center gap-2">
                            {notification.triggeredBy?.name && (
                              <span className="text-[10px] font-semibold text-slate-400 dark:text-slate-500">
                                {notification.triggeredBy.name}
                              </span>
                            )}
                            {notification.triggeredBy?.name && (
                              <span className="text-[8px] text-slate-300 dark:text-slate-600">
                                &bull;
                              </span>
                            )}
                            <span className="text-[10px] text-slate-400 dark:text-slate-500">
                              {notification.createdAt &&
                              !isNaN(new Date(notification.createdAt).getTime())
                                ? formatDistanceToNow(new Date(notification.createdAt), {
                                    addSuffix: true
                                  })
                                : "recently"}
                            </span>
                          </div>
                        </div>
                      </div>
                    </DropdownMenuItem>
                  ))}
              </div>
              <DropdownMenuSeparator className="mx-2 opacity-50" />
              <DropdownMenuItem
                className="justify-center rounded-2xl p-4 text-[10px] font-black tracking-[0.2em] text-blue-600 uppercase transition-all hover:bg-blue-50 dark:hover:bg-blue-900/20"
                onClick={() => {
                  router.push("/notifications")
                }}
              >
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
