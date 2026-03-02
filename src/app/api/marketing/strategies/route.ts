import { NextRequest, NextResponse } from "next/server"

import { verifyAccessToken } from "@/lib/auth/tokens"
import { connectToDatabase } from "@/lib/db/connect"
import { MarketingStrategyModel } from "@/models/marketing-strategy.model"
import { UserModel } from "@/models/user.model"

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization")
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const token = authHeader.substring(7)
    const decoded = verifyAccessToken(token)
    if (!decoded) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 })
    }

    await connectToDatabase()

    const { searchParams } = new URL(request.url)
    const projectId = searchParams.get("projectId")

    if (!projectId) {
      return NextResponse.json({ error: "projectId required" }, { status: 400 })
    }

    const strategies = await MarketingStrategyModel.find({
      projectId,
      deletedAt: null
    }).sort({ createdAt: -1 })

    return NextResponse.json(strategies)
  } catch (error) {
    console.error("Fetch strategies error:", error)
    return NextResponse.json({ error: "Failed to fetch strategies" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization")
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const token = authHeader.substring(7)
    const decoded = verifyAccessToken(token)
    if (!decoded) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 })
    }

    await connectToDatabase()

    const user = await UserModel.findById(decoded.userId)
    if (!user?.defaultOrganizationId) {
      return NextResponse.json({ error: "No organization set" }, { status: 400 })
    }

    const body = await request.json()
    const { projectId, title, description, platform, status, targets } = body

    if (!projectId || !title || !platform) {
      return NextResponse.json(
        { error: "projectId, title, and platform required" },
        { status: 400 }
      )
    }

    const strategy = await MarketingStrategyModel.create({
      projectId,
      organizationId: user.defaultOrganizationId,
      title,
      description,
      platform,
      status: status || "planning",
      targets,
      engagementLogs: [],
      createdBy: user._id
    })

    return NextResponse.json(strategy, { status: 201 })
  } catch (error) {
    console.error("Create strategy error:", error)
    return NextResponse.json({ error: "Failed to create strategy" }, { status: 500 })
  }
}
