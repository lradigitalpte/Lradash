"use client"

import { useTranslations } from "next-intl"
import { useState } from "react"
import { toast } from "sonner"
import { z } from "zod"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from "@/components/ui/dialog"
import { useBoards } from "@/hooks/useBoards"
import { useRouter } from "@/i18n/navigation"
import { useTaskStore } from "@/lib/store"
import { boardSchema } from "@/types/boardForm"

import { BoardForm } from "./BoardForm"

interface NewBoardDialogProps {
  children: React.ReactNode
}

type BoardFormData = z.infer<typeof boardSchema>

export default function NewBoardDialog({ children }: NewBoardDialogProps) {
  const [open, setOpen] = useState(false)
  const { addBoard } = useTaskStore()
  const { fetchBoards } = useBoards()
  const router = useRouter()
  const t = useTranslations("kanban.actions")

  const handleSubmit = async (data: BoardFormData) => {
    try {
      // Boards created here are personal boards (owned by user and private)
      const boardId = await addBoard(data.title, data.description)
      toast.success("Personal board created successfully")
      setOpen(false)
      await fetchBoards()
      router.push(`/boards/${boardId}/projects`)
    } catch (error) {
      console.error(error)
      toast.error(t("boardCreateFailed"))
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen} data-testid="new-board-dialog">
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="rounded-3xl border-none bg-white/95 p-8 shadow-2xl backdrop-blur-2xl dark:bg-slate-900/95">
        <DialogHeader>
          <DialogTitle
            className="text-3xl font-black tracking-tight uppercase"
            data-testid="new-board-dialog-title"
          >
            New Private Board
          </DialogTitle>
          <DialogDescription className="text-sm font-medium text-slate-500 italic">
            Create a restricted workspace for your personal project tracking.
          </DialogDescription>
        </DialogHeader>
        <BoardForm onSubmit={handleSubmit}>
          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="ghost"
              className="h-12 flex-1 rounded-xl text-[9px] font-black tracking-widest text-slate-400 uppercase hover:bg-slate-100 dark:hover:bg-slate-800"
              onClick={() => {
                setOpen(false)
              }}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="h-12 flex-[2] rounded-xl bg-slate-900 text-[9px] font-black tracking-widest text-white uppercase shadow-lg transition-all hover:scale-[1.02] active:scale-[0.98] dark:bg-white dark:text-slate-900"
            >
              Create Private Board
            </Button>
          </div>
        </BoardForm>
      </DialogContent>
    </Dialog>
  )
}
