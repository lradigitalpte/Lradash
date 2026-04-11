"use client"

import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  PointerSensor,
  useSensor,
  useSensors
} from "@dnd-kit/core"
import { SortableContext, horizontalListSortingStrategy } from "@dnd-kit/sortable"
import { ArrowLeft, Plus, Settings, Trash2 } from "lucide-react"
import Link from "next/link"
import { useParams, useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { toast } from "sonner"

import { AddListForm } from "@/components/kanban/AddListForm"
import { CardDetailModal } from "@/components/kanban/CardDetailModal"
import { KanbanCard } from "@/components/kanban/KanbanCard"
import { KanbanList } from "@/components/kanban/KanbanList"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle
} from "@/components/ui/alert-dialog"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu"
import { apiClient } from "@/lib/api/client"

interface Card {
  _id: string
  title: string
  description?: string
  listId: string
  position: number
  labels?: Array<{ name: string; color: string }>
  members?: Array<{ _id: string; name: string; avatar?: string }>
  dueDate?: string
  priority?: "LOW" | "MEDIUM" | "HIGH" | "URGENT"
  checklist?: Array<{ text: string; completed: boolean }>
  attachments?: Array<{ name: string; url: string }>
  coverColor?: string
}

interface List {
  _id: string
  title: string
  position: number
  cards: Card[]
}

interface Board {
  _id: string
  title: string
  description?: string
  canManage?: boolean
  lists: List[]
}

