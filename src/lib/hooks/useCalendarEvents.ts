import { useState, useEffect } from "react"

import { apiClient } from "@/lib/api/client"

interface CalendarEvent {
  _id: string
  id: string
  projectId: string
  strategyId: string
  strategyName: string
  title: string
  date: Date | string
  status: string
  notes?: string
}

export function useCalendarEvents(projectId: string) {
  const [events, setEvents] = useState<CalendarEvent[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        setLoading(true)
        const response = await apiClient.get(`/api/projects/${projectId}/marketing/calendar`)

        if (response.ok) {
          const eventsData = await response.json()

          // Map _id to id for consistency
          const mappedEvents = eventsData.map((event: any) => ({
            ...event,
            id: event._id || event.id,
            date: new Date(event.date)
          }))

          setEvents(mappedEvents)
          setError(null)
        } else {
          console.warn(`Failed to fetch calendar events: ${response.status}`)
          setEvents([])
        }
      } catch (err) {
        console.error("Failed to fetch calendar events:", err)
        setError("Failed to load calendar events")
        setEvents([])
      } finally {
        setLoading(false)
      }
    }

    if (projectId) {
      fetchEvents()
    }
  }, [projectId])

  const createEvent = async (event: Omit<CalendarEvent, "_id" | "id">) => {
    try {
      const response = await apiClient.post(`/api/projects/${projectId}/marketing/calendar`, {
        ...event,
        date: event.date instanceof Date ? event.date.toISOString() : event.date
      })

      if (!response.ok) {
        throw new Error("Failed to create event")
      }

      const data = await response.json()
      const newEvent = {
        ...data,
        id: data._id || data.id,
        date: new Date(data.date)
      }
      setEvents([...events, newEvent])
      return newEvent
    } catch (err) {
      console.error("Failed to create event:", err)
      throw err
    }
  }

  const updateEvent = async (id: string, updates: Partial<CalendarEvent>) => {
    try {
      const response = await apiClient.put(`/api/projects/${projectId}/marketing/calendar`, {
        id,
        ...updates,
        date: updates.date instanceof Date ? updates.date.toISOString() : updates.date
      })

      if (!response.ok) {
        throw new Error("Failed to update event")
      }

      const data = await response.json()
      const updated = {
        ...data,
        id: data._id || data.id,
        date: new Date(data.date)
      }
      setEvents(events.map((e) => (e.id === id ? updated : e)))
      return updated
    } catch (err) {
      console.error("Failed to update event:", err)
      throw err
    }
  }

  const deleteEvent = async (id: string) => {
    try {
      const response = await apiClient.delete(
        `/api/projects/${projectId}/marketing/calendar?id=${id}`
      )

      if (response.ok) {
        setEvents(events.filter((e) => e.id !== id))
      }
    } catch (err) {
      console.error("Failed to delete event:", err)
      throw err
    }
  }

  return {
    events,
    loading,
    error,
    createEvent,
    updateEvent,
    deleteEvent
  }
}
