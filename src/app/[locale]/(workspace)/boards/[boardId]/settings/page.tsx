"use client"

import { Settings2, Lock } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

export default function BoardSettingsPage() {
  return (
    <div className="min-h-full space-y-10 bg-slate-50/50 p-8 dark:bg-slate-950/50">
      <div className="space-y-2">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-blue-600 text-white">
            <Settings2 className="h-5 w-5" />
          </div>
        </div>
        <h1 className="text-4xl font-black tracking-tighter text-slate-900 dark:text-white">
          Project Settings
        </h1>
      </div>

      <div className="max-w-2xl space-y-8">
        <div className="space-y-6 rounded-3xl border bg-white p-8 shadow-lg dark:border-slate-800 dark:bg-slate-900">
          <div className="space-y-4">
            <div>
              <Label className="text-sm font-bold">Project Name</Label>
              <Input className="mt-2 h-11 rounded-xl" placeholder="Enter project name" />
            </div>
            <div>
              <Label className="text-sm font-bold">Description</Label>
              <Input className="mt-2 h-11 rounded-xl" placeholder="Project description" />
            </div>
          </div>

          <div className="border-t pt-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Lock className="h-5 w-5 text-slate-400" />
                <div>
                  <p className="font-bold">Project Visibility</p>
                  <p className="text-xs text-slate-500">Control who can see this project</p>
                </div>
              </div>
            </div>
          </div>

          <Button className="h-12 rounded-2xl bg-blue-600 font-bold text-white">
            Save Changes
          </Button>
        </div>
      </div>
    </div>
  )
}
