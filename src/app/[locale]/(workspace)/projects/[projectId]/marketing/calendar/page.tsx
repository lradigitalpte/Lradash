"use client"

import {
  Calendar,
  ChevronLeft,
  ChevronRight,
  Plus,
  Trash2,
  Clock,
  MapPin,
  AlertCircle,
  Edit2,
  MoreVertical,
  List,
  Grid3x3,
  AlertTriangle,
  CheckCircle,
  Loader
} from "lucide-react"
import Link from "next/link"
import { useParams } from "next/navigation"
import { useState } from "react"

import { CalendarEventModal } from "@/components/content/CalendarEventModal"
import { Button } from "@/components/ui/button"
import { useCalendarEvents } from "@/lib/hooks/useCalendarEvents"
import { useSocialStrategies } from "@/lib/hooks/useSocialStrategies"
import { cn } from "@/lib/utils"

const COLOR_STATUS_CONFIG = {
  planning: {
    color: "bg-slate-600",
    lightColor: "bg-slate-100",
    textColor: "text-slate-700",
    name: "Planning"
  },
  building: {
    color: "bg-blue-600",
    lightColor: "bg-blue-100",
    textColor: "text-blue-700",
    name: "Building"
  },
  active: {
    color: "bg-purple-600",
    lightColor: "bg-purple-100",
    textColor: "text-purple-700",
    name: "Active"
  },
  strong: {
    color: "bg-emerald-600",
    lightColor: "bg-emerald-100",
    textColor: "text-emerald-700",
    name: "Strong"
  }
}

interface CalendarEvent {
  id: string
  strategyId: string
  strategyName: string
  title: string
  date: Date
  status: string
  notes?: string
}

