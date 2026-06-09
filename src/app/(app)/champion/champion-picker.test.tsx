import { describe, it, expect, vi, beforeEach } from "vitest"
import { render, screen, fireEvent, act } from "@testing-library/react"
import { ChampionPicker } from "./ChampionPicker"

// Mock next/image (used by TeamFlag)
vi.mock("next/image", () => ({
  default: ({ src, alt }: { src: string; alt: string }) => (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={src} alt={alt} />
  ),
}))

// Mock saveChampion Server Action
const mockSaveChampion = vi.fn()
vi.mock("@/lib/actions/champion", () => ({
  saveChampion: (...args: unknown[]) => mockSaveChampion(...args),
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

const TEAMS = [
  { id: "t1", name: "Polska", short_name: "POL", flag_url: "", group: "A" },
  { id: "t2", name: "Niemcy", short_name: "GER", flag_url: "", group: "A" },
  { id: "t3", name: "Francja", short_name: "FRA", flag_url: "", group: "B" },
]

const BASE_PROPS = {
  teams: TEAMS,
  currentChampionId: null,
  isLocked: false,
  bonusPoints: 50,
  final: null,
  finalFinished: false,
}

describe("ChampionPicker", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockSaveChampion.mockResolvedValue({ success: true })
  })

  it("renders all team buttons", () => {
    render(<ChampionPicker {...BASE_PROPS} />)
    expect(screen.getByText("Polska")).toBeInTheDocument()
    expect(screen.getByText("Niemcy")).toBeInTheDocument()
    expect(screen.getByText("Francja")).toBeInTheDocument()
  })

  it("renders group headings", () => {
    render(<ChampionPicker {...BASE_PROPS} />)
    expect(screen.getByText(/Grupa A/i)).toBeInTheDocument()
    expect(screen.getByText(/Grupa B/i)).toBeInTheDocument()
  })

  it("shows locked banner when isLocked=true", () => {
    render(<ChampionPicker {...BASE_PROPS} isLocked={true} />)
    expect(
      screen.getByText(/wybór mistrza jest zablokowany/i),
    ).toBeInTheDocument()
  })

  it("does not show Save button when locked", () => {
    render(<ChampionPicker {...BASE_PROPS} isLocked={true} />)
    expect(screen.queryByRole("button", { name: /zapisz/i })).not.toBeInTheDocument()
  })

  it("team buttons are disabled when locked", () => {
    render(<ChampionPicker {...BASE_PROPS} isLocked={true} />)
    const teamButtons = screen.getAllByRole("button")
    teamButtons.forEach((btn) => {
      expect(btn).toBeDisabled()
    })
  })

  it("selects a team on click and enables Save button", () => {
    render(<ChampionPicker {...BASE_PROPS} />)
    fireEvent.click(screen.getByText("Polska"))
    const saveBtn = screen.getByRole("button", { name: /zapisz typ mistrza/i })
    expect(saveBtn).toBeEnabled()
    expect(saveBtn).not.toBeDisabled()
  })

  it("calls saveChampion and shows success toast on save", async () => {
    render(<ChampionPicker {...BASE_PROPS} />)

    fireEvent.click(screen.getByText("Polska"))
    const saveBtn = screen.getByRole("button", { name: /zapisz typ mistrza/i })

    await act(async () => {
      fireEvent.click(saveBtn)
    })

    expect(mockSaveChampion).toHaveBeenCalledWith({ teamId: "t1" })
    expect(mockToastSuccess).toHaveBeenCalledWith("Typ mistrza zapisany!")
    expect(mockToastError).not.toHaveBeenCalled()
  })

  it("shows error toast when saveChampion fails", async () => {
    mockSaveChampion.mockResolvedValue({ success: false, error: "Zablokowany" })

    render(<ChampionPicker {...BASE_PROPS} />)

    fireEvent.click(screen.getByText("Polska"))
    const saveBtn = screen.getByRole("button", { name: /zapisz typ mistrza/i })

    await act(async () => {
      fireEvent.click(saveBtn)
    })

    expect(mockToastError).toHaveBeenCalledWith("Zablokowany")
    expect(mockToastSuccess).not.toHaveBeenCalled()
  })

  it("shows winner badge when finalFinished and user hit", () => {
    render(
      <ChampionPicker
        {...BASE_PROPS}
        currentChampionId="t1"
        finalFinished={true}
        final={{
          homeScore: 1,
          awayScore: 0,
          homeTeamId: "t1",
          awayTeamId: "t2",
        }}
      />,
    )
    expect(screen.getByText(/gratulacje/i)).toBeInTheDocument()
  })

  it("shows miss message when finalFinished and user missed", () => {
    render(
      <ChampionPicker
        {...BASE_PROPS}
        currentChampionId="t3"
        finalFinished={true}
        final={{
          homeScore: 1,
          awayScore: 0,
          homeTeamId: "t1",
          awayTeamId: "t2",
        }}
      />,
    )
    expect(screen.getByText(/nie udało się trafić/i)).toBeInTheDocument()
  })
})
