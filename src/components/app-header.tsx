import Link from "next/link"
import { ThemeToggle } from "@/components/theme-toggle"
import { Button } from "@/components/ui/button"
import { signOut } from "@/lib/actions/auth"
import { createClient } from "@/lib/supabase/server"
import { MobileNav } from "@/components/mobile-nav"
import { DesktopNav } from "@/components/desktop-nav"

const NAV_LINKS = [
  { href: "/", label: "Pulpit", exact: true },
  { href: "/predictions", label: "Typy", exact: false },
  { href: "/leaderboard", label: "Ranking", exact: false },
  { href: "/champion", label: "Mistrz", exact: false },
] as const

export async function AppHeader() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  let nick: string | null = null
  let isAdmin = false

  if (user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("nick, is_admin")
      .eq("id", user.id)
      .single()

    nick = profile?.nick ?? user.email ?? null
    isAdmin = profile?.is_admin ?? false
  }

  const allLinks = [
    ...NAV_LINKS,
    ...(isAdmin ? [{ href: "/admin", label: "Admin", exact: false }] : []),
  ]

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto flex h-14 items-center gap-4 px-4">
        {/* Logo */}
        <Link
          href="/predictions"
          className="mr-4 flex items-center gap-2 font-bold text-lg shrink-0"
        >
          ⚽ Mundial 2026
        </Link>

        {/* Desktop nav */}
        <DesktopNav links={allLinks} />

        {/* Right side */}
        <div className="flex items-center gap-2 ml-auto">
          {nick && (
            <span className="hidden sm:block text-sm text-muted-foreground">
              {nick}
            </span>
          )}
          <ThemeToggle />
          <form action={signOut}>
            <Button type="submit" variant="ghost" size="sm">
              Wyloguj
            </Button>
          </form>
          {/* Mobile hamburger */}
          <MobileNav links={allLinks} nick={nick} />
        </div>
      </div>
    </header>
  )
}
