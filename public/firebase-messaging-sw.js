// firebase-messaging-sw.js
// Placed in /public so it is served at the root scope required by FCM.
//
// This service worker handles FCM push notifications when the LraDash tab
// is in the background or completely closed.
//
// NOTE: Replace the firebaseConfig values with your own project config,
// or inject them via a build step. They are intentionally hardcoded here
// because service workers cannot read Next.js runtime env variables.

importScripts("https://www.gstatic.com/firebasejs/10.12.5/firebase-app-compat.js")
importScripts("https://www.gstatic.com/firebasejs/10.12.5/firebase-messaging-compat.js")

// TODO: Replace with your actual Firebase project config values.
// These must match your NEXT_PUBLIC_FIREBASE_* environment variables.
const firebaseConfig = {
  apiKey: self.__FIREBASE_API_KEY__ || "YOUR_API_KEY",
  authDomain: self.__FIREBASE_AUTH_DOMAIN__ || "YOUR_AUTH_DOMAIN",
  projectId: self.__FIREBASE_PROJECT_ID__ || "YOUR_PROJECT_ID",
  storageBucket: self.__FIREBASE_STORAGE_BUCKET__ || "YOUR_STORAGE_BUCKET",
  messagingSenderId: self.__FIREBASE_MESSAGING_SENDER_ID__ || "YOUR_SENDER_ID",
  appId: self.__FIREBASE_APP_ID__ || "YOUR_APP_ID"
}

firebase.initializeApp(firebaseConfig)
const messaging = firebase.messaging()

// Handle background push messages
messaging.onBackgroundMessage((payload) => {
  const title = payload.notification?.title ?? "LraDash Notification"
  const body = payload.notification?.body ?? ""
  const icon = "/icons/icon-192x192.png"
  const badge = "/icons/badge-72x72.png"
  const data = payload.data ?? {}

  self.registration.showNotification(title, {
    body,
    icon,
    badge,
    data,
    tag: data.taskId ?? "lradash-notification",
    renotify: true
  })
})

// Clicking a notification opens/focuses the app
self.addEventListener("notificationclick", (event) => {
  event.notification.close()
  const taskId = event.notification.data?.taskId
  const url = taskId ? `/dashboard/tasks/${taskId}` : "/dashboard"

  event.waitUntil(
    clients
      .matchAll({ type: "window", includeUncontrolled: true })
      .then((clientList) => {
        for (const client of clientList) {
          if (client.url.includes(self.location.origin) && "focus" in client) {
            return client.focus()
          }
        }
        if (clients.openWindow) {
          return clients.openWindow(url)
        }
      })
  )
})
