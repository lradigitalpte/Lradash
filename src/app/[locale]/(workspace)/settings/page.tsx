"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import {
  Settings,
  User,
  Bell,
  Palette,
  Camera,
  Trash2,
  Upload,
  Check,
  Pencil,
  RotateCcw,
  KeyRound
} from "lucide-react"
import { useEffect, useRef, useState } from "react"
import { useForm } from "react-hook-form"
import { toast } from "sonner"
import { z } from "zod"

import { GoogleWorkspaceConnectionCard } from "@/components/integrations/GoogleWorkspaceConnectionCard"
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
import { cn } from "@/lib/utils"

/** Read a file into a data URL for local preview and editing. */
async function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = (e) => {
      resolve(e.target?.result as string)
    }
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

/** Create a square avatar (256x256) with optional zoom and offsets, then compress to JPEG. */
async function renderAvatarDataUrl(
  source: string,
  options: { zoom?: number; offsetX?: number; offsetY?: number } = {}
): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => {
      const size = 256
      const zoom = options.zoom ?? 1
      const offsetX = options.offsetX ?? 0
      const offsetY = options.offsetY ?? 0

      const canvas = document.createElement("canvas")
      canvas.width = size
      canvas.height = size

      const ctx = canvas.getContext("2d")
      if (!ctx) {
        reject(new Error("Canvas context unavailable"))
        return
      }

      // Keep a centered square crop by default, then allow controlled panning + zoom.
      const baseScale = Math.max(size / img.width, size / img.height)
      const scale = baseScale * zoom
      const drawWidth = img.width * scale
      const drawHeight = img.height * scale
      const x = (size - drawWidth) / 2 + offsetX
      const y = (size - drawHeight) / 2 + offsetY

      ctx.clearRect(0, 0, size, size)
      ctx.imageSmoothingEnabled = true
      ctx.imageSmoothingQuality = "high"
      ctx.drawImage(img, x, y, drawWidth, drawHeight)

      resolve(canvas.toDataURL("image/jpeg", 0.86))
    }
    img.onerror = reject
    img.src = source
  })
}

function getInitials(name: string) {
  return name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2)
}

function getAvatarColor(name: string): string {
  const colors = [
    "bg-blue-500",
    "bg-violet-500",
    "bg-emerald-500",
    "bg-pink-500",
    "bg-amber-500",
    "bg-indigo-500",
    "bg-teal-500",
    "bg-orange-500"
  ]
  let hash = 0
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash)
  }
  return colors[Math.abs(hash) % colors.length]
}

const profileSchema = z.object({
  name: z
    .string()
    .min(2, "Name must be at least 2 characters")
    .max(50, "Name must be less than 50 characters"),
  email: z.string().email("Invalid email"),
  notificationEmail: z.string().email("Invalid email").optional().or(z.literal("")),
  theme: z.enum(["light", "dark"]),
  language: z.enum(["en", "de"]),
  emailNotifications: z.boolean()
})

type ProfileFormValue = z.infer<typeof profileSchema>

