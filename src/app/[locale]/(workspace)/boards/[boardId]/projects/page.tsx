"use client"

import type { Board } from "@/types/dbInterface"
import {
  BarChart3,
  Calendar,
  Filter,
  Plus,
  TrendingUp,
  TrendingDown,
  AlertCircle,
  Users,
  Zap
} from "lucide-react"
import { useParams, useRouter } from "next/navigation"
import { useMemo, useState, useEffect } from "react"

import { StatCard } from "@/components/common"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useBoards } from "@/hooks/useBoards"
import { apiClient } from "@/lib/api/client"
import { useTaskStore } from "@/lib/store"

export default function BoardProjectsPage() {
  const params = useParams()
  const router = useRouter()
  const boardId = Array.isArray(params.boardId) ? params.boardId[0] : params.boardId
  const projects = useTaskStore((state) => state.projects)
  const myBoards = useTaskStore((state) => state.myBoards)
  const teamBoards = useTaskStore((state) => state.teamBoards)
  const fetchProjects = useTaskStore((state) => state.fetchProjects)
  const { fetchBoards, loading: boardsLoading } = useBoards()
  const [viewMode, setViewMode] = useState<"grid" | "team" | "timeline">("grid")
  const [statusFilter, setStatusFilter] = useState<"all" | "on_track" | "at_risk" | "off_track">(
    "all"
  )
  const [apiBoard, setApiBoard] = useState<Pick<Board, "_id" | "title" | "description"> | null>(
    null
  )
  const [resolvingBoard, setResolvingBoard] = useState(false)

  const boards = useMemo(() => {
    return [...myBoards, ...teamBoards]
  }, [myBoards, teamBoards])

  const board = useMemo(() => {
    const fromStore = boards.find((b) => String(b._id) === String(boardId))
    if (fromStore) {
      return fromStore
    }
    if (apiBoard && String(apiBoard._id) === String(boardId)) {
      return {
        _id: apiBoard._id,
        title: apiBoard.title,
        description: apiBoard.description || "",
        organizationId: "",
        owner: { id: "", name: "" },
        members: [],
        projects: [],
        listIds: [],
        isPrivate: true,
        isArchived: false,
        createdAt: new Date(),
        updatedAt: new Date()
      } as Board
    }
    return null
  }, [boards, boardId, apiBoard])

  useEffect(() => {
    if (boardId) {
      fetchProjects(boardId)
    }
  }, [boardId, fetchProjects])

  useEffect(() => {
    if (!boardId || boardsLoading) {
      return
    }
    const inStore = boards.some((b) => String(b._id) === String(boardId))
    if (inStore) {
      setApiBoard(null)
      setResolvingBoard(false)
      return
    }

    let cancelled = false
    setResolvingBoard(true)
    ;(async () => {
      try {
        const res = await apiClient.get(`/api/boards/${boardId}`)
        if (cancelled) {
          return
        }
        if (res.ok) {
          const data = await res.json()
          setApiBoard({
            _id: data._id,
            title: data.title,
            description: data.description
          })
        } else {
          setApiBoard(null)
        }
      } catch {
        if (!cancelled) {
          setApiBoard(null)
        }
      } finally {
        if (!cancelled) {
          setResolvingBoard(false)
        }
      }
    })()

    return () => {
      cancelled = true
    }
  }, [boardId, boardsLoading, boards])

  useEffect(() => {
    if (boardId) {
      fetchBoards()
    }
  }, [boardId, fetchBoards])

  // Use real projects from database (filter out archived)
  const displayProjects = (projects || []).filter((p) => !p.isArchived)

  // For now, just use all projects (status filtering can be added later)
  const filteredProjects = displayProjects

  // Get archived projects as "attention-needed" for now
  const attentionNeeded = (projects || []).filter((p) => p.isArchived)

  if (boardId && !board && (boardsLoading || resolvingBoard)) {
    return (
      <div className="flex h-screen items-center justify-center">
        <p className="text-sm text-muted-foreground">Loading board…</p>
      </div>
    )
  }

  if (!board) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Card>
          <CardHeader>
            <CardTitle>Board not found</CardTitle>
            <CardDescription>
              The board you&apos;re looking for doesn&apos;t exist or you don&apos;t have access.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button
              onClick={() => {
                router.push("/boards")
              }}
            >
              Back to Boards
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="relative min-h-full overflow-hidden pb-32">
      {/* Dynamic Background Glows */}
      <div className="pointer-events-none absolute top-20 right-[5%] -z-10 h-[600px] w-[600px] rounded-full bg-blue-500/5 blur-[140px]" />
      <div className="pointer-events-none absolute bottom-40 left-[10%] -z-10 h-[500px] w-[500px] rounded-full bg-indigo-500/5 blur-[120px]" />
      <div className="pointer-events-none absolute top-[30%] left-[20%] -z-10 h-[400px] w-[400px] rounded-full bg-emerald-500/5 blur-[100px]" />

      <div className="mx-auto max-w-[1600px] space-y-12 p-8 lg:p-12">
        {/* Header Section */}
        <div className="flex flex-col justify-between gap-8 pt-4 md:flex-row md:items-end">
          <div className="flex items-center gap-6">
            <div className="group relative">
              <div className="absolute -inset-2 rounded-3xl bg-gradient-to-r from-blue-600 to-indigo-700 opacity-20 blur transition duration-1000 group-hover:opacity-40 group-hover:duration-200" />
              <div className="relative flex h-20 w-20 items-center justify-center rounded-3xl bg-gradient-to-br from-blue-600 to-indigo-700 text-white shadow-2xl shadow-blue-500/30 transition-transform duration-500 group-hover:scale-105">
                <BarChart3 className="h-10 w-10 stroke-[2.5]" />
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex items-center gap-3">
                <span className="rounded-full border border-blue-100 bg-blue-50 px-3 py-1 text-[10px] font-black tracking-[0.2em] text-blue-600 uppercase shadow-sm dark:border-blue-800 dark:bg-blue-900/30 dark:text-blue-400">
                  Board Projects
                </span>
              </div>
              <h1 className="text-5xl leading-[0.9] font-black tracking-tighter text-slate-900 dark:text-white">
                {board.title}
              </h1>
              <p className="text-lg font-medium text-slate-500 italic opacity-80 dark:text-slate-400">
                {displayProjects.length} projects · {board.description || "Project Overview"}
              </p>
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-3 pb-2">
            <Button className="h-12 gap-2 rounded-2xl bg-blue-600 px-6 text-[10px] font-black tracking-widest uppercase shadow-lg hover:bg-blue-700">
              <Plus className="h-4 w-4" />
              New Project
            </Button>
          </div>
        </div>

        {/* Project Metrics */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          <StatCard
            title="Total Projects"
            value={displayProjects.length}
            subtitle="Projects in this board"
            icon={BarChart3}
            variant="default"
          />
          <StatCard
            title="Active"
            value={displayProjects.length}
            subtitle="Currently active projects"
            icon={TrendingUp}
            variant="success"
          />
          <StatCard
            title="Archived"
            value={(projects || []).filter((p) => p.isArchived).length}
            subtitle="Archived projects"
            icon={AlertCircle}
            variant="warning"
          />
          <StatCard
            title="Team Members"
            value={board?.members?.length || 0}
            subtitle="Project team"
            icon={TrendingDown}
            variant="danger"
          />
        </div>

        {/* Tabs and Filter */}
        <div className="space-y-8">
          <Tabs
            value={viewMode}
            onValueChange={(v) => {
              setViewMode(v as any)
            }}
            className="w-full"
          >
            <div className="mb-10 flex flex-col justify-between gap-6 border-b border-slate-100 pb-2 md:flex-row md:items-center dark:border-slate-800">
              <TabsList className="h-14 w-full rounded-2xl bg-slate-100/50 p-1 md:w-auto dark:bg-slate-900/50">
                <TabsTrigger
                  value="grid"
                  className="rounded-xl px-8 text-[10px] font-black tracking-widest uppercase data-[state=active]:bg-white data-[state=active]:text-blue-600 data-[state=active]:shadow-lg dark:data-[state=active]:bg-slate-800"
                >
                  <BarChart3 className="mr-2 h-4 w-4" />
                  Project Grid
                </TabsTrigger>
                <TabsTrigger
                  value="team"
                  className="rounded-xl px-8 text-[10px] font-black tracking-widest uppercase data-[state=active]:bg-white data-[state=active]:text-blue-600 data-[state=active]:shadow-lg dark:data-[state=active]:bg-slate-800"
                >
                  <Users className="mr-2 h-4 w-4" />
                  Team View
                </TabsTrigger>
                <TabsTrigger
                  value="timeline"
                  className="rounded-xl px-8 text-[10px] font-black tracking-widest uppercase data-[state=active]:bg-white data-[state=active]:text-blue-600 data-[state=active]:shadow-lg dark:data-[state=active]:bg-slate-800"
                >
                  <Calendar className="mr-2 h-4 w-4" />
                  Timeline
                </TabsTrigger>
              </TabsList>

              <div className="flex gap-3">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="outline"
                      className="h-12 gap-2 rounded-2xl border-slate-100 bg-white px-6 text-[10px] font-black tracking-widest uppercase shadow-sm transition-all hover:shadow-md dark:bg-slate-950"
                    >
                      <Filter className="h-4 w-4 text-blue-600" />
                      Status Filter:{" "}
                      <span className="text-blue-600">
                        {statusFilter === "all" ? "All" : statusFilter.replace("_", " ")}
                      </span>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent
                    align="end"
                    className="w-56 rounded-2xl border-slate-100 p-2 shadow-2xl"
                  >
                    <DropdownMenuLabel className="p-3 text-[10px] font-black tracking-[0.2em] text-slate-400 uppercase">
                      Filter Options
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      onClick={() => {
                        setStatusFilter("all")
                      }}
                      className="gap-3 rounded-xl py-3 font-bold"
                    >
                      All Statuses
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => {
                        setStatusFilter("on_track")
                      }}
                      className="gap-3 rounded-xl py-3 font-bold"
                    >
                      On Track
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => {
                        setStatusFilter("at_risk")
                      }}
                      className="gap-3 rounded-xl py-3 font-bold text-amber-600"
                    >
                      At Risk
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => {
                        setStatusFilter("off_track")
                      }}
                      className="gap-3 rounded-xl py-3 font-bold text-rose-600"
                    >
                      Off Track
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>

            <TabsContent value="grid" className="m-0 focus-visible:outline-none">
              {filteredProjects.length === 0 ? (
                <div className="space-y-6 rounded-[3rem] border-2 border-dashed border-slate-100 bg-slate-50/50 py-40 text-center dark:border-slate-800 dark:bg-slate-900/10">
                  <div className="mx-auto flex h-24 w-24 items-center justify-center rounded-[3rem] bg-white text-slate-200 shadow-sm dark:bg-slate-800">
                    <Zap className="h-12 w-12" />
                  </div>
                  <div>
                    <h4 className="mb-2 text-2xl font-black text-slate-900 italic dark:text-white">
                      No Projects Found
                    </h4>
                    <p className="text-lg font-medium text-slate-500 italic opacity-60">
                      No projects match the selected filters.
                    </p>
                  </div>
                </div>
              ) : (
                <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
                  {filteredProjects.map((project) => (
                    <ProjectCard key={project._id} project={project} />
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="team" className="m-0 focus-visible:outline-none">
              <div className="py-20 text-center text-slate-500">
                <p>Team view coming soon</p>
              </div>
            </TabsContent>

            <TabsContent value="timeline" className="m-0 focus-visible:outline-none">
              <div className="py-20 text-center text-slate-500">
                <p>Timeline view coming soon</p>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  )
}

const ProjectCard = ({ project }: { project: any }) => {
  return (
    <Card className="group relative overflow-hidden rounded-2xl border-slate-100 transition-all duration-300 hover:shadow-lg dark:border-slate-800">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <CardTitle className="text-lg">{project.title}</CardTitle>
            <CardDescription className="mt-2">{project.description}</CardDescription>
          </div>
          <div
            className={`rounded-lg px-3 py-1 text-xs font-semibold ${
              project.status === "on_track"
                ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400"
                : project.status === "at_risk"
                  ? "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400"
                  : "bg-rose-100 text-rose-800 dark:bg-rose-900/30 dark:text-rose-400"
            }`}
          >
            {project.status?.replace("_", " ")}
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-slate-600 dark:text-slate-400">Progress</span>
            <span className="font-semibold">{project.progress || 0}%</span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
            <div
              className="h-full bg-gradient-to-r from-blue-500 to-indigo-600 transition-all"
              style={{ width: `${project.progress || 0}%` }}
            />
          </div>
        </div>
        <div className="flex items-center justify-between text-sm text-slate-600 dark:text-slate-400">
          <span>{project.taskCount || 0} tasks</span>
          <span>By {project.owner || "Unknown"}</span>
        </div>
      </CardContent>
    </Card>
  )
}
