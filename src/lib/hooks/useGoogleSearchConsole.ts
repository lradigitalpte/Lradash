import { useState, useEffect } from "react"

interface GoogleConnectionStatus {
  connected: boolean
  propertyUrl?: string
  propertyType?: string
  isActive?: boolean
  lastSyncedAt?: string
  connectedAt?: string
}

interface SearchConsoleData {
  overview: {
    totalClicks: number
    totalImpressions: number
    averageCTR: number
    averagePosition: number
    trend: {
      clicks: number
      impressions: number
      ctr: number
      position: number
    }
  }
  topQueries: Array<{
    query: string
    clicks: number
    impressions: number
    ctr: number
    position: number
  }>
  topPages: Array<{
    page: string
    clicks: number
    impressions: number
    ctr: number
    position: number
  }>
  lastSynced: string
}

export function useGoogleSearchConsole(projectId: string) {
  const [connectionStatus, setConnectionStatus] = useState<GoogleConnectionStatus>({
    connected: false
  })
  const [searchData, setSearchData] = useState<SearchConsoleData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true)
        const token = localStorage.getItem("auth_token") || ""

        // Check connection status
        const statusRes = await fetch(`/api/projects/${projectId}/marketing/google/connect`, {
          headers: { Authorization: `Bearer ${token}` }
        })

        if (statusRes.ok) {
          const status = await statusRes.json()
          setConnectionStatus(status)

          // If connected, fetch search console data
          if (status.connected) {
            const dataRes = await fetch(
              `/api/projects/${projectId}/marketing/google/search-console`,
              {
                headers: { Authorization: `Bearer ${token}` }
              }
            )

            if (dataRes.ok) {
              const data = await dataRes.json()
              setSearchData(data)
            }
          }
        }

        setLoading(false)
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to fetch Google data")
        setLoading(false)
      }
    }

    if (projectId) {
      fetchData()
    }
  }, [projectId])

  const connect = async (propertyUrl: string, propertyType: string) => {
    try {
      const token = localStorage.getItem("auth_token") || ""
      const res = await fetch(`/api/projects/${projectId}/marketing/google/connect`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ propertyUrl, propertyType })
      })

      if (res.ok) {
        const data = await res.json()
        setConnectionStatus({ connected: true, ...data })
        return data
      }
    } catch (err) {
      console.error("Failed to connect Google:", err)
    }
  }

  return {
    connectionStatus,
    searchData,
    loading,
    error,
    connect
  }
}
