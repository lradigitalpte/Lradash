import { NextRequest, NextResponse } from "next/server"

import { verifyAccessToken } from "@/lib/auth/tokens"
import { connectToDatabase } from "@/lib/db/connect"
import { ReportModel } from "@/models/report.model"
import { UserModel } from "@/models/user.model"

export async function DELETE(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params

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

    // Find the report
    const report = await ReportModel.findById(id)
    if (!report) {
      return NextResponse.json({ error: "Report not found" }, { status: 404 })
    }

    // Check if the user is the one who submitted the report
    if (report.submittedBy.id.toString() !== user._id.toString()) {
      return NextResponse.json({ error: "You can only delete your own reports" }, { status: 403 })
    }

    // Check if report belongs to the user's organization
    if (report.organizationId.toString() !== user.defaultOrganizationId.toString()) {
      return NextResponse.json(
        { error: "Report does not belong to your organization" },
        { status: 403 }
      )
    }

    // Soft delete - set deletedAt timestamp
    report.deletedAt = new Date()
    await report.save()

    return NextResponse.json({ success: true, message: "Report deleted successfully" })
  } catch (error) {
    console.error("Delete report error:", error)
    return NextResponse.json({ error: "Failed to delete report" }, { status: 500 })
  }
}

export async function PUT(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params

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

    // Find the report
    const report = await ReportModel.findById(id)
    if (!report) {
      return NextResponse.json({ error: "Report not found" }, { status: 404 })
    }

    // Check if the user is the one who submitted the report
    if (report.submittedBy.id.toString() !== user._id.toString()) {
      return NextResponse.json({ error: "You can only update your own reports" }, { status: 403 })
    }

    // Check if report belongs to the user's organization
    if (report.organizationId.toString() !== user.defaultOrganizationId.toString()) {
      return NextResponse.json(
        { error: "Report does not belong to your organization" },
        { status: 403 }
      )
    }

    const body = await request.json()
    const { title, description, fileUrl, fileName, fileType, fileSize } = body

    // Update the report fields
    if (title !== undefined) {
      report.title = title
    }
    if (description !== undefined) {
      report.description = description
    }
    if (fileUrl !== undefined) {
      report.fileUrl = fileUrl
    }
    if (fileName !== undefined) {
      report.fileName = fileName
    }
    if (fileType !== undefined) {
      report.fileType = fileType
    }
    if (fileSize !== undefined) {
      report.fileSize = fileSize
    }

    // Update the timestamp
    report.submittedAt = new Date()

    const updatedReport = await report.save()

    return NextResponse.json(updatedReport)
  } catch (error) {
    console.error("Update report error:", error)
    return NextResponse.json({ error: "Failed to update report" }, { status: 500 })
  }
}
