"use client"

import { RefreshCw, CheckCircle2, AlertCircle, Clock } from "lucide-react"
import { useState } from "react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

interface SEOSyncButtonProps {
  projectId: string
  onSync?: () => Promise<void>
  lastSynced?: Date
}

export function SEOSyncButton({ projectId, onSync, lastSynced }: SEOSyncButtonProps) {
  const [isSyncing, setIsSyncing] = useState(false)
  const [syncStatus, setSyncStatus] = useState<"idle" | "success" | "error">("idle")

  const handleSync = async () => {
    setIsSyncing(true)
    setSyncStatus("idle")

    try {
      if (onSync) {
        await onSync()
      }
      setSyncStatus("success")
      setTimeout(() =>{  setSyncStatus("idle"); }, 3000)
    } catch (error) {
      setSyncStatus("error")
      setTimeout(() =>{  setSyncStatus("idle"); }, 3000)
    } finally {
      setIsSyncing(false)
    }
  }

  const getTimeAgo = (date?: Date) => {
    if (!date) {
      return "Never"
    }
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMs / 3600000)
    const diffDays = Math.floor(diffMs / 86400000)

    if (diffMins < 1) {
      return "Just now"
    }
    if (diffMins < 60) {
      return `${diffMins}m ago`
    }
    if (diffHours < 24) {
      return `${diffHours}h ago`
    }
    return `${diffDays}d ago`
  }

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={handleSync}
              disabled={isSyncing}
              className="gap-2"
            >
              {isSyncing ? (
                <>
                  <RefreshCw className="h-4 w-4 animate-spin" />
                  Syncing...
                </>
              ) : (
                <>
                  <RefreshCw className="h-4 w-4" />
                  Sync Data
                </>
              )}
            </Button>
            <Badge variant="outline" className="gap-1">
              {syncStatus === "success" && (
                <>
                  <CheckCircle2 className="h-3 w-3 text-emerald-600" />
                  Synced
                </>
              )}
              {syncStatus === "error" && (
                <>
                  <AlertCircle className="h-3 w-3 text-rose-600" />
                  Failed
                </>
              )}
              {syncStatus === "idle" && (
                <>
                  <Clock className="h-3 w-3" />
                  {getTimeAgo(lastSynced)}
                </>
              )}
            </Badge>
          </div>
        </TooltipTrigger>
        <TooltipContent>
          <p className="text-xs">Sync data from Google Search Console and other SEO tools</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}
