/**
 * Helper to resolve a user's notification email.
 *
 * Prefers `notificationEmail` if set, otherwise falls back to the
 * account `email`.  Accepts any object with those optional fields so
 * it works with both Mongoose documents and lean() results.
 */

export function getNotificationEmail(
  user:
    | {
        notificationEmail?: string
        email?: string
        preferences?: { emailNotifications?: boolean } | null
      }
    | null
    | undefined
): string {
  if (!user) {
    return ""
  }

  if (user.preferences?.emailNotifications === false) {
    return ""
  }

  return user.notificationEmail?.trim() || user.email || ""
}
