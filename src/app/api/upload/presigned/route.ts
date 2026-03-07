import { NextRequest, NextResponse } from "next/server"

import { verifyAccessToken } from "@/lib/auth/tokens"
import { createPresignedUploadUrl, getPublicUrl } from "@/lib/aws/s3"

export async function POST(request: NextRequest) {
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

    const { fileName, fileType, projectId, boardId, folder, subFolder } = await request.json()

    if (!fileName || !fileType) {
      return NextResponse.json({ error: "fileName and fileType are required" }, { status: 400 })
    }

    const safeName = fileName.replace(/[^a-zA-Z0-9._-]/g, "_")
    // projectId => projects/{id}; boardId + subFolder => boards/{boardId}/tasks/{taskId}; else folder or uploads
    let prefix: string
    if (boardId && subFolder) {
      prefix = `boards/${boardId}/${subFolder}`
    } else if (projectId) {
      prefix = subFolder ? `projects/${projectId}/${subFolder}` : `projects/${projectId}`
    } else {
      prefix = subFolder ? `${folder ?? "uploads"}/${subFolder}` : (folder ?? "uploads")
    }
    const key = `${prefix}/${Date.now()}-${safeName}`

    const uploadUrl = await createPresignedUploadUrl(key, fileType)
    const publicUrl = getPublicUrl(key)

    return NextResponse.json({ uploadUrl, publicUrl, key })
  } catch (error: any) {
    console.error("Presigned URL error:", error)
    return NextResponse.json(
      { error: error.message || "Failed to generate upload URL" },
      { status: 500 }
    )
  }
}
