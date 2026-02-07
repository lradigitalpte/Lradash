"use client"

import { Button } from "@/components/ui/button"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import useAuthForm from "@/hooks/useAuthForm"

export default function UserAuthForm() {
  const { form, loading, onSubmit } = useAuthForm()

  return (
    <Form {...form}>
      <form
        onSubmit={(e) => {
          form
            .handleSubmit(onSubmit)(e)
            .catch((error: unknown) => {
              console.error(error)
            })
        }}
        className="w-full space-y-4"
        aria-label="Sign in form"
        data-testid="auth-form"
      >
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email</FormLabel>
              <FormControl>
                <Input
                  type="email"
                  placeholder="Enter your email..."
                  disabled={loading}
                  data-testid="email-input"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="password"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Password</FormLabel>
              <FormControl>
                <Input
                  type="password"
                  placeholder="Enter your password..."
                  disabled={loading}
                  data-testid="password-input"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button
          disabled={loading}
          className="ml-auto w-full"
          type="submit"
          data-testid="submit-button"
        >
          Sign In
        </Button>
      </form>
    </Form>
  )
}
