"use server"

import { UserModel } from "@/models/user.model"
import { User, UserInfo } from "@/types/dbInterface"
import { connectToDatabase } from "./connect"

// ========== CREATE USER ==========
export async function createUser(
  email: string,
  name: string,
  avatar?: string
): Promise<User | null> {
  try {
    await connectToDatabase()

    // Check if user already exists
    const existingUser = await UserModel.findOne({ email })
    if (existingUser) {
      console.error("User already exists")
      return null
    }

    const user = await UserModel.create({
      email: email.toLowerCase(),
      name,
      avatar,
      status: "ACTIVE",
      preferences: {
        theme: "light",
        language: "en",
        emailNotifications: true
      }
    })

    return user.toObject()
  } catch (error) {
    console.error("Error creating user:", error)
    return null
  }
}

// ========== GET USER BY EMAIL ==========
export async function getUserByEmail(email: string): Promise<User | null> {
  try {
    await connectToDatabase()
    const user = await UserModel.findOne({
      email: email.toLowerCase(),
      deletedAt: null
    }).lean()

    if (!user) {
      console.error("User not found")
      return null
    }

    return user as User
  } catch (error) {
    console.error("Error fetching user:", error)
    return null
  }
}

// ========== GET USER BY ID ==========
export async function getUserById(id: string): Promise<User | null> {
  try {
    await connectToDatabase()
    const user = await UserModel.findOne({
      _id: id,
      deletedAt: null
    }).lean()

    if (!user) {
      console.error("User not found")
      return null
    }

    return user as User
  } catch (error) {
    console.error("Error fetching user:", error)
    return null
  }
}

// ========== GET USER INFO (lightweight) ==========
export async function getUserInfo(userId: string): Promise<UserInfo | null> {
  try {
    await connectToDatabase()
    const user = await UserModel.findOne(
      { _id: userId, deletedAt: null },
      "name email avatar"
    ).lean()

    if (!user) {
      console.error("User not found")
      return null
    }

    return {
      id: user._id.toString(),
      name: user.name,
      email: user.email,
      avatar: user.avatar
    }
  } catch (error) {
    console.error("Error fetching user info:", error)
    return null
  }
}

// ========== UPDATE USER ==========
export async function updateUser(userId: string, updates: Partial<User>): Promise<User | null> {
  try {
    await connectToDatabase()

    // Prevent updating sensitive fields
    const { email, createdAt, ...safeUpdates } = updates as any

    const updatedUser = await UserModel.findByIdAndUpdate(userId, safeUpdates, {
      new: true
    })

    return updatedUser?.toObject() || null
  } catch (error) {
    console.error("Error updating user:", error)
    return null
  }
}

// ========== UPDATE USER PREFERENCES ==========
export async function updateUserPreferences(
  userId: string,
  preferences: Partial<User["preferences"]>
): Promise<boolean> {
  try {
    await connectToDatabase()

    const result = await UserModel.updateOne(
      { _id: userId },
      { $set: { "preferences": preferences } }
    )

    return result.modifiedCount > 0
  } catch (error) {
    console.error("Error updating preferences:", error)
    return false
  }
}

// ========== VERIFY EMAIL ==========
export async function verifyUserEmail(userId: string): Promise<boolean> {
  try {
    await connectToDatabase()

    const result = await UserModel.updateOne(
      { _id: userId },
      { emailVerified: new Date() }
    )

    return result.modifiedCount > 0
  } catch (error) {
    console.error("Error verifying email:", error)
    return false
  }
}

// ========== SOFT DELETE USER ==========
export async function softDeleteUser(userId: string): Promise<boolean> {
  try {
    await connectToDatabase()

    const result = await UserModel.updateOne(
      { _id: userId },
      { deletedAt: new Date() }
    )

    return result.modifiedCount > 0
  } catch (error) {
    console.error("Error deleting user:", error)
    return false
  }
}

// ========== CHECK USER EXISTS ==========
export async function userExists(email: string): Promise<boolean> {
  try {
    await connectToDatabase()

    const user = await UserModel.findOne({
      email: email.toLowerCase(),
      deletedAt: null
    }).lean()

    return !!user
  } catch (error) {
    console.error("Error checking user existence:", error)
    return false
  }
}
