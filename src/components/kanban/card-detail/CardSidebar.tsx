"use client"

import {
  Tag,
  CheckSquare,
  Calendar as CalendarIcon,
  Paperclip,
  Copy,
  Archive,
  Trash2,
  Palette,
  LucideIcon
} from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { cn } from "@/lib/utils"

import { CardLabels } from "./CardLabels"
import { WorkPackagePicker } from "./WorkPackagePicker"

interface Card {
  _id: string
  title: string
  description?: string
  listId: string
  position: number
  labels?: Array<{ name: string; color: string }>
  members?: Array<{ _id: string; name: string; avatar?: string }>
  dueDate?: string
  priority?: "LOW" | "MEDIUM" | "HIGH" | "URGENT"
  checklist?: Array<{ text: string; completed: boolean }>
  attachments?: Array<{ name: string; url: string }>
  coverColor?: string
  workPackage?: string
}

interface CardSidebarProps {
  card: Card
  boardId?: string
  projectId?: string
  labels: Array<{ name: string; color: string }>
  onAddLabel: (label: { name: string; color: string }) => void
  onRemoveLabel: (index: number) => void
  onAddChecklistItem: (text: string) => void
  onChangeCover: (color: string) => void
  dueDate?: string | null
  onDueDateChange?: (date: string | null) => void
  onSelectWorkPackage: (wpId: string | null) => void
  onAttachment?: () => void
  onDelete?: () => void
  onArchive?: () => void
}

export function CardSidebar({
  card,
  boardId,
  projectId,
  labels,
  onAddLabel,
  onRemoveLabel,
  onAddChecklistItem,
  onChangeCover,
  dueDate,
  onDueDateChange,
  onSelectWorkPackage,
  onAttachment,
  onDelete,
  onArchive
}: CardSidebarProps) {
  const handleCopyCard = () => {
    toast.success("Card copied!")
  }

  const handleArchiveCard = () => {
    if (onArchive) {
      onArchive()
    } else {
      toast.success("Card archived!")
    }
  }

  const handleDeleteCard = () => {
    onDelete?.()
  }

  const SidebarButton = ({
    icon: Icon,
    label,
    onClick,
    variant = "outline" as const,
    className = ""
  }: {
    icon: LucideIcon
    label: string
    onClick: () => void
    variant?: "outline" | "ghost" | "default"
    className?: string
  }) => (
    <Button
      variant={variant}
      size="sm"
      className={cn(
        "h-10 w-full justify-start rounded-xl text-[11px] font-black tracking-wider uppercase transition-all hover:scale-[1.02] active:scale-[0.98]",
        variant === "outline"
          ? "border-slate-200 hover:border-blue-500/30 hover:bg-slate-50 dark:border-slate-800 dark:hover:bg-slate-800"
          : "",
        className
      )}
      onClick={onClick}
    >
      <Icon className="mr-3 h-4 w-4 stroke-[2.5]" />
      {label}
    </Button>
  )

  return (
    <div className="space-y-8">
      {/* Add to Card */}
      <div>
        <h3 className="mb-3 px-1 text-[10px] font-black tracking-[0.2em] text-slate-400 uppercase">
          Add to Card
        </h3>
        <div className="space-y-4">
          {boardId && projectId && (
            <WorkPackagePicker
              boardId={boardId}
              projectId={projectId}
              currentWorkPackageId={card.workPackage}
              onSelect={onSelectWorkPackage}
            />
          )}
          <div className="space-y-2">
            <h4 className="text-[10px] font-black tracking-wider text-slate-500 uppercase">
              Labels
            </h4>
            <CardLabels labels={labels} onAddLabel={onAddLabel} onRemoveLabel={onRemoveLabel} />
          </div>
          <SidebarButton
            icon={CheckSquare}
            label="Checklist"
            onClick={() => {
              onAddChecklistItem("New task")
            }}
          />
          {onDueDateChange && (
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className={cn(
                    "h-10 w-full justify-start rounded-xl text-[11px] font-black tracking-wider uppercase transition-all hover:scale-[1.02] active:scale-[0.98]",
                    "border-slate-200 hover:border-blue-500/30 hover:bg-slate-50 dark:border-slate-800 dark:hover:bg-slate-800"
                  )}
                >
                  <CalendarIcon className="mr-3 h-4 w-4 stroke-[2.5]" />
                  Due Date {dueDate ? new Date(dueDate).toLocaleDateString() : ""}
                </Button>
              </PopoverTrigger>
              <PopoverContent
                className="w-auto rounded-2xl border-slate-200 p-0 dark:border-slate-800"
                align="start"
              >
                <Calendar
                  mode="single"
                  selected={dueDate ? new Date(dueDate) : undefined}
                  onSelect={(d) => {
                    onDueDateChange(d ? d.toISOString() : null)
                  }}
                  initialFocus
                />
                <div className="border-t border-slate-100 p-2 dark:border-slate-800">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-full text-xs"
                    onClick={() => {
                      onDueDateChange(null)
                    }}
                  >
                    Clear date
                  </Button>
                </div>
              </PopoverContent>
            </Popover>
          )}
          <SidebarButton
            icon={Paperclip}
            label="Attachment"
            onClick={() => {
              if (onAttachment) {
                onAttachment()
                return
              }
              toast.info("File upload coming soon")
            }}
          />
          <SidebarButton
            icon={Palette}
            label="Cover"
            onClick={() => {
              onChangeCover("#" + Math.floor(Math.random() * 16777215).toString(16))
            }}
          />
        </div>
      </div>

      {/* Actions */}
      <div>
        <h3 className="mb-3 px-1 text-[10px] font-black tracking-[0.2em] text-slate-400 uppercase">
          Actions
        </h3>
        <div className="space-y-2">
          <SidebarButton icon={Copy} label="Copy" onClick={handleCopyCard} />
          <SidebarButton icon={Archive} label="Archive" onClick={handleArchiveCard} />
          <SidebarButton
            icon={Trash2}
            label="Delete card"
            className="border-rose-100 text-rose-600 hover:bg-rose-50 hover:text-rose-700 dark:border-rose-900/30 dark:hover:bg-rose-900/10"
            onClick={handleDeleteCard}
          />
        </div>
      </div>
    </div>
  )
}
