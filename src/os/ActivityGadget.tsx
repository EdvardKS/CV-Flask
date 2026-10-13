'use client'

import { useEffect, useMemo, useState } from 'react'
import clsx from 'clsx'

type ActivityDay = [day: string, level: number, contributions: number, minutes: number]
type ActivityFeed = { ok: boolean; since: number; repositories: number; days: ActivityDay[] }
type Range = 'last' | number
type Cell = { day: string; level: number; contributions: number } | null

function isoDay(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
}

function rangeBounds(range: Range): { start: Date; end: Date } {
  const today = new Date()
  if (range === 'last') {
    const start = new Date(today)
    start.setDate(start.getDate() - 364)
    return { start, end: today }
  }
  const end = new Date(range, 11, 31)
  return { start: new Date(range, 0, 1), end: end > today ? today : end }
}

export function ActivityGadget({ variant = 'desktop' }: { variant?: 'desktop' | 'window' }) {
  const [feed, setFeed] = useState<ActivityFeed | null>(null)
  const [range, setRange] = useState<Range>('last')

  useEffect(() => {
    fetch('/api/activity')
      .then(response => response.json() as Promise<ActivityFeed>)
      .then(setFeed)
      .catch(() => setFeed(null))
  }, [])

  const years = useMemo(() => {
    if (!feed) return []
    const current = new Date().getFullYear()
    return Array.from({ length: current - feed.since + 1 }, (_, index) => current - index)
  }, [feed])

  const { columns, activeDays, contributions, totalContributions } = useMemo(() => {
    const days = feed?.days ?? []
    const byDay = new Map(days.map(([day, level, count]) => [day, { level, contributions: count }]))
    const { start, end } = rangeBounds(range)
    const first = isoDay(start)
    const last = isoDay(end)
    const gridStart = new Date(start)
    gridStart.setDate(gridStart.getDate() - ((gridStart.getDay() + 6) % 7))

    const grid: Cell[][] = []
    const cursor = new Date(gridStart)
    while (cursor <= end) {
      const week: Cell[] = []
      for (let row = 0; row < 7; row += 1) {
        const day = isoDay(cursor)
        if (cursor > end || day < first) week.push(null)
        else week.push({ day, level: byDay.get(day)?.level ?? 0, contributions: byDay.get(day)?.contributions ?? 0 })
        cursor.setDate(cursor.getDate() + 1)
      }
      grid.push(week)
    }

    const inRange = days.filter(([day, level]) => level > 0 && day >= first && day <= last)
    return {
      columns: grid,
      activeDays: inRange.length,
      contributions: inRange.reduce((sum, [, , count]) => sum + count, 0),
      totalContributions: days.reduce((sum, [, , count]) => sum + count, 0)
    }
  }, [feed, range])

  if (!feed || feed.days.length === 0) return null

  return (
    <div className={clsx('activity-gadget', variant === 'window' && 'is-window')}>
      <span className="activity-head">
        <strong>{feed.repositories}</strong> repositorios
        <span className="activity-sep">·</span>
        en GitHub desde <strong>{feed.since}</strong>
        <span className="activity-sep">·</span>
        <strong>{totalContributions}</strong> contribuciones
      </span>
      <span className="activity-tabs" role="tablist" aria-label="Periodo">
        <button type="button" role="tab" aria-selected={range === 'last'} className={clsx(range === 'last' && 'is-on')} onClick={() => setRange('last')}>
          Último año
        </button>
        {years.map(year => (
          <button key={year} type="button" role="tab" aria-selected={range === year} className={clsx(range === year && 'is-on')} onClick={() => setRange(year)}>
            {year}
          </button>
        ))}
      </span>
      <span className="activity-grid" aria-hidden>
        {columns.map((week, column) => (
          <span key={column} className="activity-week">
            {week.map((cell, row) => (
              <span
                key={row}
                className={cell ? `activity-cell l${cell.level}` : 'activity-cell is-empty'}
                title={cell ? `${cell.day}${cell.contributions ? ` · ${cell.contributions} contribuciones` : ''}` : undefined}
              />
            ))}
          </span>
        ))}
      </span>
      <span className="activity-foot">
        <span>
          <strong>{contributions}</strong> contribuciones y <strong>{activeDays}</strong> días activos en el periodo
        </span>
        <a href="https://github.com/EdvardKS" target="_blank" rel="noopener noreferrer">
          GitHub ↗
        </a>
      </span>
    </div>
  )
}
