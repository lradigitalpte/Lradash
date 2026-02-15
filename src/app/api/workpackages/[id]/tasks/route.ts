import { NextRequest, NextResponse } from "next/server"

import { verifyAccessToken } from "@/lib/auth/tokens"
import { connectToDatabase } from "@/lib/db/connect"
import { TaskModel } from "@/models/task.model"
import { WorkPackageModel } from "@/models/workpackage.model"

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
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

    await connectToDatabase()

    // Verify work package exists
    const workPackage = await WorkPackageModel.findOne({
      _id: id,
      deletedAt: null
    })

    if (!workPackage) {
      return NextResponse.json(
        { error: "Work package not found" },
        { status: 404, headers: { "Content-Type": "application/json" } }
      )
    }

    // Fetch tasks linked to this work package
    const tasks = await TaskModel.find({
      workPackage: id,
      deletedAt: null
    })
      .populate("assignee", "name avatar email")
      .populate("creator", "name avatar email")
      .populate("workPackage", "title status priority")
      .sort({ createdAt: -1 })

    return NextResponse.json(tasks, {
      status: 200,
      headers: { "Content-Type": "application/json" }
    })
  } catch (error) {
    console.error("Get work package tasks error:", error)
    return NextResponse.json(
      { error: "Failed to fetch tasks" },
      { status: 500, headers: { "Content-Type": "application/json" } }
    )
  }
}
