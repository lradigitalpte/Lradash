"use client"

import { Boxes, Search, Check, X } from "lucide-react"
import { useEffect, useState } from "react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { cn } from "@/lib/utils"

interface WorkPackage {
  _id: string
  title: string
  status: string
}

interface WorkPackagePickerProps {
  boardId: string
  projectId: string
  currentWorkPackageId?: string
  onSelect: (wpId: string | null) => void
}

export function WorkPackagePicker({
  boardId,
  projectId,
  currentWorkPackageId,
  onSelect
}: WorkPackagePickerProps) {
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState("")
  const [workPackages, setWorkPackages] = useState<WorkPackage[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (open) {
      fetchWorkPackages()
    }
  }, [open])

  const fetchWorkPackages = async () => {
    setLoading(true)
    try {
      const accessToken = localStorage.getItem("accessToken")
      const response = await fetch(`/api/workpackages?boardId=${boardId}&projectId=${projectId}`, {
        headers: {
          Authorization: `Bearer ${accessToken}`
        }
      })
      if (response.ok) {
        const data = await response.json()
        setWorkPackages(data.workPackages || [])
      }
    } catch (error) {
      console.error("Failed to fetch work packages:", error)
    } finally {
      setLoading(false)
    }
  }

  const filtered = workPackages.filter((wp) =>
    wp.title.toLowerCase().includes(search.toLowerCase())
  )

  const selectedWP = workPackages.find((wp) => wp._id === currentWorkPackageId)

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="h-10 w-full justify-start rounded-xl border-slate-200 text-[11px] font-black tracking-wider uppercase transition-all hover:scale-[1.02] hover:border-blue-500/30 hover:bg-slate-50 active:scale-[0.98] dark:border-slate-800 dark:hover:bg-slate-800"
        >
          <Boxes className="mr-3 h-4 w-4 stroke-[2.5]" />
          {selectedWP ? selectedWP.title : "Work Package"}
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className="w-80 rounded-2xl p-0 shadow-2xl dark:border-slate-800"
        align="start"
      >
        <div className="flex items-center border-b border-slate-100 p-3 dark:border-slate-800">
          <Search className="mr-2 h-4 w-4 text-slate-400" />
          <Input
            placeholder="Search work packages..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value)
            }}
            className="h-8 border-none bg-transparent p-0 text-xs shadow-none focus-visible:ring-0"
          />
        </div>
        <div className="max-h-64 overflow-y-auto p-2">
          {loading ? (
            <div className="py-8 text-center text-xs text-slate-400">Loading...</div>
          ) : filtered.length === 0 ? (
            <div className="py-8 text-center text-xs text-slate-400">No work packages found</div>
          ) : (
            <div className="space-y-1">
              <button
                className="flex w-full items-center justify-between rounded-xl p-2 text-left transition-colors hover:bg-slate-50 dark:hover:bg-slate-800"
                onClick={() => {
                  onSelect(null)
                  setOpen(false)
                }}
              >
                <span className="text-xs font-medium text-slate-500 italic">None</span>
                {!currentWorkPackageId && <Check className="h-3 w-3 text-blue-600" />}
              </button>
              {filtered.map((wp) => (
                <button
                  key={wp._id}
                  className="flex w-full items-center justify-between rounded-xl p-2 text-left transition-colors hover:bg-slate-50 dark:hover:bg-slate-800"
                  onClick={() => {
                    onSelect(wp._id)
                    setOpen(false)
                  }}
                >
                  <div className="flex flex-col">
                    <span className="text-xs font-bold text-slate-900 dark:text-white">
                      {wp.title}
                    </span>
                    <span className="text-[10px] tracking-tighter text-slate-400 uppercase">
                      {wp.status}
                    </span>
                  </div>
                  {currentWorkPackageId === wp._id && <Check className="h-3 w-3 text-blue-600" />}
                </button>
              ))}
            </div>
          )}
        </div>
      </PopoverContent>
    </Popover>
  )
}
