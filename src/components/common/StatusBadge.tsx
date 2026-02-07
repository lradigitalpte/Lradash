"use client"

import { cn, PRIORITY_CONFIG, PROJECT_STATUS_CONFIG, STATUS_CONFIG } from "@/lib/utils"

type BadgeType = "status" | "priority" | "projectStatus" | "custom"

interface StatusBadgeProps {
  type: BadgeType
  value: string
  size?: "sm" | "md" | "lg"
  showDot?: boolean
  className?: string
  customColor?: string
  customBgColor?: string
}

const sizeStyles = {
  sm: "text-xs px-2 py-0.5",
  md: "text-sm px-2.5 py-1",
  lg: "text-sm px-3 py-1.5"
}

export function StatusBadge({
  type,
  value,
  size = "sm",
  showDot = true,
  className,
  customColor,
  customBgColor
}: StatusBadgeProps) {
  let config: { label: string; color: string; bgColor: string } | undefined

  switch (type) {
    case "status":
      config = STATUS_CONFIG[value as keyof typeof STATUS_CONFIG]
      break
    case "priority":
      config = PRIORITY_CONFIG[value as keyof typeof PRIORITY_CONFIG]
      break
    case "projectStatus":
      config = PROJECT_STATUS_CONFIG[value as keyof typeof PROJECT_STATUS_CONFIG]
      break
    case "custom":
      config = {
        label: value,
        color: customColor || "text-gray-600",
        bgColor: customBgColor || "bg-gray-100"
      }
      break
  }

  if (!config) {
    config = { label: value, color: "text-gray-600", bgColor: "bg-gray-100" }
  }

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full font-medium",
        config.bgColor,
        config.color,
        sizeStyles[size],
        className
      )}
    >
      {showDot && <span className={cn("h-1.5 w-1.5 rounded-full", config.color.replace("text-", "bg-"))} />}
      {config.label}
    </span>
  )
}
