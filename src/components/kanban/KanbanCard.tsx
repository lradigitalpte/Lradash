"use client"

import { useSortable } from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import { Calendar, CheckSquare, Paperclip, User, AlertCircle } from "lucide-react"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

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
}

interface KanbanCardProps {
  card: Card
  onClick: () => void
  isDragging?: boolean
}

export function KanbanCard({ card, onClick, isDragging = false }: KanbanCardProps) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({
    id: card._id
  })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition
  }

  const completedTasks = card.checklist?.filter((item) => item.completed).length || 0
  const totalTasks = card.checklist?.length || 0
  const hasChecklist = totalTasks > 0
  const allTasksComplete = hasChecklist && completedTasks === totalTasks

  const priorityConfig = {
    URGENT: {
      color: "bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-400",
      label: "Urgent"
    },
    HIGH: {
      color: "bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-400",
      label: "High"
    },
    MEDIUM: {
      color: "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-400",
      label: "Medium"
    },
    LOW: {
      color: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-400",
      label: "Low"
    }
  }

  const priority = card.priority ? priorityConfig[card.priority] : null

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      onClick={onClick}
      className={cn(
        "group cursor-pointer rounded-2xl border border-slate-200/50 bg-white p-4 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-blue-500/30 hover:shadow-xl hover:shadow-slate-200/50 active:scale-[0.98] dark:border-slate-800/50 dark:bg-slate-900 dark:hover:shadow-none",
        isDragging && "opacity-50 ring-2 ring-blue-500 ring-offset-2 dark:ring-offset-slate-950"
      )}
    >
      {/* Cover Color */}
      {card.coverColor && (
        <div
          className="-m-4 mb-3 h-2 rounded-t-2xl opacity-80"
          style={{ backgroundColor: card.coverColor }}
        />
      )}

      {/* Labels */}
      {card.labels && card.labels.length > 0 && (
        <div className="mb-3 flex flex-wrap gap-1.5">
          {card.labels.map((label, index) => (
            <div
              key={index}
              className="h-1.5 w-8 rounded-full opacity-60 transition-opacity group-hover:opacity-100"
              style={{ backgroundColor: label.color }}
              title={label.name}
            />
          ))}
        </div>
      )}

      {/* Title */}
      <h4 className="mb-3 line-clamp-2 text-[13px] leading-relaxed font-bold text-slate-800 transition-colors group-hover:text-blue-600 dark:text-slate-200 dark:group-hover:text-blue-400">
        {card.title}
      </h4>

      {/* Badges & Info */}
      <div className="flex flex-col gap-3">
        <div className="flex flex-wrap items-center gap-3 text-[10px] font-black tracking-wider text-slate-400 uppercase">
          {/* Priority Badge */}
          {priority && (
            <span className={cn("rounded-full px-2 py-0.5", priority.color)}>{priority.label}</span>
          )}

          {/* Due Date */}
          {card.dueDate && (
            <div className="flex items-center gap-1.5">
              <Calendar className="h-3 w-3 stroke-[2.5]" />
              <span>
                {new Date(card.dueDate).toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric"
                })}
              </span>
            </div>
          )}

          {/* Checklist Progress */}
          {hasChecklist && (
            <div
              className={cn(
                "flex items-center gap-1.5",
                allTasksComplete && "text-emerald-600 dark:text-emerald-400"
              )}
            >
              <CheckSquare className="h-3 w-3 stroke-[2.5]" />
              <span>
                {completedTasks}/{totalTasks}
              </span>
            </div>
          )}

          {/* Attachments */}
          {card.attachments && card.attachments.length > 0 && (
            <div className="flex items-center gap-1.5">
              <Paperclip className="h-3 w-3 stroke-[2.5]" />
              <span>{card.attachments.length}</span>
            </div>
          )}
        </div>

        {/* Footer: Members */}
        {card.members && card.members.length > 0 && (
          <div className="mt-1 flex items-center justify-between">
            <div className="flex -space-x-2">
              {card.members.slice(0, 3).map((member) => (
                <Avatar
                  key={member._id}
                  className="h-7 w-7 border-2 border-white shadow-sm dark:border-slate-900"
                >
                  <AvatarImage src={member.avatar} />
                  <AvatarFallback className="bg-slate-100 text-[10px] font-black dark:bg-slate-800">
                    {member.name.slice(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
              ))}
              {card.members.length > 3 && (
                <div className="flex h-7 w-7 items-center justify-center rounded-full border-2 border-white bg-slate-100 text-[10px] font-black text-slate-500 shadow-sm dark:border-slate-900 dark:bg-slate-800">
                  +{card.members.length - 3}
                </div>
              )}
            </div>

            {/* Status Icon */}
            {allTasksComplete && (
              <div className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-50 dark:bg-emerald-900/30">
                <CheckSquare className="h-3 w-3 stroke-[3] text-emerald-600 dark:text-emerald-400" />
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