export default function ContentCalendarPage() {
  const { locale, projectId } = useParams()
  const { strategies, loading: strategiesLoading } = useSocialStrategies(projectId as string)
  const {
    events,
    loading: eventsLoading,
    createEvent,
    updateEvent,
    deleteEvent
  } = useCalendarEvents(projectId as string)

  const [currentDate, setCurrentDate] = useState(new Date(2026, 1, 16)) // Feb 16, 2026
  const [selectedStrategy, setSelectedStrategy] = useState<string | null>(null)
  const [viewMode, setViewMode] = useState<"month" | "week" | "table">("month")
  const [showEventModal, setShowEventModal] = useState(false)
  const [selectedEvent, setSelectedEvent] = useState<any | null>(null)
  const [dropdownOpen, setDropdownOpen] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Helper functions
  const getEventStatus = (date: Date) => {
    const today = new Date(2026, 1, 16) // Current date
    if (date < today) {
      return "overdue"
    }
    if (date.getTime() === today.getTime()) {
      return "due-today"
    }
    const daysUntil = Math.ceil((date.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
    if (daysUntil <= 3) {
      return "due-soon"
    }
    return "upcoming"
  }

  // Event handlers
  const handleCreateEvent = async (newEvent: any) => {
    try {
      setIsSubmitting(true)
      await createEvent(newEvent)
    } catch (error) {
      console.error("Failed to create event:", error)
      alert("Failed to create event")
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleEditEvent = (event: any) => {
    setSelectedEvent(event)
    setShowEventModal(true)
    setDropdownOpen(null)
  }

  const handleUpdateEvent = async (updatedEvent: any) => {
    try {
      setIsSubmitting(true)
      await updateEvent(updatedEvent.id || updatedEvent._id, updatedEvent)
    } catch (error) {
      console.error("Failed to update event:", error)
      alert("Failed to update event")
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDeleteEvent = async (id: string) => {
    if (window.confirm("Delete this event?")) {
      try {
        setIsSubmitting(true)
        await deleteEvent(id)
        setDropdownOpen(null)
      } catch (error) {
        console.error("Failed to delete event:", error)
        alert("Failed to delete event")
      } finally {
        setIsSubmitting(false)
      }
    }
  }

  const handleOpenCreateModal = () => {
    setSelectedEvent(null)
    setShowEventModal(true)
  }

  const getDaysInMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate()
  }

  const getFirstDayOfMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth(), 1).getDay()
  }

  const previousMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1))
  }

  const nextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1))
  }

  const getEventsForDate = (day: number) => {
    return events.filter((event) => {
      const eventDate = event.date instanceof Date ? event.date : new Date(event.date)
      return (
        eventDate.getDate() === day &&
        eventDate.getMonth() === currentDate.getMonth() &&
        eventDate.getFullYear() === currentDate.getFullYear() &&
        (!selectedStrategy || event.strategyId === selectedStrategy)
      )
    })
  }

  const monthName = currentDate.toLocaleString("default", { month: "long", year: "numeric" })
  const daysInMonth = getDaysInMonth(currentDate)
  const firstDay = getFirstDayOfMonth(currentDate)
  const days = []

  for (let i = 0; i < firstDay; i++) {
    days.push(null)
  }
  for (let i = 1; i <= daysInMonth; i++) {
    days.push(i)
  }

  return (
    <div className="space-y-8 p-8 pb-20">
      {/* Header */}
      <div className="flex flex-col justify-between gap-6 md:flex-row md:items-end">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <div className="flex h-6 items-center justify-center rounded-md border border-blue-500/20 bg-blue-500/10 px-2">
              <span className="text-[9px] font-black tracking-[0.2em] text-blue-600 uppercase">
                Publishing Hub
              </span>
            </div>
            <div className="h-1 w-1 rounded-full bg-slate-300 dark:bg-slate-700" />
            <span className="text-[10px] font-bold tracking-widest text-slate-400 uppercase">
              Schedule Content
            </span>
          </div>
          <h1 className="text-4xl font-black tracking-tighter text-slate-900 dark:text-white">
            Content <span className="text-blue-600">Calendar</span>
          </h1>
          <p className="max-w-lg text-xs font-medium text-slate-500 italic">
            Plan and schedule your content strategy across topics and clusters.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Link href={`/${locale}/projects/${projectId}/marketing/content`}>
            <Button className="mr-3 h-11 rounded-xl bg-slate-900 px-6 text-[11px] font-bold tracking-widest text-white uppercase shadow-lg dark:bg-white dark:text-slate-900">
              Back to Strategy
            </Button>
          </Link>
          <Button
            onClick={handleOpenCreateModal}
            className="h-11 rounded-xl bg-blue-600 px-6 text-[11px] font-bold tracking-widest text-white uppercase shadow-lg shadow-blue-500/20 hover:bg-blue-700"
          >
            <Plus className="mr-2 h-4 w-4" /> Schedule Post
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-4">
        {/* Sidebar */}
        <div className="space-y-6 lg:col-span-1">
          {/* Filter by Strategy */}
          <div className="rounded-[2.5rem] border border-slate-100 bg-white p-6 shadow-xl shadow-slate-200/40 dark:border-slate-800 dark:bg-slate-900 dark:shadow-none">
            <h3 className="mb-4 text-sm font-black text-slate-900 uppercase dark:text-white">
              Filter by Strategy
            </h3>
            <div className="space-y-2">
              <button
                onClick={() =>{  setSelectedStrategy(null); }}
                className={cn(
                  "w-full rounded-xl px-4 py-2 text-left text-[11px] font-bold transition-colors",
                  selectedStrategy === null
                    ? "bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-300"
                    : "text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800"
                )}
              >
                All Strategies
              </button>
              {strategiesLoading ? (
                <div className="flex items-center justify-center py-4">
                  <div className="h-5 w-5 animate-spin rounded-full border-2 border-blue-500/30 border-t-blue-600" />
                </div>
              ) : strategies.length === 0 ? (
                <p className="text-[10px] text-slate-400">No strategies yet</p>
              ) : (
                strategies.map((strategy: any) => (
                  <button
                    key={strategy._id}
                    onClick={() =>{  setSelectedStrategy(strategy._id); }}
                    className={cn(
                      "w-full rounded-xl px-4 py-2 text-left text-[11px] font-bold transition-colors",
                      selectedStrategy === strategy._id
                        ? "bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-300"
                        : "text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800"
                    )}
                  >
                    {strategy.title}
                  </button>
                ))
              )}
            </div>
          </div>

          {/* Upcoming Events */}
          <div className="rounded-[2.5rem] border border-slate-100 bg-white p-6 shadow-xl shadow-slate-200/40 dark:border-slate-800 dark:bg-slate-900 dark:shadow-none">
            <h3 className="mb-4 text-sm font-black text-slate-900 uppercase dark:text-white">
              Upcoming
            </h3>
            <div className="space-y-3">
              {events
                .filter((e) => {
                  const eventDate = e.date instanceof Date ? e.date : new Date(e.date)
                  return (
                    eventDate >= new Date(2026, 1, 16) &&
                    (!selectedStrategy || e.strategyId === selectedStrategy)
                  )
                })
                .sort((a, b) => {
                  const dateA = a.date instanceof Date ? a.date : new Date(a.date)
                  const dateB = b.date instanceof Date ? b.date : new Date(b.date)
                  return dateA.getTime() - dateB.getTime()
                })
                .slice(0, 5)
                .map((event) => {
                  const config =
                    COLOR_STATUS_CONFIG[event.status as keyof typeof COLOR_STATUS_CONFIG]
                  const eventDate = event.date instanceof Date ? event.date : new Date(event.date)
                  return (
                    <div
                      key={event.id || event._id}
                      className={cn(
                        "rounded-xl border p-3 text-[10px]",
                        config?.lightColor,
                        config?.textColor
                      )}
                    >
                      <p className="font-bold">{event.title}</p>
                      <div className="mt-1 flex items-center gap-1 opacity-75">
                        <Clock className="h-3 w-3" />
                        {eventDate.toLocaleDateString("default", {
                          month: "short",
                          day: "numeric"
                        })}
                      </div>
                    </div>
                  )
                })}
              {events.length === 0 && (
                <p className="text-[10px] text-slate-400">No upcoming posts scheduled</p>
              )}
            </div>
          </div>
        </div>

        {/* Calendar */}
        <div className="lg:col-span-3">
          <div className="rounded-[2.5rem] border border-slate-100 bg-white shadow-2xl shadow-slate-200/40 dark:border-slate-800 dark:bg-slate-900 dark:shadow-none">
            {/* Calendar Header with View Toggle */}
            <div className="border-b border-slate-100 p-6 dark:border-slate-800">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-xl font-black text-slate-900 dark:text-white">{monthName}</h2>
                <div className="flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-100 p-1 dark:border-slate-700 dark:bg-slate-800">
                  <button
                    onClick={() =>{  setViewMode("month"); }}
                    title="Month view"
                    className={cn(
                      "rounded-md p-2 transition-colors",
                      viewMode === "month"
                        ? "bg-white text-blue-600 shadow-sm dark:bg-slate-700"
                        : "text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
                    )}
                  >
                    <Grid3x3 className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() =>{  setViewMode("week"); }}
                    title="Week view"
                    className={cn(
                      "rounded-md p-2 transition-colors",
                      viewMode === "week"
                        ? "bg-white text-blue-600 shadow-sm dark:bg-slate-700"
                        : "text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
                    )}
                  >
                    <Calendar className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() =>{  setViewMode("table"); }}
                    title="List view"
                    className={cn(
                      "rounded-md p-2 transition-colors",
                      viewMode === "table"
                        ? "bg-white text-blue-600 shadow-sm dark:bg-slate-700"
                        : "text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
                    )}
                  >
                    <List className="h-4 w-4" />
                  </button>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <div />
                <div className="flex items-center gap-2">
                  <button
                    onClick={previousMonth}
                    className="rounded-lg p-2 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800"
                  >
                    <ChevronLeft className="h-5 w-5" />
                  </button>
                  <button
                    onClick={nextMonth}
                    className="rounded-lg p-2 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800"
                  >
                    <ChevronRight className="h-5 w-5" />
                  </button>
                </div>
              </div>
            </div>

            {/* Calendar views based on mode */}
            <div className="p-6">
              {eventsLoading ? (
                <div className="flex flex-col items-center justify-center py-12">
                  <Loader className="h-8 w-8 animate-spin text-blue-600 dark:text-blue-400" />
                  <p className="mt-3 text-sm font-bold text-slate-600 dark:text-slate-400">
                    Loading calendar events...
                  </p>
                </div>
              ) : (
                viewMode === "month" && (
                  <>
                    {/* Day Headers */}
                    <div className="mb-4 grid grid-cols-7 gap-2">
                      {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
                        <div
                          key={day}
                          className="py-2 text-center text-[11px] font-black tracking-widest text-slate-400 uppercase"
                        >
                          {day}
                        </div>
                      ))}
                    </div>

                    {/* Days */}
                    <div className="grid grid-cols-7 gap-2">
                      {days.map((day, idx) => {
                        const dayEvents = day ? getEventsForDate(day) : []
                        const isToday =
                          day === 16 &&
                          currentDate.getMonth() === 1 &&
                          currentDate.getFullYear() === 2026

                        return (
                          <div
                            key={idx}
                            className={cn(
                              "min-h-24 rounded-xl border p-2 transition-colors",
                              day
                                ? isToday
                                  ? "border-blue-500 bg-blue-50 dark:border-blue-500/50 dark:bg-blue-500/10"
                                  : "border-slate-100 bg-slate-50 hover:border-slate-200 dark:border-slate-800 dark:bg-slate-800/50 dark:hover:border-slate-700"
                                : "bg-slate-100 dark:bg-slate-800"
                            )}
                          >
                            {day && (
                              <>
                                <p className="text-xs font-black text-slate-600 dark:text-slate-400">
                                  {day}
                                </p>
                                <div className="mt-2 space-y-1">
                                  {dayEvents.map((event) => {
                                    const config =
                                      COLOR_STATUS_CONFIG[
                                        event.status as keyof typeof COLOR_STATUS_CONFIG
                                      ]
                                    const eventStatus = getEventStatus(
                                      event.date instanceof Date ? event.date : new Date(event.date)
                                    )
                                    const eventDate =
                                      event.date instanceof Date ? event.date : new Date(event.date)

                                    return (
                                      <div key={event.id || event._id} className="group relative">
                                        <button
                                          onClick={() =>{  handleEditEvent(event); }}
                                          className={cn(
                                            "w-full cursor-pointer truncate rounded px-2 py-1 text-[9px] font-bold text-white transition-all duration-200 hover:shadow-md",
                                            config?.color || "bg-slate-400",
                                            eventStatus === "overdue" && "line-through opacity-60"
                                          )}
                                          title={event.title}
                                        >
                                          {eventStatus === "overdue" && "⏰ "}
                                          {event.title}
                                        </button>

                                        {/* Hover Tooltip */}
                                        <div className="pointer-events-none absolute top-full right-0 z-20 mt-1 hidden w-48 space-y-2 rounded-lg border border-slate-200 bg-white p-3 shadow-xl group-hover:pointer-events-auto group-hover:block dark:border-slate-700 dark:bg-slate-800">
                                          <div>
                                            <p className="text-[9px] font-black tracking-widest text-slate-400 uppercase dark:text-slate-500">
                                              Title
                                            </p>
                                            <p className="text-sm font-bold text-slate-900 dark:text-white">
                                              {event.title}
                                            </p>
                                          </div>
                                          <div>
                                            <p className="text-[9px] font-black tracking-widest text-slate-400 uppercase dark:text-slate-500">
                                              Strategy
                                            </p>
                                            <p className="text-[10px] font-bold text-slate-600 dark:text-slate-300">
                                              {event.strategyName}
                                            </p>
                                          </div>
                                          <div>
                                            <p className="text-[9px] font-black tracking-widest text-slate-400 uppercase dark:text-slate-500">
                                              Date
                                            </p>
                                            <p className="text-[10px] font-bold text-slate-600 dark:text-slate-300">
                                              {eventDate.toLocaleDateString("en-US", {
                                                month: "short",
                                                day: "numeric",
                                                year: "numeric"
                                              })}
                                            </p>
                                          </div>
                                          {event.notes && (
                                            <div>
                                              <p className="text-[9px] font-black tracking-widest text-slate-400 uppercase dark:text-slate-500">
                                                Notes
                                              </p>
                                              <p className="text-[10px] text-slate-600 dark:text-slate-300">
                                                {event.notes}
                                              </p>
                                            </div>
                                          )}
                                          <div className="flex gap-1 border-t border-slate-200 pt-2 dark:border-slate-700">
                                            <button
                                              onClick={() =>{  handleEditEvent(event); }}
                                              className="flex-1 rounded px-2 py-1 text-[9px] font-bold text-blue-600 hover:bg-blue-50 dark:text-blue-400 dark:hover:bg-blue-500/20"
                                            >
                                              Edit
                                            </button>
                                            <button
                                              onClick={ async () =>
                                                handleDeleteEvent(event.id || event._id)
                                              }
                                              className="flex-1 rounded px-2 py-1 text-[9px] font-bold text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-500/20"
                                            >
                                              Delete
                                            </button>
                                          </div>
                                        </div>
                                      </div>
                                    )
                                  })}
                                </div>
                              </>
                            )}
                          </div>
                        )
                      })}
                    </div>
                  </>
                )
              )}

              {viewMode === "week" && (
                <div className="space-y-3">
                  {[0, 1, 2, 3, 4, 5, 6].map((offset) => {
                    const weekDate = new Date(currentDate)
                    weekDate.setDate(currentDate.getDate() - currentDate.getDay() + offset)
                    const dayName = weekDate.toLocaleDateString("en-US", {
                      weekday: "short",
                      month: "short",
                      day: "numeric"
                    })
                    const dayEvents = events.filter((e) => {
                      const eDate = e.date instanceof Date ? e.date : new Date(e.date)
                      return (
                        eDate.getDate() === weekDate.getDate() &&
                        eDate.getMonth() === weekDate.getMonth() &&
                        eDate.getFullYear() === weekDate.getFullYear() &&
                        (!selectedStrategy || e.strategyId === selectedStrategy)
                      )
                    })

                    return (
                      <div
                        key={offset}
                        className="rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-800/50"
                      >
                        <p className="mb-3 text-sm font-bold text-slate-900 dark:text-white">
                          {dayName}
                        </p>
                        {dayEvents.length === 0 ? (
                          <p className="text-[10px] text-slate-400">No events</p>
                        ) : (
                          <div className="space-y-2">
                            {dayEvents.map((event) => {
                              const config =
                                COLOR_STATUS_CONFIG[
                                  event.status as keyof typeof COLOR_STATUS_CONFIG
                                ]
                              const eventStatus = getEventStatus(
                                event.date instanceof Date ? event.date : new Date(event.date)
                              )
                              const eventId = event.id || event._id

                              return (
                                <div key={eventId} className="group/item relative">
                                  <div
                                    className={cn(
                                      "rounded-lg border p-3 text-sm",
                                      config?.lightColor,
                                      config?.textColor,
                                      eventStatus === "overdue" && "opacity-60"
                                    )}
                                  >
                                    <div className="flex items-start justify-between">
                                      <div className="flex-1">
                                        <p className="font-bold">{event.title}</p>
                                        <p className="mt-1 text-[10px] opacity-75">
                                          {event.strategyName}
                                        </p>
                                      </div>
                                      <div className="relative">
                                        <button
                                          onClick={(e) => {
                                            e.stopPropagation()
                                            setDropdownOpen(
                                              dropdownOpen === eventId ? null : eventId
                                            )
                                          }}
                                          disabled={isSubmitting}
                                          className="rounded p-1 text-slate-400 hover:bg-white/50 disabled:opacity-50 dark:hover:bg-slate-700"
                                        >
                                          <MoreVertical className="h-4 w-4" />
                                        </button>

                                        {dropdownOpen === eventId && (
                                          <div className="absolute top-full right-0 mt-1 w-32 space-y-1 rounded-lg border border-slate-200 bg-white p-1 shadow-lg dark:border-slate-700 dark:bg-slate-800">
                                            <button
                                              onClick={() =>{  handleEditEvent(event); }}
                                              disabled={isSubmitting}
                                              className="flex w-full items-center gap-2 rounded px-2 py-1.5 text-[10px] font-bold text-slate-600 hover:bg-slate-100 disabled:opacity-50 dark:text-slate-300 dark:hover:bg-slate-700"
                                            >
                                              <Edit2 className="h-3 w-3" /> Edit
                                            </button>
                                            <button
                                              onClick={ async () => handleDeleteEvent(eventId)}
                                              disabled={isSubmitting}
                                              className="flex w-full items-center gap-2 rounded px-2 py-1.5 text-[10px] font-bold text-red-600 hover:bg-red-50 disabled:opacity-50 dark:text-red-400 dark:hover:bg-red-500/20"
                                            >
                                              <Trash2 className="h-3 w-3" /> Delete
                                            </button>
                                          </div>
                                        )}
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              )
                            })}
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              )}

              {viewMode === "table" && (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-slate-200 dark:border-slate-700">
                        <th className="px-4 py-3 text-left text-[10px] font-black tracking-widest text-slate-600 uppercase dark:text-slate-400">
                          Event
                        </th>
                        <th className="px-4 py-3 text-left text-[10px] font-black tracking-widest text-slate-600 uppercase dark:text-slate-400">
                          Strategy
                        </th>
                        <th className="px-4 py-3 text-left text-[10px] font-black tracking-widest text-slate-600 uppercase dark:text-slate-400">
                          Date
                        </th>
                        <th className="px-4 py-3 text-left text-[10px] font-black tracking-widest text-slate-600 uppercase dark:text-slate-400">
                          Status
                        </th>
                        <th className="px-4 py-3 text-left text-[10px] font-black tracking-widest text-slate-600 uppercase dark:text-slate-400">
                          Progress
                        </th>
                        <th className="px-4 py-3 text-center text-[10px] font-black tracking-widest text-slate-600 uppercase dark:text-slate-400">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {events
                        .filter((e) => !selectedStrategy || e.strategyId === selectedStrategy)
                        .map((event) => {
                          const config =
                            COLOR_STATUS_CONFIG[event.status as keyof typeof COLOR_STATUS_CONFIG]
                          const eventStatus = getEventStatus(
                            event.date instanceof Date ? event.date : new Date(event.date)
                          )
                          const eventDate =
                            event.date instanceof Date ? event.date : new Date(event.date)
                          const eventId = event.id || event._id

                          return (
                            <tr
                              key={eventId}
                              className="border-b border-slate-100 hover:bg-slate-50 dark:border-slate-800 dark:hover:bg-slate-800/30"
                            >
                              <td className="group relative px-4 py-3 text-sm font-bold text-slate-900 dark:text-white">
                                <div className="cursor-help">{event.title}</div>
                                {/* Hover Tooltip */}
                                <div className="pointer-events-none absolute top-full left-0 z-20 mt-1 hidden w-56 space-y-2 rounded-lg border border-slate-200 bg-white p-3 shadow-xl group-hover:pointer-events-auto group-hover:block dark:border-slate-700 dark:bg-slate-800">
                                  <div>
                                    <p className="text-[9px] font-black tracking-widest text-slate-400 uppercase dark:text-slate-500">
                                      Title
                                    </p>
                                    <p className="font-bold text-slate-900 dark:text-white">
                                      {event.title}
                                    </p>
                                  </div>
                                  <div>
                                    <p className="text-[9px] font-black tracking-widest text-slate-400 uppercase dark:text-slate-500">
                                      Strategy
                                    </p>
                                    <p className="text-[10px] font-bold text-slate-600 dark:text-slate-300">
                                      {event.strategyName}
                                    </p>
                                  </div>
                                  <div>
                                    <p className="text-[9px] font-black tracking-widest text-slate-400 uppercase dark:text-slate-500">
                                      Status
                                    </p>
                                    <p className="text-[10px] font-bold text-slate-600 dark:text-slate-300">
                                      {config?.name}
                                    </p>
                                  </div>
                                  {event.notes && (
                                    <div>
                                      <p className="text-[9px] font-black tracking-widest text-slate-400 uppercase dark:text-slate-500">
                                        Notes
                                      </p>
                                      <p className="text-[10px] text-slate-600 dark:text-slate-300">
                                        {event.notes}
                                      </p>
                                    </div>
                                  )}
                                </div>
                              </td>
                              <td className="px-4 py-3 text-[10px] font-bold text-slate-600 dark:text-slate-400">
                                {event.strategyName}
                              </td>
                              <td className="px-4 py-3 text-[10px] font-bold text-slate-600 dark:text-slate-400">
                                {eventDate.toLocaleDateString("en-US", {
                                  month: "short",
                                  day: "numeric",
                                  year: "numeric"
                                })}
                              </td>
                              <td className="px-4 py-3">
                                <span
                                  className={cn(
                                    "inline-block rounded-lg px-2 py-1 text-[9px] font-bold",
                                    config?.lightColor,
                                    config?.textColor
                                  )}
                                >
                                  {config?.name}
                                </span>
                              </td>
                              <td className="px-4 py-3">
                                <div className="flex items-center gap-2">
                                  {eventStatus === "overdue" && (
                                    <div className="flex items-center gap-1 text-red-600 dark:text-red-400">
                                      <AlertTriangle className="h-3 w-3" />
                                      <span className="text-[9px] font-bold">Overdue</span>
                                    </div>
                                  )}
                                  {eventStatus === "due-today" && (
                                    <div className="flex items-center gap-1 text-orange-600 dark:text-orange-400">
                                      <Clock className="h-3 w-3" />
                                      <span className="text-[9px] font-bold">Today</span>
                                    </div>
                                  )}
                                  {eventStatus === "due-soon" && (
                                    <div className="flex items-center gap-1 text-yellow-600 dark:text-yellow-400">
                                      <Clock className="h-3 w-3" />
                                      <span className="text-[9px] font-bold">Soon</span>
                                    </div>
                                  )}
                                  {eventStatus === "upcoming" && (
                                    <div className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400">
                                      <CheckCircle className="h-3 w-3" />
                                      <span className="text-[9px] font-bold">Upcoming</span>
                                    </div>
                                  )}
                                </div>
                              </td>
                              <td className="px-4 py-3 text-center">
                                <div className="flex items-center justify-center gap-1">
                                  <button
                                    onClick={() =>{  handleEditEvent(event); }}
                                    disabled={isSubmitting}
                                    className="rounded p-1.5 text-slate-400 hover:bg-blue-100 hover:text-blue-600 disabled:opacity-50 dark:hover:bg-blue-500/20 dark:hover:text-blue-400"
                                    title="Edit"
                                  >
                                    <Edit2 className="h-4 w-4" />
                                  </button>
                                  <button
                                    onClick={ async () => handleDeleteEvent(eventId)}
                                    disabled={isSubmitting}
                                    className="rounded p-1.5 text-slate-400 hover:bg-red-100 hover:text-red-600 disabled:opacity-50 dark:hover:bg-red-500/20 dark:hover:text-red-400"
                                    title="Delete"
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          )
                        })}
                    </tbody>
                  </table>
                  {events.filter((e) => !selectedStrategy || e.strategyId === selectedStrategy)
                    .length === 0 && (
                    <div className="py-8 text-center text-slate-400">No events to display</div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Info Section */}
      <div className="rounded-[2.5rem] border border-slate-100 bg-linear-to-br from-blue-50 to-indigo-50 p-8 dark:border-slate-800 dark:from-blue-500/10 dark:to-indigo-500/10">
        <div className="flex items-start gap-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-600 shadow-lg shadow-blue-500/20">
            <Calendar className="h-5 w-5 text-white" />
          </div>
          <div className="space-y-2">
            <h3 className="font-black text-slate-900 dark:text-white">Content Calendar Tips</h3>
            <ul className="space-y-1 text-sm text-slate-700 dark:text-slate-300">
              <li>• Schedule posts in advance to maintain consistent publishing rhythm</li>
              <li>• Align content with your cluster strategy for better topic authority</li>
              <li>• Track performance metrics alongside your publishing timeline</li>
              <li>• Use color-coded statuses to quickly identify cluster stage</li>
              <li>
                • View by month for overview, week for planning, or table for detailed management
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Modal */}
      <CalendarEventModal
        open={showEventModal}
        onOpenChange={setShowEventModal}
        onSuccess={selectedEvent ? handleUpdateEvent : handleCreateEvent}
        event={selectedEvent}
        strategies={strategies}
        projectId={projectId as string}
      />
    </div>
  )
}
