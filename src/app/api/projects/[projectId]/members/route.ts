import { NextRequest, NextResponse } from "next/server"

import { requireOrganizationAccess } from "@/lib/auth/organization-access"
import { connectToDatabase } from "@/lib/db/connect"
import { getNotificationEmail } from "@/lib/email/get-notification-email"
import { sendUserEmail } from "@/lib/email/send-user-email"
import { getAppUrl } from "@/lib/url/get-app-url"
import { OrganizationModel } from "@/models/organization.model"
import { ProjectModel } from "@/models/project.model"
import { UserModel } from "@/models/user.model"
import { UserRole } from "@/types/dbInterface"

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ projectId: string }> }
) {
  try {
    const access = await requireOrganizationAccess(request)
    if ("error" in access) {
      return access.error
    }

    if (access.orgRole === UserRole.CLIENT) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    await connectToDatabase()

    const { projectId } = await params

    const project = await ProjectModel.findOne({
      _id: projectId,
      organizationId: access.org._id,
      deletedAt: null
    } as any)
      .populate("members", "name email avatar _id")
      .populate("owner", "name email avatar _id")
      .lean()

    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 })
    }

    const ownerObj = project.owner as any
    const membersList = (project.members as any[]) || []
    const isProjectOwner = ownerObj?._id?.toString() === access.user._id
    const isProjectMember = membersList.some((m) => m?._id?.toString() === access.user._id)
    const canAccessMembers =
      access.orgRole === UserRole.OWNER ||
      access.orgRole === UserRole.ADMIN ||
      isProjectOwner ||
      isProjectMember

    if (!canAccessMembers) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    // Build a deduplicated list: owner + members

    const allIds = new Set<string>()
    const result: any[] = []

    if (ownerObj && ownerObj._id) {
      const id = ownerObj._id.toString()
      allIds.add(id)
      result.push({ _id: id, name: ownerObj.name, email: ownerObj.email, avatar: ownerObj.avatar })
    }

    for (const m of membersList) {
      if (!m || !m._id) {
        continue
      }
      const id = m._id.toString()
      if (!allIds.has(id)) {
        allIds.add(id)
        result.push({ _id: id, name: m.name, email: m.email, avatar: m.avatar })
      }
    }

    return NextResponse.json(result, { status: 200 })
  } catch (error: any) {
    console.error("Get members error:", error)
    return NextResponse.json({ error: "Failed to fetch members" }, { status: 500 })
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ projectId: string }> }
) {
  try {
    const access = await requireOrganizationAccess(request)
    if ("error" in access) {
      return access.error
    }

    if (access.orgRole === UserRole.CLIENT) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    await connectToDatabase()

    const body = await request.json()
    const { email, userId: targetUserId } = body
    const { projectId } = await params

    if (!email && !targetUserId) {
      return NextResponse.json({ error: "Email or User ID is required" }, { status: 400 })
    }

    const organization = await OrganizationModel.findById(access.org._id).select("members").lean()
    const orgMemberIds = new Set(
      ((organization as any)?.members || []).map((member: any) => member.userId.toString())
    )

    let userToAdd

    if (targetUserId) {
      userToAdd = await UserModel.findOne({
        _id: targetUserId
      })
    } else {
      userToAdd = await UserModel.findOne({ email })
    }

    if (!userToAdd) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    if (!orgMemberIds.has(userToAdd._id.toString())) {
      return NextResponse.json(
        { error: "User must belong to this organization before being added to the project" },
        { status: 400 }
      )
    }

    const project = await ProjectModel.findOne({
      _id: projectId,
      organizationId: access.org._id,
      deletedAt: null
    } as any)

    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 })
    }

    const isProjectOwner = project.owner?.toString() === access.user._id
    const canManageMembers =
      access.orgRole === UserRole.OWNER || access.orgRole === UserRole.ADMIN || isProjectOwner

    if (!canManageMembers) {
      return NextResponse.json(
        { error: "Forbidden: owner/admin/project owner required" },
        { status: 403 }
      )
    }

    // Check if user is already a member
    const isMember = project.members.some((m: any) => m.toString() === userToAdd._id.toString())
    const isOwner = project.owner?.toString() === userToAdd._id.toString()
    if (isMember || isOwner) {
      return NextResponse.json({ error: "User is already a member" }, { status: 400 })
    }

    // Add user to members
    ;(project.members as any).push(userToAdd._id)
    await project.save()

    try {
      const actor = await UserModel.findById(access.user._id).select("name email avatar").lean()
      const projectTitle = (project as any).title || "Project"
      const appUrl = getAppUrl(request)
      const projectUrl = `${appUrl}/en/projects/${projectId}/team`

      if (String(userToAdd._id) !== String(access.user._id)) {
        await sendUserEmail({
          to: getNotificationEmail(userToAdd as any),
          type: "project_member_added",
          recipientName: userToAdd.name || userToAdd.email,
          subjectEntity: projectTitle,
          bodyText: `${(actor as any)?.name || "Someone"} added you to the project ${projectTitle}.`,
          actionUrl: projectUrl,
          actionLabel: "Open Project"
        })
      }
    } catch (emailError) {
      console.error("Project member email error:", emailError)
    }

    return NextResponse.json({ success: true, message: "Member added successfully" })
  } catch (error: any) {
    console.error("Add member error:", error)
    return NextResponse.json({ error: error.message || "Failed to add member" }, { status: 500 })
  }
}
