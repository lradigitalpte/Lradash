import { NextRequest, NextResponse } from "next/server"

import { verifyAccessToken } from "@/lib/auth/tokens"
import { connectToDatabase } from "@/lib/db/connect"
import { ProjectModel } from "@/models/project.model"
import { UserModel } from "@/models/user.model"

import { checkSEOAccess, logSEOAccess } from "./authorization"

/**
 * Middleware for SEO API endpoints
 */
export async function withSEOAuth(
  request: NextRequest,
  requiredPermission: "view" | "edit" | "admin" | "owner" = "view",
  handler: (request: NextRequest, context: any) => Promise<NextResponse>
): Promise<NextResponse> {
  try {
    // Verify authentication
    const authHeader = request.headers.get("authorization")
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json(
        { error: "Unauthorized - Missing or invalid token" },
        { status: 401, headers: { "Content-Type": "application/json" } }
      )
    }

    const token = authHeader.substring(7)
    const decoded = verifyAccessToken(token)

    if (!decoded) {
      return NextResponse.json(
        { error: "Invalid or expired token" },
        { status: 401, headers: { "Content-Type": "application/json" } }
      )
    }

    // Extract projectId from URL params or body
    const { pathname } = new URL(request.url)
    const pathMatch = pathname.match(/\/projects\/([^/]+)/)
    const projectId = pathMatch ? pathMatch[1] : null

    if (!projectId) {
      return NextResponse.json(
        { error: "Project ID not found in request" },
        { status: 400, headers: { "Content-Type": "application/json" } }
      )
    }

    // Check user's access to project
    await connectToDatabase()

    const user = await UserModel.findById(decoded.userId).lean()
    if (!user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404, headers: { "Content-Type": "application/json" } }
      )
    }

    const hasAccess = await checkSEOAccess(
      {
        userId: decoded.userId,
        email: decoded.email || user.email,
        role: decoded.role || "member"
      },
      projectId,
      requiredPermission
    )

    if (!hasAccess) {
      // Log unauthorized access attempt
      await logSEOAccess(decoded.userId, projectId, "unauthorized_access_attempt", {
        requiredPermission,
        endpoint: pathname,
        method: request.method
      })

      return NextResponse.json(
        { error: "Forbidden - Insufficient permissions" },
        { status: 403, headers: { "Content-Type": "application/json" } }
      )
    }

    // Log authorized access
    await logSEOAccess(decoded.userId, projectId, "access_authorized", {
      endpoint: pathname,
      method: request.method
    })

    // Create context for handler
    const context = {
      user: {
        id: decoded.userId,
        email: decoded.email || user.email,
        role: decoded.role || "member"
      },
      projectId,
      permission: requiredPermission
    }

    // Call the handler
    return await handler(request, context)
  } catch (error) {
    console.error("SEO Auth middleware error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500, headers: { "Content-Type": "application/json" } }
    )
  }
}

/**
 * Extract projectId from request (URL params or body)
 */
export function extractProjectId(request: NextRequest): string | null {
  const { pathname } = new URL(request.url)

  // Try to extract from URL pattern: /api/seo/{projectId}/...
  const pathMatch = pathname.match(/\/api\/seo\/([^/]+)/)
  if (pathMatch) {
    return pathMatch[1]
  }

  return null
}

/**
 * Error response helper
 */
export function seoErrorResponse(error: Error | string, status: number = 500): NextResponse {
  const message = typeof error === "string" ? error : error.message

  console.error("SEO API Error:", message)

  return NextResponse.json(
    {
      error: message,
      timestamp: new Date().toISOString()
    },
    { status, headers: { "Content-Type": "application/json" } }
  )
}

/**
 * Success response helper
 */
export function seoSuccessResponse(data: any, status: number = 200): NextResponse {
  return NextResponse.json(
    {
      ...data,
      timestamp: new Date().toISOString()
    },
    { status, headers: { "Content-Type": "application/json" } }
  )
}
