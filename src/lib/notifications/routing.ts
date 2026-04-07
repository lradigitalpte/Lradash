import type { NotificationType } from "@/models/notification.model"

export interface NotificationRouteInput {
  type: NotificationType | string
  taskId?: string
  projectId?: string
}

function cleanId(value?: string): string | undefined {
  if (!value) {
    return undefined
  }
  const trimmed = String(value).trim()
  return trimmed.length > 0 ? trimmed : undefined
}

export function getNotificationRoute(input: NotificationRouteInput): string {
  const taskId = cleanId(input.taskId)
  const projectId = cleanId(input.projectId)

  if (input.type === "announcement_created" && projectId) {
    return `/projects/${projectId}/announcements`
  }

  if (taskId && projectId) {
    return `/projects/${projectId}/tasks`
  }

  if (projectId) {
    return `/projects/${projectId}`
  }

  if (taskId) {
    return "/tasks"
  }

  return "/dashboard"
}

export function getLocalizedNotificationRoute(
  locale: string,
  input: NotificationRouteInput
): string {
  const base = getNotificationRoute(input)
  return `/${locale}${base}`
}
