"use client"

import "gantt-task-react/dist/index.css"

import { Gantt, Task, ViewMode } from "gantt-task-react"
import {
  Calendar,
  ChevronLeft,
  ChevronRight,
  LayoutList,
  CheckCircle2,
  Loader2
} from "lucide-react"
import React, { useState, useEffect } from "react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { apiClient } from "@/lib/api/client"

interface GanttChartProps {
  projectId: string
}

export function GanttChart({ projectId }: GanttChartProps) {
  const [tasks, setTasks] = useState<Task[]>([])
  const [view, setView] = useState<ViewMode>(ViewMode.Month)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (projectId) {
      fetchTasks()
    }
  }, [projectId])

  const fetchTasks = async () => {
    try {
      setLoading(true)
      const response = await apiClient.get(`/api/projects/${projectId}/tasks`)
      if (response.ok) {
        const data = await response.json()
        const rawTasks = Array.isArray(data) ? data : data.tasks || []

        if (rawTasks.length === 0) {
          setTasks([])
          setLoading(false)
          return
        }

        // Map backend tasks to Gantt tasks
        const mappedTasks: Task[] = rawTasks.map((t: any, index: number) => {
          const start = t.createdAt ? new Date(t.createdAt) : new Date()
          const end = t.dueDate
            ? new Date(t.dueDate)
            : new Date(start.getTime() + 3 * 24 * 60 * 60 * 1000)

          // Ensure end is not before start
          const actualEnd =
            end.getTime() < start.getTime() ? new Date(start.getTime() + 24 * 60 * 60 * 1000) : end

          let progress = 0
          if (t.status === "DONE") {
            progress = 100
          } else if (t.status === "IN_PROGRESS" || t.status === "DOING") {
            progress = 50
          }

          let progressColor = "#6366f1" // Indigo
          let progressSelectedColor = "#4f46e5"

          if (t.status === "DONE") {
            progressColor = "#10b981" // Emerald
            progressSelectedColor = "#059669"
          } else if (t.priority === "URGENT" || t.priority === "HIGH") {
            progressColor = "#f43f5e" // Rose
            progressSelectedColor = "#e11d48"
          }

          return {
            start,
            end: actualEnd,
            name: t.title,
            id: t._id,
            type: "task",
            progress,
            displayOrder: index + 1,
            styles: {
              progressColor:
                t.status === "DONE"
                  ? "#10b981"
                  : t.priority === "URGENT" || t.priority === "HIGH"
                    ? "#f43f5e"
                    : "#6366f1",
              progressSelectedColor:
                t.status === "DONE"
                  ? "#059669"
                  : t.priority === "URGENT" || t.priority === "HIGH"
                    ? "#e11d48"
                    : "#4f46e5",
              backgroundColor: "rgba(99, 102, 241, 0.15)",
              backgroundSelectedColor: "rgba(99, 102, 241, 0.25)"
            }
          }
        })

        setTasks(mappedTasks)
      }
    } catch (err) {
      console.error("Failed to fetch gantt tasks:", err)
    } finally {
      setLoading(false)
    }
  }

  const handleTaskChange = async (task: Task) => {
    // Optimistic update
    setTasks(tasks.map((t) => (t.id === task.id ? task : t)))

    try {
      const resp = await apiClient.patch(`/api/tasks/${task.id}`, {
        dueDate: task.end
      })
      if (resp.ok) {
        toast.success("Timeline updated", {
          description: `"${task.name}" scheduled to ${task.end.toLocaleDateString()}`
        })
      }
    } catch (err) {
      console.error("Failed to sync task change:", err)
      toast.error("Failed to save changes")
      fetchTasks()
    }
  }

  const handleTaskDelete = async (task: Task) => {
    const conf = window.confirm('Are you sure you want to delete "' + task.name + '"?')
    if (conf) {
      try {
        const response = await apiClient.delete(`/api/tasks/${task.id}`)
        if (response.ok) {
          setTasks(tasks.filter((t) => t.id !== task.id))
          toast.success("Task deleted")
        }
      } catch (err) {
        console.error("Failed to delete task:", err)
        toast.error("Failed to delete task")
      }
    }
    return conf
  }

  const handleProgressChange = async (task: Task) => {
    setTasks(tasks.map((t) => (t.id === task.id ? task : t)))

    try {
      let status = "IN_PROGRESS"
      if (task.progress === 100) {
        status = "DONE"
      } else if (task.progress === 0) {
        status = "TODO"
      }

      const resp = await apiClient.patch(`/api/tasks/${task.id}`, {
        status
      })
      if (resp.ok) {
        toast.success(`Status updated: ${status}`)
      }
    } catch (err) {
      console.error("Failed to sync progress change:", err)
      toast.error("Failed to update status")
    }
  }

  const handleDblClick = (task: Task) => {
    // alert("On Double Click event Id:" + task.id)
  }

  const handleSelect = (task: Task, isSelected: boolean) => {
    // console.log(task.name + " has " + (isSelected ? "selected" : "unselected"))
  }

  const handleExpanderClick = (task: Task) => {
    setTasks(tasks.map((t) => (t.id === task.id ? task : t)))
  }

  return (
    <div className="flex h-full w-full flex-col gap-6 overflow-hidden">
      {/* Controls & Legend */}
      <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
        <div className="flex items-center rounded-2xl bg-slate-200/50 p-1 tracking-wider uppercase shadow-inner dark:bg-slate-800/50">
          <button
            className={`rounded-xl px-6 py-2 text-[11px] font-black transition-all ${view === ViewMode.Day ? "scale-105 bg-white text-indigo-600 shadow-md dark:bg-slate-700 dark:text-white" : "text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200"}`}
            onClick={() => {
              setView(ViewMode.Day)
            }}
          >
            Day
          </button>
          <button
            className={`rounded-xl px-6 py-2 text-[11px] font-black transition-all ${view === ViewMode.Week ? "scale-105 bg-white text-indigo-600 shadow-md dark:bg-slate-700 dark:text-white" : "text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200"}`}
            onClick={() => {
              setView(ViewMode.Week)
            }}
          >
            Week
          </button>
          <button
            className={`rounded-xl px-6 py-2 text-[11px] font-black transition-all ${view === ViewMode.Month ? "scale-105 bg-white text-indigo-600 shadow-md dark:bg-slate-700 dark:text-white" : "text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200"}`}
            onClick={() => {
              setView(ViewMode.Month)
            }}
          >
            Month
          </button>
        </div>

        <div className="flex items-center gap-6 px-4">
          <div className="flex items-center gap-2">
            <div className="h-2.5 w-2.5 rounded-full bg-emerald-500 shadow-lg shadow-emerald-500/30" />
            <span className="text-[10px] font-black tracking-[0.2em] text-slate-500 uppercase dark:text-slate-400">
              Done
            </span>
          </div>
          <div className="flex items-center gap-2">
            <div className="h-2.5 w-2.5 rounded-full bg-indigo-500 shadow-lg shadow-indigo-500/30" />
            <span className="text-[10px] font-black tracking-[0.2em] text-slate-500 uppercase dark:text-slate-400">
              In Progress
            </span>
          </div>
          <div className="flex items-center gap-2">
            <div className="h-2.5 w-2.5 rounded-full bg-rose-500 shadow-lg shadow-rose-500/30" />
            <span className="text-[10px] font-black tracking-[0.2em] text-slate-500 uppercase dark:text-slate-400">
              Urgent
            </span>
          </div>
        </div>
      </div>

      {/* Gantt Chart Wrapper */}
      <div className="relative flex-1 overflow-hidden rounded-3xl border border-slate-200 bg-slate-50/50 transition-all duration-300 group-hover:border-blue-500/30 dark:border-slate-800 dark:bg-slate-950/50">
        {loading ? (
          <div className="flex h-96 w-full flex-col items-center justify-center gap-4">
            <Loader2 className="h-10 w-10 animate-spin text-blue-600" />
            <p className="text-xs font-black tracking-widest text-slate-400 uppercase">
              Synchronizing Timeline...
            </p>
          </div>
        ) : tasks.length > 0 ? (
          <div className="custom-gantt-styles h-full min-w-full">
            <Gantt
              tasks={tasks}
              viewMode={view}
              onDateChange={handleTaskChange}
              onDelete={handleTaskDelete}
              onProgressChange={handleProgressChange}
              onDoubleClick={handleDblClick}
              onSelect={handleSelect}
              onExpanderClick={handleExpanderClick}
              listCellWidth="220px"
              columnWidth={view === ViewMode.Month ? 300 : view === ViewMode.Week ? 200 : 100}
              barBackgroundColor="#f1f5f9"
              barProgressColor="#6366f1"
              barProgressSelectedColor="#4f46e5"
              projectBackgroundColor="#f8fafc"
              projectProgressColor="#94a3b8"
              projectProgressSelectedColor="#64748b"
              milestoneBackgroundColor="#a855f7"
              arrowColor="#cbd5e1"
              fontFamily="inherit"
              fontSize="12px"
              rowHeight={52}
              headerHeight={65}
            />
          </div>
        ) : (
          <div className="flex h-96 w-full flex-col items-center justify-center gap-4 p-8 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-100 dark:bg-slate-800">
              <Calendar className="h-8 w-8 text-slate-300" />
            </div>
            <h3 className="text-lg font-black tracking-tight text-slate-900 dark:text-white">
              No Timeline Data
            </h3>
            <p className="max-w-xs text-sm font-medium text-slate-500">
              There are no tasks with deadlines in this project yet. Add tasks with due dates to see
              them here.
            </p>
          </div>
        )}
      </div>

      <div className="mt-2 flex items-center justify-center gap-2">
        <CheckCircle2 className="h-3 w-3 text-blue-500" />
        <p className="text-[11px] font-medium text-slate-500 italic">
          Double-click a task to edit. Drag edges to resize. Drag task to reposition on timeline.
        </p>
      </div>

      <style jsx global>{`
        .custom-gantt-styles .gridRow {
          fill: transparent !important;
        }
        .custom-gantt-styles .gridRowLine {
          stroke: rgba(226, 232, 240, 0.6) !important;
        }
        .dark .custom-gantt-styles .gridRowLine {
          stroke: rgba(51, 65, 85, 0.5) !important;
        }
        .custom-gantt-styles .gridTick {
          stroke: rgba(226, 232, 240, 1) !important;
        }
        .dark .custom-gantt-styles .gridTick {
          stroke: rgba(51, 65, 85, 0.8) !important;
        }
        .custom-gantt-styles .calendarHeader {
          fill: rgba(248, 250, 252, 0.8) !important;
          font-weight: 800 !important;
          text-transform: uppercase !important;
          letter-spacing: 0.1em !important;
          font-size: 10px !important;
        }
        .dark .custom-gantt-styles .calendarHeader {
          fill: rgba(15, 23, 42, 0.8) !important;
        }
        .custom-gantt-styles .calendarHeader text {
          fill: #64748b !important;
        }
        .dark .custom-gantt-styles .calendarHeader text {
          fill: #94a3b8 !important;
        }
        .custom-gantt-styles .barLabel {
          fill: #111827 !important;
          font-weight: 800 !important;
          font-size: 11px !important;
          paint-order: stroke;
          stroke: #ffffff;
          stroke-width: 2px;
          stroke-linecap: round;
          stroke-linejoin: round;
        }
        .dark .custom-gantt-styles .barLabel {
          fill: #f9fafb !important;
          stroke: #111827;
        }
        .custom-gantt-styles .taskListHeader {
          background-color: #f8fafc !important;
          border-bottom: 2px solid #e2e8f0 !important;
          font-weight: 900 !important;
          text-transform: uppercase !important;
          font-size: 10px !important;
          letter-spacing: 0.15em !important;
          color: #64748b !important;
        }
        .dark .custom-gantt-styles .taskListHeader {
          background-color: #0f172a !important;
          border-bottom: 2px solid #1e293b !important;
          color: #94a3b8 !important;
        }
        .custom-gantt-styles .taskListItem {
          border-bottom: 1px solid #f1f5f9 !important;
          font-weight: 600 !important;
          color: #334155 !important;
        }
        .dark .custom-gantt-styles .taskListItem {
          border-bottom: 1px solid #1e293b !important;
          color: #cbd5e1 !important;
        }
        .custom-gantt-styles .taskListItem:nth-child(even) {
          background-color: rgba(248, 250, 252, 0.5);
        }
        .dark .custom-gantt-styles .taskListItem:nth-child(even) {
          background-color: rgba(30, 41, 59, 0.3);
        }
        /* Fix for bar visibility in dark mode */
        .dark .custom-gantt-styles .barBackground {
          fill: #1e293b !important;
          opacity: 0.8;
        }
      `}</style>
    </div>
  )
}

function getStartEndDateForProject(tasks: Task[], projectId: string) {
  const projectTasks = tasks.filter((t) => t.project === projectId)
  let start = projectTasks[0].start
  let end = projectTasks[0].end

  for (let i = 0; i < projectTasks.length; i++) {
    const task = projectTasks[i]
    if (start.getTime() > task.start.getTime()) {
      start = task.start
    }
    if (end.getTime() < task.end.getTime()) {
      end = task.end
    }
  }
  return [start, end]
}
