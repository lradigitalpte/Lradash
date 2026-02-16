import { verifyAccessToken } from "@/lib/auth/tokens"
import { connectToDatabase } from "@/lib/db/connect"
import { ProjectModel } from "@/models/project.model"
import { UserModel } from "@/models/user.model"

export interface AuthenticatedUser {
  userId: string
  email: string
  role: string
}

export interface SEOAccessContext {
  user: AuthenticatedUser
  projectId: string
  permission: "view" | "edit" | "admin" | "owner"
}

/**
 * Verify authentication token and return user info
 */
export async function verifySEOAuth(authHeader: string | null): Promise<AuthenticatedUser | null> {
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return null
  }

  const token = authHeader.substring(7)
  const decoded = verifyAccessToken(token)

  if (!decoded) {
    return null
  }

  return {
    userId: decoded.userId,
    email: decoded.email,
    role: decoded.role || "member"
  }
}

/**
 * Check if user has permission to access SEO data for a project
 */
export async function checkSEOAccess(
  user: AuthenticatedUser,
  projectId: string,
  requiredPermission: "view" | "edit" | "admin" | "owner" = "view"
): Promise<boolean> {
  await connectToDatabase()

  // Get user details
  const userDetails = await UserModel.findById(user.userId).lean()
  if (!userDetails) {
    return false
  }

  // Super admins have full access
  if (userDetails.role === "admin" || userDetails.role === "superadmin") {
    return true
  }

  // Get project and check membership
  const project = await ProjectModel.findById(projectId).lean()

  if (!project) {
    return false
  }

  // Check if user is the owner or a project member
  let role = "viewer"
  const isOwner = project.owner.toString() === user.userId
  const isMember =
    project.members &&
    Array.isArray(project.members) &&
    project.members.some((m) => m.toString() === user.userId)

  if (isOwner) {
    role = "owner"
  } else if (isMember) {
    role = "member"
  } else {
    return false
  }

  // Check if user has required permission based on their role
  const userPermission = getPermissionFromRole(role)
  const permissionLevels = ["view", "edit", "admin", "owner"]

  const requiredLevel = permissionLevels.indexOf(requiredPermission)
  const userLevel = permissionLevels.indexOf(userPermission)

  return userLevel >= requiredLevel
}

/**
 * Get project permission level from user role
 */
function getPermissionFromRole(role: string): "view" | "edit" | "admin" | "owner" {
  switch (role) {
    case "owner":
      return "owner"
    case "admin":
      return "admin"
    case "editor":
      return "edit"
    case "member":
    case "viewer":
      return "view"
    default:
      return "view"
  }
}

/**
 * Middleware to verify SEO access and return context
 */
export async function getSEOAccessContext(
  authHeader: string | null,
  projectId: string,
  requiredPermission: "view" | "edit" | "admin" | "owner" = "view"
): Promise<SEOAccessContext | null> {
  const user = await verifySEOAuth(authHeader)
  if (!user) {
    return null
  }

  const hasAccess = await checkSEOAccess(user, projectId, requiredPermission)
  if (!hasAccess) {
    return null
  }

  return {
    user,
    projectId,
    permission: requiredPermission
  }
}

/**
 * Audit log for SEO data access
 */
export async function logSEOAccess(
  userId: string,
  projectId: string,
  action: string,
  details?: any
): Promise<void> {
  await connectToDatabase()

  // TODO: Create SEOAuditLog model and store access logs
  // This would track:
  // - Who accessed what SEO data
  // - When they accessed it
  // - What actions they performed
  // - Any changes made

  console.log(`SEO Access Log: User ${userId} ${action} on project ${projectId}`, details)
}

/**
 * Check if user can export SEO data
 */
export async function canExportSEOData(
  user: AuthenticatedUser,
  projectId: string
): Promise<boolean> {
  // Only users with edit or higher permissions can export
  return  checkSEOAccess(user, projectId, "edit")
}

