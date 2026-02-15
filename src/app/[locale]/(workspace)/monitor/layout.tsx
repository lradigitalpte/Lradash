import Header from "@/components/layout/Header"
import { MonitorPool } from "@/components/monitor/MonitorPool"
import MonitorSidebar from "@/components/monitor/MonitorSidebar"
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar"

export default function MonitorLayout({ children }: { children: React.ReactNode }) {
  return (
    <SidebarProvider>
      <MonitorPool />
      <MonitorSidebar />
      <SidebarInset>
        <Header />
        <main className="flex-1 overflow-y-auto bg-slate-50/50 p-6 dark:bg-slate-950/50">
          <div className="mx-auto max-w-7xl space-y-8">{children}</div>
        </main>
      </SidebarInset>
    </SidebarProvider>
  )
}
