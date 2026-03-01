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

    const { fileName, fileType, projectId, folder } = await request.json()

    if (!fileName || !fileType) {
      return NextResponse.json({ error: "fileName and fileType are required" }, { status: 400 })
    }

    // Sanitise filename for use as S3 key segment
    const safeName = fileName.replace(/[^a-zA-Z0-9._-]/g, "_")
    // Support projectId (documents) or generic folder (reports, etc.)
    const prefix = projectId ? `projects/${projectId}` : (folder ?? "uploads")
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
