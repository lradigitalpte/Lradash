"use client"

import { format } from "date-fns"
import { Plus, LayoutGrid, Sparkles, Calendar, Users, X, Search } from "lucide-react"
import { useRouter } from "next/navigation"
import { useState, useEffect, useRef } from "react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Calendar as CalendarComponent } from "@/components/ui/calendar"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Textarea } from "@/components/ui/textarea"
import { apiClient } from "@/lib/api/client"
import { cn } from "@/lib/utils"

interface TeamMember {
  id: string
  name: string
  email: string
  avatar?: string
}

export function CreateProjectForm() {
  const [open, setOpen] = useState(false)
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [dueDate, setDueDate] = useState<Date | undefined>()
  const [selectedMembers, setSelectedMembers] = useState<TeamMember[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [availableMembers, setAvailableMembers] = useState<TeamMember[]>([])
  const [searchResults, setSearchResults] = useState<TeamMember[]>([])
  const [loading, setLoading] = useState(false)
  const [searchLoading, setSearchLoading] = useState(false)
  const [showMemberSearch, setShowMemberSearch] = useState(false)
  const router = useRouter()
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  // Fetch organization members when dialog opens
  useEffect(() => {
    if (open) {
      fetchOrganizationMembers()
    }
  }, [open])

  const fetchOrganizationMembers = async () => {
    try {
      const response = await apiClient.get("/api/users/search?username=")
      if (response.ok) {
        const data = await response.json()
        const usersList = data.users || []
        setAvailableMembers(
          Array.isArray(usersList)
            ? usersList.map((user: any) => ({
                id: user._id || user.id,
                name: user.name,
                email: user.email,
                avatar: user.avatar
              }))
            : []
        )
      }
    } catch (error) {
      console.error("Failed to fetch members:", error)
    }
  }

  // Search members with API call and debouncing
  useEffect(() => {
    // Clear previous timeout
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current)
    }

    if (!searchTerm.trim()) {
      setSearchResults([])
      setSearchLoading(false)
      return
    }

    // Set loading state
    setSearchLoading(true)

    // Debounce the search
    searchTimeoutRef.current = setTimeout(async () => {
      try {
        const response = await apiClient.get(
          `/api/users/search?username=${encodeURIComponent(searchTerm)}`
        )
        if (response.ok) {
          const data = await response.json()
          const usersList = data.users || []
          const members = Array.isArray(usersList)
            ? usersList
                .map((user: any) => ({
                  id: user._id || user.id,
                  name: user.name,
                  email: user.email,
                  avatar: user.avatar
                }))
                // Filter out already selected members
                .filter((member) => !selectedMembers.find((m) => m.id === member.id))
            : []
          setSearchResults(members)
        } else {
          setSearchResults([])
        }
      } catch (error) {
        console.error("Search failed:", error)
        setSearchResults([])
      } finally {
        setSearchLoading(false)
      }
    }, 300) // 300ms debounce
  }, [searchTerm, selectedMembers])

  const addMember = (member: TeamMember) => {
    setSelectedMembers([...selectedMembers, member])
    setSearchTerm("")
    setSearchResults([])
  }

  const removeMember = (memberId: string) => {
    setSelectedMembers(selectedMembers.filter((m) => m.id !== memberId))
  }

  const handleSubmit = async () => {
    if (!title.trim()) {
      toast.error("Project title is required")
      return
    }

    setLoading(true)
    try {
      const memberIds = selectedMembers.map((m) => m.id)
      const response = await apiClient.post("/api/projects", {
        title,
        description,
        dueDate: dueDate?.toISOString(),
        memberIds
      })

      if (!response.ok) {
        const data = await response.json()
        toast.error(data.error || "Failed to create project")
        return
      }

      toast.success("Project created successfully!")
      setTitle("")
      setDescription("")
      setDueDate(undefined)
      setSelectedMembers([])
      setOpen(false)
      router.refresh()
    } catch (error) {
      console.error("Create project error:", error)
      toast.error("Failed to create project")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          size="lg"
          className="group relative h-14 gap-3 overflow-hidden rounded-2xl bg-slate-900 px-8 text-sm font-black tracking-widest text-white uppercase shadow-2xl transition-all hover:scale-105 dark:bg-white dark:text-slate-900"
        >
          <div className="absolute inset-0 bg-gradient-to-r from-blue-600/20 to-indigo-600/20 opacity-0 transition-opacity group-hover:opacity-100" />
          <Plus className="h-5 w-5 stroke-[3]" />
          New Project
        </Button>
      </DialogTrigger>
      <DialogContent className="overflow-hidden rounded-[2.5rem] border-white/20 bg-white/80 p-0 shadow-2xl backdrop-blur-2xl sm:max-w-[600px] dark:border-slate-800/50 dark:bg-slate-950/80">
        <div className="relative p-10">
          <div className="pointer-events-none absolute -top-24 -right-24 h-64 w-64 rounded-full bg-blue-500/10 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-24 -left-24 h-64 w-64 rounded-full bg-indigo-500/10 blur-3xl" />

          <DialogHeader className="mb-8 space-y-4">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-600 text-white shadow-lg shadow-blue-500/20">
                <LayoutGrid className="h-6 w-6" />
              </div>
              <div className="space-y-1">
                <DialogTitle className="text-3xl font-black tracking-tight text-slate-900 uppercase dark:text-white">
                  New Project
                </DialogTitle>
                <DialogDescription className="font-medium text-slate-500 italic">
                  Create a new workspace for your team collaboration
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          <div className="space-y-6">
            <div className="space-y-3">
              <Label
                htmlFor="title"
                className="ml-1 text-[10px] font-black tracking-[0.2em] text-slate-400 uppercase"
              >
                Project Title
              </Label>
              <Input
                id="title"
                placeholder="e.g., Q1 Marketing Campaign"
                className="h-14 rounded-2xl border-none bg-slate-50 px-6 font-bold shadow-inner transition-all focus:ring-4 focus:ring-blue-500/10 dark:bg-slate-900"
                value={title}
                onChange={(e) => {
                  setTitle(e.target.value)
                }}
                disabled={loading}
              />
            </div>
            <div className="space-y-3">
              <Label
                htmlFor="description"
                className="ml-1 text-[10px] font-black tracking-[0.2em] text-slate-400 uppercase"
              >
                Description
              </Label>
              <Textarea
                id="description"
                placeholder="Outline the goals and scope of this project..."
                className="min-h-[100px] resize-none rounded-2xl border-none bg-slate-50 px-6 py-4 font-medium italic shadow-inner transition-all focus:ring-4 focus:ring-blue-500/10 dark:bg-slate-900"
                value={description}
                onChange={(e) => {
                  setDescription(e.target.value)
                }}
                disabled={loading}
              />
            </div>

            {/* Deadline Field */}
            <div className="space-y-3">
              <Label className="ml-1 text-[10px] font-black tracking-[0.2em] text-slate-400 uppercase">
                Project Deadline
              </Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className="w-full justify-start rounded-2xl border-none bg-slate-50 px-6 py-6 font-medium text-slate-900 dark:bg-slate-900 dark:text-white"
                  >
                    <Calendar className="mr-3 h-4 w-4" />
                    {dueDate ? format(dueDate, "PPP") : "Select deadline..."}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto rounded-2xl p-0" align="start">
                  <CalendarComponent
                    mode="single"
                    selected={dueDate}
                    onSelect={setDueDate}
                    disabled={(date) => date < new Date()}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>

            {/* Team Members Field */}
            <div className="space-y-3">
              <Label className="ml-1 text-[10px] font-black tracking-[0.2em] text-slate-400 uppercase">
                <Users className="mr-2 inline h-3 w-3" />
                Add Team Members
              </Label>
              <div className="relative">
                <div className="relative">
                  <Input
                    placeholder="Search team members by name or email..."
                    value={searchTerm}
                    onChange={(e) => {
                      setSearchTerm(e.target.value)
                    }}
                    onFocus={() => {
                      setShowMemberSearch(true)
                    }}
                    onBlur={() => {
                      // Delay hiding to allow click to register
                      setTimeout(() => {
                        setShowMemberSearch(false)
                      }, 200)
                    }}
                    className="h-12 rounded-2xl border-none bg-slate-50 px-6 pr-12 font-medium shadow-inner focus:ring-4 focus:ring-blue-500/10 dark:bg-slate-900"
                    disabled={loading}
                    autoComplete="off"
                  />
                  {searchLoading && (
                    <div className="absolute top-3.5 right-4 h-5 w-5 animate-spin rounded-full border-2 border-slate-300 border-t-blue-600" />
                  )}
                  {!searchLoading && (
                    <Search className="absolute top-3.5 right-4 h-5 w-5 text-slate-400" />
                  )}
                </div>

                {/* Search Results Dropdown */}
                {showMemberSearch && (
                  <div className="absolute top-full right-0 left-0 z-50 mt-2 max-h-64 overflow-y-auto rounded-2xl border border-slate-200 bg-white shadow-xl dark:border-slate-700 dark:bg-slate-800">
                    {searchLoading && (
                      <div className="px-6 py-4 text-center text-sm text-slate-400">
                        <div className="mr-2 inline-block h-5 w-5 animate-spin rounded-full border-2 border-slate-300 border-t-blue-600" />
                        Searching...
                      </div>
                    )}
                    {!searchLoading && searchTerm.trim() && searchResults.length === 0 && (
                      <div className="px-6 py-4 text-center text-sm text-slate-400">
                        No members found for "{searchTerm}"
                      </div>
                    )}
                    {!searchLoading && !searchTerm.trim() && (
                      <>
                        {availableMembers.length > 0 ? (
                          <>
                            <div className="border-b border-slate-50 px-6 py-2 text-[10px] font-bold tracking-wider text-slate-400 uppercase dark:border-slate-700/50">
                              Suggested Members
                            </div>
                            {availableMembers
                              .filter((member) => !selectedMembers.find((m) => m.id === member.id))
                              .slice(0, 5)
                              .map((member) => (
                                <button
                                  key={member.id}
                                  onMouseDown={(e) => {
                                    e.preventDefault()
                                    addMember(member)
                                  }}
                                  className="w-full border-b border-slate-100 px-6 py-3 text-left transition-colors last:border-0 hover:bg-slate-100 dark:border-slate-700 dark:hover:bg-slate-700"
                                >
                                  <div className="text-sm font-bold text-slate-900 dark:text-white">
                                    {member.name}
                                  </div>
                                  <div className="text-[11px] text-slate-500 dark:text-slate-400">
                                    {member.email}
                                  </div>
                                </button>
                              ))}
                          </>
                        ) : (
                          <div className="px-6 py-3 text-sm text-slate-500 italic">
                            Type a name or email to search for team members
                          </div>
                        )}
                      </>
                    )}
                    {!searchLoading && searchResults.length > 0 && (
                      <>
                        {searchResults.slice(0, 10).map((member) => (
                          <button
                            key={member.id}
                            onMouseDown={(e) => {
                              e.preventDefault()
                              addMember(member)
                            }}
                            className="w-full border-b border-slate-100 px-6 py-3 text-left transition-colors first:rounded-t-2xl last:rounded-b-2xl last:border-0 hover:bg-slate-100 dark:border-slate-700 dark:hover:bg-slate-700"
                          >
                            <div className="text-sm font-bold text-slate-900 dark:text-white">
                              {member.name}
                            </div>
                            <div className="text-[11px] text-slate-500 dark:text-slate-400">
                              {member.email}
                            </div>
                          </button>
                        ))}
                      </>
                    )}
                  </div>
                )}
              </div>

              {/* Selected Members Pills */}
              {selectedMembers.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-2">
                  {selectedMembers.map((member) => (
                    <div
                      key={member.id}
                      className="flex items-center gap-2 rounded-full bg-blue-100 px-4 py-2 text-sm font-bold text-blue-700 dark:bg-blue-900/30 dark:text-blue-300"
                    >
                      <span>{member.name}</span>
                      <button
                        onClick={() => {
                          removeMember(member.id)
                        }}
                        className="hover:text-blue-900 dark:hover:text-blue-200"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
              <p className="text-[10px] text-slate-400 italic">
                {selectedMembers.length} member{selectedMembers.length !== 1 ? "s" : ""} added
              </p>
            </div>
          </div>

          <div className="mt-10 flex justify-end gap-3">
            <Button
              variant="outline"
              className="h-14 rounded-2xl border-slate-100 px-8 text-[10px] font-black tracking-widest uppercase transition-all hover:bg-slate-50"
              onClick={() => {
                setOpen(false)
              }}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button
              className="h-14 gap-3 rounded-2xl bg-blue-600 px-8 text-[10px] font-black tracking-widest text-white uppercase shadow-xl shadow-blue-500/20 transition-all hover:scale-105 hover:bg-blue-700"
              onClick={handleSubmit}
              disabled={loading}
            >
              {loading ? (
                <>
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                  Creating...
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4" />
                  Create Project
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
