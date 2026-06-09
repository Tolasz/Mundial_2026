import { describe, it, expect } from "vitest"
import { render, screen } from "@testing-library/react"
import { PlayerStats } from "@/components/player-stats"
import type { PlayerStatsVM } from "@/lib/stats/player"

function makeVM(overrides: Partial<PlayerStatsVM> = {}): PlayerStatsVM {
  return {
    totalSettled: 0,
    exactHits: 0,
    resultHits: 0,
    missHits: 0,
    accuracyPct: 0,
    avgPointsPerMatch: 0,
    bestStreak: 0,
    pointsByStage: {
      group: 0,
      r32: 0,
      r16: 0,
      qf: 0,
      sf: 0,
      final: 0,
    },
    championBonus: 0,
    totalPoints: 0,
    ...overrides,
  }
}

describe("PlayerStats", () => {
  it("renders total points", () => {
    render(<PlayerStats vm={makeVM({ totalPoints: 42 })} />)
    expect(screen.getByText("42")).toBeInTheDocument()
  })

  it("renders accuracy percentage", () => {
    render(<PlayerStats vm={makeVM({ accuracyPct: 67 })} />)
    expect(screen.getByText("67%")).toBeInTheDocument()
  })

  it("renders exact hits count", () => {
    render(<PlayerStats vm={makeVM({ exactHits: 5 })} />)
    expect(screen.getByText("5")).toBeInTheDocument()
  })

  it("renders best streak", () => {
    render(<PlayerStats vm={makeVM({ bestStreak: 4 })} />)
    expect(screen.getByText("4 meczów")).toBeInTheDocument()
  })

  it("renders average points per match", () => {
    render(<PlayerStats vm={makeVM({ avgPointsPerMatch: 1.5 })} />)
    expect(screen.getByText("1.50")).toBeInTheDocument()
  })

  it("shows champion bonus card when bonus > 0", () => {
    render(<PlayerStats vm={makeVM({ championBonus: 50, totalPoints: 62 })} />)
    expect(screen.getByText("+50 pkt")).toBeInTheDocument()
    expect(screen.getByText("Bonus za mistrza")).toBeInTheDocument()
  })

  it("hides champion bonus when bonus is 0", () => {
    render(<PlayerStats vm={makeVM({ championBonus: 0 })} />)
    expect(screen.queryByText("Bonus za mistrza")).not.toBeInTheDocument()
  })

  it("shows empty state message when no settled matches", () => {
    render(<PlayerStats vm={makeVM({ totalSettled: 0 })} />)
    expect(
      screen.getByText(/Brak rozliczonych meczów/),
    ).toBeInTheDocument()
  })

  it("shows distribution bar when there are settled matches", () => {
    render(
      <PlayerStats
        vm={makeVM({
          totalSettled: 3,
          exactHits: 1,
          resultHits: 1,
          missHits: 1,
        })}
      />,
    )
    // The distribution aria-label should be present
    expect(
      screen.getByRole("img", { name: /Rozkład/ }),
    ).toBeInTheDocument()
  })

  it("does not render distribution bar for empty history", () => {
    render(<PlayerStats vm={makeVM({ totalSettled: 0 })} />)
    expect(screen.queryByRole("img", { name: /Rozkład/ })).not.toBeInTheDocument()
  })

  it("shows points by stage when stages have points", () => {
    render(
      <PlayerStats
        vm={makeVM({
          pointsByStage: {
            group: 12,
            r32: 0,
            r16: 6,
            qf: 0,
            sf: 0,
            final: 0,
          },
        })}
      />,
    )
    expect(screen.getByText("Faza grupowa")).toBeInTheDocument()
    expect(screen.getByText("1/16 finału")).toBeInTheDocument()
    // r32, qf etc should not appear (0 pts)
    expect(screen.queryByText("1/32 finału")).not.toBeInTheDocument()
  })

  it("renders — for best streak when 0", () => {
    render(<PlayerStats vm={makeVM({ bestStreak: 0 })} />)
    expect(screen.getByText("—")).toBeInTheDocument()
  })

  it("renders zeros without NaN for fully empty VM", () => {
    const { container } = render(<PlayerStats vm={makeVM()} />)
    expect(container.textContent).not.toContain("NaN")
  })
})
