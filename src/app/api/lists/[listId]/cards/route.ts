import { NextRequest, NextResponse } from "next/server"

import { verifyAccessToken } from "@/lib/auth/tokens"
import { connectToDatabase } from "@/lib/db/connect"
import { ListModel } from "@/models/list.model"
import { TaskModel } from "@/models/task.model"

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ listId: string }> }
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

    if (!decoded || !decoded.organizationId) {
      return NextResponse.json(
        { error: "Invalid token" },
        { status: 401, headers: { "Content-Type": "application/json" } }
      )
    }

    const { listId } = await params
    const body = await request.json()
    const { title } = body

    if (!title) {
      return NextResponse.json({ error: "Title is required" }, { status: 400 })
    }

    await connectToDatabase()

    // Find the list to get projectId and boardId
    const list = await ListModel.findOne({
      _id: listId,
      organizationId: decoded.organizationId
    })

    if (!list) {
      return NextResponse.json({ error: "List not found" }, { status: 404 })
    }

    // Create the task
    const taskDoc = await TaskModel.create({
      title,
      description: "",
      status:
        list.title.toUpperCase().replace(/\s+/g, "_") === "DONE"
          ? "DONE"
          : list.title.toUpperCase().replace(/\s+/g, "_") === "IN_PROGRESS"
            ? "IN_PROGRESS"
            : "TODO",
      organizationId: decoded.organizationId,
      board: list.boardId,
      project: list.projectId,
      creator: decoded.userId,
      lastModifier: decoded.userId,
      priority: "MEDIUM"
    } as any)

    const task = taskDoc.toObject ? taskDoc.toObject() : taskDoc

    // Add task to list
    await ListModel.updateOne({ _id: listId }, { $push: { cardIds: (task as any)._id } })

    return NextResponse.json(
      {
        _id: (task as any)._id.toString(),
        title: (task as any).title,
        description: (task as any).description,
        listId: listId,
        position: 999,
        labels: [],
        members: [],
        checklist: [],
        attachments: [],
        createdAt: (task as any).createdAt
      },
      {
        status: 201,
        headers: { "Content-Type": "application/json" }
      }
    )
  } catch (error) {
    console.error("Create card error:", error)
    return NextResponse.json(
      { error: "Failed to create card" },
      { status: 500, headers: { "Content-Type": "application/json" } }
    )
  }
}
