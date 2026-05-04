export function ContextBox({ text }: { text: string }) {
  return (
    <blockquote className="mb-3 rounded-2xl border-l-4 border-sky-300 bg-sky-50/60 px-4 py-3 text-[14px] leading-relaxed text-slate-700">
      <p className="mb-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-sky-700">Reading / Contexto</p>
      <p className="whitespace-pre-line">{text}</p>
    </blockquote>
  )
}
