/**
 * Zustand store for in-app notifications.
 * Populated on mount from the REST API and updated in real-time via SSE.
 */

import type { INotificationDoc } from "@/models/notification.model"
import { create } from "zustand"

export interface NotificationItem {
  id: string
  type: string
  title: string
  body: string
  read: boolean
  taskId?: string
  projectId?: string
  triggeredBy?: {
    userId?: string
    name?: string
    avatar?: string
  }
  createdAt: string
}

function toItem(doc: INotificationDoc): NotificationItem {
  return {
    id: String(doc._id),
    type: doc.type,
    title: doc.title,
    body: doc.body,
    read: doc.read,
    taskId: doc.taskId as string | undefined,
    projectId: doc.projectId,
    triggeredBy: doc.triggeredBy as any,
    createdAt: doc.createdAt instanceof Date ? doc.createdAt.toISOString() : String(doc.createdAt)
  }
}

interface NotificationState {
  notifications: NotificationItem[]
  unreadCount: number
  loading: boolean
  // Actions
  setNotifications: (docs: INotificationDoc[], unread: number) => void
  prependNotification: (doc: INotificationDoc) => void
  markRead: (id: string) => void
  markAllRead: () => void
  setLoading: (v: boolean) => void
}

export const useNotificationStore = create<NotificationState>((set, get) => ({
  notifications: [],
  unreadCount: 0,
  loading: false,

  setLoading: (v) =>{  set({ loading: v }); },

  setNotifications: (docs, unread) =>{ 
    set({
      notifications: docs.map(toItem),
      unreadCount: unread,
      loading: false
    }); },

  prependNotification: (doc) => {
    const item = toItem(doc)
    set((s) => ({
      notifications: [item, ...s.notifications].slice(0, 100),
      unreadCount: s.unreadCount + (item.read ? 0 : 1)
    }))
  },

  markRead: (id) =>{ 
    set((s) => ({
      notifications: s.notifications.map((n) => (n.id === id ? { ...n, read: true } : n)),
      unreadCount: Math.max(
        0,
        s.unreadCount - (s.notifications.find((n) => n.id === id && !n.read) ? 1 : 0)
      )
    })); },

  markAllRead: () =>{ 
    set((s) => ({
      notifications: s.notifications.map((n) => ({ ...n, read: true })),
      unreadCount: 0
    })); }
}))
