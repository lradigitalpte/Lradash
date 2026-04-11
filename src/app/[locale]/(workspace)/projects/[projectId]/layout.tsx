"use client"

import { usePathname } from "next/navigation"

import Header from "@/components/layout/Header"
import { MarketingSubSidebar } from "@/components/layout/MarketingSubSidebar"
import { ProjectWorkspaceSidebar } from "@/components/layout/ProjectWorkspaceSidebar"
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar"

export default function ProjectLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const isMarketingMode = pathname.includes("/marketing")

  return (
    <SidebarProvider defaultOpen={false} className="min-h-svh">
      {!isMarketingMode ? <ProjectWorkspaceSidebar /> : <MarketingSubSidebar />}
      <SidebarInset
        data-project-workspace
        className="flex min-h-0 w-full min-w-0 flex-1 flex-col bg-background"
      >
        <Header />
        {/* Scroll region uses theme background so dark mode isn’t a light strip behind content */}
        <div className="custom-scrollbar min-h-0 flex-1 overflow-x-hidden overflow-y-auto bg-background">
          {children}
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}
