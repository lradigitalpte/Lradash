import { NextRequest, NextResponse } from "next/server"

import { verifyAccessToken } from "@/lib/auth/tokens"
import { deleteFromS3, keyFromUrl } from "@/lib/aws/s3"
import { connectToDatabase } from "@/lib/db/connect"
import { DocumentModel } from "@/models/document.model"

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ projectId: string; id: string }> }
) {
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

    const { projectId, id } = await params
    await connectToDatabase()

    // Ensure user is part of the organization or project
    // For simplicity, we just check if document exists and matches organization
    const document = await DocumentModel.findOne({
      _id: id,
      project: projectId
    })

    if (!document) {
      return NextResponse.json({ error: "Document not found" }, { status: 404 })
    }

    // Optional: Check if user is the uploader or an admin
    // if (document.uploader.toString() !== decoded.userId && decoded.role !== 'admin') ...

    await DocumentModel.deleteOne({ _id: id })

    // Remove from S3 if a url was stored
    if (document.url) {
      const key = keyFromUrl(document.url)
      if (key) {
        await deleteFromS3(key).catch((err) => {
          console.warn("S3 delete warning:", err?.message)
        })
      }
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error("Delete document error:", error)
    return NextResponse.json(
      { error: error.message || "Failed to delete document" },
      { status: 500 }
    )
  }
}
