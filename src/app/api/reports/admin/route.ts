import { NextRequest, NextResponse } from "next/server"

import { verifyAccessToken } from "@/lib/auth/tokens"
import { connectToDatabase } from "@/lib/db/connect"
import { OrganizationModel } from "@/models/organization.model"
import { ReportModel } from "@/models/report.model"
import { UserModel } from "@/models/user.model"

/**
 * GET /api/reports/admin
 * Fetch ALL reports in the organization. Admin/Owner only.
 */
export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization")
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const token = authHeader.substring(7)
    const decoded = verifyAccessToken(token)
    if (!decoded) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 })
    }

    await connectToDatabase()

    const user = await UserModel.findById(decoded.userId).lean()
    if (!user?.defaultOrganizationId) {
      return NextResponse.json({ error: "No organization" }, { status: 400 })
    }

    // Look up the user's role from the organization's members array
    const org = await OrganizationModel.findById(user.defaultOrganizationId).lean()
    if (!org) {
      return NextResponse.json({ error: "Organization not found" }, { status: 404 })
    }

    const isOwner = String(org.owner) === String(user._id)
    const member = (org.members as any[]).find((m) => String(m.userId) === String(user._id))
    const memberRole: string = member?.role ?? "MEMBER"

    if (!isOwner && !["ADMIN", "OWNER"].includes(memberRole)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const status = searchParams.get("status")
    const week = searchParams.get("week")
    const year = searchParams.get("year")

    const query: Record<string, unknown> = {
      organizationId: org._id,
      deletedAt: null
    }
    if (status && status !== "all") {
      query.status = status
    }
    if (week) {
      query.weekNumber = Number(week)
    }
    if (year) {
      query.year = Number(year)
    }

    const reports = await ReportModel.find(query)
      .populate("submittedBy.id", "name email avatar")
      .sort({ submittedAt: -1 })
      .lean()

    // Normalize to plain JSON-safe shape for client components:
    // - submittedBy.id must always be a string (not populated object)
    // - keep latest profile fields when populate returned a user doc
    const enrichedReports = reports.map((report: any) => {
      const populated = report?.submittedBy?.id
      const isPopulatedUser = populated && typeof populated === "object"
      return {
        ...report,
        submittedBy: {
          ...report.submittedBy,
          id: String(isPopulatedUser ? populated._id : (report.submittedBy?.id ?? "")),
          name: isPopulatedUser
            ? populated.name || report.submittedBy?.name || ""
            : report.submittedBy?.name || "",
          email: isPopulatedUser
            ? populated.email || report.submittedBy?.email || ""
            : report.submittedBy?.email || "",
          avatar: isPopulatedUser
            ? populated.avatar || report.submittedBy?.avatar || ""
            : report.submittedBy?.avatar || ""
        }
      }
    })

    return NextResponse.json(enrichedReports)
  } catch (err) {
    console.error("Admin reports error:", err)
    return NextResponse.json({ error: "Failed to fetch reports" }, { status: 500 })
  }
}
