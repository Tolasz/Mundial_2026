import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import Home from "@/app/page";

// Mock next-themes to avoid SSR issues in tests
vi.mock("next-themes", () => ({
  useTheme: () => ({ theme: "dark", setTheme: vi.fn() }),
}));

describe("Home page", () => {
  it("renders the app title", () => {
    render(<Home />);
    expect(screen.getByText(/Mundial Typer 2026/i)).toBeInTheDocument();
  });

  it("renders the description", () => {
    render(<Home />);
    expect(screen.getByText(/Typuj dokładne wyniki/i)).toBeInTheDocument();
  });
});
