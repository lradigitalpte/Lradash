import Header from "@/components/layout/Header"
import { MonitorPool } from "@/components/monitor/MonitorPool"
import MonitorSidebar from "@/components/monitor/MonitorSidebar"
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar"

export default function MonitorLayout({ children }: { children: React.ReactNode }) {
  return (
    <SidebarProvider defaultOpen={false} className="min-h-svh">
      <MonitorPool />
      <MonitorSidebar />
      <SidebarInset className="flex min-h-0 w-full min-w-0 flex-1 flex-col">
        <Header />
        <div className="custom-scrollbar min-h-0 flex-1 overflow-x-hidden overflow-y-auto p-6">
          <div className="mx-auto w-full max-w-7xl space-y-8">{children}</div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}
