export function StatTile({ label, value, accent }: { label: string; value: string; accent?: string }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-3 text-center shadow-sm">
      <div className="text-[11px] uppercase tracking-wider text-slate-400">{label}</div>
      <div
        className="mt-1 text-2xl font-extrabold tabular-nums"
        style={accent ? { color: accent } : { color: '#0f172a' }}
      >
        {value}
      </div>
    </div>
  )
}
