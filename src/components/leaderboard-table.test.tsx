import { describe, it, expect, vi } from "vitest"
import { render, screen } from "@testing-library/react"
import { LeaderboardTable } from "@/components/leaderboard-table"
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

function makeRow(overrides: Partial<LeaderRow> & { userId: string; rank: number }): LeaderRow {
  return {
    nick: `Gracz ${overrides.rank}`,
    totalPoints: 20 - overrides.rank,
    exactHits: 3,
    resultHits: 2,
    predictedCount: 10,
    championBonus: 0,
    isCurrentUser: false,
    ...overrides,
  }
}

describe("LeaderboardTable", () => {
  it("renders empty state when rows is empty", () => {
    render(<LeaderboardTable rows={[]} />)
    expect(screen.getByText(/brak graczy poza podium/i)).toBeInTheDocument()
  })

  it("renders all rows", () => {
    const rows = [
      makeRow({ userId: "u4", rank: 4 }),
      makeRow({ userId: "u5", rank: 5 }),
      makeRow({ userId: "u6", rank: 6 }),
    ]
    render(<LeaderboardTable rows={rows} />)
    expect(screen.getByText("Gracz 4")).toBeInTheDocument()
    expect(screen.getByText("Gracz 5")).toBeInTheDocument()
    expect(screen.getByText("Gracz 6")).toBeInTheDocument()
  })

  it("highlights the current user row and shows (Ty) badge", () => {
    const rows = [
      makeRow({ userId: "u4", rank: 4 }),
      makeRow({ userId: "u5", rank: 5, isCurrentUser: true, nick: "Ja" }),
      makeRow({ userId: "u6", rank: 6 }),
    ]
    render(<LeaderboardTable rows={rows} />)
    expect(screen.getByText("Ty")).toBeInTheDocument()
    // The row link for current user should be visible
    expect(screen.getByText("Ja")).toBeInTheDocument()
  })

  it("shows champion bonus ★ when championBonus > 0", () => {
    const rows = [
      makeRow({ userId: "u4", rank: 4, championBonus: 50 }),
      makeRow({ userId: "u5", rank: 5, championBonus: 0 }),
    ]
    render(<LeaderboardTable rows={rows} />)
    expect(screen.getByText("★")).toBeInTheDocument()
    expect(screen.getAllByText("★").length).toBe(1)
  })

  it("does not show (Ty) badge when isCurrentUser is false for all rows", () => {
    const rows = [
      makeRow({ userId: "u4", rank: 4 }),
      makeRow({ userId: "u5", rank: 5 }),
    ]
    render(<LeaderboardTable rows={rows} />)
    expect(screen.queryByText("Ty")).toBeNull()
  })

  it("renders rank numbers correctly", () => {
    const rows = [
      makeRow({ userId: "u4", rank: 4 }),
      makeRow({ userId: "u5", rank: 5 }),
    ]
    render(<LeaderboardTable rows={rows} />)
    expect(screen.getByText("4.")).toBeInTheDocument()
    expect(screen.getByText("5.")).toBeInTheDocument()
  })

  it("renders player profile links", () => {
    const rows = [makeRow({ userId: "player-xyz", rank: 4 })]
    render(<LeaderboardTable rows={rows} />)
    const link = screen.getByRole("link")
    expect(link).toHaveAttribute("href", "/leaderboard/player-xyz")
  })
})
