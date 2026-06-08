'use client'

import { useReducedMotion, type TargetAndTransition, type Transition, type Variants } from 'framer-motion'

/** Springs con física para un movimiento expresivo pero asentado (cinematográfico). */
export const spring: Transition = { type: 'spring', stiffness: 260, damping: 26, mass: 0.9 }
export const springSnappy: Transition = { type: 'spring', stiffness: 440, damping: 30 }

/** Contenedor que escalona la entrada de sus hijos. */
export const containerVariants: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.07, delayChildren: 0.05 } }
}

/** Cada hijo entra subiendo, con leve escala y desvanecido. */
export const itemVariants: Variants = {
  hidden: { opacity: 0, y: 28, scale: 0.96 },
  show: { opacity: 1, y: 0, scale: 1, transition: spring }
}

/** Entrada de una sección/página completa. */
export const sectionVariants: Variants = {
  hidden: { opacity: 0, y: 18 },
  show: { opacity: 1, y: 0, transition: { ...spring, staggerChildren: 0.07, delayChildren: 0.04 } }
}

const NEUTRAL_CONTAINER: Variants = { hidden: {}, show: {} }
const NEUTRAL_ITEM: Variants = { hidden: { opacity: 1 }, show: { opacity: 1 } }

export type MotionPreset = {
  reduce: boolean
  container: Variants
  item: Variants
  section: Variants
  spring: Transition
  hover: TargetAndTransition
  tap: TargetAndTransition
}

/**
 * Devuelve los presets respetando `prefers-reduced-motion`: si el usuario lo
 * pide, las variantes son neutras (sin desplazamiento) y las interacciones se
 * anulan. Úsalo en componentes cliente.
 */
export function useMotionPreset(): MotionPreset {
  const reduce = !!useReducedMotion()
  if (reduce) {
    return {
      reduce, container: NEUTRAL_CONTAINER, item: NEUTRAL_ITEM, section: NEUTRAL_CONTAINER,
      spring: { duration: 0 }, hover: {}, tap: {}
    }
  }
  return {
    reduce,
    container: containerVariants,
    item: itemVariants,
    section: sectionVariants,
    spring,
    hover: { y: -6, scale: 1.025, transition: springSnappy },
    tap: { scale: 0.97, transition: springSnappy }
  }
}
