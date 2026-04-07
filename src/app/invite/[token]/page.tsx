"use client"

import { AlertCircle, CheckCircle2, Loader2, Mail, Shield, UserPlus } from "lucide-react"
import Link from "next/link"
import { useParams, useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

interface InvitationPayload {
  email: string
  role: string
  expiresAt: string
  existingUser: boolean
  organization: {
    id: string
    name: string
    slug: string
  } | null
}

export default function InvitationAcceptancePage() {
  const params = useParams<{ token: string }>()
  const router = useRouter()
  const token = String(params?.token || "")

  const [invitation, setInvitation] = useState<InvitationPayload | null>(null)
  const [name, setName] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [accepted, setAccepted] = useState(false)

  useEffect(() => {
    let mounted = true

    const loadInvitation = async () => {
      try {
        const response = await fetch(`/api/invitations/${token}`, { cache: "no-store" })
        const data = await response.json().catch(() => ({}))

        if (!response.ok) {
          throw new Error(data.error || "Invitation not found")
        }

        if (mounted) {
          setInvitation(data)
          setError(null)
        }
      } catch (loadError) {
        if (mounted) {
          setError(loadError instanceof Error ? loadError.message : "Invitation not found")
        }
      } finally {
        if (mounted) {
          setLoading(false)
        }
      }
    }

    if (token) {
      loadInvitation()
    } else {
      setError("Invitation token is missing")
      setLoading(false)
    }

    return () => {
      mounted = false
    }
  }, [token])

  const handleAccept = async () => {
    if (!invitation) {
      return
    }

    if (!invitation.existingUser && (!name.trim() || !password.trim())) {
      toast.error("Name and password are required to create your account")
      return
    }

    setSubmitting(true)
    try {
      const response = await fetch(`/api/invitations/${token}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, password })
      })

      const data = await response.json().catch(() => ({}))
      if (!response.ok) {
        throw new Error(data.error || "Failed to accept invitation")
      }

      setAccepted(true)
      toast.success("Invitation accepted")

      window.setTimeout(() => {
        router.push(`/en/login?email=${encodeURIComponent(invitation.email)}`)
      }, 1200)
    } catch (submitError) {
      toast.error(
        submitError instanceof Error ? submitError.message : "Failed to accept invitation"
      )
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-slate-950 px-6 py-12">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(59,130,246,0.15),transparent_45%),radial-gradient(circle_at_bottom_right,rgba(16,185,129,0.12),transparent_40%)]" />
      <Card className="relative z-10 w-full max-w-2xl rounded-[2.5rem] border border-white/10 bg-slate-900/70 shadow-2xl backdrop-blur-3xl">
        <CardHeader className="space-y-4 px-8 pt-8 pb-4 sm:px-10 sm:pt-10">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-600 text-white shadow-xl shadow-blue-500/30">
            {accepted ? <CheckCircle2 className="h-7 w-7" /> : <UserPlus className="h-7 w-7" />}
          </div>
          <div className="space-y-2">
            <CardTitle className="text-3xl font-black tracking-tight text-white">
              {accepted ? "Invitation accepted" : "Join your client portal"}
            </CardTitle>
            <CardDescription className="text-sm font-medium text-slate-400">
              {accepted
                ? "Redirecting you to sign in so you can access your portal."
                : "Use this invitation to access the workspace your project team shared with you."}
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent className="space-y-6 px-8 pb-8 sm:px-10 sm:pb-10">
          {loading ? (
            <div className="flex items-center justify-center py-16 text-slate-300">
              <Loader2 className="h-6 w-6 animate-spin" />
            </div>
          ) : error ? (
            <div className="space-y-6">
              <div className="rounded-4xl border border-rose-500/20 bg-rose-500/10 p-6 text-rose-100">
                <div className="flex items-center gap-3">
                  <AlertCircle className="h-5 w-5" />
                  <p className="text-sm font-bold">{error}</p>
                </div>
              </div>
              <Button
                asChild
                className="h-12 rounded-2xl bg-white text-slate-900 hover:bg-slate-100"
              >
                <Link href="/en/login">Go to login</Link>
              </Button>
            </div>
          ) : invitation ? (
            <>
              <div className="grid gap-4 rounded-4xl border border-white/10 bg-white/5 p-6 text-white sm:grid-cols-2">
                <div>
                  <p className="text-[10px] font-black tracking-[0.2em] text-slate-500 uppercase">
                    Email
                  </p>
                  <p className="mt-2 flex items-center gap-2 text-sm font-bold">
                    <Mail className="h-4 w-4 text-blue-400" />
                    {invitation.email}
                  </p>
                </div>
                <div>
                  <p className="text-[10px] font-black tracking-[0.2em] text-slate-500 uppercase">
                    Access role
                  </p>
                  <p className="mt-2 flex items-center gap-2 text-sm font-bold uppercase">
                    <Shield className="h-4 w-4 text-emerald-400" />
                    {invitation.role}
                  </p>
                </div>
                <div className="sm:col-span-2">
                  <p className="text-[10px] font-black tracking-[0.2em] text-slate-500 uppercase">
                    Organization
                  </p>
                  <p className="mt-2 text-base font-black text-white">
                    {invitation.organization?.name || "Shared workspace"}
                  </p>
                </div>
              </div>

              {!accepted && !invitation.existingUser ? (
                <div className="space-y-5">
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black tracking-[0.2em] text-slate-400 uppercase">
                      Full name
                    </Label>
                    <Input
                      value={name}
                      onChange={(event) => {
                        setName(event.target.value)
                      }}
                      placeholder="Your full name"
                      className="h-12 rounded-2xl border-white/10 bg-white/5 text-white placeholder:text-slate-600"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black tracking-[0.2em] text-slate-400 uppercase">
                      Create password
                    </Label>
                    <Input
                      type="password"
                      value={password}
                      onChange={(event) => {
                        setPassword(event.target.value)
                      }}
                      placeholder="Choose a secure password"
                      className="h-12 rounded-2xl border-white/10 bg-white/5 text-white placeholder:text-slate-600"
                    />
                  </div>
                </div>
              ) : null}

              {!accepted && invitation.existingUser ? (
                <div className="rounded-[1.75rem] border border-blue-500/20 bg-blue-500/10 p-5 text-sm font-medium text-blue-100">
                  This email already belongs to an account. Accept the invitation, then sign in with
                  your existing password.
                </div>
              ) : null}

              <div className="flex flex-col gap-3 sm:flex-row">
                <Button
                  onClick={handleAccept}
                  disabled={submitting || accepted}
                  className="h-12 flex-1 rounded-2xl bg-blue-600 text-[11px] font-black tracking-[0.2em] uppercase hover:bg-blue-700"
                >
                  {submitting ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                  ) : accepted ? (
                    "Accepted"
                  ) : (
                    "Accept invitation"
                  )}
                </Button>
                <Button
                  asChild
                  variant="outline"
                  className="h-12 flex-1 rounded-2xl border-white/10 bg-white/5 text-white hover:bg-white/10"
                >
                  <Link href="/en/login">Back to login</Link>
                </Button>
              </div>
            </>
          ) : null}
        </CardContent>
      </Card>
    </main>
  )
}
