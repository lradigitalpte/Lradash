"use client"

import { createAuthClient } from "better-auth/react"

const client = createAuthClient({
  baseURL: process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"
})

export const { 
  signIn, 
  signUp, 
  signOut, 
  useSession 
} = client

// Legacy export for compatibility with existing code
export const authClient = {
  signIn,
  signUp,
  signOut,
  useSession,
  async getSession() {
    // Use useSession hook on client, or call the auth endpoint directly
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/api/auth/get-session`, {
        method: "GET",
        credentials: "include"
      })
      
      if (!response.ok) {
        return { data: null }
      }
      
      const data = await response.json()
      return { data }
    } catch (error) {
      console.error("Failed to get session:", error)
      return { data: null }
    }
  }
}
