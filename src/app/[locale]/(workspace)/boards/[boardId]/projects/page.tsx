"use client"

import {
  BarChart,
  Calendar,
  FolderKanban,
  LayoutGrid,
  MessageSquare,
  Plus,
  Settings,
  Users,
  BookOpen,
  FileText
} from "lucide-react"
import { useParams, useRouter } from "next/navigation"
import { useMemo, useState, useEffect } from "react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useTaskStore } from "@/lib/store"
import { cn } from "@/lib/utils"

export default function BoardProjectsPage() {
  const params = useParams()
  const router = useRouter()
  const boardId = Array.isArray(params.boardId) ? params.boardId[0] : params.boardId
  const projects = useTaskStore((state) => state.projects)
  const myBoards = useTaskStore((state) => state.myBoards)
  const teamBoards = useTaskStore((state) => state.teamBoards)
  const fetchProjects = useTaskStore((state) => state.fetchProjects)
  const [activeSection, setActiveSection] = useState("projects")

  const boards = useMemo(() => {
    return [...myBoards, ...teamBoards]
  }, [myBoards, teamBoards])

  const board = useMemo(() => {
    return boards.find((b) => b._id === boardId)
  }, [boards, boardId])

  // Mock projects if no real projects
  const mockProjects = [
    {
      _id: "mock-1",
      title: "Website Redesign",
      description: "Complete redesign of the company website with modern UI/UX",
      members: [
        { name: "Jane Doe", id: "1" },
        { name: "John Smith", id: "2" }
      ],
      tasks: [
        { status: "DONE" },
        { status: "DONE" },
        { status: "IN_PROGRESS" },
        { status: "TODO" },
        { status: "TODO" }
      ]
    },
    {
      _id: "mock-2",
      title: "Mobile App Development",
      description: "Build iOS and Android mobile applications",
      members: [
        { name: "John Doe", id: "3" },
        { name: "Jane Smith", id: "4" },
        { name: "Bob Johnson", id: "5" }
      ],
      tasks: [
        { status: "DONE" },
        { status: "IN_PROGRESS" },
        { status: "IN_PROGRESS" },
        { status: "TODO" }
      ]
    },
    {
      _id: "mock-3",
      title: "Database Migration",
      description: "Migrate from PostgreSQL to MongoDB",
      members: [
        { name: "Alice Brown", id: "6" }
      ],
      tasks: [
        { status: "IN_PROGRESS" },
        { status: "IN_PROGRESS" },
        { status: "TODO" },
        { status: "TODO" },
        { status: "TODO" },
        { status: "TODO" }
      ]
    },
    {
      _id: "mock-4",
      title: "API Documentation",
      description: "Create comprehensive API documentation and guides",
      members: [
        { name: "Charlie Davis", id: "7" },
        { name: "Eve Wilson", id: "8" }
      ],
      tasks: [
        { status: "DONE" },
        { status: "DONE" },
        { status: "DONE" },
        { status: "IN_PROGRESS" }
      ]
    }
  ]

  const displayProjects = projects && projects.length > 0 ? projects : mockProjects

  useEffect(() => {
    if (boardId) {
      fetchProjects(boardId)
    }
  }, [boardId, fetchProjects])

  const sections = [
    { id: "projects", label: "Projects", icon: FolderKanban },
    { id: "kanban", label: "Kanban Board", icon: LayoutGrid },
    { id: "calendar", label: "Calendar", icon: Calendar },
    { id: "team", label: "Team", icon: Users },
    { id: "reports", label: "Reports", icon: BarChart },
    { id: "wiki", label: "Wiki", icon: BookOpen },
    { id: "settings", label: "Settings", icon: Settings }
  ]

  const handleSectionClick = (sectionId: string) => {
    switch (sectionId) {
      case "kanban":
        router.push(`/boards/${boardId}`)
        break
      case "calendar":
        router.push("/calendar")
        break
      case "team":
        router.push("/team")
        break
      case "projects":
        // Stay on current page
        setActiveSection("projects")
        break
      default:
        // For reports, wiki, settings - show placeholder
        setActiveSection(sectionId)
    }
  }

  if (!board) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Card>
          <CardHeader>
            <CardTitle>Board not found</CardTitle>
            <CardDescription>The board you're looking for doesn't exist</CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => router.push("/boards")}>Back to Boards</Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="flex w-screen h-screen bg-background">
      {/* Left Sidebar */}
      <div className="w-64 border-r hidden lg:flex lg:flex-col flex-shrink-0">
        <div className="p-6 border-b">
          <h1 className="text-lg font-bold truncate">{board.title}</h1>
          <p className="text-xs text-muted-foreground mt-1">{board.description || "Board Overview"}</p>
        </div>

        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          {sections.map((section) => {
            const Icon = section.icon
            const isActive = activeSection === section.id
            return (
              <button
                key={section.id}
                onClick={() => handleSectionClick(section.id)}
                className={cn(
                  "w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                  isActive
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                )}
              >
                <Icon className="h-4 w-4" />
                {section.label}
              </button>
            )
          })}
        </nav>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <div className="border-b p-4 flex items-center justify-between flex-shrink-0">
          <div>
            <h2 className="text-xl font-bold">{board.title}</h2>
            <p className="text-sm text-muted-foreground">{projects.length} projects</p>
          </div>
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            New Project
          </Button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          <div className="max-w-7xl mx-auto p-6">
            {activeSection === "projects" && (
              <div className="space-y-6">
                {/* Quick Stats */}
                <div className="grid grid-cols-4 gap-4">
                  {[
                    { label: "Total Projects", value: displayProjects.length, icon: FolderKanban },
                    { label: "Active", value: displayProjects.filter(p => p.tasks?.some(t => t.status !== "DONE")).length, icon: BarChart },
                    { label: "Completed", value: displayProjects.filter(p => p.tasks?.every(t => t.status === "DONE")).length, icon: BarChart },
                    { label: "Team Members", value: board.members?.length || 0, icon: Users }
                  ].map((stat, i) => (
                    <Card key={i}>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                          <stat.icon className="h-4 w-4" />
                          {stat.label}
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-3xl font-bold">{stat.value}</p>
                      </CardContent>
                    </Card>
                  ))}
                </div>

                {/* Projects Grid */}
                <div>
                  <h3 className="text-lg font-semibold mb-4">All Projects</h3>
                  {displayProjects.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {displayProjects.map((project) => {
                        const totalTasks = project.tasks?.length || 0
                        const doneTasks = project.tasks?.filter(t => t.status === "DONE").length || 0
                        const progress = totalTasks > 0 ? Math.round((doneTasks / totalTasks) * 100) : 0

                        return (
                          <Card
                            key={project._id}
                            className="cursor-pointer hover:border-primary/50 transition-all hover:shadow-md"
                            onClick={() => router.push(`/projects/${project._id}`)}
                          >
                            <CardHeader>
                              <CardTitle className="text-base">{project.title}</CardTitle>
                              <CardDescription className="line-clamp-2">
                                {project.description || "No description"}
                              </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-3">
                              {/* Progress */}
                              <div>
                                <div className="flex items-center justify-between text-xs mb-1">
                                  <span className="text-muted-foreground">Progress</span>
                                  <span className="font-semibold">{progress}%</span>
                                </div>
                                <div className="h-2 bg-muted rounded-full overflow-hidden">
                                  <div
                                    className="h-full bg-primary transition-all"
                                    style={{ width: `${progress}%` }}
                                  />
                                </div>
                              </div>

                              {/* Stats */}
                              <div className="flex items-center justify-between text-xs text-muted-foreground">
                                <span>{totalTasks} tasks</span>
                                <span>{project.members?.length || 0} members</span>
                              </div>

                              {/* Team Avatars */}
                              {project.members && project.members.length > 0 && (
                                <div className="flex -space-x-2">
                                  {project.members.slice(0, 4).map((member, idx) => (
                                    <div
                                      key={idx}
                                      className="w-8 h-8 rounded-full bg-primary/20 border-2 border-background flex items-center justify-center text-xs font-semibold"
                                    >
                                      {member.name.charAt(0).toUpperCase()}
                                    </div>
                                  ))}
                                  {project.members.length > 4 && (
                                    <div className="w-8 h-8 rounded-full bg-muted border-2 border-background flex items-center justify-center text-xs font-semibold">
                                      +{project.members.length - 4}
                                    </div>
                                  )}
                                </div>
                              )}
                            </CardContent>
                          </Card>
                        )
                      })}
                    </div>
                  ) : (
                    <Card className="border-dashed">
                      <CardContent className="flex flex-col items-center justify-center py-16 text-center">
                        <FolderKanban className="h-16 w-16 text-muted-foreground opacity-50 mb-4" />
                        <h3 className="font-semibold mb-2">No projects yet</h3>
                        <p className="text-sm text-muted-foreground mb-4">
                          Create your first project to get started
                        </p>
                        <Button>
                          <Plus className="mr-2 h-4 w-4" />
                          New Project
                        </Button>
                      </CardContent>
                    </Card>
                  )}
                </div>
              </div>
            )}

            {/* Other Sections - Placeholders */}
            {activeSection === "calendar" && (
              <Card>
                <CardContent className="py-16 text-center">
                  <Calendar className="h-16 w-16 mx-auto text-muted-foreground opacity-50 mb-4" />
                  <h3 className="font-semibold mb-2">Calendar View</h3>
                  <p className="text-sm text-muted-foreground">Coming soon</p>
                </CardContent>
              </Card>
            )}

            {activeSection === "team" && (
              <Card>
                <CardHeader>
                  <CardTitle>Team Members</CardTitle>
                  <CardDescription>{board.members?.length || 0} members</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {board.members?.map((member, idx) => (
                      <div key={idx} className="flex items-center gap-3 p-3 border rounded-lg">
                        <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center font-semibold">
                          {member.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="font-medium">{member.name}</p>
                          <p className="text-sm text-muted-foreground">Member</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {activeSection === "reports" && (
              <Card>
                <CardContent className="py-16 text-center">
                  <BarChart className="h-16 w-16 mx-auto text-muted-foreground opacity-50 mb-4" />
                  <h3 className="font-semibold mb-2">Reports & Analytics</h3>
                  <p className="text-sm text-muted-foreground">Coming soon</p>
                </CardContent>
              </Card>
            )}

            {activeSection === "wiki" && (
              <Card>
                <CardContent className="py-16 text-center">
                  <BookOpen className="h-16 w-16 mx-auto text-muted-foreground opacity-50 mb-4" />
                  <h3 className="font-semibold mb-2">Wiki & Documentation</h3>
                  <p className="text-sm text-muted-foreground">Coming soon</p>
                </CardContent>
              </Card>
            )}

            {activeSection === "settings" && (
              <Card>
                <CardHeader>
                  <CardTitle>Board Settings</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <label className="text-sm font-medium">Board Name</label>
                    <input
                      type="text"
                      defaultValue={board.title}
                      className="mt-2 w-full px-3 py-2 border rounded-lg bg-background"
                      disabled
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium">Description</label>
                    <textarea
                      defaultValue={board.description}
                      className="mt-2 w-full px-3 py-2 border rounded-lg bg-background resize-none"
                      rows={3}
                      disabled
                    />
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
