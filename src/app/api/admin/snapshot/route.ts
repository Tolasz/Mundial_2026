// Route Handler: POST /api/admin/snapshot
// Ręczne zapisanie snapshotu tabeli liderów — tylko dla adminów.

import { NextResponse } from "next/server"
import { createClient, createServiceClient } from "@/lib/supabase/server"

export const runtime = "nodejs"
export const maxDuration = 30

export async function POST() {
  const supabaseUser = await createClient()

  const {
    data: { user },
  } = await supabaseUser.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { data: profile } = await supabaseUser
    .from("profiles")
    .select("is_admin")
    .eq("id", user.id)
    .single()

  if (!profile?.is_admin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  const supabase = await createServiceClient()
  const { error } = await supabase.rpc("take_leaderboard_snapshot", {})

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}
