# Notification System Documentation

## Overview

This document describes the **real-time notification system** built for LraDash. The system supports:
- ✅ **Server-Sent Events (SSE)** — instant in-browser notifications
- ✅ **Firebase Cloud Messaging (FCM)** — push notifications (background/closed tab)
- ✅ **MongoDB persistence** — 30-day notification history
- ✅ **Zustand state management** — optimistic UI updates
- ✅ **Task event hooks** — auto-dispatch on task create/update

---

## Architecture

### Data Flow

```
Task Create/Update
  ↓
dispatchNotification()
  ├─→ Save to MongoDB (Notification model)
  ├─→ SSE emit() to connected browser tabs (instant)
  └─→ Firebase FCM if user has push tokens (background)
```

### Components

#### 1. **SSE In-Memory Registry** (`sse-emitter.ts`)
- Global singleton that tracks open SSE connections by user ID
- When a notification is dispatched, immediately push to all open tabs
- Automatically cleans up stale connections

#### 2. **Notification Dispatcher** (`dispatcher.ts`)
- Central hub that orchestrates DB + SSE + FCM
- Called by task routes after create/update operations
- Fire-and-forget pattern (doesn't block API response)

#### 3. **REST API Layer**
- `GET /api/notifications` — fetch user's notifications
- `PATCH /api/notifications` — mark single/all as read
- `POST /api/notifications/fcm-token` — register push subscription token
- `GET /api/notifications/stream` — SSE endpoint (25s heartbeat)

#### 4. **Firebase Admin SDK** (`admin.ts`)
- Server-side initialization using service account credentials
- Handles FCM message delivery
- Lazy-loaded to avoid cold-start issues

#### 5. **Firebase Messaging** (`messaging.ts`)
- Client-side FCM setup
- Requests browser notification permission
- Registers service worker (`firebase-messaging-sw.js`)
- Handles foreground message display

#### 6. **State Management** (`notificationStore.ts` + `useNotifications.ts`)
- Zustand store for notifications list & unread count
- Hook that orchestrates:
  - Fetching existing notifications
  - Opening SSE connection
  - Registering FCM token
  - Marking notifications as read

#### 7. **UI Component** (`Header.tsx`)
- Bell icon with unread badge
- Dropdown list of notifications
- Timestamps using `date-fns`
- Click to mark as read
- Mark all read button

---

## What's Been Done ✅

### 1. Database & Models
- ✅ Extended `Notification` model with:
  - `type`: task_created | task_updated | task_assigned | task_completed | mention | comment_reply | status_change
  - `title`, `body`: formatted notification text
  - `taskId`, `projectId`: context links
  - `triggeredBy`: who initiated the action
  - `read` flag & `readAt` timestamp
  - 30-day TTL auto-delete index

- ✅ Extended `User` model with `fcmTokens: [String]` array

### 2. Database Layer (`src/lib/db/notification.ts`)
- ✅ `createNotification()` — persist notification
- ✅ `getUserNotifications()` — fetch with limit
- ✅ `countUnread()` — quick unread count
- ✅ `markNotificationRead()` — single notification
- ✅ `markAllNotificationsRead()` — bulk operation
- ✅ `saveFcmToken()` — store push subscription token
- ✅ `getUserFcmTokens()` — retrieve tokens for FCM

### 3. SSE Streaming
- ✅ `sse-emitter.ts` — in-memory registry with cleanup
- ✅ `GET /api/notifications/stream` endpoint
  - Supports Authorization header OR query param (for EventSource)
  - 25-second heartbeat to survive proxies/NAT
  - Automatic reconnection on client disconnect

### 4. REST API
- ✅ `GET /api/notifications` — list + unread count
- ✅ `PATCH /api/notifications` — mark read (single or all)
- ✅ `POST /api/notifications/fcm-token` — register token

### 5. Firebase Integration
- ✅ `admin.ts` — server-side initialization (lazy-loaded)
- ✅ `messaging.ts` — client-side FCM helpers
- ✅ `firebase-messaging-sw.js` — service worker for background push
- ✅ `config.ts` — Firebase app initialization (already existed)

### 6. Frontend State & Logic
- ✅ `notificationStore.ts` — Zustand store
- ✅ `useNotifications.ts` — orchestrator hook
  - Fetches initial notifications
  - Opens SSE connection with auto-reconnect (5s)
  - Registers FCM & listens for foreground messages
  - Mutation actions (markRead, markAllRead)

### 7. UI Component
- ✅ `Header.tsx` — live notification bell
  - Unread badge
  - Real-time list updates
  - Format timestamps with `date-fns`
  - Mark single/all as read

### 8. Task Event Hooks
- ✅ `POST /api/tasks` — dispatch `task_created` notification
- ✅ `PATCH /api/tasks/[id]` — dispatch `task_updated`/`task_assigned`/`task_completed`
  - Detects which fields changed for meaningful message
  - Auto-detects completion status for special notification type

### 9. Dependencies
- ✅ Installed `firebase` (client SDK)
- ✅ Installed `firebase-admin` (server SDK)
- ✅ Both v12-13 (latest as of 2026)

### 10. Environment Configuration
- ✅ Updated `env.example` with all required Firebase vars
- ✅ Documented client vs server (secret) variables

---

## What's Remaining 📋

### Phase 1 — Configuration & Activation (Required)

1. **Set up Firebase Project**
   ```bash
   # Go to https://console.firebase.google.com
   # Create a new project (or use existing)
   # Enable Cloud Messaging
   ```

2. **Generate Firebase credentials**
   - Client-side config:
     - Settings → Project Settings → copy Web SDK config
     - Copy `NEXT_PUBLIC_FIREBASE_*` values to `.env.local`
   - Server-side config:
     - Service Accounts → Generate New Private Key (JSON)
     - Extract `project_id`, `client_email`, `private_key`
     - Add to `.env.local` as `FIREBASE_*`

3. **Generate VAPID Key**
   ```bash
   # In Firebase Console:
   # Cloud Messaging → Web Push certificates → Generate Key Pair
   # Add to .env.local as NEXT_PUBLIC_FIREBASE_VAPID_KEY
   ```

4. **Update Service Worker**
   - Edit `public/firebase-messaging-sw.js`
   - Replace `self.__FIREBASE_*__` with actual values OR
   - Use a build step to inject them from `.env` files

5. **Test full flow locally**
   ```bash
   pnpm dev
   # Create a task, check notification bell
   # Close tab, test push notification
   ```

### Phase 2 — Enhanced Features (Nice-to-have)

1. **Notification Preferences**
   - Add user settings: enable/disable per notification type
   - Store in `User.preferences.notifications`
   - Check before dispatching

2. **Notification Actions**
   - Click notification → navigate to task detail page
   - Mark as read from notification center
   - Snooze / Delete notifications

3. **Bulk Notifications**
   - Dispatch to multiple users (e.g., project members)
   - Add batch APIs

4. **Email Notifications** (optional)
   - Integrate SendGrid/AWS SES for critical notifications
   - Extend `dispatchNotification()` to support email channel
   - Add email template system

5. **Notification Badge/Count**
   - Sync unread count with document title badge (iOS/macOS)
   - Update favicon with dot indicator

6. **Sound & Vibration**
   - Add optional sound on foreground FCM message
   - Haptic feedback on mobile

7. **Database Optimizations**
   - Add compound index: `{ userId: 1, read: 1, createdAt: -1 }`
   - Pagination for notifications list (limit + offset)
   - Archive old notifications instead of TTL delete

8. **Analytics**
   - Track notification delivery rate (sent → delivered)
   - Track engagement (read rate, click-through)
   - Retry failed pushes with exponential backoff

---

## Installation & Setup

### 1. Install Dependencies (Done ✅)
```bash
pnpm add firebase firebase-admin
```

### 2. Configure Environment Variables

Create or update `.env.local`:

```bash
# ── Firebase Client (Public - safe to expose) ──
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
NEXT_PUBLIC_FIREBASE_VAPID_KEY=your_vapid_key

# ── Firebase Admin (Server - KEEP SECRET) ──
FIREBASE_PROJECT_ID=your_project_id
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxx@your_project.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...newlines as \n...\n-----END PRIVATE KEY-----\n"
```

### 3. Register Service Worker

The file `/public/firebase-messaging-sw.js` is already created. You need to inject your Firebase config.

**Option A: Hardcode (Development)**
```javascript
// public/firebase-messaging-sw.js
const firebaseConfig = {
  apiKey: "...",
  authDomain: "...",
  projectId: "...",
  // ... etc
}
```

**Option B: Build-time Injection (Production)**
```javascript
// next.config.ts
export default {
  webpack: (config, { isServer }) => {
    if (isServer) return config
    
    config.plugins.push(
      new webpack.DefinePlugin({
        __FIREBASE_CONFIG__: JSON.stringify({
          apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
          // ...
        })
      })
    )
    return config
  }
}
```

### 4. Test the System

```bash
# Start dev server
pnpm dev

# In browser console
# Check: Are SSE and FCM registered?
console.log("SSE connected:", eventSource.readyState === 0)
console.log("FCM token registered:", localStorage.getItem('fcm-token-saved'))

# Create a task via UI
# Expected: Notification bell updates instantly

# Close the browser tab
# Expected: Push notification displays (if FCM is configured)
```

---

## API Reference

### SSE Endpoint

```http
GET /api/notifications/stream?token=<auth_token>
```

**Headers:**
- `Authorization: Bearer <token>` (preferred) OR
- Query param `?token=<token>` (for EventSource compatibility)

**Response:** EventStream
```
event: connected
data: {"userId": "..."}

event: message
data: {"_id": "...", "type": "task_created", "title": "...", ...}

: heartbeat
```

**Client Usage:**
```javascript
const es = new EventSource(`/api/notifications/stream?token=${token}`)
es.addEventListener('message', (e) => {
  const notification = JSON.parse(e.data)
  console.log(notification)
})
```

### REST Endpoints

#### GET /api/notifications
Fetch user's notifications

```bash
curl -H "Authorization: Bearer <token>" \
  https://app.com/api/notifications
```

**Response:**
```json
{
  "notifications": [
    {
      "_id": "...",
      "type": "task_created",
      "title": "Task Created: Implement auth",
      "body": "New task has been created",
      "taskId": "...",
      "read": false,
      "createdAt": "2026-03-01T12:00:00Z",
      "triggeredBy": {
        "userId": "...",
        "name": "John Doe"
      }
    }
  ],
  "unreadCount": 3
}
```

#### PATCH /api/notifications
Mark notifications as read

```bash
# Mark single notification
curl -X PATCH \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"notificationId": "..."}' \
  https://app.com/api/notifications

# Mark all as read
curl -X PATCH \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"markAllRead": true}' \
  https://app.com/api/notifications
```

**Response:**
```json
{
  "updated": 1
}
```

#### POST /api/notifications/fcm-token
Register FCM push subscription token

```bash
curl -X POST \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"token": "eabc123..."}' \
  https://app.com/api/notifications/fcm-token
```

**Response:**
```json
{
  "success": true
}
```

---

## Hook Usage

### useNotifications()

```typescript
import { useNotifications } from '@/hooks/useNotifications'

export function MyComponent() {
  const {
    notifications,    // NotificationItem[]
    unreadCount,      // number
    loading,          // boolean
    markRead,         // (id: string) => Promise<void>
    markAllRead       // () => Promise<void>
  } = useNotifications()

  return (
    <div>
      <p>Unread: {unreadCount}</p>
      {notifications.map(n => (
        <div key={n.id}>
          {n.title}
          {!n.read && (
            <button onClick={() => markRead(n.id)}>Mark read</button>
          )}
        </div>
      ))}
    </div>
  )
}
```

---

## Dispatching Notifications Programmatically

### From API Route

```typescript
import { dispatchNotification } from '@/lib/notifications/dispatcher'

export async function POST(request: NextRequest) {
  // ... do something ...
  
  await dispatchNotification({
    recipientUserId: userId,
    type: 'task_updated',
    title: 'Task Updated: My Task',
    body: 'Status changed to complete',
    taskId: taskId,
    triggeredBy: {
      userId: currentUserId,
      name: 'John Doe',
      avatar: 'https://...'
    }
  })
  
  return NextResponse.json({ success: true })
}
```

### From Background Job / Cron

```typescript
import { dispatchNotification } from '@/lib/notifications/dispatcher'

async function notifyProjectMembers() {
  const members = await getProjectMembers(projectId)
  
  for (const member of members) {
    await dispatchNotification({
      recipientUserId: member._id,
      type: 'status_change',
      title: 'Project Status Updated',
      body: 'Project "Roadmap Planning" is now in progress',
      projectId: projectId,
      triggeredBy: {
        userId: adminId,
        name: 'Project Admin'
      }
    })
  }
}
```

---

## Monitoring & Debugging

### Check SSE Connections
```javascript
// In browser console
fetch('/api/debug/notifications', {
  headers: { 'Authorization': `Bearer ${token}` }
}).then(r => r.json()).then(console.log)

// Response example:
// { "sseClientCount": 3, "userSessions": { "user1": 2, "user2": 1 } }
```

### Monitor FCM Delivery
```bash
# In Firebase Console > Cloud Messaging > Notifications
# View delivery status & error logs
```

### Database Queries
```javascript
// MongoDB shell
db.notifications.find({ userId: ObjectId("...") }).sort({ createdAt: -1 }).limit(10)
db.notifications.countDocuments({ userId: ObjectId("..."), read: false })
```

---

## Troubleshooting

### FCM Tokens Not Saved
- ✓ Check browser notification permission: `Notification.permission === 'granted'`
- ✓ Verify `firebase-messaging-sw.js` is at `/public/`
- ✓ Check `/api/notifications/fcm-token` endpoint returns `201` success
- ✓ Inspect `USER.fcmTokens` in MongoDB

### SSE Connection Keeps Closing
- ✓ Check auth token is valid (not expired)
- ✓ Verify backend logs for connection errors
- ✓ Check browser DevTools: Network → /api/notifications/stream
  - Should show `200 OK` with `Content-Type: text/event-stream`
  - Should have continuous `: heartbeat` messages

### Push Notifications Don't Appear
- ✓ Verify VAPID key is correct
- ✓ Check browser: Settings → Notifications → Allow "LraDash"
- ✓ Ensure service worker is registered
- ✓ Check Firebase Admin credentials in `.env`
- ✓ Monitor Firebase Console for delivery errors

### Notifications Show But Say "Undefined"
- ✓ The dispatcher is working!
- ✓ But the notification body/title is malformed
- ✓ Check `dispatchNotification()` call in task route

---

## File Structure

```
Lradash/
├── src/
│   ├── app/api/
│   │   └── notifications/
│   │       ├── route.ts                 # GET + PATCH REST API
│   │       ├── stream/route.ts          # GET SSE endpoint
│   │       └── fcm-token/route.ts       # POST FCM token registration
│   ├── lib/
│   │   ├── db/notification.ts           # DB layer
│   │   ├── firebase/
│   │   │   ├── admin.ts                 # Firebase Admin SDK (server)
│   │   │   ├── config.ts                # Firebase Web SDK (client)
│   │   │   └── messaging.ts             # FCM helpers
│   │   └── notifications/
│   │       ├── dispatcher.ts            # Central notification hub
│   │       └── sse-emitter.ts           # SSE in-memory registry
│   ├── models/notification.model.ts    # MongoDB schema
│   ├── store/notificationStore.ts      # Zustand store
│   ├── hooks/useNotifications.ts       # Orchestrator hook
│   └── components/layout/Header.tsx    # UI with live bell
├── public/firebase-messaging-sw.js     # Service worker
└── env.example                         # Updated with Firebase vars
```

---

## Testing Checklist

- [ ] Environment variables set in `.env.local`
- [ ] `pnpm dev` succeeds without TypeScript errors
- [ ] User can grant browser notification permission
- [ ] Create a task → notification appears in bell instantly
- [ ] Click notification → mark as read updates UI
- [ ] Refresh page → notifications persist
- [ ] Close tab, check push notification arrives
- [ ] Firebase Admin credentials are correct
- [ ] Service worker registers successfully
- [ ] Unread count badge displays correctly

---

## Next Steps

1. **Configure Firebase** → Get credentials
2. **Set environment variables** → Add to `.env.local`
3. **Update `firebase-messaging-sw.js`** → Inject config
4. **Run tests** → Test SSE + FCM flow
5. **Deploy to production** → Monitor FCM delivery
6. **Extend features** → Add preferences, email, analytics

---

## References

- [Firebase Cloud Messaging Docs](https://firebase.google.com/docs/cloud-messaging)
- [Web Push API](https://developer.mozilla.org/en-US/docs/Web/API/Push_API)
- [Server-Sent Events](https://developer.mozilla.org/en-US/docs/Web/API/Server-sent_events)
- [Zustand](https://github.com/pmndrs/zustand)
- [date-fns](https://date-fns.org/)

---

**Last Updated:** March 1, 2026  
**Status:** ✅ SSE + FCM system ready for Firebase configuration  
**Maintained by:** LraDash Team
