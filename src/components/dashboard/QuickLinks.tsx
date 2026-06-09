import Link from "next/link"

const LINKS = [
  { href: "/predictions", label: "Typy", icon: "⚽" },
  { href: "/leaderboard", label: "Ranking", icon: "🏆" },
  { href: "/champion", label: "Mistrz", icon: "🌟" },
]

export function QuickLinks() {
  return (
    <section>
      <h2 className="text-lg font-semibold mb-3">Skróty</h2>
      <div className="grid grid-cols-3 gap-3">
        {LINKS.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className="flex flex-col items-center gap-2 rounded-lg border border-border bg-card p-4 shadow-sm hover:bg-accent hover:text-accent-foreground transition-colors text-center"
          >
            <span className="text-2xl" aria-hidden="true">
              {link.icon}
            </span>
            <span className="text-sm font-medium">{link.label}</span>
          </Link>
        ))}
      </div>
    </section>
  )
}
