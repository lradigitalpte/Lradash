# Quick Reference: User & Organization Management

## User Registration Flow

### 1. Create User Account
```typescript
import { createUser } from "@/lib/db/user"

const user = await createUser(
  "john@example.com",
  "John Doe",
  "https://avatar.url.jpg" // optional
)

// Returns:
// {
//   _id: "507f1f77bcf86cd799439011",
//   email: "john@example.com",
//   name: "John Doe",
//   avatar: "https://avatar.url.jpg",
//   status: "ACTIVE",
//   preferences: { theme: "light", language: "en", emailNotifications: true },
//   createdAt: Date,
//   updatedAt: Date
// }
```

### 2. Create Default Organization
```typescript
import { createOrganization } from "@/lib/db/organization"

const org = await createOrganization(
  "John's Team", // name
  user._id, // ownerId
  "johns-team" // optional slug (auto-generated if not provided)
)

// Returns:
// {
//   _id: "607f1f77bcf86cd799439012",
//   name: "John's Team",
//   slug: "johns-team",
//   owner: user._id,
//   members: [
//     { userId: user._id, role: "OWNER", joinedAt: Date }
//   ],
//   subscription: {
//     plan: "FREE",
//     status: "ACTIVE"
//   },
//   settings: { isPublic: false, allowInvitations: true },
//   createdAt: Date,
//   updatedAt: Date
// }
```

---

## Inviting Users to Organization

### 3. Add Member to Organization
```typescript
import { addMemberToOrganization, getMemberRole } from "@/lib/db/organization"

// First verify inviter is ADMIN or OWNER
const inviterRole = await getMemberRole(orgId, invitingUserId)

if (inviterRole === "OWNER" || inviterRole === "ADMIN") {
  // Add as MEMBER
  const success = await addMemberToOrganization(
    orgId,
    newUserId,
    "MEMBER" // or "ADMIN"
  )
  
  // Returns: true/false
}
```

---

## Checking Permissions

### 4. Verify User Has Access
```typescript
import { getMemberRole, hasPermission } from "@/lib/db/organization"

// Check if user is member of org
const role = await getMemberRole(orgId, userId)

if (!role) {
  // User is NOT a member of this org
  throw new Error("Unauthorized")
}

// Check if user has specific role
const isAdmin = await hasPermission(orgId, userId, "ADMIN")

if (isAdmin) {
  // User is ADMIN or OWNER
}
```

---

## Getting User Information

### 5. Get User's Organizations
```typescript
import { getUserOrganizations } from "@/lib/db/organization"

const orgs = await getUserOrganizations(userId)

// Returns: [Organization, Organization, ...]
// Sorted by creation date (newest first)

// Use to show user's org switcher in UI
```

### 6. Get Organization Details
```typescript
import { getOrganizationById } from "@/lib/db/organization"

const org = await getOrganizationById(orgId)

// Returns: Organization with populated owner and members
// Member details include: name, email, avatar
```

---

## Managing Members

### 7. Update Member Role
```typescript
import { updateMemberRole } from "@/lib/db/organization"

// Promote member to admin
const success = await updateMemberRole(
  orgId,
  userId,
  "ADMIN" // or "MEMBER"
)
```

### 8. Remove Member
```typescript
import { removeMemberFromOrganization } from "@/lib/db/organization"

const success = await removeMemberFromOrganization(orgId, userId)

// Note: Cannot remove OWNER
```

---

## Managing User Preferences

### 9. Update User Profile
```typescript
import { updateUser } from "@/lib/db/user"

const user = await updateUser(userId, {
  name: "New Name",
  avatar: "new-avatar-url"
  // Cannot update: email, createdAt
})
```

### 10. Update User Preferences
```typescript
import { updateUserPreferences } from "@/lib/db/user"

const success = await updateUserPreferences(userId, {
  theme: "dark", // or "light"
  language: "de", // or "en"
  emailNotifications: false
})
```

---

## Billing/Subscription

