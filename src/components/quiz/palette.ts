/**
 * Paleta "Moodle UAX" — fuente única de verdad para los colores del quiz.
 * Imita el aula virtual de la Universidad Alfonso X el Sabio para que los
 * tests se vean como el examen real. Los colores por asignatura (subject.color)
 * se usan SOLO como acento (borde de tarjeta, icono, badge), nunca como base.
 */
export const MOODLE = {
  page: '#f0f2f5',
  surface: '#ffffff',
  border: '#dfe3e8',
  navy: '#0a2d5e',
  ink: '#1a2733',
  muted: '#5b6b7b',
  link: '#1f6fb2',
  magenta: '#e6007e',
  /** Caja azul del enunciado (qtext de Moodle) */
  qbody: '#e8f2fc',
  qbodyBorder: '#cfe2f5',
  /** Feedback correcto (verde Moodle/Bootstrap) */
  okBg: '#dff0d8',
  okBorder: '#b7dfb9',
  okInk: '#2f6b2f',
  /** Feedback incorrecto (rojo Moodle/Bootstrap) */
  errBg: '#f2dede',
  errBorder: '#e4b9b9',
  errInk: '#a33a3a',
  /** Feedback general / pista (crema) */
  noteBg: '#fdf3e3',
  noteBorder: '#f0d9a8',
  noteInk: '#7a5a1e'
} as const

export type SubjectAccent = string
