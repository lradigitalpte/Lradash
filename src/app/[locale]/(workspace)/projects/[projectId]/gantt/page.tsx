"use client"

import { useParams } from "next/navigation"
import Link from "next/link"
import { useState, useEffect } from "react"
import { Calendar, ChevronLeft, ChevronRight, ZoomIn, ZoomOut, Download, ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { apiClient } from "@/lib/api/client"

export default function GanttPage() {
  const params = useParams()
  const projectId = params?.projectId as string
  const locale = params?.locale as string
  const [project, setProject] = useState<any>(null)
  const [tasks, setTasks] = useState<any[]>([])
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
      setTasks(data.tasks || [])
    } catch (err) {
      console.error("Failed to fetch project:", err)
    } finally {
      setLoading(false)
    }
  }

  // Generate timeline (simplified 3-month view)
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]
  const currentMonth = new Date().getMonth()
  const timelineMonths = [
    months[currentMonth],
    months[(currentMonth + 1) % 12],
    months[(currentMonth + 2) % 12]
  ]

  return (
    <div className="p-8 space-y-6 max-w-full">
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
          <h1 className="text-3xl font-bold">Gantt Chart</h1>
          <p className="text-muted-foreground mt-1">
            Timeline view for {project?.title}
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="icon">
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="icon">
            <ChevronRight className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="icon">
            <ZoomOut className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="icon">
            <ZoomIn className="h-4 w-4" />
          </Button>
          <Button variant="outline">
            <Download className="mr-2 h-4 w-4" />
            Export
          </Button>
        </div>
      </div>

      {/* Gantt View */}
      <Card className="p-6">
        <div className="overflow-x-auto">
          <div className="min-w-[800px]">
            {/* Timeline Header */}
            <div className="flex border-b">
              <div className="w-64 p-4 font-medium border-r">Task</div>
              <div className="flex-1 flex">
                {timelineMonths.map((month, idx) => (
                  <div key={idx} className="flex-1 p-4 text-center font-medium border-r last:border-r-0">
                    {month} 2026
                  </div>
                ))}
              </div>
            </div>

            {/* Task Rows */}
            {tasks.length === 0 ? (
              <div className="text-center py-12">
                <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">No tasks to display in Gantt chart</p>
              </div>
            ) : (
              <div className="space-y-px">
                {tasks.map((task, idx) => {
                  // Calculate task position (simplified)
                  const startPos = 10 + (idx * 5) % 30
                  const duration = 20 + (idx * 10) % 40
                  
                  return (
                    <div key={task._id} className="flex border-b hover:bg-muted/50">
                      <div className="w-64 p-4 border-r">
                        <div className="font-medium text-sm truncate">{task.title}</div>
                        <Badge className="mt-1" variant={
                          task.priority === "HIGH" ? "destructive" :
                          task.priority === "MEDIUM" ? "default" : "secondary"
                        }>
                          {task.priority}
                        </Badge>
                      </div>
                      <div className="flex-1 p-4 relative">
                        <div className="flex h-8 items-center">
                          <div
                            className={`h-6 rounded ${
                              task.status === "DONE" ? "bg-green-500" :
                              task.status === "IN_PROGRESS" ? "bg-yellow-500" :
                              "bg-gray-400"
                            }`}
                            style={{
                              marginLeft: `${startPos}%`,
                              width: `${duration}%`
                            }}
                          />
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>
      </Card>

      {/* Legend */}
      <div className="flex items-center justify-center gap-6 text-sm">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded bg-gray-400" />
          <span>To Do</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded bg-yellow-500" />
          <span>In Progress</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded bg-green-500" />
          <span>Completed</span>
        </div>
      </div>
    </div>
  )
}
