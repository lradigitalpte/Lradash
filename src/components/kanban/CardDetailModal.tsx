"use client"

import { X } from "lucide-react"
import { useState } from "react"

import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent } from "@/components/ui/dialog"

import { CardActivity } from "./card-detail/CardActivity"
import { CardAttachments } from "./card-detail/CardAttachments"
import { CardChecklist } from "./card-detail/CardChecklist"
import { CardCover } from "./card-detail/CardCover"
import { CardDescription } from "./card-detail/CardDescription"
import { CardHeader } from "./card-detail/CardHeader"
import { CardLabels } from "./card-detail/CardLabels"
import { CardSidebar } from "./card-detail/CardSidebar"

interface Card {
  _id: string
  title: string
  description?: string
  listId: string
  position: number
  labels?: Array<{ name: string; color: string }>
  members?: Array<{ _id: string; name: string; avatar?: string }>
  dueDate?: string
  priority?: "LOW" | "MEDIUM" | "HIGH" | "URGENT"
  checklist?: Array<{ text: string; completed: boolean }>
  attachments?: Array<{ name: string; url: string }>
  coverColor?: string
}

interface CardDetailModalProps {
  card: Card
  onClose: () => void
  onUpdate: () => void
}

export function CardDetailModal({ card, onClose, onUpdate }: CardDetailModalProps) {
  const [title, setTitle] = useState(card.title)
  const [description, setDescription] = useState(card.description || "")
  const [labels, setLabels] = useState(card.labels || [])
  const [checklist, setChecklist] = useState(card.checklist || [])
  const [attachments, setAttachments] = useState(card.attachments || [])
  const [coverColor, setCoverColor] = useState(card.coverColor)

  const handleUpdateTitle = (newTitle: string) => {
    setTitle(newTitle)
    // TODO: API call to update
  }

  const handleUpdateDescription = (newDescription: string) => {
    setDescription(newDescription)
    // TODO: API call to update
  }

  const handleToggleChecklistItem = (index: number) => {
    const newChecklist = [...checklist]
    newChecklist[index].completed = !newChecklist[index].completed
    setChecklist(newChecklist)
    // TODO: API call to update
  }

  const handleAddChecklistItem = (text: string) => {
    setChecklist([...checklist, { text, completed: false }])
    // TODO: API call to update
  }

  const handleDeleteChecklistItem = (index: number) => {
    setChecklist(checklist.filter((_, i) => i !== index))
    // TODO: API call to update
  }

  const handleAddLabel = (label: { name: string; color: string }) => {
    setLabels([...labels, label])
    // TODO: API call to update
  }

  const handleRemoveLabel = (index: number) => {
    setLabels(labels.filter((_, i) => i !== index))
    // TODO: API call to update
  }

  const handleChangeCover = (color: string) => {
    setCoverColor(color)
    // TODO: API call to update
  }

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent
        className="flex !h-[90vh] max-h-[90vh] !w-[95vw] !max-w-[95vw] flex-col overflow-hidden rounded-[2.5rem] border-white/20 bg-white/80 p-0 pt-0 shadow-2xl shadow-slate-200/50 backdrop-blur-2xl sm:max-w-[95vw] lg:!max-w-[1000px] dark:border-slate-800/50 dark:bg-slate-900/80 dark:shadow-none"
        aria-describedby={undefined}
      >
        <div className="relative flex h-full flex-col overflow-hidden">
          {/* Extra Glow for Premium Feel */}
          <div className="pointer-events-none absolute -top-20 -right-20 h-64 w-64 rounded-full bg-blue-500/10 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-20 -left-20 h-64 w-64 rounded-full bg-indigo-500/10 blur-3xl" />

          {/* Cover */}
          {coverColor && <CardCover color={coverColor} onChangeColor={handleChangeCover} />}

          {/* Header */}
          <div className="shrink-0 px-10 pt-10 pb-4">
            <CardHeader title={title} onUpdateTitle={handleUpdateTitle} onClose={onClose} />
          </div>

          {/* Content - Scrollable */}
          <div className="custom-scrollbar flex-1 overflow-y-auto px-10 pb-10">
            <div className="grid grid-cols-1 gap-12 lg:grid-cols-[1fr_280px]">
              {/* Left Column - Main Content */}
              <div className="space-y-10">
                {/* Labels & Members */}
                <div className="flex flex-wrap gap-10">
                  {labels.length > 0 && (
                    <CardLabels
                      labels={labels}
                      onAddLabel={handleAddLabel}
                      onRemoveLabel={handleRemoveLabel}
                    />
                  )}

                  {card.members && card.members.length > 0 && (
                    <div className="space-y-4">
                      <h3 className="text-[10px] font-black tracking-[0.2em] text-slate-400 uppercase">
                        Members
                      </h3>
                      <div className="flex flex-wrap gap-3">
                        {card.members.map((member) => (
                          <div
                            key={member._id}
                            className="group flex items-center gap-3 rounded-[1.25rem] border border-slate-100 bg-slate-50 px-3 py-1.5 transition-all hover:-translate-y-0.5 hover:bg-white hover:shadow-lg hover:shadow-slate-200/50 dark:border-slate-800/50 dark:bg-slate-800/50 dark:hover:bg-slate-800 dark:hover:shadow-none"
                          >
                            <Avatar className="h-6 w-6 border-2 border-white dark:border-slate-900">
                              <AvatarImage src={member.avatar} />
                              <AvatarFallback className="bg-blue-50 text-[10px] font-black text-blue-600 dark:bg-blue-900/30 dark:text-blue-400">
                                {member.name.slice(0, 2).toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                            <span className="text-sm font-bold text-slate-700 transition-colors group-hover:text-blue-600 dark:text-slate-300">
                              {member.name}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Description */}
                <div className="rounded-[2rem] border border-slate-100/50 bg-slate-50/50 p-8 dark:border-slate-800/30 dark:bg-slate-800/20">
                  <CardDescription
                    description={description}
                    onUpdateDescription={handleUpdateDescription}
                  />
                </div>

                {/* Checklist */}
                {checklist.length > 0 && (
                  <div className="rounded-[2rem] border border-white/20 bg-white/40 p-8 dark:border-slate-800/30 dark:bg-slate-900/40">
                    <CardChecklist
                      items={checklist}
                      onToggleItem={handleToggleChecklistItem}
                      onAddItem={handleAddChecklistItem}
                      onDeleteItem={handleDeleteChecklistItem}
                    />
                  </div>
                )}

                {/* Activity */}
                <div className="pt-4">
                  <CardActivity cardId={card._id} />
                </div>
              </div>

              {/* Right Column - Sidebar */}
              <div className="pt-2 lg:sticky lg:top-0 lg:self-start">
                <CardSidebar
                  card={card}
                  onAddLabel={handleAddLabel}
                  onAddChecklistItem={handleAddChecklistItem}
                  onChangeCover={handleChangeCover}
                />
              </div>
            </div>
          </div>
        </div>
      </DialogContent>

      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(148, 163, 184, 0.2);
          border-radius: 10px;
        }
        .dark .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(51, 65, 85, 0.4);
        }
      `}</style>
    </Dialog>
  )
}
