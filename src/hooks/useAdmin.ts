"use client"

import { useEffect, useState } from "react"

import { apiClient } from "@/lib/api/client"

interface AdminStats {
  users: number
  projects: number
  boards: number
  tasks: {
    total: number
    todo: number
    inProgress: number
    done: number
    completionRate: number
  }
  recentProjects: any[]
  organization: any
}

interface AdminUser {
  _id: string
  name: string
  email: string
  avatar?: string
  status: string
  orgRole: string
  createdAt: string
}

interface AdminProject {
  _id: string
  title: string
  description?: string
  owner: any
  members: any[]
  dueDate?: string
  isArchived: boolean
  createdAt: string
  taskTotal: number
  taskDone: number
  completionRate: number
  boards: any[]
}

interface ActivityItem {
  _id: string
  type: string
  text: string
  createdAt: string
  user: any
  task: { _id: string; title: string; project?: any }
}

export function useAdminAccess() {
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null)

  useEffect(() => {
    apiClient
      .get("/api/admin/me")
      .then(async (r) => r.json())
      .then((data) => {
        setIsAdmin(data.isAdmin ?? false)
      })
      .catch(() => {
        setIsAdmin(false)
      })
  }, [])

  return isAdmin
}

export function useAdminStats() {
  const [stats, setStats] = useState<AdminStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const refresh = () => {
    setLoading(true)
    apiClient
      .get("/api/admin/stats")
      .then(async (r) => {
        if (!r.ok) {
          throw new Error("Forbidden")
        }
        return r.json()
      })
      .then((data) => {
        setStats(data)
        setError(null)
      })
      .catch((e) => {
        setError(e.message)
      })
      .finally(() => {
        setLoading(false)
      })
  }

  useEffect(() => {
    refresh()
  }, [])

  return { stats, loading, error, refresh }
}

export function useAdminUsers() {
  const [users, setUsers] = useState<AdminUser[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const refresh = () => {
    setLoading(true)
    apiClient
      .get("/api/admin/users")
      .then(async (r) => {
        if (!r.ok) {
          throw new Error("Forbidden")
        }
        return r.json()
      })
      .then((data) => {
        setUsers(data.users ?? [])
        setError(null)
      })
      .catch((e) => {
        setError(e.message)
      })
      .finally(() => {
        setLoading(false)
      })
  }

  const updateUser = async (userId: string, updates: { orgRole?: string; status?: string }) => {
    const res = await apiClient.patch("/api/admin/users", { userId, ...updates })
    if (!res.ok) {
      throw new Error((await res.json()).error)
    }
    refresh()
  }

  const resetUserPassword = async (userId: string, password: string) => {
    const res = await apiClient.patch("/api/admin/users", { userId, password })
    if (!res.ok) {
      throw new Error((await res.json()).error)
    }
  }

  useEffect(() => {
    refresh()
  }, [])

  return { users, loading, error, refresh, updateUser, resetUserPassword }
}

export function useAdminProjects() {
  const [projects, setProjects] = useState<AdminProject[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const refresh = () => {
    setLoading(true)
    apiClient
      .get("/api/admin/projects")
      .then(async (r) => {
        if (!r.ok) {
          throw new Error("Forbidden")
        }
        return r.json()
      })
      .then((data) => {
        setProjects(data.projects ?? [])
        setError(null)
      })
      .catch((e) => {
        setError(e.message)
      })
      .finally(() => {
        setLoading(false)
      })
  }

  useEffect(() => {
    refresh()
  }, [])

  return { projects, loading, error, refresh }
}

export function useAdminActivity() {
  const [activities, setActivities] = useState<ActivityItem[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    apiClient
      .get("/api/admin/activity")
      .then(async (r) => r.json())
      .then((data) => {
        setActivities(data.activities ?? [])
      })
      .catch(() => {
        setActivities([])
      })
      .finally(() => {
        setLoading(false)
      })
  }, [])

  return { activities, loading }
}
