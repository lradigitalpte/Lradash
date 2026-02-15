# Comment System with User Mentions - Implementation Guide

## Overview

The comment system has been fully implemented with:
✅ **Real-time comment POST, GET, EDIT, DELETE** via `/api/tasks/[id]/comments`
✅ **User mention detection** with @ symbol - type `@` to search and tag users
✅ **User autocomplete dropdown** with live search
✅ **Mention tracking** - mentioned users are stored with each comment
✅ **Notification provisions** - infrastructure ready for email/push notifications
✅ **Activity audit trail** - all comments show in the Activity tab

---

## Features

### 1. Comment Creation with Mentions

**How to use:**
1. Go to any task detail modal
2. In the "Activity & Audit" section, find the comment input box
3. Type your comment, then press `@` to mention a user
4. Search for the user by name as a dropdown appears
5. Click on a user to add them to the mention
6. See mentioned users as pills above the input
7. Click the X on a pill to remove a mention
8. Click "Post Comment" to submit

**API Call:**
```bash
POST /api/tasks/{taskId}/comments
{
  "text": "Your comment text here",
  "mentions": [
    { "userId": "user_id", "userName": "john_doe", "userEmail": "john@example.com" }
  ]
}
```

### 2. Comment Display

Comments are displayed in the Activity Feed with:
- Author avatar and name
- Timestamp
- Comment text
- **Mention pills** showing who was mentioned (with @ prefix)
- Color-coded visual design (blue background for mentions)

### 3. Comment Management

#### Get Comments
```bash
GET /api/tasks/{taskId}/comments
```
Returns all comments for a task with populated user and mention data.

#### Edit Comments
```bash
PUT /api/tasks/{taskId}/comments
{
  "commentId": "comment_id",
  "text": "Updated comment text",
  "mentions": [
    { "userId": "user_id", "userName": "john_doe" }
  ]
}
```
Users can only edit their own comments.

#### Delete Comments
```bash
DELETE /api/tasks/{taskId}/comments
{
  "commentId": "comment_id"
}
```
Users can only delete their own comments.

---

## Database Schema

### Task Model - Activity Field
```typescript
activities: [
  {
    user: ObjectId (ref: User),
    type: "comment" | "activity",
    text: string,
    createdAt: Date,
    mentions: [
      {
        userId: ObjectId (ref: User),
        userName: string
      }
    ],
    notificationsSent: [
      {
        userId: ObjectId (ref: User),
        sentAt: Date,
        method: "email" | "push" | "in-app",
        status: "pending" | "sent" | "failed"
      }
    ]
  }
]
```

### Notification Model (New)
Tracks all sent/pending notifications for auditing and retry logic.

---

## Notification System

### Current Status: PROVISIONED & READY

The notification system is **fully set up and ready for integration** with external providers.

### What's Included:

1. **Notification Service** (`lib/notifications/notification-service.ts`)
   - Flexible interface for email, push, and in-app notifications
   - Built-in logging and retry mechanism
   - Ready for provider integration

2. **Notification Model** (`models/notification.model.ts`)
   - Stores all notification attempts
   - Tracks status: pending, sent, failed
   - Indexes for fast querying

3. **Methods Supported:**
   - 📧 **Email** - Ready for SendGrid, AWS SES, Mailgun
   - 🔔 **Push** - Ready for Firebase Cloud Messaging, OneSignal
   - 🔵 **In-App** - Currently active (stored in database)

### Integration Steps (When Ready):

#### To enable Email Notifications:

1. Install email provider (e.g., SendGrid)
   ```bash
   npm install @sendgrid/mail
   ```

2. Implement the `sendEmailNotification` function in `notification-service.ts`
   ```typescript
   export async function sendEmailNotification(payload: NotificationPayload) {
     return await sgMail.send({
       to: payload.userId.email,
       from: "notifications@lradash.com",
       subject: `You were mentioned by ${payload.mentionedByUser.name}`,
       html: `
         <p>You were mentioned in a comment on "${payload.taskTitle}":</p>
         <blockquote>"${payload.commentText}"</blockquote>
       `
     })
   }
   ```

3. Update the comment POST endpoint to include "email" in methods:
   ```typescript
   methods: ["in-app", "email"] // Add "email" here
   ```

#### To enable Push Notifications:

1. Setup Firebase or OneSignal
2. Implement the `sendPushNotification` function
3. Store user device tokens when they register
4. Add "push" to notification methods

#### To enable Retry Logic:

