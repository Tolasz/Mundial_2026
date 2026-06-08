"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"

interface NavLink {
  href: string
  label: string
}

export function DesktopNav({ links }: { links: NavLink[] }) {
  const pathname = usePathname()

  return (
    <nav className="hidden md:flex items-center gap-1 flex-1">
      {links.map((link) => (
        <Link
          key={link.href}
          href={link.href}
          className={cn(
            "px-3 py-2 text-sm font-medium rounded-md transition-colors hover:bg-accent hover:text-accent-foreground",
            pathname.startsWith(link.href)
              ? "bg-accent text-accent-foreground"
              : "text-muted-foreground"
          )}
        >
          {link.label}
        </Link>
      ))}
    </nav>
  )
}
