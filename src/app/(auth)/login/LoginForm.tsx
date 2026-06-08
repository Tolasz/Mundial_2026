"use client"

import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { useState, useTransition } from "react"
import Link from "next/link"
import { signIn } from "@/lib/actions/auth"
import { Button } from "@/components/ui/button"

const loginSchema = z.object({
  email: z.string().email("Podaj prawidłowy adres email."),
  password: z.string().min(1, "Podaj hasło."),
})

type LoginFormValues = z.infer<typeof loginSchema>

export default function LoginForm() {
  const [serverError, setServerError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
  })

  function onSubmit(values: LoginFormValues) {
    setServerError(null)
    startTransition(async () => {
      const result = await signIn(values.email, values.password)
      if (result.success) {
        window.location.assign("/predictions")
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
          <p className="text-muted-foreground mt-1">Zaloguj się do swojego konta</p>
        </div>

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

          <div className="space-y-1">
            <label htmlFor="password" className="text-sm font-medium">
              Hasło
            </label>
            <input
              id="password"
              type="password"
              autoComplete="current-password"
              {...register("password")}
              className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none focus:border-ring focus:ring-2 focus:ring-ring/30 disabled:opacity-50"
              disabled={isPending}
            />
            {errors.password && (
              <p className="text-sm text-destructive">{errors.password.message}</p>
            )}
          </div>

          {serverError && (
            <p className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {serverError}
            </p>
          )}

          <Button type="submit" className="w-full" size="lg" disabled={isPending}>
            {isPending ? "Logowanie…" : "Zaloguj się"}
          </Button>
        </form>

        <p className="text-center text-sm text-muted-foreground">
          Nie masz konta?{" "}
          <Link href="/register" className="text-primary underline-offset-4 hover:underline">
            Zarejestruj się
          </Link>
        </p>
      </div>
    </div>
  )
}
