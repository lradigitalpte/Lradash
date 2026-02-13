"use client"

import { useSortable } from "@dnd-kit/sortable"
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import { Plus, MoreHorizontal, GripVertical } from "lucide-react"
import { useState } from "react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"

import { KanbanCard } from "./KanbanCard"

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

interface KanbanListProps {
  list: List
  onCardClick: (card: Card) => void
  onRefresh: () => void
}

export function KanbanList({ list, onCardClick, onRefresh }: KanbanListProps) {
  const [isAddingCard, setIsAddingCard] = useState(false)
  const [newCardTitle, setNewCardTitle] = useState("")
  const [isAdding, setIsAdding] = useState(false)

  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: list._id
  })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1
  }

  const handleAddCard = async () => {
    if (!newCardTitle.trim()) {
      return
    }

    setIsAdding(true)
    try {
      const accessToken = localStorage.getItem("accessToken")
      if (!accessToken) {
        return
      }

      const response = await fetch(`/api/lists/${list._id}/cards`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`
        },
        body: JSON.stringify({ title: newCardTitle })
      })

      if (!response.ok) {
        toast.error("Failed to create card")
        return
      }

      toast.success("Card created!")
      setNewCardTitle("")
      setIsAddingCard(false)
      onRefresh()
    } catch (error) {
      console.error("Failed to create card:", error)
      toast.error("Failed to create card")
    } finally {
      setIsAdding(false)
    }
  }

  return (
    <div ref={setNodeRef} style={style} className="h-full w-80 flex-shrink-0">
      <div className="flex h-full max-h-[calc(100vh-220px)] flex-col rounded-[2rem] border border-white/20 bg-white/60 p-5 shadow-xl shadow-slate-200/50 backdrop-blur-xl transition-all duration-300 hover:border-blue-500/20 hover:shadow-2xl hover:shadow-blue-500/10 dark:border-slate-800/50 dark:bg-slate-900/60 dark:shadow-none">
        {/* List Header */}
        <div className="mb-5 flex shrink-0 items-center justify-between px-1">
          <div className="flex flex-1 items-center gap-3 overflow-hidden">
            <button
              {...attributes}
              {...listeners}
              className="cursor-grab rounded-lg p-1 transition-colors hover:bg-slate-100 active:cursor-grabbing dark:hover:bg-slate-800"
            >
              <GripVertical className="h-4 w-4 text-slate-400" />
            </button>
            <div className="flex min-w-0 flex-col">
              <h3 className="truncate text-xs font-black tracking-[0.15em] text-slate-900 uppercase dark:text-white">
                {list.title}
              </h3>
              <span className="text-[10px] font-bold text-blue-600 dark:text-blue-400">
                {list.cards.length} {list.cards.length === 1 ? "task" : "tasks"}
              </span>
            </div>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="h-8 w-8 rounded-xl p-0 hover:bg-white/80 dark:hover:bg-slate-800/80"
              >
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="end"
              className="rounded-2xl border-slate-200 shadow-xl dark:border-slate-800"
            >
              <DropdownMenuItem className="rounded-xl px-3 py-2 text-xs font-semibold">
                Add card...
              </DropdownMenuItem>
              <DropdownMenuItem className="rounded-xl px-3 py-2 text-xs font-semibold">
                Copy list...
              </DropdownMenuItem>
              <DropdownMenuItem className="rounded-xl px-3 py-2 text-xs font-semibold">
                Move list...
              </DropdownMenuItem>
              <DropdownMenuItem className="rounded-xl px-3 py-2 text-xs font-semibold text-rose-600 dark:text-rose-400">
                Archive list
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Cards */}
        <div className="custom-scrollbar -mr-1 mb-4 flex-1 space-y-3 overflow-y-auto pr-1">
          <SortableContext
            items={list.cards.map((c) => c._id)}
            strategy={verticalListSortingStrategy}
          >
            {list.cards.map((card) => (
              <KanbanCard key={card._id} card={card} onClick={() =>{  onCardClick(card); }} />
            ))}
          </SortableContext>
        </div>

        {/* Add Card */}
        <div className="shrink-0">
          {isAddingCard ? (
            <div className="space-y-3 rounded-2xl border border-slate-200/50 bg-white/50 p-3 dark:border-slate-700/50 dark:bg-slate-800/50">
              <Input
                autoFocus
                placeholder="Task title..."
                value={newCardTitle}
                onChange={(e) =>{  setNewCardTitle(e.target.value); }}
                className="h-auto border-none bg-transparent p-0 text-sm font-medium placeholder:text-slate-400 focus-visible:ring-0"
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    handleAddCard()
                  }
                  if (e.key === "Escape") {
                    setIsAddingCard(false)
                    setNewCardTitle("")
                  }
                }}
                disabled={isAdding}
              />
              <div className="flex gap-2">
                <Button
                  size="sm"
                  className="h-8 rounded-xl bg-blue-600 px-3 text-xs font-black tracking-wider uppercase hover:bg-blue-700"
                  onClick={handleAddCard}
                  disabled={isAdding}
                >
                  Create
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-8 rounded-xl px-3 text-xs font-bold text-slate-500"
                  onClick={() => {
                    setIsAddingCard(false)
                    setNewCardTitle("")
                  }}
                  disabled={isAdding}
                >
                  Cancel
                </Button>
              </div>
            </div>
          ) : (
            <Button
              variant="ghost"
              size="sm"
              className="group/btn h-11 w-full justify-start rounded-2xl text-blue-600 hover:bg-blue-50 dark:text-blue-400 dark:hover:bg-blue-900/20"
              onClick={() =>{  setIsAddingCard(true); }}
            >
              <div className="mr-3 flex h-7 w-7 items-center justify-center rounded-lg bg-blue-100 transition-all group-hover/btn:bg-blue-600 group-hover/btn:text-white dark:bg-blue-900/40">
                <Plus className="h-4 w-4" />
              </div>
              <span className="text-[11px] font-black tracking-[0.1em] uppercase">Add a card</span>
            </Button>
          )}
        </div>
      </div>

      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(148, 163, 184, 0.2);
          border-radius: 10px;
        }
        .dark .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(51, 65, 85, 0.5);
        }
      `}</style>
    </div>
  )
}
