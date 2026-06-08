import { describe, it, expect } from "vitest";
import { scorePrediction } from "./scoring";

describe("scorePrediction", () => {
  it("returns 3 for exact score 2:1 vs 2:1", () => {
    expect(scorePrediction({ home: 2, away: 1 }, { home: 2, away: 1, status: "finished" })).toBe(3);
  });

  it("returns 3 for exact score 0:0 vs 0:0", () => {
    expect(scorePrediction({ home: 0, away: 0 }, { home: 0, away: 0, status: "finished" })).toBe(3);
  });

  it("returns 1 for correct outcome 2:1 vs 3:0 (both home wins)", () => {
    expect(scorePrediction({ home: 2, away: 1 }, { home: 3, away: 0, status: "finished" })).toBe(1);
  });

  it("returns 1 for correct draw 1:1 vs 2:2", () => {
    expect(scorePrediction({ home: 1, away: 1 }, { home: 2, away: 2, status: "finished" })).toBe(1);
  });

  it("returns 0 for wrong outcome 2:1 vs 0:2 (home win vs away win)", () => {
    expect(scorePrediction({ home: 2, away: 1 }, { home: 0, away: 2, status: "finished" })).toBe(0);
  });

  it("returns null for postponed match", () => {
    expect(scorePrediction({ home: 2, away: 1 }, { home: 2, away: 1, status: "postponed" })).toBeNull();
  });

  it("returns null when result is null", () => {
    expect(scorePrediction({ home: 2, away: 1 }, null)).toBeNull();
  });

  it("returns null for scheduled match", () => {
    expect(scorePrediction({ home: 1, away: 0 }, { home: 1, away: 0, status: "scheduled" })).toBeNull();
  });

  it("returns null for live match", () => {
    expect(scorePrediction({ home: 1, away: 0 }, { home: 1, away: 0, status: "live" })).toBeNull();
  });
});
