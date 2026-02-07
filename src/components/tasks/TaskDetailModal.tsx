"use client"

import { 
  AlignLeft, 
  Calendar as CalendarIcon, 
  CheckSquare, 
  Clock, 
  Eye, 
  Link2, 
  Loader2, 
  MessageSquare, 
  MoreHorizontal, 
  Paperclip, 
  Tag, 
  Trash2, 
  User, 
  X,
  Plus,
  Check
} from "lucide-react"
import { useState } from "react"

import { UserAvatar } from "@/components/common"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { formatDate, isOverdue } from "@/lib/utils"
import { Task } from "@/types/dbInterface"

interface ChecklistItem {
  id: string
  title: string
  completed: boolean
}

interface TaskTag {
  id: string
  name: string
  color: "red" | "blue" | "green" | "yellow" | "purple" | "pink"
}

interface TaskComment {
  id: string
  author: string
  text: string
  mentions: string[]
  createdAt: Date
}

interface TaskDetailModalProps {
  task?: (Task & { projectTitle: string })
  open: boolean
  onOpenChange: (open: boolean) => void
  onSave?: (task: Task) => void
}

const tagColors = {
  red: "bg-red-100 text-red-800 border-red-300",
  blue: "bg-blue-100 text-blue-800 border-blue-300",
  green: "bg-green-100 text-green-800 border-green-300",
  yellow: "bg-yellow-100 text-yellow-800 border-yellow-300",
  purple: "bg-purple-100 text-purple-800 border-purple-300",
  pink: "bg-pink-100 text-pink-800 border-pink-300"
}

