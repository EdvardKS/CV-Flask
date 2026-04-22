'use client'

import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Locale } from '@os/types'

type UIStrings = Record<Locale, Record<string, string>>

export const UI: UIStrings = {
  es: {
    open: 'Abrir',
    close: 'Cerrar',
    minimize: 'Minimizar',
    maximize: 'Maximizar',
    loading: 'Cargando…',
    send: 'Enviar',
    name: 'Nombre',
    email: 'Email',
    message: 'Mensaje',
    messageSent: '¡Mensaje enviado!',
    quizStart: 'Empezar',
    quizRetry: 'Reintentar',
    quizNext: 'Siguiente',
    quizPrevious: 'Anterior',
    quizFinish: 'Terminar',
    score: 'Puntuación',
    correct: 'Aciertos',
    incorrect: 'Fallos',
    unanswered: 'Sin responder',
    experience: 'Experiencia laboral',
    education: 'Educación',
    skills: 'Habilidades',
    projects: 'Proyectos',
    about: 'Sobre mí',
    contact: 'Contacto',
    quiz: 'Quiz',
    padel: 'Padel Scout'
  },
  en: {
    open: 'Open', close: 'Close', minimize: 'Minimize', maximize: 'Maximize',
    loading: 'Loading…', send: 'Send', name: 'Name', email: 'Email',
    message: 'Message', messageSent: 'Message sent!',
    quizStart: 'Start', quizRetry: 'Retry', quizNext: 'Next', quizPrevious: 'Previous',
    quizFinish: 'Finish', score: 'Score', correct: 'Correct', incorrect: 'Wrong',
    unanswered: 'Unanswered', experience: 'Work experience', education: 'Education',
    skills: 'Skills', projects: 'Projects', about: 'About me', contact: 'Contact',
    quiz: 'Quiz', padel: 'Padel Scout'
  },
  hy: {
    open: 'Բացել', close: 'Փակել', minimize: 'Ծալել', maximize: 'Մեծացնել',
    loading: 'Բեռնում…', send: 'Ուղարկել', name: 'Անուն', email: 'Էլ. փոստ',
    message: 'Հաղորդագրություն', messageSent: 'Ուղարկվեց!',
    quizStart: 'Սկսել', quizRetry: 'Կրկնել', quizNext: 'Հաջորդ', quizPrevious: 'Նախորդ',
    quizFinish: 'Ավարտել', score: 'Միավոր', correct: 'Ճիշտ', incorrect: 'Սխալ',
    unanswered: 'Չպատասխանված', experience: 'Փորձ', education: 'Կրթություն',
    skills: 'Հմտություններ', projects: 'Ծրագրեր', about: 'Ինձ մասին', contact: 'Կապ',
    quiz: 'Թեստ', padel: 'Padel Scout'
  }
}

type I18nStore = {
  locale: Locale
  setLocale: (l: Locale) => void
}

export const useLocale = create<I18nStore>()(
  persist(
    (set) => ({
      locale: 'es',
      setLocale: (l) => set({ locale: l })
    }),
    { name: 'os:locale:v1' }
  )
)

export function useT() {
  const locale = useLocale(s => s.locale)
  return (key: keyof (typeof UI)['es']) => UI[locale][key] ?? UI.es[key] ?? String(key)
}
