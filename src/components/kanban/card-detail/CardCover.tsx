"use client"

import { Palette } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"

interface CardCoverProps {
  color: string
  onChangeColor: (color: string) => void
}

const COVER_COLORS = [
  "#0079BF", // Blue
  "#61BD4F", // Green
  "#F2D600", // Yellow
  "#FF9F1A", // Orange
  "#EB5A46", // Red
  "#C377E0", // Purple
  "#00C2E0", // Sky
  "#51E898", // Lime
  "#FF78CB", // Pink
  "#344563" // Black
]

export function CardCover({ color, onChangeColor }: CardCoverProps) {
  return (
    <div className="group relative overflow-hidden rounded-t-[2.5rem]">
      <div
        className="h-40 w-full bg-gradient-to-br transition-all duration-700"
        style={{
          backgroundColor: color,
          backgroundImage: `linear-gradient(to bottom right, ${color}CC, ${color})`
        }}
      >
        <div className="absolute inset-0 bg-black/5 dark:bg-black/20" />
      </div>

      <Popover>
        <PopoverTrigger asChild>
          <Button
            variant="secondary"
            size="sm"
            className="absolute right-6 bottom-4 h-9 rounded-xl border border-white/20 bg-white/20 px-4 text-[10px] font-black tracking-widest text-white uppercase opacity-0 shadow-lg backdrop-blur-md transition-all duration-300 group-hover:opacity-100 hover:scale-105 hover:bg-white/40 active:scale-95"
          >
            <Palette className="mr-2 h-3.5 w-3.5 stroke-[2.5]" />
            Theme Cover
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-80 rounded-[2rem] border-slate-200 bg-white/90 p-6 shadow-2xl backdrop-blur-xl dark:border-slate-800 dark:bg-slate-900/90">
          <div className="space-y-6">
            <h4 className="px-1 text-[11px] font-black tracking-widest text-slate-900 uppercase dark:text-white">
              Atmosphere
            </h4>
            <div className="grid grid-cols-5 gap-3">
              {COVER_COLORS.map((c) => (
                <button
                  key={c}
                  onClick={() =>{  onChangeColor(c); }}
                  className="group/btn relative h-10 w-full rounded-xl transition-all duration-300 hover:scale-110"
                  style={{ backgroundColor: c }}
                  title={c}
                >
                  <div className="absolute inset-0 rounded-xl bg-white opacity-0 transition-opacity group-hover/btn:opacity-10" />
                </button>
              ))}
            </div>
          </div>
        </PopoverContent>
      </Popover>

      {/* Premium Overlay Gradient */}
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-60" />
    </div>
  )
}