export function TaskDetailModal({ task, open, onOpenChange, onSave }: TaskDetailModalProps) {
  const [editingTitle, setEditingTitle] = useState(false)
  const [editingDescription, setEditingDescription] = useState(false)
  const [editedTitle, setEditedTitle] = useState(task?.title || "")
  const [editedDescription, setEditedDescription] = useState(task?.description || "")
  const [checklist, setChecklist] = useState<ChecklistItem[]>([
    { id: "1", title: "Review design mockups", completed: true },
    { id: "2", title: "Get stakeholder approval", completed: false },
    { id: "3", title: "Create implementation plan", completed: false }
  ])
  const [newChecklistItem, setNewChecklistItem] = useState("")
  const [tags, setTags] = useState<TaskTag[]>([
    { id: "1", name: "Frontend", color: "blue" },
    { id: "2", name: "Urgent", color: "red" }
  ])
  const [newTagName, setNewTagName] = useState("")
  const [newTagColor, setNewTagColor] = useState<"red" | "blue" | "green" | "yellow" | "purple" | "pink">("blue")
  const [newComment, setNewComment] = useState("")
  const [comments, setComments] = useState<TaskComment[]>([
    {
      id: "1",
      author: "Jane Doe",
      text: "I've started working on the design phase. Will have mockups ready by tomorrow.",
      mentions: [],
      createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000)
    }
  ])
  const [attachments, setAttachments] = useState<any[]>([])

  if (!task) return null

  const taskOverdue = task.dueDate && isOverdue(task.dueDate) && task.status !== "DONE"
  const checklistCompletion = checklist.length > 0 
    ? Math.round((checklist.filter(c => c.completed).length / checklist.length) * 100)
    : 0

  const handleTitleSave = async () => {
    if (editedTitle.trim()) {
      await onSave?.({ ...task, title: editedTitle } as Task)
      setEditingTitle(false)
    }
  }

  const handleDescriptionSave = async () => {
    await onSave?.({ ...task, description: editedDescription } as Task)
    setEditingDescription(false)
  }

  const handleQuickUpdate = async (field: string, value: any) => {
    await onSave?.({ ...task, [field]: value } as Task)
  }

  const toggleChecklistItem = (id: string) => {
    setChecklist(checklist.map(item =>
      item.id === id ? { ...item, completed: !item.completed } : item
    ))
  }

  const addChecklistItem = () => {
    if (newChecklistItem.trim()) {
      setChecklist([...checklist, {
        id: Date.now().toString(),
        title: newChecklistItem,
        completed: false
      }])
      setNewChecklistItem("")
    }
  }

  const removeChecklistItem = (id: string) => {
    setChecklist(checklist.filter(item => item.id !== id))
  }

  const addTag = () => {
    if (newTagName.trim()) {
      setTags([...tags, {
        id: Date.now().toString(),
        name: newTagName,
        color: newTagColor
      }])
      setNewTagName("")
    }
  }

  const removeTag = (id: string) => {
    setTags(tags.filter(tag => tag.id !== id))
  }

  const handleAddComment = () => {
    if (newComment.trim()) {
      // Extract mentions (@username)
      const mentionRegex = /@(\w+)/g
      const mentions: string[] = []
      let match
      while ((match = mentionRegex.exec(newComment)) !== null) {
        mentions.push(match[1])
      }

      setComments([...comments, {
        id: Date.now().toString(),
        author: "Current User",
        text: newComment,
        mentions,
        createdAt: new Date()
      }])
      setNewComment("")
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent 
        className="!max-w-[1600px] !w-[98vw] !h-[98vh] !p-0 !gap-0 !overflow-hidden !fixed !top-1/2 !left-1/2 !transform !-translate-x-1/2 !-translate-y-1/2 !rounded-xl"
        showCloseButton={true}
      >
        <div className="flex h-full overflow-hidden">
          {/* Main Content - Left Side */}
          <div className="flex-1 overflow-y-auto bg-white dark:bg-gray-950">
            <div className="p-10 pb-20">
              {/* Close Button */}
              <Button
                variant="ghost"
                size="icon"
                className="absolute right-6 top-6 z-10"
                onClick={() => onOpenChange(false)}
              >
                <X className="h-5 w-5" />
              </Button>

              {/* Project Breadcrumb */}
              <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
                <span>{task.projectTitle}</span>
                <span>/</span>
                <span className="text-foreground font-medium">{task._id.toString().slice(-6)}</span>
              </div>

              {/* Task Title - Editable */}
              <div className="mb-8">
                {editingTitle ? (
                  <div className="space-y-2">
                    <Input
                      value={editedTitle}
                      onChange={(e) => setEditedTitle(e.target.value)}
                      className="text-3xl font-bold h-auto py-2"
                      autoFocus
                      onBlur={handleTitleSave}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") handleTitleSave()
                        if (e.key === "Escape") {
                          setEditedTitle(task.title)
                          setEditingTitle(false)
                        }
                      }}
                    />
                  </div>
                ) : (
                  <h1
                    className="text-4xl font-bold cursor-pointer hover:bg-muted/50 px-2 py-1 -mx-2 rounded transition-colors"
                    onClick={() => {
                      setEditedTitle(task.title)
                      setEditingTitle(true)
                    }}
                  >
                    {task.title}
                  </h1>
                )}
              </div>

              {/* Tags */}
              <div className="mb-8">
                <div className="flex flex-wrap gap-2 mb-3">
                  {tags.map(tag => (
                    <div key={tag.id} className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full border ${tagColors[tag.color]}`}>
                      <Tag className="h-3 w-3" />
                      <span className="text-sm font-medium">{tag.name}</span>
                      <button onClick={() => removeTag(tag.id)} className="hover:opacity-70">
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  ))}
                </div>
                <div className="flex gap-2">
                  <Input
                    placeholder="Add tag..."
                    value={newTagName}
                    onChange={(e) => setNewTagName(e.target.value)}
                    className="text-sm"
                  />
                  <Select value={newTagColor} onValueChange={(v: any) => setNewTagColor(v)}>
                    <SelectTrigger className="w-32">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="red">Red</SelectItem>
                      <SelectItem value="blue">Blue</SelectItem>
                      <SelectItem value="green">Green</SelectItem>
                      <SelectItem value="yellow">Yellow</SelectItem>
                      <SelectItem value="purple">Purple</SelectItem>
                      <SelectItem value="pink">Pink</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button onClick={addTag} size="sm"><Plus className="h-4 w-4" /></Button>
                </div>
              </div>

              {/* Description Section */}
              <div className="mb-12">
                <div className="flex items-center gap-2 mb-4">
                  <AlignLeft className="h-6 w-6 text-muted-foreground" />
                  <h2 className="font-bold text-xl">Description</h2>
                </div>
                {editingDescription ? (
                  <div className="space-y-2">
                    <Textarea
                      value={editedDescription}
                      onChange={(e) => setEditedDescription(e.target.value)}
                      placeholder="Add a more detailed description..."
                      className="min-h-[150px] text-base"
                      autoFocus
                    />
                    <div className="flex gap-2">
                      <Button onClick={handleDescriptionSave}>Save</Button>
                      <Button
                        variant="ghost"
                        onClick={() => {
                          setEditedDescription(task.description || "")
                          setEditingDescription(false)
                        }}
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div
                    className="text-base text-muted-foreground leading-relaxed cursor-pointer hover:bg-muted/50 p-4 rounded-lg transition-colors min-h-[100px]"
                    onClick={() => {
                      setEditedDescription(task.description || "")
                      setEditingDescription(true)
                    }}
                  >
                    {task.description || "Click to add a description..."}
                  </div>
                )}
              </div>

              {/* Checklist Section */}
              <div className="mb-12">
                <div className="flex items-center gap-2 mb-4">
                  <CheckSquare className="h-6 w-6 text-muted-foreground" />
                  <h2 className="font-bold text-xl">Checklist</h2>
                  <div className="ml-auto text-sm font-semibold text-primary">{checklistCompletion}%</div>
                </div>
                
                {/* Progress Bar */}
                <div className="mb-4 h-2 bg-muted rounded-full overflow-hidden">
                  <div className="h-full bg-primary transition-all" style={{ width: `${checklistCompletion}%` }} />
                </div>

                {/* Checklist Items */}
                <div className="space-y-2 mb-4">
                  {checklist.map(item => (
                    <div key={item.id} className="flex items-center gap-3 p-3 border rounded-lg hover:bg-muted/50 transition-colors">
                      <button
                        onClick={() => toggleChecklistItem(item.id)}
                        className={`flex-shrink-0 w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${
                          item.completed 
                            ? "bg-primary border-primary" 
                            : "border-gray-300 hover:border-primary"
                        }`}
                      >
                        {item.completed && <Check className="h-4 w-4 text-white" />}
                      </button>
                      <span className={item.completed ? "line-through text-muted-foreground" : ""}>
                        {item.title}
                      </span>
                      <button
                        onClick={() => removeChecklistItem(item.id)}
                        className="ml-auto text-muted-foreground hover:text-foreground"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                </div>

                {/* Add Checklist Item */}
                <div className="flex gap-2">
                  <Input
                    placeholder="Add checklist item..."
                    value={newChecklistItem}
                    onChange={(e) => setNewChecklistItem(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && addChecklistItem()}
                  />
                  <Button onClick={addChecklistItem} size="sm"><Plus className="h-4 w-4" /></Button>
                </div>
              </div>

              {/* Comments Section */}
              <div className="mb-8">
                <div className="flex items-center gap-2 mb-4">
                  <MessageSquare className="h-6 w-6 text-muted-foreground" />
                  <h2 className="font-bold text-xl">Activity & Comments</h2>
                </div>

                {/* Add Comment */}
                <div className="mb-6 p-4 border rounded-lg bg-muted/20">
                  <div className="flex gap-3 mb-3">
                    <UserAvatar name="Current User" size="md" />
                    <div className="flex-1">
                      <Textarea
                        value={newComment}
                        onChange={(e) => setNewComment(e.target.value)}
                        placeholder="Write a comment... Use @name to mention team members"
                        className="mb-2"
                        rows={3}
                      />
                      <Button onClick={handleAddComment} disabled={!newComment.trim()}>
                        Add Comment
                      </Button>
                    </div>
                  </div>
                </div>

                {/* Comments List */}
                <div className="space-y-4">
                  {comments.map((comment) => (
                    <div key={comment.id} className="flex gap-3">
                      <UserAvatar name={comment.author} size="md" />
                      <div className="flex-1">
                        <div className="bg-muted rounded-lg p-4">
                          <div className="flex items-center gap-2 mb-2">
                            <span className="font-semibold text-sm">{comment.author}</span>
                            <span className="text-xs text-muted-foreground">
                              {formatDate(comment.createdAt)}
                            </span>
                          </div>
                          <p className="text-sm whitespace-pre-wrap">
                            {comment.text.split(/(@\w+)/g).map((part, idx) =>
                              part.startsWith("@") ? (
                                <span key={idx} className="bg-primary/10 text-primary font-semibold px-1 rounded">
                                  {part}
                                </span>
                              ) : (
                                part
                              )
                            )}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Sidebar - Right Side */}
          <div className="w-96 border-l bg-gradient-to-b from-muted/30 to-muted/10 overflow-y-auto">
            <div className="p-8 space-y-8">
              <div>
                <label className="text-sm font-medium text-muted-foreground mb-2 block">Status</label>
                <Select
                  value={task.status}
                  onValueChange={(value) => handleQuickUpdate("status", value)}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="TODO">To Do</SelectItem>
                    <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
                    <SelectItem value="DONE">Done</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-sm font-medium text-muted-foreground mb-2 block">Priority</label>
                <Select
                  value={task.priority || "medium"}
                  onValueChange={(value) => handleQuickUpdate("priority", value)}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="urgent">Urgent</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-sm font-medium text-muted-foreground mb-2 block">Due Date</label>
                <Input
                  type="date"
                  value={task.dueDate ? new Date(task.dueDate).toISOString().split("T")[0] : ""}
                  onChange={(e) =>
                    handleQuickUpdate("dueDate", e.target.value ? new Date(e.target.value) : undefined)
                  }
                  className={taskOverdue ? "border-red-500" : ""}
                />
                {taskOverdue && <p className="text-xs text-red-600 mt-1">Overdue</p>}
              </div>

              <div>
                <label className="text-sm font-medium text-muted-foreground mb-2 block">Assignee</label>
                <div className="flex items-center gap-2 p-2 border rounded-lg">
                  {task.assignee ? (
                    <>
                      <UserAvatar name={task.assignee.name} size="sm" />
                      <span className="text-sm font-medium">{task.assignee.name}</span>
                    </>
                  ) : (
                    <span className="text-sm text-muted-foreground">Unassigned</span>
                  )}
                </div>
              </div>

              <div className="pt-4 border-t">
                <div className="space-y-3 text-sm">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <User className="h-4 w-4" />
                    <span>Created by {task.creator?.name}</span>
                  </div>
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Clock className="h-4 w-4" />
                    <span>{formatDate(task.createdAt)}</span>
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t space-y-2">
                <Button variant="outline" className="w-full justify-start" size="sm">
                  <Link2 className="h-4 w-4 mr-2" />
                  Copy Link
                </Button>
                <Button variant="outline" className="w-full justify-start text-red-600 hover:text-red-700" size="sm">
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete Task
                </Button>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
