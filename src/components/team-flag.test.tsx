import { describe, it, expect, vi } from "vitest"
import { render, screen } from "@testing-library/react"
import { TeamFlag } from "@/components/team-flag"

// Mock next/image to render a plain <img> in tests
vi.mock("next/image", () => ({
  default: ({
    src,
    alt,
    width,
    height,
    className,
  }: {
    src: string
    alt: string
    width: number
    height: number
    className?: string
  }) => (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={src} alt={alt} width={width} height={height} className={className} />
  ),
}))

describe("TeamFlag", () => {
  it("renders an <img> with correct alt for http URL", () => {
    render(
      <TeamFlag
        flagUrl="https://media.api-sports.io/flags/pl.svg"
        name="Polska"
      />,
    )
    const img = screen.getByAltText("Polska")
    expect(img.tagName).toBe("IMG")
    expect(img).toHaveAttribute("src", "https://media.api-sports.io/flags/pl.svg")
  })

  it("renders an <img> with correct alt for https URL", () => {
    render(<TeamFlag flagUrl="https://example.com/flag.png" name="Argentyna" />)
    const img = screen.getByAltText("Argentyna")
    expect(img.tagName).toBe("IMG")
  })

  it("renders placeholder initials when flagUrl is empty", () => {
    render(<TeamFlag flagUrl="" name="Brazylia" />)
    // Should be a span with role=img (placeholder), not an <img> element
    const placeholder = screen.getByRole("img")
    expect(placeholder.tagName).toBe("SPAN")
    expect(placeholder).toHaveTextContent("BR")
    expect(placeholder).toHaveAttribute("aria-label", "Brazylia")
  })

  it("renders placeholder initials for emoji flag_url", () => {
    render(<TeamFlag flagUrl="🇵🇱" name="Polska" />)
    const placeholder = screen.getByRole("img")
    expect(placeholder).toHaveTextContent("PO")
  })

  it("renders size=md placeholder with correct text", () => {
    render(<TeamFlag flagUrl="" name="Niemcy" size="md" />)
    const placeholder = screen.getByRole("img")
    expect(placeholder).toHaveTextContent("NI")
  })
})
