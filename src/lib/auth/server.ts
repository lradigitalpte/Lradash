import { auth as betterAuthInstance } from "./auth"
import { ROUTES } from "@/constants/routes"

export const authConfig = {
  pages: {
    signIn: ROUTES.AUTH.LOGIN
  },
  session: {
    maxAge: 60 * 60 * 24 * 7 // 7 days
  }
}

/**
 * Server-side function to get current session using Better Auth
 */
export const auth = betterAuthInstance.api.getSession
