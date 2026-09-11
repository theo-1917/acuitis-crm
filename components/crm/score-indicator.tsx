import { cn } from "@/lib/utils"

function scoreColor(score: number): string {
  if (score >= 80) return "text-score-high"
  if (score >= 50) return "text-score-mid"
  return "text-score-low"
}

export function ScoreRing({ score }: { score: number }) {
  const radius = 15
  const circumference = 2 * Math.PI * radius
  const offset = circumference - (score / 100) * circumference

  return (
    <div className="flex items-center gap-2.5">
      <div className="relative size-9 shrink-0">
        <svg className="size-9 -rotate-90" viewBox="0 0 36 36" aria-hidden="true">
          <circle
            cx="18"
            cy="18"
            r={radius}
            fill="none"
            strokeWidth="3.5"
            className="stroke-muted"
          />
          <circle
            cx="18"
            cy="18"
            r={radius}
            fill="none"
            strokeWidth="3.5"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            className={cn("transition-all", scoreColor(score))}
            stroke="currentColor"
          />
        </svg>
        <span
          className={cn(
            "absolute inset-0 flex items-center justify-center text-xs font-semibold tabular-nums",
            scoreColor(score),
          )}
        >
          {score}
        </span>
      </div>
      <span className="sr-only">Score candidat {score} sur 100</span>
    </div>
  )
}

export function ScoreBar({ score }: { score: number }) {
  const color =
    score >= 80 ? "bg-score-high" : score >= 50 ? "bg-score-mid" : "bg-score-low"
  return (
    <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
      <div
        className={cn("h-full rounded-full transition-all", color)}
        style={{ width: `${score}%` }}
      />
    </div>
  )
}
