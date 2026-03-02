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
  const connectSse = useCallback(() => {
    if (typeof window === "undefined") {
      return
    }

    // Always grab the latest token – avoids reconnecting with a stale JWT
    const currentToken = localStorage.getItem("accessToken")
    if (!currentToken) {
      return
    }

    // Abort any previous connection
    sseRef.current?.abort()
    const controller = new AbortController()
    sseRef.current = controller

    ;(async () => {
      try {
        const response = await fetch(
          `/api/notifications/stream?token=${encodeURIComponent(currentToken)}`,
          { signal: controller.signal }
        )

        if (response.status === 401) {
          // Token expired / invalid – suppress the retry loop entirely.
          // The connection will re-open automatically when the token changes
          // (the useEffect below depends on `token` from useAuth).
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

          // SSE blocks are separated by double newline
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
        // AbortError means we closed the connection intentionally
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
        reconnectTimer.current = setTimeout(connectSse, SSE_RECONNECT_MS)
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
    fetchNotifications()
    connectSse()
    registerFcm()

    // Re-connect SSE whenever the API client silently refreshes the access token.
    // The apiClient dispatches this event after writing the new token to localStorage,
    // so connectSse() will pick it up via localStorage.getItem("accessToken").
    const handleTokenRefresh = () => {
      if (reconnectTimer.current) {
        clearTimeout(reconnectTimer.current)
      }
      connectSse()
    }
    window.addEventListener("token-refreshed", handleTokenRefresh)

    return () => {
      window.removeEventListener("token-refreshed", handleTokenRefresh)
      sseRef.current?.abort()
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
