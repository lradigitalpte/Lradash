"use client"

import { LayoutGrid, Loader2, Plus } from "lucide-react"
import Link from "next/link"
import { useParams } from "next/navigation"
import { useEffect, useState } from "react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
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

interface Board {
  id: string
  title: string
  description: string
  projectId: string
  owner: {
    name: string
    email: string
  }
  isArchived: boolean
  createdAt: string
  updatedAt: string
}

export default function ProjectBoardsPage() {
  const params = useParams()
  const projectId = params?.projectId as string
  const [boards, setBoards] = useState<Board[]>([])
  const [loading, setLoading] = useState(true)
  const [creating, setCreating] = useState(false)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [formData, setFormData] = useState({ title: "", description: "" })
  const [projectTitle, setProjectTitle] = useState("Project")

  useEffect(() => {
    if (projectId) {
      loadBoards()
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

  const loadBoards = async () => {
    try {
      const accessToken = localStorage.getItem("accessToken")
      if (!accessToken) {
        return
      }

      const response = await fetch(`/api/projects/${projectId}/boards`, {
        headers: {
          Authorization: `Bearer ${accessToken}`
        }
      })

      if (!response.ok) {
        toast.error("Failed to load boards")
        return
      }

      const data = await response.json()
      setBoards(data)
    } catch (error) {
      console.error("Failed to load boards:", error)
      toast.error("Failed to load boards")
    } finally {
      setLoading(false)
    }
  }

  const handleCreateBoard = async () => {
    if (!formData.title.trim()) {
      toast.error("Board title is required")
      return
    }

    setCreating(true)
    try {
      const accessToken = localStorage.getItem("accessToken")
      if (!accessToken) {
        toast.error("Not authenticated")
        return
      }

      const response = await fetch(`/api/projects/${projectId}/boards`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`
        },
        body: JSON.stringify(formData)
      })

      if (!response.ok) {
        const data = await response.json()
        toast.error(data.error || "Failed to create board")
        return
      }

      toast.success("Board created successfully!")
      setFormData({ title: "", description: "" })
      setDialogOpen(false)
      loadBoards()
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to create board"
      toast.error(message)
    } finally {
      setCreating(false)
    }
  }

  return (
    <div className="mx-auto min-h-screen max-w-[1400px] space-y-12 bg-slate-50/50 p-8 transition-all duration-500 dark:bg-slate-950">
      {/* WOW Header Section */}
      <div className="flex flex-col justify-between gap-8 pt-4 md:flex-row md:items-end">
        <div className="flex items-center gap-6">
          <div className="group relative">
            <div className="absolute -inset-2 rounded-3xl bg-gradient-to-r from-blue-600 to-indigo-700 opacity-20 blur transition duration-1000 group-hover:opacity-40 group-hover:duration-200" />
            <div className="relative flex h-20 w-20 items-center justify-center rounded-3xl bg-gradient-to-br from-blue-600 to-indigo-700 shadow-2xl shadow-blue-500/30">
              <LayoutGrid className="h-10 w-10 stroke-[2] text-white" />
            </div>
          </div>
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-3">
              <span className="rounded-xl bg-blue-500/10 px-3 py-1.5 text-[10px] font-black tracking-[0.25em] text-blue-600 uppercase dark:text-blue-400">
                Project Assets
              </span>
              <span className="rounded-xl bg-slate-100 px-3 py-1.5 text-[10px] font-black tracking-[0.25em] text-slate-500 uppercase dark:bg-slate-800 dark:text-slate-400">
                {boards.length} Active Modules
              </span>
            </div>
            <h1 className="text-4xl font-black tracking-tighter text-slate-900 sm:text-5xl dark:text-white">
              Strategic Boards
            </h1>
            <p className="text-sm leading-relaxed font-medium text-slate-500 italic dark:text-slate-400">
              Manage project boards and kanban views for {projectTitle}
            </p>
          </div>
        </div>

        <div className="flex gap-4 pb-1">
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button className="group h-14 rounded-2xl border-none bg-slate-900 px-8 text-[11px] font-bold tracking-widest text-white uppercase shadow-2xl shadow-slate-200 transition-all hover:scale-105 active:scale-95 dark:bg-white dark:text-slate-900 dark:shadow-none">
                <Plus className="mr-3 h-5 w-5 stroke-[3] transition-transform duration-500 group-hover:rotate-90" />
                Initialize Board
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
                      New Strategy Board
                    </DialogTitle>
                    <DialogDescription className="text-sm font-medium text-slate-500 dark:text-slate-400">
                      Define a new workspace for your team navigation
                    </DialogDescription>
                  </div>
                </DialogHeader>

                <div className="relative z-10 space-y-8 py-2">
                  <div className="space-y-4">
                    <h4 className="px-1 text-[10px] font-black tracking-[0.25em] text-slate-400 uppercase">
                      Identity & Title
                    </h4>
                    <Input
                      placeholder="e.g., Tactical Design, Core Development"
                      value={formData.title}
                      onChange={(e) =>{  setFormData({ ...formData, title: e.target.value }); }}
                      disabled={creating}
                      className="h-14 rounded-2xl border-slate-200 bg-slate-50 text-base font-medium shadow-inner transition-all focus:ring-4 focus:ring-blue-500/10 dark:border-slate-800 dark:bg-slate-900"
                    />
                  </div>

                  <div className="space-y-4">
                    <h4 className="px-1 text-[10px] font-black tracking-[0.25em] text-slate-400 uppercase">
                      Functional Brief
                    </h4>
                    <Textarea
                      placeholder="Outline the core objectives for this board..."
                      value={formData.description}
                      onChange={(e) =>{  setFormData({ ...formData, description: e.target.value }); }}
                      disabled={creating}
                      rows={4}
                      className="resize-none rounded-[2rem] border-slate-200 bg-slate-50 p-5 text-base font-medium shadow-inner transition-all focus:ring-4 focus:ring-blue-500/10 dark:border-slate-800 dark:bg-slate-900"
                    />
                  </div>
                </div>

                <div className="relative z-10 flex items-center justify-end gap-4 pt-4">
                  <Button
                    variant="ghost"
                    onClick={() =>{  setDialogOpen(false); }}
                    disabled={creating}
                    className="h-14 rounded-2xl px-8 text-[11px] font-bold tracking-widest text-slate-400 uppercase transition-colors hover:text-slate-900 dark:hover:text-white"
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleCreateBoard}
                    disabled={creating}
                    className="h-14 rounded-2xl bg-blue-600 px-10 text-[11px] font-bold tracking-widest text-white uppercase shadow-xl shadow-blue-500/30 transition-all hover:scale-[1.05] hover:bg-blue-700 active:scale-[0.95]"
                  >
                    {creating && <Loader2 className="mr-3 h-5 w-5 animate-spin" />}
                    Initialize Workspace
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Main Content Area */}
      {loading ? (
        <div className="flex animate-pulse flex-col items-center justify-center py-40">
          <Loader2 className="mb-6 h-12 w-12 animate-spin stroke-[2.5] text-blue-600" />
          <p className="ml-1 text-[11px] font-black tracking-[0.4em] text-slate-400 uppercase">
            Loading Boards...
          </p>
        </div>
      ) : boards.length === 0 ? (
        <div className="group relative p-1">
          <div className="absolute -inset-1 rounded-[3rem] bg-gradient-to-r from-blue-500/10 to-indigo-500/10 opacity-50 blur transition-opacity group-hover:opacity-100" />
          <div className="relative rounded-[3rem] border border-white/20 bg-white/40 p-24 text-center shadow-2xl shadow-slate-200/50 backdrop-blur-3xl dark:border-slate-800/50 dark:bg-slate-900/40 dark:shadow-none">
            <div className="mx-auto mb-10 flex h-24 w-24 items-center justify-center rounded-[2rem] bg-gradient-to-br from-slate-50 to-slate-100 shadow-inner transition-transform duration-700 group-hover:scale-110 dark:from-slate-800 dark:to-slate-900">
              <LayoutGrid className="h-12 w-12 stroke-[1.5] text-slate-300 dark:text-slate-600" />
            </div>
            <h3 className="mb-4 text-3xl font-black tracking-tight text-slate-900 dark:text-white">
              No Boards Found
            </h3>
            <p className="mx-auto mb-12 max-w-md text-base leading-relaxed font-medium text-slate-500 italic dark:text-slate-400">
              No boards have been created for this project yet. Create your first board to start
              managing tasks.
            </p>
            <Button
              onClick={() =>{  setDialogOpen(true); }}
              className="h-16 rounded-2xl bg-blue-600 px-12 text-[12px] font-bold tracking-widest text-white uppercase shadow-2xl shadow-blue-500/30 transition-all hover:scale-[1.05] hover:bg-blue-700"
            >
              Create First Board
            </Button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-10 md:grid-cols-2 lg:grid-cols-3">
          {boards.map((board) => (
            <Link
              key={board.id}
              href={`/en/projects/${projectId}/boards/${board.id}`}
              className="group block h-full"
            >
              <div className="relative h-full">
                <div className="absolute -inset-1 rounded-3xl bg-gradient-to-r from-blue-600 to-indigo-600 opacity-0 blur transition duration-700 group-hover:opacity-10 group-hover:duration-200" />
                <div className="relative flex h-full flex-col rounded-3xl border border-white/20 bg-white/60 p-10 shadow-2xl shadow-slate-200/40 backdrop-blur-xl transition-all duration-500 group-hover:-translate-y-3 group-hover:bg-white group-hover:shadow-blue-500/10 hover:border-blue-500/30 dark:border-slate-800/50 dark:bg-slate-900/60 dark:shadow-none dark:group-hover:bg-slate-900">
                  <div className="mb-10 flex items-start justify-between border-b border-slate-100 pb-6 dark:border-slate-800/50">
                    <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-50 transition-all duration-500 group-hover:scale-110 group-hover:bg-blue-600 group-hover:text-white group-hover:shadow-lg group-hover:shadow-blue-500/30 dark:bg-blue-900/30">
                      <LayoutGrid className="h-7 w-7 stroke-[2] text-blue-600 group-hover:text-white dark:text-blue-400" />
                    </div>
                    <div className="flex -space-x-3 transition-transform group-hover:translate-x-1">
                      {[1, 2, 3].map((i) => (
                        <div
                          key={i}
                          className="flex h-10 w-10 items-center justify-center rounded-full border-2 border-white bg-slate-100 shadow-sm dark:border-slate-800 dark:bg-slate-800"
                        >
                          <span className="text-xs font-black text-slate-400">?</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="flex-1 space-y-4">
                    <h3 className="text-2xl font-black tracking-tight text-slate-900 transition-colors group-hover:text-blue-600 dark:text-white">
                      {board.title}
                    </h3>
                    <p className="line-clamp-3 text-[14px] leading-relaxed font-medium text-slate-500 italic opacity-85 transition-opacity group-hover:opacity-100 dark:text-slate-400">
                      {board.description ||
                        "No description provided. Define goals to keep the project on track."}
                    </p>
                  </div>

                  <div className="mt-10 flex items-center justify-between border-t border-slate-100 pt-8 transition-colors group-hover:border-blue-500/10 dark:border-slate-800/50">
                    <div className="flex flex-col space-y-1">
                      <span className="text-[10px] font-black tracking-[0.2em] text-slate-400 uppercase">
                        Created By
                      </span>
                      <span className="text-xs font-bold text-slate-700 group-hover:text-slate-900 dark:text-slate-300 dark:group-hover:text-white">
                        {board.owner?.name || "Unassigned"}
                      </span>
                    </div>
                    <div className="flex flex-col items-end space-y-1">
                      <span className="text-[10px] font-black tracking-[0.2em] text-slate-400 uppercase">
                        Date
                      </span>
                      <span className="text-xs font-bold text-slate-700 group-hover:text-slate-900 dark:text-slate-300 dark:group-hover:text-white">
                        {new Date(board.createdAt).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric"
                        })}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
