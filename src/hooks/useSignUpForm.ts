"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { useRouter } from "next/navigation"
import { useTransition } from "react"
import { useForm } from "react-hook-form"
import { toast } from "sonner"
import { z } from "zod"

import { useTaskStore } from "@/lib/store"
import { useAuth } from "./useAuth"

const SignUpValidation = z.object({
  email: z.string().email("Invalid email address"),
  name: z.string().min(2, "Name must be at least 2 characters"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  confirmPassword: z.string(),
  organizationName: z.string().min(2, "Organization name must be at least 2 characters")
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"]
})

type SignUpFormValue = z.infer<typeof SignUpValidation>

export function useSignUpForm() {
  const [isNavigating, startNavigationTransition] = useTransition()
  const { setUserInfo } = useTaskStore()
  const { register } = useAuth()
  const router = useRouter()

  const form = useForm<SignUpFormValue>({
    resolver: zodResolver(SignUpValidation),
    defaultValues: {
      email: "",
      name: "",
      password: "",
      confirmPassword: "",
      organizationName: ""
    }
  })

  const onSubmit = async (data: SignUpFormValue) => {
    try {
      // Step 1: Register user
      const authResult = await register(data.email, data.password, data.name)

      if (!authResult.success) {
        toast.error(authResult.error || "Signup failed")
        return
      }

      // Step 2: Create organization
      const accessToken = localStorage.getItem("accessToken")
      
      const slug = data.organizationName
        .toLowerCase()
        .trim()
        .replace(/\s+/g, "-")
        .replace(/[^a-z0-9-]/g, "")
      
      const orgResponse = await fetch("/api/organizations", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${accessToken}`
        },
        body: JSON.stringify({
          name: data.organizationName,
          slug: slug
        })
      })

      if (!orgResponse.ok) {
        const error = await orgResponse.json()
        toast.error(error.error || "Failed to create organization")
        return
      }

      // Store user info
      await setUserInfo(data.email)

      toast.success("Account created!")
      
      // Redirect immediately
      window.location.href = "/en/boards"
    } catch (error) {
      const message = error instanceof Error ? error.message : "Signup failed"
      toast.error(message)
    }
  }

  return {
    form,
    loading: isNavigating,
    onSubmit
  }
}
