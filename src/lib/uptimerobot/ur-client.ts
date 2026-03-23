export type UptimeRobotMonitor = any

export interface UptimeRobotListResponse {
  [key: string]: any
}

const BASE_URL = "https://api.uptimerobot.com/v3"

function buildAuthHeader(token: string) {
  // UptimeRobot v3 may require either Basic or Bearer depending on how your API key is issued.
  // We start with Bearer because UR is explicitly asking for:
  //   Expected "Bearer <token>".
  return `Bearer ${token}`
}

export async function urRequest<T>(
  token: string,
  opts: {
    path: string
    method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE"
    query?: Record<string, string | number | boolean | undefined>
    body?: any
  }
): Promise<T> {
  const { path, method = "GET", query, body } = opts
  const url = new URL(`${BASE_URL}${path}`)
  if (query) {
    for (const [k, v] of Object.entries(query)) {
      if (v === undefined) {
        continue
      }
      url.searchParams.set(k, String(v))
    }
  }

  const res = await fetch(url.toString(), {
    method,
    headers: {
      Authorization: buildAuthHeader(token),
      "Content-Type": "application/json"
    },
    body: body ? JSON.stringify(body) : undefined
  })

  if (!res.ok) {
    const text = await res.text().catch(() => "")
    throw new Error(`UptimeRobot request failed (${res.status}): ${text || res.statusText}`)
  }

  return (await res.json()) as T
}
