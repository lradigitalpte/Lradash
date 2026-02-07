"use client"

import { cn, getInitials } from "@/lib/utils"

interface UserAvatarProps {
  name: string
  image?: string
  size?: "xs" | "sm" | "md" | "lg" | "xl"
  showName?: boolean
  showStatus?: boolean
  status?: "online" | "offline" | "away" | "busy"
  className?: string
}

const sizeStyles = {
  xs: "h-6 w-6 text-xs",
  sm: "h-8 w-8 text-xs",
  md: "h-10 w-10 text-sm",
  lg: "h-12 w-12 text-base",
  xl: "h-16 w-16 text-lg"
}

const statusColors = {
  online: "bg-green-500",
  offline: "bg-gray-400",
  away: "bg-yellow-500",
  busy: "bg-red-500"
}

const statusSizes = {
  xs: "h-1.5 w-1.5",
  sm: "h-2 w-2",
  md: "h-2.5 w-2.5",
  lg: "h-3 w-3",
  xl: "h-4 w-4"
}

// Generate consistent color based on name
function getAvatarColor(name: string): string {
  const colors = [
    "bg-blue-500",
    "bg-green-500",
    "bg-yellow-500",
    "bg-purple-500",
    "bg-pink-500",
    "bg-indigo-500",
    "bg-teal-500",
    "bg-orange-500"
  ]
  let hash = 0
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash)
  }
  return colors[Math.abs(hash) % colors.length]
}

export function UserAvatar({
  name,
  image,
  size = "md",
  showName = false,
  showStatus = false,
  status = "offline",
  className
}: UserAvatarProps) {
  const initials = getInitials(name)
  const bgColor = getAvatarColor(name)

  return (
    <div className={cn("flex items-center gap-2", className)}>
      <div className="relative inline-flex">
        {image ? (
          <img
            src={image}
            alt={name}
            className={cn("rounded-full object-cover ring-2 ring-background", sizeStyles[size])}
          />
        ) : (
          <div
            className={cn(
              "flex items-center justify-center rounded-full font-medium text-white ring-2 ring-background",
              sizeStyles[size],
              bgColor
            )}
          >
            {initials}
          </div>
        )}
        {showStatus && (
          <span
            className={cn(
              "absolute bottom-0 right-0 rounded-full ring-2 ring-background",
              statusColors[status],
              statusSizes[size]
            )}
          />
        )}
      </div>
      {showName && (
        <div className="flex flex-col">
          <span className="text-sm font-medium">{name}</span>
        </div>
      )}
    </div>
  )
}

// Avatar Group for showing multiple users
interface AvatarGroupProps {
  users: Array<{ name: string; image?: string }>
  max?: number
  size?: "xs" | "sm" | "md" | "lg"
  className?: string
}

export function AvatarGroup({ users, max = 4, size = "sm", className }: AvatarGroupProps) {
  const visibleUsers = users.slice(0, max)
  const remainingCount = users.length - max

  return (
    <div className={cn("flex -space-x-2", className)}>
      {visibleUsers.map((user, index) => (
        <UserAvatar key={index} name={user.name} image={user.image} size={size} />
      ))}
      {remainingCount > 0 && (
        <div
          className={cn(
            "flex items-center justify-center rounded-full bg-muted font-medium text-muted-foreground ring-2 ring-background",
            sizeStyles[size]
          )}
        >
          +{remainingCount}
        </div>
      )}
    </div>
  )
}
