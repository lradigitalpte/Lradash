"use client"

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

interface LogResultsModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  strategyId: string
  onLogAdded: () => void
}

export function LogResultsModal({
  open,
  onOpenChange,
  strategyId,
  onLogAdded
}: LogResultsModalProps) {
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split("T")[0],
    likes: 0,
    shares: 0,
    comments: 0,
    reach: 0
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    try {
      setLoading(true)

      const res = await apiClient.post(`/api/marketing/strategies/${strategyId}/logs`, {
        ...formData,
        date: new Date(formData.date)
      })

      if (!res.ok) {
        throw new Error("Failed to log results")
      }

      toast.success("Results logged successfully")
      onLogAdded()
      setFormData({
        date: new Date().toISOString().split("T")[0],
        likes: 0,
        shares: 0,
        comments: 0,
        reach: 0
      })
      onOpenChange(false)
    } catch (error) {
      console.error("Error logging results:", error)
      toast.error("Failed to log results")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md rounded-2xl">
        <DialogHeader>
          <DialogTitle>Log Daily Results</DialogTitle>
          <DialogDescription>Record your engagement metrics for today</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-4">
            {/* Date */}
            <div className="space-y-2">
              <Label htmlFor="date" className="text-[10px] font-black tracking-widest uppercase">
                Date
              </Label>
              <Input
                id="date"
                type="date"
                value={formData.date}
                onChange={(e) => {
                  setFormData({ ...formData, date: e.target.value })
                }}
                className="h-10 rounded-lg"
              />
            </div>

            {/* Reach */}
            <div className="space-y-2">
              <Label htmlFor="reach" className="text-[10px] font-black tracking-widest uppercase">
                Reach
              </Label>
              <Input
                id="reach"
                type="number"
                min="0"
                value={formData.reach}
                onChange={(e) => {
                  setFormData({ ...formData, reach: parseInt(e.target.value) || 0 })
                }}
                placeholder="Number of people reached"
                className="h-10 rounded-lg"
              />
            </div>

            {/* Likes */}
            <div className="space-y-2">
              <Label htmlFor="likes" className="text-[10px] font-black tracking-widest uppercase">
                Likes
              </Label>
              <Input
                id="likes"
                type="number"
                min="0"
                value={formData.likes}
                onChange={(e) => {
                  setFormData({ ...formData, likes: parseInt(e.target.value) || 0 })
                }}
                placeholder="Number of likes"
                className="h-10 rounded-lg"
              />
            </div>

            {/* Shares */}
            <div className="space-y-2">
              <Label htmlFor="shares" className="text-[10px] font-black tracking-widest uppercase">
                Shares
              </Label>
              <Input
                id="shares"
                type="number"
                min="0"
                value={formData.shares}
                onChange={(e) => {
                  setFormData({ ...formData, shares: parseInt(e.target.value) || 0 })
                }}
                placeholder="Number of shares"
                className="h-10 rounded-lg"
              />
            </div>

            {/* Comments */}
            <div className="space-y-2">
              <Label
                htmlFor="comments"
                className="text-[10px] font-black tracking-widest uppercase"
              >
                Comments
              </Label>
              <Input
                id="comments"
                type="number"
                min="0"
                value={formData.comments}
                onChange={(e) => {
                  setFormData({ ...formData, comments: parseInt(e.target.value) || 0 })
                }}
                placeholder="Number of comments"
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
              {loading ? "Logging..." : "Log Results"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
