'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { CategoryMultiCheck, type MultiCheckItem } from '@components/quiz/CategoryMultiCheck'

export type TopicOption = MultiCheckItem

type Props = {
  topics: TopicOption[]
  accent: string
  storageKey: string
  destination: string
  ctaLabel: string
  countLabel: string
  emptyHint?: string
  disabled?: boolean
}

function readStored(key: string): string[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = window.localStorage.getItem(key)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? parsed.filter(x => typeof x === 'string') : []
  } catch {
    return []
  }
}

export function TopicMultiSelect({ topics, accent, storageKey, destination, ctaLabel, countLabel, emptyHint, disabled }: Props) {
  const router = useRouter()
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [hydrated, setHydrated] = useState(false)

  useEffect(() => {
    const stored = readStored(storageKey)
    if (stored.length > 0) {
      const valid = stored.filter(id => topics.some(t => t.id === id))
      setSelected(new Set(valid))
    }
    setHydrated(true)
  }, [storageKey, topics])

  useEffect(() => {
    if (!hydrated) return
    try {
      window.localStorage.setItem(storageKey, JSON.stringify([...selected]))
    } catch {}
  }, [selected, storageKey, hydrated])

  function start() {
    if (selected.size === 0) return
    const sorted = [...selected].sort()
    router.push(`${destination}?temas=${encodeURIComponent(sorted.join(','))}`)
  }

  return (
    <div className="mt-4">
      <CategoryMultiCheck
        items={topics}
        value={selected}
        onChange={setSelected}
        countLabel={countLabel}
        emptyHint={emptyHint}
      />
      {topics.length > 0 && (
        <div className="mt-3 flex justify-end">
          <button
            type="button"
            onClick={start}
            disabled={disabled || selected.size === 0}
            className="rounded-xl px-4 py-2 text-sm font-bold text-white shadow-md transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50"
            style={{ backgroundColor: accent }}
          >{ctaLabel}</button>
        </div>
      )}
    </div>
  )
}
