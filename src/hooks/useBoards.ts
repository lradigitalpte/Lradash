"use client"

import { useCallback, useEffect, useRef, useState } from "react"

import { apiClient } from "@/lib/api/client"
import { useTaskStore } from "@/lib/store"
import { Board } from "@/types/dbInterface"

// Module-level singleton: prevents duplicate in-flight requests when multiple
// components mount useBoards() simultaneously (AppSidebar, BoardOverview, etc.)
let activeFetchPromise: Promise<void> | null = null
let lastFetchedForUserId: string | null = null

async function doFetchBoards(
  userId: string,
  setMyBoards: (b: Board[]) => void,
  setTeamBoards: (b: Board[]) => void
): Promise<void> {
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
    const isOwner = Boolean(ownerId && ownerId === String(userId))
    const isPrivate = board.isPrivate

    if (isOwner) {
      userMyBoards.push(board)
    } else if (!isPrivate) {
      userTeamBoards.push(board)
    }
  })

  setMyBoards(userMyBoards)
  setTeamBoards(userTeamBoards)
}

export function useBoards() {
  const [loading, setLoading] = useState(true)
  const userId = useTaskStore((state) => state.userId)
  const myBoards = useTaskStore((state) => state.myBoards)
  const teamBoards = useTaskStore((state) => state.teamBoards)
  const setMyBoards = useTaskStore((state) => state.setMyBoards)
  const setTeamBoards = useTaskStore((state) => state.setTeamBoards)
  // Keep stable setter refs so fetchBoards useCallback doesn't recreate
  const setMyBoardsRef = useRef(setMyBoards)
  const setTeamBoardsRef = useRef(setTeamBoards)
  setMyBoardsRef.current = setMyBoards
  setTeamBoardsRef.current = setTeamBoards

  const fetchBoards = useCallback(async () => {
    if (!userId) {
      setMyBoardsRef.current([])
      setTeamBoardsRef.current([])
      setLoading(false)
      return
    }

    // If a fetch for this user is already in-flight, reuse the same promise
    // This prevents N concurrent requests when N components mount together
    if (activeFetchPromise && lastFetchedForUserId === userId) {
      setLoading(true)
      try {
        await activeFetchPromise
      } finally {
        setLoading(false)
      }
      return
    }

    setLoading(true)
    lastFetchedForUserId = userId
    activeFetchPromise = doFetchBoards(userId, setMyBoardsRef.current, setTeamBoardsRef.current)
      .catch((error) => {
        console.error("Failed to fetch boards:", error)
        setMyBoardsRef.current([])
        setTeamBoardsRef.current([])
      })
      .finally(() => {
        activeFetchPromise = null
        setLoading(false)
      })

    await activeFetchPromise
  }, [userId]) // stable — setters accessed via refs

  // Only auto-fetch once per userId; individual components must NOT call fetchBoards()
  // manually in their own effects unless they need a forced refresh
  useEffect(() => {
    fetchBoards()
  }, [userId]) // eslint-disable-line react-hooks/exhaustive-deps

  return { myBoards, teamBoards, loading, fetchBoards }
}
