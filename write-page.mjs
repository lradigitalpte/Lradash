import { writeFileSync, mkdirSync } from 'fs'
import { dirname } from 'path'

const p = 'C:\\Users\\Admin\\Desktop\\ProJ\\Lradash\\src\\app\\[locale]\\(workspace)\\projects\\[projectId]\\marketing\\strategy\\page.tsx'

const content = `"use client"

import { TrendingUp, Target, MessageCircle, Share2, Heart, Plus, Activity } from "lucide-react"
import { useParams } from "next/navigation"
import { useState, useEffect } from "react"
import { toast } from "sonner"

import { LogResultsModal } from "@/components/marketing/LogResultsModal"
import { SetTargetsModal } from "@/components/marketing/SetTargetsModal"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { apiClient } from "@/lib/api/client"
import { cn } from "@/lib/utils"

interface EngagementLog {
  date: Date
  likes: number
  shares: number
  comments: number
  reach: number
}

interface MarketingStrategy {
  _id: string
  title: string
  platform: string
  status: string
  targets?: {
    reach: number
    likes: number
    shares: number
    comments: number
    deadline?: string
  }
  engagementLogs: EngagementLog[]
  createdAt: string
}

export default function MarketingStrategyPage() {
  const params = useParams()
  const projectId = params?.projectId as string
  const [strategies, setStrategies] = useState<MarketingStrategy[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedStrategy, setSelectedStrategy] = useState<MarketingStrategy | null>(null)
  const [showSetTargets, setShowSetTargets] = useState(false)
  const [showLogResults, setShowLogResults] = useState(false)

  useEffect(() => {
    fetchStrategies()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectId])

  const fetchStrategies = async () => {
    try {
      setLoading(true)
      const res = await apiClient.get(\`/api/marketing/strategies?projectId=\${projectId}\`)
      if (res.ok) {
        const data = await res.json()
        setStrategies(data)
        if (data.length > 0 && !selectedStrategy) setSelectedStrategy(data[0])
      }
    } catch {
      toast.error("Failed to load strategies")
    } finally {
      setLoading(false)
    }
  }

  const handleCreate = async () => {
    const title = prompt("Strategy name:", "Social Media Campaign")
    if (!title) return
    const platform = prompt("Platform:", "twitter")
    if (!platform) return
    try {
      const res = await apiClient.post("/api/marketing/strategies", { projectId, title, platform: platform.toLowerCase(), status: "planning" })
      if (res.ok) { await fetchStrategies(); toast.success("Strategy created") }
    } catch { toast.error("Failed") }
  }

  const pct = (a: number, t: number) => !t ? 0 : Math.min(100, Math.round(a / t * 100))
  const clr = (p: string) => ({ twitter: "bg-blue-500", facebook: "bg-blue-600", instagram: "bg-pink-500", linkedin: "bg-blue-700", tiktok: "bg-black" } as Record<string,string>)[p] ?? "bg-slate-500"

  if (loading) return <div className="flex min-h-96 items-center justify-center"><Activity className="h-6 w-6 animate-spin text-blue-600" /></div>

  const tL = selectedStrategy?.engagementLogs.reduce((s, l) => s + l.likes, 0) ?? 0
  const tS = selectedStrategy?.engagementLogs.reduce((s, l) => s + l.shares, 0) ?? 0
  const tC = selectedStrategy?.engagementLogs.reduce((s, l) => s + l.comments, 0) ?? 0
  const tR = selectedStrategy?.engagementLogs.reduce((s, l) => s + l.reach, 0) ?? 0

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-white p-6 dark:bg-slate-950">
      <div className="mb-4 flex shrink-0 items-center justify-between">
        <div>
          <h1 className="text-2xl font-black tracking-tight">Social Media Strategies</h1>
          <p className="text-sm text-slate-500">Track engagement targets and results</p>
        </div>
        <Button onClick={handleCreate} className="rounded-xl bg-blue-600 text-white hover:bg-blue-700">
          <Plus className="mr-2 h-4 w-4" />New Strategy
        </Button>
      </div>
      <div className="min-h-0 flex-1 overflow-hidden">
        {strategies.length === 0 ? (
          <div className="flex h-full items-center justify-center">
            <Card className="w-full max-w-sm rounded-2xl p-8 text-center">
              <Activity className="mx-auto mb-4 h-10 w-10 text-slate-300" />
              <h3 className="mb-2 font-black">No strategies yet</h3>
              <p className="mb-6 text-sm text-slate-500">Create your first strategy to start tracking</p>
              <Button onClick={handleCreate} className="w-full rounded-xl bg-blue-600 text-white hover:bg-blue-700"><Plus className="mr-2 h-4 w-4" />Create Strategy</Button>
            </Card>
          </div>
        ) : (
          <div className="grid h-full grid-cols-1 gap-4 overflow-hidden lg:grid-cols-3">
            <div className="space-y-2 overflow-y-auto pr-1">
              {strategies.map((s) => (
                <Card key={s._id} onClick={() => setSelectedStrategy(s)} className={cn("cursor-pointer rounded-xl p-3 transition-all hover:shadow-md", selectedStrategy?._id === s._id ? "border-blue-500 bg-blue-50 dark:bg-blue-950" : "border-slate-200 dark:border-slate-800")}>
                  <div className="flex items-center gap-2">
                    <div className={cn("h-2 w-2 shrink-0 rounded-full", clr(s.platform))} />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-black">{s.title}</p>
                      <p className="text-[9px] uppercase tracking-widest text-slate-400">{s.platform}</p>
                    </div>
                    <Badge className="shrink-0 text-[8px]">{s.status}</Badge>
                  </div>
                </Card>
              ))}
            </div>
            {selectedStrategy && (
              <div className="col-span-2 space-y-3 overflow-y-auto pr-1">
                <Card className="shrink-0 rounded-2xl border-blue-200 bg-gradient-to-br from-blue-50 to-slate-50 dark:from-blue-950 dark:to-slate-950">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="text-base">{selectedStrategy.title}</CardTitle>
                        <CardDescription className="text-[9px] capitalize">{selectedStrategy.platform} {selectedStrategy.status}</CardDescription>
                      </div>
                      <Button variant="outline" size="sm" onClick={() => setShowSetTargets(true)} className="h-auto rounded-lg px-2 py-1 text-xs">
                        <Target className="mr-1 h-3 w-3" />Set Targets
                      </Button>
                    </div>
                  </CardHeader>
                </Card>
                {selectedStrategy.targets && (
                  <Card className="shrink-0 rounded-2xl">
                    <CardHeader className="pb-2"><CardTitle className="text-sm">Targets vs Actual</CardTitle></CardHeader>
                    <CardContent className="grid grid-cols-2 gap-2 pt-0">
                      {[
                        { label: "Reach", target: selectedStrategy.targets.reach, actual: tR, color: "bg-blue-500" },
                        { label: "Likes", target: selectedStrategy.targets.likes, actual: tL, color: "bg-red-500" },
                        { label: "Shares", target: selectedStrategy.targets.shares, actual: tS, color: "bg-sky-400" },
                        { label: "Comments", target: selectedStrategy.targets.comments, actual: tC, color: "bg-green-500" }
                      ].map((item) => (
                        <div key={item.label} className="rounded-lg bg-slate-50 p-2 dark:bg-slate-800">
                          <div className="text-[8px] font-black uppercase tracking-widest text-slate-500">{item.label}</div>
                          <div className="mt-0.5 text-base font-black">{item.target.toLocaleString()}</div>
                          <div className="mt-1 h-1.5 rounded-full bg-slate-200"><div className={cn("h-full rounded-full transition-all", item.color)} style={{ width: \`\${pct(item.actual, item.target)}%\` }} /></div>
                          <div className="mt-0.5 text-[8px] text-slate-400">{item.actual} / {item.target} ({pct(item.actual, item.target)}%)</div>
                        </div>
                      ))}
                    </CardContent>
                  </Card>
                )}
                <Card className="shrink-0 rounded-2xl">
                  <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-sm">Engagement Logs</CardTitle>
                    <Button onClick={() => setShowLogResults(true)} size="sm" className="h-auto rounded-lg bg-emerald-600 px-2 py-1 text-xs hover:bg-emerald-700"><Plus className="mr-1 h-3 w-3" />Log</Button>
                  </CardHeader>
                  <CardContent className="pt-0">
                    {selectedStrategy.engagementLogs.length === 0 ? (
                      <p className="py-3 text-center text-xs text-slate-400">No logs yet</p>
                    ) : (
                      <div className="max-h-44 space-y-1 overflow-y-auto pr-1">
                        {selectedStrategy.engagementLogs.map((log, i) => (
                          <div key={i} className="flex items-center justify-between rounded-lg border border-slate-100 p-2 dark:border-slate-800">
                            <span className="text-[8px] font-black uppercase tracking-widest text-slate-400">{new Date(log.date).toLocaleDateString()}</span>
                            <div className="flex gap-3">
                              <span className="flex items-center gap-0.5 text-xs font-bold text-red-500"><Heart className="h-3 w-3" />{log.likes}</span>
                              <span className="flex items-center gap-0.5 text-xs font-bold text-blue-500"><Share2 className="h-3 w-3" />{log.shares}</span>
                              <span className="flex items-center gap-0.5 text-xs font-bold text-green-500"><MessageCircle className="h-3 w-3" />{log.comments}</span>
                              <span className="flex items-center gap-0.5 text-xs font-bold text-purple-500"><TrendingUp className="h-3 w-3" />{log.reach}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
                <Card className="shrink-0 rounded-2xl">
                  <CardHeader className="pb-2"><CardTitle className="text-sm">Total Engagement</CardTitle></CardHeader>
                  <CardContent className="grid grid-cols-4 gap-2 pt-0">
                    <div className="rounded-lg bg-red-50 p-2 text-center dark:bg-red-950"><Heart className="mx-auto mb-0.5 h-3 w-3 text-red-500" /><div className="text-[8px] uppercase tracking-widest text-slate-500">Likes</div><div className="text-sm font-black text-red-600">{tL}</div></div>
                    <div className="rounded-lg bg-blue-50 p-2 text-center dark:bg-blue-950"><Share2 className="mx-auto mb-0.5 h-3 w-3 text-blue-500" /><div className="text-[8px] uppercase tracking-widest text-slate-500">Shares</div><div className="text-sm font-black text-blue-600">{tS}</div></div>
                    <div className="rounded-lg bg-green-50 p-2 text-center dark:bg-green-950"><MessageCircle className="mx-auto mb-0.5 h-3 w-3 text-green-500" /><div className="text-[8px] uppercase tracking-widest text-slate-500">Comments</div><div className="text-sm font-black text-green-600">{tC}</div></div>
                    <div className="rounded-lg bg-purple-50 p-2 text-center dark:bg-purple-950"><TrendingUp className="mx-auto mb-0.5 h-3 w-3 text-purple-500" /><div className="text-[8px] uppercase tracking-widest text-slate-500">Reach</div><div className="text-sm font-black text-purple-600">{tR}</div></div>
                  </CardContent>
                </Card>
              </div>
            )}
          </div>
        )}
      </div>
      {selectedStrategy && (
        <>
          <SetTargetsModal open={showSetTargets} onOpenChange={setShowSetTargets} strategyId={selectedStrategy._id} currentTargets={selectedStrategy.targets} onTargetsUpdated={fetchStrategies} />
          <LogResultsModal open={showLogResults} onOpenChange={setShowLogResults} strategyId={selectedStrategy._id} onLogAdded={fetchStrategies} />
        </>
      )}
    </div>
  )
}
`

mkdirSync(dirname(p), { recursive: true })
writeFileSync(p, content, 'utf8')
console.log('Written! Lines:', content.split('\n').length)
