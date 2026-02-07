"use client"

import { LucideIcon } from "lucide-react"

import { cn } from "@/lib/utils"

interface StatCardProps {
  title: string
  value: string | number
  subtitle?: string
  icon?: LucideIcon
  trend?: {
    value: number
    isPositive: boolean
  }
  className?: string
  variant?: "default" | "primary" | "success" | "warning" | "danger"
}

const variantStyles = {
  default: "bg-card border",
  primary: "bg-blue-50 border-blue-200 dark:bg-blue-950 dark:border-blue-800",
  success: "bg-green-50 border-green-200 dark:bg-green-950 dark:border-green-800",
  warning: "bg-yellow-50 border-yellow-200 dark:bg-yellow-950 dark:border-yellow-800",
  danger: "bg-red-50 border-red-200 dark:bg-red-950 dark:border-red-800"
}

const iconVariantStyles = {
  default: "bg-muted text-muted-foreground",
  primary: "bg-blue-100 text-blue-600 dark:bg-blue-900 dark:text-blue-400",
  success: "bg-green-100 text-green-600 dark:bg-green-900 dark:text-green-400",
  warning: "bg-yellow-100 text-yellow-600 dark:bg-yellow-900 dark:text-yellow-400",
  danger: "bg-red-100 text-red-600 dark:bg-red-900 dark:text-red-400"
}

export function StatCard({
  title,
  value,
  subtitle,
  icon: Icon,
  trend,
  className,
  variant = "default"
}: StatCardProps) {
  return (
    <div className={cn("rounded-xl border p-6 transition-all hover:shadow-md", variantStyles[variant], className)}>
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <p className="text-sm font-medium text-muted-foreground">{title}</p>
          <p className="text-3xl font-bold tracking-tight">{value}</p>
          {subtitle && <p className="text-xs text-muted-foreground">{subtitle}</p>}
          {trend && (
            <div className="flex items-center gap-1 pt-1">
              <span className={cn("text-xs font-medium", trend.isPositive ? "text-green-600" : "text-red-600")}>
                {trend.isPositive ? "+" : "-"}
                {Math.abs(trend.value)}%
              </span>
              <span className="text-xs text-muted-foreground">from last week</span>
            </div>
          )}
        </div>
        {Icon && (
          <div className={cn("rounded-lg p-3", iconVariantStyles[variant])}>
            <Icon className="h-5 w-5" />
          </div>
        )}
      </div>
    </div>
  )
}
