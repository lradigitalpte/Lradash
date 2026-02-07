// API client that automatically attaches the auth token and handles refresh

let isRefreshing = false
let refreshPromise: Promise<string | null> | null = null

const getAccessToken = (): string | null => {
  if (typeof window === "undefined") return null
  return localStorage.getItem("accessToken")
}

const refreshToken = async (): Promise<string | null> => {
  // Prevent multiple simultaneous refresh calls
  if (isRefreshing && refreshPromise) {
    return refreshPromise
  }

  isRefreshing = true
  refreshPromise = (async () => {
    try {
      const response = await fetch("/api/auth/refresh", {
        method: "POST",
        credentials: "include"
      })

      if (!response.ok) {
        localStorage.removeItem("accessToken")
        localStorage.removeItem("user")
        window.location.href = "/en/login"
        return null
      }

      const data = await response.json()
      if (data.accessToken) {
        localStorage.setItem("accessToken", data.accessToken)
        if (data.user) {
          localStorage.setItem("user", JSON.stringify(data.user))
        }
        return data.accessToken
      }
      return null
    } catch {
      return null
    } finally {
      isRefreshing = false
      refreshPromise = null
    }
  })()

  return refreshPromise
}

const makeRequest = async (
  url: string,
  options: RequestInit = {}
): Promise<Response> => {
  const token = getAccessToken()
  const headers = new Headers(options.headers)

  if (token) {
    headers.set("Authorization", `Bearer ${token}`)
  }

  let response = await fetch(url, { ...options, headers, credentials: "include" })

  // If 401, try refreshing the token and retry once
  if (response.status === 401) {
    const newToken = await refreshToken()
    if (newToken) {
      headers.set("Authorization", `Bearer ${newToken}`)
      response = await fetch(url, { ...options, headers, credentials: "include" })
    }
  }

  return response
}

export const apiClient = {
  get: (url: string) => makeRequest(url, { method: "GET" }),

  post: (url: string, body: unknown) =>
    makeRequest(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body)
    }),

  put: (url: string, body: unknown) =>
    makeRequest(url, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body)
    }),

  delete: (url: string) => makeRequest(url, { method: "DELETE" })
}
