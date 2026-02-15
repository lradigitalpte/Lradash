import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

// ============================================
// CLASS NAME UTILITIES
// ============================================

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// ============================================
// PATH UTILITIES
// ============================================

export const getLocalePath = (path: string, locale: string | string[] | undefined) => {
  const currentLocale = Array.isArray(locale) ? locale[0] : locale
  if (currentLocale) {
    return `/${currentLocale}${path}`
  }
  return path
}

// ============================================
// DATE UTILITIES
// ============================================

export function formatDate(date: Date | string | undefined): string {
  if (!date) {
    return ""
  }
  const d = new Date(date)
  return d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric"
  })
}

export function formatRelativeTime(date: Date | string | undefined): string {
  if (!date) {
    return ""
  }
  const d = new Date(date)
  const now = new Date()
  const diffInSeconds = Math.floor((now.getTime() - d.getTime()) / 1000)

  if (diffInSeconds < 60) {
    return "just now"
  }
  if (diffInSeconds < 3600) {
    return `${Math.floor(diffInSeconds / 60)}m ago`
  }
  if (diffInSeconds < 86400) {
    return `${Math.floor(diffInSeconds / 3600)}h ago`
  }
  if (diffInSeconds < 604800) {
    return `${Math.floor(diffInSeconds / 86400)}d ago`
  }
  return formatDate(date)
}

export function isOverdue(date: Date | string | undefined): boolean {
  if (!date) {
    return false
  }
  return new Date(date) < new Date()
}

export function getDaysUntil(date: Date | string | undefined): number {
  if (!date) {
    return 0
  }
  const d = new Date(date)
  const now = new Date()
  return Math.ceil((d.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
}

// ============================================
// STRING UTILITIES
// ============================================

export function truncate(str: string, length: number): string {
  if (str.length <= length) {
    return str
  }
  return str.slice(0, length) + "..."
}

export function getInitials(name: string): string {
  if (!name) {
    return "?"
  }
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2)
}

export function slugify(str: string): string {
  return str
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
}

// ============================================
// NUMBER UTILITIES
// ============================================

export function formatNumber(num: number): string {
  if (num >= 1000000) {
    return `${(num / 1000000).toFixed(1)}M`
  }
  if (num >= 1000) {
    return `${(num / 1000).toFixed(1)}K`
  }
  return num.toString()
}

export function calculatePercentage(value: number, total: number): number {
  if (total === 0) {
    return 0
  }
  return Math.round((value / total) * 100)
}

// ============================================
// STATUS UTILITIES
// ============================================

export type TaskStatus = "TODO" | "IN_PROGRESS" | "DONE"
export type Priority = "low" | "medium" | "high" | "urgent"
export type ProjectStatus = "on_track" | "at_risk" | "off_track"

export const STATUS_CONFIG: Record<TaskStatus, { label: string; color: string; bgColor: string }> =
  {
    TODO: { label: "To Do", color: "text-slate-600", bgColor: "bg-slate-100" },
    IN_PROGRESS: { label: "In Progress", color: "text-blue-600", bgColor: "bg-blue-100" },
    DONE: { label: "Done", color: "text-green-600", bgColor: "bg-green-100" }
  }

export const PRIORITY_CONFIG: Record<Priority, { label: string; color: string; bgColor: string }> =
  {
    low: { label: "Low", color: "text-slate-500", bgColor: "bg-slate-100" },
    medium: { label: "Medium", color: "text-yellow-600", bgColor: "bg-yellow-100" },
    high: { label: "High", color: "text-orange-600", bgColor: "bg-orange-100" },
    urgent: { label: "Urgent", color: "text-red-600", bgColor: "bg-red-100" }
  }

export const PROJECT_STATUS_CONFIG: Record<
  ProjectStatus,
  { label: string; color: string; bgColor: string }
> = {
  on_track: { label: "On Track", color: "text-green-600", bgColor: "bg-green-100" },
  at_risk: { label: "At Risk", color: "text-yellow-600", bgColor: "bg-yellow-100" },
  off_track: { label: "Off Track", color: "text-red-600", bgColor: "bg-red-100" }
}

// ============================================
// ARRAY UTILITIES
// ============================================

export function groupBy<T>(array: T[], key: keyof T): Record<string, T[]> {
  return array.reduce<Record<string, T[]>>((result, item) => {
    const groupKey = String(item[key])
    if (!result[groupKey]) {
      result[groupKey] = []
    }
    result[groupKey].push(item)
    return result
  }, {})
}

export function sortBy<T>(array: T[], key: keyof T, order: "asc" | "desc" = "asc"): T[] {
  return [...array].sort((a, b) => {
    const aVal = a[key]
    const bVal = b[key]
    if (aVal < bVal) {
      return order === "asc" ? -1 : 1
    }
    if (aVal > bVal) {
      return order === "asc" ? 1 : -1
    }
    return 0
  })
}
