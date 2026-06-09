"use server"

import { redirect } from "next/navigation"
import { createClient, createServiceClient } from "@/lib/supabase/server"

interface SignUpValues {
  email: string
  password: string
  nick: string
}

export async function signUp(
  values: SignUpValues,
): Promise<{ success: false; error: string } | { success: true }> {
  // service_role bypasses RLS for nick pre-check and profile insert
  const serviceClient = await createServiceClient()

  // 1. Pre-check nick uniqueness before creating auth user
  const { data: existingNick } = await serviceClient
    .from("profiles")
    .select("nick")
    .eq("nick", values.nick)
    .maybeSingle()

  if (existingNick) {
    return { success: false, error: "Ten nick jest już zajęty." }
  }

  // 2. Create auth user (anon SSR client handles cookie-based session)
  const authClient = await createClient()
  const { data: authData, error: signUpError } = await authClient.auth.signUp({
    email: values.email,
    password: values.password,
    options: {
      data: { nick: values.nick },
      emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL ?? "https://mundial-2026-lemon.vercel.app"}/login`,
    },
  })

  if (signUpError || !authData.user) {
    return { success: false, error: signUpError?.message ?? "Błąd rejestracji." }
  }

  // 3. Insert profile (service_role bypasses RLS to guarantee write)
  const { error: profileError } = await serviceClient.from("profiles").insert({
    id: authData.user.id,
    nick: values.nick,
  })

  if (profileError) {
    return {
      success: false,
      error:
        profileError.code === "23505"
          ? "Ten nick jest już zajęty."
          : "Błąd tworzenia profilu.",
    }
  }

  return { success: true }
}

export async function signIn(
  email: string,
  password: string,
): Promise<{ success: false; error: string } | { success: true }> {
  const supabase = await createClient()

  const { error } = await supabase.auth.signInWithPassword({ email, password })

  if (error) {
    return { success: false, error: "Nieprawidłowy email lub hasło." }
  }

  return { success: true }
}

export async function signOut(): Promise<void> {
  const supabase = await createClient()
  await supabase.auth.signOut()
  redirect("/login")
}
