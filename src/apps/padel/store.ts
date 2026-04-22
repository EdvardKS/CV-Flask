'use client'

import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { emptySetRow, type SetRow } from '@lib/padel/constants'

export type PadelMatch = {
  id: string
  player: string
  createdAt: number
  sets: SetRow[]
}

type State = {
  matches: PadelMatch[]
  currentId: string | null
  newMatch: (player: string) => string
  deleteMatch: (id: string) => void
  selectMatch: (id: string | null) => void
  addSet: (matchId: string) => void
  updateSet: (matchId: string, setIndex: number, row: SetRow) => void
  removeSet: (matchId: string, setIndex: number) => void
}

export const usePadel = create<State>()(
  persist(
    (set, get) => ({
      matches: [],
      currentId: null,

      newMatch: (player) => {
        const id = `m-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`
        const m: PadelMatch = {
          id,
          player: player.trim() || 'Jugador',
          createdAt: Date.now(),
          sets: [emptySetRow()]
        }
        set(s => ({ matches: [m, ...s.matches], currentId: id }))
        return id
      },

      deleteMatch: (id) => set(s => ({
        matches: s.matches.filter(m => m.id !== id),
        currentId: s.currentId === id ? null : s.currentId
      })),

      selectMatch: (id) => set({ currentId: id }),

      addSet: (matchId) => set(s => ({
        matches: s.matches.map(m => m.id === matchId ? { ...m, sets: [...m.sets, emptySetRow()] } : m)
      })),

      updateSet: (matchId, setIndex, row) => set(s => ({
        matches: s.matches.map(m => m.id === matchId
          ? { ...m, sets: m.sets.map((r, i) => i === setIndex ? row : r) }
          : m)
      })),

      removeSet: (matchId, setIndex) => set(s => ({
        matches: s.matches.map(m => m.id === matchId
          ? { ...m, sets: m.sets.filter((_, i) => i !== setIndex) }
          : m)
      }))
    }),
    { name: 'padel:matches:v1' }
  )
)
