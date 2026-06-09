import { describe, it, expect, vi } from "vitest"
import { render, screen } from "@testing-library/react"
import { LeaderboardPodium } from "@/components/leaderboard-podium"
import { type LeaderRow } from "@/lib/leaderboard/derive"

// Mock next/link
vi.mock("next/link", () => ({
  default: ({
    href,
    children,
    ...props
  }: {
    href: string
    children: React.ReactNode
    [key: string]: unknown
  }) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}))

function makePlayer(overrides: Partial<LeaderRow> & { userId: string; rank: 1 | 2 | 3 }): LeaderRow {
  return {
    nick: `Gracz ${overrides.rank}`,
    totalPoints: 30 - overrides.rank * 5,
    exactHits: 5 - overrides.rank,
    resultHits: 3,
    predictedCount: 10,
    championBonus: 0,
    isCurrentUser: false,
    ...overrides,
  }
}

describe("LeaderboardPodium", () => {
  it("renders nothing for empty podium", () => {
    const { container } = render(<LeaderboardPodium podium={[]} />)
    expect(container.firstChild).toBeNull()
  })

  it("renders all 3 players in podium", () => {
    const podium: LeaderRow[] = [
      makePlayer({ userId: "u1", rank: 1 }),
      makePlayer({ userId: "u2", rank: 2 }),
      makePlayer({ userId: "u3", rank: 3 }),
    ]
    render(<LeaderboardPodium podium={podium} />)
    expect(screen.getByText("Gracz 1")).toBeInTheDocument()
    expect(screen.getByText("Gracz 2")).toBeInTheDocument()
    expect(screen.getByText("Gracz 3")).toBeInTheDocument()
  })

  it("renders links to player profiles", () => {
    const podium: LeaderRow[] = [
      makePlayer({ userId: "abc-123", rank: 1 }),
    ]
    render(<LeaderboardPodium podium={podium} />)
    const link = screen.getByRole("link")
    expect(link).toHaveAttribute("href", "/leaderboard/abc-123")
  })

  it("shows ★ bonus indicator when championBonus > 0", () => {
    const podium: LeaderRow[] = [
      makePlayer({ userId: "u1", rank: 1, championBonus: 50 }),
      makePlayer({ userId: "u2", rank: 2, championBonus: 0 }),
    ]
    render(<LeaderboardPodium podium={podium} />)
    // First player has a bonus — should show ★
    expect(screen.getByText(/★/)).toBeInTheDocument()
    // Bonus text appears once (only for u1)
    expect(screen.getAllByText(/★/).length).toBe(1)
  })

  it("does not show ★ when championBonus is 0", () => {
    const podium: LeaderRow[] = [
      makePlayer({ userId: "u1", rank: 1, championBonus: 0 }),
    ]
    render(<LeaderboardPodium podium={podium} />)
    expect(screen.queryByText(/★/)).toBeNull()
  })

  it("renders with fewer than 3 players (1 player)", () => {
    const podium: LeaderRow[] = [
      makePlayer({ userId: "u1", rank: 1 }),
    ]
    render(<LeaderboardPodium podium={podium} />)
    expect(screen.getByText("Gracz 1")).toBeInTheDocument()
  })

  it("shows rank numbers for each player", () => {
    const podium: LeaderRow[] = [
      makePlayer({ userId: "u1", rank: 1 }),
      makePlayer({ userId: "u2", rank: 2 }),
      makePlayer({ userId: "u3", rank: 3 }),
    ]
    render(<LeaderboardPodium podium={podium} />)
    expect(screen.getByText("#1")).toBeInTheDocument()
    expect(screen.getByText("#2")).toBeInTheDocument()
    expect(screen.getByText("#3")).toBeInTheDocument()
  })
})
