"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { useRouter } from "next/navigation"
import { useState, useTransition } from "react"
import { useForm } from "react-hook-form"
import { toast } from "sonner"

import { useTaskStore } from "@/lib/store"
import { SignInFormValue, SignInValidation } from "@/types/authUserForm"

import { useAuth } from "./useAuth"

interface AuthFormState {
  message?: string
  status: "error" | "success" | "idle" | "loading"
}

export default function useAuthForm() {
  const [isNavigating, startNavigationTransition] = useTransition()
  const { setUserInfo } = useTaskStore()
  const { login } = useAuth()
  const router = useRouter()
  const [status, setStatus] = useState<AuthFormState>({ status: "idle" })
  const [isLoading, setIsLoading] = useState(false)

  const form = useForm<SignInFormValue>({
    resolver: zodResolver(SignInValidation),
    defaultValues: {
      email: "",
      password: ""
    }
  })

  const onSubmit = async (data: SignInFormValue) => {
    setIsLoading(true)
    setStatus({ status: "loading" })

    try {
      const result = await login(data.email, data.password)

      if (!result.success) {
        setIsLoading(false)
        setStatus({ status: "error", message: result.error })
        toast.error(result.error || "Login failed")
        return
      }

      await setUserInfo(data.email)

      // Redirect immediately
      window.location.href = result.user?.isClient ? "/en/client" : "/en/dashboard"
    } catch (error) {
      setIsLoading(false)
      const message = error instanceof Error ? error.message : "Login failed"
      setStatus({ status: "error", message })
      toast.error(message)
    }
  }

  return {
    form,
    loading: isLoading || isNavigating,
    onSubmit,
    status
  }
}
