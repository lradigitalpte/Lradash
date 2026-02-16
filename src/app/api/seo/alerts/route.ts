import { NextRequest, NextResponse } from "next/server"

import { verifyAccessToken } from "@/lib/auth/tokens"
import { connectToDatabase } from "@/lib/db/connect"
import { SEOAlertModel } from "@/models/seo-alert.model"

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
    const type = searchParams.get("type")
    const isActive = searchParams.get("isActive")

    if (!projectId) {
      return NextResponse.json(
        { error: "projectId is required" },
        { status: 400, headers: { "Content-Type": "application/json" } }
      )
    }

    await connectToDatabase()

    // Build query
    const query: any = { projectId }

    if (type) {
      query.type = type
    }

    if (isActive !== undefined && isActive !== null) {
      query.isActive = isActive === "true"
    }

    // Fetch alerts
    const alerts = await SEOAlertModel.find(query).sort({ createdAt: -1 }).lean()

    return NextResponse.json(
      alerts.map((a) => ({
        id: a._id.toString(),
        projectId: a.projectId.toString(),
        name: a.name,
        type: a.type,
        conditions: a.conditions,
        frequency: a.frequency,
        notificationChannels: a.notificationChannels,
        recipients: a.recipients.map((id) => id.toString()),
        isActive: a.isActive,
        lastTriggered: a.lastTriggered,
        triggerCount: a.triggerCount,
        createdBy: a.createdBy.toString(),
        createdAt: a.createdAt,
        updatedAt: a.updatedAt
      })),
      {
        status: 200,
        headers: { "Content-Type": "application/json" }
      }
    )
  } catch (error) {
    console.error("Get SEO alerts error:", error)
    return NextResponse.json(
      { error: "Failed to fetch SEO alerts" },
      { status: 500, headers: { "Content-Type": "application/json" } }
    )
  }
}

export async function POST(request: NextRequest) {
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
    const { projectId, name, type, conditions, frequency, notificationChannels, recipients } = body

    if (!projectId || !name || !type || !conditions || !conditions.length) {
      return NextResponse.json(
        { error: "projectId, name, type, and conditions are required" },
        { status: 400, headers: { "Content-Type": "application/json" } }
      )
    }

    await connectToDatabase()

    const alert = await SEOAlertModel.create({
      projectId,
      name,
      type,
      conditions,
      frequency: frequency || "daily",
      notificationChannels: notificationChannels || {
        email: true,
        sms: false,
        inApp: true
      },
      recipients: recipients || [],
      createdBy: decoded.userId
    })

    return NextResponse.json(
      {
        id: alert._id.toString(),
        projectId: alert.projectId.toString(),
        name: alert.name,
        type: alert.type,
        conditions: alert.conditions,
        frequency: alert.frequency,
        notificationChannels: alert.notificationChannels,
        recipients: alert.recipients.map((id) => id.toString()),
        isActive: alert.isActive,
        lastTriggered: alert.lastTriggered,
        triggerCount: alert.triggerCount,
        createdBy: alert.createdBy.toString(),
        createdAt: alert.createdAt,
        updatedAt: alert.updatedAt
      },
      {
        status: 201,
        headers: { "Content-Type": "application/json" }
      }
    )
  } catch (error) {
    console.error("Create SEO alert error:", error)
    return NextResponse.json(
      { error: "Failed to create SEO alert" },
      { status: 500, headers: { "Content-Type": "application/json" } }
    )
  }
}

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

    const { searchParams } = new URL(request.url)
    const alertId = searchParams.get("alertId")

    if (!alertId) {
      return NextResponse.json(
        { error: "alertId is required" },
        { status: 400, headers: { "Content-Type": "application/json" } }
      )
    }

    await connectToDatabase()

    const result = await SEOAlertModel.deleteOne({
      _id: alertId,
      createdBy: decoded.userId // Only creator can delete
    })

    if (result.deletedCount === 0) {
      return NextResponse.json(
        { error: "Alert not found or unauthorized" },
        { status: 404, headers: { "Content-Type": "application/json" } }
      )
    }

    return NextResponse.json(
      { success: true },
      {
        status: 200,
        headers: { "Content-Type": "application/json" }
      }
    )
  } catch (error) {
    console.error("Delete SEO alert error:", error)
    return NextResponse.json(
      { error: "Failed to delete SEO alert" },
      { status: 500, headers: { "Content-Type": "application/json" } }
    )
  }
}
