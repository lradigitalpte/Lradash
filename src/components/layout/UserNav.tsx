"use client"

import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"

import { UserProfilePopover } from "@/components/common"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu"
import { apiClient } from "@/lib/api/client"
import { useTaskStore } from "@/lib/store"

interface User {
  id: string
  email: string
  name: string
  avatar?: string
}

export function UserNav() {
  const [user, setUser] = useState<User | null>(null)
  const [initials, setInitials] = useState("?")
  const [mounted, setMounted] = useState(false)
  const router = useRouter()

  useEffect(() => {
    setMounted(true)

    const loadUser = async () => {
      try {
        const response = await apiClient.get("/api/auth/me")

        if (!response.ok) {
          console.error("Failed to fetch user")
          return
        }

        const userData = await response.json()
        setUser(userData)

        if (userData?.name) {
          const init = userData.name
            .split(" ")
            .map((n: string) => n[0])
            .join("")
            .toUpperCase()
            .slice(0, 2)
          setInitials(init)
        }
      } catch (error) {
        console.error("Failed to load user:", error)
      }
    }

    loadUser()
  }, [])

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", {
        method: "POST",
        credentials: "include"
      })

      localStorage.removeItem("accessToken")
      localStorage.removeItem("user")

      // Clear Zustand store to ensure complete user data isolation on logout
      useTaskStore.setState({
        userEmail: null,
        userId: null,
        projects: [],
        currentBoardId: null,
        myBoards: [],
        teamBoards: []
      })

      window.location.href = "/en/login"
    } catch (error) {
      console.error("Logout error:", error)
    }
  }

  // Return a placeholder avatar until mounted
  if (!mounted) {
    return (
      <Button variant="ghost" className="relative h-8 w-8 rounded-full" disabled>
        <Avatar className="h-8 w-8">
          <AvatarFallback>-</AvatarFallback>
        </Avatar>
      </Button>
    )
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="relative h-8 w-8 rounded-full p-0">
          <Avatar className="h-8 w-8">
            {user?.avatar && <AvatarImage src={user.avatar} alt={user.name} />}
            <AvatarFallback className="bg-primary text-xs font-bold text-primary-foreground">
              {initials}
            </AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56" align="end">
        {user ? (
          <>
            <DropdownMenuLabel className="font-normal">
              <UserProfilePopover
                name={user.name}
                email={user.email}
                image={user.avatar}
                showPopover={false}
              />
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
          </>
        ) : null}
        <DropdownMenuItem
          onClick={() => {
            router.push("/en/settings")
          }}
        >
          Settings
        </DropdownMenuItem>
        <DropdownMenuItem onClick={handleLogout}>Log Out</DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
