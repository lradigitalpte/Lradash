"use client"

import { ColumnDef } from "@tanstack/react-table"
import {
  ArrowUpDown,
  Calendar,
  CheckCircle,
  Clock,
  FileText,
  Filter,
  ListTodo,
  Plus,
  Zap
} from "lucide-react"
import { useMemo, useState } from "react"

import { DataTable } from "@/components/common/DataTable"
import { StatusBadge, UserAvatar } from "@/components/common"
import { TaskDetailModal } from "@/components/tasks/TaskDetailModal"
import { Button } from "@/components/ui/button"
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useTaskStore } from "@/lib/store"
import { cn, formatDate, isOverdue } from "@/lib/utils"
import { Task } from "@/types/dbInterface"

export default function TasksPage() {
  const projects = useTaskStore((state) => state.projects)
  const [priorityFilter, setPriorityFilter] = useState<string | null>(null)
  const [statusFilter, setStatusFilter] = useState<string | null>(null)
  const [assigneeFilter, setAssigneeFilter] = useState<string | null>(null)
  const [selectedTask, setSelectedTask] = useState<(Task & { projectTitle: string; projectId: string }) | null>(null)
  const [modalOpen, setModalOpen] = useState(false)

  // Get all tasks from all projects
  const allTasks = useMemo(() => {
    return projects.flatMap((p) =>
      (p.tasks || []).map((task) => ({
        ...task,
        projectTitle: p.title,
        projectId: p._id
      }))
    )
  }, [projects])

  // Filter tasks
  const filteredTasks = useMemo(() => {
    return allTasks.filter((task) => {
      if (statusFilter && task.status !== statusFilter) return false
      if (priorityFilter && task.priority !== priorityFilter) return false
      if (assigneeFilter && task.assignee?.name !== assigneeFilter) return false
      return true
    })
  }, [allTasks, statusFilter, priorityFilter, assigneeFilter])

  // Task stats
  const stats = useMemo(() => {
    return {
      total: allTasks.length,
      todo: allTasks.filter((t) => t.status === "TODO").length,
      inProgress: allTasks.filter((t) => t.status === "IN_PROGRESS").length,
      done: allTasks.filter((t) => t.status === "DONE").length,
      overdue: allTasks.filter((t) => t.dueDate && isOverdue(t.dueDate) && t.status !== "DONE").length,
      dueToday: allTasks.filter((t) => {
        if (!t.dueDate) return false
        const due = new Date(t.dueDate)
        const today = new Date()
        return due.toDateString() === today.toDateString()
      }).length
    }
  }, [allTasks])

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Tasks</h1>
          <p className="text-muted-foreground">{filteredTasks.length} of {allTasks.length} tasks</p>
        </div>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          New Task
        </Button>
      </div>

      {/* Quick Stats */}
      <div className="grid gap-3 md:grid-cols-3 lg:grid-cols-6">
        <StatItem icon={ListTodo} label="Total" value={stats.total} />
        <StatItem icon={Clock} label="To Do" value={stats.todo} />
        <StatItem icon={Zap} label="In Progress" value={stats.inProgress} />
        <StatItem icon={CheckCircle} label="Done" value={stats.done} />
        {stats.overdue > 0 && <StatItem icon={Calendar} label="Overdue" value={stats.overdue} color="text-red-500" />}
        {stats.dueToday > 0 && <StatItem icon={Calendar} label="Due Today" value={stats.dueToday} color="text-orange-500" />}
      </div>

      {/* Tabs & Filters */}
      <div className="space-y-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <Tabs defaultValue="all" className="w-auto">
            <TabsList>
              <TabsTrigger value="all" onClick={() => { setStatusFilter(null); setPriorityFilter(null); setAssigneeFilter(null) }}>
                All
              </TabsTrigger>
              <TabsTrigger value="todo" onClick={() => setStatusFilter("TODO")}>
                To Do
              </TabsTrigger>
              <TabsTrigger value="in-progress" onClick={() => setStatusFilter("IN_PROGRESS")}>
                In Progress
              </TabsTrigger>
              <TabsTrigger value="done" onClick={() => setStatusFilter("DONE")}>
                Done
              </TabsTrigger>
            </TabsList>
          </Tabs>

          {/* Advanced Filters */}
          <div className="flex gap-2">
            {/* Priority Filter */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm">
                  <Filter className="mr-2 h-4 w-4" />
                  Priority
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>Filter by Priority</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => setPriorityFilter(null)}>All Priorities</DropdownMenuItem>
                <DropdownMenuItem onClick={() => setPriorityFilter("urgent")}>Urgent</DropdownMenuItem>
                <DropdownMenuItem onClick={() => setPriorityFilter("high")}>High</DropdownMenuItem>
                <DropdownMenuItem onClick={() => setPriorityFilter("medium")}>Medium</DropdownMenuItem>
                <DropdownMenuItem onClick={() => setPriorityFilter("low")}>Low</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Assignee Filter */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm">
                  <Filter className="mr-2 h-4 w-4" />
                  Assignee
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>Filter by Assignee</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => setAssigneeFilter(null)}>All Members</DropdownMenuItem>
                {Array.from(new Set(allTasks.map((t) => t.assignee?.name).filter(Boolean))).map((name) => (
                  <DropdownMenuItem key={name} onClick={() => setAssigneeFilter(name as string)}>
                    {name}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* Table */}
        <TaskTable
          tasks={filteredTasks}
          onTaskClick={(task) => {
            setSelectedTask(task)
            setModalOpen(true)
          }}
        />
      </div>

      {/* Task Detail Modal */}
      <TaskDetailModal
        task={selectedTask || undefined}
        open={modalOpen}
        onOpenChange={setModalOpen}
        onSave={(task) => {
          console.log("Task saved:", task)
          setModalOpen(false)
        }}
      />
    </div>
  )
}

