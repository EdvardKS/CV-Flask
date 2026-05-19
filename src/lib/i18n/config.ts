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

export const APP_DESCRIPTIONS: Record<Locale, Record<string, string>> = {
  es: {
    cv: 'Currículum completo: resumen, experiencia, educación y habilidades',
    ai: 'Pregúntale a la IA sobre mi perfil — solo responde en base a mis datos',
    projects: 'Lista de proyectos personales y profesionales',
    quiz: 'Exámenes tipo test (ECSO, SSOO, IA, Inglés…)',
    padel: 'Dashboard de errores, aciertos y score por set',
    contact: 'Envíame un mensaje',
    iaeks: 'Mi negocio: soluciones de automatización, CRM e IA para pequeñas empresas y autónomos. Producción, despliegue y todo end-to-end.',
    linkedin: 'Mi perfil profesional en LinkedIn',
    github: 'Mi código y proyectos open source en GitHub',
    about: 'Qué es este escritorio y cómo funciona'
  },
  en: {
    cv: 'Full résumé: summary, work experience, education and skills',
    ai: 'Ask the AI about my profile — it only answers based on my data',
    projects: 'List of personal and professional projects',
    quiz: 'Multiple-choice exams (ECSO, OS, AI, English…)',
    padel: 'Dashboard of errors, hits and score per set',
    contact: 'Send me a message',
    iaeks: 'My business: automation, CRM and AI solutions for small companies and freelancers. Production, deployment and full end-to-end delivery.',
    linkedin: 'My professional profile on LinkedIn',
    github: 'My code and open-source projects on GitHub',
    about: 'What this desktop is and how it works'
  },
  hy: {
    cv: 'Ամբողջական ինքնակենսագրություն՝ ամփոփում, փորձ, կրթություն, հմտություններ',
    ai: 'Հարցրու ԱԲ-ին իմ պրոֆիլի մասին — պատասխանում է միայն իմ տվյալների հիման վրա',
    projects: 'Անձնական և մասնագիտական նախագծերի ցանկ',
    quiz: 'Թեստային քննություններ (ECSO, ՕՀ, ԱԲ, Անգլերեն…)',
    padel: 'Սխալների, հաջող հարվածների և սեթերի վահանակ',
    contact: 'Ուղարկիր ինձ հաղորդագրություն',
    iaeks: 'Իմ բիզնեսը՝ ավտոմատացման, CRM և ԱԲ լուծումներ փոքր ընկերությունների և ինքնազբաղվածների համար։ Արտադրություն, տեղակայում և ամբողջական end-to-end մատուցում։',
    linkedin: 'Իմ մասնագիտական պրոֆիլը LinkedIn-ում',
    github: 'Իմ կոդը և open-source նախագծերը GitHub-ում',
    about: 'Ի՞նչ է այս աշխատասեղանը և ինչպե՞ս է աշխատում'
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
