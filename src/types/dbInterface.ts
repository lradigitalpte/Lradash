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
  passwordHash?: string
  notificationEmail?: string
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
  emailVerificationToken?: string
  passwordResetToken?: string
  passwordResetExpires?: Date
  role?: string
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
  image?: string
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
  projectId?: string | null
  owner: string | UserInfo
  members: (string | UserInfo)[]
  projects: (string | Project)[]
  isPrivate: boolean
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
  projectId?: string | null
  owner: UserInfo
  members: UserInfo[]
  projects: Project[]
  listIds: string[]
  isPrivate: boolean
  isArchived: boolean
  createdAt: Date
  updatedAt: Date
  deletedAt?: Date
}

// ========== LIST TYPES ==========
export interface List {
  _id: string
  title: string
  description?: string
  boardId: string
  projectId: string
  organizationId: string
  position: number
  cardIds: string[]
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
export interface ChecklistItem {
  _id?: string
  text: string
  completed: boolean
}

export interface ActivityItem {
  _id?: string
  user: UserInfo
  type: "comment" | "activity"
  text: string
  createdAt: string | Date
}

export interface Attachment {
  _id?: string
  name: string
  url: string
  type?: string
  size?: number
  createdAt?: string | Date
}

export interface Task {
  _id: string
  title: string
  description?: string
  status: TaskStatus
  dueDate?: Date
  organizationId: string
  board?: string
  project?: string
  workPackage?: string // Optional: reference to WorkPackage
  assignee?: UserInfo
  creator: UserInfo
  lastModifier: UserInfo
  priority: TaskPriority
  isArchived: boolean
  checklist?: ChecklistItem[]
  labels?: Array<{ name: string; color: string }>
  activities?: ActivityItem[]
  attachments?: Attachment[]
  coverColor?: string
  createdAt: Date
  updatedAt: Date
  deletedAt?: Date
}

// ========== REPORT TYPES ==========
export enum ReportStatus {
  SUBMITTED = "submitted",
  OVERDUE = "overdue",
  PENDING = "pending"
}

export enum ReportFileType {
  PPT = "ppt",
  PDF = "pdf",
  DOC = "doc",
  LINK = "link"
}

export interface Report {
  _id: string
  title: string
  description?: string
  organizationId: string
  submittedBy: UserInfo
  submittedAt: Date
  dueDate: Date
  weekNumber: number
  year: number
  status: ReportStatus
  fileType?: ReportFileType
  fileUrl?: string
  fileName?: string
  fileSize?: string
  createdAt: Date
  updatedAt: Date
  deletedAt?: Date
}

// ========== MINUTES TYPES ==========
export enum MinutesFileType {
  PPT = "ppt",
  PDF = "pdf",
  DOC = "doc",
  TXT = "txt",
  MD = "md",
  XLS = "xls",
  LINK = "link"
}

export interface Minutes {
  _id: string
  title: string
  description?: string
  organizationId: string
  submittedBy: UserInfo
  submittedAt: Date
  meetingDate?: Date
  fileType?: MinutesFileType
  fileUrl?: string
  fileName?: string
  fileSize?: string
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
  board?: string
  project?: string
  assignee?: string
  creator: string
  lastModifier: string
  priority: TaskPriority
  isArchived: boolean
  createdAt: Date
  updatedAt: Date
  deletedAt?: Date
}

// ========== WORK PACKAGE TYPES ==========
export enum WorkPackageStatus {
  TODO = "TODO",
  IN_PROGRESS = "IN_PROGRESS",
  COMPLETED = "COMPLETED",
  ON_HOLD = "ON_HOLD"
}

export interface WorkPackage {
  _id: string
  title: string
  description?: string
  status: WorkPackageStatus
  dueDate?: Date
  organizationId: string
  boardId?: string
  projectId?: string
  owner: UserInfo
  assignees?: UserInfo[]
  tasks?: string[]
  progress?: number
  priority: TaskPriority
  isArchived: boolean
  createdAt: Date
  updatedAt: Date
  deletedAt?: Date
}

export interface WorkPackageModel {
  _id: string
  title: string
  description?: string
  status: WorkPackageStatus
  dueDate?: Date
  organizationId: string
  boardId?: string
  projectId?: string
  owner: string
  assignees?: string[]
  tasks?: string[]
  progress?: number
  priority: TaskPriority
  isArchived: boolean
  createdAt: Date
  updatedAt: Date
  deletedAt?: Date
}

// ========== EVENT TYPES ==========
export enum EventType {
  SYNC = "sync",
  BLOCKED = "blocked",
  BUFFER = "buffer"
}

export interface Event {
  _id: string
  title: string
  description?: string
  startTime: Date | string
  endTime: Date | string
  type: EventType
  organizationId: string
  creatorId: string
  members?: string[]
  isAllDay: boolean
  createdAt: Date
  updatedAt: Date
  deletedAt?: Date
}
