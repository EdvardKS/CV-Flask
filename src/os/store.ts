'use client'

import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import type { AppManifest, SnapRegion, WindowBounds, WindowState } from './types'

const TASKBAR_H = 40
const CASCADE_OFFSET = 28
const CASCADE_ORIGIN = { x: 120, y: 40 }

type Store = {
  windows: WindowState[]
  zTop: number
  openInstanceCount: Record<string, number>
  focusedId: string | null

  openApp: (manifest: AppManifest, params?: WindowState['params']) => string
  close: (id: string) => void
  focus: (id: string) => void
  minimize: (id: string) => void
  restore: (id: string) => void
  toggleMaximize: (id: string) => void
  snap: (id: string, region: SnapRegion) => void
  setBounds: (id: string, b: Partial<WindowBounds>) => void
  setParams: (id: string, params: WindowState['params']) => void
}

function viewport() {
  if (typeof window === 'undefined') return { w: 1440, h: 900 }
  return { w: window.innerWidth, h: window.innerHeight - TASKBAR_H }
}

function snapBounds(region: SnapRegion): WindowBounds {
  const { w, h } = viewport()
  const halfW = Math.floor(w / 2)
  const halfH = Math.floor(h / 2)
  switch (region) {
    case 'left':         return { x: 0,     y: 0,     width: halfW, height: h }
    case 'right':        return { x: halfW, y: 0,     width: w - halfW, height: h }
    case 'top':          return { x: 0,     y: 0,     width: w,     height: h }
    case 'top-left':     return { x: 0,     y: 0,     width: halfW, height: halfH }
    case 'top-right':    return { x: halfW, y: 0,     width: w - halfW, height: halfH }
    case 'bottom-left':  return { x: 0,     y: halfH, width: halfW, height: h - halfH }
    case 'bottom-right': return { x: halfW, y: halfH, width: w - halfW, height: h - halfH }
  }
}

function cascadePosition(count: number): { x: number; y: number } {
  const { w, h } = viewport()
  const step = count % 8
  return {
    x: Math.min(CASCADE_ORIGIN.x + step * CASCADE_OFFSET, Math.max(80, w - 400)),
    y: Math.min(CASCADE_ORIGIN.y + step * CASCADE_OFFSET, Math.max(40, h - 300))
  }
}

function clampToViewport(w: WindowState): WindowState {
  const vp = viewport()
  const width = Math.min(w.width, vp.w)
  const height = Math.min(w.height, vp.h)
  const x = Math.max(0, Math.min(w.x, vp.w - width))
  const y = Math.max(0, Math.min(w.y, vp.h - height))
  return { ...w, x, y, width, height }
}

