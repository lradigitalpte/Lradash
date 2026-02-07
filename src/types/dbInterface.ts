// ========== ENUMS ==========
export enum TaskStatus {
  TODO = "TODO",
  IN_PROGRESS = "IN_PROGRESS",
  DONE = "DONE"
}

export enum TaskPriority {
  LOW = "LOW",
  MEDIUM = "MEDIUM",
  HIGH = "HIGH",
  URGENT = "URGENT"
}

export enum UserRole {
  OWNER = "OWNER",
  ADMIN = "ADMIN",
  MEMBER = "MEMBER"
}

export enum SubscriptionPlan {
  FREE = "FREE",
  PRO = "PRO",
  ENTERPRISE = "ENTERPRISE"
}

export enum SubscriptionStatus {
  ACTIVE = "ACTIVE",
  CANCELED = "CANCELED",
  EXPIRED = "EXPIRED"
}

// ========== USER TYPES ==========
export interface User {
  _id: string
  email: string
  name: string
  avatar?: string
  defaultOrganizationId?: string
  providers?: {
    google?: { id: string }
    github?: { id: string }
  }
  preferences?: {
    theme: "light" | "dark"
    language: string
    emailNotifications: boolean
  }
  emailVerified?: Date
  status: "ACTIVE" | "INACTIVE" | "SUSPENDED"
  createdAt: Date
  updatedAt: Date
  deletedAt?: Date
}

export interface UserInfo {
  id: string
  name: string
  email?: string
  avatar?: string
}

// ========== ORGANIZATION TYPES ==========
export interface OrganizationMember {
  userId: string
  role: UserRole
  joinedAt: Date
}

export interface SubscriptionInfo {
  plan: SubscriptionPlan
  status: SubscriptionStatus
  stripeCustomerId?: string
  stripeSubscriptionId?: string
  currentPeriodStart?: Date
  currentPeriodEnd?: Date
}

export interface Organization {
  _id: string
  name: string
  slug: string
  description?: string
  avatar?: string
  owner: string
  members: OrganizationMember[]
  subscription: SubscriptionInfo
  settings?: {
    isPublic: boolean
    allowInvitations: boolean
  }
  createdAt: Date
  updatedAt: Date
  deletedAt?: Date
}

// ========== BOARD TYPES ==========
export interface BoardDocument {
  _id: string
  title: string
  description?: string
  organizationId: string
  owner: string | UserInfo
  members: (string | UserInfo)[]
  projects: (string | Project)[]
  isArchived: boolean
  createdAt: Date
  updatedAt: Date
  deletedAt?: Date
}

export interface Board {
  _id: string
  title: string
  description?: string
  organizationId: string
  owner: UserInfo
  members: UserInfo[]
  projects: Project[]
  isArchived: boolean
  createdAt: Date
  updatedAt: Date
  deletedAt?: Date
}

// ========== PROJECT TYPES ==========
export interface Project {
  _id: string
  title: string
  description?: string
  organizationId: string
  owner: UserInfo
  members: UserInfo[]
  createdAt: string
  updatedAt: string
  tasks: Task[]
  board: string
  isArchived: boolean
  deletedAt?: Date
}

export interface ProjectModel {
  _id: string
  title: string
  description?: string
  organizationId: string
  owner: string
  members: string[]
  tasks: Task[]
  board: string
  isArchived: boolean
  createdAt: Date
  updatedAt: Date
  deletedAt?: Date
}

// ========== TASK TYPES ==========
export interface Task {
  _id: string
  title: string
  description?: string
  status: TaskStatus
  dueDate?: Date
  organizationId: string
  board: string
  project: string
  assignee?: UserInfo
  creator: UserInfo
  lastModifier: UserInfo
  priority: TaskPriority
  isArchived: boolean
  createdAt: Date
  updatedAt: Date
  deletedAt?: Date
}

export interface TaskModel {
  _id: string
  title: string
  description?: string
  status: TaskStatus
  dueDate?: Date
  organizationId: string
  board: string
  project: string
  assignee?: string
  creator: string
  lastModifier: string
  priority: TaskPriority
  isArchived: boolean
  createdAt: Date
  updatedAt: Date
  deletedAt?: Date
}
