"use client"

import { CheckSquare, Plus, Trash2 } from "lucide-react"
import { useState } from "react"

import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"

interface ChecklistItem {
  text: string
  completed: boolean
}

interface CardChecklistProps {
  items: ChecklistItem[]
  onToggleItem: (index: number) => void
  onAddItem: (text: string) => void
  onDeleteItem: (index: number) => void
}

export function CardChecklist({
  items,
  onToggleItem,
  onAddItem,
  onDeleteItem
}: CardChecklistProps) {
  const [isAdding, setIsAdding] = useState(false)
  const [newItemText, setNewItemText] = useState("")

  const completedCount = items.filter((item) => item.completed).length
  const totalCount = items.length
  const progress = totalCount > 0 ? (completedCount / totalCount) * 100 : 0

  const handleAddItem = () => {
    if (newItemText.trim()) {
      onAddItem(newItemText)
      setNewItemText("")
      setIsAdding(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-slate-100 dark:bg-slate-800">
            <CheckSquare className="h-4 w-4 stroke-[2.5] text-blue-600 dark:text-blue-400" />
          </div>
          <h3 className="text-[10px] font-black tracking-[0.2em] text-slate-400 uppercase">
            Checklist
          </h3>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-[11px] font-black text-slate-400 tabular-nums">
            {Math.round(progress)}% Complete
          </span>
          <Button
            variant="ghost"
            size="sm"
            className="h-8 w-8 rounded-lg p-0 transition-colors hover:bg-blue-50 hover:text-blue-600 dark:hover:bg-blue-900/20 dark:hover:text-blue-400"
            onClick={() => {
              setIsAdding(true)
            }}
          >
            <Plus className="h-4 w-4 stroke-[2.5]" />
          </Button>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="relative h-2 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
        <div
          className="absolute inset-y-0 left-0 rounded-full bg-gradient-to-r from-blue-600 to-indigo-600 shadow-[0_0_12px_rgba(37,99,235,0.4)] transition-all duration-700 ease-out"
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* Checklist Items */}
      <div className="space-y-1">
        {items.map((item, index) => (
          <div
            key={index}
            className="group flex items-center gap-4 rounded-2xl border border-transparent p-3 transition-all hover:border-slate-100 hover:bg-slate-50 dark:hover:border-slate-800 dark:hover:bg-slate-800/50"
          >
            <Checkbox
              checked={item.completed}
              onCheckedChange={() => {
                onToggleItem(index)
              }}
              className="h-5 w-5 rounded-lg border-2 border-slate-300 transition-all duration-300 data-[state=checked]:border-blue-600 data-[state=checked]:bg-blue-600 dark:border-slate-700"
            />
            <span
              className={cn(
                "flex-1 text-[13px] font-medium transition-all duration-300",
                item.completed
                  ? "text-slate-400 line-through opacity-60"
                  : "text-slate-700 dark:text-slate-200"
              )}
            >
              {item.text}
            </span>
            <Button
              variant="ghost"
              size="sm"
              className="h-8 w-8 rounded-lg p-0 opacity-0 transition-all group-hover:opacity-100 hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-900/20 dark:hover:text-rose-400"
              onClick={() => {
                onDeleteItem(index)
              }}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        ))}
      </div>

      {/* Add Item Form */}
      {isAdding ? (
        <div className="mt-4 animate-in space-y-4 rounded-[1.5rem] border border-slate-200/50 bg-slate-50 p-4 fade-in slide-in-from-top-2 dark:border-slate-700/50 dark:bg-slate-800/50">
          <Input
            placeholder="Add a new task..."
            value={newItemText}
            onChange={(e) => {
              setNewItemText(e.target.value)
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                handleAddItem()
              }
              if (e.key === "Escape") {
                setNewItemText("")
                setIsAdding(false)
              }
            }}
            className="h-10 rounded-xl border-slate-200 bg-white text-sm font-medium transition-all focus:ring-2 focus:ring-blue-500/20 dark:border-slate-700 dark:bg-slate-800"
          />
          <div className="flex gap-2">
            <Button
              onClick={handleAddItem}
              size="sm"
              className="h-9 rounded-xl bg-blue-600 px-6 text-[10px] font-bold tracking-widest uppercase hover:bg-blue-700"
            >
              Add Task
            </Button>
            <Button
              onClick={() => {
                setNewItemText("")
                setIsAdding(false)
              }}
              variant="ghost"
              size="sm"
              className="h-9 rounded-xl text-[10px] font-bold tracking-widest text-slate-400 uppercase transition-all hover:text-slate-600"
            >
              Cancel
            </Button>
          </div>
        </div>
      ) : (
        <Button
          variant="ghost"
          className="group h-10 w-full justify-start rounded-xl text-[11px] font-black tracking-widest text-slate-400 uppercase hover:bg-blue-50 hover:text-blue-600 dark:hover:bg-blue-900/20 dark:hover:text-blue-400"
          onClick={() => {
            setIsAdding(true)
          }}
        >
          <Plus className="mr-3 h-4 w-4 stroke-[2.5] transition-transform group-hover:scale-110" />
          Add an item
        </Button>
      )}
    </div>
  )
}
