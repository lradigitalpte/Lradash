"use client"

import { FolderKanban, LayoutGrid, List, MoreHorizontal, Plus, Users } from "lucide-react"
import { useTranslations } from "next-intl"
import { useSearchParams } from "next/navigation"
import { useEffect, useState } from "react"
import { toast } from "sonner"

import { AvatarGroup, EmptyState, SearchInput } from "@/components/common"
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
  const [search, setSearch] = useState("")
  const [filter, setFilter] = useState<FilterType>("all")
  const [view, setView] = useState<ViewType>("grid")
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const t = useTranslations("kanban")
  const tLogin = useTranslations("login")

  useEffect(() => {
    const loginSuccess = searchParams.get("login_success")
    if (loginSuccess === "true") {
      const timer = setTimeout(() => {
        toast.success(tLogin("success"))
        const params = new URLSearchParams(searchParams.toString())
        params.delete("login_success")
        router.replace(`${pathname}?${params.toString()}`, { scroll: false })
      }, 500)
      return () => clearTimeout(timer)
    }
  }, [searchParams, router, pathname, tLogin])

  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        fetchBoards().catch(console.error)
      }
    }
    document.addEventListener("visibilitychange", handleVisibilityChange)
    return () => document.removeEventListener("visibilitychange", handleVisibilityChange)
  }, [fetchBoards])

  const filteredMyBoards = myBoards?.filter((board) =>
    board.title.toLowerCase().includes(search.toLowerCase())
  )

  const filteredTeamBoards = teamBoards?.filter((board) =>
    board.title.toLowerCase().includes(search.toLowerCase())
  )

  const shouldShowMyBoards = filter === "all" || filter === "my"
  const shouldShowTeamBoards = filter === "all" || filter === "team"

  const handleBoardClick = (boardId: string) => {
    // Navigate to projects page for this board instead of kanban view
    router.push(`/boards/${boardId}/projects`)
  }

  const totalBoards = (filteredMyBoards?.length || 0) + (filteredTeamBoards?.length || 0)

  return (
    <div className="flex h-full flex-col">
      {/* Page Header */}
      <div className="border-b bg-background px-6 py-4">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Boards</h1>
            <p className="text-sm text-muted-foreground">
              {loading ? "Loading..." : `${totalBoards} boards total`}
            </p>
          </div>
          <NewBoardDialog>
            <Button data-testid="new-board-trigger">
              <Plus className="mr-2 h-4 w-4" />
              {t("newBoard")}
            </Button>
          </NewBoardDialog>
        </div>

        {/* Filters Row */}
        <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-1 items-center gap-3">
            <SearchInput
              placeholder={t("searchBoards")}
              value={search}
              onChange={setSearch}
              className="max-w-xs"
            />
            <Select value={filter} onValueChange={(value: FilterType) => setFilter(value)}>
              <SelectTrigger className="w-[140px]" data-testid="select-filter-trigger">
                <SelectValue placeholder={t("filterBoards")} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all" data-testid="selectAllBoards">
                  {t("allBoards")}
                </SelectItem>
                <SelectItem value="my" data-testid="selectMyBoards">
                  {t("myBoards")}
                </SelectItem>
                <SelectItem value="team" data-testid="selectTeamBoards">
                  {t("teamBoards")}
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* View Toggle */}
          <Tabs value={view} onValueChange={(v) => setView(v as ViewType)} className="hidden sm:block">
            <TabsList className="h-9">
              <TabsTrigger value="grid" className="px-3">
                <LayoutGrid className="h-4 w-4" />
              </TabsTrigger>
              <TabsTrigger value="list" className="px-3">
                <List className="h-4 w-4" />
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-6">
        {loading ? (
          <LoadingSkeleton view={view} />
        ) : totalBoards === 0 ? (
          <EmptyState
            icon={FolderKanban}
            title="No boards found"
            description={search ? "Try a different search term" : "Create your first board to get started"}
            action={
              search
                ? undefined
                : {
                    label: "Create Board",
                    onClick: () => {}
                  }
            }
          />
        ) : (
          <div className="space-y-8">
            {/* My Boards Section */}
            {shouldShowMyBoards && filteredMyBoards && filteredMyBoards.length > 0 && (
              <section>
                <div className="mb-4">
                  <h2 className="text-lg font-semibold" data-testid="myBoardsTitle">
                    {t("myBoards")}
                  </h2>
                  <p className="text-sm text-muted-foreground">{t("myBoardsDescription")}</p>
                </div>
                <BoardGrid boards={filteredMyBoards} view={view} onBoardClick={handleBoardClick} t={t} isOwner />
              </section>
            )}

            {/* Team Boards Section */}
            {shouldShowTeamBoards && filteredTeamBoards && filteredTeamBoards.length > 0 && (
              <section>
                <div className="mb-4">
                  <h2 className="text-lg font-semibold" data-testid="teamBoardsTitle">
                    {t("teamBoards")}
                  </h2>
                  <p className="text-sm text-muted-foreground">{t("teamBoardsDescription")}</p>
                </div>
                <BoardGrid boards={filteredTeamBoards} view={view} onBoardClick={handleBoardClick} t={t} />
              </section>
            )}
          </div>
        )}
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
      <div className="space-y-2">
        {boards.map((board) => (
          <Card
            key={board._id}
            className="cursor-pointer transition-all hover:border-primary hover:shadow-sm"
            onClick={() => onBoardClick(board._id)}
          >
            <CardContent className="flex items-center justify-between p-4">
              <div className="flex items-center gap-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                  <FolderKanban className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h3 className="font-medium">{board.title}</h3>
                  <p className="text-sm text-muted-foreground">
                    {board.projects?.length || 0} projects · {board.members?.length || 0} members
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                {board.members && board.members.length > 0 && (
                  <AvatarGroup users={board.members.map((m: any) => ({ name: m.name }))} max={3} size="sm" />
                )}
                {isOwner && (
                  <BoardActions board={board} asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </BoardActions>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {boards.map((board) => (
        <Card
          key={board._id}
          className="group cursor-pointer transition-all hover:border-primary hover:shadow-md"
          onClick={() => onBoardClick(board._id)}
        >
          <CardContent className="p-0">
            {/* Card Header with gradient */}
            <div className="relative h-24 rounded-t-lg bg-gradient-to-br from-primary/20 via-primary/10 to-transparent p-4">
              <div className="flex items-start justify-between">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-background/80 backdrop-blur">
                  <FolderKanban className="h-5 w-5 text-primary" />
                </div>
                {isOwner && (
                  <BoardActions board={board} asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 bg-background/80 opacity-0 backdrop-blur transition-opacity group-hover:opacity-100"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </BoardActions>
                )}
              </div>
            </div>

            {/* Card Body */}
            <div className="p-4">
              <h3 className="font-semibold group-hover:text-primary">{board.title}</h3>
              <p className="mt-1 text-sm text-muted-foreground line-clamp-2">
                {board.description || t("noDescription")}
              </p>

              {/* Stats */}
              <div className="mt-4 flex items-center justify-between">
                <div className="flex items-center gap-4 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <FolderKanban className="h-3 w-3" />
                    {board.projects?.length || 0}
                  </span>
                  <span className="flex items-center gap-1">
                    <Users className="h-3 w-3" />
                    {board.members?.length || 0}
                  </span>
                </div>
                {board.members && board.members.length > 0 && (
                  <AvatarGroup users={board.members.map((m: any) => ({ name: m.name }))} max={3} size="xs" />
                )}
              </div>

              {/* Owner info for team boards */}
              {!isOwner && board.owner && (
                <div className="mt-3 border-t pt-3">
                  <p className="text-xs text-muted-foreground">
                    Owner: <span className="font-medium">{board.owner.name}</span>
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
      <div className="space-y-2">
        {[1, 2, 3, 4].map((i) => (
          <Skeleton key={i} className="h-20 w-full rounded-lg" />
        ))}
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {[1, 2, 3, 4, 5, 6].map((i) => (
        <Skeleton key={i} className="h-52 w-full rounded-lg" />
      ))}
    </div>
  )
}
