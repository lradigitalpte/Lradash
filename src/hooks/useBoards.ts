"use client"

import { useCallback, useEffect, useState } from "react"

import { apiClient } from "@/lib/api/client"
import { useTaskStore } from "@/lib/store"
import { Board } from "@/types/dbInterface"

export function useBoards() {
  const [loading, setLoading] = useState(true)
  const userId = useTaskStore((state) => state.userId)
  const myBoards = useTaskStore((state) => state.myBoards)
  const teamBoards = useTaskStore((state) => state.teamBoards)
  const setMyBoards = useTaskStore((state) => state.setMyBoards)
  const setTeamBoards = useTaskStore((state) => state.setTeamBoards)

  // Memoize fetchBoards so it doesn't change reference every render
  const fetchBoards = useCallback(async () => {
    if (!userId) {
      setMyBoards([])
      setTeamBoards([])
      setLoading(false)
      return
    }

    setLoading(true)
    try {
      const response = await apiClient.get("/api/boards")

      if (!response.ok) {
        throw new Error(`Failed to fetch boards: ${response.statusText}`)
      }

      const data = await response.json()
      const boardsFromDB: Board[] = data.boards || []

      const userMyBoards: Board[] = []
      const userTeamBoards: Board[] = []

      boardsFromDB.forEach((board) => {
        const ownerId =
          board.owner && typeof board.owner === "object" && "id" in board.owner
            ? String((board.owner as { id: string }).id)
            : typeof board.owner === "string"
              ? board.owner
              : ""
        const isOwner = Boolean(userId && ownerId && ownerId === String(userId))
        const isPrivate = board.isPrivate // Default to private=true

        if (isOwner) {
          // Owner can always see their own boards (personal or project-linked)
          userMyBoards.push(board)
        } else if (!isPrivate) {
          // Only show non-private boards to other users
          userTeamBoards.push(board)
        }
        // Private boards not owned by this user are hidden
      })

      setMyBoards(userMyBoards)
      setTeamBoards(userTeamBoards)
    } catch (error) {
      console.error("Failed to fetch boards:", error)
      setMyBoards([])
      setTeamBoards([])
    } finally {
      setLoading(false)
    }
  }, [userId, setMyBoards, setTeamBoards])

  // Only fetch when userId changes
  useEffect(() => {
    fetchBoards()
  }, [userId]) // Only depend on userId, not fetchBoards

  return { myBoards, teamBoards, loading, fetchBoards }
}
