"use client"

import { format } from "date-fns"
import {
  ChevronLeft,
  ChevronRight,
  Clock,
  Filter,
  Plus,
  AlertCircle,
  CheckCircle,
  Calendar as CalendarIcon,
  Zap,
  Globe,
  Users,
  ShieldAlert,
  Activity,
  ArrowRight,
  Coffee,
  Trash2
} from "lucide-react"
import { useEffect, useMemo, useState } from "react"
import { toast } from "sonner"

import { CreateEventModal } from "@/components/calendar/CreateEventModal"
import { EventHoverCard } from "@/components/calendar/EventHoverCard"
import { StatusBadge, UserAvatar, StatCard, AvatarGroup } from "@/components/common"
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
import { apiClient } from "@/lib/api/client"
import { useTaskStore } from "@/lib/store"
import { cn, formatDate, getDaysUntil, isOverdue } from "@/lib/utils"

type ViewType = "month" | "week" | "day" | "agenda"

interface CalendarItem {
  id: string
  title: string
  isTask?: boolean
  isEvent?: boolean
  startTime?: string
  endTime?: string
  type?: string
  description?: string
}

export default function CalendarPage() {
  const projects = useTaskStore((state) => state.projects)
  const [currentDate, setCurrentDate] = useState(new Date())
  const [viewType, setViewType] = useState<ViewType>("month")
  const [events, setEvents] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [isModalOpen, setIsModalOpen] = useState(false)

  const fetchEvents = async () => {
    try {
      setLoading(true)
      const response = await apiClient.get("/api/events")
      if (response.ok) {
        const data = await response.json()
        setEvents(data)
      }
    } catch (error) {
      console.error("Failed to fetch events:", error)
      toast.error("Failed to sync calendar data")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchEvents()
  }, [])

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
    return allTasks
      .filter((t) => t.dueDate)
      .sort((a, b) => {
        const dateA = new Date(a.dueDate!).getTime()
        const dateB = new Date(b.dueDate!).getTime()
        return dateA - dateB
      })
  }, [allTasks])

  const daysInMonth = (date: Date) => new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate()
  const firstDayOfMonth = (date: Date) => new Date(date.getFullYear(), date.getMonth(), 1).getDay()

  const monthDays = Array.from({ length: daysInMonth(currentDate) }, (_, i) => i + 1)
  const emptyDays = Array.from({ length: firstDayOfMonth(currentDate) })

  const getDayEvents = (day: number) => {
    const d = new Date(currentDate.getFullYear(), currentDate.getMonth(), day)
    const dateStr = d.toISOString().split("T")[0]

    const tasks = tasksWithDates.filter(
      (t) => t.dueDate && new Date(t.dueDate).toISOString().split("T")[0] === dateStr
    )

    const orgEvents = events.filter((e) => {
      const eDate = new Date(e.startTime).toISOString().split("T")[0]
      return eDate === dateStr
    })

    return [
      ...tasks.map((t) => ({ ...t, isTask: true, id: t._id })),
      ...orgEvents.map((e) => ({
        ...e,
        isEvent: true,
        id: e._id,
        startTime: format(new Date(e.startTime), "HH:mm"),
        endTime: format(new Date(e.endTime), "HH:mm")
      }))
    ]
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

  const handleDeleteEvent = async (id: string) => {
    try {
      const response = await apiClient.delete(`/api/events/${id}`)
      if (response.ok) {
        toast.success("Event removed from schedule")
        fetchEvents()
      }
    } catch (error) {
      toast.error("Failed to remove event")
    }
  }

  // Calculate dynamic stats
  const todayEvents = events.filter((e) => {
    const d = new Date(e.startTime)
    const now = new Date()
    return (
      d.getDate() === now.getDate() &&
      d.getMonth() === now.getMonth() &&
      d.getFullYear() === now.getFullYear()
    )
  })

  const focusedHours = todayEvents
    .filter((e) => e.type === "blocked")
    .reduce((acc, e) => {
      const start = new Date(e.startTime)
      const end = new Date(e.endTime)
      return acc + (end.getTime() - start.getTime()) / (1000 * 60 * 60)
    }, 0)

  const meetingLoad = todayEvents.filter((e) => e.type === "sync" || e.type === "meeting").length

  return (
    <div className="relative min-h-screen pb-32">
      {/* Dynamic Background Glows */}
      <div className="pointer-events-none absolute top-20 right-[15%] -z-10 h-[600px] w-[600px] rounded-full bg-blue-500/5 blur-[140px]" />
      <div className="pointer-events-none absolute bottom-40 left-[20%] -z-10 h-[500px] w-[500px] rounded-full bg-indigo-500/5 blur-[120px]" />

      <div className="mx-auto max-w-[1600px] space-y-12 p-8 lg:p-12">
        {/* WOW Header Section */}
        <div className="flex flex-col justify-between gap-8 pt-4 md:flex-row md:items-end">
          <div className="flex items-center gap-6">
            <div className="group relative">
              <div className="absolute -inset-2 rounded-3xl bg-gradient-to-r from-blue-600 to-indigo-700 opacity-20 blur transition duration-1000 group-hover:opacity-40 group-hover:duration-200" />
              <div className="relative flex h-20 w-20 items-center justify-center rounded-3xl bg-gradient-to-br from-blue-600 to-indigo-700 text-white shadow-2xl shadow-blue-500/30 transition-transform duration-500 group-hover:scale-105">
                <CalendarIcon className="h-10 w-10 stroke-[2.5]" />
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex items-center gap-3">
                <span className="rounded-full border border-blue-100 bg-blue-50 px-3 py-1 text-[10px] font-black tracking-[0.2em] text-blue-600 uppercase shadow-sm dark:border-blue-800 dark:bg-blue-900/30 dark:text-blue-400">
                  Organization Calendar
                </span>
                <div className="h-1 w-1 rounded-full bg-slate-200 dark:bg-slate-700" />
                <span className="text-[10px] font-black tracking-[0.2em] text-slate-400 uppercase italic">
                  Live Sync
                </span>
              </div>
              <h1 className="text-5xl leading-[0.9] font-black tracking-tighter text-slate-900 dark:text-white">
                Team{" "}
                <span className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                  Schedule
                </span>
              </h1>
              <p className="text-lg font-medium text-slate-500 italic opacity-80 dark:text-slate-400">
                Managing organizational synchronization and team availability
              </p>
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-3 pb-2">
            <div className="mr-4 flex -space-x-3">
              <div className="flex items-center gap-3 rounded-2xl border border-slate-100 bg-white px-4 py-2 shadow-lg dark:border-slate-800 dark:bg-slate-900">
                <div className="h-2 w-2 animate-pulse rounded-full bg-emerald-500" />
                <span className="text-[10px] font-black tracking-widest text-slate-500 uppercase">
                  System Connected
                </span>
                <AvatarGroup
                  users={[{ name: "A" }, { name: "B" }, { name: "C" }]}
                  size="xs"
                  max={3}
                />
              </div>
            </div>
            <Button
              size="lg"
              onClick={() =>{  setIsModalOpen(true); }}
              className="group relative h-14 gap-3 overflow-hidden rounded-2xl bg-slate-900 px-8 text-sm font-black tracking-widest text-white uppercase shadow-2xl transition-all hover:scale-105 dark:bg-white dark:text-slate-900"
            >
              <Plus className="h-5 w-5 stroke-[3]" />
              Add Agenda Item
            </Button>
          </div>
        </div>

        {/* Calendar Metrics */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          <StatCard
            title="Schedule Coverage"
            value={`${Math.min(100, todayEvents.length * 10).toFixed(1)}%`}
            subtitle="Today's slot utilization"
            icon={Globe}
            variant="primary"
          />
          <StatCard
            title="Rest & Personal"
            value={`${focusedHours.toFixed(1)}h`}
            subtitle="Blocked time / Breaks"
            icon={ShieldAlert}
            variant="default"
          />
          <StatCard
            title="Meeting Load"
            value={meetingLoad > 5 ? "High" : "Optimal"}
            subtitle={`${meetingLoad} events today`}
            icon={Users}
            variant={meetingLoad > 5 ? "warning" : "success"}
          />
          <StatCard
            title="Availability"
            value={todayEvents.length < 8 ? "Definite" : "Limited"}
            subtitle="Schedule analysis"
            icon={Activity}
            variant={todayEvents.length < 8 ? "success" : "warning"}
          />
        </div>

        {/* Primary Schedule Interface */}
        <div className="grid grid-cols-1 gap-10 lg:grid-cols-[1fr_400px]">
          <div className="space-y-8">
            <div className="flex flex-col justify-between gap-6 rounded-3xl border border-white/20 bg-white/40 p-6 shadow-xl shadow-slate-200/40 backdrop-blur-xl md:flex-row md:items-center dark:border-slate-800/50 dark:bg-slate-900/40 dark:shadow-none">
              <div className="flex items-center gap-4">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handlePrevMonth}
                  className="h-12 w-12 rounded-2xl border border-transparent shadow-sm hover:border-slate-100 hover:bg-white dark:hover:bg-slate-800"
                >
                  <ChevronLeft className="h-5 w-5" />
                </Button>
                <div className="min-w-[240px] text-center">
                  <h2 className="text-2xl font-black tracking-tight text-slate-900 uppercase dark:text-white">
                    {currentDate.toLocaleDateString("en-US", { month: "long", year: "numeric" })}
                  </h2>
                  <p className="mt-0.5 text-[10px] font-black tracking-[0.2em] text-blue-600 uppercase">
                    Monthly Overview
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleNextMonth}
                  className="h-12 w-12 rounded-2xl border border-transparent shadow-sm hover:border-slate-100 hover:bg-white dark:hover:bg-slate-800"
                >
                  <ChevronRight className="h-5 w-5" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleToday}
                  className="h-12 rounded-2xl border-slate-100 px-6 text-[10px] font-black tracking-widest uppercase"
                >
                  Today
                </Button>
              </div>

              <Tabs
                value={viewType}
                onValueChange={(v) =>{  setViewType(v as ViewType); }}
                className="w-full md:w-auto"
              >
                <TabsList className="h-12 rounded-2xl bg-slate-100/50 p-1 dark:bg-slate-950/50">
                  <TabsTrigger
                    value="day"
                    className="rounded-xl px-6 text-[10px] font-black tracking-widest uppercase data-[state=active]:bg-white data-[state=active]:text-blue-600 dark:data-[state=active]:bg-slate-800"
                  >
                    Day
                  </TabsTrigger>
                  <TabsTrigger
                    value="week"
                    className="rounded-xl px-6 text-[10px] font-black tracking-widest uppercase data-[state=active]:bg-white data-[state=active]:text-blue-600 dark:data-[state=active]:bg-slate-800"
                  >
                    Week
                  </TabsTrigger>
                  <TabsTrigger
                    value="month"
                    className="rounded-xl px-6 text-[10px] font-black tracking-widest uppercase data-[state=active]:bg-white data-[state=active]:text-blue-600 dark:data-[state=active]:bg-slate-800"
                  >
                    Month
                  </TabsTrigger>
                  <TabsTrigger
                    value="agenda"
                    className="rounded-xl px-6 text-[10px] font-black tracking-widest uppercase data-[state=active]:bg-white data-[state=active]:text-blue-600 dark:data-[state=active]:bg-slate-800"
                  >
                    Agenda
                  </TabsTrigger>
                </TabsList>
              </Tabs>
            </div>

            {/* Calendar Views */}
            <div className="group relative">
              <div className="pointer-events-none absolute -inset-1 rounded-[2.5rem] bg-gradient-to-r from-blue-600/10 to-indigo-600/10 opacity-50 blur-2xl" />
              {viewType === "day" && (
                <DayView
                  currentDate={currentDate}
                  events={events}
                  onDeleteEvent={handleDeleteEvent}
                />
              )}
              {viewType === "month" && (
                <MonthView
                  currentDate={currentDate}
                  getDayEvents={getDayEvents}
                  monthDays={monthDays}
                  emptyDays={emptyDays}
                  onDeleteEvent={handleDeleteEvent}
                />
              )}
              {viewType === "week" && <WeekView events={events} />}
              {viewType === "agenda" && (
                <AgendaView events={events} onDeleteEvent={handleDeleteEvent} />
              )}
            </div>
          </div>

          {/* Right Sidebar: Today's Overview & Team Presence */}
          <div className="sticky top-10 space-y-10 self-start">
            <Card className="rounded-[2.5rem] border-none bg-white/60 p-8 shadow-2xl shadow-slate-200/50 backdrop-blur-xl dark:bg-slate-900/60">
              <CardHeader className="mb-8 p-0">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600 text-white shadow-lg shadow-blue-500/20">
                    <Zap className="h-5 w-5" />
                  </div>
                  <div className="space-y-0.5">
                    <CardTitle className="text-xl font-black tracking-tight text-slate-900 uppercase dark:text-white">
                      Daily Agenda
                    </CardTitle>
                    <CardDescription className="text-[10px] font-black tracking-[0.2em] text-slate-400 uppercase">
                      Daily Schedule
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <div className="space-y-4">
                {todayEvents.length > 0 ? (
                  todayEvents.slice(0, 3).map((event) => (
                    <EventHoverCard
                      key={event._id || event.id}
                      event={{
                        ...event,
                        startTime: format(new Date(event.startTime), "HH:mm"),
                        endTime: format(new Date(event.endTime), "HH:mm")
                      }}
                      onDelete={handleDeleteEvent}
                    >
                      <div
                        className={cn(
                          "group relative cursor-help rounded-2xl border-l-4 p-4 transition-colors",
                          event.type === "sync"
                            ? "border-emerald-500 bg-emerald-50 dark:bg-emerald-900/10"
                            : "border-blue-500 bg-blue-50 dark:bg-blue-900/10"
                        )}
                      >
                        <div className="mb-1 flex items-start justify-between">
                          <span className="text-[9px] font-black tracking-widest text-slate-500 uppercase">
                            {format(new Date(event.startTime), "HH:mm")} -{" "}
                            {format(new Date(event.endTime), "HH:mm")}
                          </span>
                          <span
                            className={`h-1.5 w-1.5 rounded-full ${event.type === "sync" ? "bg-emerald-500" : "bg-blue-500"}`}
                          />
                        </div>
                        <h4 className="line-clamp-1 text-sm font-black tracking-tight text-slate-900 uppercase dark:text-white">
                          {event.title}
                        </h4>
                      </div>
                    </EventHoverCard>
                  ))
                ) : (
                  <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50/50 py-8 text-center dark:border-slate-800 dark:bg-slate-800/30">
                    <p className="text-[10px] font-black tracking-widest text-slate-400 uppercase">
                      No events scheduled for today
                    </p>
                  </div>
                )}
                <Button
                  variant="ghost"
                  onClick={() =>{  setViewType("agenda"); }}
                  className="h-12 w-full gap-2 rounded-2xl text-[10px] font-black tracking-widest text-slate-400 uppercase hover:text-blue-600"
                >
                  View Full Agenda
                  <ArrowRight className="h-3 w-3" />
                </Button>
              </div>
            </Card>

            <Card className="group relative overflow-hidden rounded-[2.5rem] border-none bg-slate-900 p-8 text-white shadow-2xl shadow-slate-200/50 dark:bg-white dark:text-slate-900">
              <div className="absolute top-0 right-0 -mt-16 -mr-16 h-32 w-32 rounded-full bg-white/10 blur-3xl" />
              <div className="relative space-y-6 text-center">
                <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-white/20 dark:bg-slate-900/10">
                  <Globe className="h-8 w-8 text-white dark:text-slate-900" />
                </div>
                <div>
                  <h4 className="text-xl font-black tracking-tight uppercase">
                    Organization Status
                  </h4>
                  <p className="mt-2 text-[11px] font-medium italic opacity-70">
                    Update your status for the team
                  </p>
                </div>
                <Button className="h-14 w-full rounded-2xl bg-white text-[11px] font-black tracking-widest text-slate-900 uppercase shadow-xl transition-transform group-hover:scale-105 dark:bg-slate-900 dark:text-white">
                  Set Availability
                </Button>
              </div>
            </Card>
          </div>
        </div>
      </div>
      <CreateEventModal open={isModalOpen} onOpenChange={setIsModalOpen} onSuccess={fetchEvents} />
    </div>
  )
}

