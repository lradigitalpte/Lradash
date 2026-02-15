"use client"

import {
  FileText,
  Upload,
  Plus,
  Search,
  Download,
  MoreHorizontal,
  File,
  Folder,
  ArrowLeft,
  HardDrive,
  Files,
  Clock,
  ExternalLink,
  ChevronRight,
  Filter,
  Trash2,
  Edit3,
  Share2,
  FileCode,
  FileImage,
  FileType,
  FileSpreadsheet
} from "lucide-react"
import Link from "next/link"
import { useParams } from "next/navigation"
import { useState, useEffect, useMemo, useRef } from "react"
import { toast } from "sonner"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table"
import { apiClient } from "@/lib/api/client"
import { cn } from "@/lib/utils"

export default function DocumentsPage() {
  const params = useParams()
  const projectId = (params?.projectId || params?.boardId) as string
  const locale = params?.locale as string
  const [project, setProject] = useState<any>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [loading, setLoading] = useState(true)

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
    } catch (err) {
      console.error("Failed to fetch project:", err)
    } finally {
      setLoading(false)
    }
  }

  const [documents, setDocuments] = useState<any[]>([])
  const fileInputRef = useRef<HTMLInputElement>(null)

  const fetchDocuments = async () => {
    if (!projectId) {
      return
    }
    try {
      setLoading(true)
      const response = await apiClient.get(`/api/projects/${projectId}/documents`)
      if (response.ok) {
        const data = await response.json()
        setDocuments(data)
      }
    } catch (error) {
      console.error("Failed to fetch documents:", error)
      toast.error("Failed to load documents")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchDocuments()
  }, [projectId])

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) {
      return
    }

    // checking file size (e.g. 5MB limit)
    if (file.size > 5 * 1024 * 1024) {
      toast.error("File is too large (max 5MB)")
      return
    }

    // mapping mime types to our "types" logic roughly
    let type = "File"
    if (file.type.includes("pdf")) {
      type = "PDF"
    } else if (file.type.includes("image")) {
      type = "Image"
    } else if (file.type.includes("sheet") || file.type.includes("excel")) {
      type = "Excel"
    } else if (file.name.endsWith(".md")) {
      type = "Markdown"
    } else if (file.name.endsWith(".fig")) {
      type = "Figma"
    } // unlikely from browser but possible
    else if (file.name.endsWith(".sql")) {
      type = "SQL"
    }

    const sizeMB = (file.size / (1024 * 1024)).toFixed(2) + " MB"

    try {
      // In a real app, we would upload to S3 here and get a URL
      // For now, we just create the metadata record
      const response = await apiClient.post(`/api/projects/${projectId}/documents`, {
        name: file.name,
        type: type,
        size: sizeMB,
        folder: "General", // Default folder for now
        url: "" // No actual URL for now
      })

      if (response.ok) {
        const newDoc = await response.json()
        setDocuments([newDoc, ...documents])
        toast.success("File uploaded successfully")
      } else {
        throw new Error("Failed to upload")
      }
    } catch (error) {
      console.error("Upload error:", error)
      toast.error("Failed to upload file")
    } finally {
      // Reset input
      if (fileInputRef.current) {
        fileInputRef.current.value = ""
      }
    }
  }

  const handleDelete = async (id: string) => {
    try {
      const response = await apiClient.delete(`/api/projects/${projectId}/documents/${id}`)
      if (response.ok) {
        setDocuments(documents.filter((d) => d._id !== id))
        toast.success("Document deleted")
      } else {
        throw new Error("Failed to delete")
      }
    } catch (error) {
      console.error("Delete error:", error)
      toast.error("Failed to delete document")
    }
  }

  const filteredDocs = useMemo(() => {
    return documents.filter(
      (doc) =>
        doc.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        doc.folder.toLowerCase().includes(searchQuery.toLowerCase())
    )
  }, [searchQuery, documents])

  const getFileIcon = (type: string) => {
    switch (type) {
      case "PDF":
        return <FileText className="h-5 w-5 text-rose-500" />
      case "Figma":
        return <FileType className="h-5 w-5 text-purple-500" />
      case "Markdown":
        return <FileCode className="h-5 w-5 text-blue-500" />
      case "Excel":
        return <FileSpreadsheet className="h-5 w-5 text-green-500" />
      case "Image":
        return <FileImage className="h-5 w-5 text-amber-500" />
      default:
        return <File className="h-5 w-5 text-slate-400" />
    }
  }

  return (
    <div className="min-h-full space-y-8 bg-slate-50/50 p-8 font-sans dark:bg-slate-950/50">
      {/* Back Button & Navigation */}
      <div className="flex items-center gap-4">
        <Link href={`/${locale}/projects/${projectId}`}>
          <Button
            variant="ghost"
            className="h-9 rounded-full border border-slate-200/50 px-4 text-xs font-bold tracking-widest text-slate-500 uppercase shadow-sm hover:bg-white dark:hover:bg-slate-900"
          >
            <ArrowLeft className="mr-2 h-3 w-3" />
            Back to Hub
          </Button>
        </Link>
        <div className="mx-2 h-4 w-[1px] bg-slate-300" />
        <span className="text-[10px] font-black tracking-widest text-slate-400 uppercase">
          Project Workspace / Documents
        </span>
      </div>

      {/* Premium Header */}
      <div className="flex flex-col justify-between gap-6 md:flex-row md:items-end">
        <div className="space-y-2">
          <div className="mb-2 flex items-center gap-3">
            <div className="flex h-10 w-10 transform items-center justify-center rounded-2xl bg-blue-600 text-white shadow-xl shadow-blue-500/20 transition-transform hover:rotate-6">
              <Files className="h-5 w-5" />
            </div>
            <Badge
              variant="outline"
              className="h-6 border-slate-200 bg-white px-2 text-[10px] font-black tracking-widest uppercase dark:bg-slate-900"
            >
              Resource Library
            </Badge>
          </div>
          <h1 className="text-4xl font-black tracking-tight text-slate-900 dark:text-white">
            Document Vault
          </h1>
          <p className="font-medium text-slate-500 italic">
            Securely managing assets for{" "}
            <span className="text-blue-600 underline decoration-blue-500/30 underline-offset-4">
              "{project?.title || "Project"}"
            </span>
          </p>
        </div>

        <div className="flex items-center gap-3">
          <input type="file" ref={fileInputRef} className="hidden" onChange={handleFileUpload} />
          <Button
            variant="outline"
            onClick={() => {
              fileInputRef.current?.click()
            }}
            className="h-12 gap-2 rounded-2xl border-slate-200 bg-white px-6 font-bold"
          >
            <Upload className="h-4 w-4" />
            Upload Resource
          </Button>
          <Button className="h-12 gap-2 rounded-2xl bg-blue-600 px-8 font-black text-white shadow-xl shadow-blue-500/30 hover:bg-blue-700">
            <Plus className="h-5 w-5" />
            New Directory
          </Button>
        </div>
      </div>

      {/* Stats Dashboard */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {[
          {
            label: "Total Assets",
            value: documents.length,
            icon: Files,
            color: "blue",
            sub: "Increased +2 today"
          },
          {
            label: "Active Folders",
            value: "6",
            icon: Folder,
            color: "orange",
            sub: "Organized categories"
          },
          {
            label: "Used Storage",
            value: "23.4 MB",
            icon: HardDrive,
            color: "purple",
            sub: "4% of 1GB limit"
          },
          {
            label: "Recent Views",
            value: "128",
            icon: Clock,
            color: "green",
            sub: "Updated just now"
          }
        ].map((stat, idx) => (
          <Card
            key={idx}
            className="group overflow-hidden rounded-3xl border-none bg-white shadow-xl shadow-slate-200/50 transition-all hover:scale-[1.02] dark:bg-slate-900 dark:shadow-none"
          >
            <CardContent className="p-6">
              <div className="mb-4 flex items-center justify-between">
                <div
                  className={cn(
                    "flex h-12 w-12 items-center justify-center rounded-2xl shadow-inner transition-colors",
                    stat.color === "blue"
                      ? "bg-blue-50 text-blue-600"
                      : stat.color === "orange"
                        ? "bg-orange-50 text-orange-600"
                        : stat.color === "green"
                          ? "bg-green-50 text-green-600"
                          : "bg-purple-50 text-purple-600"
                  )}
                >
                  <stat.icon className="h-5 w-5" />
                </div>
                <Badge variant="outline" className="text-[10px] font-black text-slate-400">
                  {stat.sub}
                </Badge>
              </div>
              <div className="mb-1 text-[10px] font-black tracking-[0.2em] text-slate-400 uppercase">
                {stat.label}
              </div>
              <div className="text-3xl font-black">{stat.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Directories & Folders Section */}
      <div className="space-y-4">
        <h2 className="flex items-center gap-2 px-1 text-[10px] font-black tracking-[0.2em] text-slate-400 uppercase">
          <Folder className="h-3 w-3" />
          Active Directories
        </h2>
        <div className="grid gap-6 md:grid-cols-4 lg:grid-cols-5">
          {["Requirements", "Design", "Documentation", "Reports", "Technical"].map((folder) => (
            <Card
              key={folder}
              className="group cursor-pointer rounded-[2rem] border-none bg-white p-6 shadow-lg shadow-slate-200/30 transition-all hover:ring-2 hover:ring-blue-500/20 dark:bg-slate-900"
            >
              <div className="flex flex-col items-center gap-3 text-center">
                <div className="flex h-16 w-16 items-center justify-center rounded-[1.5rem] bg-slate-50 transition-transform group-hover:scale-110 dark:bg-slate-800">
                  <Folder className="h-8 w-8 fill-amber-400/20 text-amber-400" />
                </div>
                <div className="space-y-1">
                  <h3 className="font-black text-slate-900 dark:text-white">{folder}</h3>
                  <p className="text-[10px] font-bold tracking-tighter text-slate-400 uppercase">
                    {documents.filter((d) => d.folder === folder).length} active files
                  </p>
                </div>
              </div>
            </Card>
          ))}
          <button className="group flex flex-col items-center justify-center gap-2 rounded-[2rem] border-2 border-dashed border-slate-200 p-6 text-slate-400 transition-all hover:bg-slate-50 hover:text-blue-500 dark:border-slate-800">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 transition-transform group-hover:scale-110">
              <Plus className="h-5 w-5" />
            </div>
            <span className="text-xs font-black tracking-widest uppercase">New</span>
          </button>
        </div>
      </div>

      {/* Master Documents List */}
      <div className="space-y-5">
        <div className="sticky top-4 z-10 flex flex-col items-center justify-between gap-4 rounded-3xl border border-slate-100 bg-white bg-white/80 p-4 shadow-sm backdrop-blur-xl sm:flex-row dark:bg-slate-900">
          <div className="relative w-full max-w-md flex-1">
            <Search className="absolute top-1/2 left-4 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <Input
              placeholder="Find a resource by name or type..."
              className="h-12 rounded-2xl border-none bg-slate-50 pl-11 text-sm focus:ring-2 focus:ring-blue-500/20"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value)
              }}
            />
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              className="gap-2 rounded-2xl text-xs font-black tracking-widest text-slate-500 uppercase"
            >
              <Filter className="h-4 w-4" />
              Filter
            </Button>
            <div className="mx-2 hidden h-8 w-[1px] bg-slate-100 sm:block" />
            <Button
              variant="ghost"
              className="gap-2 rounded-2xl text-xs font-black tracking-widest text-slate-500 uppercase"
            >
              <Download className="h-4 w-4" />
              Export List
            </Button>
          </div>
        </div>

        <Card className="overflow-hidden rounded-[2rem] border-none bg-white shadow-2xl shadow-slate-200/50 dark:bg-slate-900">
          <Table>
            <TableHeader className="h-16 bg-slate-50/50 dark:bg-slate-900/50">
              <TableRow className="border-b border-slate-100 dark:border-slate-800">
                <TableHead className="w-20" />
                <TableHead className="text-[10px] font-black tracking-widest text-slate-400 uppercase">
                  Resource Name
                </TableHead>
                <TableHead className="text-[10px] font-black tracking-widest text-slate-400 uppercase">
                  Class
                </TableHead>
                <TableHead className="text-[10px] font-black tracking-widest text-slate-400 uppercase">
                  Location
                </TableHead>
                <TableHead className="text-[10px] font-black tracking-widest text-slate-400 uppercase">
                  Dimension
                </TableHead>
                <TableHead className="text-right text-[10px] font-black tracking-widest text-slate-400 uppercase">
                  Last Sync
                </TableHead>
                <TableHead className="w-20" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredDocs.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="py-32 text-center">
                    <div className="flex flex-col items-center gap-4">
                      <div className="flex h-20 w-20 items-center justify-center rounded-full bg-slate-50">
                        <FileText className="h-10 w-10 text-slate-200" />
                      </div>
                      <div className="space-y-1">
                        <p className="text-xl font-black italic">No records matching your search</p>
                        <p className="mx-auto max-w-xs text-sm font-medium text-slate-400">
                          Try broadening your search or creating a new folder to organize assets.
                        </p>
                      </div>
                      <Button className="mt-4 rounded-xl bg-blue-600 font-bold">
                        <Upload className="mr-2 h-4 w-4" />
                        Initiate Upload
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                filteredDocs.map((doc) => (
                  <TableRow
                    key={doc._id}
                    className="group h-20 border-b border-slate-50 transition-colors hover:bg-slate-50/50 dark:border-slate-800/50 dark:hover:bg-slate-800/30"
                  >
                    <TableCell className="text-center">
                      <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-xl border border-slate-100 bg-white shadow-sm transition-transform group-hover:scale-110 dark:border-slate-700 dark:bg-slate-800">
                        {getFileIcon(doc.type)}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="font-black text-slate-900 dark:text-white">
                          {doc.name}
                        </span>
                        <span className="text-[10px] font-bold tracking-tighter text-slate-400 uppercase">
                          Verified Asset
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="secondary"
                        className="h-5 bg-slate-100 px-2 text-[9px] font-black tracking-tighter uppercase"
                      >
                        {doc.type}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1.5 text-xs font-bold text-slate-500">
                        <Folder className="h-3 w-3 text-amber-500" />
                        {doc.folder}
                      </div>
                    </TableCell>
                    <TableCell className="text-xs font-black text-slate-500 tabular-nums">
                      {doc.size}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex flex-col items-end">
                        <span className="text-xs font-bold text-slate-900 dark:text-white">
                          {new Date(doc.createdAt).toLocaleDateString("en-US", {
                            month: "short",
                            day: "numeric",
                            year: "numeric"
                          })}
                        </span>
                        <span className="mt-0.5 text-[9px] font-black tracking-widest text-slate-400 uppercase">
                          Automated Back-up
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-10 w-10 rounded-xl transition-colors hover:bg-white"
                          >
                            <MoreHorizontal className="h-5 w-5 text-slate-400" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent
                          align="end"
                          className="w-56 rounded-2xl border-slate-100 p-2 shadow-2xl"
                        >
                          <DropdownMenuItem className="gap-3 rounded-xl py-3">
                            <Download className="h-4 w-4 text-blue-500" />
                            <div className="flex flex-col">
                              <span className="text-sm font-bold">Download Asset</span>
                              <span className="text-[10px] text-muted-foreground">
                                Get a local copy
                              </span>
                            </div>
                          </DropdownMenuItem>
                          <DropdownMenuItem className="gap-3 rounded-xl py-3">
                            <Share2 className="h-4 w-4 text-purple-500" />
                            <div className="flex flex-col">
                              <span className="text-sm font-bold">Share Workspace Link</span>
                              <span className="text-[10px] text-muted-foreground">
                                Grant access to peers
                              </span>
                            </div>
                          </DropdownMenuItem>
                          <DropdownMenuItem className="gap-3 rounded-xl py-3">
                            <Edit3 className="h-4 w-4 text-slate-400" />
                            <div className="flex flex-col">
                              <span className="text-sm font-bold">Rename Resource</span>
                              <span className="text-[10px] text-muted-foreground">
                                Change tracking name
                              </span>
                            </div>
                          </DropdownMenuItem>
                          <DropdownMenuSeparator className="my-2" />
                          <DropdownMenuItem
                            className="gap-3 rounded-xl bg-red-50/50 py-3 text-red-600 hover:bg-red-50"
                            onClick={async () => handleDelete(doc._id)}
                          >
                            <Trash2 className="h-4 w-4" />
                            <div className="flex flex-col">
                              <span className="text-sm font-bold">Delete Forever</span>
                              <span className="text-[10px] font-medium text-red-500/60">
                                Purge from vault
                              </span>
                            </div>
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </Card>
      </div>

      {/* Storage Footer Hint */}
      <div className="flex items-center justify-between rounded-3xl border border-white/20 bg-white/40 px-8 py-4 backdrop-blur-sm dark:bg-slate-900/40">
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-100 text-blue-600">
            <Info className="h-4 w-4" />
          </div>
          <p className="text-xs font-bold text-slate-500">
            All assets are end-to-end encrypted and backed up daily across 3 global regions.
          </p>
        </div>
        <Button
          variant="link"
          className="group gap-2 text-[10px] font-black tracking-widest text-blue-600 uppercase"
        >
          Manage Storage Plans
          <ChevronRight className="h-3 w-3 transition-transform group-hover:translate-x-1" />
        </Button>
      </div>
    </div>
  )
}

function Info({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <circle cx="12" cy="12" r="10" />
      <path d="M12 16v-4" />
      <path d="M12 8h.01" />
    </svg>
  )
}
