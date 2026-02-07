"use client"

import {
  ChevronLeft,
  ChevronRight,
  Clock,
  Filter,
  Plus,
  AlertCircle,
  CheckCircle,
  Calendar as CalendarIcon
} from "lucide-react"
import { useEffect, useMemo, useState } from "react"

import { StatusBadge, UserAvatar } from "@/components/common"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useTaskStore } from "@/lib/store"
import { cn, formatDate, getDaysUntil, isOverdue } from "@/lib/utils"

type ViewType = "month" | "week" | "agenda"

export default function CalendarPage() {
  const projects = useTaskStore((state) => state.projects)
  const [currentDate, setCurrentDate] = useState(new Date())
  const [viewType, setViewType] = useState<ViewType>("month")
  const [selectedDateFilter, setSelectedDateFilter] = useState<Date | null>(null)

  // Get all tasks
  const allTasks = useMemo(() => {
    return projects.flatMap((p) =>
      (p.tasks || []).map((task) => ({
        ...task,
        projectTitle: p.title,
        projectId: p._id
      }))
    )
  }, [projects])

  // Get tasks for current month/week
  const tasksWithDates = useMemo(() => {
    return allTasks.filter((t) => t.dueDate).sort((a, b) => {
      const dateA = new Date(a.dueDate!).getTime()
      const dateB = new Date(b.dueDate!).getTime()
      return dateA - dateB
    })
  }, [allTasks])

  const daysInMonth = (date: Date) => new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate()
  const firstDayOfMonth = (date: Date) => new Date(date.getFullYear(), date.getMonth(), 1).getDay()

  const monthDays = Array.from({ length: daysInMonth(currentDate) }, (_, i) => i + 1)
  const emptyDays = Array.from({ length: firstDayOfMonth(currentDate) })

  const getTasksForDate = (day: number) => {
    const dateStr = new Date(currentDate.getFullYear(), currentDate.getMonth(), day)
      .toISOString()
      .split("T")[0]
    return tasksWithDates.filter(
      (t) => t.dueDate && new Date(t.dueDate).toISOString().split("T")[0] === dateStr
    )
  }

  const handlePrevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1))
  }

  const handleNextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1))
  }

  const handleToday = () => {
    setCurrentDate(new Date())
  }

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Calendar</h1>
          <p className="text-muted-foreground">Track task deadlines and milestones</p>
        </div>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          New Task
        </Button>
      </div>

      {/* Controls */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between bg-card border rounded-lg p-4">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" onClick={handlePrevMonth}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <h2 className="text-lg font-semibold min-w-64 text-center">
            {currentDate.toLocaleDateString("en-US", { month: "long", year: "numeric" })}
          </h2>
          <Button variant="outline" size="icon" onClick={handleNextMonth}>
            <ChevronRight className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="sm" onClick={handleToday}>
            Today
          </Button>
        </div>

        <Tabs value={viewType} onValueChange={(v) => setViewType(v as ViewType)}>
          <TabsList>
            <TabsTrigger value="month">Month</TabsTrigger>
            <TabsTrigger value="week">Week</TabsTrigger>
            <TabsTrigger value="agenda">Agenda</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* Calendar Views */}
      {viewType === "month" && <MonthView currentDate={currentDate} getTasksForDate={getTasksForDate} monthDays={monthDays} emptyDays={emptyDays} />}

      {viewType === "week" && <WeekView currentDate={currentDate} tasksWithDates={tasksWithDates} />}

      {viewType === "agenda" && <AgendaView tasksWithDates={tasksWithDates} />}
    </div>
  )
}

// Month View Component
interface MonthViewProps {
  currentDate: Date
  getTasksForDate: (day: number) => any[]
  monthDays: number[]
  emptyDays: any[]
}

