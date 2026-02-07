"use client"

import { useParams } from "next/navigation"
import Link from "next/link"
import { useState, useEffect } from "react"
import { FileText, Upload, Plus, Search, Download, MoreVertical, File, Folder, ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { apiClient } from "@/lib/api/client"

export default function DocumentsPage() {
  const params = useParams()
  const projectId = params?.projectId as string
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

  // Sample documents (in real app, this would come from API/store)
  const documents = [
    { id: "1", name: "Project Requirements.pdf", type: "PDF", size: "2.4 MB", date: "2026-02-01", folder: "Requirements" },
    { id: "2", name: "Design Mockups.fig", type: "Figma", size: "15.8 MB", date: "2026-02-03", folder: "Design" },
    { id: "3", name: "API Documentation.md", type: "Markdown", size: "124 KB", date: "2026-02-04", folder: "Documentation" },
    { id: "4", name: "Sprint Report.xlsx", type: "Excel", size: "856 KB", date: "2026-02-05", folder: "Reports" },
  ]

  const filteredDocs = documents.filter((doc) =>
    doc.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    doc.folder.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const getFileIcon = (type: string) => {
    return <File className="h-5 w-5 text-blue-500" />
  }

  return (
    <div className="p-8 space-y-6 max-w-7xl mx-auto">
      {/* Back Button */}
      <Link href={`/${locale}/projects/${projectId}`}>
        <Button variant="ghost" className="mb-4">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Project
        </Button>
      </Link>

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Documents</h1>
          <p className="text-muted-foreground mt-1">
            Files and documents for {project?.title}
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">
            <Upload className="mr-2 h-5 w-5" />
            Upload
          </Button>
          <Button>
            <Plus className="mr-2 h-5 w-5" />
            New Folder
          </Button>
        </div>
      </div>

      {/* Search and Stats */}
      <div className="grid gap-4 md:grid-cols-[1fr_auto]">
        <Card className="p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search documents..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </Card>
        <div className="grid gap-4 md:grid-cols-3">
          <Card className="p-4 text-center">
            <div className="text-2xl font-bold">{documents.length}</div>
            <div className="text-sm text-muted-foreground">Total Files</div>
          </Card>
          <Card className="p-4 text-center">
            <div className="text-2xl font-bold">4</div>
            <div className="text-sm text-muted-foreground">Folders</div>
          </Card>
          <Card className="p-4 text-center">
            <div className="text-2xl font-bold">19 MB</div>
            <div className="text-sm text-muted-foreground">Storage</div>
          </Card>
        </div>
      </div>

      {/* Folders */}
      <div>
        <h2 className="text-lg font-semibold mb-3">Folders</h2>
        <div className="grid gap-4 md:grid-cols-4">
          {["Requirements", "Design", "Documentation", "Reports"].map((folder) => (
            <Card key={folder} className="p-4 cursor-pointer hover:border-primary transition-colors">
              <div className="flex items-center gap-3">
                <Folder className="h-8 w-8 text-yellow-500" />
                <div>
                  <div className="font-medium">{folder}</div>
                  <div className="text-sm text-muted-foreground">
                    {documents.filter(d => d.folder === folder).length} files
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>

      {/* Documents Table */}
      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-12"></TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Folder</TableHead>
              <TableHead>Size</TableHead>
              <TableHead>Modified</TableHead>
              <TableHead className="w-12"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredDocs.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-12">
                  <div className="flex flex-col items-center gap-2">
                    <FileText className="h-12 w-12 text-muted-foreground" />
                    <p className="text-muted-foreground">No documents found</p>
                    <Button className="mt-2">
                      <Upload className="mr-2 h-4 w-4" />
                      Upload First Document
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              filteredDocs.map((doc) => (
                <TableRow key={doc.id} className="cursor-pointer hover:bg-muted/50">
                  <TableCell>
                    {getFileIcon(doc.type)}
                  </TableCell>
                  <TableCell className="font-medium">{doc.name}</TableCell>
                  <TableCell>
                    <Badge variant="outline">{doc.type}</Badge>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">{doc.folder}</TableCell>
                  <TableCell className="text-sm">{doc.size}</TableCell>
                  <TableCell className="text-sm">
                    {new Date(doc.date).toLocaleDateString()}
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem>
                          <Download className="mr-2 h-4 w-4" />
                          Download
                        </DropdownMenuItem>
                        <DropdownMenuItem>Rename</DropdownMenuItem>
                        <DropdownMenuItem>Move</DropdownMenuItem>
                        <DropdownMenuItem className="text-destructive">
                          Delete
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
  )
}
