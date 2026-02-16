import { useState, useEffect } from "react"

import { apiClient } from "@/lib/api/client"

interface SocialStrategy {
  _id: string
  id?: string
  projectId: string
  type: string
  title: string
  description?: string
  status: string
  platforms: string[]
  implementationSteps?: string[]
  metrics?: {
    targetReach?: number
    targetEngagement?: number
    targetROI?: number
  }
  createdAt?: Date
  updatedAt?: Date
}

export function useSocialStrategies(projectId: string) {
  const [strategies, setStrategies] = useState<SocialStrategy[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchStrategies = async () => {
      if (!projectId) {
        return
      }

      try {
        setLoading(true)
        const response = await apiClient.get(`/api/projects/${projectId}/marketing/strategies`)

        if (response.ok) {
          const data = await response.json()
          const strategiesArray = data.strategies || []

          // Map _id to id for consistency
          const mappedStrategies = strategiesArray.map((strategy: any) => ({
            ...strategy,
            id: strategy._id || strategy.id
          }))

          setStrategies(mappedStrategies)
          setError(null)
        } else {
          setStrategies([])
          setError("Failed to load strategies")
        }
      } catch (err) {
        console.error("Failed to fetch strategies:", err)
        setError("Failed to load strategies")
        setStrategies([])
      } finally {
        setLoading(false)
      }
    }

    fetchStrategies()
  }, [projectId])

  return {
    strategies,
    loading,
    error
  }
}
