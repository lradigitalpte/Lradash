import { NextRequest, NextResponse } from "next/server"

import { verifyAccessToken } from "@/lib/auth/tokens"
import { connectToDatabase } from "@/lib/db/connect"
import { MarketingReportModel } from "@/models/marketing-report.model"

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

    const reports = await MarketingReportModel.find({ projectId }).sort({ createdAt: -1 }).lean()

    return NextResponse.json(
      reports.map((r) => ({
        id: r._id.toString(),
        projectId: r.projectId.toString(),
        name: r.name,
        selectedMetrics: r.selectedMetrics,
        createdBy: r.createdBy.toString(),
        sharedWith: r.sharedWith.map((id) => id.toString()),
        isPublic: r.isPublic,
        createdAt: r.createdAt,
        updatedAt: r.updatedAt
      })),
      {
        status: 200,
        headers: { "Content-Type": "application/json" }
      }
    )
  } catch (error) {
    console.error("Get reports error:", error)
    return NextResponse.json(
      { error: "Failed to fetch reports" },
      { status: 500, headers: { "Content-Type": "application/json" } }
    )
  }
}

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
    const { name, selectedMetrics, sharedWith, isPublic } = body

    if (!name || !selectedMetrics) {
      return NextResponse.json(
        { error: "Name and selectedMetrics are required" },
        { status: 400, headers: { "Content-Type": "application/json" } }
      )
    }

    await connectToDatabase()

    const report = await MarketingReportModel.create({
      projectId,
      name,
      selectedMetrics,
      createdBy: decoded.userId,
      sharedWith: sharedWith || [],
      isPublic: isPublic || false
    })

    return NextResponse.json(
      {
        id: report._id.toString(),
        projectId: report.projectId.toString(),
        name: report.name,
        selectedMetrics: report.selectedMetrics,
        createdBy: report.createdBy.toString(),
        sharedWith: report.sharedWith.map((id) => id.toString()),
        isPublic: report.isPublic,
        createdAt: report.createdAt,
        updatedAt: report.updatedAt
      },
      {
        status: 201,
        headers: { "Content-Type": "application/json" }
      }
    )
  } catch (error) {
    console.error("Create report error:", error)
    return NextResponse.json(
      { error: "Failed to create report" },
      { status: 500, headers: { "Content-Type": "application/json" } }
    )
  }
}

export async function DELETE(
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
    const { searchParams } = new URL(request.url)
    const reportId = searchParams.get("reportId")

    if (!reportId) {
      return NextResponse.json(
        { error: "reportId is required" },
        { status: 400, headers: { "Content-Type": "application/json" } }
      )
    }

    await connectToDatabase()

    const result = await MarketingReportModel.deleteOne({
      _id: reportId,
      projectId,
      createdBy: decoded.userId // Only creator can delete
    })

    if (result.deletedCount === 0) {
      return NextResponse.json(
        { error: "Report not found or unauthorized" },
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
    console.error("Delete report error:", error)
    return NextResponse.json(
      { error: "Failed to delete report" },
      { status: 500, headers: { "Content-Type": "application/json" } }
    )
  }
}
