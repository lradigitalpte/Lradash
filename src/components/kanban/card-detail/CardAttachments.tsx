"use client"

import { Paperclip, Download, Trash2 } from "lucide-react"

import { Button } from "@/components/ui/button"

interface Attachment {
  name: string
  url: string
}

interface CardAttachmentsProps {
  attachments: Attachment[]
}

export function CardAttachments({ attachments }: CardAttachmentsProps) {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-slate-100 dark:bg-slate-800">
          <Paperclip className="h-4 w-4 stroke-[2.5] text-slate-500 dark:text-slate-400" />
        </div>
        <h3 className="text-[10px] font-black tracking-[0.2em] text-slate-400 uppercase">
          Attachments
        </h3>
      </div>

      <div className="grid grid-cols-1 gap-3">
        {attachments.map((attachment, index) => (
          <div
            key={index}
            className="group flex items-center gap-4 rounded-[1.5rem] border border-slate-100 bg-white/40 p-4 transition-all hover:-translate-y-1 hover:bg-white hover:shadow-xl hover:shadow-slate-200/50 dark:border-slate-800/50 dark:bg-slate-800/20 dark:hover:bg-slate-800 dark:hover:shadow-none"
          >
            <div className="relative flex h-16 w-20 flex-shrink-0 items-center justify-center overflow-hidden rounded-xl border border-slate-200/50 bg-slate-100 dark:border-slate-700/50 dark:bg-slate-900">
              <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-indigo-500/5" />
              <Paperclip className="h-6 w-6 stroke-[1.5] text-slate-400 dark:text-slate-600" />
            </div>

            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-bold text-slate-700 transition-colors group-hover:text-blue-600 dark:text-slate-200">
                {attachment.name}
              </p>
              <p className="mt-1 text-[10px] font-black tracking-widest text-slate-400 uppercase">
                Added 2 days ago
              </p>
            </div>

            <div className="flex translate-x-2 transform gap-2 opacity-0 transition-all duration-300 group-hover:translate-x-0 group-hover:opacity-100">
              <Button
                variant="ghost"
                size="icon"
                className="h-9 w-9 rounded-xl hover:bg-blue-50 hover:text-blue-600 dark:hover:bg-blue-900/20 dark:hover:text-blue-400"
              >
                <Download className="h-4 w-4 stroke-[2.5]" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-9 w-9 rounded-xl hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-900/20 dark:hover:text-rose-400"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
