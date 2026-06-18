import { describe, it, expect, vi } from "vitest"
import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { PredictionsBoard } from "@/components/predictions-board"
import type { MatchVM, TeamVM } from "@/lib/predictions/derive"

// Mock next/image used by TeamFlag inside MatchPredictionCard
vi.mock("next/image", () => ({
  default: ({ src, alt }: { src: string; alt: string }) => (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={src} alt={alt} />
  ),
}))

// Mock savePrediction so card doesn't throw
vi.mock("@/lib/actions/predictions", () => ({
  savePrediction: vi.fn().mockResolvedValue({ success: true }),
}))

vi.mock("sonner", () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}))

function makeTeam(name: string, shortName = name): TeamVM {
  return { id: `t-${name}`, name, shortName, flagUrl: "" }
}

function makeMatch(overrides: Partial<MatchVM> & { id: string }): MatchVM {
  return {
    group: "A",
    stage: "group",
    roundLabel: null,
    kickoffAt: "2026-06-10T15:00:00Z",
    home: makeTeam("Poland", "POL"),
    away: makeTeam("Brazil", "BRA"),
    prediction: null,
    pointsAwarded: null,
    isLocked: false,
    predictionStatus: "empty",
    status: "scheduled",
    result: null,
    otherPredictions: [],
    ...overrides,
  }
}

const MATCHES: MatchVM[] = [
  makeMatch({
    id: "1",
    group: "A",
    home: makeTeam("Poland", "POL"),
    away: makeTeam("Brazil", "BRA"),
    predictionStatus: "empty",
    kickoffAt: "2026-06-10T15:00:00Z",
  }),
  makeMatch({
    id: "2",
    group: "A",
    home: makeTeam("France", "FRA"),
    away: makeTeam("Germany", "GER"),
    predictionStatus: "saved",
    prediction: { homePick: 1, awayPick: 0 },
    kickoffAt: "2026-06-11T15:00:00Z",
  }),
  makeMatch({
    id: "3",
    group: "B",
    home: makeTeam("Argentina", "ARG"),
    away: makeTeam("Spain", "ESP"),
    predictionStatus: "locked",
    isLocked: true,
    kickoffAt: "2026-06-09T12:00:00Z",
  }),
]

function renderBoard(matches = MATCHES) {
  return render(
    <PredictionsBoard
      matches={matches}
      pendingKnockoutMatches={[]}
      availableGroups={["A", "B"]}
      totalCount={matches.length}
    />,
  )
}

describe("PredictionsBoard", () => {
  it("renders all matches by default", () => {
    renderBoard()
    expect(screen.getByText("POL")).toBeInTheDocument()
    expect(screen.getByText("FRA")).toBeInTheDocument()
    expect(screen.getByText("ARG")).toBeInTheDocument()
  })

  it("filtering by status 'Nietypowane' hides saved and locked matches", async () => {
    const user = userEvent.setup()
    renderBoard()
    await user.click(screen.getByRole("button", { name: "Nietypowane" }))
    expect(screen.getByText("POL")).toBeInTheDocument()
    expect(screen.queryByText("FRA")).not.toBeInTheDocument()
    expect(screen.queryByText("ARG")).not.toBeInTheDocument()
  })

  it("filtering by status 'Zapisane' shows only saved matches", async () => {
    const user = userEvent.setup()
    renderBoard()
    await user.click(screen.getByRole("button", { name: "Zapisane" }))
    expect(screen.queryByText("POL")).not.toBeInTheDocument()
    expect(screen.getByText("FRA")).toBeInTheDocument()
    expect(screen.queryByText("ARG")).not.toBeInTheDocument()
  })

  it("filtering by group 'B' shows only group B matches", async () => {
    const user = userEvent.setup()
    renderBoard()
    await user.click(screen.getByRole("button", { name: "B" }))
    expect(screen.queryByText("POL")).not.toBeInTheDocument()
    expect(screen.queryByText("FRA")).not.toBeInTheDocument()
    expect(screen.getByText("ARG")).toBeInTheDocument()
  })

  it("shows empty state when no matches pass filters", async () => {
    const user = userEvent.setup()
    renderBoard()
    // Filter to group B AND saved — no match satisfies both
    await user.click(screen.getByRole("button", { name: "B" }))
    await user.click(screen.getByRole("button", { name: "Zapisane" }))
    expect(screen.getByText("Brak meczów")).toBeInTheDocument()
  })

  it("sort button switches to flat chronological list (no group sections)", async () => {
    const user = userEvent.setup()
    renderBoard()
    // Default: grouped view — group sections exist
    expect(screen.getByRole("region", { name: "Grupa A" })).toBeInTheDocument()
    expect(screen.getByRole("region", { name: "Grupa B" })).toBeInTheDocument()

    // Click once → asc flat list, group sections disappear
    await user.click(screen.getByRole("button", { name: /Sortuj po dacie/ }))
    expect(screen.queryByRole("region", { name: "Grupa A" })).not.toBeInTheDocument()
    expect(screen.queryByRole("region", { name: "Grupa B" })).not.toBeInTheDocument()
    // All matches still visible in chronological order
    const inputs = screen.getAllByRole("spinbutton")
    expect(inputs.length).toBeGreaterThan(0)

    // Click again → desc (reversed), still flat
    await user.click(screen.getByRole("button", { name: /Sortuj po dacie/ }))
    expect(screen.queryByRole("region", { name: "Grupa A" })).not.toBeInTheDocument()

    // Click again → back to grouped view
    await user.click(screen.getByRole("button", { name: /Widok grupowy/ }))
    expect(screen.getByRole("region", { name: "Grupa A" })).toBeInTheDocument()
  })

  it("shows progress counter", () => {
    renderBoard()
    // 1 saved + 1 locked = 2 not-empty out of 3
    expect(screen.getByText("2")).toBeInTheDocument()
    expect(screen.getByText("/3")).toBeInTheDocument()
  })
})
