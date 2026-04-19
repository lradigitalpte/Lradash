/**
 * Deduplicates concurrent /api/projects fetches.
 *
 * Only coalesces requests that fire at the same time (e.g. useProjectStats and
 * the projects page fetchProjects both mounting together). Once the in-flight
 * request completes it is cleared, so the next mount always gets a fresh call.
 * There is intentionally NO TTL cache — stale data is never a concern.
 */
import { apiClient } from "@/lib/api/client"

let activeFetch: Promise<unknown[]> | null = null

export async function fetchProjectsCached(): Promise<unknown[]> {
  if (activeFetch) {
    return activeFetch
  }

  activeFetch = (async () => {
    const response = await apiClient.get("/api/projects")
    if (!response.ok) {
      throw new Error(`Failed to fetch projects: ${response.statusText}`)
    }
    return (await response.json()) as unknown[]
  })().finally(() => {
    activeFetch = null
  })

  return activeFetch
}

/** Still exported for call sites that want to be explicit, but is a no-op now. */
export function invalidateProjectsCache(): void {
  // No TTL cache to clear — next call always fetches fresh
}
