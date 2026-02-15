"use client"

import { FileText, Upload, Plus } from "lucide-react"

import { Button } from "@/components/ui/button"

export default function BoardDocumentsPage() {
  return (
    <div className="min-h-full space-y-8 bg-slate-50/50 p-8 dark:bg-slate-950/50">
      <div className="flex flex-col justify-between gap-6 md:flex-row md:items-end">
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-blue-600 text-white shadow-lg">
              <FileText className="h-5 w-5" />
            </div>
          </div>
          <h1 className="text-4xl font-black tracking-tighter text-slate-900 dark:text-white">
            Documents
          </h1>
          <p className="max-w-2xl text-sm font-medium text-slate-500 italic dark:text-slate-400">
            Share and manage project files and documentation
          </p>
        </div>
        <Button className="h-12 gap-2 rounded-2xl bg-blue-600 px-6 font-bold text-white">
          <Upload className="h-4 w-4" />
          Upload File
        </Button>
      </div>

      <div className="rounded-3xl border border-white/20 bg-white/40 p-24 text-center dark:bg-slate-900/40">
        <div className="mx-auto mb-10 flex h-24 w-24 items-center justify-center rounded-2xl bg-slate-50 dark:bg-slate-900">
          <FileText className="h-12 w-12 text-slate-300 dark:text-slate-600" />
        </div>
        <h3 className="mb-4 text-3xl font-black text-slate-900 dark:text-white">No Documents</h3>
        <p className="mx-auto mb-12 max-w-md text-slate-500 italic dark:text-slate-400">
          No documents have been uploaded yet. Upload files to share with your team.
        </p>
      </div>
    </div>
  )
}
