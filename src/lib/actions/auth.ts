"use server"

import { redirect } from "next/navigation"
import { createClient, createServiceClient } from "@/lib/supabase/server"

interface SignUpValues {
  email: string
  password: string
  nick: string
  inviteCode: string
}

export async function signUp(
  values: SignUpValues,
): Promise<{ success: false; error: string } | { success: true }> {
  // invite_codes have no anon access (RLS) — must use service_role
  const serviceClient = await createServiceClient()

  // 1. Verify invite code exists and is unused
  const { data: invite } = await serviceClient
    .from("invite_codes")
    .select("code, used_by")
    .eq("code", values.inviteCode)
    .maybeSingle()

  if (!invite) {
    return { success: false, error: "Nieprawidłowy kod zaproszenia." }
  }
  if (invite.used_by !== null) {
    return { success: false, error: "Ten kod zaproszenia został już wykorzystany." }
  }

  // 2. Pre-check nick uniqueness before creating auth user
  const { data: existingNick } = await serviceClient
    .from("profiles")
    .select("nick")
    .eq("nick", values.nick)
    .maybeSingle()

  if (existingNick) {
    return { success: false, error: "Ten nick jest już zajęty." }
  }

  // 3. Create auth user (anon SSR client handles cookie-based session)
  const authClient = await createClient()
  const { data: authData, error: signUpError } = await authClient.auth.signUp({
    email: values.email,
    password: values.password,
    options: {
      data: { nick: values.nick },
    },
  })

  if (signUpError || !authData.user) {
    return { success: false, error: signUpError?.message ?? "Błąd rejestracji." }
  }

  // 4. Insert profile (service_role bypasses RLS to guarantee write)
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

  // 5. Mark invite code as used
  await serviceClient
    .from("invite_codes")
    .update({ used_by: authData.user.id, used_at: new Date().toISOString() })
    .eq("code", values.inviteCode)

  redirect("/")
}

export async function signIn(
  email: string,
  password: string,
): Promise<{ success: false; error: string } | void> {
  const supabase = await createClient()

  const { error } = await supabase.auth.signInWithPassword({ email, password })

  if (error) {
    return { success: false, error: "Nieprawidłowy email lub hasło." }
  }

  redirect("/")
}

export async function signOut(): Promise<void> {
  const supabase = await createClient()
  await supabase.auth.signOut()
  redirect("/login")
}
