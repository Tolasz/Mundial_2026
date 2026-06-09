import { describe, it, expect, vi } from "vitest"
import { render, screen } from "@testing-library/react"
import { MissingPredictionsAlert } from "@/components/dashboard/MissingPredictionsAlert"
import { UpcomingMatches } from "@/components/dashboard/UpcomingMatches"
import type { DashboardMatchVM } from "@/lib/dashboard/derive"

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

// Mock next/image
vi.mock("next/image", () => ({
  default: ({
    src,
    alt,
    ...props
  }: {
    src: string
    alt: string
    [key: string]: unknown
  }) => <img src={src} alt={alt} {...props} />,
}))

// ---------------------------------------------------------------------------
// MissingPredictionsAlert
// ---------------------------------------------------------------------------
describe("MissingPredictionsAlert", () => {
  it("renders nothing when count is 0", () => {
    const { container } = render(<MissingPredictionsAlert count={0} />)
    expect(container.firstChild).toBeNull()
  })

  it("shows count when there are missing predictions", () => {
    render(<MissingPredictionsAlert count={3} />)
    expect(screen.getByRole("alert")).toBeInTheDocument()
    expect(screen.getByText(/3/)).toBeInTheDocument()
  })

  it("renders link to /predictions#missing", () => {
    render(<MissingPredictionsAlert count={5} />)
    expect(screen.getByRole("link", { name: /uzupełnij/i })).toHaveAttribute(
      "href",
      "/predictions#missing",
    )
  })
})

// ---------------------------------------------------------------------------
// UpcomingMatches
// ---------------------------------------------------------------------------
const team = (id: string) => ({
  id,
  name: `Team ${id}`,
  shortName: id,
  flagUrl: `https://example.com/${id}.svg`,
})

function makeMatch(id: string, kickoffAt: string): DashboardMatchVM {
  return {
    id,
    kickoffAt,
    stage: "group",
    group: "A",
    roundLabel: null,
    home: team("POL"),
    away: team("BRA"),
  }
}

describe("UpcomingMatches", () => {
  const now = new Date("2026-06-10T12:00:00Z")

  it("renders empty state when no matches", () => {
    render(<UpcomingMatches matches={[]} now={now} />)
    expect(screen.getByText(/brak nadchodzących meczów/i)).toBeInTheDocument()
  })

  it("renders match cards with team flags", () => {
    const matches = [
      makeMatch("1", "2026-06-11T18:00:00Z"),
      makeMatch("2", "2026-06-12T20:00:00Z"),
    ]
    render(<UpcomingMatches matches={matches} now={now} />)
    // Both matches should have team short names
    expect(screen.getAllByText("POL")).toHaveLength(2)
    expect(screen.getAllByText("BRA")).toHaveLength(2)
  })

  it("renders link to /predictions", () => {
    const matches = [makeMatch("1", "2026-06-11T18:00:00Z")]
    render(<UpcomingMatches matches={matches} now={now} />)
    expect(
      screen.getByRole("link", { name: /wszystkie typy/i }),
    ).toHaveAttribute("href", "/predictions")
  })
})
