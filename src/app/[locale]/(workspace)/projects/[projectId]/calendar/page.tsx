"use client"

import { useParams } from "next/navigation"
import { useEffect, useMemo, useState } from "react"
import { ChevronLeft, ChevronRight, Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { useTaskStore } from "@/lib/store"
import { cn, formatDate, isOverdue } from "@/lib/utils"

export default function ProjectCalendarPage() {
  const params = useParams()
  const projectId = params?.projectId as string
  const projects = useTaskStore((state) => state.projects)
  const [currentDate, setCurrentDate] = useState(new Date())
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)

  const project = projects.find((p) => p._id === projectId)
  const tasks = project?.tasks || []

  // Calendar generation
  const { daysInMonth, firstDayOfMonth, monthName, year } = useMemo(() => {
    const year = currentDate.getFullYear()
    const month = currentDate.getMonth()
    const firstDay = new Date(year, month, 1)
    const lastDay = new Date(year, month + 1, 0)
    
    return {
      daysInMonth: lastDay.getDate(),
      firstDayOfMonth: firstDay.getDay(),
      monthName: currentDate.toLocaleDateString("en-US", { month: "long" }),
      year
    }
  }, [currentDate])

  // Get tasks for a specific date
  const getTasksForDate = (date: Date) => {
    return tasks.filter((task) => {
      if (!task.dueDate) return false
      const taskDate = new Date(task.dueDate)
      return (
        taskDate.getDate() === date.getDate() &&
        taskDate.getMonth() === date.getMonth() &&
        taskDate.getFullYear() === date.getFullYear()
      )
    })
  }

  const goToPreviousMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1))
  }

  const goToNextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1))
  }

  const goToToday = () => {
    setCurrentDate(new Date())
  }

  const renderCalendarDays = () => {
    const days = []
    const totalSlots = 42 // 6 weeks

    // Add previous month's days (grayed out)
    for (let i = 0; i < firstDayOfMonth; i++) {
      days.push(
        <div key={`prev-${i}`} className="min-h-[100px] border border-border/50 bg-muted/20 p-2">
          <span className="text-muted-foreground/50 text-sm"></span>
        </div>
      )
    }

    // Add current month's days
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(year, currentDate.getMonth(), day)
      const dayTasks = getTasksForDate(date)
      const isToday =
        date.getDate() === new Date().getDate() &&
        date.getMonth() === new Date().getMonth() &&
        date.getFullYear() === new Date().getFullYear()

      days.push(
        <div
          key={`day-${day}`}
          className={cn(
            "min-h-[100px] border border-border p-2 hover:bg-accent/50 cursor-pointer transition-colors",
            isToday && "bg-blue-50 dark:bg-blue-950/20 ring-2 ring-blue-500"
          )}
          onClick={() => setSelectedDate(date)}
        >
          <div className="flex items-center justify-between mb-2">
            <span className={cn("text-sm font-medium", isToday && "text-blue-600 font-bold")}>
              {day}
            </span>
            {dayTasks.length > 0 && (
              <span className="text-xs bg-primary text-primary-foreground rounded-full px-2 py-0.5">
                {dayTasks.length}
              </span>
            )}
          </div>
          <div className="space-y-1">
            {dayTasks.slice(0, 2).map((task) => (
              <div
                key={task._id}
                className={cn(
                  "text-xs p-1 rounded truncate",
                  task.status === "DONE" ? "bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-200" :
                  isOverdue(task.dueDate) ? "bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-200" :
                  "bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-200"
                )}
              >
                {task.title}
              </div>
            ))}
            {dayTasks.length > 2 && (
              <div className="text-xs text-muted-foreground">+{dayTasks.length - 2} more</div>
            )}
          </div>
        </div>
      )
    }

    // Fill remaining slots
    const remainingSlots = totalSlots - days.length
    for (let i = 0; i < remainingSlots; i++) {
      days.push(
        <div key={`next-${i}`} className="min-h-[100px] border border-border/50 bg-muted/20 p-2">
          <span className="text-muted-foreground/50 text-sm"></span>
        </div>
      )
    }

    return days
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Calendar</h2>
          <p className="text-muted-foreground">{project?.title}</p>
        </div>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          New Task
        </Button>
      </div>

      {/* Calendar Controls */}
      <Card className="p-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Button variant="outline" size="icon" onClick={goToPreviousMonth}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="icon" onClick={goToNextMonth}>
              <ChevronRight className="h-4 w-4" />
            </Button>
            <Button variant="outline" onClick={goToToday}>
              Today
            </Button>
          </div>
          <h3 className="text-xl font-bold">
            {monthName} {year}
          </h3>
        </div>

        {/* Weekday Headers */}
        <div className="grid grid-cols-7 gap-0 mb-2">
          {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
            <div key={day} className="text-center text-sm font-semibold text-muted-foreground p-2">
              {day}
            </div>
          ))}
        </div>

        {/* Calendar Grid */}
        <div className="grid grid-cols-7 gap-0 border-t border-l">
          {renderCalendarDays()}
        </div>
      </Card>

      {/* Selected Date Details */}
      {selectedDate && (
        <Card className="p-4">
          <h3 className="font-bold mb-4">
            Tasks for {formatDate(selectedDate)}
          </h3>
          <div className="space-y-2">
            {getTasksForDate(selectedDate).map((task) => (
              <div
                key={task._id}
                className="p-3 border rounded-lg hover:bg-accent transition-colors"
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <h4 className="font-medium">{task.title}</h4>
                    {task.description && (
                      <p className="text-sm text-muted-foreground">{task.description}</p>
                    )}
                  </div>
                  <span
                    className={cn(
                      "text-xs px-2 py-1 rounded-full",
                      task.status === "DONE" ? "bg-green-100 text-green-800" :
                      task.status === "IN_PROGRESS" ? "bg-blue-100 text-blue-800" :
                      "bg-gray-100 text-gray-800"
                    )}
                  >
                    {task.status.replace("_", " ")}
                  </span>
                </div>
              </div>
            ))}
            {getTasksForDate(selectedDate).length === 0 && (
              <p className="text-muted-foreground text-center py-8">No tasks for this date</p>
            )}
          </div>
        </Card>
      )}
    </div>
  )
}
