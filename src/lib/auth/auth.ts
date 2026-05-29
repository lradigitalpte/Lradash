import { betterAuth } from "better-auth"
import { mongodbAdapter } from "better-auth/adapters/mongodb"
import { MongoClient, MongoClientOptions } from "mongodb"

import {
  DB_AUTH_MAX_POOL_SIZE,
  DB_CONNECT_TIMEOUT_MS,
  DB_MAX_IDLE_TIME_MS,
  DB_MIN_POOL_SIZE,
  DB_SERVER_SELECTION_TIMEOUT_MS,
  DB_SOCKET_TIMEOUT_MS,
  DB_WAIT_QUEUE_TIMEOUT_MS
} from "@/constants/db"

const databaseUrl = process.env.DATABASE_URL

if (!databaseUrl) {
  throw new Error("DATABASE_URL is required for auth")
}

const globalForMongo = globalThis as typeof globalThis & {
  authMongoClient?: MongoClient
}

const getAuthClientOptions = (): MongoClientOptions => ({
  connectTimeoutMS: DB_CONNECT_TIMEOUT_MS,
  socketTimeoutMS: DB_SOCKET_TIMEOUT_MS,
  serverSelectionTimeoutMS: DB_SERVER_SELECTION_TIMEOUT_MS,
  maxPoolSize: DB_AUTH_MAX_POOL_SIZE,
  minPoolSize: DB_MIN_POOL_SIZE,
  maxIdleTimeMS: DB_MAX_IDLE_TIME_MS,
  waitQueueTimeoutMS: DB_WAIT_QUEUE_TIMEOUT_MS,
  tls: true,
  tlsAllowInvalidCertificates: false
})

const client =
  globalForMongo.authMongoClient ?? new MongoClient(databaseUrl, getAuthClientOptions())

if (process.env.NODE_ENV !== "production") {
  globalForMongo.authMongoClient = client
}

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
  trustedOrigins: [process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"]
})

export type Session = typeof auth.$Infer.Session
