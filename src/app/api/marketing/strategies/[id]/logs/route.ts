import { NextRequest, NextResponse } from "next/server"

import { verifyAccessToken } from "@/lib/auth/tokens"
import { connectToDatabase } from "@/lib/db/connect"
import { MarketingStrategyModel } from "@/models/marketing-strategy.model"

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
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

    const { id } = await params
    const body = await request.json()
    const { date, likes, shares, comments, reach } = body

    if (
      !date ||
      typeof likes !== "number" ||
      typeof shares !== "number" ||
      typeof comments !== "number"
    ) {
      return NextResponse.json(
        { error: "date, likes, shares, and comments required" },
        { status: 400 }
      )
    }

    const strategy = await MarketingStrategyModel.findById(id)
    if (!strategy) {
      return NextResponse.json({ error: "Strategy not found" }, { status: 404 })
    }

    // Check if log for this date already exists
    const existingLogIndex = strategy.engagementLogs.findIndex(
      (log: { date: Date | string }) =>
        new Date(log.date).toDateString() === new Date(date).toDateString()
    )

    if (existingLogIndex >= 0) {
      // Update existing log
      strategy.engagementLogs[existingLogIndex] = {
        date: new Date(date),
        likes,
        shares,
        comments,
        reach: reach || 0
      }
    } else {
      // Add new log
      strategy.engagementLogs.push({
        date: new Date(date),
        likes,
        shares,
        comments,
        reach: reach || 0
      })
    }

    // Sort by date descending
    strategy.engagementLogs.sort(
      (a: { date: Date | string }, b: { date: Date | string }) =>
        new Date(b.date).getTime() - new Date(a.date).getTime()
    )

    await strategy.save()

    return NextResponse.json(strategy)
  } catch (error) {
    console.error("Add engagement log error:", error)
    return NextResponse.json({ error: "Failed to add engagement log" }, { status: 500 })
  }
}
