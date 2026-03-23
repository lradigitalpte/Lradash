"use client"

import { AlignLeft } from "lucide-react"
import { useState } from "react"

import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { cn } from "@/lib/utils"

interface CardDescriptionProps {
  description: string
  onUpdateDescription: (description: string) => void
}

export function CardDescription({ description, onUpdateDescription }: CardDescriptionProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [editedDescription, setEditedDescription] = useState(description)

  const handleSave = () => {
    onUpdateDescription(editedDescription)
    setIsEditing(false)
  }

  const handleCancel = () => {
    setEditedDescription(description)
    setIsEditing(false)
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-slate-100 dark:bg-slate-800">
          <AlignLeft className="h-4 w-4 stroke-[2.5] text-slate-500 dark:text-slate-400" />
        </div>
        <h3 className="text-[10px] font-black tracking-[0.2em] text-slate-400 uppercase">
          Description
        </h3>
      </div>

      {isEditing ? (
        <div className="space-y-4">
          <Textarea
            value={editedDescription}
            onChange={(e) => {
              setEditedDescription(e.target.value)
            }}
            placeholder="Add a more detailed description..."
            rows={6}
            className="resize-none rounded-2xl border-slate-200 bg-white p-4 text-sm font-medium transition-all focus:ring-2 focus:ring-blue-500/20 dark:border-slate-700 dark:bg-slate-800/50"
          />
          <div className="flex gap-2">
            <Button
              onClick={handleSave}
              size="sm"
              className="h-9 rounded-xl bg-blue-600 px-6 text-[10px] font-bold tracking-widest uppercase transition-all hover:scale-[1.05] hover:bg-blue-700 active:scale-[0.95]"
            >
              Save changes
            </Button>
            <Button
              onClick={handleCancel}
              variant="ghost"
              size="sm"
              className="h-9 rounded-xl text-[10px] font-bold tracking-widest text-slate-400 uppercase transition-all hover:text-slate-600 dark:hover:text-slate-200"
            >
              Cancel
            </Button>
          </div>
        </div>
      ) : (
        <div
          onClick={() => {
            setIsEditing(true)
          }}
          className={cn(
            "group min-h-[120px] cursor-pointer rounded-[1.5rem] border border-transparent p-6 transition-all duration-300",
            description
              ? "bg-white/50 hover:border-blue-500/20 hover:bg-white hover:shadow-xl hover:shadow-slate-200/50 dark:bg-slate-800/30 dark:hover:bg-slate-800 dark:hover:shadow-none"
              : "border-dashed border-slate-300 bg-slate-100/50 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800/50 dark:hover:bg-slate-800/80"
          )}
        >
          {description ? (
            <p className="text-sm leading-relaxed font-medium whitespace-pre-wrap text-slate-600 dark:text-slate-300">
              {description}
            </p>
          ) : (
            <div className="flex h-full flex-col items-center justify-center py-4 text-slate-400">
              <p className="text-[11px] font-black tracking-widest uppercase opacity-60 transition-opacity group-hover:opacity-100">
                Add detailed description...
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
