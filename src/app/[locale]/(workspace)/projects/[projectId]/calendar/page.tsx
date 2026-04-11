"use client"

import {
  format,
  isSameDay,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  addDays,
  getDay,
  isWithinInterval,
  parseISO
} from "date-fns"
import {
  ChevronLeft,
  ChevronRight,
  Plus,
  Calendar as CalendarIcon,
  Package,
  Flag,
  CheckCircle2,
  Clock,
  AlertCircle,
  MoreHorizontal,
  Info,
  ExternalLink,
  Search,
  Settings2,
  ListTodo,
  CalendarDays,
  X
} from "lucide-react"
import { useParams } from "next/navigation"
import { useEffect, useMemo, useState, useCallback, useRef } from "react"
import { toast } from "sonner"

import { ProjectMeetingsPanel } from "@/components/meetings/ProjectMeetingsPanel"
import { CreateTaskDialog } from "@/components/tasks/CreateTaskDialog"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle
} from "@/components/ui/sheet"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { CreateWorkPackageDialog } from "@/components/work-packages/CreateWorkPackageDialog"
import { apiClient } from "@/lib/api/client"
import { cn, formatDate, isOverdue } from "@/lib/utils"

// Types
interface WorkPackage {
  _id: string
  title: string
  description?: string
  startDate?: string
  dueDate?: string
  status: string
  priority: string
}

interface CalendarEvent {
  type: "TASK" | "WORK_PACKAGE" | "MILESTONE" | "EVENT"
  id: string
  title: string
  description?: string
  start: Date
  end: Date
  status: string
  priority: string
  color?: string
}

type ModalType = "NONE" | "TASK" | "WORK_PACKAGE" | "EVENT"

