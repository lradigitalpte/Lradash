"use client"

import "gantt-task-react/dist/index.css"

import { Gantt, Task, ViewMode } from "gantt-task-react"
import { Calendar, ChevronLeft, ChevronRight, LayoutList, CheckCircle2 } from "lucide-react"
import React, { useState } from "react"

import { Button } from "@/components/ui/button"

// Mock Data Generator
const generateMockTasks = (): Task[] => {
  const currentDate = new Date()
  const tasks: Task[] = [
    {
      start: new Date(currentDate.getFullYear(), currentDate.getMonth(), 1),
      end: new Date(currentDate.getFullYear(), currentDate.getMonth(), 15),
      name: "Project Alpha Launch",
      id: "ProjectSample",
      progress: 45,
      type: "project",
      hideChildren: false,
      displayOrder: 1,
      styles: { progressColor: "#ffbb54", progressSelectedColor: "#ff9e0d" }
    },
    {
      start: new Date(currentDate.getFullYear(), currentDate.getMonth(), 1),
      end: new Date(currentDate.getFullYear(), currentDate.getMonth(), 5),
      name: "Requirement Analysis",
      id: "Task 0",
      progress: 100,
      type: "task",
      project: "ProjectSample",
      displayOrder: 2,
      styles: { progressColor: "#22c55e", progressSelectedColor: "#16a34a" } // Green for done
    },
    {
      start: new Date(currentDate.getFullYear(), currentDate.getMonth(), 6),
      end: new Date(currentDate.getFullYear(), currentDate.getMonth(), 10),
      name: "Design Phase",
      id: "Task 1",
      progress: 60,
      dependencies: ["Task 0"],
      type: "task",
      project: "ProjectSample",
      displayOrder: 3,
      styles: { progressColor: "#3b82f6", progressSelectedColor: "#2563eb" } // Blue
    },
    {
      start: new Date(currentDate.getFullYear(), currentDate.getMonth(), 11),
      end: new Date(currentDate.getFullYear(), currentDate.getMonth(), 15),
      name: "Development Sprint 1",
      id: "Task 2",
      progress: 20,
      dependencies: ["Task 1"],
      type: "task",
      project: "ProjectSample",
      displayOrder: 4,
      styles: { progressColor: "#ef4444", progressSelectedColor: "#dc2626" } // Red/Urgent
    },
    {
      start: new Date(currentDate.getFullYear(), currentDate.getMonth(), 15),
      end: new Date(currentDate.getFullYear(), currentDate.getMonth(), 15),
      name: "Milestone: MVP Ready",
      id: "Task 3",
      progress: 0,
      dependencies: ["Task 2"],
      type: "milestone",
      project: "ProjectSample",
      displayOrder: 5,
      styles: { progressColor: "#a855f7", progressSelectedColor: "#9333ea" } // Purple
    },
    // Another Work Package
    {
      start: new Date(currentDate.getFullYear(), currentDate.getMonth(), 8),
      end: new Date(currentDate.getFullYear(), currentDate.getMonth(), 25),
      name: "Marketing Campaign",
      id: "ProjectMarketing",
      progress: 15,
      type: "project",
      hideChildren: false,
      displayOrder: 6
    },
    {
      start: new Date(currentDate.getFullYear(), currentDate.getMonth(), 8),
      end: new Date(currentDate.getFullYear(), currentDate.getMonth(), 12),
      name: "Content Creation",
      id: "Task 4",
      progress: 30,
      type: "task",
      project: "ProjectMarketing",
      displayOrder: 7
    },
    {
      start: new Date(currentDate.getFullYear(), currentDate.getMonth(), 15),
      end: new Date(currentDate.getFullYear(), currentDate.getMonth(), 25),
      name: "Social Media Push",
      id: "Task 5",
      progress: 0,
      dependencies: ["Task 4"],
      type: "task",
      project: "ProjectMarketing",
      displayOrder: 8
    }
  ]
  return tasks
}

