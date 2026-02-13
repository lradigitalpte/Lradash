import { useState, useEffect } from "react"

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
        const token = localStorage.getItem("auth_token") || ""

        const res = await fetch(`/api/projects/${projectId}/marketing/clusters`, {
          headers: { Authorization: `Bearer ${token}` }
        })

        if (res.ok) {
          const data = await res.json()
          setClusters(data)
        }

        setLoading(false)
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to fetch clusters")
        setLoading(false)
      }
    }

    if (projectId) {
      fetchClusters()
    }
  }, [projectId])

  const addCluster = async (name: string, subtopics: string[] = []) => {
    try {
      const token = localStorage.getItem("auth_token") || ""
      const res = await fetch(`/api/projects/${projectId}/marketing/clusters`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ name, subtopics })
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
      const token = localStorage.getItem("auth_token") || ""
      const res = await fetch(`/api/projects/${projectId}/marketing/clusters`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ clusterId, ...updates })
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
      const token = localStorage.getItem("auth_token") || ""
      const res = await fetch(
        `/api/projects/${projectId}/marketing/clusters?clusterId=${clusterId}`,
        {
          method: "DELETE",
          headers: { Authorization: `Bearer ${token}` }
        }
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
