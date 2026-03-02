"use client"

import { X } from "lucide-react"
import { useState } from "react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { apiClient } from "@/lib/api/client"

interface SetTargetsModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  strategyId: string
  currentTargets?: {
    reach: number
    likes: number
    shares: number
    comments: number
    deadline?: string
  }
  onTargetsUpdated: () => void
}

export function SetTargetsModal({
  open,
  onOpenChange,
  strategyId,
  currentTargets,
  onTargetsUpdated
}: SetTargetsModalProps) {
  const [loading, setLoading] = useState(false)
  const [targets, setTargets] = useState(
    currentTargets || {
      reach: 0,
      likes: 0,
      shares: 0,
      comments: 0,
      deadline: undefined
    }
  )

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    try {
      setLoading(true)

      const res = await apiClient.put(`/api/marketing/strategies/${strategyId}`, {
        targets
      })

      if (!res.ok) {
        throw new Error("Failed to update targets")
      }

      toast.success("Targets updated successfully")
      onTargetsUpdated()
      onOpenChange(false)
    } catch (error) {
      console.error("Error updating targets:", error)
      toast.error("Failed to update targets")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md rounded-2xl">
        <DialogHeader>
          <DialogTitle>Set Performance Targets</DialogTitle>
          <DialogDescription>Define your engagement targets for this strategy</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-4">
            {/* Reach */}
            <div className="space-y-2">
              <Label htmlFor="reach" className="text-[10px] font-black tracking-widest uppercase">
                Target Reach
              </Label>
              <Input
                id="reach"
                type="number"
                min="0"
                value={targets.reach}
                onChange={(e) => {
                  setTargets({ ...targets, reach: parseInt(e.target.value) || 0 })
                }}
                placeholder="e.g., 10000"
                className="h-10 rounded-lg"
              />
              <p className="text-[9px] text-slate-500">Total people you want to reach</p>
            </div>

            {/* Likes Target */}
            <div className="space-y-2">
              <Label htmlFor="likes" className="text-[10px] font-black tracking-widest uppercase">
                Target Likes
              </Label>
              <Input
                id="likes"
                type="number"
                min="0"
                value={targets.likes}
                onChange={(e) => {
                  setTargets({ ...targets, likes: parseInt(e.target.value) || 0 })
                }}
                placeholder="e.g., 500"
                className="h-10 rounded-lg"
              />
              <p className="text-[9px] text-slate-500">Expected number of likes</p>
            </div>

            {/* Shares Target */}
            <div className="space-y-2">
              <Label htmlFor="shares" className="text-[10px] font-black tracking-widest uppercase">
                Target Shares
              </Label>
              <Input
                id="shares"
                type="number"
                min="0"
                value={targets.shares}
                onChange={(e) => {
                  setTargets({ ...targets, shares: parseInt(e.target.value) || 0 })
                }}
                placeholder="e.g., 100"
                className="h-10 rounded-lg"
              />
              <p className="text-[9px] text-slate-500">Expected number of shares</p>
            </div>

            {/* Comments Target */}
            <div className="space-y-2">
              <Label
                htmlFor="comments"
                className="text-[10px] font-black tracking-widest uppercase"
              >
                Target Comments
              </Label>
              <Input
                id="comments"
                type="number"
                min="0"
                value={targets.comments}
                onChange={(e) => {
                  setTargets({ ...targets, comments: parseInt(e.target.value) || 0 })
                }}
                placeholder="e.g., 200"
                className="h-10 rounded-lg"
              />
              <p className="text-[9px] text-slate-500">Expected number of comments</p>
            </div>

            {/* Deadline */}
            <div className="space-y-2">
              <Label
                htmlFor="deadline"
                className="text-[10px] font-black tracking-widest uppercase"
              >
                Deadline (Optional)
              </Label>
              <Input
                id="deadline"
                type="date"
                value={
                  targets.deadline ? new Date(targets.deadline).toISOString().split("T")[0] : ""
                }
                onChange={(e) => {
                  setTargets({ ...targets, deadline: e.target.value || undefined })
                }}
                className="h-10 rounded-lg"
              />
            </div>
          </div>

          <div className="flex gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                onOpenChange(false)
              }}
              className="flex-1"
              disabled={loading}
            >
              Cancel
            </Button>
            <Button type="submit" className="flex-1" disabled={loading}>
              {loading ? "Saving..." : "Save Targets"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
