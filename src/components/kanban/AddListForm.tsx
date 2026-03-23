"use client"

import { X } from "lucide-react"
import { useState } from "react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

interface AddListFormProps {
  onAdd: (title: string) => void
  onCancel: () => void
}

export function AddListForm({ onAdd, onCancel }: AddListFormProps) {
  const [title, setTitle] = useState("")

  const handleSubmit = () => {
    if (title.trim()) {
      onAdd(title)
      setTitle("")
    }
  }

  return (
    <div className="h-fit w-80 flex-shrink-0 rounded-[2rem] border border-white/20 bg-white/60 p-5 shadow-xl backdrop-blur-xl transition-all duration-300 dark:border-slate-800/50 dark:bg-slate-900/60">
      <h4 className="mb-4 px-1 text-[10px] font-black tracking-[0.2em] text-slate-400 uppercase">
        New Relationship
      </h4>
      <Input
        placeholder="List title..."
        value={title}
        onChange={(e) => {
          setTitle(e.target.value)
        }}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            handleSubmit()
          }
          if (e.key === "Escape") {
            onCancel()
          }
        }}
        className="mb-4 h-10 rounded-xl border-slate-200 bg-white/50 text-sm font-medium transition-all focus:ring-2 focus:ring-blue-500/20 dark:border-slate-700 dark:bg-slate-800/50"
      />
      <div className="flex gap-2">
        <Button
          size="sm"
          className="h-9 rounded-xl bg-blue-600 px-4 text-[11px] font-black tracking-wider uppercase shadow-lg shadow-blue-500/20 hover:bg-blue-700"
          onClick={handleSubmit}
        >
          Create List
        </Button>
        <Button
          size="sm"
          variant="ghost"
          className="h-9 w-9 rounded-xl p-0 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
          onClick={onCancel}
        >
          <X className="h-4 w-4" />
        </Button>
      </div>
    </div>
  )
}
