"use client"

import {
  Save,
  Trash2,
  Info,
  ArrowLeft,
  Settings2,
  Shield,
  Bell,
  Eye,
  Globe,
  Lock,
  Archive,
  AlertOctagon,
  Clock,
  Fingerprint,
  User,
  Users,
  ChevronRight,
  Sparkles,
  Zap,
  CheckCircle2
} from "lucide-react"
import Link from "next/link"
import { useParams } from "next/navigation"
import { useRouter } from "next/navigation"
import { useState, useEffect } from "react"
import { toast } from "sonner"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Textarea } from "@/components/ui/textarea"
import { apiClient } from "@/lib/api/client"
import { cn } from "@/lib/utils"

export default function SettingsPage() {
  const params = useParams()
  const projectId = (params?.projectId || params?.boardId) as string
  const locale = params?.locale as string

  const router = useRouter()
  const [project, setProject] = useState<any>(null)
  const [projectName, setProjectName] = useState("")
  const [projectDescription, setProjectDescription] = useState("")
  const [isPublic, setIsPublic] = useState(false)
  const [availableClients, setAvailableClients] = useState<
    Array<{ _id: string; name: string; email: string; avatar?: string }>
  >([])
  const [selectedClientIds, setSelectedClientIds] = useState<string[]>([])
  const [loadingClientSharing, setLoadingClientSharing] = useState(false)
  const [loading, setLoading] = useState(true)
  const [hasChanges, setHasChanges] = useState(false)

  useEffect(() => {
    if (projectId) {
      fetchProject()
    }
  }, [projectId])

  const fetchProject = async () => {
    try {
      setLoading(true)
      const response = await apiClient.get(`/api/projects/${projectId}`)
      if (!response.ok) {
        return
      }
      const data = await response.json()
      setProject(data)
      setProjectName(data.title || "")
      setProjectDescription(data.description || "")
      setIsPublic(data.visibility === "PUBLIC")
      await fetchClientSharing()
    } catch (err) {
      console.error("Failed to fetch project:", err)
      toast.error("Failed to load project settings")
    } finally {
      setLoading(false)
    }
  }

  const fetchClientSharing = async () => {
    try {
      setLoadingClientSharing(true)
      const response = await apiClient.get(`/api/projects/${projectId}/client-sharing`)
      if (!response.ok) {
        return
      }
      const data = await response.json()
      setAvailableClients(data.availableClients || [])
      setSelectedClientIds(data.selectedClientIds || [])
    } catch (error) {
      console.error("Failed to load client sharing:", error)
    } finally {
      setLoadingClientSharing(false)
    }
  }

  const toggleClientSharing = (clientId: string, enabled: boolean) => {
    setSelectedClientIds((current) => {
      if (enabled) {
        return current.includes(clientId) ? current : [...current, clientId]
      }
      return current.filter((id) => id !== clientId)
    })
    setHasChanges(true)
  }

  const handleSave = async () => {
    setLoading(true)
    try {
      const response = await apiClient.patch(`/api/projects/${projectId}`, {
        title: projectName,
        description: projectDescription,
        visibility: isPublic ? "PUBLIC" : "PRIVATE"
      })

      if (!response.ok) {
        throw new Error("Failed to update project")
      }

      const sharingResponse = await apiClient.put(`/api/projects/${projectId}/client-sharing`, {
        clientIds: selectedClientIds
      })
      if (!sharingResponse.ok) {
        throw new Error("Failed to update client sharing")
      }

      const sharingData = await sharingResponse.json()

      const updatedProject = await response.json()
      setProject(updatedProject)
      toast.success("Project settings saved", {
        description: `Everything is up to date. Shared with ${sharingData.sharedCount || 0} client account(s).`
      })
      setHasChanges(false)
    } catch (error) {
      console.error("Update error:", error)
      toast.error("Failed to save settings")
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async () => {
    if (!confirm("Are you sure you want to delete this project? This action cannot be undone.")) {
      return
    }

    try {
      const response = await apiClient.delete(`/api/projects/${projectId}`)
      if (response.ok) {
        toast.success("Project deleted")
        router.push(`/${locale}/projects`)
      } else {
        throw new Error("Failed to delete")
      }
    } catch (error) {
      console.error("Delete error:", error)
      toast.error("Failed to delete project")
    }
  }

  return (
    <div className="min-h-full space-y-10 bg-slate-50/50 p-8 pb-32 font-sans dark:bg-slate-950/50">
      {/* Back Button & Navigation */}
      <div className="flex items-center gap-4">
        <Link href={`/${locale}/projects/${projectId}`}>
          <Button
            variant="ghost"
            className="h-9 rounded-full border border-slate-200/50 px-4 text-xs font-bold tracking-widest text-slate-500 uppercase shadow-sm hover:bg-white dark:hover:bg-slate-900"
          >
            <ArrowLeft className="mr-2 h-3 w-3" />
            Back to Project
          </Button>
        </Link>
        <div className="mx-2 h-4 w-[1px] bg-slate-300" />
        <span className="text-[10px] font-black tracking-widest text-slate-400 uppercase">
          Project Settings / Configuration
        </span>
      </div>

      {/* Premium Header */}
      <div className="flex flex-col justify-between gap-6 md:flex-row md:items-end">
        <div className="space-y-2">
          <div className="mb-2 flex items-center gap-3">
            <div className="flex h-10 w-10 transform items-center justify-center rounded-2xl bg-slate-900 text-white shadow-xl transition-transform hover:rotate-12 dark:bg-white dark:text-slate-900">
              <Settings2 className="h-5 w-5" />
            </div>
            <Badge
              variant="outline"
              className="h-6 border-slate-200 bg-white px-2 text-[10px] font-black tracking-widest uppercase dark:bg-slate-900"
            >
              Settings
            </Badge>
          </div>
          <h1 className="text-4xl font-black tracking-tight text-slate-900 dark:text-white">
            Project Settings
          </h1>
          <p className="font-medium text-slate-500 italic">
            Adjust core settings for{" "}
            <span className="text-blue-600 underline decoration-blue-500/30 underline-offset-4">
              "{project?.title || "Project"}"
            </span>
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-10 lg:grid-cols-3">
        <div className="space-y-10 lg:col-span-2">
          {/* General Section */}
          <Card className="overflow-hidden rounded-[2.5rem] border-none bg-white shadow-2xl shadow-slate-200/50 dark:bg-slate-900">
            <CardHeader className="p-10 pb-4">
              <div className="mb-2 flex items-center gap-3">
                <div className="rounded-xl bg-blue-50 p-2 text-blue-600">
                  <Sparkles className="h-5 w-5" />
                </div>
                <div>
                  <CardTitle className="text-2xl font-black">General Info</CardTitle>
                  <CardDescription className="text-xs font-bold tracking-widest text-slate-400 uppercase">
                    Basic project information
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-8 p-10 pt-0">
              <div className="space-y-3">
                <Label className="ml-1 text-[10px] font-black tracking-widest text-slate-400 uppercase">
                  Project Name
                </Label>
                <Input
                  value={projectName}
                  onChange={(e) => {
                    setProjectName(e.target.value)
                    setHasChanges(true)
                  }}
                  placeholder="Enter project name..."
                  className="h-14 rounded-2xl border-slate-100 bg-slate-50 px-6 text-lg font-bold transition-all placeholder:font-medium placeholder:italic focus:ring-4 focus:ring-blue-500/10 dark:bg-slate-950"
                />
              </div>

              <div className="space-y-3">
                <Label className="ml-1 text-[10px] font-black tracking-widest text-slate-400 uppercase">
                  Description
                </Label>
                <Textarea
                  value={projectDescription}
                  onChange={(e) => {
                    setProjectDescription(e.target.value)
                    setHasChanges(true)
                  }}
                  placeholder="Enter project details..."
                  className="min-h-[160px] resize-none rounded-2xl border-slate-100 bg-slate-50 p-6 leading-relaxed font-medium focus:ring-4 focus:ring-blue-500/10 dark:bg-slate-950"
                />
              </div>

              <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                <div className="space-y-3">
                  <Label className="ml-1 text-[10px] font-black tracking-widest text-slate-400 uppercase">
                    Project Status
                  </Label>
                  <Select defaultValue="active">
                    <SelectTrigger className="h-12 rounded-xl border-slate-100 bg-slate-50 px-4 font-bold dark:bg-slate-950">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl border-slate-100 shadow-2xl">
                      <SelectItem value="active" className="py-2.5">
                        <div className="flex items-center gap-2">
                          <span className="h-2 w-2 rounded-full bg-green-500" />
                          Active
                        </div>
                      </SelectItem>
                      <SelectItem value="onhold" className="py-2.5">
                        <div className="flex items-center gap-2">
                          <span className="h-2 w-2 rounded-full bg-amber-500" />
                          On Hold
                        </div>
                      </SelectItem>
                      <SelectItem value="completed" className="py-2.5">
                        <div className="flex items-center gap-2">
                          <span className="h-2 w-2 rounded-full bg-blue-500" />
                          Completed
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-3">
                  <Label className="ml-1 text-[10px] font-black tracking-widest text-slate-400 uppercase">
                    Priority
                  </Label>
                  <Select defaultValue="medium">
                    <SelectTrigger className="h-12 rounded-xl border-slate-100 bg-slate-50 px-4 font-bold dark:bg-slate-950">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl border-slate-100 shadow-2xl">
                      <SelectItem value="low" className="py-2.5">
                        Low
                      </SelectItem>
                      <SelectItem value="medium" className="py-2.5 font-bold text-blue-600">
                        Medium
                      </SelectItem>
                      <SelectItem
                        value="high"
                        className="flex items-center gap-2 py-2.5 font-black text-rose-600"
                      >
                        High
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Access & Security Section */}
          <Card className="overflow-hidden rounded-[2.5rem] border-none bg-white shadow-2xl shadow-slate-200/50 dark:bg-slate-900">
            <CardHeader className="p-10 pb-4">
              <div className="mb-2 flex items-center gap-3">
                <div className="rounded-xl bg-purple-50 p-2 text-purple-600">
                  <Shield className="h-5 w-5" />
                </div>
                <div>
                  <CardTitle className="text-2xl font-black">Access & Security</CardTitle>
                  <CardDescription className="text-xs font-bold tracking-widest text-slate-400 uppercase">
                    Manage project access and visibility
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-8 p-10 pt-0">
              <div className="flex items-center justify-between rounded-3xl border border-slate-100 bg-slate-50 p-6 dark:border-slate-800 dark:bg-slate-950">
                <div className="flex gap-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-slate-100 bg-white text-blue-600 shadow-sm dark:bg-slate-900">
                    {isPublic ? <Globe className="h-6 w-6" /> : <Lock className="h-6 w-6" />}
                  </div>
                  <div>
                    <h4 className="font-black text-slate-900 dark:text-white">Public Visibility</h4>
                    <p className="max-w-[280px] text-xs font-medium text-slate-500">
                      Allow discoverability and viewing for non-members.
                    </p>
                  </div>
                </div>
                <Switch
                  checked={isPublic}
                  onCheckedChange={(val: boolean) => {
                    setIsPublic(val)
                    setHasChanges(true)
                  }}
                />
              </div>

              <div className="space-y-4">
                <Label className="ml-1 text-[10px] font-black tracking-widest text-slate-400 uppercase">
                  Default Project Role
                </Label>
                <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                  {[
                    { id: "viewer", label: "Viewer", desc: "Read only access", icon: Eye },
                    {
                      id: "member",
                      label: "Member",
                      desc: "Collaborator level",
                      icon: User,
                      active: true
                    },
                    { id: "admin", label: "Admin", desc: "Full project access", icon: Shield }
                  ].map((role) => (
                    <button
                      key={role.id}
                      className={cn(
                        "rounded-2xl border-2 p-4 text-left transition-all",
                        role.active
                          ? "border-blue-500 bg-blue-50/50 shadow-lg ring-4 ring-blue-500/10"
                          : "border-slate-100 bg-white hover:border-slate-200 dark:bg-slate-900"
                      )}
                    >
                      <role.icon
                        className={cn(
                          "mb-2 h-5 w-5",
                          role.active ? "text-blue-600" : "text-slate-400"
                        )}
                      />
                      <div className="text-sm font-black">{role.label}</div>
                      <div className="text-[10px] font-bold tracking-tighter text-slate-400 uppercase">
                        {role.desc}
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-4 rounded-3xl border border-slate-100 bg-slate-50 p-6 dark:border-slate-800 dark:bg-slate-950">
                <div className="flex items-start gap-3">
                  <div className="mt-0.5 rounded-xl bg-emerald-50 p-2 text-emerald-600">
                    <Users className="h-4 w-4" />
                  </div>
                  <div>
                    <h4 className="font-black text-slate-900 dark:text-white">
                      Client Report Sharing
                    </h4>
                    <p className="text-xs font-medium text-slate-500">
                      Select which client accounts can access this project in the client portal and
                      weekly digest.
                    </p>
                  </div>
                </div>

                {loadingClientSharing ? (
                  <p className="text-xs font-medium text-slate-500">
                    Loading client access list...
                  </p>
                ) : availableClients.length === 0 ? (
                  <p className="text-xs font-medium text-slate-500">
                    No client users are available in this organization yet.
                  </p>
                ) : (
                  <div className="space-y-3">
                    {availableClients.map((client) => (
                      <div
                        key={client._id}
                        className="flex items-center justify-between rounded-2xl border border-slate-200 bg-white px-4 py-3 dark:border-slate-800 dark:bg-slate-900"
                      >
                        <div>
                          <p className="text-sm font-black text-slate-900 dark:text-white">
                            {client.name}
                          </p>
                          <p className="text-[11px] font-medium text-slate-500">{client.email}</p>
                        </div>
                        <Switch
                          checked={selectedClientIds.includes(client._id)}
                          onCheckedChange={(checked: boolean) => {
                            toggleClientSharing(client._id, checked)
                          }}
                        />
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar Sections */}
        <div className="space-y-10">
          {/* Notification Quickset */}
          <Card className="overflow-hidden rounded-[2.5rem] border-none bg-white shadow-2xl shadow-slate-200/50 dark:bg-slate-900">
            <CardHeader className="p-8">
              <div className="flex items-center gap-2">
                <Bell className="h-4 w-4 text-amber-500" />
                <CardTitle className="text-xl font-black">Notifications</CardTitle>
              </div>
              <CardDescription className="text-[10px] font-black tracking-widest text-slate-400 uppercase">
                Update alerts
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6 p-8 pt-0">
              {[
                { id: "email", label: "Email Updates", sub: "Weekly project summary" },
                { id: "assigned", label: "Task Alerts", sub: "When assigned to you", active: true },
                {
                  id: "mentions",
                  label: "Mention Notifications",
                  sub: "Direct team pings",
                  active: true
                },
                {
                  id: "deadlines",
                  label: "Deadline Alerts",
                  sub: "24h before due dates",
                  active: true
                }
              ].map((item) => (
                <div key={item.id} className="group flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label className="cursor-pointer text-sm font-black text-slate-900 dark:text-white">
                      {item.label}
                    </Label>
                    <p className="text-[10px] font-bold tracking-tighter text-slate-400 uppercase">
                      {item.sub}
                    </p>
                  </div>
                  <Switch defaultChecked={item.active} />
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Project Details Metadata */}
          <Card className="relative overflow-hidden rounded-[2.5rem] border-none bg-slate-900 text-white shadow-xl shadow-slate-200/30 dark:bg-slate-950">
            <div className="absolute top-0 right-0 p-8 opacity-10">
              <Fingerprint className="h-24 w-24" />
            </div>
            <CardHeader className="p-8 pb-4">
              <CardTitle className="text-xl font-black">Project Details</CardTitle>
              <CardDescription className="text-[10px] font-bold tracking-[0.2em] text-slate-400 uppercase">
                System Info
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6 p-8 pt-0">
              <div className="space-y-1">
                <Label className="text-[10px] font-black tracking-widest text-slate-500 uppercase">
                  Project ID
                </Label>
                <div className="flex items-center justify-between rounded-xl border border-white/10 bg-white/5 p-3">
                  <span className="max-w-[120px] truncate font-mono text-[10px] text-blue-400">
                    {projectId}
                  </span>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 text-white hover:bg-white/10"
                    onClick={() => {
                      window.navigator.clipboard.writeText(projectId)
                      toast.success("Copied to clipboard")
                    }}
                  >
                    <Zap className="h-3 w-3" />
                  </Button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-1">
                  <Label className="text-[10px] font-black tracking-widest text-slate-500 uppercase">
                    Created On
                  </Label>
                  <div className="flex items-center gap-1.5 text-xs font-bold">
                    <Clock className="h-3 w-3 text-emerald-500" />
                    {project?.createdAt
                      ? new Date(project.createdAt).toLocaleDateString()
                      : "Loading..."}
                  </div>
                </div>
                <div className="space-y-1">
                  <Label className="text-[10px] font-black tracking-widest text-slate-500 uppercase">
                    Owner
                  </Label>
                  <div className="flex items-center gap-1.5 text-xs font-bold">
                    <Shield className="h-3 w-3 text-blue-500" />
                    Project Creator
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Danger Zone */}
          <Card className="overflow-hidden rounded-[2.5rem] border-2 border-rose-100 bg-rose-50/30 shadow-2xl shadow-rose-200/20 dark:border-rose-950 dark:bg-rose-950/10">
            <CardHeader className="p-8">
              <div className="flex items-center gap-2">
                <AlertOctagon className="h-4 w-4 text-rose-600" />
                <CardTitle className="text-xl font-black text-rose-600">Danger Zone</CardTitle>
              </div>
              <CardDescription className="text-[10px] font-black tracking-widest text-rose-400 uppercase">
                Destructive Actions
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 p-8 pt-0">
              <Button
                variant="outline"
                className="group h-12 w-full justify-between rounded-xl border-rose-200 font-bold text-rose-600 transition-all hover:bg-rose-100 hover:text-rose-700"
              >
                <div className="flex items-center gap-2">
                  <Archive className="h-4 w-4" />
                  Archive Project
                </div>
                <ChevronRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </Button>
              <Button
                onClick={handleDelete}
                className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-rose-600 font-black shadow-lg shadow-rose-500/30"
              >
                <Trash2 className="h-4 w-4" />
                Delete Project
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Sticky Bottom Action Bar */}
      <div
        className={cn(
          "fixed bottom-8 left-1/2 z-50 w-full max-w-4xl -translate-x-1/2 px-8 transition-all duration-500",
          hasChanges ? "translate-y-0 opacity-100" : "translate-y-20 opacity-0"
        )}
      >
        <div className="flex items-center justify-between rounded-3xl border border-white/10 bg-slate-900 p-4 text-white shadow-2xl dark:bg-white dark:text-slate-900">
          <div className="ml-4 flex items-center gap-3">
            <div className="flex h-10 w-10 animate-pulse items-center justify-center rounded-full bg-blue-600">
              <Info className="h-5 w-5 text-white" />
            </div>
            <div>
              <div className="text-sm leading-tight font-black">Unsaved Changes</div>
              <p className="text-[10px] font-bold tracking-widest uppercase opacity-60">
                Changes detected
              </p>
            </div>
          </div>
          <div className="mr-2 flex items-center gap-2">
            <Button
              variant="ghost"
              onClick={() => {
                fetchProject()
                setHasChanges(false)
              }}
              className="font-bold text-white hover:bg-white/10 dark:text-slate-900"
            >
              Discard
            </Button>
            <Button
              onClick={handleSave}
              disabled={loading}
              className="flex h-12 items-center gap-2 rounded-2xl bg-blue-600 px-8 font-black text-white hover:bg-blue-700"
            >
              {loading ? (
                <Zap className="h-4 w-4 animate-spin" />
              ) : (
                <>
                  <CheckCircle2 className="h-4 w-4" />
                  Save Changes
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
