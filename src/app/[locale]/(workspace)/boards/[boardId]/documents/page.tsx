"use client"

import {
  FileText,
  Upload,
  Search,
  ExternalLink,
  Trash2,
  File,
  FileCode,
  FileImage,
  FileSpreadsheet,
  FileType,
  ArrowLeft,
  HardDrive,
  Files,
  Loader2
} from "lucide-react"
import Link from "next/link"
import { useParams } from "next/navigation"
import { useState, useEffect, useMemo } from "react"
import { toast } from "sonner"

import { UploadModal } from "@/components/documents/UploadModal"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
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

export default function BoardDocumentsPage() {
  const params = useParams()
  const boardId = (params?.boardId as string) || ""
  const locale = (params?.locale as string) || ""
  const [documents, setDocuments] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [uploadModalOpen, setUploadModalOpen] = useState(false)

  const fetchDocuments = async () => {
    if (!boardId) {
      return
    }
    try {
      setLoading(true)
      const response = await apiClient.get(`/api/boards/${boardId}/documents`)
      if (response.ok) {
        const data = await response.json()
        setDocuments(Array.isArray(data) ? data : [])
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
  }, [boardId])

  const handleDelete = async (id: string) => {
    try {
      const response = await apiClient.delete(`/api/boards/${boardId}/documents/${id}`)
      if (response.ok) {
        setDocuments((prev) => prev.filter((d) => d._id !== id))
        toast.success("Document removed")
      } else {
        throw new Error("Failed to delete")
      }
    } catch (error) {
      console.error("Delete error:", error)
      toast.error("Failed to remove document")
    }
  }

  const filteredDocs = useMemo(() => {
    if (!searchQuery.trim()) {
      return documents
    }
    const q = searchQuery.toLowerCase()
    return documents.filter(
      (d) =>
        d.name?.toLowerCase().includes(q) ||
        d.type?.toLowerCase().includes(q) ||
        d.folder?.toLowerCase().includes(q)
    )
  }, [documents, searchQuery])

  const usedStorage = useMemo(() => {
    const total = documents.reduce((sum, doc) => {
      const s = String(doc.size || "")
      const match = s.match(/[\d.]+/)
      const num = parseFloat(match?.[0] || "0")
      if (s.includes("MB")) {
        return sum + num * 1024 * 1024
      }
      if (s.includes("KB")) {
        return sum + num * 1024
      }
      if (s.includes("GB")) {
        return sum + num * 1024 * 1024 * 1024
      }
      return sum + num
    }, 0)
    if (total < 1024 * 1024) {
      return (total / 1024).toFixed(1) + " KB"
    }
    if (total < 1024 * 1024 * 1024) {
      return (total / (1024 * 1024)).toFixed(1) + " MB"
    }
    return (total / (1024 * 1024 * 1024)).toFixed(2) + " GB"
  }, [documents])

  const getFileIcon = (type: string) => {
    switch (type) {
      case "PDF":
        return <FileText className="h-5 w-5 text-rose-500" />
      case "Image":
        return <FileImage className="h-5 w-5 text-amber-500" />
      case "Video":
      case "Audio":
        return <FileType className="h-5 w-5 text-purple-500" />
      case "Markdown":
        return <FileCode className="h-5 w-5 text-blue-500" />
      case "Excel":
        return <FileSpreadsheet className="h-5 w-5 text-green-500" />
      default:
        return <File className="h-5 w-5 text-slate-400" />
    }
  }

  return (
    <div className="min-h-full space-y-8 bg-slate-50/50 p-8 font-sans dark:bg-slate-950/50">
      <UploadModal
        boardId={boardId}
        open={uploadModalOpen}
        onOpenChange={setUploadModalOpen}
        onUploadSuccess={(doc) => {
          setDocuments((prev) => [doc, ...prev])
        }}
      />

      <div className="flex items-center gap-4">
        <Link href={`/${locale}/boards/${boardId}`}>
          <Button
            variant="ghost"
            className="h-9 rounded-full border border-slate-200/50 px-4 text-xs font-bold tracking-widest text-slate-500 uppercase shadow-sm hover:bg-white dark:hover:bg-slate-900"
          >
            <ArrowLeft className="mr-2 h-3 w-3" />
            Workspace
          </Button>
        </Link>
        <div className="h-4 w-px bg-slate-300" />
        <span className="text-[10px] font-black tracking-widest text-slate-400 uppercase">
          Documents
        </span>
      </div>

      <div className="flex flex-col justify-between gap-6 md:flex-row md:items-end">
        <div className="space-y-2">
          <div className="mb-2 flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-900 text-white shadow-xl dark:bg-white dark:text-slate-900">
              <Files className="h-6 w-6" />
            </div>
            <Badge
              variant="outline"
              className="h-6 border-slate-200 bg-white px-2 text-[10px] font-black tracking-widest uppercase dark:bg-slate-900"
            >
              Workspace files
            </Badge>
          </div>
          <h1 className="text-4xl font-black tracking-tight text-slate-900 dark:text-white">
            Documents
          </h1>
          <p className="max-w-2xl font-medium text-slate-500 italic dark:text-slate-400">
            Upload and manage files for this workspace. Private to you and board members.
          </p>
        </div>
        <Button
          onClick={() =>{  setUploadModalOpen(true); }}
          className="h-12 gap-2 rounded-2xl bg-slate-900 px-6 font-black text-white shadow-xl hover:bg-slate-800 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-100"
        >
          <Upload className="h-5 w-5" />
          Upload File
        </Button>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <Card className="overflow-hidden rounded-[2rem] border-none bg-white shadow-xl shadow-slate-200/50 dark:bg-slate-900 dark:shadow-none">
          <CardContent className="p-6">
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-50 text-blue-600 dark:bg-blue-950/50">
              <Files className="h-5 w-5" />
            </div>
            <div className="mb-1 text-[10px] font-black tracking-[0.2em] text-slate-400 uppercase">
              Total files
            </div>
            <div className="text-3xl font-black text-slate-900 dark:text-white">
              {documents.length}
            </div>
          </CardContent>
        </Card>
        <Card className="overflow-hidden rounded-[2rem] border-none bg-white shadow-xl shadow-slate-200/50 dark:bg-slate-900 dark:shadow-none">
          <CardContent className="p-6">
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-50 text-slate-600 dark:bg-slate-800">
              <HardDrive className="h-5 w-5" />
            </div>
            <div className="mb-1 text-[10px] font-black tracking-[0.2em] text-slate-400 uppercase">
              Storage used
            </div>
            <div className="text-3xl font-black text-slate-900 dark:text-white">{usedStorage}</div>
          </CardContent>
        </Card>
      </div>

      <div className="rounded-2xl border border-slate-100 bg-white shadow-lg dark:border-slate-800 dark:bg-slate-900">
        <div className="border-b border-slate-100 p-4 dark:border-slate-800">
          <div className="relative">
            <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <Input
              placeholder="Search by name or type..."
              value={searchQuery}
              onChange={(e) =>{  setSearchQuery(e.target.value); }}
              className="h-11 rounded-xl border-slate-200 bg-slate-50 pl-10 dark:border-slate-700 dark:bg-slate-800"
            />
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center gap-2 py-16 text-slate-500">
            <Loader2 className="h-5 w-5 animate-spin" />
            <span className="text-sm font-medium">Loading documents…</span>
          </div>
        ) : filteredDocs.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-b-2xl bg-slate-50/80 py-16 dark:bg-slate-900/50">
            <div className="mb-4 flex h-20 w-20 items-center justify-center rounded-2xl bg-white shadow-sm dark:bg-slate-800">
              <FileText className="h-10 w-10 text-slate-300 dark:text-slate-600" />
            </div>
            <h3 className="mb-2 text-xl font-black text-slate-900 dark:text-white">
              No documents yet
            </h3>
            <p className="mb-6 max-w-sm text-center text-sm text-slate-500 dark:text-slate-400">
              Upload files to share with board members. They stay private to this workspace.
            </p>
            <Button
              onClick={() =>{  setUploadModalOpen(true); }}
              className="rounded-xl bg-slate-900 font-bold dark:bg-white dark:text-slate-900"
            >
              <Upload className="mr-2 h-4 w-4" />
              Upload File
            </Button>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow className="border-slate-100 dark:border-slate-800">
                <TableHead className="text-[10px] font-black tracking-widest text-slate-400 uppercase">
                  File
                </TableHead>
                <TableHead className="text-[10px] font-black tracking-widest text-slate-400 uppercase">
                  Type
                </TableHead>
                <TableHead className="text-[10px] font-black tracking-widest text-slate-400 uppercase">
                  Size
                </TableHead>
                <TableHead className="text-[10px] font-black tracking-widest text-slate-400 uppercase">
                  Uploaded
                </TableHead>
                <TableHead className="w-[80px]" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredDocs.map((doc) => (
                <TableRow key={doc._id} className="border-slate-100 dark:border-slate-800">
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div
                        className={cn(
                          "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl",
                          "bg-slate-100 dark:bg-slate-800"
                        )}
                      >
                        {getFileIcon(doc.type)}
                      </div>
                      <div className="min-w-0">
                        {doc.url ? (
                          <a
                            href={doc.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="truncate font-semibold text-slate-900 hover:text-blue-600 hover:underline dark:text-white dark:hover:text-blue-400"
                          >
                            {doc.name}
                          </a>
                        ) : (
                          <span className="truncate font-semibold text-slate-900 dark:text-white">
                            {doc.name}
                          </span>
                        )}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="text-sm text-slate-600 dark:text-slate-400">
                    {doc.type || "—"}
                  </TableCell>
                  <TableCell className="text-sm text-slate-600 dark:text-slate-400">
                    {doc.size || "—"}
                  </TableCell>
                  <TableCell className="text-sm text-slate-500 dark:text-slate-400">
                    {doc.createdAt
                      ? new Date(doc.createdAt).toLocaleDateString(undefined, {
                          month: "short",
                          day: "numeric",
                          year: "numeric"
                        })
                      : "—"}
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-9 w-9 rounded-lg">
                          <span className="sr-only">Actions</span>
                          <span className="text-lg font-bold text-slate-400">⋯</span>
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="rounded-xl">
                        {doc.url && (
                          <DropdownMenuItem asChild>
                            <a
                              href={doc.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex cursor-pointer items-center gap-2"
                            >
                              <ExternalLink className="h-4 w-4" />
                              Open
                            </a>
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuItem
                          className="text-red-600 focus:text-red-600"
                          onClick={ async () => handleDelete(doc._id)}
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          Remove
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>
    </div>
  )
}
