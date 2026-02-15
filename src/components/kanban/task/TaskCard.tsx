"use client"

import { useSortable } from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import { cva } from "class-variance-authority"
import { CalendarDays, GripVertical, MessageSquare, Paperclip } from "lucide-react"
import { useTranslations } from "next-intl"

import { StatusBadge, UserAvatar } from "@/components/common"
import { Card } from "@/components/ui/card"
import { cn, formatDate, isOverdue } from "@/lib/utils"
import { Task, TaskStatus } from "@/types/dbInterface"

import { TaskActions } from "./TaskAction"

interface TaskCardProps {
  task: Task
  isOverlay?: boolean
}

export type TaskType = "Task"

export interface TaskDragData {
  type: TaskType
  task: Task
}

export function TaskCard({ task, isOverlay = false }: TaskCardProps) {
  const t = useTranslations("kanban.task")
  const { setNodeRef, attributes, listeners, transform, transition, isDragging } = useSortable({
    id: task._id,
    data: {
      type: "Task",
      task
    } satisfies TaskDragData,
    attributes: {
      roleDescription: "Task"
    }
  })

  const cardStyle = {
    transition,
    transform: CSS.Translate.toString(transform)
  }

  const cardVariants = cva(
    "group relative cursor-pointer transition-all hover:shadow-md hover:border-primary/50",
    {
      variants: {
        dragging: {
          over: "ring-2 ring-primary/50 opacity-50 rotate-2",
          overlay: "ring-2 ring-primary shadow-lg rotate-3"
        },
        status: {
          TODO: "border-l-4 border-l-slate-400",
          IN_PROGRESS: "border-l-4 border-l-blue-500",
          DONE: "border-l-4 border-l-green-500"
        }
      }
    }
  )

  const dragState = isOverlay ? "overlay" : isDragging ? "over" : undefined
  const taskOverdue = task.dueDate && task.status !== "DONE" && isOverdue(task.dueDate)

  return (
    <Card
      ref={setNodeRef}
      style={cardStyle}
      className={cn("mb-3", cardVariants({ dragging: dragState, status: task.status }))}
      data-testid="task-card"
    >
      <div className="p-4">
        {/* Header with drag handle and actions */}
        <div className="mb-3 flex items-start justify-between gap-2">
          <div className="flex items-start gap-2">
            {/* Drag Handle */}
            <button
              {...attributes}
              {...listeners}
              className="mt-0.5 cursor-grab rounded p-1 text-muted-foreground/50 opacity-0 transition-opacity group-hover:opacity-100 hover:bg-muted hover:text-muted-foreground"
              aria-label={t("moveTask")}
              data-testid="task-card-drag-button"
            >
              <GripVertical className="h-4 w-4" />
            </button>

            {/* Title */}
            <div className="flex-1">
              <h3 className="leading-tight font-medium text-foreground">{task.title}</h3>
            </div>
          </div>

          {/* Actions */}
          <TaskActions
            id={task._id}
            title={task.title}
            description={task.description}
            dueDate={task.dueDate}
            assignee={task.assignee?.name}
            status={task.status}
          />
        </div>

        {/* Description */}
        {task.description && (
          <p
            className="mb-3 line-clamp-2 text-sm text-muted-foreground"
            data-testid="task-card-description"
          >
            {task.description}
          </p>
        )}

        {/* Footer - Status, Due Date, Assignee */}
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex flex-wrap items-center gap-2">
            {/* Status Badge */}
            <StatusBadge type="status" value={task.status} size="sm" />

            {/* Due Date */}
            {task.dueDate && (
              <div
                className={cn(
                  "flex items-center gap-1 text-xs",
                  taskOverdue ? "text-red-500" : "text-muted-foreground"
                )}
              >
                <CalendarDays className="h-3 w-3" />
                <span>{formatDate(task.dueDate)}</span>
              </div>
            )}
          </div>

          {/* Right side - Assignee & indicators */}
          <div className="flex items-center gap-2">
            {/* Comment indicator (placeholder for future) */}
            {/* <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <MessageSquare className="h-3 w-3" />
              <span>0</span>
            </div> */}

            {/* Assignee Avatar */}
            {task.assignee && <UserAvatar name={task.assignee.name} size="xs" />}
          </div>
        </div>

        {/* Creator info - subtle */}
        {task.creator && (
          <div className="mt-3 border-t pt-2">
            <p className="text-xs text-muted-foreground">Created by {task.creator.name}</p>
          </div>
        )}
      </div>
    </Card>
  )
}
