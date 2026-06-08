"use client"

import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { useState, useTransition } from "react"
import Link from "next/link"
import { signUp } from "@/lib/actions/auth"
import { Button } from "@/components/ui/button"

const registerSchema = z.object({
  email: z.string().email("Podaj prawidłowy adres email."),
  password: z.string().min(8, "Hasło musi mieć co najmniej 8 znaków."),
  nick: z
    .string()
    .min(2, "Nick musi mieć co najmniej 2 znaki.")
    .max(24, "Nick może mieć maksymalnie 24 znaki."),
})

type RegisterFormValues = z.infer<typeof registerSchema>

export default function RegisterForm() {
  const [serverError, setServerError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
  })

  function onSubmit(values: RegisterFormValues) {
    setServerError(null)
    startTransition(async () => {
      const result = await signUp(values)
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
          <p className="text-muted-foreground mt-1">Utwórz konto</p>
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
              autoComplete="new-password"
              {...register("password")}
              className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none focus:border-ring focus:ring-2 focus:ring-ring/30 disabled:opacity-50"
              disabled={isPending}
            />
            {errors.password && (
              <p className="text-sm text-destructive">{errors.password.message}</p>
            )}
          </div>

          <div className="space-y-1">
            <label htmlFor="nick" className="text-sm font-medium">
              Nick (2–24 znaki)
            </label>
            <input
              id="nick"
              type="text"
              autoComplete="username"
              {...register("nick")}
              className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none focus:border-ring focus:ring-2 focus:ring-ring/30 disabled:opacity-50"
              disabled={isPending}
            />
            {errors.nick && (
              <p className="text-sm text-destructive">{errors.nick.message}</p>
            )}
          </div>

          {serverError && (
            <p className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {serverError}
            </p>
          )}

          <Button type="submit" className="w-full" size="lg" disabled={isPending}>
            {isPending ? "Rejestrowanie…" : "Zarejestruj się"}
          </Button>
        </form>

        <p className="text-center text-sm text-muted-foreground">
          Masz już konto?{" "}
          <Link href="/login" className="text-primary underline-offset-4 hover:underline">
            Zaloguj się
          </Link>
        </p>
      </div>
    </div>
  )
}
