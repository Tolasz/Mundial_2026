import { describe, it, expect, vi, beforeEach, afterEach } from "vitest"
import { render, screen, fireEvent, act } from "@testing-library/react"
import { MatchPredictionCard } from "@/components/match-prediction-card"
import type { MatchVM, TeamVM } from "@/lib/predictions/derive"

// Mock next/image used by TeamFlag
vi.mock("next/image", () => ({
  default: ({ src, alt }: { src: string; alt: string }) => (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={src} alt={alt} />
  ),
}))

// Mock savePrediction Server Action
const mockSavePrediction = vi.fn()
vi.mock("@/lib/actions/predictions", () => ({
  savePrediction: (...args: unknown[]) => mockSavePrediction(...args),
}))

// Mock sonner toast
const mockToastSuccess = vi.fn()
const mockToastError = vi.fn()
vi.mock("sonner", () => ({
  toast: {
    success: (...args: unknown[]) => mockToastSuccess(...args),
    error: (...args: unknown[]) => mockToastError(...args),
  },
}))

function makeTeam(name: string, shortName = name): TeamVM {
  return { id: `t-${name}`, name, shortName, flagUrl: "" }
}

function makeMatch(overrides: Partial<MatchVM> = {}): MatchVM {
  return {
    id: "match-1",
    group: "A",
    stage: "group",
    roundLabel: null,
    kickoffAt: new Date(Date.now() + 86400000).toISOString(), // tomorrow
    home: makeTeam("Poland", "POL"),
    away: makeTeam("Brazil", "BRA"),
    prediction: null,
    isLocked: false,
    predictionStatus: "empty",
    otherPredictions: [],
    ...overrides,
  }
}

// MatchPredictionCard tests
describe("MatchPredictionCard", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.useFakeTimers()
    mockSavePrediction.mockResolvedValue({ success: true })
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it("renders team names", () => {
    render(<MatchPredictionCard match={makeMatch()} />)
    expect(screen.getByText("POL")).toBeInTheDocument()
    expect(screen.getByText("BRA")).toBeInTheDocument()
  })

  it("shows lock indicator when locked", () => {
    render(<MatchPredictionCard match={makeMatch({ isLocked: true, predictionStatus: "locked" })} />)
    expect(screen.getByText("Zablokowany")).toBeInTheDocument()
    expect(screen.getByLabelText("Bramki Poland")).toBeDisabled()
  })

  it("does NOT call savePrediction immediately on input change", () => {
    render(<MatchPredictionCard match={makeMatch()} />)
    const homeInput = screen.getByLabelText("Bramki Poland")
    fireEvent.change(homeInput, { target: { value: "2" } })
    expect(mockSavePrediction).not.toHaveBeenCalled()
  })

  it("calls savePrediction ONCE after debounce", async () => {
    render(<MatchPredictionCard match={makeMatch()} />)
    const homeInput = screen.getByLabelText("Bramki Poland")
    const awayInput = screen.getByLabelText("Bramki Brazil")
    fireEvent.change(homeInput, { target: { value: "2" } })
    fireEvent.change(awayInput, { target: { value: "1" } })
    // Still no call before debounce
    expect(mockSavePrediction).not.toHaveBeenCalled()
    // Advance debounce timer
    await act(async () => {
      vi.advanceTimersByTime(700)
      await vi.runAllTimersAsync()
    })
    expect(mockSavePrediction).toHaveBeenCalledOnce()
    expect(mockSavePrediction).toHaveBeenCalledWith({
      matchId: "match-1",
      homePick: 2,
      awayPick: 1,
    })
  })

  it("shows success toast after successful save", async () => {
    render(<MatchPredictionCard match={makeMatch()} />)
    const homeInput = screen.getByLabelText("Bramki Poland")
    const awayInput = screen.getByLabelText("Bramki Brazil")
    fireEvent.change(homeInput, { target: { value: "1" } })
    fireEvent.change(awayInput, { target: { value: "0" } })
    await act(async () => {
      vi.advanceTimersByTime(700)
      await vi.runAllTimersAsync()
    })
    expect(mockToastSuccess).toHaveBeenCalledWith("Zapisano typ")
  })

  it("shows error toast when save fails", async () => {
    mockSavePrediction.mockResolvedValue({ success: false, error: "Błąd zapisu." })
    render(<MatchPredictionCard match={makeMatch()} />)
    const homeInput = screen.getByLabelText("Bramki Poland")
    const awayInput = screen.getByLabelText("Bramki Brazil")
    fireEvent.change(homeInput, { target: { value: "3" } })
    fireEvent.change(awayInput, { target: { value: "2" } })
    await act(async () => {
      vi.advanceTimersByTime(700)
      await vi.runAllTimersAsync()
    })
    expect(mockToastError).toHaveBeenCalledWith("Błąd zapisu.")
  })

  it("does not save invalid values (out of range)", async () => {
    render(<MatchPredictionCard match={makeMatch()} />)
    const homeInput = screen.getByLabelText("Bramki Poland")
    fireEvent.change(homeInput, { target: { value: "999" } })
    await act(async () => {
      vi.advanceTimersByTime(700)
      await vi.runAllTimersAsync()
    })
    expect(mockSavePrediction).not.toHaveBeenCalled()
  })
})
