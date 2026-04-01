"use client"

import { Loader2, Lock } from "lucide-react"
import { useSearchParams } from "next/navigation"
import { useState, type FormEvent } from "react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Link, useRouter } from "@/i18n/navigation"

export default function ResetPasswordPage() {
  const params = useSearchParams()
  const router = useRouter()
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [loading, setLoading] = useState(false)

  const email = params.get("email") || ""
  const token = params.get("token") || ""

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault()

    if (!email || !token) {
      toast.error("Reset link is invalid or incomplete")
      return
    }
    if (password.length < 8) {
      toast.error("Password must be at least 8 characters")
      return
    }
    if (password !== confirmPassword) {
      toast.error("Passwords do not match")
      return
    }

    setLoading(true)
    try {
      const response = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, token, password })
      })
      const data = await response.json()
      if (!response.ok) {
        toast.error(data.error || "Failed to reset password")
        return
      }
      toast.success("Password reset successful")
      router.push("/login")
    } catch {
      toast.error("Failed to reset password")
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-950 p-6">
      <div className="w-full max-w-md rounded-[2rem] border border-white/10 bg-slate-900/70 p-8 shadow-2xl backdrop-blur-xl">
        <div className="mb-8 space-y-2 text-center">
          <h1 className="text-3xl font-black tracking-tighter text-white">Set New Password</h1>
          <p className="text-sm text-slate-400">Choose a new password for your account.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="relative">
            <Lock className="absolute top-1/2 left-4 h-4 w-4 -translate-y-1/2 text-slate-500" />
            <Input
              type="password"
              value={password}
              onChange={(event) => {
                setPassword(event.target.value)
              }}
              placeholder="New password"
              className="h-12 rounded-2xl border-white/10 bg-white/5 pl-12 text-white placeholder:text-slate-600"
              disabled={loading}
            />
          </div>
          <div className="relative">
            <Lock className="absolute top-1/2 left-4 h-4 w-4 -translate-y-1/2 text-slate-500" />
            <Input
              type="password"
              value={confirmPassword}
              onChange={(event) => {
                setConfirmPassword(event.target.value)
              }}
              placeholder="Confirm new password"
              className="h-12 rounded-2xl border-white/10 bg-white/5 pl-12 text-white placeholder:text-slate-600"
              disabled={loading}
            />
          </div>

          <Button
            type="submit"
            disabled={loading}
            className="h-12 w-full rounded-2xl bg-blue-600 font-bold text-white hover:bg-blue-700"
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Reset Password"}
          </Button>
        </form>

        <div className="mt-6 text-center text-sm text-slate-400">
          <Link href="/login" className="font-bold text-white hover:text-blue-400">
            Back to login
          </Link>
        </div>
      </div>
    </main>
  )
}
