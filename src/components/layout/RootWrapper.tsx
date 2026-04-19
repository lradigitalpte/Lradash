"use client"

import { useRouter } from "next/navigation"
import { usePathname } from "next/navigation"
import React, { useEffect, useState } from "react"
import { Toaster } from "sonner"

import AppSidebar from "@/components/layout/AppSidebar"
import ClientSidebar from "@/components/layout/ClientSidebar"
import Header from "@/components/layout/Header"
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar"
import { TOAST_DURATION_MS } from "@/constants/ui"
import { fetchAuthMeCached } from "@/lib/api/authMeCache"
import { useTaskStore } from "@/lib/store"

interface UserInfo {
  name?: string
  email?: string
}

export default function RootWrapper({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()
  const setUserInfo = useTaskStore((state) => state.setUserInfo)
  const [orgRole, setOrgRole] = useState<string | null>(null)
  const [clientUser, setClientUser] = useState<UserInfo | null>(null)

  // Initialize user info on mount (only once)
  useEffect(() => {
    let mounted = true

    const initializeUser = async () => {
      try {
        const user = await fetchAuthMeCached()
        if (mounted) {
          await setUserInfo(user.email, user.id! ?? null)
          setOrgRole(user.orgRole! ?? null)
          setClientUser({ name: user.name! ?? user.email, email: user.email })
        }
      } catch (error) {
        console.error("[RootWrapper] Failed to initialize user:", error)
      }
    }

    initializeUser()

    return () => {
      mounted = false
    }
  }, [setUserInfo])

  // Segment-based layout decisions (path-derived, no async wait)
  const segments = pathname.split("/").filter(Boolean)
  // segments[0] = locale, segments[1] = top-level route
  const isDetailView =
    segments.length >= 3 && (segments[1] === "projects" || segments[1] === "boards") && segments[2]
  const isMonitorView = segments.length >= 2 && segments[1] === "monitor"
  // Client portal uses its own dedicated sidebar — detected from URL so it's instant (no flash)
  const isClientPortal = segments.length >= 2 && segments[1] === "client"

  useEffect(() => {
    if (orgRole !== "CLIENT") {
      return
    }

    const locale = segments[0] || "en"
    const allowedClientRoutes = new Set(["client", "settings"])
    const currentTopLevel = segments[1]

    if (!currentTopLevel || !allowedClientRoutes.has(currentTopLevel)) {
      router.replace(`/${locale}/client`)
    }
  }, [orgRole, router, segments])

  return (
    <>
      {isDetailView || isMonitorView ? (
        // Detail views and monitor pages provide their own sidebar/layout
        <>{children}</>
      ) : isClientPortal ? (
        // Client portal: dedicated sidebar with no admin nav — rendered from URL, never flashes
        <SidebarProvider defaultOpen={false} className="min-h-svh">
          <ClientSidebar user={clientUser} />
          <SidebarInset className="flex min-h-0 w-full min-w-0 flex-1 flex-col">
            <Header />
            <div className="custom-scrollbar min-h-0 flex-1 overflow-x-hidden overflow-y-auto">
              {children}
            </div>
          </SidebarInset>
        </SidebarProvider>
      ) : (
        // All other workspace pages: full app sidebar
        <SidebarProvider defaultOpen={false} className="min-h-svh">
          <AppSidebar />
          <SidebarInset className="flex min-h-0 w-full min-w-0 flex-1 flex-col">
            <Header />
            <div className="custom-scrollbar min-h-0 flex-1 overflow-x-hidden overflow-y-auto">
              {children}
            </div>
          </SidebarInset>
        </SidebarProvider>
      )}
      <Toaster
        position="bottom-right"
        expand={false}
        toastOptions={{
          duration: TOAST_DURATION_MS
        }}
        visibleToasts={1}
        closeButton
      />
    </>
  )
}
