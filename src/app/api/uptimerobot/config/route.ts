import mongoose from "mongoose"
import { NextRequest, NextResponse } from "next/server"

import { requireAdmin } from "@/lib/admin/guard"
import { connectToDatabase } from "@/lib/db/connect"

const COLLECTION = "uptimerobotintegrations"

export async function GET(request: NextRequest) {
  const guard = await requireAdmin(request)
  if ("error" in guard) {
    return guard.error
  }

  await connectToDatabase()
  const db = mongoose.connection.db!
  const tokenDoc = await db.collection(COLLECTION).findOne({
    organizationId: new mongoose.Types.ObjectId(String(guard.orgId))
  })

  return NextResponse.json({
    configured: !!tokenDoc?.apiToken,
    statusPageUrl: tokenDoc?.statusPageUrl ?? ""
  })
}

export async function PUT(request: NextRequest) {
  const guard = await requireAdmin(request)
  if ("error" in guard) {
    return guard.error
  }

  const body = await request.json().catch(() => ({}))
  const { apiToken, statusPageUrl } = body

  if (apiToken !== undefined) {
    if (!apiToken || typeof apiToken !== "string" || apiToken.trim().length < 10) {
      return NextResponse.json({ error: "apiToken is required (min 10 chars)" }, { status: 400 })
    }
  }

  await connectToDatabase()
  const db = mongoose.connection.db!

  const update: Record<string, any> = {
    updatedAt: new Date()
  }
  if (apiToken) {
    update.apiToken = apiToken.trim()
  }
  if (statusPageUrl !== undefined) {
    update.statusPageUrl = (statusPageUrl as string).trim()
  }

  await db.collection(COLLECTION).updateOne(
    { organizationId: new mongoose.Types.ObjectId(String(guard.orgId)) },
    {
      $set: update,
      $setOnInsert: {
        organizationId: new mongoose.Types.ObjectId(String(guard.orgId)),
        configuredAt: new Date()
      }
    },
    { upsert: true }
  )

  return NextResponse.json({ success: true, configured: true })
}
