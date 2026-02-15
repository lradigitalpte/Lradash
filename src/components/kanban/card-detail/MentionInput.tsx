"use client"

import { X, AtSign, Loader2 } from "lucide-react"
import { useRef, useState, useEffect, useCallback } from "react"
import { toast } from "sonner"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { apiClient } from "@/lib/api/client"
import { cn } from "@/lib/utils"

interface MentionedUser {
  userId: string
  userName: string
  userEmail: string
  userAvatar?: string
}

interface MentionInputProps {
  value: string
  onChange: (value: string) => void
  onMentionsChange: (mentions: MentionedUser[]) => void
  mentions?: MentionedUser[]
  placeholder?: string
  onSubmit: () => void
  isLoading?: boolean
  rows?: number
}

export function MentionInput({
  value,
  onChange,
  onMentionsChange,
  mentions: externalMentions,
  placeholder = "Share an update or feedback... Type @ to mention users",
  onSubmit,
  isLoading = false,
  rows = 2
}: MentionInputProps) {
  const [internalMentions, setInternalMentions] = useState<MentionedUser[]>([])
  // Use external mentions if provided, otherwise use internal state
  const mentions = externalMentions || internalMentions
  const setMentions = externalMentions
    ? (m: MentionedUser[]) => {
        onMentionsChange(m)
      }
    : setInternalMentions
  const [searchQuery, setSearchQuery] = useState("")
  const [showSearchDropdown, setShowSearchDropdown] = useState(false)
  const [searchResults, setSearchResults] = useState<any[]>([])
  const [searchLoading, setSearchLoading] = useState(false)
  const [cursorPosition, setCursorPosition] = useState(0)

  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null)
  const currentSearchRef = useRef<string>("")

  const DEBOUNCE_DELAY = 400 // Wait 400ms after user stops typing before searching

  // Detect @ mentions and setup debounced search
  useEffect(() => {
    const textarea = textareaRef.current
    if (!textarea) {
      return
    }

    const cursorPos = textarea.selectionStart
    setCursorPosition(cursorPos)

    // Look for @ symbol before cursor
    const textBeforeCursor = value.substring(0, cursorPos)
    const lastAtIndex = textBeforeCursor.lastIndexOf("@")

    if (lastAtIndex !== -1) {
      const textAfterAt = textBeforeCursor.substring(lastAtIndex + 1)
      // Check if there's a space or special char that would end the mention
      const hasSpace = /[\s\n\r]/.test(textAfterAt)

      if (!hasSpace && textAfterAt.length > 0) {
        setSearchQuery(textAfterAt)
        currentSearchRef.current = textAfterAt
        setShowSearchDropdown(true)

        // Clear previous debounce timer
        if (debounceTimerRef.current) {
          clearTimeout(debounceTimerRef.current)
        }

        // Set new debounce timer - only search after user stops typing
        console.log(`⏳ Debouncing search for: "${textAfterAt}"`)
        debounceTimerRef.current = setTimeout(() => {
          console.log(`🔍 Executing debounced search for: "${currentSearchRef.current}"`)
          searchUsers(currentSearchRef.current)
        }, DEBOUNCE_DELAY)
      } else if (textAfterAt.length === 0) {
        setSearchQuery("")
        currentSearchRef.current = ""
        setShowSearchDropdown(true)

        // Clear previous debounce timer
        if (debounceTimerRef.current) {
          clearTimeout(debounceTimerRef.current)
        }

        // Show empty state immediately
        setSearchResults([])
        setSearchLoading(false)
      } else {
        setShowSearchDropdown(false)
      }
    } else {
      setShowSearchDropdown(false)
    }

    // Cleanup on unmount
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current)
      }
    }
  }, [value])

  const searchUsers = useCallback(
    async (query: string) => {
      try {
        setSearchLoading(true)
        console.log(`📡 Searching users with query: "${query}"`)

        const response = await apiClient.get(
          `/api/users/search?username=${encodeURIComponent(query)}`
        )

        if (response.ok) {
          const data = await response.json()
          console.log(`✅ Found ${data.users?.length || 0} users`)

          // Filter out already mentioned users
          const mentionedIds = mentions.map((m) => m.userId)
          const filtered = (data.users || []).filter((u: any) => !mentionedIds.includes(u._id))
          console.log(`📊 After filtering: ${filtered.length} available users`)
          setSearchResults(filtered)
        } else {
          console.error(`❌ Search failed with status ${response.status}`)
          setSearchResults([])
        }
      } catch (error) {
        console.error("❌ Error searching users:", error)
        setSearchResults([])
      } finally {
        setSearchLoading(false)
      }
    },
    [mentions]
  )

  const addMention = (user: any) => {
    const mention: MentionedUser = {
      userId: user._id,
      userName: user.name,
      userEmail: user.email,
      userAvatar: user.avatar
    }

    // Replace @query with @username
    const textarea = textareaRef.current
    if (!textarea) {
      return
    }

    const cursorPos = textarea.selectionStart
    const textBeforeCursor = value.substring(0, cursorPos)
    const lastAtIndex = textBeforeCursor.lastIndexOf("@")

    if (lastAtIndex !== -1) {
      const textBefore = value.substring(0, lastAtIndex)
      const textAfter = value.substring(cursorPos)
      const newText = `${textBefore}@${user.name} ${textAfter}`
      onChange(newText)
      setMentions([...mentions, mention])
      onMentionsChange([...mentions, mention])
      setShowSearchDropdown(false)
      setSearchQuery("")

      // Focus back on textarea and move cursor after the mention
      setTimeout(() => {
        if (textarea) {
          const newCursorPos = textBefore.length + user.name.length + 2 // @ + name + space
          textarea.focus()
          textarea.setSelectionRange(newCursorPos, newCursorPos)
        }
      }, 0)
    }
  }

  const removeMention = (index: number) => {
    const newMentions = mentions.filter((_, i) => i !== index)
    setMentions(newMentions)
    onMentionsChange(newMentions)
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (showSearchDropdown && searchResults.length > 0) {
      if (e.key === "ArrowDown" || e.key === "ArrowUp") {
        // Could implement selection cycling here
        e.preventDefault()
      } else if (e.key === "Escape") {
        setShowSearchDropdown(false)
        e.preventDefault()
      }
    }
  }

  return (
    <div className="relative space-y-3">
      {/* Mentioned Users Pills */}
      {mentions.length > 0 && (
        <div className="space-y-2">
          <div className="text-xs font-black tracking-widest text-slate-400 uppercase">
            ✓ Selected {mentions.length} {mentions.length === 1 ? "user" : "users"}
          </div>
          <div className="flex flex-wrap gap-2">
            {mentions.map((mention, index) => (
              <div
                key={index}
                className="group inline-flex items-center gap-2 rounded-lg border border-purple-300 bg-gradient-to-r from-purple-500/15 to-pink-500/15 px-3 py-2 text-sm font-bold text-purple-700 shadow-sm transition-all duration-200 hover:from-purple-500/25 hover:to-pink-500/25 hover:shadow-md dark:border-purple-600/40 dark:from-purple-900/40 dark:to-pink-900/40 dark:text-purple-300 dark:hover:from-purple-900/60 dark:hover:to-pink-900/60"
              >
                {/* Avatar */}
                <Avatar className="h-6 w-6 border border-purple-400 shadow-sm dark:border-purple-600">
                  <AvatarImage src={mention.userAvatar} />
                  <AvatarFallback className="bg-gradient-to-br from-purple-400 to-pink-400 text-xs font-bold text-white">
                    {mention.userName.slice(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>

                {/* Name */}
                <span className="font-semibold">@{mention.userName}</span>

                {/* Remove button */}
                <button
                  type="button"
                  onClick={() => {
                    removeMention(index)
                  }}
                  className="ml-1 rounded-full p-0.5 transition-all hover:bg-purple-300/30 dark:hover:bg-purple-600/30"
                  title="Remove mention"
                >
                  <X className="h-3.5 w-3.5 text-purple-600 dark:text-purple-400" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Textarea with @ detection */}
      <div className="relative">
        <Textarea
          ref={textareaRef}
          placeholder={placeholder}
          value={value}
          onChange={(e) => {
            onChange(e.target.value)
          }}
          onKeyDown={handleKeyDown}
          rows={rows}
          className="resize-none rounded-2xl border-slate-200 bg-white p-4 text-sm font-medium transition-all placeholder:text-slate-400 focus:ring-2 focus:ring-blue-500/20 dark:border-slate-800 dark:bg-slate-950"
        />

        {/* @ Symbol Indicator with Debounce Status */}
        {showSearchDropdown && (
          <div className="absolute -top-8 left-4 flex items-center gap-1.5 text-xs font-semibold text-slate-500">
            <AtSign className="h-3.5 w-3.5" />
            {searchLoading ? (
              <>
                <Loader2 className="h-3 w-3 animate-spin" />
                Searching...
              </>
            ) : searchQuery.length > 0 ? (
              "Click to mention"
            ) : (
              "Type to search users"
            )}
          </div>
        )}

        {/* User Search Dropdown */}
        {showSearchDropdown && (
          <div
            ref={dropdownRef}
            className="absolute top-full z-50 mt-2 w-full max-w-sm rounded-xl border border-slate-200 bg-white shadow-lg dark:border-slate-800 dark:bg-slate-900"
          >
            {searchLoading ? (
              <div className="flex items-center justify-center py-6">
                <Loader2 className="h-4 w-4 animate-spin text-slate-400" />
              </div>
            ) : searchResults.length > 0 ? (
              <div className="max-h-48 overflow-y-auto">
                {searchResults.map((user) => (
                  <button
                    key={user._id}
                    type="button"
                    onClick={() => {
                      addMention(user)
                    }}
                    className="flex w-full items-center gap-3 px-4 py-3 transition-colors hover:bg-slate-50 dark:hover:bg-slate-800/50"
                  >
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={user.avatar} />
                      <AvatarFallback className="text-xs">
                        {user.name.slice(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 text-left">
                      <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                        {user.name}
                      </p>
                      <p className="text-xs text-slate-500 dark:text-slate-400">{user.email}</p>
                    </div>
                  </button>
                ))}
              </div>
            ) : (
              <div className="px-4 py-6 text-center">
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {searchQuery ? "No users found" : "Start typing to search users"}
                </p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Submit Button */}
      <div className="flex justify-end">
        <Button
          onClick={onSubmit}
          size="sm"
          disabled={!value.trim() || isLoading}
          className="h-10 rounded-xl bg-slate-900 px-6 text-[10px] font-bold tracking-widest text-white uppercase shadow-lg transition-all hover:scale-[1.02] active:scale-[0.98] dark:bg-white dark:text-slate-900"
        >
          {isLoading ? "Posting..." : "Post Comment"}
        </Button>
      </div>
    </div>
  )
}
