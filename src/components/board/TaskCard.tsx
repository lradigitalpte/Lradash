"use client"

import { GripVertical, Trash2, Edit, User, Calendar, Zap, Search, Loader2 } from "lucide-react"
import { useState, useEffect } from "react"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator
} from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { apiClient } from "@/lib/api/client"

export interface Task {
  _id: string
  title: string
  description?: string
  status: "TODO" | "IN_PROGRESS" | "DONE" | "ARCHIVED"
  priority: "LOW" | "MEDIUM" | "HIGH" | "URGENT"
  dueDate?: string
  assignee?: {
    id: string
    name: string
    avatar?: string
    email?: string
  }
}

interface User {
  _id: string
  name: string
  email: string
  avatar?: string
}

interface TaskCardProps {
  task: Task
  onEdit?: (task: Task) => void
  onDelete?: (taskId: string) => void
  onAssigneeChange?: (taskId: string, assignee?: User) => void
}

export function TaskCard({ task, onEdit, onDelete, onAssigneeChange }: TaskCardProps) {
  const [isDragging, setIsDragging] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [editedTitle, setEditedTitle] = useState(task.title)
  const [editedDescription, setEditedDescription] = useState(task.description || "")
  const [showAssigneePicker, setShowAssigneePicker] = useState(false)
  const [assigneeSearchQuery, setAssigneeSearchQuery] = useState("")
  const [assigneeSearchResults, setAssigneeSearchResults] = useState<User[]>([])
  const [assigneeLoading, setAssigneeLoading] = useState(false)
  const [isAssigneeDropdownOpen, setIsAssigneeDropdownOpen] = useState(false)

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "URGENT":
        return "bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-400"
      case "HIGH":
        return "bg-orange-100 text-orange-700 dark:bg-orange-900/20 dark:text-orange-400"
      case "MEDIUM":
        return "bg-amber-100 text-amber-700 dark:bg-amber-900/20 dark:text-amber-400"
      case "LOW":
        return "bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400"
      default:
        return "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-400"
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "DONE":
        return <div className="h-2 w-2 rounded-full bg-green-500" />
      case "IN_PROGRESS":
        return <Zap className="h-3 w-3 animate-pulse text-blue-500" />
      default:
        return <div className="h-2 w-2 rounded-full bg-slate-300" />
    }
  }

  const handleDragStart = (e: React.DragEvent) => {
    setIsDragging(true)
    e.dataTransfer.setData("taskId", task._id)
    e.dataTransfer.effectAllowed = "move"
  }

  const handleDragEnd = () => {
    setIsDragging(false)
  }

  const handleSaveEdit = async () => {
    if (editedTitle.trim()) {
      // Call the parent component's edit handler with updated task
      const updatedTask = {
        ...task,
        title: editedTitle.trim(),
        description: editedDescription.trim() || undefined
      }
      onEdit?.(updatedTask)
      setIsEditing(false)
    }
  }

  const handleCancelEdit = () => {
    setEditedTitle(task.title)
    setEditedDescription(task.description || "")
    setIsEditing(false)
  }

  const fetchAssigneeSearchResults = async (searchQuery: string) => {
    try {
      setAssigneeLoading(true)
      const response = await apiClient.get(
        `/api/users/search?username=${encodeURIComponent(searchQuery)}`
      )
      if (response.ok) {
        const data = await response.json()
        setAssigneeSearchResults(data.users || [])
      }
    } catch (error) {
      console.error("Failed to search users:", error)
    } finally {
      setAssigneeLoading(false)
    }
  }

  useEffect(() => {
    if (isAssigneeDropdownOpen && assigneeSearchQuery) {
      fetchAssigneeSearchResults(assigneeSearchQuery)
    }
  }, [isAssigneeDropdownOpen, assigneeSearchQuery])

  const handleAssigneeSearchChange = (value: string) => {
    setAssigneeSearchQuery(value)
    // Reset results if query is empty
    if (!value.trim()) {
      setAssigneeSearchResults([])
    }
  }

  return (
    <Card
      draggable
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      className={`group relative cursor-grab transition-all hover:shadow-md ${
        isDragging ? "opacity-50" : ""
      } ${task.status === "DONE" ? "bg-green-50/30 dark:bg-green-900/10" : ""}`}
    >
      {/* Drag Handle */}
      <div className="absolute top-2 left-2 z-10">
        <Button
          variant="ghost"
          size="icon"
          className="h-5 w-5 cursor-grab opacity-0 transition-opacity group-hover:opacity-100 active:cursor-grabbing"
        >
          <GripVertical className="h-3 w-3 text-slate-400" />
        </Button>
      </div>

      {/* Priority Badge */}
      <div className="absolute top-2 right-2 z-10">
        <Badge
          variant="secondary"
          className={`h-5 rounded-full px-2 text-xs font-bold ${getPriorityColor(task.priority)}`}
        >
          {task.priority}
        </Badge>
      </div>

      {/* Status Icon */}
      <div className="absolute top-1/2 left-6 -translate-y-1/2">{getStatusIcon(task.status)}</div>

      <div className="p-4 pl-10">
        {/* Title */}
        {isEditing ? (
          <div className="mb-2">
            <Input
              value={editedTitle}
              onChange={(e) => {
                setEditedTitle(e.target.value)
              }}
              className="mb-2"
              placeholder="Task title..."
            />
            <Textarea
              value={editedDescription}
              onChange={(e) => {
                setEditedDescription(e.target.value)
              }}
              placeholder="Task description..."
              className="text-sm"
              rows={3}
            />
            <div className="mt-2 flex justify-end space-x-1">
              <Button size="sm" variant="ghost" onClick={handleCancelEdit} className="text-xs">
                Cancel
              </Button>
              <Button
                size="sm"
                onClick={handleSaveEdit}
                className="text-xs"
                disabled={!editedTitle.trim()}
              >
                Save
              </Button>
            </div>
          </div>
        ) : (
          <>
            <h3 className="mb-2 leading-tight font-medium text-slate-900 dark:text-white">
              {task.title}
            </h3>

            {/* Description */}
            {task.description && (
              <p className="mb-3 line-clamp-2 text-sm text-slate-600 dark:text-slate-400">
                {task.description}
              </p>
            )}
          </>
        )}

        {/* Metadata */}
        <div className="flex items-center justify-between">
          {/* Assignee */}
          {task.assignee ? (
            <div className="flex items-center gap-2">
              <Avatar className="h-6 w-6 rounded-full">
                <AvatarImage src={task.assignee.avatar} />
                <AvatarFallback className="bg-blue-600 text-xs text-white">
                  {task.assignee.name?.slice(0, 1).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <span className="text-xs text-slate-500 dark:text-slate-400">
                {task.assignee.name}
              </span>
            </div>
          ) : (
            <div className="flex items-center gap-1 text-xs text-slate-400 dark:text-slate-500">
              <User className="h-3 w-3" />
              <span>Unassigned</span>
            </div>
          )}

          {/* Due Date */}
          {task.dueDate && (
            <div className="flex items-center gap-1 text-xs text-slate-400 dark:text-slate-500">
              <Calendar className="h-3 w-3" />
              <span className="whitespace-nowrap">
                {new Date(task.dueDate).toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric"
                })}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Actions Menu */}
      <div className="absolute right-2 bottom-2 z-10">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-5 w-5 opacity-0 transition-opacity group-hover:opacity-100"
            >
              <Edit className="h-3 w-3" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-32">
            <DropdownMenuItem onClick={() => onEdit?.(task)} className="text-xs">
              <Edit className="mr-2 h-3 w-3" />
              Edit
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => {
                setIsAssigneeDropdownOpen(!isAssigneeDropdownOpen)
              }}
              className="text-xs"
            >
              <User className="mr-2 h-3 w-3" />
              Change Assignee
            </DropdownMenuItem>

            {isAssigneeDropdownOpen && (
              <div className="px-2 py-1">
                <div className="mb-1 text-xs font-medium">Assign to:</div>
                <div className="relative mb-2">
                  <Search className="absolute top-1/2 left-2 h-3 w-3 -translate-y-1/2 text-slate-400" />
                  <Input
                    placeholder="Search users..."
                    value={assigneeSearchQuery}
                    onChange={(e) => {
                      handleAssigneeSearchChange(e.target.value)
                    }}
                    className="h-7 rounded border-slate-200 pl-8 text-xs dark:border-slate-800"
                  />
                </div>

                <div className="max-h-48 overflow-y-auto">
                  {assigneeLoading ? (
                    <div className="flex items-center justify-center py-2 text-slate-400">
                      <Loader2 className="mr-1 h-3 w-3 animate-spin" />
                      <span className="text-xs">Loading...</span>
                    </div>
                  ) : assigneeSearchResults.length > 0 ? (
                    <div className="space-y-1">
                      <div
                        className="cursor-pointer rounded px-2 py-1.5 text-xs hover:bg-slate-100"
                        onClick={() => {
                          onAssigneeChange?.(task._id, undefined)
                          setIsAssigneeDropdownOpen(false)
                          setAssigneeSearchQuery("")
                          setAssigneeSearchResults([])
                        }}
                      >
                        <div className="flex items-center">
                          <div className="mr-2 flex h-5 w-5 items-center justify-center rounded-full bg-slate-200">
                            <User className="h-3 w-3 text-slate-500" />
                          </div>
                          <span>Unassigned</span>
                        </div>
                      </div>
                      {assigneeSearchResults.map((user) => (
                        <div
                          key={user._id}
                          className="cursor-pointer rounded px-2 py-1.5 text-xs hover:bg-slate-100"
                          onClick={() => {
                            onAssigneeChange?.(task._id, {
                              _id: user._id,
                              name: user.name,
                              email: user.email,
                              avatar: user.avatar
                            })
                            setIsAssigneeDropdownOpen(false)
                            setAssigneeSearchQuery("")
                            setAssigneeSearchResults([])
                          }}
                        >
                          <div className="flex items-center">
                            <Avatar className="mr-2 h-5 w-5 rounded-full">
                              <AvatarImage src={user.avatar} />
                              <AvatarFallback className="bg-blue-600 text-xs text-white">
                                {user.name?.slice(0, 1).toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <div className="font-medium">{user.name}</div>
                              <div className="text-slate-500">{user.email}</div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : assigneeSearchQuery ? (
                    <div className="py-2 text-center text-xs text-slate-400">No users found</div>
                  ) : (
                    <div className="py-2 text-center text-xs text-slate-400">
                      Start typing to search users
                    </div>
                  )}
                </div>
              </div>
            )}
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={() => onDelete?.(task._id)}
              className="text-xs text-rose-600 hover:text-rose-700"
            >
              <Trash2 className="mr-2 h-3 w-3" />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </Card>
  )
}
