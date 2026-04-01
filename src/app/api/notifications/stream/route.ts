/**
 * GET /api/notifications/stream
 *
 * Establishes a Server-Sent Events (SSE) connection for the authenticated user.
 * The browser keeps this connection open and receives real-time notification
 * payloads whenever a task is created or updated.
 *
 * The connection is kept alive with a heartbeat every 25 seconds.
 */

import { NextRequest } from "next/server"

import { verifyAccessToken } from "@/lib/auth/tokens"
import { getUserByEmail, getUserById } from "@/lib/db/user"
import { registerSseClient } from "@/lib/notifications/sse-emitter"

export const dynamic = "force-dynamic"
export const runtime = "nodejs"

export async function GET(request: NextRequest) {
  // Authenticate via Authorization header OR query param (EventSource doesn't support headers)
  let rawToken: string | null = null
  const authHeader = request.headers.get("authorization")
  if (authHeader?.startsWith("Bearer ")) {
    rawToken = authHeader.substring(7)
  } else {
    rawToken = request.nextUrl.searchParams.get("token")
  }

  if (!rawToken) {
    return new Response("Unauthorized", { status: 401 })
  }

  const decoded = verifyAccessToken(rawToken)
  if (!decoded || (!decoded.userId && !decoded.email)) {
    return new Response("Invalid token", { status: 401 })
  }

  const user = decoded.userId
    ? await getUserById(decoded.userId)
    : decoded.email
      ? await getUserByEmail(decoded.email)
      : null
  if (!user) {
    return new Response("User not found", { status: 404 })
  }

  const userId = String(user._id)

  // Build a ReadableStream that stays open
  const stream = new ReadableStream({
    start(controller) {
      const encoder = new TextEncoder()

      // Send an initial connection-established event
      controller.enqueue(
        encoder.encode(`event: connected\ndata: ${JSON.stringify({ userId })}\n\n`)
      )

      // Register this connection in the emitter registry
      const unregister = registerSseClient(userId, controller)

      // Heartbeat every 25s to keep the connection alive through proxies/NAT
      const heartbeat = setInterval(() => {
        try {
          controller.enqueue(encoder.encode(`: heartbeat\n\n`))
        } catch {
          clearInterval(heartbeat)
        }
      }, 25_000)

      // Clean up when the client disconnects
      request.signal.addEventListener("abort", () => {
        clearInterval(heartbeat)
        unregister()
        try {
          controller.close()
        } catch {
          // already closed
        }
      })
    }
  })

  return new Response(stream, {
    status: 200,
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no" // Disable nginx buffering
    }
  })
}
