"use client"

import {
  CheckSquare,
  Target,
  Search,
  FileText,
  Link2,
  TrendingUp,
  Users,
  Zap,
  Plus,
  Check,
  Circle,
  Pencil,
  Trash2,
  MoreVertical,
  Sparkles
} from "lucide-react"
import { useParams } from "next/navigation"
import { useState, useEffect } from "react"

import { ChecklistItemModal } from "@/components/seo/ChecklistItemModal"
import { DeleteChecklistItemDialog } from "@/components/seo/DeleteChecklistItemDialog"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu"
import { apiClient } from "@/lib/api/client"
import { cn } from "@/lib/utils"

interface ChecklistItem {
  _id: string
  title: string
  description: string
  completed: boolean
  category: "research" | "onpage" | "technical" | "content" | "links"
  notes?: string
  completedAt?: string
  completedBy?: string
}

const CHECKLIST_CATEGORIES = {
  research: {
    label: "Keyword Research",
    icon: Search,
    color: "text-blue-500",
    bgColor: "bg-blue-500/10"
  },
  onpage: {
    label: "On-Page SEO",
    icon: FileText,
    color: "text-emerald-500",
    bgColor: "bg-emerald-500/10"
  },
  technical: {
    label: "Technical SEO",
    icon: Zap,
    color: "text-amber-500",
    bgColor: "bg-amber-500/10"
  },
  content: {
    label: "Content Strategy",
    icon: Target,
    color: "text-purple-500",
    bgColor: "bg-purple-500/10"
  },
  links: {
    label: "Link Building",
    icon: Link2,
    color: "text-rose-500",
    bgColor: "bg-rose-500/10"
  }
}