export default function KanbanBoardPage() {
  const params = useParams()
  const router = useRouter()
  const boardId = params?.boardId as string
  const projectId = params?.projectId as string
  const locale = params?.locale as string

  const [board, setBoard] = useState<Board | null>(null)
  const [loading, setLoading] = useState(true)
  const [activeCard, setActiveCard] = useState<Card | null>(null)
  const [selectedCard, setSelectedCard] = useState<Card | null>(null)
  const [showAddList, setShowAddList] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [deletingBoard, setDeletingBoard] = useState(false)

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8
      }
    })
  )

  useEffect(() => {
    loadBoard()
  }, [boardId])

  const loadBoard = async (silent = false) => {
    try {
      if (!silent) {
        setLoading(true)
      }
      const accessToken = localStorage.getItem("accessToken")
      if (!accessToken) {
        toast.error("You must be logged in")
        return
      }

      const response = await fetch(`/api/boards/${boardId}`, {
        headers: {
          Authorization: `Bearer ${accessToken}`
        }
      })

      if (!response.ok) {
        throw new Error("Failed to fetch board")
      }

      const data = await response.json()
      setBoard(data)

      // Sync selected card with updated board data
      if (selectedCard) {
        for (const list of data.lists) {
          const found = list.cards.find((c: Card) => c._id === selectedCard._id)
          if (found) {
            setSelectedCard(found)
            break
          }
        }
      }
    } catch (error) {
      console.error("Failed to load board:", error)
      toast.error("Failed to load board")
    } finally {
      setLoading(false)
    }
  }

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event
    const card = findCard(active.id as string)
    setActiveCard(card)
  }

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event
    setActiveCard(null)

    if (!over) {
      return
    }

    const cardId = active.id as string
    const overId = over.id as string

    if (cardId === overId) {
      return
    }

    await moveCard(cardId, overId)
  }

  const findCard = (cardId: string): Card | null => {
    if (!board) {
      return null
    }
    for (const list of board.lists) {
      const card = list.cards.find((c) => c._id === cardId)
      if (card) {
        return card
      }
    }
    return null
  }

  const moveCard = async (cardId: string, overId: string) => {
    if (!board) {
      return
    }

    let sourceList: List | null = null
    let targetList: List | null = null
    let activeCard: Card | null = null

    // Find source list and card
    for (const list of board.lists) {
      const card = list.cards.find((c) => c._id === cardId)
      if (card) {
        sourceList = list
        activeCard = card
        break
      }
    }

    if (!sourceList || !activeCard) {
      return
    }

    // Find target list and index
    let newIndex = 0
    targetList = board.lists.find((l) => l._id === overId) || null

    if (!targetList) {
      // Over a card
      for (const list of board.lists) {
        const cardIndex = list.cards.findIndex((c) => c._id === overId)
        if (cardIndex !== -1) {
          targetList = list
          newIndex = cardIndex
          break
        }
      }
    } else {
      // Over a list, add to the end
      newIndex = targetList.cards.length
    }

    if (!targetList) {
      return
    }

    // Optimistic Update
    const oldBoard = JSON.parse(JSON.stringify(board))
    const newBoard = JSON.parse(JSON.stringify(board))

    // Remove from source list
    const sList = newBoard.lists.find((l: List) => l._id === sourceList._id)
    if (!sList) {
      return
    }

    // Filter out the card to ensure no duplicates in source
    const cardToMove = { ...activeCard, listId: targetList._id }
    sList.cards = sList.cards.filter((c: Card) => c._id !== cardId)

    // Add to target list
    const tList = newBoard.lists.find((l: List) => l._id === targetList._id)
    if (!tList) {
      return
    }

    // Ensure we don't duplicate if moving to same list (already removed above)
    // or if for some reason it's already there (though filter removed it from source)

    // If we're moving within the same list, we need to be careful with indices
    // but since we removed it first, the new index should be relative to the list without the card

    tList.cards.splice(newIndex, 0, cardToMove)

    setBoard(newBoard)

    try {
      const accessToken = localStorage.getItem("accessToken")
      const response = await fetch(`/api/boards/${boardId}/tasks/move`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`
        },
        body: JSON.stringify({
          taskId: cardId,
          sourceListId: sourceList._id,
          targetListId: targetList._id,
          newPosition: newIndex
        })
      })

      if (!response.ok) {
        throw new Error("Failed to move card")
      }

      toast.success("Card moved!")
    } catch (error) {
      console.error("Move card error:", error)
      toast.error("Failed to move card")
      setBoard(oldBoard) // Rollback
    }
  }

  const handleAddList = async (title: string) => {
    try {
      const accessToken = localStorage.getItem("accessToken")
      const response = await fetch(`/api/boards/${boardId}/lists`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`
        },
        body: JSON.stringify({ title, projectId })
      })

      if (!response.ok) {
        throw new Error("Failed to create list")
      }

      toast.success(`List "${title}" created!`)
      setShowAddList(false)
      loadBoard()
    } catch (error) {
      console.error("Add list error:", error)
      toast.error("Failed to create list")
    }
  }

  const handleDeleteBoard = async () => {
    try {
      setDeletingBoard(true)
      const response = await apiClient.delete(`/api/boards/${boardId}`)

      if (!response.ok) {
        const data = await response.json().catch(() => null)
        throw new Error(data?.error || "Failed to delete board")
      }

      toast.success("Board deleted")
      router.push(`/${locale}/projects/${projectId}/board`)
      router.refresh()
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to delete board"
      toast.error(message)
    } finally {
      setDeletingBoard(false)
      setShowDeleteDialog(false)
    }
  }

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-linear-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
        <div className="text-center">
          <div className="mx-auto h-12 w-12 animate-spin rounded-full border-b-2 border-primary" />
          <p className="mt-4 text-muted-foreground">Loading your beautiful board...</p>
        </div>
      </div>
    )
  }

  if (!board) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center">
          <p className="text-xl font-semibold">Board not found</p>
          <Link href={`/${locale}/projects/${projectId}/board`}>
            <Button className="mt-4" variant="outline">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Boards
            </Button>
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-[#f8fafc] transition-all duration-500 dark:bg-slate-950">
      {/* WOW Header */}
      <div className="flex shrink-0 flex-col justify-between gap-6 border-b border-slate-200/50 bg-white/70 px-8 py-6 backdrop-blur-2xl md:flex-row md:items-center dark:border-slate-800/50 dark:bg-slate-900/70">
        <div className="flex items-center gap-5">
          {/* 3D/High-contrast Icon Container */}
          <div className="flex h-14 w-14 transform items-center justify-center rounded-3xl bg-linear-to-br from-blue-600 to-indigo-700 shadow-xl shadow-blue-500/20 transition-transform duration-300 hover:rotate-6">
            <Settings className="h-7 w-7 stroke-[2.5] text-white" />
          </div>

          <div className="space-y-0.5">
            {/* Micro Label Context Badge */}
            <div className="flex items-center gap-2">
              <span className="rounded-full bg-blue-50 px-3 py-1 text-[10px] font-black tracking-[0.2em] text-blue-600 uppercase dark:bg-blue-900/30 dark:text-blue-400">
                Workflow Board
              </span>
            </div>
            <h1 className="text-3xl font-black tracking-tighter text-slate-900 dark:text-white">
              {board.title}
            </h1>
            <p className="max-w-md truncate text-sm font-medium text-slate-500 italic dark:text-slate-400">
              {board.description}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Link href={`/${locale}/projects/${projectId}/board`}>
            <Button
              variant="outline"
              className="h-10 rounded-xl border-slate-200 px-4 transition-all hover:bg-slate-50 dark:border-slate-800 dark:hover:bg-slate-800"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back
            </Button>
          </Link>
          {board.canManage && (
            <DropdownMenu modal={false}>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="outline"
                  className="h-10 rounded-xl border-slate-200 px-4 shadow-sm dark:border-slate-800"
                >
                  <Settings className="mr-2 h-4 w-4" />
                  Settings
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem asChild>
                  <Link href={`/${locale}/boards/${boardId}/settings`}>Board settings</Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  className="text-red-600 focus:text-red-600"
                  onSelect={() => {
                    setShowDeleteDialog(true)
                  }}
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete this board
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
          <Button
            className="h-10 rounded-xl bg-blue-600 px-4 shadow-lg shadow-blue-500/25 transition-all hover:-translate-y-0.5 hover:bg-blue-700"
            onClick={() => {
              setShowAddList(true)
            }}
          >
            <Plus className="mr-2 h-4 w-4" />
            New List
          </Button>
        </div>
      </div>

      {/* Board Content */}
      <div className="flex-1 overflow-x-auto overflow-y-hidden p-8">
        <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
          <div className="flex h-full items-start gap-6">
            <SortableContext
              items={board.lists.map((l) => l._id)}
              strategy={horizontalListSortingStrategy}
            >
              {board.lists.map((list) => (
                <KanbanList
                  key={list._id}
                  list={list}
                  onCardClick={(card) => {
                    setSelectedCard(card)
                  }}
                  onRefresh={loadBoard}
                />
              ))}
            </SortableContext>

            {/* Add List Button */}
            {showAddList ? (
              <AddListForm
                onAdd={handleAddList}
                onCancel={() => {
                  setShowAddList(false)
                }}
              />
            ) : (
              <button
                onClick={() => {
                  setShowAddList(true)
                }}
                className="group relative h-32 w-80 shrink-0 rounded-4xl border-2 border-dashed border-slate-200 bg-white/40 backdrop-blur transition-all duration-300 hover:border-blue-500/50 hover:bg-white/60 dark:border-slate-800 dark:bg-slate-900/40 dark:hover:bg-slate-900/60"
              >
                <div className="flex h-full flex-col items-center justify-center gap-2 p-6">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 transition-all duration-300 group-hover:bg-blue-600 group-hover:text-white dark:bg-slate-800">
                    <Plus className="h-5 w-5" />
                  </div>
                  <span className="text-[11px] font-black tracking-[0.2em] text-slate-400 uppercase transition-colors group-hover:text-blue-600">
                    Add Another List
                  </span>
                </div>
              </button>
            )}
          </div>

          <DragOverlay>
            {activeCard ? (
              <div className="scale-105 rotate-3 opacity-90 transition-transform duration-200">
                <KanbanCard card={activeCard} onClick={() => {}} isDragging />
              </div>
            ) : null}
          </DragOverlay>
        </DndContext>
      </div>

      {/* Card Detail Modal */}
      {selectedCard && (
        <CardDetailModal
          card={selectedCard}
          boardId={boardId}
          projectId={projectId}
          onClose={() => {
            setSelectedCard(null)
          }}
          onUpdate={async () => loadBoard(true)}
        />
      )}

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete board</AlertDialogTitle>
            <AlertDialogDescription>
              {`Delete "${board.title}" from this project? This also removes its lists and board tasks.`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deletingBoard}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-600 hover:bg-red-700"
              disabled={deletingBoard}
              onClick={(event) => {
                event.preventDefault()
                void handleDeleteBoard()
              }}
            >
              {deletingBoard ? "Deleting..." : "Delete board"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
