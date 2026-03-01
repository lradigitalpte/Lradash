"use client"

import { Search, UserPlus, Check, Loader2 } from "lucide-react"
import { useState, useEffect } from "react"

import { UserAvatar } from "@/components/common"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { apiClient } from "@/lib/api/client"
import { cn } from "@/lib/utils"

interface User {
  _id: string
  name: string
  email: string
  avatar?: string
}

interface MemberPickerProps {
  onSelect: (user: User) => void
  currentAssigneeId?: string
  projectId?: string
  className?: string
}

export function MemberPicker({
  onSelect,
  currentAssigneeId,
  projectId,
  className
}: MemberPickerProps) {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState("")
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(false)

  const fetchUsers = async (searchQuery: string) => {
    try {
      setLoading(true)
      const endpoint = projectId
        ? `/api/projects/${projectId}/members`
        : `/api/users/search?username=${searchQuery}`
      const response = await apiClient.get(endpoint)
      if (response.ok) {
        const data = await response.json()
        // members endpoint returns array directly; users/search returns { users: [] }
        const list: User[] = Array.isArray(data) ? data : data.users || []
        // local filter when using members endpoint
        setUsers(
          searchQuery && projectId
            ? list.filter(
                (u) =>
                  u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                  u.email.toLowerCase().includes(searchQuery.toLowerCase())
              )
            : list
        )
      }
    } catch (error) {
      console.error("Failed to fetch members:", error)
    } finally {
      setLoading(false)
    }
  }

  // Fetch full member list once when popover opens
  useEffect(() => {
    if (open) {
      fetchUsers(projectId ? "" : query)
    }
  }, [open])

  // When no projectId, re-fetch on server for each query change
  useEffect(() => {
    if (open && !projectId) {
      fetchUsers(query)
    }
  }, [query])

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className={cn(
            "h-10 rounded-xl border-dashed border-slate-300 px-4 text-[9px] font-bold tracking-widest text-slate-400 uppercase hover:border-blue-500/30 hover:text-blue-600",
            className
          )}
        >
          <UserPlus className="mr-2 h-3.5 w-3.5" />
          Assign Operator
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className="w-75 overflow-hidden rounded-3xl border-slate-200 bg-white/90 p-0 shadow-2xl backdrop-blur-xl dark:border-slate-800 dark:bg-slate-900/90"
        align="start"
      >
        <div className="border-b border-slate-100 bg-slate-50/50 p-4 dark:border-slate-800 dark:bg-slate-800/30">
          <div className="relative">
            <Search className="absolute top-1/2 left-3 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
            <Input
              placeholder="Search neuro-linked operators..."
              value={query}
              onChange={(e) => {
                setQuery(e.target.value)
              }}
              className="h-10 rounded-xl border-slate-200 bg-white pl-9 text-xs font-medium focus-visible:ring-blue-500/20 dark:border-slate-800 dark:bg-slate-950"
            />
          </div>
        </div>
        <div className="custom-scrollbar max-h-75 overflow-y-auto p-2">
          {loading && users.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-slate-400">
              <Loader2 className="mb-3 h-6 w-6 animate-spin opacity-20" />
              <span className="text-[10px] font-black tracking-widest uppercase">
                Scanning Grid...
              </span>
            </div>
          ) : users.length > 0 ? (
            <div className="space-y-1">
              {users.map((user) => (
                <button
                  key={user._id}
                  onClick={() => {
                    onSelect(user)
                    setOpen(false)
                  }}
                  className="group flex w-full items-center gap-3 rounded-2xl p-3 text-left transition-all hover:bg-slate-50 dark:hover:bg-slate-800/50"
                >
                  <UserAvatar name={user.name} size="sm" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-xs font-black tracking-tight text-slate-900 uppercase dark:text-white">
                      {user.name}
                    </p>
                    <p className="truncate text-[10px] font-bold tracking-widest text-slate-400 uppercase">
                      {user.email}
                    </p>
                  </div>
                  {currentAssigneeId === user._id && (
                    <div className="flex h-6 w-6 items-center justify-center rounded-full bg-blue-600 text-white shadow-lg shadow-blue-500/20">
                      <Check className="h-3.5 w-3.5 stroke-3" />
                    </div>
                  )}
                </button>
              ))}
            </div>
          ) : (
            <div className="py-12 text-center">
              <p className="text-[10px] font-black tracking-widest text-slate-400 uppercase">
                No operators found
              </p>
            </div>
          )}
        </div>
      </PopoverContent>
    </Popover>
  )
}
