"use client"

import { useState, useEffect } from "react"
import { createPortal } from "react-dom"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { Menu, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

interface NavLink {
  href: string
  label: string
  exact?: boolean
}

interface MobileNavProps {
  links: NavLink[]
  nick: string | null
}

export function MobileNav({ links, nick }: MobileNavProps) {
  const [open, setOpen] = useState(false)
  const [mounted, setMounted] = useState(false)
  const pathname = usePathname()

  useEffect(() => { setMounted(true) }, [])

  const overlay = (
    <div
      className="fixed left-0 right-0 bottom-0 top-14 z-[9999] border-t border-border overflow-y-auto"
      style={{ backgroundColor: 'var(--background, #f9fafb)' }}
    >
      <nav className="flex flex-col p-4 gap-1">
        {nick && (
          <p className="text-sm text-muted-foreground px-3 py-2 mb-2 border-b border-border">
            Zalogowany jako: <span className="font-medium text-foreground">{nick}</span>
          </p>
        )}
        {links.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            onClick={() => setOpen(false)}
            className={cn(
              "px-3 py-3 text-base font-medium rounded-md transition-colors border-2 hover:bg-accent hover:text-accent-foreground",
              (link.exact ? pathname === link.href : pathname.startsWith(link.href))
                ? "border-primary bg-accent text-accent-foreground"
                : "border-foreground/25 text-muted-foreground hover:border-foreground/40"
            )}
          >
            {link.label}
          </Link>
        ))}
      </nav>
    </div>
  )

  return (
    <div className="md:hidden">
      <Button
        variant="ghost"
        size="icon"
        aria-label="Otwórz menu"
        onClick={() => setOpen((v) => !v)}
      >
        {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
      </Button>

      {open && mounted && createPortal(overlay, document.body)}
    </div>
  )
}
