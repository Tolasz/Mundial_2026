interface OtherPrediction {
  nick: string
  homePick: number
  awayPick: number
  pointsAwarded: number | null
}

interface OthersPredictionsProps {
  predictions: OtherPrediction[]
}

function PointsBadge({ points }: { points: number | null }) {
  if (points === null) return null
  const color =
    points === 3
      ? "text-green-500"
      : points === 1
        ? "text-yellow-500"
        : "text-muted-foreground"
  return <span className={`text-xs font-semibold tabular-nums ${color}`}>{points} pkt</span>
}

export function OthersPredictions({ predictions }: OthersPredictionsProps) {
  if (predictions.length === 0) return null

  return (
    <details className="group mt-1">
      <summary className="cursor-pointer list-none select-none text-xs text-muted-foreground hover:text-foreground flex items-center gap-1 py-1 px-1 w-fit rounded transition-colors">
        <span className="inline-block transition-transform group-open:rotate-90">▶</span>
        <span>
          Typy innych ({predictions.length})
        </span>
      </summary>
      <ul className="mt-1 space-y-1 px-1">
        {predictions.map((p) => (
          <li
            key={p.nick}
            className="flex items-center justify-between gap-2 rounded px-2 py-1 bg-muted/40 text-xs"
          >
            <span className="font-medium truncate max-w-[140px]">{p.nick}</span>
            <span className="tabular-nums font-semibold shrink-0">
              {p.homePick} : {p.awayPick}
            </span>
            <PointsBadge points={p.pointsAwarded} />
          </li>
        ))}
      </ul>
    </details>
  )
}