Add a scheduled job that runs periodically:
```typescript
// In a cron job or scheduled task
import { retryFailedNotifications } from "@/lib/notifications/notification-service"

// Run every 5 minutes
setInterval(async () => {
  await retryFailedNotifications(3) // Max 3 retries
}, 5 * 60 * 1000)
```

---

## Component Details

### MentionInput Component
(`components/kanban/card-detail/MentionInput.tsx`)

**Features:**
- Detects @ symbol while typing
- Shows dropdown with matching users
- Filters out already-mentioned users
- Manages mention pills
- Integrated textarea with focus management

**Props:**
```typescript
interface MentionInputProps {
  value: string                                    // Input text
  onChange: (value: string) => void              // Text change handler
  onMentionsChange: (mentions: MentionedUser[]) => void  // Mention updates
  mentions?: MentionedUser[]                     // External mentions array
  placeholder?: string                           // Input placeholder
  onSubmit: () => void                           // Submit handler
  isLoading?: boolean                            // Loading state
  rows?: number                                  // Textarea rows
}
```

### CardActivity Component
Updated to use MentionInput and handle:
- Comment creation with mentions
- Display mentions as visual pills
- Fetch and display audit trail

---

## Testing

### Manual Testing:
1. Open a task detail modal
2. In the Comment section, type `@`
3. Search for and click a user
4. Verify the mention pill appears
5. Can add multiple mentions
6. Click X to remove mentions
7. Submit and verify comment shows mentions

### API Testing:
```bash
# Create comment with mentions
curl -X POST http://localhost:3000/api/tasks/[taskId]/comments \
  -H "Authorization: Bearer [token]" \
  -H "Content-Type: application/json" \
  -d '{
    "text": "Great work on this! @john_doe what do you think?",
    "mentions": [
      {
        "userId": "648f1234abc567def0000001",
        "userName": "john_doe",
        "userEmail": "john@example.com"
      }
    ]
  }'

# Get all comments
curl http://localhost:3000/api/tasks/[taskId]/comments \
  -H "Authorization: Bearer [token]"
```

---

## Future Enhancements

1. **Multi-mention in single comment** ✅ Already supported
2. **@here to mention all team members** - Add to user search
3. **Comment threading/replies** - Extend schema with parentCommentId
4. **Comment reactions** - Add emoji reactions array
5. **Comment mentions in notifications** - Customize message content
6. **Digest notifications** - Batch notifications sent daily
7. **Notification preferences** - Per-user notification settings

---

## Database Migrations

If deploying to existing database:

```javascript
// Add mentions and notificationsSent fields to existing activities
db.tasks.updateMany(
  { "activities": { $exists: true } },
  {
    $set: {
      "activities.$[].mentions": [],
      "activities.$[].notificationsSent": []
    }
  }
)
```

---

## Performance Notes

- Activity array uses indexes for fast queries
- Notifications logged asynchronously (non-blocking)
- User search uses regex with $options: "i" for case-insensitive matching
- Consider pagination >100 comments per task

---

## Security

✅ **Authentication** - Bearer token required for all endpoints
✅ **Authorization** - Only comment authors can edit/delete
✅ **Input validation** - Text length and mention validation
✅ **XSS Protection** - Text stored as-is, escaped on display
✅ **CSRF** - Handled by framework

---

## API Documentation

### POST /api/tasks/{id}/comments
Create a new comment with mentions

**Request:**
```json
{
  "text": "Comment content",
  "mentions": [
    {
      "userId": "user_id",
      "userName": "username",
      "userEmail": "email@example.com",
      "userAvatar": "avatar_url"
    }
  ]
}
```

**Response:**
```json
{
  "comment": {
    "_id": "comment_id",
    "user": { "id": "user_id", "name": "name" },
    "type": "comment",
    "text": "Comment text",
    "mentions": [...],
    "notificationsSent": [...],
    "createdAt": "2026-02-13T..."
  },
  "notificationsToSend": [...]
}
```

---

## Troubleshooting

**1. Mentions not showing in dropdown**
- Verify `/api/users/search` endpoint works
- Check database for users in same organization
- Ensure Bearer token is valid

**2. Comment doesn't send**
- Check browser console for errors
- Verify taskId is valid
- Ensure user is authenticated

**3. Notifications not sent**
- Check notification service logs
- Verify notification model is created
- Check user preferences (when added)

---

**Last Updated:** February 13, 2026
**Status:** ✅ Ready for Production + Provisioned for Email/Push
