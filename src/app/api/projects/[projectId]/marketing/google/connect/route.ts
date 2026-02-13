import { NextRequest, NextResponse } from "next/server"

import { verifyAccessToken } from "@/lib/auth/tokens"
import { connectToDatabase } from "@/lib/db/connect"
import { GoogleConnectionModel } from "@/models/google-connection.model"

// This is a placeholder for Google OAuth flow
// In production, you would:
// 1. Redirect to Google OAuth consent screen
// 2. Handle callback with authorization code
// 3. Exchange code for access/refresh tokens
// 4. Store tokens in database

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ projectId: string }> }
) {
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

    const { projectId } = await params
    const body = await request.json()
    const { propertyUrl, propertyType } = body

    if (!propertyUrl || !propertyType) {
      return NextResponse.json(
        { error: "propertyUrl and propertyType are required" },
        { status: 400, headers: { "Content-Type": "application/json" } }
      )
    }

    await connectToDatabase()

    // TODO: In production, implement real OAuth flow
    // For now, create a mock connection
    const connection = await GoogleConnectionModel.findOneAndUpdate(
      { projectId },
      {
        projectId,
        accessToken: "mock_access_token_" + Date.now(),
        refreshToken: "mock_refresh_token_" + Date.now(),
        tokenExpiresAt: new Date(Date.now() + 3600000), // 1 hour
        propertyUrl,
        propertyType,
        isActive: true,
        lastSyncedAt: new Date()
      },
      { upsert: true, new: true }
    )

    return NextResponse.json(
      {
        id: connection._id.toString(),
        projectId: connection.projectId.toString(),
        propertyUrl: connection.propertyUrl,
        propertyType: connection.propertyType,
        isActive: connection.isActive,
        connectedAt: connection.createdAt
      },
      {
        status: 201,
        headers: { "Content-Type": "application/json" }
      }
    )
  } catch (error) {
    console.error("Connect Google error:", error)
    return NextResponse.json(
      { error: "Failed to connect Google account" },
      { status: 500, headers: { "Content-Type": "application/json" } }
    )
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ projectId: string }> }
) {
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

    const { projectId } = await params

    await connectToDatabase()

    const connection = await GoogleConnectionModel.findOne({ projectId }).lean()

    if (!connection) {
      return NextResponse.json(
        { connected: false },
        {
          status: 200,
          headers: { "Content-Type": "application/json" }
        }
      )
    }

    return NextResponse.json(
      {
        connected: true,
        propertyUrl: connection.propertyUrl,
        propertyType: connection.propertyType,
        isActive: connection.isActive,
        lastSyncedAt: connection.lastSyncedAt,
        connectedAt: connection.createdAt
      },
      {
        status: 200,
        headers: { "Content-Type": "application/json" }
      }
    )
  } catch (error) {
    console.error("Get Google connection error:", error)
    return NextResponse.json(
      { error: "Failed to fetch connection status" },
      { status: 500, headers: { "Content-Type": "application/json" } }
    )
  }
}
