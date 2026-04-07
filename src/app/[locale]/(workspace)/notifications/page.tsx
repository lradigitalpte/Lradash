"use client"

import { formatDistanceToNow } from "date-fns"
import { Bell, CheckCheck, Trash2, ChevronRight, X } from "lucide-react"
import { useMemo, useState } from "react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { useNotifications } from "@/hooks/useNotifications"
import { useRouter } from "@/i18n/navigation"
import { getNotificationRoute } from "@/lib/notifications/routing"
import { cn } from "@/lib/utils"

export default function NotificationsPage() {
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
  const [search, setSearch] = useState("")
  const [filter, setFilter] = useState<"all" | "unread" | "read">("all")

  const filteredNotifications = useMemo(() => {
    return notifications.filter((notification) => {
      const matchesSearch =
        search.trim().length === 0 ||
        notification.title.toLowerCase().includes(search.toLowerCase()) ||
        notification.body.toLowerCase().includes(search.toLowerCase())

      const matchesFilter =
        filter === "all" || (filter === "read" ? notification.read : !notification.read)

      return matchesSearch && matchesFilter
    })
  }, [notifications, search, filter])

  return (
    <div className="mx-auto w-full max-w-5xl space-y-6 p-6 lg:p-10">
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-slate-900 dark:text-white">
            Notifications
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            {unreadCount > 0
              ? `${unreadCount} unread notification${unreadCount === 1 ? "" : "s"}`
              : "All caught up"}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            disabled={unreadCount === 0}
            onClick={() => {
              markAllRead()
            }}
          >
            <CheckCheck className="mr-2 h-4 w-4" />
            Mark all read
          </Button>
          <Button
            variant="destructive"
            size="sm"
            disabled={notifications.length === 0}
            onClick={() => {
              clearAll()
            }}
          >
            <Trash2 className="mr-2 h-4 w-4" />
            Clear all
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <CardTitle className="text-base font-semibold">Activity Feed</CardTitle>
            <div className="flex items-center gap-2">
              <Button
                variant={filter === "all" ? "default" : "outline"}
                size="sm"
                onClick={() => {
                  setFilter("all")
                }}
              >
                All
              </Button>
              <Button
                variant={filter === "unread" ? "default" : "outline"}
                size="sm"
                onClick={() => {
                  setFilter("unread")
                }}
              >
                Unread
              </Button>
              <Button
                variant={filter === "read" ? "default" : "outline"}
                size="sm"
                onClick={() => {
                  setFilter("read")
                }}
              >
                Read
              </Button>
            </div>
          </div>
          <Input
            value={search}
            onChange={(event) => {
              setSearch(event.target.value)
            }}
            placeholder="Search notifications..."
            className="mt-3"
          />
        </CardHeader>
        <CardContent>
          {loading && (
            <div className="py-10 text-center text-sm text-slate-500 dark:text-slate-400">
              Loading...
            </div>
          )}

          {!loading && filteredNotifications.length === 0 && (
            <div className="flex flex-col items-center gap-3 py-14 text-center">
              <div className="rounded-2xl bg-slate-100 p-4 dark:bg-slate-800">
                <Bell className="h-6 w-6 text-slate-400 dark:text-slate-500" />
              </div>
              <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
                {notifications.length === 0 ? "No notifications yet" : "No matching notifications"}
              </p>
            </div>
          )}

          {!loading && filteredNotifications.length > 0 && (
            <div className="space-y-2">
              {filteredNotifications.map((notification) => (
                <div
                  key={notification.id}
                  className={cn(
                    "flex items-start justify-between rounded-xl border p-3 transition-colors",
                    notification.read
                      ? "border-slate-200 bg-white hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:hover:bg-slate-800"
                      : "border-sky-200 bg-sky-50/70 hover:bg-sky-100/70 dark:border-blue-900 dark:bg-blue-950/30 dark:hover:bg-blue-900/30"
                  )}
                >
                  <button
                    className="min-w-0 flex-1 pr-3 text-left"
                    onClick={() => {
                      if (!notification.read) {
                        markRead(notification.id)
                      }
                      router.push(
                        getNotificationRoute({
                          type: notification.type,
                          taskId: notification.taskId,
                          projectId: notification.projectId
                        })
                      )
                    }}
                  >
                    <p className="line-clamp-1 text-sm font-semibold text-slate-900 dark:text-slate-100">
                      {notification.title || "Notification"}
                    </p>
                    <p className="mt-1 line-clamp-2 text-sm text-slate-600 dark:text-slate-300">
                      {notification.body || "You have a new activity update."}
                    </p>
                    <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
                      {notification.createdAt && !isNaN(new Date(notification.createdAt).getTime())
                        ? formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })
                        : "recently"}
                    </p>
                  </button>
                  <div className="flex shrink-0 items-center gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => {
                        dismissNotification(notification.id)
                      }}
                    >
                      <X className="h-4 w-4" />
                      <span className="sr-only">Dismiss notification</span>
                    </Button>
                    <ChevronRight className="h-4 w-4 text-slate-400" />
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
