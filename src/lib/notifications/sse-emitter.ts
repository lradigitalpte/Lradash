/**
 * Server-Sent Events (SSE) emitter singleton.
 *
 * Keeps a registry of active SSE connections keyed by userId.
 * Task create/update routes call `emitToUser()` to push real-time
 * notification payloads to connected browser tabs.
 *
 * This lives in-process. For multi-instance deployments switch to a
 * Redis pub/sub or a managed SSE service.
 */

import type { INotificationDoc } from "@/models/notification.model"

interface SseClient {
  userId: string
  controller: ReadableStreamDefaultController
}

// Global registry – must survive hot-reloads in dev
const g = globalThis as any
if (!g.__sseClients) {
  g.__sseClients = new Map<string, Set<SseClient>>()
}

const clients: Map<string, Set<SseClient>> = g.__sseClients

/** Register an SSE controller for a user. Returns a cleanup function. */
export function registerSseClient(userId: string, controller: ReadableStreamDefaultController) {
  if (!clients.has(userId)) {
    clients.set(userId, new Set())
  }
  const client: SseClient = { userId, controller }
  clients.get(userId)!.add(client)

  return () => {
    clients.get(userId)?.delete(client)
    if (clients.get(userId)?.size === 0) {
      clients.delete(userId)
    }
  }
}

/** Push a notification payload to all open SSE connections for a user. */
export function emitToUser(userId: string, notification: INotificationDoc) {
  const userClients = clients.get(userId)
  if (!userClients || userClients.size === 0) {
    return
  }

  const data = `data: ${JSON.stringify(notification)}\n\n`
  const encoder = new TextEncoder()
  const stale: SseClient[] = []

  for (const client of userClients) {
    try {
      client.controller.enqueue(encoder.encode(data))
    } catch {
      // Client disconnected – clean up lazily
      stale.push(client)
    }
  }

  for (const s of stale) {
    userClients.delete(s)
  }
}

/** Number of currently connected SSE clients (useful for debugging). */
export function getSseClientCount(): number {
  let total = 0
  for (const s of clients.values()) {
    total += s.size
  }
  return total
}
