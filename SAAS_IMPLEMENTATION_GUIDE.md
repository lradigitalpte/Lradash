# SaaS MongoDB Schema & Implementation Guide

## Overview

Your project is now ready for SaaS with multi-tenancy, role-based access control, and subscription management. This guide walks through the implementation.

---

## 📊 Database Schema Changes

### New Collections Added

1. **Organization** - Represents a team/workspace
2. **Enhanced User** - Now supports profiles, preferences, and multi-org membership
3. **Updated Boards, Projects, Tasks** - All now tied to `organizationId` for data isolation

### Key Design Patterns

#### Multi-Tenancy
Every resource (Board, Project, Task) includes `organizationId` to ensure:
- ✅ Complete data isolation
- ✅ Fast queries (`organizationId: 1` index)
- ✅ Easy compliance with data regulations

#### Role-Based Access Control (RBAC)
```
Organization.members = [
  { userId, role: "OWNER" | "ADMIN" | "MEMBER", joinedAt }
]
```

Role hierarchy:
- **OWNER** - Full control, can delete org
- **ADMIN** - Can manage members and settings (your Boards/Projects in phase 2)
- **MEMBER** - Can create/edit their own tasks (based on Board permissions)

#### Soft Deletes
All models support soft deletes (`deletedAt` field) for:
- ✅ Data recovery
- ✅ Audit trails
- ✅ GDPR compliance

---

## 🚀 Implementation Roadmap (2 Months)

### Phase 1: User & Organization Registration (Week 1-2)

**Files Created:**
- `src/models/organization.model.ts` - Organization schema
- `src/lib/db/organization.ts` - Organization functions
- Updated `src/models/user.model.ts` - Enhanced User model
- Updated `src/lib/db/user.ts` - Enhanced User functions

**What You Need to Build:**

#### 1. **Create Organization API Route**
```typescript
// app/api/organizations/route.ts
import { createOrganization } from "@/lib/db/organization"

export async function POST(req: Request) {
  const { name, slug, ownerId } = await req.json()
  
  // Validate auth
  const org = await createOrganization(name, ownerId, slug)
  
  if (!org) {
    return Response.json({ error: "Failed to create org" }, { status: 400 })
  }
  
  return Response.json(org)
}
```

#### 2. **Create User API Route**
```typescript
// app/api/auth/register/route.ts
import { createUser } from "@/lib/db/user"
import { createOrganization } from "@/lib/db/organization"

export async function POST(req: Request) {
  const { email, name } = await req.json()
  
  // Create user
  const user = await createUser(email, name)
  if (!user) return Response.json({ error: "User exists" }, { status: 400 })
  
  // Create default organization
  const org = await createOrganization(`${name}'s Workspace`, user._id)
  
  return Response.json({ user, organization: org })
}
```

#### 3. **Join Organization API Route**
```typescript
// app/api/organizations/[orgId]/invite/route.ts
import { addMemberToOrganization, getMemberRole } from "@/lib/db/organization"

export async function POST(req: Request) {
  const { orgId } = params
  const { email, inviterUserId } = await req.json()
  
  // 1. Check inviter is ADMIN or OWNER
  const inviterRole = await getMemberRole(orgId, inviterUserId)
  if (inviterRole !== "ADMIN" && inviterRole !== "OWNER") {
    return Response.json({ error: "Unauthorized" }, { status: 403 })
  }
  
  // 2. Find user by email
  const user = await getUserByEmail(email)
  if (!user) {
    // TODO: Send invite email with signup link
    return Response.json({ message: "Invitation sent" })
  }
  
  // 3. Add to organization
  const added = await addMemberToOrganization(orgId, user._id)
  
  return Response.json({ success: added })
}
```

---

### Phase 2: Boards with Org Isolation (Week 3-4)

**Update Board API routes to use `organizationId`:**

```typescript
// app/api/organizations/[orgId]/boards/route.ts
export async function POST(req: Request) {
  const { title, description } = await req.json()
  const { orgId } = params
  
  // Verify user is member of org
  const userRole = await getMemberRole(orgId, currentUserId)
  if (!userRole) return Response.json({ error: "Unauthorized" }, { status: 403 })
  
  // Create board
  const board = await BoardModel.create({
    title,
    description,
    organizationId: orgId,
    owner: currentUserId,
    members: [currentUserId]
  })
  
  return Response.json(board)
}

export async function GET(req: Request) {
  const { orgId } = params
  
  // All boards in org
  const boards = await BoardModel.find({ organizationId: orgId, deletedAt: null })
  
  return Response.json(boards)
}
```

---

### Phase 3: Projects & Tasks with Org Isolation (Week 5)

Same pattern as Boards:
```typescript
// 1. Query by organizationId
// 2. Check user has access to org
// 3. CRUD operations
```

---

### Phase 4: Billing & Subscriptions (Week 6-7)

**Create Stripe integration:**

```typescript
// app/api/billing/create-checkout/route.ts
import Stripe from "stripe"
import { updateSubscription } from "@/lib/db/organization"

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!)

