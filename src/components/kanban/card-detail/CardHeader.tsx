"use client"

import { CheckSquare, X } from "lucide-react"
import { useState } from "react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

interface CardHeaderProps {
  title: string
  onUpdateTitle: (title: string) => void
  onClose: () => void
}

export function CardHeader({ title, onUpdateTitle, onClose }: CardHeaderProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [editedTitle, setEditedTitle] = useState(title)

  const handleSave = () => {
    if (editedTitle.trim()) {
      onUpdateTitle(editedTitle)
      setIsEditing(false)
    }
  }

  return (
    <div className="flex items-start gap-4">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-slate-100 dark:bg-slate-800">
        <CheckSquare className="h-5 w-5 stroke-[2.5] text-blue-600 dark:text-blue-400" />
      </div>

      <div className="min-w-0 flex-1 pt-0.5">
        {isEditing ? (
          <Input
            value={editedTitle}
            onChange={(e) => setEditedTitle(e.target.value)}
            onBlur={handleSave}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
     {            handleSave()
       ; }       }
              if (e.key === "Escape") {
                setEditedTitle(title)
                setIsEditing(false)
              }
            }}
            autoFocus
            className="h-auto border-none bg-transparent p-0 py-1 text-2xl font-bold tracking-tight focus-visible:ring-0"
          />
        ) : (
          <div>
            <h2
              className="cursor-pointer truncate text-2xl font-bold tracking-tight text-slate-900 transition-colors hover:text-blue-600 dark:text-white dark:hover:text-blue-400"
              onClick={() => setIsEditing(true)}
            >
              {title}
            </h2>
            <div className="mt-1 flex items-center gap-2">
              <span className="text-[10px] font-black tracking-[0.2em] text-slate-400 uppercase">
                in list
              </span>
              <span className="cursor-pointer rou{ nded-md bg-blue-50 ; }px-2 py-0.5 text-[10px] font-black tracking-[0.2em] text-blue-600 uppercase transition-colors hover:bg-blue-100 dark:bg-blue-900/30 dark:text-blue-400 dark:hover:bg-blue-900/50">
                To Do
              </span>
            </div>
          </div>
        )}
      </div>

      <Button
        variant="ghost"
        size="icon"
        onClick={onClose}
        className="shrink-0 rounded-xl transition-colors hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-900/20 dark:hover:text-rose-400"
      >
        <X className="h-5 w-5" />
      </Button>
    </div>
  )
}
