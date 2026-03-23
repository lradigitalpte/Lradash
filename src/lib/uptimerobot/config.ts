import mongoose from "mongoose"

import { connectToDatabase } from "@/lib/db/connect"

const COLLECTION = "uptimerobotintegrations"

export async function getUptimeRobotTokenForOrg(organizationId: string): Promise<string | null> {
  if (!mongoose.Types.ObjectId.isValid(organizationId)) {
    return null
  }
  await connectToDatabase()
  const db = mongoose.connection.db!
  const doc = await db.collection(COLLECTION).findOne({
    organizationId: new mongoose.Types.ObjectId(organizationId)
  })
  return (doc?.apiToken as string) ?? null
}

export async function getUptimeRobotConfigForOrg(
  organizationId: string
): Promise<{ apiToken: string | null; statusPageUrl: string }> {
  if (!mongoose.Types.ObjectId.isValid(organizationId)) {
    return { apiToken: null, statusPageUrl: "" }
  }
  await connectToDatabase()
  const db = mongoose.connection.db!
  const doc = await db.collection(COLLECTION).findOne({
    organizationId: new mongoose.Types.ObjectId(organizationId)
  })
  return {
    apiToken: (doc?.apiToken as string) ?? null,
    statusPageUrl: (doc?.statusPageUrl as string) ?? ""
  }
}
