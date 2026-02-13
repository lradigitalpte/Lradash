"use client"

import { Calendar as CalendarIcon, Clock, AlignLeft, Users, Zap, X } from "lucide-react"
import { useState } from "react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { apiClient } from "@/lib/api/client"
import { EventType } from "@/types/dbInterface"

interface CreateEventModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
}

export function CreateEventModal({ open, onOpenChange, onSuccess }: CreateEventModalProps) {
  const [loading, setLoading] = useState(false)
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [date, setDate] = useState(new Date().toISOString().split("T")[0])
  const [startTime, setStartTime] = useState("09:00")
  const [endTime, setEndTime] = useState("10:00")
  const [type, setType] = useState<EventType>(EventType.SYNC)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      setLoading(true)
      const start = new Date(`${date}T${startTime}`)
      const end = new Date(`${date}T${endTime}`)

      const response = await apiClient.post("/api/events", {
        title,
        description,
        startTime: start,
        endTime: end,
        type,
        isAllDay: false
      })

      if (response.ok) {
        toast.success("Agenda Item established")
        onSuccess()
        onOpenChange(false)
        // Reset form
        setTitle("")
        setDescription("")
      } else {
        toast.error("Failed to register agenda item")
      }
    } catch (error) {
      toast.error("Cloud synchronization failure")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="overflow-hidden rounded-[2.5rem] border-white/20 bg-white/90 p-0 shadow-2xl backdrop-blur-2xl sm:max-w-[600px] dark:border-slate-800/50 dark:bg-slate-900/90">
        <form onSubmit={handleSubmit} className="relative">
          {/* Decorative Header */}
          <div className="relative flex h-32 items-center bg-gradient-to-br from-blue-600 to-indigo-700 px-10">
            <div className="absolute top-0 right-0 -mt-16 -mr-16 h-32 w-32 rounded-full bg-white/10 blur-3xl" />
            <div className="relative z-10 flex items-center gap-4 text-white">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/20 backdrop-blur-md">
                <CalendarIcon className="h-6 w-6 stroke-[2.5]" />
              </div>
              <div>
                <h2 className="text-2xl font-black tracking-tight uppercase">
                  Create Calendar Event
                </h2>
                <p className="text-[10px] font-black tracking-[0.2em] uppercase opacity-70">
                  Schedule Management
                </p>
              </div>
            </div>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={() =>{  onOpenChange(false); }}
              className="absolute top-6 right-6 rounded-xl text-white/50 hover:bg-white/10 hover:text-white"
            >
              <X className="h-5 w-5" />
            </Button>
          </div>

          <div className="space-y-8 p-10">
            <div className="space-y-4">
              <div className="flex items-center justify-between px-1">
                <div className="flex items-center gap-3">
                  <AlignLeft className="h-4 w-4 text-slate-400" />
                  <span className="text-[10px] font-black tracking-[0.2em] text-slate-400 uppercase">
                    Event Details
                  </span>
                </div>
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="h-7 rounded-full border-amber-200 px-3 text-[9px] font-black tracking-widest text-amber-600 uppercase hover:bg-amber-50"
                    onClick={() => {
                      setTitle("Lunch Break")
                      setType(EventType.BLOCKED)
                      setStartTime("12:00")
                      setEndTime("13:00")
                    }}
                  >
                    Lunch Break
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="h-7 rounded-full border-blue-200 px-3 text-[9px] font-black tracking-widest text-blue-600 uppercase hover:bg-blue-50"
                    onClick={() => {
                      setTitle("Daily Sync")
                      setType(EventType.SYNC)
                    }}
                  >
                    Daily Sync
                  </Button>
                </div>
              </div>
              <Input
                placeholder="Event Title..."
                value={title}
                onChange={(e) =>{  setTitle(e.target.value); }}
                required
                className="h-14 rounded-2xl border-slate-100 bg-slate-50 px-6 text-lg font-bold focus:ring-2 focus:ring-blue-500/20 dark:border-slate-800 dark:bg-slate-950"
              />
              <Textarea
                placeholder="Describe the event details..."
                value={description}
                onChange={(e) =>{  setDescription(e.target.value); }}
                className="min-h-[120px] rounded-2xl border-slate-100 bg-slate-50 p-6 text-sm font-medium focus:ring-2 focus:ring-blue-500/20 dark:border-slate-800 dark:bg-slate-950"
              />
            </div>

            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-3">
                <div className="flex items-center gap-3 px-1">
                  <CalendarIcon className="h-4 w-4 text-slate-400" />
                  <span className="text-[10px] font-black tracking-[0.2em] text-slate-400 uppercase">
                    Event Date
                  </span>
                </div>
                <Input
                  type="date"
                  value={date}
                  onChange={(e) =>{  setDate(e.target.value); }}
                  className="h-12 rounded-xl border-slate-100 bg-slate-50 px-4 font-bold dark:border-slate-800 dark:bg-slate-950"
                />
              </div>
              <div className="space-y-3">
                <div className="flex items-center gap-3 px-1">
                  <Clock className="h-4 w-4 text-slate-400" />
                  <span className="text-[10px] font-black tracking-[0.2em] text-slate-400 uppercase">
                    Event Category
                  </span>
                </div>
                <Select value={type} onValueChange={(v) =>{  setType(v as EventType); }}>
                  <SelectTrigger className="h-12 rounded-xl border-slate-100 bg-slate-50 px-4 font-bold dark:border-slate-800 dark:bg-slate-950">
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent className="rounded-2xl border-slate-100 shadow-2xl dark:border-slate-800">
                    <SelectItem value="sync" className="rounded-xl font-bold">
                      Sync Point
                    </SelectItem>
                    <SelectItem value="blocked" className="rounded-xl font-bold">
                      Off-Time / Break
                    </SelectItem>
                    <SelectItem value="buffer" className="rounded-xl font-bold">
                      Buffer Zone
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-2">
                <span className="px-1 text-[9px] font-black tracking-widest text-slate-400 uppercase">
                  Start Time
                </span>
                <Input
                  type="time"
                  value={startTime}
                  onChange={(e) =>{  setStartTime(e.target.value); }}
                  className="h-12 rounded-xl border-slate-100 bg-slate-50 px-4 font-bold dark:border-slate-800 dark:bg-slate-950"
                />
              </div>
              <div className="space-y-2">
                <span className="px-1 text-[9px] font-black tracking-widest text-slate-400 uppercase">
                  End Time
                </span>
                <Input
                  type="time"
                  value={endTime}
                  onChange={(e) =>{  setEndTime(e.target.value); }}
                  className="h-12 rounded-xl border-slate-100 bg-slate-50 px-4 font-bold dark:border-slate-800 dark:bg-slate-950"
                />
              </div>
            </div>

            <div className="flex gap-4 pt-4">
              <Button
                type="button"
                variant="ghost"
                onClick={() =>{  onOpenChange(false); }}
                className="h-14 flex-1 rounded-2xl text-[11px] font-black tracking-widest uppercase hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={loading}
                className="h-14 flex-[2] gap-3 rounded-2xl bg-slate-900 text-sm font-black tracking-widest text-white uppercase shadow-2xl transition-all hover:scale-[1.02] dark:bg-white dark:text-slate-900"
              >
                {loading && <Clock className="h-4 w-4 animate-spin" />}
                Add to Schedule
              </Button>
            </div>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