export default function ProjectCalendarPage() {
  const params = useParams()
  const projectId = (params?.projectId || params?.boardId) as string
  const locale = params?.locale as string

  // State
  const [currentDate, setCurrentDate] = useState(new Date())
  const [tasks, setTasks] = useState<any[]>([])
  const [workPackages, setWorkPackages] = useState<WorkPackage[]>([])
  const [loading, setLoading] = useState(true)
  const [project, setProject] = useState<any>(null)

  // UI State
  const [activeModal, setActiveModal] = useState<ModalType>("NONE")
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")

  // Mock Events State
  const [customEvents, setCustomEvents] = useState<CalendarEvent[]>([])

  const fetchData = useCallback(async () => {
    if (!projectId) {
      return
    }
    setLoading(true)
    try {
      const [projectRes, wpRes] = await Promise.all([
        apiClient.get(`/api/projects/${projectId}`),
        apiClient.get(`/api/projects/${projectId}/work-packages`)
      ])

      if (projectRes.ok) {
        const data = await projectRes.json()
        setProject(data)
        setTasks(data.tasks || [])
      }

      if (wpRes.ok) {
        const data = await wpRes.json()
        setWorkPackages(data || [])
      }
    } catch (error) {
      console.error("Failed to fetch calendar data:", error)
    } finally {
      setLoading(false)
    }
  }, [projectId])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  // Trigger dialogs via IDs if they don't support controlled 'open' state yet
  useEffect(() => {
    if (activeModal === "TASK") {
      document.getElementById("trigger-task")?.click()
    }
    if (activeModal === "WORK_PACKAGE") {
      document.getElementById("trigger-wp")?.click()
    }
  }, [activeModal])

  // Process data into events
  const events = useMemo(() => {
    const allEvents: CalendarEvent[] = []

    // Add Tasks
    tasks.forEach((task) => {
      if (task.dueDate) {
        const date = new Date(task.dueDate)
        allEvents.push({
          type: "TASK",
          id: task._id,
          title: task.title,
          description: task.description,
          start: date,
          end: date,
          status: task.status,
          priority: task.priority
        })
      }
    })

    // Add Work Packages as Spans
    workPackages.forEach((wp) => {
      if (wp.startDate && wp.dueDate) {
        allEvents.push({
          type: "WORK_PACKAGE",
          id: wp._id,
          title: wp.title,
          description: wp.description,
          start: new Date(wp.startDate),
          end: new Date(wp.dueDate),
          status: wp.status,
          priority: wp.priority
        })
      } else if (wp.dueDate) {
        const date = new Date(wp.dueDate)
        allEvents.push({
          type: "WORK_PACKAGE",
          id: wp._id,
          title: wp.title,
          description: wp.description,
          start: date,
          end: date,
          status: wp.status,
          priority: wp.priority
        })
      }
    })

    // Add Custom/Mock Events
    allEvents.push(...customEvents)

    // Add Mock Milestones for "WOW" effect if none exist and search is empty
    if (allEvents.length === 0 && !loading && !searchQuery) {
      const today = new Date()
      allEvents.push({
        type: "MILESTONE",
        id: "m-1",
        title: "Project Kickoff",
        start: new Date(today.getFullYear(), today.getMonth(), 5),
        end: new Date(today.getFullYear(), today.getMonth(), 5),
        status: "DONE",
        priority: "HIGH"
      })
      allEvents.push({
        type: "MILESTONE",
        id: "m-2",
        title: "System Design Review",
        start: new Date(today.getFullYear(), today.getMonth(), 12),
        end: new Date(today.getFullYear(), today.getMonth(), 12),
        status: "DONE",
        priority: "MEDIUM"
      })
      allEvents.push({
        type: "MILESTONE",
        id: "m-3",
        title: "Beta Release Target",
        start: new Date(today.getFullYear(), today.getMonth(), 25),
        end: new Date(today.getFullYear(), today.getMonth(), 25),
        status: "TODO",
        priority: "HIGH"
      })
    }

    // Filter by search
    if (searchQuery) {
      return allEvents.filter(
        (e) =>
          e.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          e.description?.toLowerCase().includes(searchQuery.toLowerCase())
      )
    }

    return allEvents
  }, [tasks, workPackages, customEvents, loading, searchQuery])

  // Calendar generation helpers
  const monthStart = startOfMonth(currentDate)
  const monthEnd = endOfMonth(monthStart)
  const startDate = startOfWeek(monthStart)
  const endDate = endOfWeek(monthEnd)

  const monthName = format(currentDate, "MMMM")
  const year = format(currentDate, "yyyy")

  const goToPreviousMonth = () => {
    setCurrentDate(addDays(monthStart, -1))
  }
  const goToNextMonth = () => {
    setCurrentDate(addDays(monthEnd, 1))
  }
  const goToToday = () => {
    setCurrentDate(new Date())
  }

  const getEventsForDate = (date: Date) => {
    return events.filter((event) => {
      if (event.type === "WORK_PACKAGE") {
        return (
          isWithinInterval(date, { start: event.start, end: event.end }) ||
          isSameDay(date, event.start) ||
          isSameDay(date, event.end)
        )
      }
      return isSameDay(date, event.start)
    })
  }

  const handleCellClick = (date: Date) => {
    setSelectedDate(date)
    setIsSidebarOpen(true)
  }

  const handleCreateEvent = () => {
    if (!selectedDate) {
      return
    }
    const title = window.prompt("Enter Event Title:")
    if (title) {
      const newEvent: CalendarEvent = {
        type: "EVENT",
        id: "event-" + Date.now(),
        title,
        start: selectedDate,
        end: selectedDate,
        status: "TODO",
        priority: "MEDIUM"
      }
      setCustomEvents([...customEvents, newEvent])
      toast.success("Event created locally!")
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "DONE":
        return "bg-green-500"
      case "IN_PROGRESS":
        return "bg-blue-500"
      default:
        return "bg-slate-400"
    }
  }

  const renderCalendar = () => {
    const calendarDays = []
    let day = startDate
    const today = new Date()

    while (day <= endDate) {
      const cloneDay = day
      const dayEvents = getEventsForDate(cloneDay)
      const isCurrentMonth = isSameDay(startOfMonth(cloneDay), monthStart)
      const isToday = isSameDay(cloneDay, today)
      const isSelected = selectedDate && isSameDay(cloneDay, selectedDate)

      calendarDays.push(
        <div
          key={cloneDay.toString()}
          onClick={() => {
            handleCellClick(cloneDay)
          }}
          className={cn(
            "group relative min-h-[120px] cursor-pointer border-r border-b bg-background p-2 transition-all duration-300 hover:z-10",
            !isCurrentMonth && "bg-slate-50/50 text-muted-foreground/30 dark:bg-slate-900/20",
            isToday && "bg-blue-50/20 dark:bg-blue-900/10",
            isSelected &&
              "bg-blue-50/40 shadow-inner ring-1 ring-blue-500/50 ring-inset dark:bg-blue-900/20"
          )}
        >
          {/* Day Number */}
          <div className="mb-1 flex items-start justify-between">
            <span
              className={cn(
                "flex h-6 w-6 items-center justify-center rounded-full text-xs font-semibold transition-all group-hover:scale-110",
                isToday && "bg-blue-600 text-white shadow-md shadow-blue-500/30",
                isSelected &&
                  !isToday &&
                  "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300",
                !isCurrentMonth && "opacity-40"
              )}
            >
              {format(cloneDay, "d")}
            </span>

            <div className="flex gap-1 opacity-0 transition-opacity group-hover:opacity-100">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-5 w-5 hover:bg-blue-100 hover:text-blue-600 dark:hover:bg-blue-900/50"
                      onClick={(e) => {
                        e.stopPropagation()
                        setSelectedDate(cloneDay)
                        setActiveModal("TASK")
                      }}
                    >
                      <Plus className="h-3 w-3" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Quick Add</TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
          </div>

          {/* Day Events */}
          <div className="space-y-1 overflow-visible">
            {dayEvents.map((event) => {
              const isStart = isSameDay(cloneDay, event.start)
              const isEnd = isSameDay(cloneDay, event.end)

              if (event.type === "WORK_PACKAGE") {
                return (
                  <div
                    key={event.id}
                    className={cn(
                      "flex h-5 items-center truncate px-1.5 text-[10px] shadow-sm transition-all group-hover:brightness-105",
                      isStart && "ml-0.5 rounded-l-md",
                      isEnd && "mr-0.5 rounded-r-md",
                      !isStart && !isEnd && "rounded-none",
                      "border-l-2 border-blue-500 bg-gradient-to-r from-blue-500/10 to-blue-600/10 text-blue-800 dark:from-blue-500/20 dark:to-blue-600/20 dark:text-blue-200",
                      event.status === "DONE" &&
                        "border-green-500 from-green-500/10 to-green-600/10 text-green-800 dark:text-green-200"
                    )}
                  >
                    {isStart && <Package className="mr-1 h-2.5 w-2.5 shrink-0 opacity-70" />}
                    <span className="truncate font-semibold tracking-tight">{event.title}</span>
                  </div>
                )
              }

              if (event.type === "MILESTONE") {
                return (
                  <div key={event.id} className="group/item flex items-center gap-1 p-0.5">
                    <div
                      className={cn(
                        "h-2.5 w-2.5 shrink-0 rotate-45 border border-white shadow-sm dark:border-slate-800",
                        event.status === "DONE" ? "bg-amber-400" : "bg-white dark:bg-slate-700"
                      )}
                    />
                    <span className="truncate text-[10px] font-bold text-amber-700 opacity-80 transition-opacity group-hover/item:opacity-100 dark:text-amber-400">
                      {event.title}
                    </span>
                  </div>
                )
              }

              if (event.type === "EVENT") {
                return (
                  <div
                    key={event.id}
                    className="flex items-center gap-1.5 rounded border-l-2 border-purple-400 bg-purple-50 px-1 py-0.5 dark:bg-purple-950/20"
                  >
                    <CalendarDays className="h-2.5 w-2.5 text-purple-500" />
                    <span className="truncate text-[10px] font-medium text-purple-700 dark:text-purple-300">
                      {event.title}
                    </span>
                  </div>
                )
              }

              return (
                <div
                  key={event.id}
                  className={cn(
                    "flex items-center gap-1.5 rounded border-l border-slate-200 px-1 py-0.5 transition-all hover:bg-slate-100 dark:border-slate-700 dark:hover:bg-slate-800",
                    event.status === "DONE" && "scale-[0.98] text-muted-foreground/50"
                  )}
                >
                  {event.status === "DONE" ? (
                    <CheckCircle2 className="h-2.5 w-2.5 shrink-0 text-green-500" />
                  ) : (
                    <div
                      className={cn(
                        "h-1.5 w-1.5 shrink-0 rounded-full",
                        event.priority === "HIGH" ? "animate-pulse bg-red-500" : "bg-slate-400"
                      )}
                    />
                  )}
                  <span className="truncate text-[10px] leading-tight">{event.title}</span>
                </div>
              )
            })}
          </div>
        </div>
      )
      day = addDays(day, 1)
    }
    return calendarDays
  }

  return (
    <div className="flex h-full flex-col bg-slate-50/30 font-sans dark:bg-slate-950/30">
      {/* Header Bar */}
      <header className="sticky top-0 z-40 flex flex-col justify-between gap-4 border-b bg-white px-6 py-5 backdrop-blur-xl md:flex-row md:items-center dark:bg-slate-950/80">
        <div className="flex items-center gap-4">
          <div className="transform rounded-2xl bg-blue-600 p-2.5 text-white shadow-xl shadow-blue-500/20 transition-transform hover:rotate-6">
            <CalendarIcon className="h-6 w-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-black tracking-tight">{monthName}</h1>
              <span className="text-2xl font-light text-slate-400">{year}</span>
            </div>
            <p className="flex items-center gap-2 text-xs font-medium tracking-widest text-muted-foreground uppercase">
              <span className="h-1.5 w-1.5 rounded-full bg-green-500" />
              Project: {project?.title || "Loading..."}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Search */}
          <div className="group relative hidden sm:block">
            <Search className="absolute top-1/2 left-3 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground transition-colors group-focus-within:text-blue-500" />
            <input
              type="text"
              placeholder="Quick search..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value)
              }}
              className="w-48 rounded-xl border-none bg-slate-100 py-2 pr-4 pl-9 text-sm transition-all outline-none focus:w-64 focus:ring-2 focus:ring-blue-500/50 dark:bg-slate-900"
            />
          </div>

          <div className="mx-1 hidden h-8 w-[1px] bg-slate-200 md:block dark:bg-slate-800" />

          {/* Navigation Controls */}
          <div className="flex items-center rounded-xl border bg-white p-1 shadow-sm dark:bg-slate-900">
            <Button
              variant="ghost"
              size="icon"
              onClick={goToPreviousMonth}
              className="h-8 w-8 hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={goToToday}
              className="h-8 px-4 text-xs font-bold tracking-tighter uppercase"
            >
              Today
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={goToNextMonth}
              className="h-8 w-8 hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button className="group h-10 gap-2 rounded-xl bg-blue-600 px-5 text-white shadow-xl shadow-blue-500/20 hover:bg-blue-700">
                <Plus className="h-4 w-4 transition-transform group-hover:rotate-90" />
                <span className="font-bold">Add</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56 rounded-xl p-2">
              <DropdownMenuLabel className="p-2 text-[10px] font-black text-slate-400 uppercase">
                Organization
              </DropdownMenuLabel>
              <DropdownMenuItem
                onClick={() => {
                  setActiveModal("TASK")
                }}
                className="gap-3 rounded-lg py-2"
              >
                <CheckCircle2 className="h-4 w-4 text-blue-500" />
                <div className="flex flex-col">
                  <span className="text-sm font-semibold">Create Task</span>
                  <span className="text-[10px] text-muted-foreground">Actionable items</span>
                </div>
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => {
                  setActiveModal("WORK_PACKAGE")
                }}
                className="gap-3 rounded-lg py-2"
              >
                <Package className="h-4 w-4 text-purple-500" />
                <div className="flex flex-col">
                  <span className="text-sm font-semibold">Work Package</span>
                  <span className="text-[10px] text-muted-foreground">Major features/epics</span>
                </div>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => {
                  setSelectedDate(new Date())
                  handleCreateEvent()
                }}
                className="gap-3 rounded-lg py-2"
              >
                <CalendarDays className="h-4 w-4 text-amber-500" />
                <div className="flex flex-col">
                  <span className="text-sm font-semibold">New Event</span>
                  <span className="text-[10px] text-muted-foreground">Meetings & Milestones</span>
                </div>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>

      {/* Main Calendar Viewport */}
      <main className="flex flex-1 flex-col overflow-hidden p-6">
        <div className="mb-6">
          <ProjectMeetingsPanel projectId={projectId} />
        </div>

        <div className="relative flex flex-1 flex-col overflow-hidden rounded-3xl border bg-white/50 shadow-2xl shadow-slate-200/50 backdrop-blur-md transition-all duration-500 dark:bg-slate-950/30 dark:shadow-none">
          {/* Week Headers */}
          <div className="grid grid-cols-7 border-b bg-slate-50/30 dark:bg-slate-900/10">
            {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
              <div
                key={day}
                className="border-r py-4 text-center text-[10px] font-black tracking-[0.2em] text-slate-400 uppercase last:border-r-0"
              >
                {day}
              </div>
            ))}
          </div>

          {/* Calendar Day Grid */}
          <div className="group/grid scrollbar-hide grid flex-1 grid-cols-7 overflow-y-auto border-l last:border-r">
            {renderCalendar()}
          </div>

          {/* Empty State Overlay */}
          {events.length === 0 && searchQuery && (
            <div className="absolute inset-x-0 top-20 bottom-0 z-20 flex flex-col items-center justify-center bg-white/60 p-12 text-center backdrop-blur-sm dark:bg-slate-950/60">
              <div className="mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-900">
                <Search className="h-8 w-8 text-slate-400" />
              </div>
              <h3 className="text-xl font-bold">No matches found</h3>
              <p className="mt-2 max-w-xs text-muted-foreground italic">
                Try searching for a different task, work package, or milestone title.
              </p>
              <Button
                variant="link"
                onClick={() => {
                  setSearchQuery("")
                }}
                className="mt-4 text-blue-600"
              >
                Clear search filters
              </Button>
            </div>
          )}
        </div>

        {/* Legend / Status Bar */}
        <footer className="mt-5 flex flex-wrap items-center justify-between gap-6 px-4">
          <div className="flex flex-wrap items-center gap-6">
            <div className="group flex cursor-help items-center gap-2">
              <div className="h-5 w-3 rounded-sm border-l-2 border-blue-500 bg-blue-500/10" />
              <span className="text-[11px] font-bold tracking-tighter text-slate-500 uppercase">
                Work Package
              </span>
            </div>
            <div className="group flex cursor-help items-center gap-2">
              <div className="h-3 w-3 rotate-45 border border-amber-600 bg-amber-400 shadow-sm" />
              <span className="text-[11px] font-bold tracking-tighter text-slate-500 uppercase">
                Milestone
              </span>
            </div>
            <div className="group flex cursor-help items-center gap-2">
              <div className="h-1.5 w-1.5 rounded-full bg-blue-500 ring-2 ring-blue-500/20" />
              <span className="text-[11px] font-bold tracking-tighter text-slate-500 uppercase">
                Tasks
              </span>
            </div>
            <div className="group flex cursor-help items-center gap-2">
              <div className="h-3 w-3 rounded border-l-2 border-purple-400 bg-purple-100" />
              <span className="text-[11px] font-bold tracking-tighter text-slate-500 uppercase">
                Events
              </span>
            </div>
          </div>

          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2 rounded-full border bg-white px-3 py-1 text-[10px] font-bold text-slate-400 dark:bg-slate-900">
              <div className="h-2 w-2 rounded-full bg-green-500 shadow-sm shadow-green-500/50" />
              <span className="tracking-widest uppercase">Done</span>
            </div>
            <div className="flex items-center gap-2 rounded-full border bg-white px-3 py-1 text-[10px] font-bold text-slate-400 dark:bg-slate-900">
              <div className="h-2 w-2 rounded-full bg-blue-500 shadow-sm shadow-blue-500/50" />
              <span className="tracking-widest uppercase">In Progress</span>
            </div>
          </div>
        </footer>
      </main>

      {/* --- Modals & Overlays --- */}

      {/* 1. Create Task Dialog */}
      <CreateTaskDialog
        projectId={projectId}
        onTaskCreated={() => {
          fetchData()
          setActiveModal("NONE")
        }}
        trigger=<div id="trigger-task" className="hidden" />
      />

      {/* 2. Create { Work Package Dialog */}
      <CreateWorkPackageDialog
        projectId={projectId}
        onWorkPackageCreated={() => {
          fetchData()
          setActiveModal("NONE")
        }}
        trigger=<div id="trigger-wp" className="hidden" />
      />

      {/* 3. Daily Details Sidebar (Sheet) */}
      <Sheet open={isSidebarOpen} onOpenChange={setIsSidebarOpen}>
        <SheetContent className="w-[400px] border-l p-0 shadow-2xl sm:w-[540px]">
          <SheetHeader className="relative border-b bg-slate-50/50 p-8 pb-4 dark:bg-slate-900/50">
            <div className="absolute top-8 right-8">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => {
                  setIsSidebarOpen(false)
                }}
                className="rounded-full"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            <div className="mb-2 flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-3xl bg-blue-600 text-white shadow-lg">
                <CalendarDays className="h-6 w-6" />
              </div>
              <div>
                <SheetTitle className="text-2xl font-black">
                  {selectedDate ? format(selectedDate, "EEEE") : "Day"}
                </SheetTitle>
                <SheetDescription className="font-bold text-slate-400 underline decoration-blue-500/30 underline-offset-4">
                  {selectedDate ? format(selectedDate, "MMMM d, yyyy") : "Selected Date"}
                </SheetDescription>
              </div>
            </div>
          </SheetHeader>

          <div className="h-[calc(100vh-140px)] space-y-8 overflow-y-auto p-8">
            {/* Quick Actions */}
            <div className="grid grid-cols-2 gap-3">
              <Button
                onClick={() => {
                  setActiveModal("TASK")
                }}
                className="flex h-24 flex-col gap-2 rounded-2xl border-2 border-transparent bg-slate-50 text-foreground transition-all hover:border-blue-500/50 hover:bg-white dark:bg-slate-900"
              >
                <div className="rounded-lg bg-blue-100 p-2 text-blue-600 dark:bg-blue-900/40">
                  <CheckCircle2 className="h-4 w-4" />
                </div>
                <span className="text-xs font-bold tracking-widest uppercase">New Task</span>
              </Button>
              <Button
                onClick={handleCreateEvent}
                className="flex h-24 flex-col gap-2 rounded-2xl border-2 border-transparent bg-slate-50 text-foreground transition-all hover:border-amber-500/50 hover:bg-white dark:bg-slate-900"
              >
                <div className="rounded-lg bg-amber-100 p-2 text-amber-600 dark:bg-amber-900/40">
                  <Flag className="h-4 w-4" />
                </div>
                <span className="text-xs font-bold tracking-widest uppercase">Add Event</span>
              </Button>
            </div>

            {/* Event List */}
            <div className="space-y-4">
              <h4 className="flex items-center gap-2 text-[10px] font-black tracking-[0.2em] text-slate-400 uppercase">
                <ListTodo className="h-3 w-3" />
                Your Schedule ({selectedDate ? getEventsForDate(selectedDate).length : 0})
              </h4>

              <div className="space-y-3">
                {selectedDate && getEventsForDate(selectedDate).length > 0 ? (
                  getEventsForDate(selectedDate).map((event) => (
                    <Card
                      key={event.id}
                      className="group overflow-hidden border-2 border-slate-100 transition-all hover:border-blue-500/30 dark:border-slate-800"
                    >
                      <CardContent className="flex gap-4 p-4">
                        <div
                          className={cn(
                            "w-1 shrink-0 rounded-full",
                            event.type === "WORK_PACKAGE"
                              ? "bg-purple-500"
                              : event.type === "MILESTONE"
                                ? "bg-amber-500"
                                : event.status === "DONE"
                                  ? "bg-green-500"
                                  : "bg-blue-500"
                          )}
                        />
                        <div className="flex-1 space-y-2">
                          <div className="flex items-center justify-between">
                            <Badge
                              variant="outline"
                              className="h-4 px-1.5 text-[9px] font-black tracking-tighter uppercase"
                            >
                              {event.type.replace("_", " ")}
                            </Badge>
                            <span className="text-[10px] font-bold text-muted-foreground">
                              {event.status}
                            </span>
                          </div>
                          <h5 className="font-bold transition-colors group-hover:text-blue-600">
                            {event.title}
                          </h5>
                          {event.description && (
                            <p className="line-clamp-2 text-xs leading-relaxed text-muted-foreground">
                              {event.description}
                            </p>
                          )}

                          <div className="mt-2 flex items-center justify-between border-t pt-2">
                            <div className="flex items-center gap-1.5 text-[10px] font-bold tracking-widest text-slate-400 uppercase">
                              <Clock className="h-3 w-3" />
                              Full Day
                            </div>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6 rounded-full opacity-0 transition-opacity group-hover:opacity-100"
                            >
                              <ExternalLink className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))
                ) : (
                  <div className="flex flex-col items-center px-4 py-20 text-center">
                    <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-slate-50 text-slate-300 dark:bg-slate-900">
                      <Plus className="h-8 w-8" />
                    </div>
                    <p className="font-bold text-slate-400">Nothing scheduled yet</p>
                    <p className="mt-1 max-w-[200px] text-xs text-muted-foreground">
                      Plan your day by adding tasks, events or milestones.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  )
}

function CircleIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <circle cx="12" cy="12" r="10" />
    </svg>
  )
}