export const useWM = create<Store>()(
  persist(
    (set, get) => ({
      windows: [],
      zTop: 10,
      openInstanceCount: {},
      focusedId: null,

      openApp: (manifest, params) => {
        const state = get()
        if (manifest.singleton) {
          const existing = state.windows.find(w => w.appId === manifest.id)
          if (existing) {
            get().restore(existing.id)
            get().focus(existing.id)
            if (params) get().setParams(existing.id, params)
            return existing.id
          }
        }
        const count = Object.values(state.openInstanceCount).reduce((a, b) => a + b, 0)
        const pos = cascadePosition(count)
        const id = `${manifest.id}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`
        const zIndex = state.zTop + 1
        const vp = viewport()
        const minW = manifest.minSize?.width ?? 320
        const minH = manifest.minSize?.height ?? 240
        // Responsive default: if the viewport is too narrow for a comfortable
        // default size, open the window maximized (phone/tablet portrait).
        const preferMaximized = vp.w < 820 || vp.h < 520
        const width = Math.max(minW, Math.min(manifest.defaultSize.width, vp.w - 24))
        const height = Math.max(minH, Math.min(manifest.defaultSize.height, vp.h - 24))
        const newWindow: WindowState = {
          id,
          appId: manifest.id,
          title: manifest.title,
          icon: manifest.icon,
          x: preferMaximized ? 0 : pos.x,
          y: preferMaximized ? 0 : pos.y,
          width: preferMaximized ? vp.w : width,
          height: preferMaximized ? vp.h : height,
          zIndex,
          minimized: false,
          maximized: preferMaximized,
          snapped: null,
          prevBounds: preferMaximized ? { x: pos.x, y: pos.y, width, height } : undefined,
          params
        }
        set({
          windows: [...state.windows, clampToViewport(newWindow)],
          zTop: zIndex,
          focusedId: id,
          openInstanceCount: {
            ...state.openInstanceCount,
            [manifest.id]: (state.openInstanceCount[manifest.id] ?? 0) + 1
          }
        })
        return id
      },

      close: (id) => {
        const state = get()
        const win = state.windows.find(w => w.id === id)
        if (!win) return
        const remaining = state.windows.filter(w => w.id !== id)
        const nextFocus = remaining.length
          ? [...remaining].sort((a, b) => b.zIndex - a.zIndex)[0].id
          : null
        set({
          windows: remaining,
          focusedId: state.focusedId === id ? nextFocus : state.focusedId,
          openInstanceCount: {
            ...state.openInstanceCount,
            [win.appId]: Math.max(0, (state.openInstanceCount[win.appId] ?? 1) - 1)
          }
        })
      },

      focus: (id) => {
        const state = get()
        const z = state.zTop + 1
        set({
          zTop: z,
          focusedId: id,
          windows: state.windows.map(w => w.id === id ? { ...w, zIndex: z, minimized: false } : w)
        })
      },

      minimize: (id) => set(state => ({
        windows: state.windows.map(w => w.id === id ? { ...w, minimized: true } : w),
        focusedId: state.focusedId === id ? null : state.focusedId
      })),

      restore: (id) => set(state => ({
        windows: state.windows.map(w => w.id === id ? { ...w, minimized: false } : w)
      })),

      toggleMaximize: (id) => {
        const state = get()
        const w = state.windows.find(x => x.id === id)
        if (!w) return
        if (w.maximized) {
          const prev = w.prevBounds ?? { x: 80, y: 60, width: 800, height: 600 }
          set({
            windows: state.windows.map(x => x.id === id
              ? { ...x, maximized: false, snapped: null, ...prev, prevBounds: undefined }
              : x)
          })
        } else {
          const vp = viewport()
          set({
            windows: state.windows.map(x => x.id === id
              ? { ...x, maximized: true, snapped: null,
                  prevBounds: { x: x.x, y: x.y, width: x.width, height: x.height },
                  x: 0, y: 0, width: vp.w, height: vp.h }
              : x)
          })
        }
      },

      snap: (id, region) => {
        const state = get()
        const w = state.windows.find(x => x.id === id)
        if (!w) return
        const bounds = snapBounds(region)
        set({
          windows: state.windows.map(x => x.id === id
            ? { ...x, snapped: region, maximized: region === 'top',
                prevBounds: x.snapped ? x.prevBounds : { x: x.x, y: x.y, width: x.width, height: x.height },
                ...bounds }
            : x)
        })
      },

      setBounds: (id, b) => set(state => ({
        windows: state.windows.map(w => w.id === id
          ? { ...w, ...b, snapped: null, maximized: false, prevBounds: undefined }
          : w)
      })),

      setParams: (id, params) => set(state => ({
        windows: state.windows.map(w => w.id === id ? { ...w, params } : w)
      }))
    }),
    {
      name: 'os:windows:v1',
      storage: createJSONStorage(() => (typeof window !== 'undefined' ? localStorage : undefined as unknown as Storage)),
      skipHydration: true,
      partialize: (s) => ({
        windows: s.windows.map(w => ({ ...w, minimized: false })),
        zTop: s.zTop,
        openInstanceCount: s.openInstanceCount
      }) as Partial<Store>,
      version: 1
    }
  )
)
