"use client"

import { cn } from "@/lib/utils"

interface ProgressBarProps {
  value: number
  max?: number
  size?: "sm" | "md" | "lg"
  showLabel?: boolean
  variant?: "default" | "success" | "warning" | "danger"
  className?: string
}

const sizeStyles = {
  sm: "h-1.5",
  md: "h-2.5",
  lg: "h-4"
}

const variantStyles = {
  default: "bg-primary",
  success: "bg-green-500",
  warning: "bg-yellow-500",
  danger: "bg-red-500"
}

export function ProgressBar({
  value,
  max = 100,
  size = "md",
  showLabel = false,
  variant = "default",
  className
}: ProgressBarProps) {
  const percentage = Math.min(Math.max((value / max) * 100, 0), 100)

  // Auto-determine variant based on percentage if using default
  const autoVariant =
    variant === "default"
      ? percentage >= 100
        ? "success"
        : percentage >= 70
          ? "default"
          : percentage >= 30
            ? "warning"
            : "danger"
      : variant

  return (
    <div className={cn("w-full", className)}>
      {showLabel && (
        <div className="mb-1 flex justify-between text-sm">
          <span className="text-muted-foreground">Progress</span>
          <span className="font-medium">{Math.round(percentage)}%</span>
        </div>
      )}
      <div className={cn("w-full overflow-hidden rounded-full bg-muted", sizeStyles[size])}>
        <div
          className={cn("h-full rounded-full transition-all duration-300", variantStyles[autoVariant])}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  )
}

// Segmented progress for showing multiple statuses
interface SegmentedProgressProps {
  segments: Array<{
    value: number
    color: string
    label?: string
  }>
  total: number
  size?: "sm" | "md" | "lg"
  showLegend?: boolean
  className?: string
}

export function SegmentedProgress({
  segments,
  total,
  size = "md",
  showLegend = false,
  className
}: SegmentedProgressProps) {
  return (
    <div className={cn("w-full", className)}>
      <div className={cn("flex w-full overflow-hidden rounded-full bg-muted", sizeStyles[size])}>
        {segments.map((segment, index) => {
          const percentage = (segment.value / total) * 100
          return (
            <div
              key={index}
              className={cn("h-full transition-all duration-300", segment.color)}
              style={{ width: `${percentage}%` }}
            />
          )
        })}
      </div>
      {showLegend && (
        <div className="mt-2 flex flex-wrap gap-4">
          {segments.map((segment, index) => (
            <div key={index} className="flex items-center gap-2">
              <span className={cn("h-3 w-3 rounded-full", segment.color)} />
              <span className="text-xs text-muted-foreground">
                {segment.label}: {segment.value}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
