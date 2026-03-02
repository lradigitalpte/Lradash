"use client"

import { Mail, Shield } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { cn } from "@/lib/utils"

import { UserAvatar } from "./UserAvatar"

export interface UserProfilePopoverProps {
  /** User's display name */
  name: string
  /** User's email address */
  email?: string
  /** Avatar URL or base64 data URL */
  image?: string
  /** Role label shown as a badge */
  role?: string
  /** Size of the trigger avatar */
  size?: "xs" | "sm" | "md" | "lg" | "xl"
  /** Whether to wrap the avatar in a popover (default: true) */
  showPopover?: boolean
  className?: string
}

/**
 * Renders a UserAvatar that reveals a user profile card in a Popover on click/hover.
 * Use anywhere you need to display a member's profile (task assignees, comments, team lists, etc.)
 *
 * @example
 * <UserProfilePopover name="Alice Chen" email="alice@acme.com" image={user.avatar} role="Admin" size="sm" />
 */
export function UserProfilePopover({
  name,
  email,
  image,
  role,
  size = "sm",
  showPopover = true,
  className
}: UserProfilePopoverProps) {
  const avatar = (
    <span className={cn("cursor-pointer", className)}>
      <UserAvatar name={name} image={image} size={size} />
    </span>
  )

  if (!showPopover) {
    return avatar
  }

  return (
    <Popover>
      <PopoverTrigger asChild>{avatar}</PopoverTrigger>

      <PopoverContent
        side="top"
        align="center"
        sideOffset={8}
        className="w-64 rounded-2xl border-slate-200/60 bg-white/95 p-0 shadow-2xl shadow-slate-300/40 backdrop-blur-xl dark:border-slate-800/60 dark:bg-slate-950/95 dark:shadow-slate-950/60"
      >
        {/* Top accent bar */}
        <div className="h-1.5 w-full rounded-t-2xl bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500" />

        <div className="flex flex-col items-center gap-3 p-5 pt-4">
          {/* Large avatar */}
          <UserAvatar name={name} image={image} size="xl" />

          {/* Name */}
          <div className="text-center">
            <p className="text-sm font-bold text-slate-800 dark:text-slate-100">{name}</p>
            {email && (
              <div className="mt-0.5 flex items-center justify-center gap-1 text-xs font-medium text-slate-400 dark:text-slate-500">
                <Mail className="h-3 w-3" />
                <span className="max-w-[180px] truncate">{email}</span>
              </div>
            )}
          </div>

          {/* Role badge */}
          {role && (
            <Badge
              variant="secondary"
              className="flex items-center gap-1 rounded-full bg-blue-50 px-3 py-0.5 text-[10px] font-black tracking-wider text-blue-700 uppercase dark:bg-blue-950/60 dark:text-blue-300"
            >
              <Shield className="h-2.5 w-2.5" />
              {role}
            </Badge>
          )}
        </div>
      </PopoverContent>
    </Popover>
  )
}
