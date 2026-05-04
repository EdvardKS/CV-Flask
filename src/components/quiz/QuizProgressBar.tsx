export function QuizProgressBar({ value, max, accent }: { value: number; max: number; accent: string }) {
  const pct = max ? Math.min(100, Math.max(0, (value / max) * 100)) : 0
  return (
    <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-800" role="progressbar" aria-valuenow={value} aria-valuemax={max} aria-valuemin={0}>
      <div
        className="h-full transition-[width] duration-300 ease-out"
        style={{ width: `${pct}%`, background: `linear-gradient(90deg, ${accent}, #22d3ee)` }}
      />
    </div>
  )
}
