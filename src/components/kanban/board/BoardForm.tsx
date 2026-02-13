"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { useTranslations } from "next-intl"
import { useForm } from "react-hook-form"
import { z } from "zod"

import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"

const BoardFormSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().optional()
})

type BoardFormValues = z.infer<typeof BoardFormSchema>

interface BoardFormProps {
  defaultValues?: Partial<BoardFormValues>
  onSubmit: (values: BoardFormValues) => Promise<void>
  children?: React.ReactNode
}

export function BoardForm({ defaultValues, onSubmit, children }: BoardFormProps) {
  const t = useTranslations("kanban.actions")
  const form = useForm<BoardFormValues>({
    resolver: zodResolver(BoardFormSchema),
    defaultValues: {
      title: "",
      description: "",
      ...defaultValues
    }
  })

  const handleFormSubmit = async (values: BoardFormValues) => {
    await onSubmit(values)
  }

  return (
    <Form {...form}>
      <form
        onSubmit={(event) => {
          /* eslint-disable-next-line no-void */ void form.handleSubmit(handleFormSubmit)(event)
        }}
        className="space-y-4"
      >
        <FormField
          control={form.control}
          name="title"
          render={({ field }) => (
            <FormItem className="space-y-1">
              <FormLabel className="text-[10px] font-black tracking-widest text-slate-400 uppercase">
                Board Headline
              </FormLabel>
              <FormControl>
                <Input
                  placeholder="e.g. My Personal Research"
                  className="h-12 rounded-xl border-none bg-slate-50 font-bold placeholder:text-slate-300 dark:bg-slate-800/50"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem className="space-y-1">
              <FormLabel className="text-[10px] font-black tracking-widest text-slate-400 uppercase">
                Context/Notes
              </FormLabel>
              <FormControl>
                <Textarea
                  placeholder="What is this board for?"
                  className="h-24 w-full resize-none rounded-xl border-none bg-slate-50 p-4 font-bold placeholder:text-slate-300 dark:bg-slate-800/50"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        {children}
      </form>
    </Form>
  )
}
