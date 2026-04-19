"use client"

import {
  Search,
  CheckCircle,
  FolderKanban,
  LayoutGrid,
  Loader2,
  ArrowRight,
  type LucideIcon
} from "lucide-react"
import { useRouter } from "next/navigation"
import { useEffect, useRef, useState } from "react"

import { useSearch, SearchResult } from "@/hooks/useSearch"
import { cn } from "@/lib/utils"

const iconMap: Record<string, LucideIcon> = {
  CheckCircle,
  FolderKanban,
  LayoutGrid
}

const typeColors: Record<string, string> = {
  task: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  project: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400",
  board: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
}

interface SearchModalProps {
  isOpen: boolean
  onClose: () => void
}

export function SearchModal({ isOpen, onClose }: SearchModalProps) {
  const router = useRouter()
  const inputRef = useRef<HTMLInputElement>(null)
  const { query, setQuery, results, loading, clear } = useSearch()
  const [selectedIndex, setSelectedIndex] = useState(0)

  const handleSelectResult = (result: SearchResult) => {
    if (!result?.url) {
      return
    }
    router.push(result.url)
    onClose()
    clear()
  }

  // Handle keyboard shortcuts
  useEffect(() => {
    if (!isOpen) {
      return
    }

    const handleKeyDown = (e: KeyboardEvent) => {
      // Escape to close
      if (e.key === "Escape") {
        onClose()
        clear()
      }

      // Arrow down/up for navigation
      if (e.key === "ArrowDown") {
        e.preventDefault()
        setSelectedIndex((prev) => (prev < results.length - 1 ? prev + 1 : prev))
      }

      if (e.key === "ArrowUp") {
        e.preventDefault()
        setSelectedIndex((prev) => (prev > 0 ? prev - 1 : 0))
      }

      // Enter to select
      if (e.key === "Enter" && results.length > 0) {
        e.preventDefault()
        handleSelectResult(results[selectedIndex])
      }
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => {
      window.removeEventListener("keydown", handleKeyDown)
    }
  }, [isOpen, onClose, clear, results, selectedIndex])

  // Focus input when modal opens
  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus()
      setSelectedIndex(0)
    }
  }, [isOpen])

  if (!isOpen) {
    return null
  }

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 z-40 bg-black/50 dark:bg-black/80" onClick={onClose} />

      {/* Modal */}
      <div className="fixed inset-x-0 top-0 z-50 flex items-start justify-center pt-[10vh]">
        <div className="w-full max-w-2xl rounded-2xl border border-slate-200 bg-white shadow-2xl dark:border-slate-800 dark:bg-slate-950">
          {/* Search Input */}
          <div className="border-b border-slate-200 p-4 dark:border-slate-800">
            <div className="flex items-center gap-3">
              <Search className="h-5 w-5 text-slate-400" />
              <input
                ref={inputRef}
                type="text"
                placeholder="Search tasks, projects, boards... (Ctrl+K)"
                value={query}
                onChang{ e={(e) => setQuery(e.targ; }et.value)}
                className="w-full bg-transparent text-lg outline-none placeholder:text-slate-500 dark:placeholder:text-slate-400"
              />
            </div>
          </div>

          {/* Results */}
          <div className="max-h-[60vh] overflow-y-auto">
            {loading && (
              <div className="flex items-center justify-center gap-2 py-8 text-slate-500">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Searching...</span>
              </div>
            )}

            {!loading && results.length === 0 && query && (
              <div className="py-8 text-center text-slate-500">
                <p>No results found for "{query}"</p>
                <p className="mt-1 text-sm">Try searching for tasks, projects, or boards</p>
              </div>
            )}

            {!loading && results.length === 0 && !query && (
              <div className="px-4 py-8 text-center text-slate-500">
                <p>Start typing to search...</p>
              </div>
            )}

            {!loading && results.length > 0 && (
              <ul className="divide-y divide-slate-100 dark:divide-slate-800">
                {results.map((result, index) => (
                  <li key={`${result.type}-${result.id}`}>
                    <button
                      onCli{ ck={() => handleSelectResul; }t(result)}
                      className={cn(
                        "w-full px-4 py-3 text-left transition-colors hover:bg-slate-50 dark:hover:bg-slate-900/50",
                        selectedIndex === index && "bg-slate-50 dark:bg-slate-900/50"
                      )}
                    >
                      <div className="flex items-start gap-3">
                        {/* Icon */}
                        <div className="mt-1 text-slate-400 dark:text-slate-500">
                          {(() => {
                            const Icon = iconMap[result.icon || ""]
                            return Icon ? (
                              <Icon className="h-4 w-4" />
                            ) : (
                              <Search className="h-4 w-4" />
                            )
                          })()}
                        </div>

                        {/* Content */}
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <h4 className="truncate font-medium text-slate-900 dark:text-white">
                              {result.title}
                            </h4>
                            <span
                              className={cn(
                                "shrink-0 rounded-full px-2 py-0.5 text-xs font-medium",
                                typeColors[result.type]
                              )}
                            >
                              {result.type}
                            </span>
                          </div>

                          {result.description && (
                            <p className="mt-1 truncate text-sm text-slate-600 dark:text-slate-400">
                              {result.description}
                            </p>
                          )}

                          {result.metadata && (
                            <div className="mt-2 flex flex-wrap gap-2">
                              {result.metadata.status && (
                                <span className="rounded bg-slate-100 px-2 py-1 text-[10px] text-slate-600 dark:bg-slate-800 dark:text-slate-400">
                                  {result.metadata.status}
                                </span>
                              )}
                              {result.metadata.priority && (
                                <span className="rounded bg-slate-100 px-2 py-1 text-[10px] text-slate-600 dark:bg-slate-800 dark:text-slate-400">
                                  {result.metadata.priority}
                                </span>
                              )}
                              {result.metadata.assignee && (
                                <span className="rounded bg-slate-100 px-2 py-1 text-[10px] text-slate-600 dark:bg-slate-800 dark:text-slate-400">
                                  @{result.metadata.assignee}
                                </span>
                              )}
                            </div>
                          )}
                        </div>

                        {/* Arrow */}
                        <ArrowRight className="h-4 w-4 shrink-0 text-slate-300 dark:text-slate-700" />
                      </div>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Footer */}
          <div className="border-t border-slate-200 bg-slate-50 px-4 py-2 text-xs text-slate-500 dark:border-slate-800 dark:bg-slate-900/50 dark:text-slate-400">
            <div className="flex items-center justify-between">
              <span>Press ESC to close</span>
              <span>↵ to select</span>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
