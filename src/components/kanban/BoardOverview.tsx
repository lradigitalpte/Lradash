"use client"

import {
  FolderKanban,
  LayoutGrid,
  List,
  MoreHorizontal,
  Plus,
  Users,
  Search,
  Filter,
  ArrowRight,
  TrendingUp,
  Shield,
  Zap,
  Layout
} from "lucide-react"
import { useTranslations } from "next-intl"
import { useSearchParams } from "next/navigation"
import { useEffect, useState, useRef } from "react"
import { toast } from "sonner"

import { AvatarGroup, EmptyState, StatCard, SearchInput } from "@/components/common"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select"
import { Skeleton } from "@/components/ui/skeleton"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useBoards } from "@/hooks/useBoards"
import { usePathname, useRouter } from "@/i18n/navigation"
import { cn } from "@/lib/utils"

import { BoardActions } from "./board/BoardActions"
import NewBoardDialog from "./board/NewBoardDialog"

type FilterType = "all" | "my" | "team"
type ViewType = "grid" | "list"

export function BoardOverview() {
  const { myBoards, teamBoards, loading, fetchBoards } = useBoards()
  const fetchBoardsRef = useRef(fetchBoards)
  const [search, setSearch] = useState("")
  const [filter, setFilter] = useState<FilterType>("all")
  const [view, setView] = useState<ViewType>("grid")
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const t = useTranslations("kanban")
  const tLogin = useTranslations("login")

  // Keep ref updated with latest fetchBoards
  useEffect(() => {
    fetchBoardsRef.current = fetchBoards
  }, [fetchBoards])

  useEffect(() => {
    const loginSuccess = searchParams.get("login_success")
    if (loginSuccess === "true") {
      const timer = setTimeout(() => {
        toast.success(tLogin("success"))
        const params = new URLSearchParams(searchParams.toString())
        params.delete("login_success")
        router.replace(`${pathname}?${params.toString()}`, { scroll: false })
      }, 500)
      return () =>{  clearTimeout(timer); }
    }
  }, [searchParams, router, pathname, tLogin])

  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        fetchBoardsRef.current().catch(console.error)
      }
    }
    document.addEventListener("visibilitychange", handleVisibilityChange)
    return () =>{  document.removeEventListener("visibilitychange", handleVisibilityChange); }
  }, []) // Empty deps - only set up listener once

  const filteredMyBoards = myBoards?.filter((board) =>
    board.title.toLowerCase().includes(search.toLowerCase())
  )

  const filteredTeamBoards: any[] = []

  const shouldShowMyBoards = true
  const shouldShowTeamBoards = false

  const handleBoardClick = (boardId: string) => {
    router.push(`/boards/${boardId}/projects`)
  }

  const totalBoards = filteredMyBoards?.length || 0

  return (
    <div className="relative min-h-full overflow-hidden pb-32">
      {/* Dynamic Background Glows */}
      <div className="pointer-events-none absolute top-20 right-[15%] -z-10 h-[600px] w-[600px] rounded-full bg-blue-500/5 blur-[140px]" />
      <div className="pointer-events-none absolute bottom-40 left-[20%] -z-10 h-[500px] w-[500px] rounded-full bg-indigo-500/5 blur-[120px]" />

      <div className="mx-auto max-w-[1600px] space-y-12 p-8 lg:p-12">
        {/* WOW Header Section */}
        <div className="flex flex-col justify-between gap-8 pt-4 md:flex-row md:items-end">
          <div className="flex items-center gap-6">
            <div className="group relative">
              <div className="absolute -inset-2 rounded-3xl bg-gradient-to-r from-blue-600 to-indigo-700 opacity-20 blur transition duration-1000 group-hover:opacity-40 group-hover:duration-200" />
              <div className="relative flex h-20 w-20 items-center justify-center rounded-3xl bg-gradient-to-br from-blue-600 to-indigo-700 text-white shadow-2xl shadow-blue-500/30 transition-transform duration-500 group-hover:scale-105">
                <Layout className="h-10 w-10 stroke-[2.5]" />
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex items-center gap-3">
                <span className="rounded-full border border-blue-100 bg-blue-50 px-3 py-1 text-[10px] font-black tracking-[0.2em] text-blue-600 uppercase shadow-sm dark:border-blue-800 dark:bg-blue-900/30 dark:text-blue-400">
                  Personal Boards
                </span>
                <div className="h-1 w-1 rounded-full bg-slate-200 dark:bg-slate-700" />
                <span className="text-[10px] font-black tracking-[0.2em] text-slate-400 uppercase italic">
                  Workspaces: Private
                </span>
              </div>
              <h1 className="text-5xl leading-[0.9] font-black tracking-tighter text-slate-900 dark:text-white">
                My{" "}
                <span className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                  Boards
                </span>
              </h1>
              <p className="text-lg font-medium text-slate-500 italic opacity-80 dark:text-slate-400">
                Organize and track your private projects and personal workflows
              </p>
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-3 pb-2">
            <NewBoardDialog>
              <Button
                size="lg"
                className="group relative h-14 gap-3 overflow-hidden rounded-2xl bg-slate-900 px-8 text-sm font-black tracking-widest text-white uppercase shadow-2xl transition-all hover:scale-105 dark:bg-white dark:text-slate-900"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-blue-600/20 to-indigo-600/20 opacity-0 transition-opacity group-hover:opacity-100" />
                <Plus className="h-5 w-5 stroke-[3]" />
                Create Board
              </Button>
            </NewBoardDialog>
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          <StatCard
            title="Total Boards"
            value={totalBoards}
            subtitle="All private boards"
            icon={Layout}
            variant="primary"
          />
          <StatCard
            title="Active Boards"
            value={filteredMyBoards?.length || 0}
            subtitle="Personal workflows"
            icon={Shield}
            variant="default"
          />
          <StatCard
            title="Archived"
            value={0}
            subtitle="Previous boards"
            icon={Users}
            variant="warning"
          />
          <StatCard
            title="Privacy Level"
            value="High"
            subtitle="Only you can see these"
            icon={Zap}
            variant="success"
          />
        </div>

        <div className="flex flex-col justify-between gap-6 border-b border-slate-100 pb-2 md:flex-row md:items-center dark:border-slate-800">
          <div className="flex items-center gap-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-900 text-white shadow-xl dark:bg-white dark:text-slate-900">
              <FolderKanban className="h-5 w-5" />
            </div>
            <h2 className="text-2xl font-black tracking-tight uppercase">Board Directory</h2>
          </div>

          <div className="flex items-center gap-3">
            <div className="group relative">
              <Search className="absolute top-1/2 left-4 h-4 w-4 -translate-y-1/2 text-slate-400 transition-colors group-hover:text-blue-500" />
              <input
                type="text"
                placeholder="Search boards..."
                value={search}
                onChange={(e) =>{  setSearch(e.target.value); }}
                className="h-12 w-full rounded-2xl border border-slate-100 bg-white pr-6 pl-12 text-xs font-bold shadow-sm transition-all placeholder:text-slate-400 focus:ring-2 focus:ring-blue-500/20 md:w-64 dark:border-slate-800 dark:bg-slate-950"
              />
            </div>

            <Select value="my" disabled>
              <SelectTrigger className="h-12 w-[160px] gap-2 rounded-2xl border-slate-100 bg-white text-[10px] font-black tracking-widest uppercase shadow-sm dark:bg-slate-950">
                <div className="flex items-center gap-2">
                  <Filter className="h-3 w-3 text-blue-600" />
                  <span>Personal Only</span>
                </div>
              </SelectTrigger>
              <SelectContent className="rounded-2xl border-slate-100 p-2 shadow-2xl">
                <SelectItem value="my" className="rounded-xl py-3 font-bold">
                  Personal Boards
                </SelectItem>
              </SelectContent>
            </Select>

            <div className="flex h-12 rounded-2xl bg-slate-100 p-1 dark:bg-slate-800">
              <button
                onClick={() =>{  setView("grid"); }}
                className={cn(
                  "flex h-10 w-10 items-center justify-center rounded-xl transition-all",
                  view === "grid"
                    ? "bg-white text-blue-600 shadow-sm dark:bg-slate-700"
                    : "text-slate-400 hover:text-slate-600"
                )}
              >
                <LayoutGrid className="h-4 w-4" />
              </button>
              <button
                onClick={() =>{  setView("list"); }}
                className={cn(
                  "flex h-10 w-10 items-center justify-center rounded-xl transition-all",
                  view === "list"
                    ? "bg-white text-blue-600 shadow-sm dark:bg-slate-700"
                    : "text-slate-400 hover:text-slate-600"
                )}
              >
                <List className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Content Matrix */}
        <div className="flex-1">
          {loading ? (
            <LoadingSkeleton view={view} />
          ) : totalBoards === 0 ? (
            <div className="py-32">
              <EmptyState
                icon={FolderKanban}
                title="No boards found"
                description={
                  search
                    ? "Adjust your search parameters"
                    : "Create your first board to start managing projects"
                }
                action={
                  search
                    ? undefined
                    : {
                        label: "Create Board",
                        onClick: () => {}
                      }
                }
              />
            </div>
          ) : (
            <div className="space-y-16">
              {/* My Boards Section */}
              {shouldShowMyBoards && filteredMyBoards && filteredMyBoards.length > 0 && (
                <section className="space-y-8">
                  <div className="flex items-center gap-4">
                    <span className="h-px flex-1 bg-slate-100 dark:bg-slate-800" />
                    <div className="rounded-full border border-slate-100 bg-slate-50 px-6 py-2 dark:border-slate-800 dark:bg-slate-900">
                      <h2 className="text-[10px] font-black tracking-[0.3em] text-slate-400 uppercase">
                        {t("myBoards")}
                      </h2>
                    </div>
                    <span className="h-px flex-1 bg-slate-100 dark:bg-slate-800" />
                  </div>
                  <BoardGrid
                    boards={filteredMyBoards}
                    view={view}
                    onBoardClick={handleBoardClick}
                    t={t}
                    isOwner
                  />
                </section>
              )}

              {/* Team Boards Section */}
              {shouldShowTeamBoards && filteredTeamBoards && filteredTeamBoards.length > 0 && (
                <section className="space-y-8">
                  <div className="flex items-center gap-4">
                    <span className="h-px flex-1 bg-slate-100 dark:bg-slate-800" />
                    <div className="rounded-full border border-slate-100 bg-slate-50 px-6 py-2 dark:border-slate-800 dark:bg-slate-900">
                      <h2 className="text-[10px] font-black tracking-[0.3em] text-slate-400 uppercase">
                        {t("teamBoards")}
                      </h2>
                    </div>
                    <span className="h-px flex-1 bg-slate-100 dark:bg-slate-800" />
                  </div>
                  <BoardGrid
                    boards={filteredTeamBoards}
                    view={view}
                    onBoardClick={handleBoardClick}
                    t={t}
                  />
                </section>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// Board Grid/List Component
interface BoardGridProps {
  boards: any[]
  view: ViewType
  onBoardClick: (id: string) => void
  t: any
  isOwner?: boolean
}

function BoardGrid({ boards, view, onBoardClick, t, isOwner = false }: BoardGridProps) {
  if (view === "list") {
    return (
      <div className="space-y-4">
        {boards.map((board) => (
          <Card
            key={board._id}
            className="group cursor-pointer overflow-hidden rounded-[2rem] border-none bg-white/60 shadow-[0_8px_30px_rgb(0,0,0,0.04)] backdrop-blur-xl transition-all duration-500 hover:-translate-y-1 hover:shadow-[0_32px_64px_-16px_rgba(0,0,0,0.08)] dark:bg-slate-900/60 dark:shadow-none"
            onClick={() =>{  onBoardClick(board._id); }}
          >
            <CardContent className="flex items-center justify-between p-6">
              <div className="flex items-center gap-6">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-50 shadow-inner transition-transform duration-500 group-hover:scale-110 dark:bg-slate-800">
                  <FolderKanban className="h-6 w-6 text-blue-600" />
                </div>
                <div>
                  <h3 className="text-xl font-black tracking-tight uppercase transition-colors group-hover:text-blue-600">
                    {board.title}
                  </h3>
                  <div className="mt-1 flex items-center gap-3 text-[10px] font-black tracking-widest text-slate-400 uppercase transition-colors">
                    <span className="flex items-center gap-1.5 rounded-lg bg-slate-100 px-2 py-0.5 dark:bg-slate-800/50">
                      {board.projects?.length || 0} Projects
                    </span>
                    <span>•</span>
                    <span className="flex items-center gap-1.5 rounded-lg bg-slate-100 px-2 py-0.5 dark:bg-slate-800/50">
                      {board.members?.length || 0} Members
                    </span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-6">
                {board.members && board.members.length > 0 && (
                  <AvatarGroup
                    users={board.members.map((m: any) => ({ name: m.name }))}
                    max={3}
                    size="sm"
                  />
                )}
                <div className="flex items-center gap-2">
                  {isOwner && (
                    <BoardActions board={board} asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-12 w-12 rounded-xl opacity-0 transition-all group-hover:opacity-100"
                        onClick={(e) =>{  e.stopPropagation(); }}
                      >
                        <MoreHorizontal className="h-5 w-5" />
                      </Button>
                    </BoardActions>
                  )}
                  <div className="flex h-12 w-12 translate-x-4 items-center justify-center rounded-xl bg-slate-50 opacity-0 transition-all duration-500 group-hover:translate-x-0 group-hover:opacity-100 dark:bg-slate-800">
                    <ArrowRight className="h-5 w-5 text-blue-600" />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {boards.map((board) => (
        <Card
          key={board._id}
          className="group cursor-pointer overflow-hidden rounded-[2.5rem] border-none bg-white/60 shadow-[0_8px_30px_rgb(0,0,0,0.04)] backdrop-blur-xl transition-all duration-500 hover:-translate-y-2 hover:shadow-[0_32px_64px_-16px_rgba(0,0,0,0.08)] dark:bg-slate-900/60 dark:shadow-none"
          onClick={() =>{  onBoardClick(board._id); }}
        >
          <CardContent className="p-0">
            {/* Card Header with modern gradient and blur */}
            <div className="relative flex h-32 items-start justify-between overflow-hidden p-6">
              <div className="absolute inset-0 bg-gradient-to-br from-blue-600/10 via-indigo-600/5 to-transparent transition-transform duration-700 group-hover:scale-110" />
              <div className="absolute -top-12 -right-12 h-32 w-32 rounded-full bg-blue-500/10 blur-3xl" />

              <div className="relative z-10 flex h-14 w-14 items-center justify-center rounded-2xl bg-white/80 shadow-lg backdrop-blur-md transition-transform duration-500 group-hover:translate-y-[-2px] dark:bg-slate-900/80">
                <FolderKanban className="h-6 w-6 stroke-[2.5] text-blue-600" />
              </div>

              {isOwner && (
                <div className="relative z-10 opacity-0 transition-opacity duration-300 group-hover:opacity-100">
                  <BoardActions board={board} asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-10 w-10 rounded-xl bg-white/80 backdrop-blur-md dark:bg-slate-900/80"
                      onClick={(e) =>{  e.stopPropagation(); }}
                    >
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </BoardActions>
                </div>
              )}
            </div>

            {/* Card Body with technical details */}
            <div className="p-8 pt-2">
              <h3 className="text-2xl leading-tight font-black tracking-tight uppercase transition-colors group-hover:text-blue-600">
                {board.title}
              </h3>
              <p className="mt-3 line-clamp-2 text-sm leading-relaxed font-medium text-slate-500 italic opacity-80 dark:text-slate-400">
                {board.description || "System architecture synchronization protocol initiated..."}
              </p>

              {/* Stats and metadata */}
              <div className="mt-8 flex items-center justify-between border-t border-slate-100 pt-6 dark:border-slate-800">
                <div className="flex items-center gap-4 text-[10px] font-black tracking-widest text-slate-400 uppercase">
                  <span className="flex items-center gap-2">
                    <TrendingUp className="h-3.5 w-3.5" />
                    {board.projects?.length || 0}
                  </span>
                  <div className="h-1 w-1 rounded-full bg-slate-200 dark:bg-slate-700" />
                  <span className="flex items-center gap-2">
                    <Users className="h-3.5 w-3.5" />
                    {board.members?.length || 0}
                  </span>
                </div>
                {board.members && board.members.length > 0 && (
                  <AvatarGroup
                    users={board.members.map((m: any) => ({ name: m.name }))}
                    max={3}
                    size="xs"
                  />
                )}
              </div>

              {/* Owner info for team boards */}
              {!isOwner && board.owner && (
                <div className="mt-4 flex items-center gap-3">
                  <div className="h-px flex-1 bg-slate-50 dark:bg-slate-800" />
                  <p className="text-[9px] font-black tracking-widest text-slate-300 uppercase italic">
                    Architect: {board.owner.name}
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

// Loading Skeleton
function LoadingSkeleton({ view }: { view: ViewType }) {
  if (view === "list") {
    return (
      <div className="space-y-4">
        {[1, 2, 3, 4].map((i) => (
          <Skeleton key={i} className="h-24 w-full rounded-[2rem]" />
        ))}
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {[1, 2, 3, 4, 5, 6].map((i) => (
        <Skeleton key={i} className="h-[320px] w-full rounded-[2.5rem]" />
      ))}
    </div>
  )
}
