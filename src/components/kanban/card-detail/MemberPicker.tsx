"use client"

import { Search, User as UserIcon, X } from "lucide-react"
import { useEffect, useState, useRef } from "react"
import { toast } from "sonner"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { useDebounce } from "@/hooks/useDebounce"

interface User {
  _id: string
  name: string
  email: string
  avatar?: string
}

interface MemberPickerProps {
  currentMembers: any[]
  projectId?: string
  onAssign: (user: User) => void
  onUnassign: (userId: string) => void
}

export function MemberPicker({
  currentMembers,
  projectId,
  onAssign,
  onUnassign
}: MemberPickerProps) {
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState("")
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(false)
  const debouncedSearch = useDebounce(search, 300)

  const [allMembers, setAllMembers] = useState<User[]>([])

  useEffect(() => {
    if (open) {
      fetchUsers()
    }
  }, [open])

  // local filter when projectId is set; server search otherwise
  useEffect(() => {
    if (open && !projectId) {
      fetchUsers()
    }
  }, [debouncedSearch])

  const fetchUsers = async () => {
    setLoading(true)
    try {
      const accessToken = localStorage.getItem("accessToken")
      const endpoint = projectId
        ? `/api/projects/${projectId}/members`
        : `/api/users/search?username=${encodeURIComponent(debouncedSearch)}`
      const response = await fetch(endpoint, {
        headers: { Authorization: `Bearer ${accessToken}` }
      })
      if (response.ok) {
        const data = await response.json()
        const list: User[] = Array.isArray(data) ? data : data.users || []
        if (projectId) {
          setAllMembers(list)
        }
        setUsers(list)
      }
    } catch (error) {
      console.error("Failed to fetch members:", error)
    } finally {
      setLoading(false)
    }
  }

  // When using project members, filter locally on each search change
  useEffect(() => {
    if (projectId && allMembers.length > 0) {
      const q = debouncedSearch.toLowerCase()
      setUsers(
        q
          ? allMembers.filter(
              (u) => u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q)
            )
          : allMembers
      )
    }
  }, [debouncedSearch, allMembers])

  const isAssigned = (userId: string) => {
    return currentMembers.some((m) => m._id === userId || m.id === userId)
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="h-10 w-full justify-start rounded-xl border-slate-200 text-[11px] font-black tracking-wider uppercase transition-all hover:scale-[1.02] hover:border-blue-500/30 hover:bg-slate-50 active:scale-[0.98] dark:border-slate-800 dark:hover:bg-slate-800"
        >
          <UserIcon className="mr-3 h-4 w-4 stroke-[2.5]" />
          Members
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className="w-80 rounded-2xl p-0 shadow-2xl dark:border-slate-800"
        align="start"
      >
        <div className="flex items-center border-b border-slate-100 p-3 dark:border-slate-800">
          <Search className="mr-2 h-4 w-4 text-slate-400" />
          <Input
            placeholder="Search members..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value)
            }}
            className="h-8 border-none bg-transparent p-0 text-xs shadow-none focus-visible:ring-0"
          />
        </div>
        <div className="max-h-64 overflow-y-auto p-2">
          {loading ? (
            <div className="py-8 text-center text-xs text-slate-400">Searching...</div>
          ) : users.length === 0 ? (
            <div className="py-8 text-center text-xs text-slate-400">No users found</div>
          ) : (
            <div className="space-y-1">
              {users.map((user) => (
                <button
                  key={user._id}
                  className="flex w-full items-center justify-between rounded-xl p-2 transition-colors hover:bg-slate-50 dark:hover:bg-slate-800"
                  onClick={() => {
                    if (isAssigned(user._id)) {
                      onUnassign(user._id)
                    } else {
                      onAssign(user)
                    }
                  }}
                >
                  <div className="flex items-center gap-3">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={user.avatar} />
                      <AvatarFallback className="bg-blue-50 text-[10px] font-bold text-blue-600 dark:bg-blue-900/30">
                        {user.name.slice(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="text-left">
                      <p className="text-xs font-bold text-slate-900 dark:text-white">
                        {user.name}
                      </p>
                      <p className="text-[10px] text-slate-400">{user.email}</p>
                    </div>
                  </div>
                  {isAssigned(user._id) && (
                    <div className="rounded-full bg-blue-50 p-1 dark:bg-blue-900/30">
                      <X className="h-3 w-3 text-blue-600" />
                    </div>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>
      </PopoverContent>
    </Popover>
  )
}
