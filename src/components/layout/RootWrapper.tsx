"use client"

import React from "react"
import { usePathname } from "next/navigation"
import { Toaster } from "sonner"

import AppSidebar from "@/components/layout/AppSidebar"
import Header from "@/components/layout/Header"
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar"
import { TOAST_DURATION_MS } from "@/constants/ui"

export default function RootWrapper({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()

  // Hide app sidebar when viewing project detail or board projects page
  const segments = pathname.split("/").filter(Boolean)
  // Check if path starts with locale and contains /projects/[id]
  const isProjectDetail = segments.length >= 3 && segments[1] === "projects" && segments[2]
  const isBoardProjectsPage = segments.length === 4 && segments[1] === "boards" && segments[3] === "projects"

  return (
    <>
      {isProjectDetail || isBoardProjectsPage ? (
        // For project detail and board projects page, render children directly without sidebar/header
        <>{children}</>
      ) : (
        // For all other pages, render with sidebar and header
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
