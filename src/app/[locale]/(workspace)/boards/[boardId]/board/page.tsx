"use client"

import {
  Plus,
  LayoutGrid,
  Calendar,
  Users,
  TrendingUp,
  Clock,
  Activity,
  CheckCircle2,
  ArrowUpRight,
  Target,
  Sparkles,
  MoreHorizontal,
  Layers,
  Zap,
  ChevronRight,
  Shield,
  Briefcase,
  Info,
  ArrowRight,
  GripVertical,
  Trash2,
  Edit,
  X
} from "lucide-react"
import Link from "next/link"
import { useParams } from "next/navigation"
import { useState, useEffect, useRef } from "react"

import { KanbanBoard } from "@/components/board/KanbanBoard"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { apiClient } from "@/lib/api/client"

export default function BoardSubboardsPage() {
  const params = useParams()
  const boardId = params?.boardId as string
  const [board, setBoard] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [creatingList, setCreatingList] = useState(false)
  const [listDialogOpen, setListDialogOpen] = useState(false)
  const [newListTitle, setNewListTitle] = useState("")
  const [newListDescription, setNewListDescription] = useState("")

  useEffect(() => {
    if (boardId) {
      // Board data is managed by KanbanBoard component
      setLoading(false)
    }
  }, [boardId])

  const fetchBoardData = async () => {
    try {
      setLoading(true)
      // Board data is fetched by KanbanBoard component
      setBoard({ _id: boardId, title: "Board" })
    } catch (err) {
      setError("Failed to load board data")
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const handleCreateList = async () => {
    if (!newListTitle.trim()) {
      alert("List title is required")
      return
    }

    setCreatingList(true)
    try {
      // List creation is handled by KanbanBoard component
      // Reset form and close dialog
      setNewListTitle("")
      setNewListDescription("")
      setListDialogOpen(false)
    } catch (error) {
      console.error("Failed to create list:", error)
      alert("Failed to create list")
    } finally {
      setCreatingList(false)
    }
  }

  const handleTaskUpdated = (task: any) => {
    // Task updates are handled by KanbanBoard component
  }

  const handleTaskCreated = () => {
    // Task creation is handled by KanbanBoard component
  }

  if (loading) {
    return (
      <div className="mx-auto min-h-screen max-w-[1400px] space-y-12 bg-slate-50/50 p-8 dark:bg-slate-950">
        <div className="flex min-h-[600px] flex-col items-center justify-center space-y-4">
          <div className="flex h-12 w-12 animate-pulse items-center justify-center rounded-2xl bg-blue-600/10">
            <LayoutGrid className="h-6 w-6 text-blue-600" />
          </div>
          <p className="text-[10px] font-black tracking-[0.2em] text-slate-400 uppercase">
            Loading Board...
          </p>
        </div>
      </div>
    )
  }

  if (error || !board) {
    return (
      <div className="mx-auto min-h-screen max-w-[1400px] space-y-12 bg-slate-50/50 p-8 dark:bg-slate-950">
        <div className="flex min-h-[600px] items-center justify-center p-8">
          <Card className="w-full max-w-md rounded-[2rem] border-none bg-white p-8 text-center shadow-2xl dark:bg-slate-900">
            <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-rose-50 dark:bg-rose-950/20">
              <Shield className="h-8 w-8 text-rose-500" />
            </div>
            <h2 className="mb-2 text-2xl font-black">{error || "Access Denied"}</h2>
            <p className="mb-8 font-medium text-slate-500 italic">
              The requested board could not be found.
            </p>
            <Link href="/boards">
              <Button className="h-12 w-full rounded-xl bg-slate-900 font-bold text-white dark:bg-white dark:text-slate-900">
                Return to Boards
              </Button>
            </Link>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="mx-auto min-h-screen max-w-[1400px] space-y-12 bg-slate-50/50 p-8 dark:bg-slate-950">
      {/* Header */}
      <div className="flex flex-col justify-between gap-8 lg:flex-row lg:items-end">
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 transform items-center justify-center rounded-2xl bg-indigo-600 text-white shadow-xl shadow-indigo-500/20 transition-all duration-500 hover:rotate-6">
              <LayoutGrid className="h-6 w-6" />
            </div>
            <div>
              <div className="h-6 border border-slate-200 bg-white px-2 text-[10px] font-black tracking-[0.1em] uppercase shadow-sm dark:bg-slate-900">
                Board Dashboard
              </div>
              <div className="mt-1 flex items-center gap-2 text-[10px] font-black tracking-widest text-slate-400">
                <Clock className="h-3 w-3" />
                Created: {new Date(board.createdAt).toLocaleDateString()}
                <span className="mx-1">•</span>
                <Activity className="h-3 w-3" />
                Updated: {new Date(board.updatedAt).toLocaleDateString()}
              </div>
            </div>
          </div>
          <h1 className="text-5xl leading-tight font-black tracking-tighter text-slate-900 dark:text-white">
            {board.title}
          </h1>
          <p className="max-w-3xl text-lg leading-relaxed font-medium text-slate-500 italic">
            {board.description || "Personal board workspace for organized project tracking."}
          </p>
        </div>

        <div className="flex shrink-0 items-center gap-3">
          <Dialog open={listDialogOpen} onOpenChange={setListDialogOpen}>
            <DialogTrigger asChild>
              <Button className="group h-14 gap-2 rounded-2xl bg-indigo-600 px-8 font-black text-white shadow-2xl shadow-indigo-500/30 transition-all hover:scale-105 hover:bg-indigo-700">
                <Plus className="h-5 w-5 transition-transform group-hover:rotate-90" />
                New List
              </Button>
            </DialogTrigger>
            <DialogContent className="!max-w-[550px] overflow-hidden rounded-[2.5rem] border-white/20 bg-white/80 !p-0 shadow-2xl backdrop-blur-2xl dark:border-slate-800/50 dark:bg-slate-950/80">
              <div className="relative space-y-8 p-10">
                <div className="absolute -top-10 -right-10 h-40 w-40 rounded-full bg-blue-500/10 blur-3xl" />
                <DialogHeader className="relative z-10 space-y-4 text-left">
                  <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 shadow-lg shadow-blue-500/20">
                    <Plus className="h-7 w-7 stroke-[2.5] text-white" />
                  </div>
                  <div className="space-y-1">
                    <DialogTitle className="text-3xl font-black tracking-tight text-slate-900 dark:text-white">
                      New List
                    </DialogTitle>
                    <DialogDescription className="text-sm font-medium text-slate-500 dark:text-slate-400">
                      Create a new list to organize your tasks
                    </DialogDescription>
                  </div>
                </DialogHeader>

                <div className="relative z-10 space-y-8 py-2">
                  <div className="space-y-4">
                    <h4 className="px-1 text-[10px] font-black tracking-[0.25em] text-slate-400 uppercase">
                      List Title
                    </h4>
                    <Input
                      placeholder="e.g., To Do, In Progress, Done"
                      value={newListTitle}
                      onChange={(e) => {
                        setNewListTitle(e.target.value)
                      }}
                      disabled={creatingList}
                      className="h-14 rounded-2xl border-slate-200 bg-slate-50 text-base font-medium shadow-inner transition-all focus:ring-4 focus:ring-blue-500/10 dark:border-slate-800 dark:bg-slate-900"
                    />
                  </div>

                  <div className="space-y-4">
                    <h4 className="px-1 text-[10px] font-black tracking-[0.25em] text-slate-400 uppercase">
                      Description
                    </h4>
                    <Textarea
                      placeholder="Describe the purpose of this list..."
                      value={newListDescription}
                      onChange={(e) => {
                        setNewListDescription(e.target.value)
                      }}
                      disabled={creatingList}
                      rows={3}
                      className="resize-none rounded-[2rem] border-slate-200 bg-slate-50 p-5 text-base font-medium shadow-inner transition-all focus:ring-4 focus:ring-blue-500/10 dark:border-slate-800 dark:bg-slate-900"
                    />
                  </div>
                </div>

                <div className="relative z-10 flex items-center justify-end gap-4 pt-4">
                  <Button
                    variant="ghost"
                    onClick={() => {
                      setListDialogOpen(false)
                      setNewListTitle("")
                      setNewListDescription("")
                    }}
                    disabled={creatingList}
                    className="h-14 rounded-2xl px-8 text-[11px] font-bold tracking-widest text-slate-400 uppercase transition-colors hover:text-slate-900 dark:hover:text-white"
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleCreateList}
                    disabled={creatingList}
                    className="h-14 rounded-2xl bg-blue-600 px-10 text-[11px] font-bold tracking-widest text-white uppercase shadow-xl shadow-blue-500/30 transition-all hover:scale-[1.05] hover:bg-blue-700"
                  >
                    {creatingList && (
                      <div className="mr-3 h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                    )}
                    Create List
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Kanban Board */}
      <KanbanBoard boardId={boardId} />
    </div>
  )
}
