"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { Settings, User, Bell, Palette } from "lucide-react"
import { useEffect, useState } from "react"
import { useForm } from "react-hook-form"
import { toast } from "sonner"
import { z } from "zod"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"

const profileSchema = z.object({
  name: z
    .string()
    .min(2, "Name must be at least 2 characters")
    .max(50, "Name must be less than 50 characters"),
  email: z.string().email("Invalid email"),
  theme: z.enum(["light", "dark"]),
  language: z.enum(["en", "de"]),
  emailNotifications: z.boolean()
})

type ProfileFormValue = z.infer<typeof profileSchema>

export default function SettingsPage() {
  const [user, setUser] = useState<ProfileFormValue | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  const form = useForm<ProfileFormValue>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      name: "",
      email: "",
      theme: "light",
      language: "en",
      emailNotifications: true
    }
  })

  useEffect(() => {
    loadUserData()
  }, [])

  const loadUserData = async () => {
    try {
      const accessToken = localStorage.getItem("accessToken")
      if (!accessToken) {
        return
      }

      const response = await fetch("/api/auth/profile", {
        headers: {
          Authorization: `Bearer ${accessToken}`
        }
      })

      if (response.ok) {
        const userData = await response.json()
        setUser(userData)
        form.reset({
          name: userData.name || "",
          email: userData.email || "",
          theme: userData.preferences?.theme || "light",
          language: userData.preferences?.language || "en",
          emailNotifications: userData.preferences?.emailNotifications ?? true
        })
      }
    } catch (error) {
      console.error("Failed to load user:", error)
      toast.error("Failed to load profile")
    } finally {
      setLoading(false)
    }
  }

  const onSubmit = async (data: ProfileFormValue) => {
    setSaving(true)
    try {
      const accessToken = localStorage.getItem("accessToken")
      if (!accessToken) {
        toast.error("Not authenticated")
        return
      }

      const response = await fetch("/api/auth/profile", {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          name: data.name,
          preferences: {
            theme: data.theme,
            language: data.language,
            emailNotifications: data.emailNotifications
          }
        })
      })

      if (response.ok) {
        const updated = await response.json()
        setUser(updated)
        toast.success("Profile updated successfully!")
      } else {
        const error = await response.json()
        toast.error(error.error || "Failed to update profile")
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to update profile"
      toast.error(message)
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="animate-pulse text-slate-400">Loading profile...</div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div>
        <div className="mb-2 flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-700 shadow-lg shadow-blue-500/30">
            <Settings className="h-6 w-6 stroke-[2] text-white" />
          </div>
          <div>
            <h1 className="text-4xl font-black tracking-tighter">Settings</h1>
            <p className="mt-1 text-[10px] font-black tracking-[0.2em] text-slate-400 uppercase">
              Manage Your Account
            </p>
          </div>
        </div>
        <p className="mt-4 font-medium text-slate-500 italic">
          Update your personal information and preferences
        </p>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          {/* Profile Information Card */}
          <Card className="rounded-3xl border-slate-200/60 bg-white/80 shadow-2xl shadow-slate-200/50 backdrop-blur-xl dark:border-slate-800/60 dark:bg-slate-950/80 dark:shadow-none">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-100 dark:bg-blue-950">
                  <User className="h-5 w-5 stroke-[2] text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <CardTitle className="text-2xl font-bold">Profile Information</CardTitle>
                  <CardDescription>Update your personal details</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                      Your Name
                    </FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Enter your name"
                        {...field}
                        disabled={saving}
                        className="rounded-xl border-slate-200 bg-white/60 backdrop-blur-sm transition-all placeholder:text-slate-400 focus:border-blue-500 focus:ring-blue-500/20 dark:border-slate-800 dark:bg-slate-900/60 dark:placeholder:text-slate-600"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                      Email Address
                    </FormLabel>
                    <FormControl>
                      <Input
                        placeholder="your@email.com"
                        {...field}
                        disabled
                        className="cursor-not-allowed rounded-xl border-slate-200 bg-slate-100/50 text-slate-500 backdrop-blur-sm dark:border-slate-800 dark:bg-slate-900/30 dark:text-slate-400"
                      />
                    </FormControl>
                    <FormDescription className="text-xs text-slate-500 dark:text-slate-400">
                      Your email address cannot be changed. Contact support for modifications.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          {/* Preferences Card */}
          <Card className="rounded-3xl border-slate-200/60 bg-white/80 shadow-2xl shadow-slate-200/50 backdrop-blur-xl dark:border-slate-800/60 dark:bg-slate-950/80 dark:shadow-none">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-100 dark:bg-purple-950">
                  <Palette className="h-5 w-5 stroke-[2] text-purple-600 dark:text-purple-400" />
                </div>
                <div>
                  <CardTitle className="text-2xl font-bold">Preferences</CardTitle>
                  <CardDescription>Customize your experience</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <FormField
                control={form.control}
                name="theme"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                      Theme
                    </FormLabel>
                    <Select value={field.value} onValueChange={field.onChange} disabled={saving}>
                      <FormControl>
                        <SelectTrigger className="rounded-xl border-slate-200 bg-white/60 backdrop-blur-sm hover:bg-white/80 dark:border-slate-800 dark:bg-slate-900/60 dark:hover:bg-slate-900/80">
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent className="rounded-2xl border-slate-200 bg-white/90 backdrop-blur-xl dark:border-slate-800 dark:bg-slate-950/90">
                        <SelectItem value="light">Light</SelectItem>
                        <SelectItem value="dark">Dark</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormDescription className="text-xs text-slate-500 dark:text-slate-400">
                      Choose your preferred color theme
                    </FormDescription>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="language"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                      Language
                    </FormLabel>
                    <Select value={field.value} onValueChange={field.onChange} disabled={saving}>
                      <FormControl>
                        <SelectTrigger className="rounded-xl border-slate-200 bg-white/60 backdrop-blur-sm hover:bg-white/80 dark:border-slate-800 dark:bg-slate-900/60 dark:hover:bg-slate-900/80">
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent className="rounded-2xl border-slate-200 bg-white/90 backdrop-blur-xl dark:border-slate-800 dark:bg-slate-950/90">
                        <SelectItem value="en">English</SelectItem>
                        <SelectItem value="de">Deutsch</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormDescription className="text-xs text-slate-500 dark:text-slate-400">
                      Select your preferred language
                    </FormDescription>
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          {/* Notifications Card */}
          <Card className="rounded-3xl border-slate-200/60 bg-white/80 shadow-2xl shadow-slate-200/50 backdrop-blur-xl dark:border-slate-800/60 dark:bg-slate-950/80 dark:shadow-none">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-rose-100 dark:bg-rose-950">
                  <Bell className="h-5 w-5 stroke-[2] text-rose-600 dark:text-rose-400" />
                </div>
                <div>
                  <CardTitle className="text-2xl font-bold">Notifications</CardTitle>
                  <CardDescription>Manage your notification preferences</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <FormField
                control={form.control}
                name="emailNotifications"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-2xl border border-slate-200/60 bg-slate-50/50 p-4 dark:border-slate-800/60 dark:bg-slate-900/30">
                    <div className="space-y-1">
                      <FormLabel className="cursor-pointer text-sm font-semibold text-slate-700 dark:text-slate-300">
                        Email Notifications
                      </FormLabel>
                      <FormDescription className="text-xs text-slate-500 dark:text-slate-400">
                        Receive updates and alerts via email
                      </FormDescription>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                        disabled={saving}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          {/* Action Button */}
          <div className="flex justify-end pt-4">
            <Button
              type="submit"
              disabled={saving}
              className="h-12 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-700 px-8 font-black shadow-lg shadow-blue-500/25 transition-all hover:shadow-xl hover:shadow-blue-500/40 disabled:opacity-70 dark:shadow-none"
            >
              {saving ? (
                <>
                  <span className="mr-2 animate-spin">⚙️</span>
                  Saving Changes...
                </>
              ) : (
                "Save Changes"
              )}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  )
}
