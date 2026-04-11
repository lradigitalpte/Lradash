"use client"

import { usePathname, useSearchParams } from "next/navigation"
import { useCallback, useEffect, useRef, useState } from "react"
import { toast } from "sonner"

import { apiClient } from "@/lib/api/client"

interface GoogleWorkspaceConnectionStatus {
  connected: boolean
  accountEmail: string | null
  scopes: string[]
  /** Linked Google account exists but tokens lack `calendar.events` — create meeting will 403 until re-authorized. */
  needsCalendarReconnect: boolean
}

const DEFAULT_STATUS: GoogleWorkspaceConnectionStatus = {
  connected: false,
  accountEmail: null,
  scopes: [],
  needsCalendarReconnect: false
}

export function useGoogleWorkspaceConnection(projectId?: string) {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const handledQueryRef = useRef<string | null>(null)

  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)
  const [status, setStatus] = useState<GoogleWorkspaceConnectionStatus>(DEFAULT_STATUS)

  const buildStatusUrl = useCallback(
    (force = false) => {
      const params = new URLSearchParams()

      if (projectId) {
        params.set("projectId", projectId)
      }

      if (force) {
        params.set("force", "true")
      }

      const currentQuery = searchParams.toString()
      const returnTo = currentQuery ? `${pathname}?${currentQuery}` : pathname
      params.set("returnTo", returnTo)

      return `/api/auth/google/start?${params.toString()}`
    },
    [pathname, projectId, searchParams]
  )

  const refresh = useCallback(async () => {
    try {
      setLoading(true)
      const response = await apiClient.get(buildStatusUrl())

      if (!response.ok) {
        const error = await response.json().catch(() => null)
        throw new Error(error?.error || "Failed to load Google Calendar status")
      }

      const data = await response.json()
      setStatus({
        connected: Boolean(data.connected),
        accountEmail: data.accountEmail || null,
        scopes: data.scopes || [],
        needsCalendarReconnect: Boolean(data.needsCalendarReconnect)
      })
    } catch (error) {
      console.error("Failed to refresh Google connection:", error)
      setStatus(DEFAULT_STATUS)
    } finally {
      setLoading(false)
    }
  }, [buildStatusUrl])

  const connect = useCallback(
    async (force = false) => {
      try {
        setBusy(true)
        const response = await apiClient.get(buildStatusUrl(force))
        const data = await response.json().catch(() => null)

        if (!response.ok) {
          throw new Error(data?.error || "Failed to start Google connection")
        }

        if (data?.authUrl) {
          window.location.href = data.authUrl
          return
        }

        if (data?.connected) {
          toast.success("Google Calendar is already connected")
          setStatus({
            connected: true,
            accountEmail: data.accountEmail || null,
            scopes: data.scopes || [],
            needsCalendarReconnect: false
          })
        }
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Failed to start Google connection")
      } finally {
        setBusy(false)
      }
    },
    [buildStatusUrl]
  )

  const disconnect = useCallback(async () => {
    try {
      setBusy(true)
      const response = await apiClient.post("/api/auth/google/disconnect", {})
      const data = await response.json().catch(() => null)

      if (!response.ok) {
        throw new Error(data?.error || "Failed to disconnect Google Calendar")
      }

      toast.success("Google Calendar disconnected")
      setStatus(DEFAULT_STATUS)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to disconnect Google Calendar")
    } finally {
      setBusy(false)
    }
  }, [])

  useEffect(() => {
    refresh()
  }, [refresh])

  useEffect(() => {
    const googleState = searchParams.get("google")
    const message = searchParams.get("message")
    const error = searchParams.get("error")
    const signature = `${googleState || ""}:${message || ""}:${error || ""}`

    if (!googleState || handledQueryRef.current === signature) {
      return
    }

    handledQueryRef.current = signature

    if (googleState === "success") {
      toast.success(message === "connected" ? "Google Calendar connected" : message || "Connected")
    }

    if (googleState === "error") {
      toast.error(error || "Google connection failed")
    }

    refresh()
  }, [refresh, searchParams])

  return {
    loading,
    busy,
    status,
    refresh,
    connect,
    disconnect
  }
}
