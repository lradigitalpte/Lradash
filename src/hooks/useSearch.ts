"use client"

import { useState, useCallback, useEffect } from "react"

import { apiClient } from "@/lib/api/client"

export interface SearchResult {
  id: string
  type: "task" | "project" | "board"
  title: string
  description?: string
  icon?: string
  url?: string
  metadata?: {
    status?: string
    priority?: string
    dueDate?: string
    assignee?: string
    projectName?: string
    boardName?: string
  }
}

interface SearchResponse {
  results: SearchResult[]
}

export function useSearch() {
  const [query, setQuery] = useState("")
  const [results, setResults] = useState<SearchResult[]>([])
  const [loading, setLoading] = useState(false)
  const [isOpen, setIsOpen] = useState(false)

  const search = useCallback(async (searchQuery: string) => {
    if (!searchQuery || searchQuery.length < 2) {
      setResults([])
      return
    }

    setLoading(true)
    try {
      const response = await apiClient.get(
        `/api/search?q=${encodeURIComponent(searchQuery)}&limit=8`
      )

      if (response.ok) {
        const data = (await response.json()) as SearchResponse
        setResults(data.results)
      }
    } catch (error) {
      console.error("Search error:", error)
      setResults([])
    } finally {
      setLoading(false)
    }
  }, [])

  const handleQueryChange = useCallback(
    (newQuery: string) => {
      setQuery(newQuery)
      search(newQuery)
    },
    [search]
  )

  const clear = useCallback(() => {
    setQuery("")
    setResults([])
  }, [])

  return {
    query,
    setQuery: handleQueryChange,
    results,
    loading,
    isOpen,
    setIsOpen,
    clear
  }
}
