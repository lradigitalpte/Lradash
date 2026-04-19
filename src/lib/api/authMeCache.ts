/**
 * Deduplicates concurrent /api/auth/me fetches.
 *
 * RootWrapper and UserNav both mount on every workspace page and both need the
 * current user — this ensures only one request fires. Once it completes it is
 * cleared, so future navigations fetch fresh data.
 *
 * A short session-level cache (5 min) is kept only for auth/me because user
 * identity does not change during a session and hitting this endpoint on every
 * internal navigation is wasteful. The cache is cleared on logout.
 */
import { apiClient } from "@/lib/api/client"

interface AuthMeData {
  id?: string
  email: string
  name?: string
  avatar?: string
  orgRole?: string
  isClient?: boolean
  [key: string]: unknown
}

// 5 minutes — safe for identity data that never changes mid-session
const SESSION_TTL_MS = 5 * 60_000

let cachedData: AuthMeData | null = null
let cachedAt = 0
let activeFetch: Promise<AuthMeData> | null = null

export async function fetchAuthMeCached(): Promise<AuthMeData> {
  // Session-level cache: skip network if we fetched recently
  if (cachedData && Date.now() - cachedAt < SESSION_TTL_MS) {
    return cachedData
  }

  if (activeFetch) {
    return activeFetch
  }

  activeFetch = (async () => {
    const response = await apiClient.get("/api/auth/me")
    if (!response.ok) {
      throw new Error(`Failed to fetch user: ${response.statusText}`)
    }
    const data: AuthMeData = await response.json()
    cachedData = data
    cachedAt = Date.now()
    return data
  })().finally(() => {
    activeFetch = null
  })

  return activeFetch
}

/** Must be called on logout so the next login gets fresh identity data. */
export function invalidateAuthMeCache(): void {
  cachedData = null
  cachedAt = 0
}