export async function POST(req: Request) {
  const { orgId, plan } = await req.json()
  
  const org = await getOrganizationById(orgId)
  
  // Create or get Stripe customer
  let customerId = org.subscription.stripeCustomerId
  
  if (!customerId) {
    const customer = await stripe.customers.create({
      email: org.owner.email,
      metadata: { organizationId: orgId }
    })
    customerId = customer.id
  }
  
  // Create checkout session
  const session = await stripe.checkout.sessions.create({
    customer: customerId,
    line_items: [{ price: getPriceId(plan), quantity: 1 }],
    mode: "subscription",
    success_url: `${domain}/billing?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${domain}/billing`
  })
  
  // Update subscription with pending data
  await updateSubscription(orgId, plan, customerId)
  
  return Response.json({ sessionId: session.id })
}
```

**Webhook handler:**
```typescript
// app/api/webhooks/stripe/route.ts
export async function POST(req: Request) {
  const event = stripe.webhooks.constructEvent(
    body,
    req.headers.get("stripe-signature"),
    process.env.STRIPE_WEBHOOK_SECRET!
  )
  
  if (event.type === "customer.subscription.updated") {
    const { customer, status, current_period_end } = event.data.object
    
    await updateSubscription(
      orgId, // from metadata
      plan,
      customer,
      subscription.id,
      new Date(current_period_end * 1000)
    )
  }
}
```

---

## 🔐 Permission Checks

Every API route should verify org membership:

```typescript
// Middleware pattern
import { getMemberRole, hasPermission } from "@/lib/db/organization"

export async function checkOrgAccess(userId: string, orgId: string) {
  const role = await getMemberRole(orgId, userId)
  if (!role) throw new Error("Unauthorized")
  return role
}

export async function requireOrgAdmin(userId: string, orgId: string) {
  const hasAdmin = await hasPermission(orgId, userId, "ADMIN")
  if (!hasAdmin) throw new Error("Must be admin")
}
```

---

## 📝 Database Functions Provided

### User Functions
- `createUser(email, name, avatar?)` - Create new user
- `getUserByEmail(email)` - Find user
- `getUserById(id)` - Get user details
- `getUserInfo(userId)` - Lightweight user info
- `updateUser(userId, updates)` - Update profile
- `updateUserPreferences(userId, prefs)` - Theme, language, notifications
- `verifyUserEmail(userId)` - Mark email verified
- `softDeleteUser(userId)` - Delete user
- `userExists(email)` - Check if email taken

### Organization Functions
- `createOrganization(name, ownerId, slug?)` - Create new org
- `getOrganizationById(orgId)` - Get org details
- `getOrganizationBySlug(slug)` - Get org by URL slug
- `getUserOrganizations(userId)` - List user's orgs
- `addMemberToOrganization(orgId, userId, role)` - Invite member
- `updateMemberRole(orgId, userId, role)` - Change role
- `removeMemberFromOrganization(orgId, userId)` - Remove member
- `getMemberRole(orgId, userId)` - Get user's role in org
- `hasPermission(orgId, userId, requiredRole)` - Check permission
- `updateOrganization(orgId, updates)` - Update org details
- `softDeleteOrganization(orgId)` - Delete org
- `updateSubscription(orgId, plan, ...)` - Update billing

---

## 🏗️ File Structure (After Implementation)

```
src/
├── models/
│   ├── user.model.ts ✅ DONE
│   ├── organization.model.ts ✅ DONE (NEW)
│   ├── board.model.ts ✅ UPDATED
│   ├── project.model.ts ✅ UPDATED
│   └── task.model.ts ✅ UPDATED
├── lib/db/
│   ├── user.ts ✅ DONE
│   ├── organization.ts ✅ DONE (NEW)
│   ├── board.ts ← UPDATE NEXT
│   ├── project.ts ← UPDATE NEXT
│   ├── task.ts ← UPDATE NEXT
│   └── connect.ts ✅ No changes
├── types/
│   └── dbInterface.ts ✅ UPDATED
└── app/api/
    ├── auth/
    │   └── register/route.ts ← BUILD THIS
    ├── organizations/
    │   ├── route.ts ← BUILD THIS
    │   ├── [orgId]/
    │   │   ├── members/route.ts ← BUILD THIS
    │   │   └── invite/route.ts ← BUILD THIS
    │   └── [orgId]/boards/route.ts ← UPDATE
    └── billing/
        ├── create-checkout/route.ts ← BUILD THIS
        └── webhooks/
            └── stripe/route.ts ← BUILD THIS
```

---

## ✅ Next Steps

1. **Test the organization/user creation** with your current test suite
2. **Update board/project/task queries** to filter by `organizationId`
3. **Build auth registration flow** (user + org creation)
4. **Add organization context** to your UI (show org switcher)
5. **Implement Stripe billing** in weeks 6-7

---

## 🎯 Business Model Readiness

After Phase 1 (2 weeks):
- ✅ Multi-tenancy working
- ✅ User roles defined
- ✅ Org isolation secure

After Phase 2-3 (5 weeks):
- ✅ Full SaaS data structure
- ✅ Ready for initial customers

After Phase 4 (8 weeks):
- ✅ Billing implemented
- ✅ Ready for launch

You're on track for a 2-month SaaS launch! 🚀
