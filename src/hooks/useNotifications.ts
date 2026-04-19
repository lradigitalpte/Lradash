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

// Module-level ref-count: ensures only one SSE connection is active at a time
// even when useNotifications() is mounted by multiple components (Header + notifications page)
let sseInstanceCount = 0
let globalSseController: AbortController | null = null
let globalReconnectTimer: ReturnType<typeof setTimeout> | null = null

export function useNotifications() {
  const { accessToken: token } = useAuth()
  const store = useNotificationStore()
  const sseRef = useRef<AbortController | null>(null)
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
  // Uses fetch so we can check status codes (e.g. stop on 401) and always
  // reads the freshest token from localStorage on every connect attempt.
  // Uses module-level controller so multiple hook instances share one SSE stream.
  const connectSse = useCallback(() => {
    if (typeof window === "undefined") {
      return
    }

    // If a global SSE connection is already active, don't open another one
    if (globalSseController && !globalSseController.signal.aborted) {
      return
    }

    const currentToken = localStorage.getItem("accessToken")
    if (!currentToken) {
      return
    }

    globalSseController?.abort()
    const controller = new AbortController()
    globalSseController = controller
    sseRef.current = controller

    ;(async () => {
      try {
        const response = await fetch(
          `/api/notifications/stream?token=${encodeURIComponent(currentToken)}`,
          { signal: controller.signal }
        )

        if (response.status === 401) {
          console.warn("[SSE] 401 Unauthorized – reconnect suppressed until token refreshes")
          return
        }

        if (!response.ok || !response.body) {
          throw new Error(`[SSE] unexpected status ${response.status}`)
        }

        console.debug("[SSE] notification stream connected")
        const reader = response.body.getReader()
        const decoder = new TextDecoder()
        let buffer = ""

        while (true) {
          const { done, value } = await reader.read()
          if (done) {
            break
          }
          buffer += decoder.decode(value, { stream: true })

          const blocks = buffer.split("\n\n")
          buffer = blocks.pop() ?? ""
          for (const block of blocks) {
            const dataLine = block.split("\n").find((l) => l.startsWith("data:"))
            if (!dataLine) {
              continue
            }
            const raw = dataLine.slice(5).trim()
            try {
              const notification: INotificationDoc = JSON.parse(raw)
              store.prependNotification(notification)
            } catch {
              // ignore malformed events
            }
          }
        }
      } catch (err: unknown) {
        if (
          typeof err === "object" &&
          err !== null &&
          "name" in err &&
          (err as { name: string }).name === "AbortError"
        ) {
          return
        }
        console.debug("[SSE] stream error, reconnecting:", err)
      }

      // Schedule reconnect only if not deliberately aborted
      if (!controller.signal.aborted) {
        globalReconnectTimer = setTimeout(connectSse, SSE_RECONNECT_MS)
      }
    })()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

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

    // Track how many components are using this hook; only the first starts SSE,
    // only the last stops it — prevents duplicate connections from Header + notifications page
    sseInstanceCount++
    const isFirstMount = sseInstanceCount === 1

    if (isFirstMount) {
      fetchNotifications()
      connectSse()
      registerFcm()
    }

    const handleTokenRefresh = () => {
      if (globalReconnectTimer) {
        clearTimeout(globalReconnectTimer)
        globalReconnectTimer = null
      }
      // Force a new connection regardless of current state
      globalSseController?.abort()
      globalSseController = null
      connectSse()
    }
    window.addEventListener("token-refreshed", handleTokenRefresh)

    return () => {
      window.removeEventListener("token-refreshed", handleTokenRefresh)
      sseInstanceCount--

      // Only close the SSE stream when the very last consumer unmounts
      if (sseInstanceCount === 0) {
        globalSseController?.abort()
        globalSseController = null
        if (globalReconnectTimer) {
          clearTimeout(globalReconnectTimer)
          globalReconnectTimer = null
        }
      }

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
      try {
        const res = await fetch("/api/notifications", {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify({ notificationId })
        })
        if (!res.ok) {
          fetchNotifications()
        }
      } catch {
        fetchNotifications()
      }
    },
    [token, fetchNotifications] // eslint-disable-line react-hooks/exhaustive-deps
  )

  const markAllRead = useCallback(async () => {
    store.markAllRead()
    if (!token) {
      return
    }
    try {
      const res = await fetch("/api/notifications", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ markAllRead: true })
      })
      if (!res.ok) {
        fetchNotifications()
      }
    } catch {
      fetchNotifications()
    }
  }, [token, fetchNotifications]) // eslint-disable-line react-hooks/exhaustive-deps

  const clearAll = useCallback(async () => {
    store.clearAll()
    if (!token) {
      return
    }

    try {
      const res = await fetch("/api/notifications", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ clearAll: true })
      })
      if (!res.ok) {
        fetchNotifications()
      }
    } catch {
      fetchNotifications()
    }
  }, [token, fetchNotifications]) // eslint-disable-line react-hooks/exhaustive-deps

  const dismissNotification = useCallback(
    async (notificationId: string) => {
      store.removeNotification(notificationId)
      if (!token) {
        return
      }

      try {
        const res = await fetch("/api/notifications", {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify({ notificationId })
        })
        if (!res.ok) {
          fetchNotifications()
        }
      } catch {
        fetchNotifications()
      }
    },
    [token, fetchNotifications] // eslint-disable-line react-hooks/exhaustive-deps
  )

  return {
    notifications: store.notifications,
    unreadCount: store.unreadCount,
    loading: store.loading,
    markRead,
    markAllRead,
    clearAll,
    dismissNotification
  }
}
