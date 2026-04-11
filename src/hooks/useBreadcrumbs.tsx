"use client"

import { useTranslations } from "next-intl"
import { useParams } from "next/navigation"
import { useEffect, useState } from "react"

import { ROUTES } from "@/constants/routes"
import { usePathname } from "@/i18n/navigation"
import { fetchBoardsFromDb } from "@/lib/db/board"
import { useTaskStore } from "@/lib/store"
import { Board } from "@/types/dbInterface"

interface BreadcrumbItem {
  title: string
  link: string
  isRoot?: boolean
}

const SECTION_ROOT: Record<string, { title: string; link: string }> = {
  dashboard: { title: "Dashboard", link: "/dashboard" },
  boards: { title: "Boards", link: ROUTES.BOARDS.ROOT },
  projects: { title: "Projects", link: "/projects" },
  tasks: { title: "Tasks", link: "/tasks" },
  calendar: { title: "Calendar", link: "/calendar" },
  reports: { title: "Reports", link: "/reports" },
  minutes: { title: "Minutes", link: "/minutes" },
  monitor: { title: "Monitor", link: "/monitor" },
  analytics: { title: "Analytics", link: "/analytics" },
  team: { title: "Team", link: "/team" },
  admin: { title: "Admin", link: "/admin" },
  settings: { title: "Settings", link: "/settings" },
  notifications: { title: "Notifications", link: "/notifications" },
  client: { title: "Client portal", link: "/client" }
}

export function useBreadcrumbs() {
  const params = useParams()
  const pathname = usePathname()
  const t = useTranslations("sidebar")
  const boardId = params.boardId as string
  const [board, setBoard] = useState<Board | null>(null)
  const userEmail = useTaskStore((state) => state.userEmail)

  useEffect(() => {
    async function fetchBoard() {
      if (!boardId || !userEmail) {
        return
      }
      try {
        const boards = await fetchBoardsFromDb(userEmail)
        const currentBoard = boards.find((b) => b._id === boardId)
        if (currentBoard) {
          setBoard(currentBoard)
        }
      } catch (error) {
        console.error("Failed to fetch board:", error)
      }
    }

    if (boardId) {
      fetchBoard().catch(console.error)
    }
  }, [boardId, userEmail])

  const pathParts = pathname.split("/").filter(Boolean)
  const topSegment = pathParts[0] ?? "dashboard"
  const root = SECTION_ROOT[topSegment] ?? {
    title: t("overview"),
    link: ROUTES.BOARDS.ROOT
  }

  const items: BreadcrumbItem[] = [
    {
      title: root.title,
      link: root.link,
      isRoot: true
    }
  ]

  if (board) {
    items.push({
      title: board.title,
      link: `/boards/${board._id}`
    })
  }

  return {
    items,
    rootLink: root.link
  }
}
