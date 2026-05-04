import type { ComponentType } from 'react'

export type Locale = 'es' | 'en' | 'hy'

export type SnapRegion =
  | 'left' | 'right' | 'top'
  | 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right'

export type WindowBounds = { x: number; y: number; width: number; height: number }

export type WindowState = {
  id: string           // unique instance id
  appId: string        // manifest id
  title: string
  icon: string
  x: number
  y: number
  width: number
  height: number
  zIndex: number
  minimized: boolean
  maximized: boolean
  snapped: SnapRegion | null
  prevBounds?: WindowBounds
  params?: Record<string, string | number | boolean>
}

export type AppCategory = 'cv' | 'mini-project' | 'tool' | 'system'

export type AppManifest = {
  id: string
  title: string
  icon: string
  category: AppCategory
  defaultSize: { width: number; height: number }
  minSize?: { width: number; height: number }
  singleton?: boolean
  deepLink?: string
  description?: string
  externalUrl?: string       // If set, double-click opens this URL in a new tab (no window).
  standaloneRoute?: string   // If set, double-click navigates to this in-app route instead of opening a window.
  Component: ComponentType<{ params?: WindowState['params'] }>
}
