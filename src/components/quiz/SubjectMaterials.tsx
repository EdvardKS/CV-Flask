import type { SubjectMaterial } from '@lib/quiz/types'

type Props = {
  materials: SubjectMaterial[]
  accent: string
}

export function SubjectMaterials({ materials, accent }: Props) {
  if (!materials.length) return null
  return (
    <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
      <p className="text-sm text-slate-500">Material de estudio</p>
      <div className="mt-3 flex flex-wrap gap-2.5">
        {materials.map(material => (
          <a
            key={material.url}
            href={material.url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm font-medium text-slate-800 transition hover:bg-slate-100"
            style={{ borderColor: `${accent}55` }}
          >
            {material.icon && <span aria-hidden>{material.icon}</span>}
            <span>{material.title}</span>
            <span aria-hidden className="text-slate-400">↗</span>
          </a>
        ))}
      </div>
    </section>
  )
}
