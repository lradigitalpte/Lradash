"use client"

import { X, UserPlus } from "lucide-react"
import { useState, useEffect } from "react"
import { toast } from "sonner"

import { UserAvatar } from "@/components/common"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { apiClient } from "@/lib/api/client"
import { cn } from "@/lib/utils"

interface User {
  _id: string
  name: string
  email: string
  avatar?: string
}

interface ChangeTaskOwnerModalProps {
  task?: {
    _id: string
    title: string
    assignee?: { id: string; name: string }
  }
  open: boolean
  onOpenChange: (open: boolean) => void
  onTaskUpdated?: (task: any) => void
}

export function ChangeTaskOwnerModal({
  task,
  open,
  onOpenChange,
  onTaskUpdated
}: ChangeTaskOwnerModalProps) {
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null)

  useEffect(() => {
    if (open) {
      fetchUsers()
    }
  }, [open])

  useEffect(() => {
    if (task?.assignee?.id) {
      setSelectedUserId(task.assignee.id)
    }
  }, [task?.assignee?.id])

  const fetchUsers = async () => {
    try {
      setLoading(true)
      const response = await apiClient.get(`/api/users/search?username=${searchQuery}`)
      if (response.ok) {
        const data = await response.json()
        setUsers(data.users || [])
      }
    } catch (error) {
      console.error("Failed to search users:", error)
      toast.error("Failed to fetch users")
    } finally {
      setLoading(false)
    }
  }

  const handleSearch = async (query: string) => {
    setSearchQuery(query)
    await fetchUsers()
  }

  const handleSubmit = async () => {
    if (!task || !selectedUserId) {
      return
    }

    setLoading(true)
    try {
      const response = await apiClient.patch(`/api/tasks/${task._id}`, {
        assignee: selectedUserId
      })

      if (response.ok) {
        const updatedTask = await response.json()
        toast.success(
          `Task assigned to ${users.find((u) => u._id === selectedUserId)?.name || "Selected user"}`
        )
        onTaskUpdated?.(updatedTask)
        onOpenChange(false)
      } else {
        const errorData = await response.json()
        toast.error(errorData.error || "Failed to assign task")
      }
    } catch (error) {
      console.error("Error assigning task:", error)
      toast.error("Failed to assign task")
    } finally {
      setLoading(false)
    }
  }

  const handleUnassign = async () => {
    if (!task) {
      return
    }

    setLoading(true)
    try {
      const response = await apiClient.patch(`/api/tasks/${task._id}`, {
        assignee: null
      })

      if (response.ok) {
        const updatedTask = await response.json()
        toast.success("Task unassigned")
        onTaskUpdated?.(updatedTask)
        onOpenChange(false)
      } else {
        const errorData = await response.json()
        toast.error(errorData.error || "Failed to unassign task")
      }
    } catch (error) {
      console.error("Error unassigning task:", error)
      toast.error("Failed to unassign task")
    } finally {
      setLoading(false)
    }
  }

  const filteredUsers = users.filter(
    (user) =>
      user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg rounded-[2.5rem] border-white/20 bg-white/80 p-0 pt-0 shadow-2xl shadow-slate-200/50 backdrop-blur-2xl dark:border-slate-800/50 dark:bg-slate-900/80">
        <div className="flex h-full flex-col overflow-hidden">
          {/* Header */}
          <div className="relative px-10 pt-12 pb-6">
            <div className="flex items-center justify-between">
              <div>
                <DialogTitle className="text-2xl font-black tracking-tight text-slate-900 uppercase dark:text-white">
                  Change Task Owner
                </DialogTitle>
                <p className="mt-1 text-sm font-medium text-slate-500">
                  Assign this task to another team member
                </p>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => {
                  onOpenChange(false)
                }}
                className="h-10 w-10 rounded-xl text-slate-400 hover:bg-white/50 hover:text-slate-600 dark:hover:bg-slate-800"
              >
                <X className="h-5 w-5" />
              </Button>
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto px-10 pb-12">
            {/* Current Assignee */}
            {task?.assignee && (
              <div className="mb-6 space-y-3">
                <h3 className="text-[10px] font-black tracking-[0.2em] text-slate-400 uppercase">
                  Currently Assigned To
                </h3>
                <div className="group flex items-center gap-3 rounded-2xl border border-slate-100 bg-slate-50 py-2 pr-2 pl-4 shadow-sm dark:border-slate-800/50 dark:bg-slate-800/50">
                  <UserAvatar name={task.assignee.name} size="sm" />
                  <div className="flex-1">
                    <span className="text-sm font-bold text-slate-700 dark:text-slate-300">
                      {task.assignee.name}
                    </span>
                    <p className="text-[9px] font-bold tracking-widest text-slate-400 uppercase">
                      Assignee
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Search */}
            <div className="mb-6">
              <div className="relative">
                <UserPlus className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <Input
                  placeholder="Search team members..."
                  value={searchQuery}
                  onChange={async (e) => handleSearch(e.target.value)}
                  className="h-12 rounded-2xl border-slate-200 bg-slate-50 pl-10 text-sm font-medium focus-visible:ring-blue-500/20 dark:border-slate-800 dark:bg-slate-800"
                />
              </div>
            </div>

            {/* User List */}
            <div className="space-y-2">
              {loading && users.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-slate-400">
                  <div className="mb-3 h-6 w-6 animate-spin rounded-full border-2 border-slate-300 border-t-blue-500" />
                  <span className="text-[10px] font-black tracking-widest uppercase">
                    Loading team members...
                  </span>
                </div>
              ) : filteredUsers.length > 0 ? (
                <div className="space-y-2">
                  <h3 className="text-[10px] font-black tracking-[0.2em] text-slate-400 uppercase">
                    Available Team Members
                  </h3>
                  {filteredUsers.map((user) => (
                    <button
                      key={user._id}
                      onClick={() => {
                        setSelectedUserId(user._id)
                      }}
                      className={cn(
                        "group flex w-full items-center gap-3 rounded-2xl p-3 text-left transition-all hover:bg-slate-50 dark:hover:bg-slate-800/50",
                        selectedUserId === user._id &&
                          "border-2 border-blue-500 bg-blue-50/50 dark:bg-blue-900/20"
                      )}
                    >
                      <UserAvatar name={user.name} size="sm" />
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-black tracking-tight text-slate-900 uppercase dark:text-white">
                          {user.name}
                        </p>
                        <p className="truncate text-[9px] font-bold tracking-widest text-slate-400 uppercase">
                          {user.email}
                        </p>
                      </div>
                      {selectedUserId === user._id && (
                        <div className="flex h-6 w-6 items-center justify-center rounded-full bg-blue-600 text-white shadow-lg shadow-blue-500/20">
                          <svg
                            className="h-3.5 w-3.5 stroke-[3]"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              d="M4.5 12.75l6 6 9-13.5"
                            />
                          </svg>
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              ) : searchQuery ? (
                <div className="flex flex-col items-center justify-center py-12 text-slate-400">
                  <p className="text-[10px] font-black tracking-widest uppercase">
                    No team members found matching "{searchQuery}"
                  </p>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-12 text-slate-400">
                  <p className="text-[10px] font-black tracking-widest uppercase">
                    No team members available
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Footer */}
          <div className="border-t border-slate-100 bg-white/50 dark:border-slate-800 dark:bg-slate-900/50">
            <div className="flex items-center justify-between px-10 py-6">
              <Button
                variant="ghost"
                onClick={handleUnassign}
                disabled={!task?.assignee || loading}
                className="h-10 rounded-xl px-6 text-[10px] font-bold tracking-widest uppercase hover:bg-slate-50 hover:text-red-600 dark:hover:bg-slate-800"
              >
                Unassign Task
              </Button>
              <div className="flex gap-3">
                <Button
                  variant="outline"
                  onClick={() => {
                    onOpenChange(false)
                  }}
                  className="h-10 rounded-xl border-slate-200 px-6 text-[10px] font-bold tracking-widest uppercase hover:bg-slate-50 dark:border-slate-800 dark:hover:bg-slate-800"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleSubmit}
                  disabled={!selectedUserId || loading}
                  className="h-10 rounded-xl bg-slate-900 px-6 font-bold text-white shadow-lg hover:bg-blue-600 dark:bg-white dark:text-slate-900 dark:hover:bg-blue-600"
                >
                  <UserPlus className="mr-2 h-4 w-4" />
                  {loading ? "Assigning..." : "Assign Task"}
                </Button>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