function DayView({ currentDate, events = [], onDeleteEvent }: any) {
  const hours = Array.from({ length: 24 }, (_, i) => i)

  const getEventsForHour = (hour: number) => {
    return (events || []).filter((e: any) => {
      const start = new Date(e.startTime)
      const d = currentDate
      return (
        start.getHours() === hour &&
        start.getDate() === d.getDate() &&
        start.getMonth() === d.getMonth() &&
        start.getFullYear() === d.getFullYear()
      )
    })
  }

  return (
    <Card className="overflow-hidden rounded-[2.5rem] border-none bg-white/60 p-8 shadow-2xl shadow-slate-200/50 backdrop-blur-xl dark:bg-slate-900/60">
      <div className="space-y-4">
        <div className="mb-4 flex items-center gap-3">
          <Clock className="h-5 w-5 text-blue-600" />
          <h3 className="text-xl font-black tracking-tight text-slate-900 uppercase dark:text-white">
            Daily Timeline
          </h3>
        </div>
        <div className="space-y-1">
          {hours.map((hour) => {
            const hourEvents = getEventsForHour(hour)
            return (
              <div
                key={hour}
                className="group flex min-h-[80px] gap-6 border-b border-slate-100 last:border-0 dark:border-slate-800"
              >
                <div className="flex w-20 flex-col pt-4">
                  <span className="text-sm font-black text-slate-900 dark:text-white">
                    {hour.toString().padStart(2, "0")}:00
                  </span>
                  <span className="text-[10px] font-black tracking-widest text-slate-400 uppercase">
                    Hour {hour + 1}
                  </span>
                </div>
                <div className="flex flex-1 flex-col gap-2 py-2">
                  {hourEvents.length > 0 ? (
                    hourEvents.map((event: any) => (
                      <EventHoverCard
                        key={event._id || event.id}
                        event={event}
                        onDelete={onDeleteEvent}
                      >
                        <div
                          className={cn(
                            "group/item relative cursor-help rounded-2xl border-l-4 p-4 transition-all",
                            event.type === "blocked"
                              ? "border-amber-500 bg-amber-50 text-amber-900 dark:bg-amber-900/20 dark:text-amber-100"
                              : "border-blue-500 bg-blue-50 text-blue-900 dark:bg-blue-900/20 dark:text-blue-100"
                          )}
                        >
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] font-black tracking-widest uppercase opacity-70">
                              {format(new Date(event.startTime), "HH:mm")} -{" "}
                              {format(new Date(event.endTime), "HH:mm")}
                            </span>
                            <div className="flex items-center gap-2">
                              {event.type === "blocked" && (
                                <Coffee className="h-3 w-3 fill-amber-500/20 text-amber-500" />
                              )}
                              <span
                                className={`h-2 w-2 rounded-full ${event.type === "blocked" ? "bg-amber-500" : "bg-blue-500"}`}
                              />
                            </div>
                          </div>
                          <h4 className="mt-1 text-sm font-black tracking-tight uppercase">
                            {event.title}
                          </h4>
                          {event.description && (
                            <p className="mt-1 line-clamp-1 text-[11px] italic opacity-60">
                              {event.description}
                            </p>
                          )}
                        </div>
                      </EventHoverCard>
                    ))
                  ) : (
                    <div className="flex h-full w-full items-center justify-center rounded-2xl border-2 border-dashed border-slate-50 opacity-0 transition-all group-hover:opacity-100 dark:border-slate-800/50">
                      <span className="text-[10px] font-black tracking-widest text-slate-300 uppercase italic">
                        Open Slot Available
                      </span>
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </Card>
  )
}

function MonthView({ currentDate, getDayEvents, monthDays, emptyDays, onDeleteEvent }: any) {
  const dayLabels = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]
  const today = new Date()
  const isCurrentMonth =
    today.getMonth() === currentDate.getMonth() && today.getFullYear() === currentDate.getFullYear()

  return (
    <Card className="overflow-hidden rounded-[2.5rem] border-none bg-white/60 p-8 shadow-2xl shadow-slate-200/50 backdrop-blur-xl dark:bg-slate-900/60">
      <div className="grid grid-cols-7 gap-6">
        {dayLabels.map((label) => (
          <div
            key={label}
            className="mb-2 text-center text-[10px] font-black tracking-[0.2em] text-slate-400 uppercase"
          >
            {label}
          </div>
        ))}

        {emptyDays.map((_: unknown, i: number) => (
          <div
            key={`empty-${i}`}
            className="min-h-[140px] rounded-3xl bg-slate-100/50 opacity-20"
          />
        ))}

        {monthDays.map((day: any) => {
          const items: CalendarItem[] = getDayEvents(day) || []
          const isToday = isCurrentMonth && today.getDate() === day

          return (
            <div
              key={day}
              className={cn(
                "group/day relative min-h-[140px] rounded-3xl p-4 transition-all duration-300",
                isToday
                  ? "z-10 scale-[1.02] bg-white shadow-xl ring-2 ring-blue-500/20 dark:bg-slate-800"
                  : "bg-slate-50/50 hover:bg-white hover:shadow-lg dark:bg-slate-900/30 dark:hover:bg-slate-800"
              )}
            >
              <span
                className={cn(
                  "text-sm font-black transition-colors",
                  isToday
                    ? "text-blue-600"
                    : "text-slate-400 group-hover/day:text-slate-900 dark:group-hover/day:text-white"
                )}
              >
                {day}
              </span>
              <div className="mt-4 space-y-2">
                {items.slice(0, 3).map((item, idx: number) => (
                  <EventHoverCard key={idx} event={item} onDelete={onDeleteEvent}>
                    <div
                      className={cn(
                        "h-1.5 w-full cursor-help rounded-full transition-all group-hover/day:flex group-hover/day:h-3 group-hover/day:items-center group-hover/day:px-2",
                        item.isEvent
                          ? item.type === "blocked"
                            ? "bg-amber-500"
                            : "bg-emerald-500"
                          : "bg-blue-600"
                      )}
                    >
                      <span className="hidden truncate text-[8px] font-black tracking-tighter text-white uppercase group-hover/day:block">
                        {item.title}
                      </span>
                    </div>
                  </EventHoverCard>
                ))}
                {items.length > 3 && (
                  <p className="mt-2 text-center text-[9px] font-black tracking-widest text-slate-300 uppercase group-hover/day:text-slate-500">
                    +{items.length - 3} Events
                  </p>
                )}
              </div>
              {isToday && (
                <div className="absolute top-4 right-4 h-2 w-2 animate-pulse rounded-full bg-blue-500 shadow-[0_0_12px_rgba(59,130,246,0.5)]" />
              )}
            </div>
          )
        })}
      </div>
    </Card>
  )
}

function WeekView({ events = [] }: any) {
  return (
    <Card className="rounded-[2.5rem] bg-white/60 p-12 text-center backdrop-blur-xl dark:bg-slate-900/60">
      <div className="flex flex-col items-center">
        <div className="mb-8 flex h-20 w-20 items-center justify-center rounded-3xl bg-blue-600/10">
          <Globe className="h-10 w-10 text-blue-600" />
        </div>
        <h3 className="text-3xl font-black tracking-tight text-slate-900 uppercase dark:text-white">
          Seven-Day Forecast
        </h3>
        <p className="mx-auto mt-4 max-w-md font-medium text-slate-500 italic opacity-80">
          Showing team presence for the upcoming week. {events?.length || 0} scheduled events
          detected.
        </p>
      </div>
    </Card>
  )
}

function AgendaView({ events = [], onDeleteEvent }: any) {
  return (
    <Card className="rounded-[2.5rem] border-none bg-white/60 p-8 shadow-2xl shadow-slate-200/50 backdrop-blur-xl dark:bg-slate-900/60">
      <div className="space-y-8">
        <div className="flex items-center gap-3">
          <Activity className="h-5 w-5 text-blue-600" />
          <h3 className="text-xl font-black tracking-tight text-slate-900 uppercase dark:text-white">
            Agenda Overview
          </h3>
        </div>
        <div className="space-y-4">
          {events?.length > 0 ? (
            events.map((event: any) => (
              <div
                key={event._id || event.id}
                className="group flex items-center gap-6 rounded-[2rem] border border-slate-100 bg-slate-50 p-6 transition-all hover:border-blue-500/30 dark:border-slate-800 dark:bg-slate-800/50"
              >
                <div className="flex h-16 w-16 flex-col items-center justify-center rounded-2xl bg-white shadow-sm dark:bg-slate-900">
                  <span className="text-[10px] font-black text-blue-600 uppercase">
                    {format(new Date(event.startTime), "MMM")}
                  </span>
                  <span className="text-xl font-black">
                    {format(new Date(event.startTime), "dd")}
                  </span>
                </div>
                <div className="flex-1">
                  <div className="mb-1 flex items-center gap-3">
                    <span className="text-[9px] font-black tracking-widest text-slate-400 uppercase">
                      {format(new Date(event.startTime), "HH:mm")} -{" "}
                      {format(new Date(event.endTime), "HH:mm")}
                    </span>
                    <span
                      className={`rounded-full px-2 py-0.5 text-[8px] font-black tracking-widest uppercase ${event.type === "sync" ? "bg-emerald-100 text-emerald-600" : "bg-amber-100 text-amber-600"}`}
                    >
                      {event.type === "sync" ? "Meeting" : "Blocked"}
                    </span>
                  </div>
                  <h4 className="text-lg font-black tracking-tight uppercase">{event.title}</h4>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => onDeleteEvent(event._id || event.id)}
                  className="text-slate-300 opacity-0 transition-all group-hover:opacity-100 hover:text-rose-600"
                >
                  <Trash2 className="h-5 w-5" />
                </Button>
              </div>
            ))
          ) : (
            <div className="rounded-[2rem] border border-dashed border-slate-200 bg-slate-50/50 py-12 text-center dark:border-slate-800 dark:bg-slate-800/30">
              <p className="text-[10px] font-black tracking-[0.2em] text-slate-400 uppercase">
                No events found in this view
              </p>
            </div>
          )}
        </div>
      </div>
    </Card>
  )
}
