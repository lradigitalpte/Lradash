/**
 * Firebase Cloud Messaging – client-side helpers.
 *
 * Registers the service worker, requests notification permission,
 * and obtains an FCM registration token that is then sent to the server
 * so Firebase can deliver push notifications when the user's tab is closed.
 */

import { getMessaging, getToken, onMessage, type Messaging } from "firebase/messaging"

import { getFirebaseApp } from "@/lib/firebase/config"

let messagingInstance: Messaging | null = null

function getMessagingInstance(): Messaging | null {
  if (messagingInstance) {
    return messagingInstance
  }
  const app = getFirebaseApp()
  if (!app) {
    return null
  }
  try {
    messagingInstance = getMessaging(app)
    return messagingInstance
  } catch {
    return null
  }
}

/**
 * Request notification permission and return the FCM token.
 * Returns null when Firebase is not configured or permission is denied.
 */
export async function requestFcmToken(): Promise<string | null> {
  if (typeof window === "undefined" || !("Notification" in window)) {
    return null
  }

  const permission = await Notification.requestPermission()
  if (permission !== "granted") {
    return null
  }

  const messaging = getMessagingInstance()
  if (!messaging) {
    return null
  }

  const vapidKey = process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY
  if (!vapidKey) {
    return null
  }

  try {
    // Register / reuse the service worker
    const registration = await navigator.serviceWorker.register("/firebase-messaging-sw.js", {
      scope: "/"
    })

    const token = await getToken(messaging, { vapidKey, serviceWorkerRegistration: registration })
    return token ?? null
  } catch (err) {
    console.warn("[FCM] getToken failed:", err)
    return null
  }
}

/**
 * Save the FCM token to the server so the backend can send pushes.
 */
export async function saveFcmTokenToServer(token: string, authToken: string): Promise<void> {
  try {
    await fetch("/api/notifications/fcm-token", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${authToken}`
      },
      body: JSON.stringify({ token })
    })
  } catch (err) {
    console.warn("[FCM] saveFcmTokenToServer failed:", err)
  }
}

/**
 * Listen for foreground FCM messages.
 * Called once after token registration.
 * Returns an unsubscribe function.
 */
export function onForegroundMessage(
  handler: (payload: { title: string; body: string; data?: Record<string, string> }) => void
): () => void {
  const messaging = getMessagingInstance()
  if (!messaging) {
    return () => {}
  }

  const unsubscribe = onMessage(messaging, (payload) => {
    const title = payload.notification?.title ?? "LraDash"
    const body = payload.notification?.body ?? ""
    const data = payload.data as Record<string, string> | undefined
    handler({ title, body, data })
  })

  return unsubscribe
}
