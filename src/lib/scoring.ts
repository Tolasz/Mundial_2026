export type Score = { home: number; away: number };

export type MatchResult = {
  home: number;
  away: number;
  status: "finished" | "scheduled" | "live" | "postponed";
} | null;

/**
 * Scores a prediction against a match result.
 * Returns null if the match has no result yet (status !== 'finished' or result is null).
 * Returns 3 for exact score, 1 for correct outcome (W/D/L), 0 otherwise.
 */
export function scorePrediction(pred: Score, result: MatchResult): number | null {
  if (result === null || result.status !== "finished") {
    return null;
  }

  if (pred.home === result.home && pred.away === result.away) {
    return 3;
  }

  const predSign = Math.sign(pred.home - pred.away);
  const resultSign = Math.sign(result.home - result.away);
  if (predSign === resultSign) {
    return 1;
  }

  return 0;
}
