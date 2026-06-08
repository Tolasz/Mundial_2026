import { describe, it, expect, vi } from "vitest";

// Mock next/navigation redirect
const mockRedirect = vi.fn();
vi.mock("next/navigation", () => ({
  redirect: (url: string) => {
    mockRedirect(url);
    throw new Error("NEXT_REDIRECT");
  },
}));

describe("Home page", () => {
  it("redirects to /predictions", async () => {
    const { default: Home } = await import("@/app/page");
    expect(() => Home()).toThrow("NEXT_REDIRECT");
    expect(mockRedirect).toHaveBeenCalledWith("/predictions");
  });
});
