export function StatTile({ label, value, accent }: { label: string; value: string; accent?: string }) {
  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-3 text-center">
      <div className="text-[11px] uppercase tracking-wider text-slate-500">{label}</div>
      <div
        className="mt-1 text-2xl font-extrabold tabular-nums"
        style={accent ? { color: accent } : { color: '#e2e8f0' }}
      >
        {value}
      </div>
    </div>
  )
}
