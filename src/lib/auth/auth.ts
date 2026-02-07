import { betterAuth } from "better-auth"
import { mongodbAdapter } from "better-auth/adapters/mongodb"
import { MongoClient } from "mongodb"

// Initialize MongoDB connection
const client = new MongoClient(process.env.DATABASE_URL || "")
const db = client.db()

export const auth = betterAuth({
  database: mongodbAdapter(db, { client }),
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: false,
    minPasswordLength: 8
  },
  session: {
    expiresIn: 60 * 60 * 24 * 7, // 7 days
    updateAge: 60 * 60 * 24 // Update session every 24 hours
  },
  user: {
    additionalFields: {
      defaultOrganizationId: {
        type: "string",
        required: false
      }
    }
  },
  experimental: {
    joins: false // Disable joins due to ObjectId issues
  },
  secret: process.env.BETTER_AUTH_SECRET || process.env.AUTH_SECRET || "fallback-secret-change-me",
  baseURL: process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
  trustedOrigins: [
    process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"
  ]
})

export type Session = typeof auth.$Infer.Session
