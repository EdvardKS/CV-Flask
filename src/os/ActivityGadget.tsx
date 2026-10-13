'use client'

import { useEffect, useMemo, useState } from 'react'
import clsx from 'clsx'

type ActivityDay = [day: string, minutes: number]
type ActivityFeed = { ok: boolean; repositories: number; days: ActivityDay[] }

const WEEKS = 53

function isoDay(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
}

function levelFor(minutes: number, max: number) {
  if (minutes <= 0) return 0
  const ratio = minutes / max
  if (ratio > 0.75) return 4
  if (ratio > 0.5) return 3
  if (ratio > 0.25) return 2
  return 1
}

export function ActivityGadget({ variant = 'desktop' }: { variant?: 'desktop' | 'window' }) {
  const [feed, setFeed] = useState<ActivityFeed | null>(null)

  useEffect(() => {
    fetch('/api/activity')
      .then(response => response.json() as Promise<ActivityFeed>)
      .then(setFeed)
      .catch(() => setFeed(null))
  }, [])

  const { columns, activeDays, hours } = useMemo(() => {
    const days = feed?.days ?? []
    const byDay = new Map(days)
    const today = new Date()
    const start = new Date(today)
    start.setDate(start.getDate() - (WEEKS * 7 - 1))
    start.setDate(start.getDate() - ((start.getDay() + 6) % 7))
    const firstDay = isoDay(start)
    const inRange = days.filter(([day]) => day >= firstDay)
    const max = Math.max(60, ...inRange.map(([, minutes]) => minutes))

    const grid: Array<Array<{ day: string; level: number } | null>> = []
    const cursor = new Date(start)
    while (cursor <= today) {
      const week: Array<{ day: string; level: number } | null> = []
      for (let row = 0; row < 7; row += 1) {
        if (cursor > today) week.push(null)
        else {
          const day = isoDay(cursor)
          week.push({ day, level: levelFor(byDay.get(day) ?? 0, max) })
        }
        cursor.setDate(cursor.getDate() + 1)
      }
      grid.push(week)
    }

    return {
      columns: grid,
      activeDays: inRange.length,
      hours: Math.round(inRange.reduce((sum, [, minutes]) => sum + minutes, 0) / 60)
    }
  }, [feed])

  if (!feed || feed.days.length === 0) return null

  return (
    <a
      className={clsx('activity-gadget', variant === 'window' && 'is-window')}
      href="https://github.com/EdvardKS"
      target="_blank"
      rel="noopener noreferrer"
      title="Actividad registrada en mis proyectos durante el último año"
    >
      <span className="activity-head">
        <strong>{feed.repositories}</strong> repositorios
        <span className="activity-sep">·</span>
        <strong>{activeDays}</strong> días activos
        <span className="activity-sep">·</span>
        <strong>{hours}</strong> h en el último año
      </span>
      <span className="activity-grid" aria-hidden>
        {columns.map((week, column) => (
          <span key={column} className="activity-week">
            {week.map((cell, row) => (
              <span key={row} className={cell ? `activity-cell l${cell.level}` : 'activity-cell is-empty'} title={cell?.day} />
            ))}
          </span>
        ))}
      </span>
    </a>
  )
}
