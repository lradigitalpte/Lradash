import { useState, useEffect } from "react"

interface SEOScore {
  overallScore: number
  categories: {
    onPage: number
    technical: number
    content: number
  }
  stats: {
    totalRecommendations: number
    completedRecommendations: number
    pendingRecommendations: number
  }
}

interface SEORecommendation {
  id: string
  projectId: string
  title: string
  description: string
  category: "on-page" | "technical" | "content" | "experience"
  impact: "high" | "medium" | "low"
  difficulty: "easy" | "medium" | "hard"
  status: "pending" | "in-progress" | "completed" | "ignored" | "converted-to-task"
  taskId?: string
  createdAt: string
  updatedAt: string
}

export function useSEOData(projectId: string) {
  const [score, setScore] = useState<SEOScore | null>(null)
  const [recommendations, setRecommendations] = useState<SEORecommendation[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true)

        // Get auth token from session/cookie
        const token = localStorage.getItem("auth_token") || ""

        // Fetch SEO score
        const scoreRes = await fetch(`/api/projects/${projectId}/marketing/seo-score`, {
          headers: { Authorization: `Bearer ${token}` }
        })
        if (scoreRes.ok) {
          const scoreData = await scoreRes.json()
          setScore(scoreData)
        }

        // Fetch recommendations
        const recsRes = await fetch(`/api/projects/${projectId}/marketing/recommendations`, {
          headers: { Authorization: `Bearer ${token}` }
        })
        if (recsRes.ok) {
          const recsData = await recsRes.json()
          setRecommendations(recsData)
        }

        setLoading(false)
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to fetch SEO data")
        setLoading(false)
      }
    }

    if (projectId) {
      fetchData()
    }
  }, [projectId])

  const updateRecommendationStatus = async (
    recommendationId: string,
    status: string,
    taskId?: string
  ) => {
    try {
      const token = localStorage.getItem("auth_token") || ""
      const res = await fetch(`/api/projects/${projectId}/marketing/recommendations`, {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ recommendationId, status, taskId })
      })

      if (res.ok) {
        // Update local state
        setRecommendations((prev) =>
          prev.map((r) => (r.id === recommendationId ? { ...r, status: status as any, taskId } : r))
        )
      }
    } catch (err) {
      console.error("Failed to update recommendation:", err)
    }
  }

  return {
    score,
    recommendations,
    loading,
    error,
    updateRecommendationStatus
  }
}
