"use client"

import { Bell, Search } from "lucide-react"
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
    title: "Task assigned to you",
    description: "Create wireframes was assigned to you",
    time: "5m ago",
    read: false
  },
  {
    id: "2",
    title: "New comment",
    description: "John commented on Design Review",
    time: "1h ago",
    read: false
  },
  {
    id: "3",
    title: "Task completed",
    description: "Setup project was marked as done",
    time: "2h ago",
    read: true
  }
]

export default function Header() {
  const [searchOpen, setSearchOpen] = useState(false)
  const unreadCount = mockNotifications.filter((n) => !n.read).length

  return (
    <header className="sticky top-0 z-40 flex h-14 items-center gap-4 border-b bg-background/95 px-4 backdrop-blur supports-[backdrop-filter]:bg-background/60 md:h-16 md:px-6">
      {/* Left section */}
      <div className="flex items-center gap-2">
        <SidebarTrigger className="-ml-1" />
        <Separator orientation="vertical" className="h-6" />
      </div>

      {/* Center section - Breadcrumbs */}
      <div className="hidden flex-1 md:block">
        <Breadcrumbs />
      </div>

      {/* Right section */}
      <div className="ml-auto flex items-center gap-2">
        {/* Search */}
        <div className={cn("transition-all duration-200", searchOpen ? "w-64" : "w-auto")}>
          {searchOpen ? (
            <SearchInput
              placeholder="Search tasks, projects..."
              className="h-9"
              onSearch={(value) => {
                console.log("Search:", value)
                setSearchOpen(false)
              }}
            />
          ) : (
            <Button variant="ghost" size="icon" className="h-9 w-9" onClick={() => setSearchOpen(true)}>
              <Search className="h-4 w-4" />
              <span className="sr-only">Search</span>
            </Button>
          )}
        </div>

        {/* Notifications */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="relative h-9 w-9">
              <Bell className="h-4 w-4" />
              {unreadCount > 0 && (
                <span className="absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-medium text-white">
                  {unreadCount}
                </span>
              )}
              <span className="sr-only">Notifications</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-80">
            <DropdownMenuLabel className="flex items-center justify-between">
              <span>Notifications</span>
              {unreadCount > 0 && (
                <Button variant="ghost" size="sm" className="h-auto px-2 py-1 text-xs">
                  Mark all as read
                </Button>
              )}
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            {mockNotifications.length === 0 ? (
              <div className="py-6 text-center text-sm text-muted-foreground">No notifications</div>
            ) : (
              <div className="max-h-80 overflow-y-auto">
                {mockNotifications.map((notification) => (
                  <DropdownMenuItem
                    key={notification.id}
                    className={cn("flex flex-col items-start gap-1 p-3", !notification.read && "bg-muted/50")}
                  >
                    <div className="flex w-full items-start justify-between gap-2">
                      <span className="font-medium">{notification.title}</span>
                      {!notification.read && <span className="h-2 w-2 rounded-full bg-blue-500" />}
                    </div>
                    <span className="text-sm text-muted-foreground">{notification.description}</span>
                    <span className="text-xs text-muted-foreground">{notification.time}</span>
                  </DropdownMenuItem>
                ))}
              </div>
            )}
            <DropdownMenuSeparator />
            <DropdownMenuItem className="justify-center text-primary">View all notifications</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <Separator orientation="vertical" className="h-6" />

        {/* Theme Toggle */}
        <ThemeToggle />

        {/* User Nav */}
        <UserNav />
      </div>
    </header>
  )
}
