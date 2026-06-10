// Lokalny backup bazy Supabase: dane wszystkich tabel + auth.users.
// Uruchom: pnpm backup   (ładuje .env.local)
//
// Tworzy katalog backups/<timestamp>/ z plikami JSON:
//   auth_users.json  — konta użytkowników (id, email, metadane)
//   profiles.json    — profile graczy
//   predictions.json — typy
//   settings.json    — ustawienia turnieju
//   teams.json       — drużyny
//   matches.json     — mecze
//   manifest.json    — podsumowanie (timestamp, liczba rekordów)
//
// Nie wymaga Dockera ani pg_dump — używa @supabase/supabase-js.

import { createClient } from "@supabase/supabase-js"
import { mkdirSync, writeFileSync, statSync } from "node:fs"
import { join, resolve } from "node:path"
import type { Database } from "../src/types/db"

function requireEnv(name: string): string {
  const value = process.env[name]
  if (!value) throw new Error(`Brak zmiennej środowiskowej: ${name}`)
  return value
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

function writeJson(path: string, data: unknown): string {
  writeFileSync(path, JSON.stringify(data, null, 2), "utf-8")
  return formatBytes(statSync(path).size)
}

async function fetchAll<T>(
  label: string,
  fetcher: () => Promise<{ data: T[] | null; error: unknown }>,
): Promise<T[]> {
  const { data, error } = await fetcher()
  if (error) throw new Error(`Błąd pobierania ${label}: ${JSON.stringify(error)}`)
  return data ?? []
}async function main() {
  const url = requireEnv("NEXT_PUBLIC_SUPABASE_URL")
  const serviceKey = requireEnv("SUPABASE_SERVICE_ROLE_KEY")

  const sb = createClient<Database>(url, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  })

  const now = new Date()
  const ts = now.toISOString().replace(/:/g, "-").replace(/\.\d{3}Z$/, "Z")
  const outDir = resolve(process.cwd(), "backups", ts)
  mkdirSync(outDir, { recursive: true })
  console.log(`\nBackup bazy → ${outDir}\n`)

  // auth.users — wymaga service role
  console.log("  Pobieranie: auth.users...")
  const allAuthUsers: unknown[] = []
  let page = 1
  const perPage = 1000
  while (true) {
    const { data, error } = await sb.auth.admin.listUsers({ page, perPage })
    if (error) throw new Error(`Błąd pobierania auth.users: ${error.message}`)
    allAuthUsers.push(...data.users)
    if (data.users.length < perPage) break
    page++
  }
  const authSize = writeJson(join(outDir, "auth_users.json"), allAuthUsers)
  console.log(`  ✓ auth.users (${allAuthUsers.length} rekordów) → ${authSize}`)

  // Tabele publiczne
  const tables = ["profiles", "predictions", "settings", "teams", "matches"] as const

  const counts: Record<string, number> = { auth_users: allAuthUsers.length }

  for (const table of tables) {
    console.log(`  Pobieranie: ${table}...`)
    const rows = await fetchAll(table, () => sb.from(table).select("*"))
    const size = writeJson(join(outDir, `${table}.json`), rows)
    counts[table] = rows.length
    console.log(`  ✓ ${table} (${rows.length} rekordów) → ${size}`)
  }

  // Manifest
  writeJson(join(outDir, "manifest.json"), {
    timestamp: now.toISOString(),
    supabaseUrl: url,
    counts,
  })

  console.log(`\nBackup zakończony. Katalog: ${outDir}`)
  console.log(`  Rekordy: ${Object.entries(counts).map(([k, v]) => `${k}=${v}`).join(", ")}`)
}

main().catch((err) => {
  console.error("Backup nieudany:", err)
  process.exit(1)
})
