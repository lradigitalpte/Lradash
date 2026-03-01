/**
 * Firebase Admin SDK singleton.
 * Initialized lazily and only when credentials are provided.
 *
 * Required env vars:
 *   FIREBASE_PROJECT_ID
 *   FIREBASE_CLIENT_EMAIL
 *   FIREBASE_PRIVATE_KEY   (newlines as \n)
 */

const g = globalThis as any

export async function getFirebaseAdmin(): Promise<any | null> {
  // Return cached instance
  if (g.__firebaseAdmin) {
    return g.__firebaseAdmin
  }

  const projectId = process.env.FIREBASE_PROJECT_ID
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL
  const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n")

  if (!projectId || !clientEmail || !privateKey) {
    // Firebase not configured – FCM push will be skipped
    return null
  }

  try {
    const admin = await import("firebase-admin")
    const firebaseAdminApp = await import("firebase-admin/app")
    const { initializeApp, getApps, cert } = firebaseAdminApp

    if (getApps().length === 0) {
      initializeApp({
        credential: cert({ projectId, clientEmail, privateKey })
      })
    }

    g.__firebaseAdmin = admin
    return g.__firebaseAdmin
  } catch (err) {
    console.error("[Firebase Admin] initialization failed:", err)
    return null
  }
}
