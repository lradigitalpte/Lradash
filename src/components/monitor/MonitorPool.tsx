"use client"

import { useEffect, useRef } from "react"

import { apiClient } from "@/lib/api/client"

/**
 * Poor Man's Pool / Client-side Pinger
 * This component runs in the background of your app.
 * It periodically pings the cron route to trigger checks IF the user has the tab open.
 * This is a cost-effective alternative to server-side crons if accuracy isn't mission-critical.
 */
export function MonitorPool() {
  const intervalRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    const triggerCheck = async () => {
      try {
        // We call the internal cron endpoint.
        // We use apiClient to ensure any required local auth/headers are respected
        await apiClient.get("/api/monitor/cron")
      } catch (error) {
        console.error("[MonitorPool] Tick failed:", error)
      }
    }

    // Run once on load
    triggerCheck()

    // Run every 5 minutes (300,000 ms)
    intervalRef.current = setInterval(triggerCheck, 300000)

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }
  }, [])

  return null // Ghost component
}