export function GanttChart() {
  const [tasks, setTasks] = useState<Task[]>(generateMockTasks())
  const [view, setView] = useState<ViewMode>(ViewMode.Month)

  const handleTaskChange = (task: Task) => {
    let newTasks = tasks.map((t) => (t.id === task.id ? task : t))
    if (task.project) {
      const [start, end] = getStartEndDateForProject(newTasks, task.project)
      const project = newTasks.find((t) => t.id === task.project)
      if (
        project &&
        (project.start.getTime() !== start.getTime() || project.end.getTime() !== end.getTime())
      ) {
        const changedProject = { ...project, start, end }
        newTasks = newTasks.map((t) => (t.id === task.project ? changedProject : t))
      }
    }
    setTasks(newTasks)
  }

  const handleTaskDelete = (task: Task) => {
    const conf = window.confirm("Are you sure about " + task.name + " ?")
    if (conf) {
      setTasks(tasks.filter((t) => t.id !== task.id))
    }
    return conf
  }

  const handleProgressChange = async (task: Task) => {
    setTasks(tasks.map((t) => (t.id === task.id ? task : t)))
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
        <div className="flex items-center rounded-2xl bg-slate-100 p-1 tracking-wider uppercase shadow-inner dark:bg-slate-800">
          <button
            className={`rounded-xl px-6 py-2 text-[11px] font-black transition-all ${view === ViewMode.Day ? "scale-105 bg-white text-blue-600 shadow-md dark:bg-slate-700" : "text-slate-500 hover:text-slate-900 dark:hover:text-slate-300"}`}
            onClick={() =>{  setView(ViewMode.Day); }}
          >
            Day
          </button>
          <button
            className={`rounded-xl px-6 py-2 text-[11px] font-black transition-all ${view === ViewMode.Week ? "scale-105 bg-white text-blue-600 shadow-md dark:bg-slate-700" : "text-slate-500 hover:text-slate-900 dark:hover:text-slate-300"}`}
            onClick={() =>{  setView(ViewMode.Week); }}
          >
            Week
          </button>
          <button
            className={`rounded-xl px-6 py-2 text-[11px] font-black transition-all ${view === ViewMode.Month ? "scale-105 bg-white text-blue-600 shadow-md dark:bg-slate-700" : "text-slate-500 hover:text-slate-900 dark:hover:text-slate-300"}`}
            onClick={() =>{  setView(ViewMode.Month); }}
          >
            Month
          </button>
        </div>

        <div className="flex items-center gap-6 px-4">
          <div className="flex items-center gap-2">
            <div className="h-2.5 w-2.5 rounded-full bg-emerald-500 shadow-lg shadow-emerald-500/30" />
            <span className="text-[10px] font-black tracking-[0.2em] text-slate-400 uppercase">
              Done
            </span>
          </div>
          <div className="flex items-center gap-2">
            <div className="h-2.5 w-2.5 rounded-full bg-blue-500 shadow-lg shadow-blue-500/30" />
            <span className="text-[10px] font-black tracking-[0.2em] text-slate-400 uppercase">
              In Progress
            </span>
          </div>
          <div className="flex items-center gap-2">
            <div className="h-2.5 w-2.5 rounded-full bg-rose-500 shadow-lg shadow-rose-500/30" />
            <span className="text-[10px] font-black tracking-[0.2em] text-slate-400 uppercase">
              Critical
            </span>
          </div>
        </div>
      </div>

      {/* Gantt Chart Wrapper */}
      <div className="flex-1 overflow-hidden rounded-3xl border border-slate-200 bg-slate-50/50 transition-all duration-300 group-hover:border-blue-500/30 dark:border-slate-800 dark:bg-slate-950/50">
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
            listCellWidth="200px"
            columnWidth={view === ViewMode.Month ? 300 : 70}
            barBackgroundColor="#e2e8f0"
            barProgressColor="#2563eb"
            barProgressSelectedColor="#1d4ed8"
            projectBackgroundColor="#f1f5f9"
            projectProgressColor="#475569"
            projectProgressSelectedColor="#1e293b"
            milestoneBackgroundColor="#a855f7"
            arrowColor="#94a3b8"
            fontFamily="inherit"
            fontSize="12px"
            rowHeight={48}
            headerHeight={60}
          />
        </div>
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
          stroke: rgba(226, 232, 240, 0.4) !important;
        }
        .dark .custom-gantt-styles .gridRowLine {
          stroke: rgba(30, 41, 59, 0.4) !important;
        }
        .custom-gantt-styles .gridTick {
          stroke: rgba(226, 232, 240, 0.8) !important;
        }
        .dark .custom-gantt-styles .gridTick {
          stroke: rgba(30, 41, 59, 0.8) !important;
        }
        .custom-gantt-styles .calendarHeader {
          fill: transparent !important;
          font-weight: 700 !important;
          text-transform: uppercase !important;
          letter-spacing: 0.05em !important;
        }
        .custom-gantt-styles .barLabel {
          fill: #475569 !important;
          font-weight: 600 !important;
        }
        .dark .custom-gantt-styles .barLabel {
          fill: #e2e8f0 !important;
        }
        .custom-gantt-styles .taskListHeader {
          background-color: transparent !important;
          border-bottom: 1px solid rgba(226, 232, 240, 0.8) !important;
          font-weight: 800 !important;
          text-transform: uppercase !important;
          font-size: 10px !important;
          letter-spacing: 0.1em !important;
        }
        .dark .custom-gantt-styles .taskListHeader {
          border-bottom: 1px solid rgba(30, 41, 59, 0.8) !important;
        }
        .custom-gantt-styles .taskListItem {
          border-bottom: 1px solid rgba(226, 232, 240, 0.4) !important;
          font-weight: 500 !important;
        }
        .dark .custom-gantt-styles .taskListItem {
          border-bottom: 1px solid rgba(30, 41, 59, 0.4) !important;
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
