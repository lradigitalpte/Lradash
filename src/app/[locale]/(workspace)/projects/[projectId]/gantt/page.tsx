"use client"

import { ArrowLeft, Download, Plus, LayoutList } from "lucide-react"
import Link from "next/link"
import { useParams } from "next/navigation"
import { useState, useEffect } from "react"

import { GanttChart } from "@/components/gantt/GanttChart" // Import our new component
import { Button } from "@/components/ui/button"
import { apiClient } from "@/lib/api/client"

export default function GanttPage() {
  const params = useParams()
  const projectId = (params?.projectId || params?.boardId) as string
  const locale = params?.locale as string
  const [project, setProject] = useState<any>(null)

  // Fetch project details just for the title
  useEffect(() => {
    if (projectId) {
      const fetchProject = async () => {
        try {
          const response = await apiClient.get(`/api/projects/${projectId}`)
          if (response.ok) {
            const data = await response.json()
            setProject(data)
          }
        } catch (err) {
          setProject({ title: "Project Alpha" })
        }
      }
      fetchProject()
    }
  }, [projectId])

  return (
    <div className="mx-auto min-h-screen max-w-7xl space-y-8 bg-[#f8fafc] p-8 transition-all duration-500 dark:bg-slate-950">
      {/* WOW Header Section */}
      <div className="flex flex-col justify-between gap-6 md:flex-row md:items-end">
        <div className="flex items-start gap-5">
          {/* 3D/High-contrast Icon Container */}
          <div className="flex h-16 w-16 transform items-center justify-center rounded-[2rem] bg-gradient-to-br from-blue-600 to-indigo-700 shadow-xl shadow-blue-500/20 transition-transform duration-300 hover:rotate-6">
            <LayoutList className="h-8 w-8 stroke-[2.5] text-white" />
          </div>

          <div className="space-y-1">
            {/* Micro Label Context Badge */}
            <span className="rounded-full bg-blue-50 px-3 py-1 text-[10px] font-black tracking-[0.2em] text-blue-600 uppercase dark:bg-blue-900/30 dark:text-blue-400">
              Project Timeline
            </span>
            <h1 className="text-4xl font-black tracking-tighter text-slate-900 dark:text-white">
              Gantt Chart
            </h1>
            <p className="text-sm font-medium text-slate-500 italic dark:text-slate-400">
              Visualizing milestones for{" "}
              <span className="font-bold text-blue-600 not-italic dark:text-blue-400">
                {project?.title || "Project Alpha"}
              </span>
            </p>
          </div>
        </div>

        <div className="flex gap-3 pb-1">
          <Link href={`/${locale}/projects/${projectId}`}>
            <Button
              variant="outline"
              className="rounded-xl border-slate-200 transition-all hover:bg-slate-50 dark:border-slate-800 dark:hover:bg-slate-800"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back
            </Button>
          </Link>
          <Button
            variant="outline"
            className="rounded-xl border-slate-200 shadow-sm dark:border-slate-800"
            onClick={() => {
              alert("Export function would go here")
            }}
          >
            <Download className="mr-2 h-4 w-4" />
            Export
          </Button>
          <Button
            className="rounded-xl bg-blue-600 shadow-lg shadow-blue-500/25 transition-all hover:-translate-y-0.5 hover:bg-blue-700"
            onClick={() => {
              alert("Create Task function would go here")
            }}
          >
            <Plus className="mr-2 h-4 w-4" />
            Create Task
          </Button>
        </div>
      </div>

      {/* Main Gantt Content with Glassmorphism */}
      <div className="group relative">
        <div className="absolute -inset-1 rounded-[2.5rem] bg-gradient-to-r from-blue-600 to-indigo-600 opacity-5 blur transition duration-1000 group-hover:opacity-10 group-hover:duration-200" />
        <div className="relative flex-1 overflow-hidden rounded-[2.5rem] border border-white/20 bg-white/80 p-6 shadow-2xl shadow-slate-200/50 backdrop-blur-2xl dark:border-slate-800/50 dark:bg-slate-900/80 dark:shadow-none">
          <GanttChart />
        </div>
      </div>
    </div>
  )
}
