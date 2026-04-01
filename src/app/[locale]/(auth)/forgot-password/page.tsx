"use client"

import { Loader2, Mail } from "lucide-react"
import { useState, type FormEvent } from "react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Link } from "@/i18n/navigation"

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("")
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault()
    setLoading(true)
    try {
      const response = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email })
      })
      const data = await response.json()
      if (!response.ok) {
        toast.error(data.error || "Failed to send reset email")
        return
      }
      toast.success(data.message || "Reset email sent")
      setEmail("")
    } catch {
      toast.error("Failed to send reset email")
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-950 p-6">
      <div className="w-full max-w-md rounded-[2rem] border border-white/10 bg-slate-900/70 p-8 shadow-2xl backdrop-blur-xl">
        <div className="mb-8 space-y-2 text-center">
          <h1 className="text-3xl font-black tracking-tighter text-white">Forgot Password</h1>
          <p className="text-sm text-slate-400">
            Enter your email and we will send you a reset link.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="relative">
            <Mail className="absolute top-1/2 left-4 h-4 w-4 -translate-y-1/2 text-slate-500" />
            <Input
              type="email"
              value={email}
              onChange={(event) => {
                setEmail(event.target.value)
              }}
              placeholder="name@company.com"
              className="h-12 rounded-2xl border-white/10 bg-white/5 pl-12 text-white placeholder:text-slate-600"
              disabled={loading}
            />
          </div>

          <Button
            type="submit"
            disabled={loading}
            className="h-12 w-full rounded-2xl bg-blue-600 font-bold text-white hover:bg-blue-700"
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Send Reset Link"}
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
