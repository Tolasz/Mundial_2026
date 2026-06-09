import { describe, it, expect } from "vitest"
import { render, screen } from "@testing-library/react"
import { Badge } from "@/components/ui/badge"
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Skeleton } from "@/components/ui/skeleton"

describe("Badge", () => {
  it("renders without error", () => {
    render(<Badge>test</Badge>)
    expect(screen.getByText("test")).toBeInTheDocument()
  })

  it("applies default variant class", () => {
    const { container } = render(<Badge variant="default">pts</Badge>)
    const badge = container.querySelector("[data-slot='badge']")
    expect(badge?.className).toContain("bg-primary/10")
  })

  it("applies success variant class (3 pkt)", () => {
    const { container } = render(<Badge variant="success">3</Badge>)
    const badge = container.querySelector("[data-slot='badge']")
    // success uses --points-exact-bg token via CSS var
    expect(badge?.className).toContain("points-exact")
  })

  it("applies info variant class (1 pkt)", () => {
    const { container } = render(<Badge variant="info">1</Badge>)
    const badge = container.querySelector("[data-slot='badge']")
    expect(badge?.className).toContain("points-result")
  })

  it("applies muted variant class", () => {
    const { container } = render(<Badge variant="muted">0</Badge>)
    const badge = container.querySelector("[data-slot='badge']")
    expect(badge?.className).toContain("bg-muted")
  })

  it("applies warning variant class (podium/bonus)", () => {
    const { container } = render(<Badge variant="warning">gold</Badge>)
    const badge = container.querySelector("[data-slot='badge']")
    expect(badge?.className).toContain("bg-accent/30")
  })

  it("forwards className prop", () => {
    const { container } = render(<Badge className="my-custom">x</Badge>)
    const badge = container.querySelector("[data-slot='badge']")
    expect(badge?.className).toContain("my-custom")
  })
})

describe("Card (smoke)", () => {
  it("mounts and renders children", () => {
    render(
      <Card>
        <CardHeader>
          <CardTitle>Tytuł</CardTitle>
        </CardHeader>
        <CardContent>Treść</CardContent>
        <CardFooter>Stopka</CardFooter>
      </Card>,
    )
    expect(screen.getByText("Tytuł")).toBeInTheDocument()
    expect(screen.getByText("Treść")).toBeInTheDocument()
    expect(screen.getByText("Stopka")).toBeInTheDocument()
  })

  it("forwards className", () => {
    const { container } = render(<Card className="my-card">_</Card>)
    expect(container.querySelector(".my-card")).not.toBeNull()
  })
})

describe("Input (smoke)", () => {
  it("mounts without error", () => {
    render(<Input placeholder="Wpisz..." />)
    expect(screen.getByPlaceholderText("Wpisz...")).toBeInTheDocument()
  })

  it("forwards className", () => {
    render(<Input className="my-input" />)
    expect(document.querySelector(".my-input")).not.toBeNull()
  })
})

describe("Skeleton (smoke)", () => {
  it("mounts without error", () => {
    const { container } = render(<Skeleton className="h-4 w-32" />)
    const el = container.querySelector("[data-slot='skeleton']")
    expect(el).not.toBeNull()
    expect(el?.className).toContain("animate-pulse")
  })
})