export default function SettingsPage() {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null)
  const [avatarSource, setAvatarSource] = useState<string | null>(null)
  const [avatarChanged, setAvatarChanged] = useState(false)
  const [isDragging, setIsDragging] = useState(false)
  const [isEditingAvatar, setIsEditingAvatar] = useState(false)
  const [avatarZoom, setAvatarZoom] = useState(1)
  const [avatarOffsetX, setAvatarOffsetX] = useState(0)
  const [avatarOffsetY, setAvatarOffsetY] = useState(0)
  const [changingPassword, setChangingPassword] = useState(false)
  const [currentPassword, setCurrentPassword] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const fileInputRef = useRef<HTMLInputElement>(null)

  const form = useForm<ProfileFormValue>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      name: "",
      email: "",
      notificationEmail: "",
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
        cache: "no-store",
        headers: {
          Authorization: `Bearer ${accessToken}`
        }
      })

      if (response.ok) {
        const userData = await response.json()
        setAvatarPreview(userData.avatar || null)
        setAvatarSource(userData.avatar || null)
        form.reset({
          name: userData.name || "",
          email: userData.email || "",
          notificationEmail: userData.notificationEmail ?? "",
          theme: userData.preferences?.theme || "light",
          language: userData.preferences?.language || "en",
          emailNotifications: userData.preferences?.emailNotifications ?? true
        })
      }
    } catch {
      toast.error("Failed to load profile")
    } finally {
      setLoading(false)
    }
  }

  const handleFileSelect = async (file: File) => {
    if (!file.type.startsWith("image/")) {
      toast.error("Please select an image file")
      return
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image must be under 5 MB")
      return
    }
    try {
      const sourceDataUrl = await fileToDataUrl(file)
      const dataUrl = await renderAvatarDataUrl(sourceDataUrl)
      setAvatarSource(sourceDataUrl)
      setAvatarZoom(1)
      setAvatarOffsetX(0)
      setAvatarOffsetY(0)
      setIsEditingAvatar(true)
      setAvatarPreview(dataUrl)
      setAvatarChanged(true)
    } catch {
      toast.error("Failed to process image")
    }
  }

  useEffect(() => {
    if (!isEditingAvatar || !avatarSource) {
      return
    }

    let cancelled = false
    renderAvatarDataUrl(avatarSource, {
      zoom: avatarZoom,
      offsetX: avatarOffsetX,
      offsetY: avatarOffsetY
    })
      .then((result) => {
        if (!cancelled) {
          setAvatarPreview(result)
          setAvatarChanged(true)
        }
      })
      .catch(() => {
        if (!cancelled) {
          toast.error("Failed to apply avatar edits")
        }
      })

    return () => {
      cancelled = true
    }
  }, [avatarOffsetX, avatarOffsetY, avatarSource, avatarZoom, isEditingAvatar])

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    const file = e.dataTransfer.files[0]
    if (file) {
      handleFileSelect(file)
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
      const body: Record<string, unknown> = {
        name: data.name,
        email: data.email,
        notificationEmail: data.notificationEmail ?? "",
        preferences: {
          theme: data.theme,
          language: data.language,
          emailNotifications: data.emailNotifications
        }
      }
      if (avatarChanged) {
        body.avatar = avatarPreview
      }

      const response = await fetch("/api/auth/profile", {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify(body)
      })

      if (response.ok) {
        const updated = await response.json()
        setAvatarChanged(false)
        // Keep localStorage in sync for header/user menus that read from it
        try {
          const storedUser = localStorage.getItem("user")
          if (storedUser) {
            const parsed = JSON.parse(storedUser) as { id?: string; email?: string; name?: string }
            localStorage.setItem(
              "user",
              JSON.stringify({
                ...parsed,
                email: updated.email ?? parsed.email,
                name: updated.name ?? parsed.name
              })
            )
          }
        } catch {
          // ignore localStorage parse errors
        }

        // Ensure the form reflects the canonical saved values
        form.reset({
          name: updated.name || data.name,
          email: updated.email || data.email,
          notificationEmail: updated.notificationEmail ?? data.notificationEmail ?? "",
          theme: updated.preferences?.theme || data.theme,
          language: updated.preferences?.language || data.language,
          emailNotifications: updated.preferences?.emailNotifications ?? data.emailNotifications
        })
        toast.success("Profile updated!", { description: "Your changes have been saved." })
      } else {
        const err = await response.json()
        toast.error(err.error || "Failed to update profile")
      }
    } catch {
      toast.error("Failed to update profile")
    } finally {
      setSaving(false)
    }
  }

  const onChangePassword = async () => {
    if (newPassword.length < 8) {
      toast.error("New password must be at least 8 characters")
      return
    }
    if (newPassword !== confirmPassword) {
      toast.error("New password and confirmation do not match")
      return
    }

    setChangingPassword(true)
    try {
      const accessToken = localStorage.getItem("accessToken")
      if (!accessToken) {
        toast.error("Not authenticated")
        return
      }

      const response = await fetch("/api/auth/change-password", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ currentPassword, newPassword })
      })

      if (!response.ok) {
        const payload = await response.json()
        toast.error(payload.error || "Failed to change password")
        return
      }

      setCurrentPassword("")
      setNewPassword("")
      setConfirmPassword("")
      toast.success("Password changed successfully")
    } catch {
      toast.error("Failed to change password")
    } finally {
      setChangingPassword(false)
    }
  }

  const currentName = form.watch("name") || ""
  const initials = getInitials(currentName || "U")
  const bgColor = getAvatarColor(currentName || "U")

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="space-y-3 text-center">
          <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
          <p className="text-sm font-bold text-slate-400">Loading profile...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="mx-auto w-full max-w-6xl space-y-10 pb-20">
      {/* Page Header */}
      <div>
        <div className="mb-2 flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-linear-to-br from-blue-600 to-indigo-700 shadow-lg shadow-blue-500/30">
            <Settings className="h-6 w-6 stroke-2 text-white" />
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
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
          <div className="grid gap-8 xl:grid-cols-5">
            {/* ─── Avatar Upload Card ─────────────────────────────────────── */}
            <Card className="rounded-3xl border-slate-200/60 bg-white/80 shadow-2xl shadow-slate-200/50 backdrop-blur-xl xl:col-span-2 dark:border-slate-800/60 dark:bg-slate-950/80">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-100 dark:bg-blue-950">
                    <Camera className="h-5 w-5 stroke-2 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div>
                    <CardTitle className="text-2xl font-bold">Profile Picture</CardTitle>
                    <CardDescription>Upload or drag &amp; drop a photo</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col items-center gap-8">
                  {/* Circular avatar preview */}
                  <div className="relative shrink-0">
                    <div
                      className={cn(
                        "group relative h-28 w-28 cursor-pointer overflow-hidden rounded-3xl ring-4 ring-blue-500/20 transition-all hover:ring-blue-500/40",
                        isDragging && "scale-105 ring-blue-500"
                      )}
                      onClick={() => fileInputRef.current?.click()}
                      onDragOver={(e) => {
                        e.preventDefault()
                        setIsDragging(true)
                      }}
                      onDragLeave={() => {
                        setIsDragging(false)
                      }}
                      onDrop={handleDrop}
                    >
                      {avatarPreview ? (
                        <img
                          src={avatarPreview}
                          alt={currentName}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <div
                          className={cn(
                            "flex h-full w-full items-center justify-center text-3xl font-black text-white",
                            bgColor
                          )}
                        >
                          {initials}
                        </div>
                      )}
                      {/* Hover overlay */}
                      <div className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 transition-opacity group-hover:opacity-100">
                        <Camera className="h-7 w-7 text-white" />
                      </div>
                    </div>
                    {avatarChanged && (
                      <div className="absolute -top-1 -right-1 flex h-6 w-6 items-center justify-center rounded-full bg-emerald-500 shadow-lg">
                        <Check className="h-3.5 w-3.5 text-white" />
                      </div>
                    )}
                  </div>

                  {/* Drop zone */}
                  <div
                    className={cn(
                      "flex w-full flex-col items-center justify-center gap-4 rounded-2xl border-2 border-dashed p-8 text-center transition-all",
                      isDragging
                        ? "border-blue-500 bg-blue-50 dark:bg-blue-950/30"
                        : "border-slate-200 bg-slate-50/50 dark:border-slate-800 dark:bg-slate-900/30"
                    )}
                    onDragOver={(e) => {
                      e.preventDefault()
                      setIsDragging(true)
                    }}
                    onDragLeave={() => {
                      setIsDragging(false)
                    }}
                    onDrop={handleDrop}
                  >
                    <div
                      className={cn(
                        "flex h-12 w-12 items-center justify-center rounded-2xl transition-colors",
                        isDragging
                          ? "bg-blue-100 text-blue-600"
                          : "bg-white text-slate-400 shadow-sm dark:bg-slate-800"
                      )}
                    >
                      <Upload className="h-6 w-6" />
                    </div>
                    <div>
                      <p className="text-sm font-black text-slate-700 dark:text-slate-200">
                        Drag &amp; drop or{" "}
                        <button
                          type="button"
                          onClick={() => fileInputRef.current?.click()}
                          className="text-blue-600 underline underline-offset-2 hover:text-blue-700"
                        >
                          click to upload
                        </button>
                      </p>
                      <p className="mt-1 text-[10px] font-bold tracking-widest text-slate-400 uppercase">
                        PNG, JPG, GIF · Max 5 MB · Auto-resized to 256×256
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="rounded-xl border-slate-200 text-xs font-bold dark:border-slate-700"
                        onClick={() => fileInputRef.current?.click()}
                      >
                        <Camera className="mr-2 h-3.5 w-3.5" />
                        Choose Photo
                      </Button>
                      {avatarPreview && (
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className="rounded-xl border-slate-200 text-xs font-bold dark:border-slate-700"
                          onClick={() => {
                            setIsEditingAvatar((v) => !v)
                          }}
                        >
                          <Pencil className="mr-2 h-3.5 w-3.5" />
                          {isEditingAvatar ? "Done" : "Edit"}
                        </Button>
                      )}
                      {avatarPreview && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="rounded-xl text-xs font-bold text-rose-500 hover:bg-rose-50 hover:text-rose-600"
                          onClick={() => {
                            setAvatarPreview(null)
                            setAvatarSource(null)
                            setIsEditingAvatar(false)
                            setAvatarZoom(1)
                            setAvatarOffsetX(0)
                            setAvatarOffsetY(0)
                            setAvatarChanged(true)
                          }}
                        >
                          <Trash2 className="mr-2 h-3.5 w-3.5" />
                          Remove
                        </Button>
                      )}
                    </div>
                  </div>

                  {avatarPreview && isEditingAvatar && avatarSource && (
                    <div className="w-full space-y-4 rounded-2xl border border-slate-200/70 bg-slate-50/70 p-4 dark:border-slate-800/70 dark:bg-slate-900/40">
                      <div className="flex items-center justify-between">
                        <p className="text-xs font-black tracking-widest text-slate-500 uppercase">
                          Edit Avatar
                        </p>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="h-8 rounded-lg px-2 text-xs"
                          onClick={() => {
                            setAvatarZoom(1)
                            setAvatarOffsetX(0)
                            setAvatarOffsetY(0)
                          }}
                        >
                          <RotateCcw className="mr-1 h-3.5 w-3.5" />
                          Reset
                        </Button>
                      </div>

                      <div className="space-y-2">
                        <label className="text-xs font-semibold text-slate-600 dark:text-slate-300">
                          Zoom ({avatarZoom.toFixed(1)}x)
                        </label>
                        <input
                          type="range"
                          min={1}
                          max={2.5}
                          step={0.1}
                          value={avatarZoom}
                          onChange={(e) => {
                            setAvatarZoom(Number(e.target.value))
                          }}
                          className="w-full accent-blue-600"
                        />
                      </div>

                      <div className="space-y-2">
                        <label className="text-xs font-semibold text-slate-600 dark:text-slate-300">
                          Horizontal Position
                        </label>
                        <input
                          type="range"
                          min={-120}
                          max={120}
                          step={1}
                          value={avatarOffsetX}
                          onChange={(e) => {
                            setAvatarOffsetX(Number(e.target.value))
                          }}
                          className="w-full accent-blue-600"
                        />
                      </div>

                      <div className="space-y-2">
                        <label className="text-xs font-semibold text-slate-600 dark:text-slate-300">
                          Vertical Position
                        </label>
                        <input
                          type="range"
                          min={-120}
                          max={120}
                          step={1}
                          value={avatarOffsetY}
                          onChange={(e) => {
                            setAvatarOffsetY(Number(e.target.value))
                          }}
                          className="w-full accent-blue-600"
                        />
                      </div>

                      <p className="text-[11px] text-slate-500 dark:text-slate-400">
                        Saved images are automatically exported at 256x256 for consistent profile
                        quality.
                      </p>
                    </div>
                  )}

                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0]
                      if (file) {
                        handleFileSelect(file)
                      }
                      e.target.value = ""
                    }}
                  />
                </div>
              </CardContent>
            </Card>

            {/* ─── Profile Information Card ─────────────────────────────── */}
            <Card className="rounded-3xl border-slate-200/60 bg-white/80 shadow-2xl shadow-slate-200/50 backdrop-blur-xl xl:col-span-3 dark:border-slate-800/60 dark:bg-slate-950/80 dark:shadow-none">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-100 dark:bg-blue-950">
                    <User className="h-5 w-5 stroke-2 text-blue-600 dark:text-blue-400" />
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
                          disabled={saving}
                          className="rounded-xl border-slate-200 bg-white/60 backdrop-blur-sm transition-all placeholder:text-slate-400 focus:border-blue-500 focus:ring-blue-500/20 dark:border-slate-800 dark:bg-slate-900/60 dark:placeholder:text-slate-600"
                        />
                      </FormControl>
                      <FormDescription className="text-xs text-slate-500 dark:text-slate-400">
                        Changing your email updates how you sign in.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-8 xl:grid-cols-2">
            {/* ─── Preferences ─────────────────────────────────────────────── */}
            <Card className="rounded-3xl border-slate-200/60 bg-white/80 shadow-2xl shadow-slate-200/50 backdrop-blur-xl dark:border-slate-800/60 dark:bg-slate-950/80">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-100 dark:bg-purple-950">
                    <Palette className="h-5 w-5 stroke-2 text-purple-600 dark:text-purple-400" />
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

            {/* ─── Notifications ─────────────────────────────────────────── */}
            <Card className="rounded-3xl border-slate-200/60 bg-white/80 shadow-2xl shadow-slate-200/50 backdrop-blur-xl dark:border-slate-800/60 dark:bg-slate-950/80">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-rose-100 dark:bg-rose-950">
                    <Bell className="h-5 w-5 stroke-2 text-rose-600 dark:text-rose-400" />
                  </div>
                  <div>
                    <CardTitle className="text-2xl font-bold">Notifications</CardTitle>
                    <CardDescription>Manage your notification preferences</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
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
                <FormField
                  control={form.control}
                  name="notificationEmail"
                  render={({ field }) => (
                    <FormItem className="rounded-2xl border border-slate-200/60 bg-slate-50/50 p-4 dark:border-slate-800/60 dark:bg-slate-900/30">
                      <div className="space-y-3">
                        <div className="space-y-1">
                          <FormLabel className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                            Notification Email
                          </FormLabel>
                          <FormDescription className="text-xs text-slate-500 dark:text-slate-400">
                            Leave blank to use your account email
                          </FormDescription>
                        </div>
                        <div className="flex gap-2">
                          <FormControl>
                            <Input
                              placeholder="e.g. alerts@example.com"
                              {...field}
                              disabled={saving}
                              className="flex-1 rounded-xl border-slate-200/60 bg-white dark:border-slate-700/60 dark:bg-slate-900/50"
                            />
                          </FormControl>
                          <Button
                            type="button"
                            onClick={async () => {
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
                                    notificationEmail: field.value || ""
                                  })
                                })

                                if (response.ok) {
                                  const updated = await response.json()
                                  form.setValue(
                                    "notificationEmail",
                                    updated.notificationEmail ?? "",
                                    {
                                      shouldDirty: false,
                                      shouldTouch: true
                                    }
                                  )
                                  toast.success("Notification email saved!")
                                } else {
                                  const err = await response.json()
                                  toast.error(err.error || "Failed to save")
                                }
                              } catch {
                                toast.error("Failed to save")
                              } finally {
                                setSaving(false)
                              }
                            }}
                            disabled={saving}
                            size="sm"
                            className="px-4"
                          >
                            Save
                          </Button>
                        </div>
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>
          </div>

          <GoogleWorkspaceConnectionCard />

          <Card className="rounded-3xl border-slate-200/60 bg-white/80 shadow-2xl shadow-slate-200/50 backdrop-blur-xl dark:border-slate-800/60 dark:bg-slate-950/80">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-100 dark:bg-amber-950">
                  <KeyRound className="h-5 w-5 stroke-2 text-amber-600 dark:text-amber-400" />
                </div>
                <div>
                  <CardTitle className="text-2xl font-bold">Change Password</CardTitle>
                  <CardDescription>Update your sign-in password</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                  Current Password
                </label>
                <Input
                  type="password"
                  value={currentPassword}
                  onChange={(e) => {
                    setCurrentPassword(e.target.value)
                  }}
                  disabled={changingPassword}
                  className="rounded-xl border-slate-200 bg-white/60 dark:border-slate-800 dark:bg-slate-900/60"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                  New Password
                </label>
                <Input
                  type="password"
                  value={newPassword}
                  onChange={(e) => {
                    setNewPassword(e.target.value)
                  }}
                  disabled={changingPassword}
                  className="rounded-xl border-slate-200 bg-white/60 dark:border-slate-800 dark:bg-slate-900/60"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                  Confirm New Password
                </label>
                <Input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => {
                    setConfirmPassword(e.target.value)
                  }}
                  disabled={changingPassword}
                  className="rounded-xl border-slate-200 bg-white/60 dark:border-slate-800 dark:bg-slate-900/60"
                />
              </div>
              <div className="flex justify-end">
                <Button
                  type="button"
                  onClick={onChangePassword}
                  disabled={changingPassword}
                  className="rounded-xl"
                >
                  {changingPassword ? "Updating..." : "Change Password"}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Action Button */}
          <div className="flex justify-end pt-4">
            <Button
              type="submit"
              disabled={saving}
              className="h-12 rounded-2xl bg-linear-to-r from-blue-600 to-indigo-700 px-8 font-black shadow-lg shadow-blue-500/25 transition-all hover:shadow-xl hover:shadow-blue-500/40 disabled:opacity-70 dark:shadow-none"
            >
              {saving ? (
                <span className="flex items-center gap-2">
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  Saving...
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  <Check className="h-4 w-4" />
                  Save Changes
                </span>
              )}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  )
}