// Task Table Component
interface TaskTableProps {
  tasks: (Task & { projectTitle: string; projectId: string })[]
  onTaskClick?: (task: Task & { projectTitle: string; projectId: string }) => void
}

function TaskTable({ tasks, onTaskClick }: TaskTableProps) {
  const columns: ColumnDef<Task & { projectTitle: string; projectId: string }>[] = [
    {
      accessorKey: "title",
      header: ({ column }) => (
        <button
          className="flex items-center gap-2 hover:text-foreground"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Task
          <ArrowUpDown className="h-4 w-4" />
        </button>
      ),
      cell: ({ row }) => (
        <div className="flex flex-col">
          <span className="font-medium">{row.original.title}</span>
          <span className="text-xs text-muted-foreground">{row.original.projectTitle}</span>
        </div>
      )
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => <StatusBadge type="status" value={row.original.status} size="sm" />
    },
    {
      accessorKey: "priority",
      header: "Priority",
      cell: ({ row }) => (
        <StatusBadge type="priority" value={row.original.priority || "medium"} size="sm" />
      )
    },
    {
      accessorKey: "assignee",
      header: "Assignee",
      cell: ({ row }) =>
        row.original.assignee ? <UserAvatar name={row.original.assignee.name} size="sm" /> : <span className="text-muted-foreground text-sm">Unassigned</span>
    },
    {
      accessorKey: "dueDate",
      header: ({ column }) => (
        <button
          className="flex items-center gap-2 hover:text-foreground"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Due Date
          <ArrowUpDown className="h-4 w-4" />
        </button>
      ),
      cell: ({ row }) => {
        if (!row.original.dueDate) return <span className="text-muted-foreground text-sm">-</span>
        const overdue = isOverdue(row.original.dueDate)
        return (
          <div className={cn("flex items-center gap-2 text-sm", overdue && row.original.status !== "DONE" ? "text-red-600 font-semibold" : "text-muted-foreground")}>
            <Calendar className="h-4 w-4" />
            {formatDate(row.original.dueDate)}
          </div>
        )
      }
    },
    {
      accessorKey: "description",
      header: "Description",
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          {row.original.description ? (
            <>
              <FileText className="h-4 w-4 text-muted-foreground" />
              <span className="truncate text-sm text-muted-foreground max-w-xs">{row.original.description}</span>
            </>
          ) : (
            <span className="text-muted-foreground text-sm">-</span>
          )}
        </div>
      )
    },
    {
      accessorKey: "createdAt",
      header: ({ column }) => (
        <button
          className="flex items-center gap-2 hover:text-foreground"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Created
          <ArrowUpDown className="h-4 w-4" />
        </button>
      ),
      cell: ({ row }) => <span className="text-sm text-muted-foreground">{formatDate(row.original.createdAt)}</span>
    }
  ]

  return (
    <Card>
      <CardHeader>
        <CardTitle>All Tasks</CardTitle>
        <CardDescription>Manage and track all your tasks in one place</CardDescription>
      </CardHeader>
      <div className="p-6">
        <DataTable
          columns={columns}
          data={tasks}
          searchPlaceholder="Search tasks by title..."
          pageSize={15}
          enableColumnVisibility={true}
          onRowClick={(task) => onTaskClick?.(task)}
        />
      </div>
    </Card>
  )
}

// Stat Item Component
interface StatItemProps {
  icon: React.ElementType
  label: string
  value: number
  color?: string
}

function StatItem({ icon: Icon, label, value, color = "text-primary" }: StatItemProps) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">{label}</CardTitle>
      </CardHeader>
      <div className="px-6 pb-4 flex items-center justify-between">
        <span className="text-2xl font-bold">{value}</span>
        <Icon className={cn("h-5 w-5 opacity-50", color)} />
      </div>
    </Card>
  )
}
