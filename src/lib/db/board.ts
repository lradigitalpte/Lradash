"use server"

import { Types } from "mongoose"

import { BoardModel } from "@/models/board.model"
import { ProjectModel } from "@/models/project.model"
import { Board, BoardDocument, Project } from "@/types/dbInterface"

import { connectToDatabase } from "./connect"
import { getUserByEmail, getUserById } from "./user"

export async function fetchBoardsFromDb(userEmail: string): Promise<Board[]> {
  try {
    await connectToDatabase()
    const user = await getUserByEmail(userEmail)

    if (!user) {
      console.warn(`User not found for email: ${userEmail}. Returning empty board list.`)
      return []
    }

    const boardsFromDb = await BoardModel.find({
      $or: [{ owner: user._id }, { members: user._id }]
    })
      .populate("owner", "name")
      .populate("members", "name")
      .lean()

    return boardsFromDb.map((board) => convertBoardToPlainObject(board as BoardDocument, new Map()))
  } catch (error) {
    console.error("Error in fetchBoardsFromDb:", error)
    return []
  }
}

async function getUserMap(userIds: string[]): Promise<Map<string, string>> {
  const userMap = new Map<string, string>()
  const users = await Promise.all(userIds.map(async (id) => getUserById(id)))
  users.forEach((user) => {
    if (user) {
      userMap.set(user.id, user.name)
    }
  })
  return userMap
}

const getObjectIdString = (id: any): string => {
  if (id instanceof Types.ObjectId) {
    return id.toHexString()
  }
  if (id && typeof id === "object" && id._id) {
    return getObjectIdString(id._id)
  }
  return String(id)
}

function convertBoardToPlainObject(
  boardDoc: BoardDocument,
  userMap: Map<string, string> = new Map()
): Board {
  const owner = boardDoc.owner as any
  const ownerId = owner._id ? owner._id.toString() : getObjectIdString(boardDoc.owner)
  const ownerName = owner.name || "Unknown User"

  return {
    _id: boardDoc._id.toString(),
    title: boardDoc.title,
    description: boardDoc.description || "",
    owner: {
      id: ownerId,
      name: ownerName
    },
    members: (boardDoc.members || []).filter(Boolean).map((member: any) => {
      const id = member._id ? member._id.toString() : getObjectIdString(member)
      const name = member.name || "Unknown User"
      return {
        id,
        name
      }
    }),
    projects: [], // Boards don't have a projects array in the schema
    createdAt: new Date(boardDoc.createdAt),
    updatedAt: new Date(boardDoc.updatedAt)
  }
}

export async function createBoardInDb({
  title,
  userEmail,
  description
}: {
  title: string
  userEmail: string
  description?: string
}): Promise<Board | null> {
  try {
    await connectToDatabase()
    const user = await getUserByEmail(userEmail)
    if (!user) {
      throw new Error("User not found")
    }

    // For personal boards, we need organizationId
    const organizationId = user.defaultOrganizationId
    if (!organizationId) {
      throw new Error("User has no organization")
    }

    // For personal boards, create with organizationId but no specific projectId
    // This makes it a personal workspace board
    const newBoard = await BoardModel.create({
      title,
      description,
      organizationId,
      owner: user._id,
      projectId: null, // Personal boards don't belong to a specific project
      members: [user._id]
    })

    const userMap = new Map([[user._id.toString(), user.name]])
    return convertBoardToPlainObject(newBoard.toObject(), userMap)
  } catch (error) {
    console.error("Error in createBoardInDb:", error)
    return null
  }
}

export async function updateBoardInDb(
  boardId: string,
  data: Partial<Board>,
  userEmail: string
): Promise<Board | null> {
  try {
    await connectToDatabase()

    const user = await getUserByEmail(userEmail)
    if (!user) {
      throw new Error("User not found")
    }

    const existingBoard = await BoardModel.findById(boardId).lean()
    if (!existingBoard) {
      throw new Error("Board not found")
    }

    const existingOwnerId = getObjectIdString(existingBoard.owner)
    if (existingOwnerId !== user.id) {
      throw new Error("Unauthorized: Only board owner can update the board")
    }

    const board = await BoardModel.findByIdAndUpdate(boardId, { ...data }, { new: true }).lean()

    if (!board) {
      return null
    }

    const allUserIds = new Set<string>()
    const ownerId = getObjectIdString(board.owner)
    allUserIds.add(ownerId)

    // Handle member IDs
    ;(board.members || []).forEach((member) => {
      const memberId = getObjectIdString(member)
      allUserIds.add(memberId)
    })
    const userMap = await getUserMap(Array.from(allUserIds))

    return convertBoardToPlainObject(board as BoardDocument, userMap)
  } catch (error) {
    console.error("Error in updateBoardInDb:", error)
    return null
  }
}

export async function deleteBoardInDb(boardId: string, userEmail: string): Promise<boolean> {
  try {
    await connectToDatabase()

    const user = await getUserByEmail(userEmail)
    if (!user) {
      throw new Error("User not found")
    }

    const board = await BoardModel.findById(boardId).lean()
    if (!board) {
      throw new Error("Board not found")
    }

    const boardOwnerId = getObjectIdString(board.owner)
    const userId = getObjectIdString(user._id)
    if (boardOwnerId !== userId) {
      throw new Error("Unauthorized: Only board owner can delete the board")
    }

    const { TaskModel } = await import("@/models/task.model")
    await TaskModel.deleteMany({
      project: { $in: board.projects }
    })

    await ProjectModel.deleteMany({ board: boardId })
    await BoardModel.findByIdAndDelete(boardId)

    return true
  } catch (error) {
    console.error("Error in deleteBoardInDb:", error)
    return false
  }
}
