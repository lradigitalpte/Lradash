import { Package, CheckSquare, ChevronRight, Info, Sparkles } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"

export function WorkPackageHierarchyInfo() {
  return (
    <Card className="overflow-hidden rounded-[2rem] border border-none border-white/20 bg-gradient-to-br from-blue-50/50 to-white shadow-2xl shadow-blue-500/5 dark:from-slate-900 dark:to-slate-950">
      <CardContent className="p-8">
        <div className="flex flex-col items-center gap-8 md:flex-row">
          <div className="flex shrink-0 flex-col items-center">
            <div className="relative mb-3 flex h-20 w-20 items-center justify-center rounded-[2rem] bg-slate-900 text-white shadow-2xl dark:bg-white dark:text-slate-900">
              <Package className="h-10 w-10" />
              <div className="absolute -top-2 -right-2 flex h-8 w-8 items-center justify-center rounded-full border-4 border-white bg-blue-600 text-white dark:border-slate-950">
                <Sparkles className="h-3 w-3" />
              </div>
            </div>
            <span className="text-[10px] font-black tracking-widest text-slate-400 uppercase">
              Work Package
            </span>
          </div>

          <div className="flex-1 space-y-6">
            <div className="space-y-2 text-center md:text-left">
              <h3 className="text-xl font-black tracking-tight text-slate-900 dark:text-white">
                What are Work Packages?
              </h3>
              <p className="text-sm leading-relaxed font-medium text-slate-500 italic">
                Work packages represent high-level objectives or epics. They contain multiple
                operational tasks that contribute to a singular massive milestone.
              </p>
            </div>

            <div className="flex flex-col items-center gap-4 rounded-2xl border border-white bg-white/50 p-6 shadow-inner md:flex-row dark:border-slate-700 dark:bg-slate-800/50">
              <div className="flex items-center gap-3">
                <Badge className="h-8 rounded-xl bg-slate-900 px-4 font-black text-white hover:bg-slate-900">
                  Epic Unit
                </Badge>
                <ChevronRight className="h-4 w-4 text-slate-300" />
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <Badge
                  variant="outline"
                  className="h-8 gap-2 rounded-xl border-dashed border-blue-200 bg-blue-50/30 px-3 font-bold text-blue-600"
                >
                  <CheckSquare className="h-3.5 w-3.5" />
                  Sub-Task A
                </Badge>
                <Badge
                  variant="outline"
                  className="h-8 gap-2 rounded-xl border-dashed border-blue-200 bg-blue-50/30 px-3 font-bold text-blue-600"
                >
                  <CheckSquare className="h-3.5 w-3.5" />
                  Sub-Task B
                </Badge>
                <Badge
                  variant="outline"
                  className="h-8 gap-2 rounded-xl border-dashed border-blue-200 bg-blue-50/30 px-3 font-bold text-blue-600"
                >
                  <CheckSquare className="h-3.5 w-3.5" />
                  Sub-Task C
                </Badge>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
