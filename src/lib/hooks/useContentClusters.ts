import { useState, useEffect } from "react"

import { apiClient } from "@/lib/api/client"

interface ContentCluster {
  id: string
  projectId: string
  name: string
  subtopics: string[]
  authorityScore: number
  status: "planning" | "building" | "active" | "strong"
  pillarPageUrl?: string
  createdBy: string
  createdAt: string
  updatedAt: string
}

export function useContentClusters(projectId: string) {
  const [clusters, setClusters] = useState<ContentCluster[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchClusters() {
      try {
        setLoading(true)
        const response = await apiClient.get(`/api/projects/${projectId}/marketing/clusters`)

        if (response.ok) {
          const data = await response.json()
          setClusters(data)
        } else {
          console.warn(`Failed to fetch clusters: ${response.status}`)
          setClusters([])
        }

        setLoading(false)
      } catch (err) {
        console.error("Fetch clusters error:", err)
        setError(err instanceof Error ? err.message : "Failed to fetch clusters")
        setClusters([])
        setLoading(false)
      }
    }

    if (projectId) {
      fetchClusters()
    }
  }, [projectId])

  const addCluster = async (name: string, subtopics: string[] = []) => {
    try {
      const res = await apiClient.post(`/api/projects/${projectId}/marketing/clusters`, {
        name,
        subtopics
      })

      if (res.ok) {
        const newCluster = await res.json()
        setClusters((prev) => [newCluster, ...prev])
        return newCluster
      }
    } catch (err) {
      console.error("Failed to add cluster:", err)
    }
  }

  const updateCluster = async (clusterId: string, updates: Partial<ContentCluster>) => {
    try {
      const res = await apiClient.put(`/api/projects/${projectId}/marketing/clusters`, {
        clusterId,
        ...updates
      })

      if (res.ok) {
        const updated = await res.json()
        setClusters((prev) => prev.map((c) => (c.id === clusterId ? updated : c)))
      }
    } catch (err) {
      console.error("Failed to update cluster:", err)
    }
  }

  const deleteCluster = async (clusterId: string) => {
    try {
      const res = await apiClient.delete(
        `/api/projects/${projectId}/marketing/clusters?clusterId=${clusterId}`
      )

      if (res.ok) {
        setClusters((prev) => prev.filter((c) => c.id !== clusterId))
      }
    } catch (err) {
      console.error("Failed to delete cluster:", err)
    }
  }

  return {
    clusters,
    loading,
    error,
    addCluster,
    updateCluster,
    deleteCluster
  }
}
