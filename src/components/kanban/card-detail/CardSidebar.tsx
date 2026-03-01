"use client"

import {
  User,
  Tag,
  CheckSquare,
  Calendar,
  Paperclip,
  Copy,
  Archive,
  Trash2,
  Palette,
  LucideIcon
} from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { cn } from "@/lib/utils"

import { MemberPicker } from "./MemberPicker"
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
  boardId: string
  projectId: string
  onAddLabel: (label: { name: string; color: string }) => void
  onAddChecklistItem: (text: string) => void
  onChangeCover: (color: string) => void
  onAssignMember: (user: any) => void
  onUnassignMember: (userId: string) => void
  onSelectWorkPackage: (wpId: string | null) => void
  onDelete?: () => void
  onArchive?: () => void
}

export function CardSidebar({
  card,
  boardId,
  projectId,
  onAddLabel,
  onAddChecklistItem,
  onChangeCover,
  onAssignMember,
  onUnassignMember,
  onSelectWorkPackage,
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
    if (onDelete) {
      onDelete()
    } else {
      toast.error("Card deleted!")
    }
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
        <div className="space-y-2">
          <MemberPicker
            currentMembers={card.members || []}
            projectId={projectId}
            onAssign={onAssignMember}
            onUnassign={onUnassignMember}
          />
          <WorkPackagePicker
            boardId={boardId}
            projectId={projectId}
            currentWorkPackageId={card.workPackage}
            onSelect={onSelectWorkPackage}
          />
          <SidebarButton
            icon={Tag}
            label="Labels"
            onClick={() => toast.info("Label picker opened")}
          />
          <SidebarButton
            icon={CheckSquare}
            label="Checklist"
            onClick={() => {
              onAddChecklistItem("New task")
            }}
          />
          <SidebarButton
            icon={Calendar}
            label="Due Date"
            onClick={() => toast.info("Date picker opened")}
          />
          <SidebarButton
            icon={Paperclip}
            label="Attachment"
            onClick={() => toast.info("File upload coming soon")}
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
            label="Delete"
            className="border-rose-100 text-rose-600 hover:bg-rose-50 hover:text-rose-700 dark:border-rose-900/30 dark:hover:bg-rose-900/10"
            onClick={handleDeleteCard}
          />
        </div>
      </div>
    </div>
  )
}
