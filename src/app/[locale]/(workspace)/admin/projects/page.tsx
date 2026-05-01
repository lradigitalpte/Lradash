"use client"

import { formatDistanceToNow } from "date-fns"
import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Clock,
  FolderKanban,
  Layers,
  Search,
  SortAsc,
  Users
} from "lucide-react"
import { useMemo, useState } from "react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu"
import { useAdminProjects } from "@/hooks/useAdmin"
import { Link, useRouter } from "@/i18n/navigation"
import { cn } from "@/lib/utils"

type SortKey = "recent" | "completion" | "tasks" | "members"

function CompletionBar({ rate }: { rate: number }) {
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between">
        <span className="text-[10px] font-black tracking-wider text-slate-400 uppercase">
          Completion
        </span>
        <span className="text-sm font-black text-slate-900 dark:text-white">{rate}%</span>
      </div>
      <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
        <div
          className={cn(
            "h-full rounded-full transition-all duration-700",
            rate >= 80 ? "bg-emerald-500" : rate >= 40 ? "bg-blue-500" : "bg-amber-500"
          )}
          style={{ width: `${rate}%` }}
        />
      </div>
    </div>
  )
}

export default function AdminProjectsPage() {
  const router = useRouter()
  const { projects, loading, error } = useAdminProjects()
  const [search, setSearch] = useState("")
  const [sort, setSort] = useState<SortKey>("recent")

  const filtered = useMemo(() => {
    let list = projects.filter(
      (p) =>
        p.title.toLowerCase().includes(search.toLowerCase()) ||
        (p.description ?? "").toLowerCase().includes(search.toLowerCase())
    )
    switch (sort) {
      case "completion":
        list = [...list].sort((a, b) => b.completionRate - a.completionRate)
        break
      case "tasks":
        list = [...list].sort((a, b) => b.taskTotal - a.taskTotal)
        break
      case "members":
        list = [...list].sort((a, b) => (b.members?.length ?? 0) - (a.members?.length ?? 0))
        break
      default:
        // recent (default from API)
        break
    }
    return list
  }, [projects, search, sort])

  if (error) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-red-100">
            <AlertCircle className="h-8 w-8 text-red-500" />
          </div>
          <h2 className="text-xl font-black text-slate-900 dark:text-white">Access Denied</h2>
          <Link href="/admin">
            <Button className="mt-4">Back to Admin</Button>
          </Link>
        </div>
      </div>
    )
  }

  const SORT_LABELS: Record<SortKey, string> = {
    recent: "Most Recent",
    completion: "Completion %",
    tasks: "Most Tasks",
    members: "Most Members"
  }

  return (
    <div className="relative min-h-full pb-20">
      <div className="pointer-events-none absolute top-20 right-[10%] -z-10 h-[400px] w-[400px] rounded-full bg-violet-500/5 blur-[100px]" />

      <div className="mx-auto max-w-[1400px] space-y-8 p-8 lg:p-12">
        {/* Header */}
        <div className="flex flex-col justify-between gap-6 pt-4 md:flex-row md:items-end">
          <div className="flex items-center gap-4">
            <Link href="/admin">
              <Button variant="ghost" size="sm" className="gap-2 rounded-xl text-slate-500">
                <ArrowLeft className="h-4 w-4" />
                Admin
              </Button>
            </Link>
            <div className="flex items-center gap-4">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-600 to-purple-700 text-white shadow-lg shadow-violet-500/20">
                <FolderKanban className="h-7 w-7 stroke-[2]" />
              </div>
              <div>
                <h1 className="text-3xl font-black tracking-tight text-slate-900 dark:text-white">
                  All Projects
                </h1>
                <p className="mt-0.5 text-sm text-slate-500">
                  {projects.length} project{projects.length !== 1 ? "s" : ""} in your organization
                </p>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Link href="/admin/tasks">
              <Button variant="default" size="sm" className="gap-2 rounded-xl">
                All Tasks
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="gap-2 rounded-xl">
                  <SortAsc className="h-4 w-4" />
                  {SORT_LABELS[sort]}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-44 rounded-2xl shadow-xl">
                {(Object.keys(SORT_LABELS) as SortKey[]).map((k) => (
                  <DropdownMenuItem
                    key={k}
                    onClick={() => {
                      setSort(k)
                    }}
                    className={cn("rounded-xl text-xs font-bold", sort === k && "text-violet-600")}
                  >
                    {SORT_LABELS[k]}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute top-1/2 left-4 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search projects..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value)
            }}
            className="h-11 w-full rounded-2xl border border-slate-200/80 bg-white pr-4 pl-11 text-sm text-slate-900 placeholder-slate-400 shadow-sm transition outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-400/20 dark:border-slate-800 dark:bg-slate-900 dark:text-white"
          />
        </div>

        {/* Project Grid */}
        {loading ? (
          <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div
                key={i}
                className="h-52 animate-pulse rounded-3xl border border-slate-200/60 bg-white/40 dark:border-slate-800/60 dark:bg-white/5"
              />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-20 text-center">
            <FolderKanban className="mx-auto mb-3 h-10 w-10 text-slate-300" />
            <p className="text-sm text-slate-400">No projects found</p>
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
            {filtered.map((proj) => (
              <Card
                key={proj._id}
                className="group relative cursor-pointer overflow-hidden border-slate-200/60 shadow-lg transition-all duration-300 hover:-translate-y-1 hover:shadow-xl dark:border-slate-800/60"
                onClick={() => {
                  router.push(`/admin/tasks?projectId=${proj._id}`)
                }}
              >
                <div className="absolute inset-0 bg-gradient-to-br from-violet-500/5 to-purple-500/5 opacity-0 transition group-hover:opacity-100" />
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 text-white shadow">
                        <FolderKanban className="h-5 w-5" />
                      </div>
                      <div className="min-w-0">
                        <CardTitle className="truncate text-sm font-black">{proj.title}</CardTitle>
                        {proj.description && (
                          <p className="mt-0.5 line-clamp-1 text-xs text-slate-400">
                            {proj.description}
                          </p>
                        )}
                      </div>
                    </div>
                    {proj.isArchived && (
                      <Badge variant="secondary" className="flex-shrink-0 text-[10px]">
                        Archived
                      </Badge>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <CompletionBar rate={proj.completionRate} />

                  <div className="grid grid-cols-3 gap-2">
                    <div className="rounded-xl bg-slate-50 p-2 text-center dark:bg-slate-800/60">
                      <div className="flex items-center justify-center gap-1">
                        <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
                        <span className="text-sm font-black text-slate-900 dark:text-white">
                          {proj.taskDone}
                        </span>
                      </div>
                      <p className="mt-0.5 text-[9px] font-black tracking-wider text-slate-400 uppercase">
                        Done
                      </p>
                    </div>
                    <div className="rounded-xl bg-slate-50 p-2 text-center dark:bg-slate-800/60">
                      <div className="flex items-center justify-center gap-1">
                        <Clock className="h-3.5 w-3.5 text-blue-500" />
                        <span className="text-sm font-black text-slate-900 dark:text-white">
                          {proj.taskTotal}
                        </span>
                      </div>
                      <p className="mt-0.5 text-[9px] font-black tracking-wider text-slate-400 uppercase">
                        Tasks
                      </p>
                    </div>
                    <div className="rounded-xl bg-slate-50 p-2 text-center dark:bg-slate-800/60">
                      <div className="flex items-center justify-center gap-1">
                        <Users className="h-3.5 w-3.5 text-violet-500" />
                        <span className="text-sm font-black text-slate-900 dark:text-white">
                          {(proj.members?.length ?? 0) + 1}
                        </span>
                      </div>
                      <p className="mt-0.5 text-[9px] font-black tracking-wider text-slate-400 uppercase">
                        Members
                      </p>
                    </div>
                  </div>

                  {/* Boards */}
                  {proj.boards.length > 0 && (
                    <div className="flex flex-wrap gap-1.5">
                      {proj.boards.slice(0, 3).map((b: any) => (
                        <div
                          key={b._id}
                          className="flex items-center gap-1 rounded-lg bg-slate-100 px-2 py-1 dark:bg-slate-800"
                        >
                          <Layers className="h-3 w-3 text-slate-400" />
                          <span className="max-w-[80px] truncate text-[10px] font-bold text-slate-600 dark:text-slate-400">
                            {b.title}
                          </span>
                        </div>
                      ))}
                      {proj.boards.length > 3 && (
                        <div className="flex items-center rounded-lg bg-slate-100 px-2 py-1 dark:bg-slate-800">
                          <span className="text-[10px] font-bold text-slate-500">
                            +{proj.boards.length - 3}
                          </span>
                        </div>
                      )}
                    </div>
                  )}

                  <div className="flex items-center justify-between pt-1">
                    <div className="flex items-center gap-2">
                      {proj.owner?.avatar ? (
                        <img
                          src={proj.owner.avatar}
                          alt={proj.owner.name}
                          className="h-6 w-6 rounded-full object-cover"
                        />
                      ) : (
                        <div className="flex h-6 w-6 items-center justify-center rounded-full bg-gradient-to-br from-violet-400 to-purple-500 text-[10px] font-black text-white">
                          {proj.owner?.name?.[0] ?? "?"}
                        </div>
                      )}
                      <span className="text-xs text-slate-500">{proj.owner?.name}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] text-slate-400">
                        {formatDistanceToNow(new Date(proj.createdAt), { addSuffix: true })}
                      </span>
                      <Link href={`/admin/tasks?projectId=${proj._id}`}>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-7 gap-1 rounded-lg px-2 text-[10px]"
                          onClick={(e) => {
                            e.stopPropagation()
                          }}
                        >
                          View Tasks
                          <ArrowRight className="h-3.5 w-3.5" />
                        </Button>
                      </Link>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
