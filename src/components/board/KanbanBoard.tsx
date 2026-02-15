"use client"

import { Plus } from "lucide-react"
import { useState, useEffect, useCallback } from "react"

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { apiClient } from "@/lib/api/client"

import { TaskCard, Task } from "./TaskCard"

interface List {
  id: string
  title: string
  description?: string
  position: number
  cardIds: string[]
}

interface KanbanBoardProps {
  boardId: string
  onTaskUpdated?: (task: Task) => void
  onTaskCreated?: () => void
}

export function KanbanBoard({ boardId, onTaskUpdated, onTaskCreated }: KanbanBoardProps) {
  const [lists, setLists] = useState<List[]>([])
  const [tasks, setTasks] = useState<Record<string, Task>>({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [taskDialogOpen, setTaskDialogOpen] = useState(false)
  const [newTaskTitle, setNewTaskTitle] = useState("")
  const [newTaskDescription, setNewTaskDescription] = useState("")
  const [newTaskListId, setNewTaskListId] = useState("")
  const [creatingTask, setCreatingTask] = useState(false)

  useEffect(() => {
    fetchBoardData()
  }, [boardId])

  const fetchBoardData = async () => {
    try {
      setLoading(true)

      // Fetch lists
      const listsResponse = await apiClient.get(`/api/boards/${boardId}/lists`)
      if (!listsResponse.ok) {
        setError("Failed to fetch lists")
        return
      }
      const listsData = await listsResponse.json()
      setLists(listsData)

      // Get project ID from board (we'll need to get the board first)
      const boardResponse = await apiClient.get(`/api/boards/${boardId}`)
      if (!boardResponse.ok) {
        setError("Failed to fetch board")
        return
      }

      const boardData = await boardResponse.json()
      const projectId = boardData.projectId

      // Fetch all tasks for the project
      const tasksResponse = await apiClient.get(`/api/projects/${projectId}/tasks`)
      if (tasksResponse.ok) {
        const allTasks = await tasksResponse.json()

        // Filter tasks to only show those in the board's lists
        const taskIdsInLists = listsData.flatMap((list: List) => list.cardIds)
        const filteredTasks = allTasks.filter((task: Task) => taskIdsInLists.includes(task._id))

        // Convert to record for easier lookup
        const tasksData: Record<string, Task> = {}
        filteredTasks.forEach((task: Task) => {
          tasksData[task._id] = task
        })

        setTasks(tasksData)
      }
    } catch (err) {
      setError("Failed to load board data")
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const handleCreateTask = async () => {
    if (!newTaskTitle.trim() || !newTaskListId) {
      return
    }

    try {
      setCreatingTask(true)

      // Get project ID from board
      const boardResponse = await apiClient.get(`/api/boards/${boardId}`)
      if (!boardResponse.ok) {
        setError("Failed to fetch board")
        return
      }

      const boardData = await boardResponse.json()
      const projectId = boardData.projectId

      // Create the task in the project
      const taskResponse = await apiClient.post(`/api/projects/${projectId}/tasks`, {
        title: newTaskTitle.trim(),
        description: newTaskDescription.trim() || undefined,
        status: "TODO", // Default status
        priority: "MEDIUM" // Default priority
      })

      if (taskResponse.ok) {
        const taskData = await taskResponse.json()

        // Add task to the selected list
        const listResponse = await apiClient.patch(
          `/api/boards/${boardId}/lists/${newTaskListId}`,
          {
            cardIds: [...(lists.find((l) => l.id === newTaskListId)?.cardIds || []), taskData._id]
          }
        )

        if (listResponse.ok) {
          // Update local state
          const updatedTasks = { ...tasks }
          updatedTasks[taskData._id] = taskData
          setTasks(updatedTasks)

          // Reset form
          setNewTaskTitle("")
          setNewTaskDescription("")
          setNewTaskListId("")
          setTaskDialogOpen(false)

          // Refresh board data to ensure consistency
          await fetchBoardData()

          // Notify parent component
          onTaskCreated?.()
        } else {
          console.error("Failed to add task to list")
        }
      }
    } catch (error) {
      console.error("Failed to create task:", error)
    } finally {
      setCreatingTask(false)
    }
  }

  const handleTaskMove = async (taskId: string, newListId: string) => {
    try {
      // Get the task to determine new status
      const task = tasks[taskId]
      if (!task) {
        return
      }

      // Find the source list (where the task currently is)
      const sourceList = lists.find((list) => list.cardIds.includes(taskId))

      // Map listId to status
      const statusMap: Record<string, Task["status"]> = {
        todo: "TODO",
        "in-progress": "IN_PROGRESS",
        done: "DONE"
      }

      const newStatus = statusMap[newListId] || task.status

      // Update task status in the database
      const response = await apiClient.patch(`/api/tasks/${taskId}`, {
        status: newStatus
      })

      if (response.ok) {
        // If the task is moving between lists, update the list's cardIds
        if (sourceList && sourceList.id !== newListId) {
          // Remove task from source list
          await apiClient.patch(`/api/boards/${boardId}/lists/${sourceList.id}`, {
            cardIds: sourceList.cardIds.filter((id) => id !== taskId)
          })

          // Add task to destination list
          const destinationList = lists.find((list) => list.id === newListId)
          if (destinationList) {
            await apiClient.patch(`/api/boards/${boardId}/lists/${newListId}`, {
              cardIds: [...destinationList.cardIds, taskId]
            })
          }
        }

        // Update local state
        const updatedTasks = { ...tasks }
        updatedTasks[taskId] = {
          ...updatedTasks[taskId],
          status: newStatus
        }
        setTasks(updatedTasks)

        // Refetch board data to ensure consistency
        await fetchBoardData()

        // Notify parent component
        onTaskUpdated?.(updatedTasks[taskId])
      } else {
        console.error("Failed to update task status")
      }
    } catch (error) {
      console.error("Failed to move task:", error)
    }
  }

  const handleDeleteTask = async (taskId: string) => {
    try {
      // Remove task from its list
      const task = tasks[taskId]
      if (!task) {
        return
      }

      // Find which list contains this task
      for (const list of lists) {
        if (list.cardIds.includes(taskId)) {
          await apiClient.patch(`/api/boards/${boardId}/lists/${list.id}`, {
            cardIds: list.cardIds.filter((id) => id !== taskId)
          })
          break
        }
      }

      // Delete the task
      await apiClient.delete(`/api/tasks/${taskId}`)

      // Update local state
      const updatedTasks = { ...tasks }
      delete updatedTasks[taskId]
      setTasks(updatedTasks)

      // Refresh board data
      await fetchBoardData()
    } catch (error) {
      console.error("Failed to delete task:", error)
    }
  }

  const handleAssigneeChange = async (taskId: string, assignee?: any) => {
    try {
      // The API expects just the user ID, not the full user object
      const assigneeId = assignee ? assignee.id : null

      const response = await apiClient.patch(`/api/tasks/${taskId}`, {
        assignee: assigneeId
      })

      if (response.ok) {
        const taskData = await response.json()

        // Update local state
        const updatedTasks = { ...tasks }
        updatedTasks[taskId] = taskData
        setTasks(updatedTasks)

        // Refresh board data to ensure consistency
        await fetchBoardData()
      }
    } catch (error) {
      console.error("Failed to update task assignee:", error)
    }
  }

  const handleEditTask = async (updatedTask: Task) => {
    try {
      const response = await apiClient.patch(`/api/tasks/${updatedTask._id}`, {
        title: updatedTask.title,
        description: updatedTask.description
      })

      if (response.ok) {
        // Update local state
        const updatedTasks = { ...tasks }
        updatedTasks[updatedTask._id] = updatedTask
        setTasks(updatedTasks)

        // Refresh board data to ensure consistency
        await fetchBoardData()
      }
    } catch (error) {
      console.error("Failed to update task:", error)
    }
  }

  const handleDragStart = (e: React.DragEvent, taskId: string) => {
    e.dataTransfer.setData("taskId", taskId)
    e.dataTransfer.effectAllowed = "move"
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = "move"
  }

  const handleDrop = async (e: React.DragEvent, listId: string) => {
    e.preventDefault()
    const taskId = e.dataTransfer.getData("taskId")

    if (taskId) {
      await handleTaskMove(taskId, listId)
    }
  }

  const getListTitle = (listId: string) => {
    switch (listId) {
      case "todo":
        return "To Do"
      case "in-progress":
        return "In Progress"
      case "done":
        return "Done"
      default:
        return lists.find((l) => l.id === listId)?.title || "List"
    }
  }

  if (loading) {
    return (
      <div className="flex h-[500px] flex-col items-center justify-center space-y-4">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-blue-500 border-t-transparent" />
        <p className="text-sm text-slate-500">Loading board...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex h-[500px] flex-col items-center justify-center space-y-4">
        <p className="text-sm text-rose-500">Error: {error}</p>
        <Button onClick={fetchBoardData} variant="outline">
          Retry
        </Button>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {lists.map((list) => (
        <div
          key={list.id}
          className="flex h-full flex-col rounded-2xl border border-slate-200 bg-white shadow-sm transition-all hover:shadow-md dark:border-slate-800 dark:bg-slate-900"
          onDragOver={handleDragOver}
          onDrop={async (e) => handleDrop(e, list.id)}
        >
          {/* List Header */}
          <div className="flex h-14 items-center justify-between border-b border-slate-100 px-4 pb-3 dark:border-slate-800">
            <div className="flex items-center gap-2">
              <div className="h-2 w-2 rounded-full bg-slate-300" />
              <h3 className="font-bold text-slate-900 dark:text-white">{getListTitle(list.id)}</h3>
            </div>
            <div className="text-xs text-slate-400">{list.cardIds.length}</div>
          </div>

          {/* List Content */}
          <div className="flex-1 space-y-3 overflow-y-auto p-4">
            {list.cardIds.length > 0 ? (
              list.cardIds.map((taskId) => {
                const task = tasks[taskId]
                if (!task) {
                  return null
                }

                return (
                  <TaskCard
                    key={taskId}
                    task={task}
                    onEdit={handleEditTask}
                    onDelete={(taskId) => {
                      // Implement delete functionality
                      handleDeleteTask(taskId)
                    }}
                    onAssigneeChange={(taskId, assignee) => {
                      // Implement assignee change functionality
                      handleAssigneeChange(taskId, assignee)
                    }}
                  />
                )
              })
            ) : (
              <div className="flex flex-col items-center justify-center space-y-2 py-8 text-slate-400">
                <div className="h-8 w-8 rounded-full bg-slate-100 dark:bg-slate-800" />
                <p className="text-sm">No tasks in this list</p>
              </div>
            )}
          </div>

          {/* Add Task Button */}
          <div className="border-t border-slate-100 p-3 dark:border-slate-800">
            <Dialog open={taskDialogOpen} onOpenChange={setTaskDialogOpen}>
              <DialogTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 w-full text-xs font-medium text-slate-500 hover:bg-slate-50 hover:text-slate-700 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-300"
                >
                  <Plus className="mr-1 h-3 w-3" />
                  Add Task
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                  <DialogTitle>Create New Task</DialogTitle>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid gap-2">
                    <label htmlFor="taskTitle" className="text-sm font-medium">
                      Title *
                    </label>
                    <Input
                      id="taskTitle"
                      value={newTaskTitle}
                      onChange={(e) => {
                        setNewTaskTitle(e.target.value)
                      }}
                      placeholder="Enter task title..."
                      className="col-span-2"
                    />
                  </div>
                  <div className="grid gap-2">
                    <label htmlFor="taskDescription" className="text-sm font-medium">
                      Description
                    </label>
                    <Textarea
                      id="taskDescription"
                      value={newTaskDescription}
                      onChange={(e) => {
                        setNewTaskDescription(e.target.value)
                      }}
                      placeholder="Enter task description..."
                      className="col-span-2"
                    />
                  </div>
                  <div className="grid gap-2">
                    <label htmlFor="taskList" className="text-sm font-medium">
                      List
                    </label>
                    <select
                      id="taskList"
                      value={newTaskListId}
                      onChange={(e) => {
                        setNewTaskListId(e.target.value)
                      }}
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:outline-none"
                    >
                      <option value="">Select a list</option>
                      {lists.map((list) => (
                        <option key={list.id} value={list.id}>
                          {list.title}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="flex justify-end space-x-2">
                    <Button
                      variant="outline"
                      onClick={() => {
                        setTaskDialogOpen(false)
                      }}
                      disabled={creatingTask}
                    >
                      Cancel
                    </Button>
                    <Button
                      onClick={handleCreateTask}
                      disabled={!newTaskTitle.trim() || creatingTask}
                    >
                      {creatingTask ? "Creating..." : "Create Task"}
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      ))}
    </div>
  )
}