function MonthView({ currentDate, getTasksForDate, monthDays, emptyDays }: MonthViewProps) {
  const dayLabels = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]

  const today = new Date()
  const isCurrentMonth = today.getMonth() === currentDate.getMonth() && today.getFullYear() === currentDate.getFullYear()

  return (
    <Card>
      <CardContent className="p-0">
        <div className="grid grid-cols-7 gap-0 border">
          {/* Day Labels */}
          {dayLabels.map((label) => (
            <div key={label} className="border-b border-r bg-muted p-3 text-center font-semibold text-sm">
              {label}
            </div>
          ))}

          {/* Empty Days */}
          {emptyDays.map((_, i) => (
            <div key={`empty-${i}`} className="min-h-24 border-b border-r bg-muted/50" />
          ))}

          {/* Calendar Days */}
          {monthDays.map((day) => {
            const tasks = getTasksForDate(day)
            const isToday = isCurrentMonth && today.getDate() === day

            return (
              <div
                key={day}
                className={cn(
                  "min-h-24 border-b border-r p-2 hover:bg-muted/50 transition-colors",
                  isToday && "bg-blue-50 dark:bg-blue-950"
                )}
              >
                <p className={cn("font-semibold text-sm mb-2", isToday && "text-blue-600 dark:text-blue-400")}>
                  {day}
                </p>
                <div className="space-y-1">
                  {tasks.slice(0, 2).map((task, idx) => (
                    <div
                      key={idx}
                      className={cn(
                        "text-xs p-1 rounded truncate text-white cursor-pointer hover:opacity-90",
                        task.status === "DONE"
                          ? "bg-green-500"
                          : isOverdue(task.dueDate)
                            ? "bg-red-500"
                            : "bg-blue-500"
                      )}
                      title={task.title}
                    >
                      {task.title}
                    </div>
                  ))}
                  {tasks.length > 2 && (
                    <p className="text-xs text-muted-foreground px-1">+{tasks.length - 2} more</p>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}

// Week View Component
interface WeekViewProps {
  currentDate: Date
  tasksWithDates: any[]
}

function WeekView({ currentDate, tasksWithDates }: WeekViewProps) {
  const dayLabels = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]
  const weekStart = new Date(currentDate)
  weekStart.setDate(currentDate.getDate() - currentDate.getDay())

  const weekDays = Array.from({ length: 7 }, (_, i) => {
    const date = new Date(weekStart)
    date.setDate(date.getDate() + i)
    return date
  })

  return (
    <Card>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <div className="grid" style={{ gridTemplateColumns: "repeat(7, minmax(180px, 1fr))" }}>
            {/* Day Headers */}
            {weekDays.map((date, i) => (
              <div key={i} className="border-b border-r bg-muted p-3">
                <p className="font-semibold">{dayLabels[i]}</p>
                <p className="text-sm text-muted-foreground">{date.getDate()}</p>
              </div>
            ))}

            {/* Day Content */}
            {weekDays.map((date, dayIdx) => {
              const dateStr = date.toISOString().split("T")[0]
              const dayTasks = tasksWithDates.filter(
                (t) => t.dueDate && new Date(t.dueDate).toISOString().split("T")[0] === dateStr
              )

              return (
                <div key={dayIdx} className="min-h-64 border-b border-r p-3 bg-card hover:bg-muted/50 transition-colors">
                  <div className="space-y-2">
                    {dayTasks.map((task, idx) => (
                      <div
                        key={idx}
                        className={cn(
                          "p-2 rounded text-sm font-medium cursor-pointer hover:shadow-md transition-shadow text-white",
                          task.status === "DONE"
                            ? "bg-green-500"
                            : isOverdue(task.dueDate)
                              ? "bg-red-500"
                              : "bg-blue-500"
                        )}
                        title={task.description}
                      >
                        {task.title}
                      </div>
                    ))}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

// Agenda View Component
interface AgendaViewProps {
  tasksWithDates: any[]
}

function AgendaView({ tasksWithDates }: AgendaViewProps) {
  // Group tasks by date
  const groupedByDate = tasksWithDates.reduce((acc, task) => {
    const dateStr = formatDate(task.dueDate)
    if (!acc[dateStr]) acc[dateStr] = []
    acc[dateStr].push(task)
    return acc
  }, {} as Record<string, any[]>)

  const sortedDates = Object.keys(groupedByDate).sort()

  return (
    <div className="space-y-4">
      {sortedDates.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            <CalendarIcon className="mx-auto h-12 w-12 opacity-50 mb-2" />
            <p>No upcoming tasks</p>
          </CardContent>
        </Card>
      ) : (
        sortedDates.map((dateStr) => {
          const tasks = groupedByDate[dateStr]
          const dueDate = new Date(tasks[0].dueDate)
          const daysUntil = getDaysUntil(dueDate)
          const overdue = isOverdue(dueDate)

          return (
            <div key={dateStr} className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="flex-1">
                  <h3 className="font-semibold text-lg">{dateStr}</h3>
                  <p className={cn("text-sm", overdue && !tasks.some((t) => t.status === "DONE") ? "text-red-600 font-medium" : "text-muted-foreground")}>
                    {overdue ? "Overdue" : `${daysUntil} days away`}
                  </p>
                </div>
                <StatusBadge type="custom" value={`${tasks.length} tasks`} size="sm" showDot={false} />
              </div>

              <div className="space-y-2">
                {tasks.map((task, idx) => (
                  <Card key={idx} className="hover:border-primary hover:shadow-md transition-all">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <h4 className="font-medium">{task.title}</h4>
                            <StatusBadge type="status" value={task.status} size="sm" />
                          </div>
                          <p className="text-sm text-muted-foreground mt-1">{task.projectTitle}</p>
                          {task.description && <p className="text-sm text-muted-foreground mt-2 line-clamp-2">{task.description}</p>}
                        </div>

                        <div className="flex items-center gap-2">
                          {task.assignee && <UserAvatar name={task.assignee.name} size="sm" />}
                          {isOverdue(task.dueDate) && task.status !== "DONE" && (
                            <AlertCircle className="h-5 w-5 text-red-500" />
                          )}
                          {task.status === "DONE" && <CheckCircle className="h-5 w-5 text-green-500" />}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )
        })
      )}
    </div>
  )
}
