'use client'

import { create } from 'zustand'
import { persist } from 'zustand/middleware'

type UIStore = {
  notificationsOpen: boolean
  toggleNotifications: () => void
  setNotifications: (open: boolean) => void

  trayExpanded: boolean
  toggleTray: () => void
}

export const useUI = create<UIStore>()(
  persist(
    (set) => ({
      notificationsOpen: true,
      toggleNotifications: () => set(s => ({ notificationsOpen: !s.notificationsOpen })),
      setNotifications: (open) => set({ notificationsOpen: open }),

      trayExpanded: false,
      toggleTray: () => set(s => ({ trayExpanded: !s.trayExpanded }))
    }),
    { name: 'os:ui:v1' }
  )
)
