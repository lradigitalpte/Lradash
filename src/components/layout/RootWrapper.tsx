"use client"

import { usePathname } from "next/navigation"
import React, { useEffect } from "react"
import { Toaster } from "sonner"

import AppSidebar from "@/components/layout/AppSidebar"
import Header from "@/components/layout/Header"
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar"
import { TOAST_DURATION_MS } from "@/constants/ui"
import { apiClient } from "@/lib/api/client"
import { useTaskStore } from "@/lib/store"

export default function RootWrapper({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const setUserInfo = useTaskStore((state) => state.setUserInfo)

  // Initialize user info on mount (only once)
  useEffect(() => {
    let mounted = true

    const initializeUser = async () => {
      try {
        const response = await apiClient.get("/api/auth/me")
        if (response.ok && mounted) {
          const user = await response.json()
          console.log("[RootWrapper] Initializing user:", user.email)
          // Serialize user to plain object to avoid MongoDB ObjectId issues
          const plainUser = {
            email: user.email,
            name: user.name,
            id: user._id?.toString ? user._id.toString() : user._id
          }
          await setUserInfo(plainUser.email)
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

  // Hide app sidebar when viewing project or board detail page, or the monitor section
  const segments = pathname.split("/").filter(Boolean)
  // Check if path starts with locale and contains /projects/[id], /boards/[id] or /monitor
  const isDetailView =
    segments.length >= 3 && (segments[1] === "projects" || segments[1] === "boards") && segments[2]
  const isMonitorView = segments.length >= 2 && segments[1] === "monitor"

  return (
    <>
      {isDetailView || isMonitorView ? (
        // For detail views and monitor, render children directly (they provide their own sidebar/layout)
        <>{children}</>
      ) : (
        // For all other pages (including board projects), render with sidebar and header
        <SidebarProvider>
          <AppSidebar />
          <SidebarInset>
            <Header />
            {children}
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
