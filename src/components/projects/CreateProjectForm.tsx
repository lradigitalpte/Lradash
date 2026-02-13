"use client"

import { Plus, LayoutGrid, Sparkles } from "lucide-react"
import { useRouter } from "next/navigation"
import { useState } from "react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
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

export function CreateProjectForm() {
  const [open, setOpen] = useState(false)
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const handleSubmit = async () => {
    if (!title.trim()) {
      toast.error("Project title is required")
      return
    }

    setLoading(true)
    try {
      const response = await apiClient.post("/api/projects", { title, description })

      if (!response.ok) {
        const data = await response.json()
        toast.error(data.error || "Failed to create project")
        return
      }

      toast.success("Project created successfully!")
      setTitle("")
      setDescription("")
      setOpen(false)
      router.refresh()
    } catch (error) {
      console.error("Create project error:", error)
      toast.error("Failed to create project")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          size="lg"
          className="group relative h-14 gap-3 overflow-hidden rounded-2xl bg-slate-900 px-8 text-sm font-black tracking-widest text-white uppercase shadow-2xl transition-all hover:scale-105 dark:bg-white dark:text-slate-900"
        >
          <div className="absolute inset-0 bg-gradient-to-r from-blue-600/20 to-indigo-600/20 opacity-0 transition-opacity group-hover:opacity-100" />
          <Plus className="h-5 w-5 stroke-[3]" />
          New Project
        </Button>
      </DialogTrigger>
      <DialogContent className="overflow-hidden rounded-[2.5rem] border-white/20 bg-white/80 p-0 shadow-2xl backdrop-blur-2xl sm:max-w-[600px] dark:border-slate-800/50 dark:bg-slate-950/80">
        <div className="relative p-10">
          <div className="pointer-events-none absolute -top-24 -right-24 h-64 w-64 rounded-full bg-blue-500/10 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-24 -left-24 h-64 w-64 rounded-full bg-indigo-500/10 blur-3xl" />

          <DialogHeader className="mb-8 space-y-4">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-600 text-white shadow-lg shadow-blue-500/20">
                <LayoutGrid className="h-6 w-6" />
              </div>
              <div className="space-y-1">
                <DialogTitle className="text-3xl font-black tracking-tight text-slate-900 uppercase dark:text-white">
                  New Project
                </DialogTitle>
                <DialogDescription className="font-medium text-slate-500 italic">
                  Create a new workspace for your team collaboration
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          <div className="space-y-8">
            <div className="space-y-3">
              <Label
                htmlFor="title"
                className="ml-1 text-[10px] font-black tracking-[0.2em] text-slate-400 uppercase"
              >
                Project Title
              </Label>
              <Input
                id="title"
                placeholder="e.g., Q1 Marketing Campaign"
                className="h-14 rounded-2xl border-none bg-slate-50 px-6 font-bold shadow-inner transition-all focus:ring-4 focus:ring-blue-500/10 dark:bg-slate-900"
                value={title}
                onChange={(e) =>{  setTitle(e.target.value); }}
                disabled={loading}
              />
            </div>
            <div className="space-y-3">
              <Label
                htmlFor="description"
                className="ml-1 text-[10px] font-black tracking-[0.2em] text-slate-400 uppercase"
              >
                Description
              </Label>
              <Textarea
                id="description"
                placeholder="Outline the goals and scope of this project..."
                className="min-h-[120px] resize-none rounded-2xl border-none bg-slate-50 px-6 py-4 font-medium italic shadow-inner transition-all focus:ring-4 focus:ring-blue-500/10 dark:bg-slate-900"
                value={description}
                onChange={(e) =>{  setDescription(e.target.value); }}
                disabled={loading}
              />
            </div>
          </div>

          <div className="mt-10 flex justify-end gap-3">
            <Button
              variant="outline"
              className="h-14 rounded-2xl border-slate-100 px-8 text-[10px] font-black tracking-widest uppercase transition-all hover:bg-slate-50"
              onClick={() =>{  setOpen(false); }}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button
              className="h-14 gap-3 rounded-2xl bg-blue-600 px-8 text-[10px] font-black tracking-widest text-white uppercase shadow-xl shadow-blue-500/20 transition-all hover:scale-105 hover:bg-blue-700"
              onClick={handleSubmit}
              disabled={loading}
            >
              {loading ? (
                <>
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                  Creating...
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4" />
                  Create Project
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
