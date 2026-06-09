"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"

const links = [
  { href: "/admin", label: "Przegląd", exact: true },
  { href: "/admin/matches", label: "Mecze" },
  { href: "/admin/knockout", label: "Pary pucharowe" },
  { href: "/admin/users", label: "Użytkownicy" },
]

export function AdminNav() {
  const pathname = usePathname()

  return (
    <nav className="flex gap-1 mb-6 border-b border-border pb-2 flex-wrap">
      {links.map(({ href, label, exact }) => {
        const active = exact ? pathname === href : pathname.startsWith(href)
        return (
          <Link
            key={href}
            href={href}
            className={cn(
              "px-3 py-1.5 rounded-md text-sm font-medium transition-colors",
              active
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:bg-muted hover:text-foreground",
            )}
          >
            {label}
          </Link>
        )
      })}
    </nav>
  )
}
