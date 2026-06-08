"use server"

import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"

interface SignUpValues {
  email: string
  password: string
  nick: string
  inviteCode: string
}
// chuj
export async function signUp(values: SignUpValues): Promise<{ success: boolean; error: string } | { success: true }> {
  const supabase = await createClient()

  // Validate invite code
  const { data: invite, error: inviteError } = await supabase
    .from("invite_codes")
    .select("code, used_by")
    .eq("code", values.inviteCode)
    .single()

  if (inviteError || !invite) {
    return { success: false, error: "Nieprawidłowy kod zaproszenia." }
  }

  if (invite.used_by !== null) {
    return { success: false, error: "Ten kod zaproszenia został już wykorzystany." }
  }

  // Create auth user
  const { data: authData, error: signUpError } = await supabase.auth.signUp({
    email: values.email,
    password: values.password,
    options: {
      data: { nick: values.nick },
    },
  })

  if (signUpError || !authData.user) {
    return { success: false, error: signUpError?.message ?? "Błąd rejestracji." }
  }

  // Insert profile
  const { error: profileError } = await supabase.from("profiles").insert({
    id: authData.user.id,
    nick: values.nick,
  })

  if (profileError) {
    return { success: false, error: profileError.message }
  }

  // Mark invite code as used
  await supabase
    .from("invite_codes")
    .update({ used_by: authData.user.id, used_at: new Date().toISOString() })
    .eq("code", values.inviteCode)

  redirect("/")
}

export async function signIn(
  email: string,
  password: string,
): Promise<{ success: boolean; error: string } | void> {
  const supabase = await createClient()

  const { error } = await supabase.auth.signInWithPassword({ email, password })

  if (error) {
    return { success: false, error: error.message }
  }

  redirect("/")
}

export async function signOut(): Promise<void> {
  const supabase = await createClient()
  await supabase.auth.signOut()
  redirect("/login")
}
