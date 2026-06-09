"use client"

import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { useState, useTransition } from "react"
import Link from "next/link"
import { requestPasswordReset } from "@/lib/actions/auth"
import { Button } from "@/components/ui/button"

const schema = z.object({
  email: z.string().email("Podaj prawidłowy adres email."),
})

type FormValues = z.infer<typeof schema>

export default function ForgotPasswordForm() {
  const [serverError, setServerError] = useState<string | null>(null)
  const [sent, setSent] = useState(false)
  const [isPending, startTransition] = useTransition()

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
  })

  function onSubmit(values: FormValues) {
    setServerError(null)
    startTransition(async () => {
      const result = await requestPasswordReset(values.email)
      if (result.success) {
        setSent(true)
        return
      }
      setServerError(result.error)
    })
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-sm space-y-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold">⚽ Mundial Typer 2026</h1>
          <p className="text-muted-foreground mt-1">Przypomnienie hasła</p>
        </div>

        {sent ? (
          <div className="space-y-4">
            <p className="rounded-lg bg-green-500/10 px-3 py-3 text-sm text-green-700 dark:text-green-400 text-center">
              Jeśli konto istnieje, wysłaliśmy link do resetowania hasła na podany adres email.
            </p>
            <p className="text-center text-sm text-muted-foreground">
              <Link href="/login" className="text-primary underline-offset-4 hover:underline">
                Wróć do logowania
              </Link>
            </p>
          </div>
        ) : (
          <>
            <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
              <div className="space-y-1">
                <label htmlFor="email" className="text-sm font-medium">
                  Email
                </label>
                <input
                  id="email"
                  type="email"
                  autoComplete="email"
                  {...register("email")}
                  className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none focus:border-ring focus:ring-2 focus:ring-ring/30 disabled:opacity-50"
                  disabled={isPending}
                />
                {errors.email && (
                  <p className="text-sm text-destructive">{errors.email.message}</p>
                )}
              </div>

              {serverError && (
                <p className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">
                  {serverError}
                </p>
              )}

              <Button type="submit" className="w-full" size="lg" disabled={isPending}>
                {isPending ? "Wysyłanie…" : "Wyślij link resetujący"}
              </Button>
            </form>

            <p className="text-center text-sm text-muted-foreground">
              <Link href="/login" className="text-primary underline-offset-4 hover:underline">
                Wróć do logowania
              </Link>
            </p>
          </>
        )}
      </div>
    </div>
  )
}
