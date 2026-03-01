"use client"

/**
 * useNotifications
 *
 * Orchestrates:
 *  1. Fetches existing notifications from REST API on mount
 *  2. Opens an SSE connection to /api/notifications/stream for real-time updates
 *  3. Registers Firebase FCM token for background push notifications
 *  4. Surfaces helpers to mark notifications as read
 */

import type { INotificationDoc } from "@/models/notification.model"
import { useEffect, useRef, useCallback } from "react"

import { useAuth } from "@/hooks/useAuth"
import { useNotificationStore } from "@/store/notificationStore"

const SSE_RECONNECT_MS = 5_000

export function useNotifications() {
  const { accessToken: token } = useAuth()
  const store = useNotificationStore()
  const sseRef = useRef<EventSource | null>(null)
  const reconnectTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  // ── Fetch existing notifications ───────────────────────────────────────────
  const fetchNotifications = useCallback(async () => {
    if (!token) {
      return
    }
    store.setLoading(true)
    try {
      const res = await fetch("/api/notifications", {
        headers: { Authorization: `Bearer ${token}` }
      })
      if (!res.ok) {
        return
      }
      const { notifications, unreadCount } = await res.json()
      store.setNotifications(notifications, unreadCount)
    } catch (err) {
      console.warn("[useNotifications] fetch failed:", err)
      store.setLoading(false)
    }
  }, [token]) // eslint-disable-line react-hooks/exhaustive-deps

  // ── SSE connection ─────────────────────────────────────────────────────────
  const connectSse = useCallback(() => {
    if (!token || typeof window === "undefined") {
      return
    }
    if (sseRef.current) {
      sseRef.current.close()
    }

    // EventSource doesn't support custom headers natively.
    // We pass the token as a query param and the endpoint validates it.
    const url = `/api/notifications/stream?token=${encodeURIComponent(token)}`
    const es = new EventSource(url)
    sseRef.current = es

    es.addEventListener("connected", () => {
      console.debug("[SSE] notification stream connected")
    })

    es.addEventListener("message", (event) => {
      try {
        const notification: INotificationDoc = JSON.parse(event.data)
        store.prependNotification(notification)
      } catch {
        // ignore malformed events
      }
    })

    es.onerror = () => {
      es.close()
      sseRef.current = null
      // Reconnect after delay
      reconnectTimer.current = setTimeout(connectSse, SSE_RECONNECT_MS)
    }
  }, [token]) // eslint-disable-line react-hooks/exhaustive-deps

  // ── Firebase FCM registration ──────────────────────────────────────────────
  const registerFcm = useCallback(async () => {
    if (!token || typeof window === "undefined") {
      return
    }
    try {
      const { requestFcmToken, saveFcmTokenToServer, onForegroundMessage } =
        await import("@/lib/firebase/messaging")
      const fcmToken = await requestFcmToken()
      if (fcmToken) {
        await saveFcmTokenToServer(fcmToken, token)
        // Show foreground FCM messages as in-app toast
        onForegroundMessage(({ title, body }) => {
          // Use sonner toast for foreground FCM messages
          try {
            const { toast } = require("sonner")
            toast(title, { description: body })
          } catch {
            // sonner not available
          }
        })
      }
    } catch (err) {
      // FCM is optional – don't block if it fails
      console.debug("[FCM] registration skipped:", err)
    }
  }, [token])

  // ── Lifecycle ──────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!token) {
      return
    }
    fetchNotifications()
    connectSse()
    registerFcm()

    return () => {
      sseRef.current?.close()
      sseRef.current = null
      if (reconnectTimer.current) {
        clearTimeout(reconnectTimer.current)
      }
    }
  }, [token, fetchNotifications, connectSse, registerFcm])

  // ── Actions ────────────────────────────────────────────────────────────────
  const markRead = useCallback(
    async (notificationId: string) => {
      store.markRead(notificationId)
      if (!token) {
        return
      }
      await fetch("/api/notifications", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ notificationId })
      })
    },
    [token] // eslint-disable-line react-hooks/exhaustive-deps
  )

  const markAllRead = useCallback(async () => {
    store.markAllRead()
    if (!token) {
      return
    }
    await fetch("/api/notifications", {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({ markAllRead: true })
    })
  }, [token]) // eslint-disable-line react-hooks/exhaustive-deps

  return {
    notifications: store.notifications,
    unreadCount: store.unreadCount,
    loading: store.loading,
    markRead,
    markAllRead
  }
}
