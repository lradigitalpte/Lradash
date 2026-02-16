import mongoose from "mongoose"
import { NextRequest, NextResponse } from "next/server"

import { connectToDatabase } from "@/lib/db/connect"

interface SocialStrategy {
  _id?: string
  projectId: string
  type: string
  title: string
  description?: string
  status: string
  platforms: string[]
  targetAudience?: string
  implementationSteps?: string[]
  metrics?: {
    targetReach?: number
    targetEngagement?: number
    targetROI?: number
  }
  createdAt?: Date
  updatedAt?: Date
}

const socialStrategySchema = new mongoose.Schema({
  projectId: String,
  type: String,
  title: String,
  description: String,
  status: String,
  platforms: [String],
  targetAudience: String,
  implementationSteps: [String],
  metrics: {
    targetReach: Number,
    targetEngagement: Number,
    targetROI: Number
  },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
})

const SocialStrategy =
  mongoose.models.SocialStrategy || mongoose.model("SocialStrategy", socialStrategySchema)

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ projectId: string }> }
) {
  try {
    const { projectId } = await params
    await connectToDatabase()

    const strategies = await SocialStrategy.find({ projectId }).lean()

    return NextResponse.json({ strategies })
  } catch (error) {
    console.error("Failed to fetch strategies:", error)
    return NextResponse.json({ error: "Failed to fetch strategies" }, { status: 500 })
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ projectId: string }> }
) {
  try {
    const { projectId } = await params
    await connectToDatabase()

    const body = await request.json()

    const strategy = new SocialStrategy({
      ...body,
      projectId,
      createdAt: new Date(),
      updatedAt: new Date()
    })

    await strategy.save()

    return NextResponse.json(strategy, { status: 201 })
  } catch (error) {
    console.error("Failed to create strategy:", error)
    return NextResponse.json({ error: "Failed to create strategy" }, { status: 500 })
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ projectId: string }> }
) {
  try {
    await params
    await connectToDatabase()

    const body = await request.json()
    const { id } = body

    if (!id) {
      return NextResponse.json({ error: "Strategy ID is required" }, { status: 400 })
    }

    const strategy = await SocialStrategy.findByIdAndUpdate(
      id,
      {
        ...body,
        updatedAt: new Date()
      },
      { new: true }
    )

    if (!strategy) {
      return NextResponse.json({ error: "Strategy not found" }, { status: 404 })
    }

    return NextResponse.json(strategy)
  } catch (error) {
    console.error("Failed to update strategy:", error)
    return NextResponse.json({ error: "Failed to update strategy" }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ projectId: string }> }
) {
  try {
    await params
    await connectToDatabase()

    const { searchParams } = new URL(request.url)
    const id = searchParams.get("id")

    if (!id) {
      return NextResponse.json({ error: "Strategy ID is required" }, { status: 400 })
    }

    const strategy = await SocialStrategy.findByIdAndDelete(id)

    if (!strategy) {
      return NextResponse.json({ error: "Strategy not found" }, { status: 404 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Failed to delete strategy:", error)
    return NextResponse.json({ error: "Failed to delete strategy" }, { status: 500 })
  }
}
