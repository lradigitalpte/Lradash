"use client"

import { CheckCircle, Edit, MessageSquare, Plus, Trash, User } from "lucide-react"

import { cn, formatRelativeTime } from "@/lib/utils"

import { UserAvatar } from "./UserAvatar"

type ActivityType = "created" | "updated" | "deleted" | "commented" | "assigned" | "status_changed" | "completed"

interface ActivityItemProps {
  type: ActivityType
  user: {
    name: string
    image?: string
  }
  target: string
  description?: string
  timestamp: Date | string
  className?: string
}

const activityConfig: Record<ActivityType, { icon: typeof Plus; color: string; verb: string }> = {
  created: { icon: Plus, color: "text-green-500", verb: "created" },
  updated: { icon: Edit, color: "text-blue-500", verb: "updated" },
  deleted: { icon: Trash, color: "text-red-500", verb: "deleted" },
  commented: { icon: MessageSquare, color: "text-purple-500", verb: "commented on" },
  assigned: { icon: User, color: "text-orange-500", verb: "assigned" },
  status_changed: { icon: Edit, color: "text-yellow-500", verb: "changed status of" },
  completed: { icon: CheckCircle, color: "text-green-500", verb: "completed" }
}

export function ActivityItem({ type, user, target, description, timestamp, className }: ActivityItemProps) {
  const config = activityConfig[type]
  const Icon = config.icon

  return (
    <div className={cn("flex gap-3", className)}>
      <div className="relative flex flex-col items-center">
        <UserAvatar name={user.name} image={user.image} size="sm" />
        <div className="absolute -bottom-1 -right-1 rounded-full bg-background p-0.5">
          <Icon className={cn("h-3 w-3", config.color)} />
        </div>
      </div>
      <div className="flex-1 space-y-1">
        <p className="text-sm">
          <span className="font-medium">{user.name}</span>{" "}
          <span className="text-muted-foreground">{config.verb}</span>{" "}
          <span className="font-medium">{target}</span>
        </p>
        {description && <p className="text-sm text-muted-foreground">{description}</p>}
        <p className="text-xs text-muted-foreground">{formatRelativeTime(timestamp)}</p>
      </div>
    </div>
  )
}

// Activity Feed component
interface ActivityFeedProps {
  activities: Array<{
    id: string
    type: ActivityType
    user: { name: string; image?: string }
    target: string
    description?: string
    timestamp: Date | string
  }>
  className?: string
}

export function ActivityFeed({ activities, className }: ActivityFeedProps) {
  return (
    <div className={cn("space-y-4", className)}>
      {activities.map((activity, index) => (
        <div key={activity.id} className="relative">
          {index < activities.length - 1 && (
            <div className="absolute left-4 top-10 h-full w-px bg-border" />
          )}
          <ActivityItem
            type={activity.type}
            user={activity.user}
            target={activity.target}
            description={activity.description}
            timestamp={activity.timestamp}
          />
        </div>
      ))}
    </div>
  )
}
