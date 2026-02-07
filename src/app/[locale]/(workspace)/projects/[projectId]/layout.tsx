"use client"

import { useState, useEffect } from "react"
import { useParams } from "next/navigation"
import Link from "next/link"
import { 
  Calendar, 
  MessageSquare, 
  LayoutGrid, 
  Users, 
  Menu, 
  X, 
  Home, 
  ListTodo, 
  GanttChart, 
  FileText, 
  Settings 
} from "lucide-react"
import { Button } from "@/components/ui/button"

export default function ProjectLayout({ children }: { children: React.ReactNode }) {
  const params = useParams()
  const projectId = params?.projectId as string
  const locale = params?.locale as string
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [projectTitle, setProjectTitle] = useState("Project")

  useEffect(() => {
    // Fetch project title for sidebar
    if (projectId) {
      fetchProjectTitle()
    }
  }, [projectId])

  const fetchProjectTitle = async () => {
    try {
      const response = await fetch(`/api/projects/${projectId}`)
      if (response.ok) {
        const data = await response.json()
        setProjectTitle(data.title || "Project")
      }
    } catch (err) {
      console.error("Failed to fetch project title:", err)
    }
  }

  const navItems = [
    { label: "Overview", href: `/${locale}/projects/${projectId}`, icon: Home },
    { label: "Work Packages", href: `/${locale}/projects/${projectId}/work-packages`, icon: ListTodo },
    { label: "Gantt Chart", href: `/${locale}/projects/${projectId}/gantt`, icon: GanttChart },
    { label: "Board", href: `/${locale}/projects/${projectId}/board`, icon: LayoutGrid },
    { label: "Calendar", href: `/${locale}/projects/${projectId}/calendar`, icon: Calendar },
    { label: "Team", href: `/${locale}/projects/${projectId}/team`, icon: Users },
    { label: "Announcements", href: `/${locale}/projects/${projectId}/announcements`, icon: MessageSquare },
    { label: "Documents", href: `/${locale}/projects/${projectId}/documents`, icon: FileText },
    { label: "Settings", href: `/${locale}/projects/${projectId}/settings`, icon: Settings }
  ]

  return (
    <div className="flex h-screen bg-background">
      {/* Sidebar */}
      <aside
        className={`${
          sidebarOpen ? "w-72" : "w-0"
        } bg-card border-r transition-all duration-300 overflow-hidden flex flex-col`}
      >
        <div className="p-6 border-b">
          <h2 className="text-lg font-bold truncate">{projectTitle}</h2>
          <p className="text-sm text-muted-foreground mt-1">Project Management</p>
        </div>
        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const Icon = item.icon
            return (
              <Link key={item.href} href={item.href}>
                <Button
                  variant="ghost"
                  className="w-full justify-start gap-3 h-11 px-3"
                >
                  <Icon className="h-5 w-5 flex-shrink-0" />
                  <span className="truncate">{item.label}</span>
                </Button>
              </Link>
            )
          })}
        </nav>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="bg-card border-b px-6 py-4 flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setSidebarOpen(!sidebarOpen)}
          >
            {sidebarOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
          <div className="flex-1">
            <h1 className="text-xl font-bold">{projectTitle}</h1>
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 overflow-auto bg-background">
          {children}
        </main>
      </div>
    </div>
  )
}