/**
 * Check if user can manage SEO alerts
 */
export async function canManageSEOAlerts(
  user: AuthenticatedUser,
  projectId: string
): Promise<boolean> {
  // Only users with edit or higher permissions can manage alerts
  return  checkSEOAccess(user, projectId, "edit")
}

/**
 * Check if user can sync SEO data
 */
export async function canSyncSEOData(user: AuthenticatedUser, projectId: string): Promise<boolean> {
  // Only users with edit or higher permissions can sync data
  return  checkSEOAccess(user, projectId, "edit")
}

/**
 * Check if user can delete SEO data
 */
export async function canDeleteSEOData(
  user: AuthenticatedUser,
  projectId: string
): Promise<boolean> {
  // Only users with admin or owner permissions can delete data
  return  checkSEOAccess(user, projectId, "admin")
}

/**
 * Sanitize sensitive SEO data based on user permissions
 */
export function sanitizeSEOData<T extends Record<string, any>>(
  data: T,
  userPermission: "view" | "edit" | "admin" | "owner"
): Partial<T> {
  if (userPermission === "owner" || userPermission === "admin") {
    return data // Full access
  }

  if (userPermission === "edit") {
    // Remove sensitive metadata
    const { _id, createdAt, updatedAt, ...sanitized } = data
    return sanitized as Partial<T>
  }

  if (userPermission === "view") {
    // Further restrict data for viewers
    const { _id, createdAt, updatedAt, ...sanitized } = data as any
    // Remove detailed technical information
    if (sanitized.technical) {
      delete sanitized.technical?.coreWebVitals
      delete sanitized.technical?.crawlErrors
    }
    return sanitized as Partial<T>
  }

  return data
}

/**
 * Validate SEO data before storage
 */
export function validateSEOData(
  data: any,
  type: "metrics" | "keyword" | "page" | "alert"
): {
  valid: boolean
  errors: string[]
} {
  const errors: string[] = []

  switch (type) {
    case "metrics":
      if (!data.projectId) {
        errors.push("projectId is required")
      }
      if (!data.date) {
        errors.push("date is required")
      }
      if (!data.period) {
        errors.push("period is required")
      }
      if (data.period && !["daily", "weekly", "monthly"].includes(data.period)) {
        errors.push("period must be daily, weekly, or monthly")
      }
      break

    case "keyword":
      if (!data.projectId) {
        errors.push("projectId is required")
      }
      if (!data.keyword || typeof data.keyword !== "string") {
        errors.push("keyword is required and must be a string")
      }
      if (data.currentPosition && (data.currentPosition < 1 || data.currentPosition > 100)) {
        errors.push("currentPosition must be between 1 and 100")
      }
      if (data.difficulty && (data.difficulty < 0 || data.difficulty > 100)) {
        errors.push("difficulty must be between 0 and 100")
      }
      break

    case "page":
      if (!data.projectId) {
        errors.push("projectId is required")
      }
      if (!data.url || typeof data.url !== "string") {
        errors.push("url is required and must be a string")
      }
      if (data.url && !isValidUrl(data.url)) {
        errors.push("url must be a valid URL")
      }
      break

    case "alert":
      if (!data.projectId) {
        errors.push("projectId is required")
      }
      if (!data.name || typeof data.name !== "string") {
        errors.push("name is required and must be a string")
      }
      if (
        !data.type ||
        !["keyword", "page", "technical", "traffic", "competitor", "conversion"].includes(data.type)
      ) {
        errors.push(
          "type must be one of: keyword, page, technical, traffic, competitor, conversion"
        )
      }
      if (!data.conditions || !Array.isArray(data.conditions) || data.conditions.length === 0) {
        errors.push("conditions is required and must be a non-empty array")
      }
      break
  }

  return {
    valid: errors.length === 0,
    errors
  }
}

/**
 * Validate URL format
 */
function isValidUrl(url: string): boolean {
  try {
    new URL(url)
    return true
  } catch {
    return false
  }
}
