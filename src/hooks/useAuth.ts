"use client"

import { useRouter } from "next/navigation"
import { useCallback, useState, useEffect } from "react"

interface AuthUser {
  id: string
  email: string
  name: string
  orgRole?: string
  isClient?: boolean
}

export function useAuth() {
  const [accessToken, setAccessToken] = useState<string | null>(null)
  const [user, setUser] = useState<AuthUser | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isMounted, setIsMounted] = useState(false)
  const router = useRouter()

  // Initialize from localStorage on client mount
  useEffect(() => {
    setIsMounted(true)
    if (typeof window !== "undefined") {
      const token = localStorage.getItem("accessToken")
      const storedUser = localStorage.getItem("user")

      if (token) {
        setAccessToken(token)
      }

      if (storedUser) {
        try {
          setUser(JSON.parse(storedUser))
        } catch (error) {
          console.error("Failed to parse stored user:", error)
        }
      }
    }
  }, [])

  const register = useCallback(async (email: string, password: string, name: string) => {
    setIsLoading(true)
    try {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, name }),
        credentials: "include"
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || "Registration failed")
      }

      const data = await response.json()
      setAccessToken(data.accessToken)
      setUser(data.user)
      if (typeof window !== "undefined") {
        localStorage.setItem("accessToken", data.accessToken)
        localStorage.setItem("user", JSON.stringify(data.user))
      }
      return { success: true, user: data.user }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Registration failed"
      }
    } finally {
      setIsLoading(false)
    }
  }, [])

  const login = useCallback(async (email: string, password: string) => {
    setIsLoading(true)
    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
        credentials: "include"
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || "Login failed")
      }

      const data = await response.json()
      setAccessToken(data.accessToken)
      setUser(data.user)
      if (typeof window !== "undefined") {
        localStorage.setItem("accessToken", data.accessToken)
        localStorage.setItem("user", JSON.stringify(data.user))
      }
      return { success: true, user: data.user }
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : "Login failed" }
    } finally {
      setIsLoading(false)
    }
  }, [])

  const logout = useCallback(async () => {
    setIsLoading(true)
    try {
      await fetch("/api/auth/logout", {
        method: "POST",
        credentials: "include"
      })

      setAccessToken(null)
      setUser(null)
      if (typeof window !== "undefined") {
        localStorage.removeItem("accessToken")
        localStorage.removeItem("user")
      }
      router.push("/en/login")
    } catch (error) {
      console.error("Logout error:", error)
    } finally {
      setIsLoading(false)
    }
  }, [router])

  const getAccessToken = useCallback(() => {
    if (!isMounted || typeof window === "undefined") {
      return accessToken
    }
    return accessToken || localStorage.getItem("accessToken")
  }, [accessToken, isMounted])

  return {
    user,
    accessToken: getAccessToken(),
    isLoading,
    isMounted,
    register,
    login,
    logout
  }
}
