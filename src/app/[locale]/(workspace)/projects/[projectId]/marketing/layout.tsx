"use client"

import { MarketingSubSidebar } from "@/components/layout/MarketingSubSidebar"

export default function MarketingLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-[calc(100vh-64px)] w-full overflow-hidden">
      <MarketingSubSidebar />
      <div className="custom-scrollbar flex-1 overflow-y-auto bg-slate-50/30 dark:bg-slate-950/30">
        {children}
      </div>
    </div>
  )
}
