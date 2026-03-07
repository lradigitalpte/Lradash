"use client"

import { Settings2, Lock, Link2, Loader2 } from "lucide-react"
import { useParams } from "next/navigation"
import { useState, useEffect } from "react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select"
import { apiClient } from "@/lib/api/client"

export default function BoardSettingsPage() {
  const params = useParams()
  const boardId = params?.boardId as string
  const [board, setBoard] = useState<{
    title?: string
    description?: string
    projectId?: string | null
  } | null>(null)
  const [projects, setProjects] = useState<{ id: string; title: string }[]>([])
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [linkedProjectId, setLinkedProjectId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (boardId) {
      fetchBoard()
      fetchProjects()
    }
  }, [boardId])

  const fetchBoard = async () => {
    try {
      setLoading(true)
      const res = await apiClient.get(`/api/boards/${boardId}`)
      if (res.ok) {
        const data = await res.json()
        setBoard(data)
        setTitle(data.title ?? "")
        setDescription(data.description ?? "")
        setLinkedProjectId(data.projectId ?? null)
      }
    } catch {
      toast.error("Failed to load board")
    } finally {
      setLoading(false)
    }
  }

  const fetchProjects = async () => {
    try {
      const res = await apiClient.get("/api/projects")
      if (res.ok) {
        const data = await res.json()
        setProjects(
          Array.isArray(data) ? data.map((p: any) => ({ id: p.id || p._id, title: p.title })) : []
        )
      }
    } catch {
      // ignore
    }
  }

  const handleSaveGeneral = async () => {
    try {
      setSaving(true)
      const res = await apiClient.patch(`/api/boards/${boardId}`, { title, description })
      if (res.ok) {
        toast.success("Board updated")
        setBoard((b) => (b ? { ...b, title, description } : b))
      } else {
        const err = await res.json()
        toast.error(err?.error || "Failed to save")
      }
    } catch {
      toast.error("Failed to save")
    } finally {
      setSaving(false)
    }
  }

  const handleLinkProject = async (projectId: string | null) => {
    try {
      setSaving(true)
      const res = await apiClient.patch(`/api/boards/${boardId}`, { projectId: projectId || null })
      if (res.ok) {
        setLinkedProjectId(projectId)
        setBoard((b) => (b ? { ...b, projectId: projectId ?? undefined } : b))
        toast.success(projectId ? "Board linked to project" : "Board unlinked from project")
      } else {
        const err = await res.json()
        toast.error(err?.error || "Failed to link project")
      }
    } catch {
      toast.error("Failed to link project")
    } finally {
      setSaving(false)
    }
  }

  if (loading && !board) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
      </div>
    )
  }

  return (
    <div className="min-h-full space-y-10 bg-slate-50/50 p-8 dark:bg-slate-950/50">
      <div className="space-y-2">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-blue-600 text-white">
            <Settings2 className="h-5 w-5" />
          </div>
        </div>
        <h1 className="text-4xl font-black tracking-tighter text-slate-900 dark:text-white">
          Board Settings
        </h1>
      </div>

      <div className="max-w-2xl space-y-8">
        <div className="space-y-6 rounded-3xl border bg-white p-8 shadow-lg dark:border-slate-800 dark:bg-slate-900">
          <div className="space-y-4">
            <div>
              <Label className="text-sm font-bold">Board name</Label>
              <Input
                className="mt-2 h-11 rounded-xl"
                placeholder="Board name"
                value={title}
                onChange={(e) =>{  setTitle(e.target.value); }}
              />
            </div>
            <div>
              <Label className="text-sm font-bold">Description</Label>
              <Input
                className="mt-2 h-11 rounded-xl"
                placeholder="Description"
                value={description}
                onChange={(e) =>{  setDescription(e.target.value); }}
              />
            </div>
          </div>
          <Button
            className="h-11 rounded-xl bg-blue-600 font-bold text-white"
            onClick={handleSaveGeneral}
            disabled={saving}
          >
            {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            Save name & description
          </Button>
        </div>

        <div className="space-y-6 rounded-3xl border bg-white p-8 shadow-lg dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center gap-3">
            <Link2 className="h-5 w-5 text-slate-500" />
            <div>
              <p className="font-bold">Link to project</p>
              <p className="text-xs text-slate-500">
                Link this board to a project to create and manage tasks in the Tasks tab.
              </p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <Select
              value={linkedProjectId ?? "none"}
              onValueChange={(v) => {
                if (v === "none") {
                  handleLinkProject(null)
                } else {
                  handleLinkProject(v)
                }
              }}
              disabled={saving}
            >
              <SelectTrigger className="h-11 w-64 rounded-xl">
                <SelectValue placeholder="Select project" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">No project linked</SelectItem>
                {projects.map((p) => (
                  <SelectItem key={p.id} value={p.id}>
                    {p.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {linkedProjectId && (
              <Button
                variant="outline"
                size="sm"
                className="rounded-xl"
                onClick={ async () => handleLinkProject(null)}
                disabled={saving}
              >
                Unlink
              </Button>
            )}
          </div>
        </div>

        <div className="rounded-3xl border border-slate-100 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center gap-3">
            <Lock className="h-5 w-5 text-slate-400" />
            <div>
              <p className="font-bold">Visibility</p>
              <p className="text-xs text-slate-500">
                Board visibility is managed by your organization.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
