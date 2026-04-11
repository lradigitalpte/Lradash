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
  default: "bg-card/90 dark:bg-card/80 border-border/80 shadow-sm backdrop-blur-sm",
  primary:
    "bg-blue-50/50 dark:bg-blue-900/10 backdrop-blur-md border-blue-200/30 dark:border-blue-500/20 shadow-xl shadow-blue-500/10",
  success:
    "bg-emerald-50/50 dark:bg-emerald-900/10 backdrop-blur-md border-emerald-200/30 dark:border-emerald-500/20 shadow-xl shadow-emerald-500/10",
  warning:
    "bg-amber-50/50 dark:bg-amber-900/10 backdrop-blur-md border-amber-200/30 dark:border-amber-500/20 shadow-xl shadow-amber-500/10",
  danger:
    "bg-rose-50/50 dark:bg-rose-900/10 backdrop-blur-md border-rose-200/30 dark:border-rose-500/20 shadow-xl shadow-rose-500/10"
}

const iconVariantStyles = {
  default: "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400",
  primary: "bg-blue-600 text-white shadow-lg shadow-blue-500/30",
  success: "bg-emerald-600 text-white shadow-lg shadow-emerald-500/30",
  warning: "bg-amber-600 text-white shadow-lg shadow-amber-500/30",
  danger: "bg-rose-600 text-white shadow-lg shadow-rose-500/30"
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
    <div className={cn("group rounded-xl border p-5", variantStyles[variant], className)}>
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-1.5">
          <p className="text-[11px] font-medium tracking-wide text-muted-foreground uppercase">
            {title}
          </p>
          <p className="text-2xl font-semibold tracking-tight text-foreground tabular-nums dark:text-white">
            {value}
          </p>
          {subtitle && <p className="text-xs leading-snug text-muted-foreground">{subtitle}</p>}
          {trend && (
            <div className="flex items-center gap-2 pt-1">
              <span
                className={cn(
                  "rounded-lg px-2 py-0.5 text-[10px] font-black tracking-wider uppercase",
                  trend.isPositive
                    ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400"
                    : "bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400"
                )}
              >
                {trend.isPositive ? "+" : "-"}
                {Math.abs(trend.value)}%
              </span>
              <span className="text-[10px] font-bold tracking-widest text-slate-400 uppercase">
                Since last month
              </span>
            </div>
          )}
        </div>
        {Icon && (
          <div className={cn("rounded-lg p-2.5", iconVariantStyles[variant])}>
            <Icon className="size-5" />
          </div>
        )}
      </div>
    </div>
  )
}
