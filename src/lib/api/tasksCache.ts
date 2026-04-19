/**
 * Deduplicates concurrent /api/tasks fetches.
 *
 * Only coalesces requests that fire at the same time (e.g. useTaskStats and
 * useRecentActivity both mounting on the dashboard). Once the in-flight request
 * completes it is cleared, so the next mount always gets a fresh network call.
 * There is intentionally NO TTL cache — stale data is never a concern.
 */
import { apiClient } from "@/lib/api/client"
import { Task } from "@/types/dbInterface"

let activeFetch: Promise<Task[]> | null = null

export async function fetchTasksCached(): Promise<Task[]> {
  // Reuse the in-flight request if one is already running
  if (activeFetch) {
    return activeFetch
  }

  activeFetch = (async () => {
    const response = await apiClient.get("/api/tasks")
    if (!response.ok) {
      throw new Error(`Failed to fetch tasks: ${response.statusText}`)
    }
    return (await response.json()) as Task[]
  })().finally(() => {
    activeFetch = null
  })

  return activeFetch
}
