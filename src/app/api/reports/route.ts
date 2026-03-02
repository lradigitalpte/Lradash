import { NextRequest, NextResponse } from "next/server"

import { verifyAccessToken } from "@/lib/auth/tokens"
import { connectToDatabase } from "@/lib/db/connect"
import { ReportModel } from "@/models/report.model"
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

    const user = await UserModel.findById(decoded.userId)
    if (!user?.defaultOrganizationId) {
      return NextResponse.json({ error: "No organization set" }, { status: 400 })
    }

    // Get reports ONLY submitted by the current user (personal reports)
    const reports = await ReportModel.find({
      organizationId: user.defaultOrganizationId,
      "submittedBy.id": user._id,
      deletedAt: null
    })
      .populate("submittedBy.id", "name email avatar")
      .sort({ createdAt: -1 })

    // Map to ensure avatar is included from the populated user data
    const enrichedReports = reports.map((report: any) => {
      const reportObj = report.toObject ? report.toObject() : report
      if (reportObj.submittedBy && typeof reportObj.submittedBy.id === "object") {
        reportObj.submittedBy.avatar =
          reportObj.submittedBy.id.avatar || reportObj.submittedBy.avatar
      }
      return reportObj
    })

    return NextResponse.json(enrichedReports)
  } catch (error) {
    console.error("Fetch reports error:", error)
    return NextResponse.json({ error: "Failed to fetch reports" }, { status: 500 })
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
    const { title, description, fileUrl, fileName, fileType, fileSize, dueDate, weekNumber, year } =
      body

    const report = await ReportModel.create({
      title,
      description,
      organizationId: user.defaultOrganizationId,
      submittedBy: {
        id: user._id,
        name: user.name,
        email: user.email,
        avatar: user.avatar
      },
      submittedAt: new Date(),
      dueDate: dueDate ? new Date(dueDate) : new Date(),
      weekNumber: weekNumber || 1,
      year: year || new Date().getFullYear(),
      status: "submitted",
      fileType,
      fileUrl,
      fileName,
      fileSize: fileSize ?? "0 KB"
    })

    return NextResponse.json(report, { status: 201 })
  } catch (error) {
    console.error("Create report error:", error)
    return NextResponse.json({ error: "Failed to create report" }, { status: 500 })
  }
}