### 11. Update Subscription Plan
```typescript
import { updateSubscription } from "@/lib/db/organization"

const success = await updateSubscription(
  orgId,
  "PRO", // plan: "FREE" | "PRO" | "ENTERPRISE"
  "cus_1234567890", // stripeCustomerId
  "sub_1234567890", // stripeSubscriptionId
  new Date("2024-12-31") // currentPeriodEnd
)
```

---

## Common API Patterns

### Registration API Route
```typescript
// POST /api/auth/register
export async function POST(req: Request) {
  const { email, name } = await req.json()
  
  // 1. Create user
  const user = await createUser(email, name)
  if (!user) {
    return Response.json(
      { error: "Email already registered" },
      { status: 400 }
    )
  }
  
  // 2. Create default org
  const org = await createOrganization(`${name}'s Workspace`, user._id)
  
  // 3. Set as default
  await updateUser(user._id, {
    defaultOrganizationId: org._id
  })
  
  return Response.json({
    user,
    organization: org
  })
}
```

### Invite Member API Route
```typescript
// POST /api/organizations/[orgId]/invite
export async function POST(req: Request) {
  const { orgId } = params
  const { email, invitedByUserId } = await req.json()
  
  // 1. Check inviter is ADMIN+
  const inviterRole = await getMemberRole(orgId, invitedByUserId)
  
  if (!inviterRole || !["ADMIN", "OWNER"].includes(inviterRole)) {
    return Response.json({ error: "Unauthorized" }, { status: 403 })
  }
  
  // 2. Find invited user
  const invitedUser = await getUserByEmail(email)
  
  if (!invitedUser) {
    // TODO: Send invite email with signup link
    // For now, user must sign up first
    return Response.json(
      { error: "User not found. They must sign up first." },
      { status: 404 }
    )
  }
  
  // 3. Add to org
  const success = await addMemberToOrganization(
    orgId,
    invitedUser._id,
    "MEMBER"
  )
  
  if (!success) {
    return Response.json(
      { error: "User already in organization" },
      { status: 400 }
    )
  }
  
  return Response.json({
    message: "Member added successfully",
    user: invitedUser
  })
}
```

### Protected Route Pattern
```typescript
// GET /api/organizations/[orgId]/data
export async function GET(req: Request) {
  const { orgId } = params
  const userId = getUserIdFromAuth(req) // from session/JWT
  
  // 1. Verify access
  const userRole = await getMemberRole(orgId, userId)
  
  if (!userRole) {
    return Response.json(
      { error: "You don't have access to this organization" },
      { status: 403 }
    )
  }
  
  // 2. Fetch org data
  const org = await getOrganizationById(orgId)
  
  return Response.json(org)
}
```

---

## Role Hierarchy

```
OWNER (3)
  └─ Can do everything
  └─ Delete organization
  └─ Transfer ownership
  └─ Can't be removed

ADMIN (2)
  └─ Manage members
  └─ Manage settings
  └─ Invite/remove members (except owner)

MEMBER (1)
  └─ Create/edit own content
  └─ View org data
  └─ Can be removed by ADMIN+
```

---

## Data Isolation (Multi-Tenancy)

Every query MUST include `organizationId`:

```typescript
// ✅ CORRECT - Isolates data to org
const tasks = await TaskModel.find({
  organizationId: orgId,
  deletedAt: null
})

// ❌ WRONG - Would expose all tasks
const allTasks = await TaskModel.find({ deletedAt: null })

// ❌ WRONG - Doesn't prevent cross-org access
const tasks = await TaskModel.find({ board: boardId })
// ^ Someone could pass a boardId from a different org
```

---

## Testing Checklist

- [ ] User registration creates user + default org
- [ ] Organization members list shows all members with roles
- [ ] Can't add user twice to org
- [ ] Can't remove owner
- [ ] Permission checks work (OWNER > ADMIN > MEMBER)
- [ ] User preferences update individually
- [ ] Org switcher shows all user's orgs
- [ ] Soft deletes don't show deleted items
