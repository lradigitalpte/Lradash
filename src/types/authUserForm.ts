import * as z from "zod"

export const SignInValidation = z.object({
  email: z.string().min(1, "Email is required").email("Invalid email"),
  password: z.string().min(1, "Password is required")
})

export type SignInFormValue = z.infer<typeof SignInValidation>
