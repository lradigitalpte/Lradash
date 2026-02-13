"use client"

import { Tag, Plus, X } from "lucide-react"
import { useState } from "react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { cn } from "@/lib/utils"

interface Label {
  name: string
  color: string
}

interface CardLabelsProps {
  labels: Label[]
  onAddLabel: (label: Label) => void
  onRemoveLabel: (index: number) => void
}

const LABEL_COLORS = [
  { name: "Green", color: "#61BD4F" },
  { name: "Yellow", color: "#F2D600" },
  { name: "Orange", color: "#FF9F1A" },
  { name: "Red", color: "#EB5A46" },
  { name: "Purple", color: "#C377E0" },
  { name: "Blue", color: "#0079BF" },
  { name: "Sky", color: "#00C2E0" },
  { name: "Lime", color: "#51E898" },
  { name: "Pink", color: "#FF78CB" },
  { name: "Black", color: "#344563" }
]

export function CardLabels({ labels, onAddLabel, onRemoveLabel }: CardLabelsProps) {
  const [newLabelName, setNewLabelName] = useState("")
  const [selectedColor, setSelectedColor] = useState(LABEL_COLORS[0])

  const handleAddLabel = () => {
    if (newLabelName.trim()) {
      onAddLabel({ name: newLabelName, color: selectedColor.color })
      setNewLabelName("")
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-slate-100 dark:bg-slate-800">
            <Tag className="h-4 w-4 stroke-[2.5] text-slate-500 dark:text-slate-400" />
          </div>
          <h3 className="text-[10px] font-black tracking-[0.2em] text-slate-400 uppercase">
            Labels
          </h3>
        </div>
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className="h-8 w-8 rounded-lg p-0 transition-colors hover:bg-blue-50 hover:text-blue-600 dark:hover:bg-blue-900/20 dark:hover:text-blue-400"
            >
              <Plus className="h-4 w-4 stroke-[2.5]" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-80 rounded-[2rem] border-slate-200 bg-white/90 p-6 shadow-2xl backdrop-blur-xl dark:border-slate-800 dark:bg-slate-900/90">
            <div className="space-y-6">
              <h4 className="text-[11px] font-black tracking-widest text-slate-900 uppercase dark:text-white">
                New Label
              </h4>
              <Input
                placeholder="Label name"
                value={newLabelName}
                onChange={(e) =>{  setNewLabelName(e.target.value); }}
                onKeyDown={(e) => e.key === "Enter" && handleAddLabel()}
                className="h-10 rounded-xl border-slate-200 bg-slate-50 text-sm font-medium transition-all focus:ring-2 focus:ring-blue-500/20 dark:border-slate-800 dark:bg-slate-800"
              />
              <div>
                <p className="mb-3 text-[10px] font-black tracking-widest text-slate-400 uppercase">
                  Choice of Palette
                </p>
                <div className="grid grid-cols-5 gap-3">
                  {LABEL_COLORS.map((label) => (
                    <button
                      key={label.color}
                      onClick={() =>{  setSelectedColor(label); }}
                      className={cn(
                        "group relative h-10 rounded-xl transition-all duration-300",
                        selectedColor.color === label.color
                          ? "scale-105 ring-2 ring-blue-500 ring-offset-2"
                          : "hover:scale-110"
                      )}
                      style={{ backgroundColor: label.color }}
                      title={label.name}
                    >
                      <div className="absolute inset-0 rounded-xl bg-white opacity-0 transition-opacity group-hover:opacity-10" />
                    </button>
                  ))}
                </div>
              </div>
              <Button
                onClick={handleAddLabel}
                className="h-10 w-full rounded-xl bg-blue-600 text-[10px] font-bold tracking-widest uppercase shadow-lg shadow-blue-500/20 hover:bg-blue-700"
              >
                Create Label
              </Button>
            </div>
          </PopoverContent>
        </Popover>
      </div>
      <div className="flex flex-wrap gap-2 px-1">
        {labels.map((label, index) => (
          <div
            key={index}
            style={{
              backgroundColor: `${label.color}20`,
              color: label.color,
              borderColor: `${label.color}40`
            }}
            className="group flex items-center gap-3 rounded-xl border px-3 py-1.5 text-[11px] font-black tracking-wider uppercase transition-all hover:scale-[1.05]"
          >
            <div className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: label.color }} />
            {label.name}
            <button
              onClick={() =>{  onRemoveLabel(index); }}
              className="ml-1 rounded-lg p-0.5 opacity-0 transition-all group-hover:opacity-100 hover:bg-black/5 dark:hover:bg-white/5"
            >
              <X className="h-3 w-3 stroke-[3]" />
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}
