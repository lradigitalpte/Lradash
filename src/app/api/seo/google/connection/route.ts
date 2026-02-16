import { NextRequest, NextResponse } from "next/server"

import { verifyAccessToken } from "@/lib/auth/tokens"
import { connectToDatabase } from "@/lib/db/connect"
import { GoogleConnectionModel } from "@/models/google-connection.model"

/**
 * DELETE - Clear/reset Google connection for a project
 * This is useful when tokens are corrupted and need re-authentication
 */
export async function DELETE(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization")
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401, headers: { "Content-Type": "application/json" } }
      )
    }

    const token = authHeader.substring(7)
    const decoded = verifyAccessToken(token)

    if (!decoded) {
      return NextResponse.json(
        { error: "Invalid token" },
        { status: 401, headers: { "Content-Type": "application/json" } }
      )
    }

    const body = await request.json()
    const { projectId } = body

    if (!projectId) {
      return NextResponse.json(
        { error: "projectId is required" },
        { status: 400, headers: { "Content-Type": "application/json" } }
      )
    }

    await connectToDatabase()

    // Delete connection record
    const result = await GoogleConnectionModel.findOneAndDelete({ projectId })

    if (!result) {
      return NextResponse.json(
        { error: "Connection not found" },
        { status: 404, headers: { "Content-Type": "application/json" } }
      )
    }

    console.log(`[Google Connection] Deleted connection for projectId: ${projectId}`)

    return NextResponse.json(
      {
        success: true,
        message: "Google connection cleared successfully. Please re-authenticate."
      },
      { status: 200, headers: { "Content-Type": "application/json" } }
    )
  } catch (error) {
    console.error("Delete Google connection error:", error)
    return NextResponse.json(
      { error: "Failed to delete connection", details: String(error) },
      { status: 500, headers: { "Content-Type": "application/json" } }
    )
  }
}

/**
 * GET - Get connection status with debug info
 */
export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization")
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401, headers: { "Content-Type": "application/json" } }
      )
    }

    const token = authHeader.substring(7)
    const decoded = verifyAccessToken(token)

    if (!decoded) {
      return NextResponse.json(
        { error: "Invalid token" },
        { status: 401, headers: { "Content-Type": "application/json" } }
      )
    }

    const { searchParams } = new URL(request.url)
    const projectId = searchParams.get("projectId")

    if (!projectId) {
      return NextResponse.json(
        { error: "projectId is required" },
        { status: 400, headers: { "Content-Type": "application/json" } }
      )
    }

    await connectToDatabase()

    const connection = await GoogleConnectionModel.findOne({ projectId }).lean()

    if (!connection) {
      return NextResponse.json(
        {
          connected: false,
          message: "No connection found"
        },
        { status: 200, headers: { "Content-Type": "application/json" } }
      )
    }

    // Return connection status without sensitive data
    return NextResponse.json(
      {
        connected: true,
        isActive: connection.isActive,
        propertyUrl: connection.propertyUrl,
        propertyType: connection.propertyType,
        lastSyncedAt: connection.lastSyncedAt,
        configuredAt: connection.configuredAt,
        hasAccessToken: !!connection.accessToken,
        hasRefreshToken: !!connection.refreshToken,
        tokenExpiresAt: connection.tokenExpiresAt,
        // Note: We don't return the actual tokens for security
        debugInfo: {
          accessTokenLength: connection.accessToken?.length || 0,
          refreshTokenLength: connection.refreshToken?.length || 0,
          isTokenExpired: connection.tokenExpiresAt
            ? new Date(connection.tokenExpiresAt) <= new Date()
            : false,
          clientIdConfigured: !!connection.clientId
        }
      },
      { status: 200, headers: { "Content-Type": "application/json" } }
    )
  } catch (error) {
    console.error("Get connection status error:", error)
    return NextResponse.json(
      { error: "Failed to get connection status" },
      { status: 500, headers: { "Content-Type": "application/json" } }
    )
  }
}