export default function SEOPlanningPage() {
  const { locale, projectId } = useParams()
  const [checklist, setChecklist] = useState<ChecklistItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Modal states
  const [createModalOpen, setCreateModalOpen] = useState(false)
  const [editModalOpen, setEditModalOpen] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [selectedItem, setSelectedItem] = useState<ChecklistItem | null>(null)

  const fetchChecklist = async () => {
    try {
      setLoading(true)
      setError(null)

      const response = await apiClient.get(`/api/projects/${projectId}/marketing/seo-checklist`)

      if (!response.ok) {
        throw new Error("Failed to fetch checklist")
      }

      const data = await response.json()
      setChecklist(data.items || [])
    } catch (err) {
      console.error("Error fetching checklist:", err)
      setError(err instanceof Error ? err.message : "Failed to load checklist")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (projectId) {
      fetchChecklist()
    }
  }, [projectId])

  const toggleItem = async (item: ChecklistItem) => {
    try {
      const response = await apiClient.patch(
        `/api/projects/${projectId}/marketing/seo-checklist/${item._id}`,
        { completed: !item.completed }
      )

      if (!response.ok) {
        throw new Error("Failed to update item")
      }

      // Optimistically update UI
      setChecklist((prev) =>
        prev.map((i) => (i._id === item._id ? { ...i, completed: !i.completed } : i))
      )
    } catch (err) {
      console.error("Error toggling item:", err)
      // Revert on error
      fetchChecklist()
    }
  }

  const handleEdit = (item: ChecklistItem) => {
    setSelectedItem(item)
    setEditModalOpen(true)
  }

  const handleDelete = (item: ChecklistItem) => {
    setSelectedItem(item)
    setDeleteDialogOpen(true)
  }

  const getCategoryStats = (category: keyof typeof CHECKLIST_CATEGORIES) => {
    const items = checklist.filter((item) => item.category === category)
    const completed = items.filter((item) => item.completed).length
    const total = items.length
    return {
      total,
      completed,
      percentage: total > 0 ? Math.round((completed / total) * 100) : 0
    }
  }

  const overallProgress = () => {
    const completed = checklist.filter((item) => item.completed).length
    const total = checklist.length
    return total > 0 ? Math.round((completed / total) * 100) : 0
  }

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-teal-200 border-t-teal-600" />
          <p className="text-sm font-medium text-slate-600 dark:text-slate-400">
            Loading SEO checklist...
          </p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="rounded-3xl border border-rose-200 bg-rose-50 p-8 text-center dark:border-rose-900 dark:bg-rose-950/20">
          <p className="text-sm font-semibold text-rose-700 dark:text-rose-300">⚠️ {error}</p>
          <Button onClick={fetchChecklist} className="mt-4" variant="outline">
            Try Again
          </Button>
        </div>
      </div>
    )
  }

  return (
    <>
      <div className="space-y-8 p-8 pb-20">
        {/* Header */}
        <div className="flex flex-col justify-between gap-6 md:flex-row md:items-end">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <div className="flex h-6 items-center justify-center rounded-md border border-teal-500/20 bg-teal-500/10 px-2">
                <span className="text-[9px] font-black tracking-[0.2em] text-teal-600 uppercase">
                  SEO Strategy
                </span>
              </div>
              <div className="h-1 w-1 rounded-full bg-slate-300 dark:bg-slate-700" />
              <span className="text-[10px] font-bold tracking-widest text-slate-400 uppercase">
                Planning Checklist
              </span>
            </div>
            <h1 className="text-4xl font-black tracking-tighter text-slate-900 dark:text-white">
              SEO <span className="text-teal-600">Planning</span>
            </h1>
            <p className="max-w-lg text-xs font-medium text-slate-500 italic">
              Complete your SEO strategy checklist to optimize your project for search engines.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Button
              onClick={() =>{  setCreateModalOpen(true); }}
              className="h-11 gap-2 rounded-2xl bg-gradient-to-r from-teal-600 to-cyan-600 text-sm font-bold text-white shadow-lg shadow-teal-500/30 transition-all hover:shadow-teal-500/40"
            >
              <Plus className="h-4 w-4" />
              Add Task
            </Button>
            <Card className="border-teal-200 bg-teal-50 dark:border-teal-800 dark:bg-teal-950">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-teal-600 text-white">
                    <span className="text-xl font-black">{overallProgress()}%</span>
                  </div>
                  <div>
                    <p className="text-xs font-bold text-teal-700 dark:text-teal-300">
                      Overall Progress
                    </p>
                    <p className="text-[10px] text-teal-600 dark:text-teal-400">
                      {checklist.filter((i) => i.completed).length} of {checklist.length} completed
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Category Stats */}
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-5">
          {Object.entries(CHECKLIST_CATEGORIES).map(([key, config]) => {
            const stats = getCategoryStats(key as keyof typeof CHECKLIST_CATEGORIES)
            const Icon = config.icon
            return (
              <Card
                key={key}
                className="group relative overflow-hidden transition-all duration-300 hover:-translate-y-1"
              >
                <div
                  className={cn(
                    "absolute inset-0 opacity-0 transition-opacity group-hover:opacity-100",
                    config.bgColor
                  )}
                />
                <CardHeader className="relative z-10 pb-3">
                  <div className="flex items-center gap-3">
                    <div
                      className={cn(
                        "flex h-8 w-8 items-center justify-center rounded-lg",
                        config.bgColor
                      )}
                    >
                      <Icon className={cn("h-4 w-4", config.color)} />
                    </div>
                    <CardTitle className="text-xs font-black uppercase">{config.label}</CardTitle>
                  </div>
                </CardHeader>
                <CardContent className="relative z-10">
                  <div className="space-y-2">
                    <div className="flex items-end gap-2">
                      <span className="text-2xl font-black text-slate-900 dark:text-white">
                        {stats.percentage}%
                      </span>
                      <span className="mb-1 text-[10px] text-slate-500">
                        {stats.completed}/{stats.total}
                      </span>
                    </div>
                    <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                      <div
                        className={cn(
                          "h-full transition-all duration-500",
                          config.bgColor.replace("/10", "")
                        )}
                        style={{ width: `${stats.percentage}%` }}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>

        {/* Empty State */}
        {checklist.length === 0 && (
          <Card className="border-2 border-dashed border-slate-200 bg-slate-50/50 dark:border-slate-800 dark:bg-slate-900/20">
            <CardContent className="flex flex-col items-center justify-center py-16 text-center">
              <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-teal-500/10">
                <Sparkles className="h-8 w-8 text-teal-600" />
              </div>
              <h3 className="mb-2 text-xl font-black tracking-tight text-slate-900 dark:text-white">
                No tasks yet
              </h3>
              <p className="mb-6 max-w-md text-sm text-slate-600 dark:text-slate-400">
                Get started by creating your first SEO checklist item. Build a comprehensive
                strategy to optimize your project for search engines.
              </p>
              <Button
                onClick={() =>{  setCreateModalOpen(true); }}
                className="h-11 gap-2 rounded-2xl bg-gradient-to-r from-teal-600 to-cyan-600 text-sm font-bold text-white shadow-lg shadow-teal-500/30"
              >
                <Plus className="h-4 w-4" />
                Create First Task
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Checklist by Category */}
        {checklist.length > 0 && (
          <div className="space-y-6">
            {Object.entries(CHECKLIST_CATEGORIES).map(([key, config]) => {
              const categoryItems = checklist.filter((item) => item.category === key)

              if (categoryItems.length === 0) {
                return null
              }

              const Icon = config.icon

              return (
                <Card
                  key={key}
                  className="overflow-hidden border-slate-200/50 bg-white/80 shadow-2xl shadow-slate-200/40 backdrop-blur-xl dark:border-slate-800/50 dark:bg-slate-950/80 dark:shadow-none"
                >
                  <CardHeader className={cn("border-b", config.bgColor)}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div
                          className={cn(
                            "flex h-10 w-10 items-center justify-center rounded-lg shadow-lg",
                            config.bgColor
                          )}
                        >
                          <Icon className={cn("h-5 w-5", config.color)} />
                        </div>
                        <div>
                          <CardTitle className="text-sm font-black uppercase">
                            {config.label}
                          </CardTitle>
                          <CardDescription className="text-[10px]">
                            {categoryItems.filter((i) => i.completed).length} of{" "}
                            {categoryItems.length} completed
                          </CardDescription>
                        </div>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="p-0">
                    <div className="divide-y divide-slate-100 dark:divide-slate-800">
                      {categoryItems.map((item) => (
                        <div
                          key={item._id}
                          className="group flex w-full items-start gap-4 p-4 text-left transition-colors hover:bg-slate-50 dark:hover:bg-slate-900/30"
                        >
                          <button onClick={ async () => toggleItem(item)} className="mt-1 shrink-0">
                            {item.completed ? (
                              <div
                                className={cn(
                                  "flex h-5 w-5 items-center justify-center rounded-full transition-all hover:scale-110",
                                  config.bgColor
                                )}
                              >
                                <Check className={cn("h-3 w-3", config.color)} />
                              </div>
                            ) : (
                              <Circle className="h-5 w-5 text-slate-300 transition-all hover:text-slate-400 dark:text-slate-700 dark:hover:text-slate-600" />
                            )}
                          </button>
                          <div className="min-w-0 flex-1">
                            <h3
                              className={cn(
                                "text-sm font-bold",
                                item.completed
                                  ? "text-slate-400 line-through dark:text-slate-600"
                                  : "text-slate-900 dark:text-white"
                              )}
                            >
                              {item.title}
                            </h3>
                            <p
                              className={cn(
                                "mt-1 text-xs",
                                item.completed
                                  ? "text-slate-400 dark:text-slate-600"
                                  : "text-slate-600 dark:text-slate-400"
                              )}
                            >
                              {item.description}
                            </p>
                            {item.notes && (
                              <p className="mt-2 text-xs text-slate-500 italic dark:text-slate-500">
                                💡 {item.notes}
                              </p>
                            )}
                          </div>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-8 w-8 shrink-0 rounded-lg opacity-0 transition-opacity group-hover:opacity-100"
                              >
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="rounded-2xl">
                              <DropdownMenuItem
                                onClick={() =>{  handleEdit(item); }}
                                className="cursor-pointer gap-2 rounded-xl"
                              >
                                <Pencil className="h-4 w-4" />
                                Edit
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() =>{  handleDelete(item); }}
                                className="cursor-pointer gap-2 rounded-xl text-rose-600 focus:bg-rose-50 focus:text-rose-600 dark:focus:bg-rose-950/20"
                              >
                                <Trash2 className="h-4 w-4" />
                                Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        )}

        {/* Tips Section */}
        <div className="rounded-[2.5rem] border border-slate-200/50 bg-gradient-to-br from-teal-50 to-cyan-50 p-8 shadow-2xl shadow-slate-200/40 backdrop-blur-xl dark:border-slate-800/50 dark:from-teal-500/10 dark:to-cyan-500/10 dark:shadow-none">
          <div className="flex gap-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-teal-600 text-xl font-black text-white shadow-lg shadow-teal-600/30">
              <Target className="h-5 w-5" />
            </div>
            <div className="space-y-2">
              <h3 className="font-black text-slate-900 dark:text-white">SEO Strategy Tips</h3>
              <ul className="space-y-1 text-sm text-slate-700 dark:text-slate-300">
                <li>• Complete technical SEO items first for a solid foundation</li>
                <li>• Focus on one category at a time to avoid overwhelm</li>
                <li>• Revisit and update your checklist monthly as SEO evolves</li>
                <li>• Document your progress and results for each completed item</li>
                <li>• Combine SEO planning with your content strategy for best results</li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* Modals */}
      <ChecklistItemModal
        projectId={projectId as string}
        open={createModalOpen}
        onOpenChange={setCreateModalOpen}
        onSave={fetchChecklist}
        mode="create"
      />

      <ChecklistItemModal
        projectId={projectId as string}
        open={editModalOpen}
        onOpenChange={setEditModalOpen}
        onSave={fetchChecklist}
        item={selectedItem}
        mode="edit"
      />

      {selectedItem && (
        <DeleteChecklistItemDialog
          projectId={projectId as string}
          itemId={selectedItem._id}
          itemTitle={selectedItem.title}
          open={deleteDialogOpen}
          onOpenChange={setDeleteDialogOpen}
          onDelete={fetchChecklist}
        />
      )}
    </>
  )
}
