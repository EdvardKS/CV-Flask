export const ERROR_FIELDS = [
  'Doble_Falta',
  'Resto_Derecha_Fallado', 'Resto_Reves_Fallado',
  'Globo_Malo',
  'Error_Fondo_Derecha', 'Error_Fondo_Reves',
  'Bajada_Derecha_Error', 'Bajada_Reves_Error',
  'Posicionamiento_Fondo_Error',
  'Error_Volea_Derecha', 'Error_Volea_Reves',
  'Posicionamiento_Volea_Error', 'Tirar_Ficha_Error',
  'Bandeja_Error', 'Smash_Error'
] as const

export const SUCCESS_FIELDS = [
  'Winner_Derecha', 'Winner_Reves',
  'Resto_Ganador_Derecha', 'Resto_Ganador_Reves',
  'Globo_De_Oro', 'Chiquita_Ganadora', 'Bajada_De_Pared',
  'Remate_Finalizador',
  'Volea_Derecha_Ganadora', 'Volea_Reves_Ganadora',
  'Bandeja_Vibora_Definitiva', 'Volea_Bloqueo_Contraataque', 'Dormilona'
] as const

export type ErrorField = typeof ERROR_FIELDS[number]
export type SuccessField = typeof SUCCESS_FIELDS[number]

export const SUCCESS_WEIGHTS: Record<SuccessField, number> = {
  Winner_Derecha: 3.0, Winner_Reves: 3.0,
  Resto_Ganador_Derecha: 2.5, Resto_Ganador_Reves: 2.5,
  Globo_De_Oro: 2.0, Chiquita_Ganadora: 2.0, Bajada_De_Pared: 2.5,
  Remate_Finalizador: 3.0,
  Volea_Derecha_Ganadora: 3.0, Volea_Reves_Ganadora: 3.0,
  Bandeja_Vibora_Definitiva: 3.0, Volea_Bloqueo_Contraataque: 2.5,
  Dormilona: 2.5
}

export const ERROR_WEIGHTS: Record<ErrorField, number> = {
  Doble_Falta: 2.5,
  Resto_Derecha_Fallado: 2.5, Resto_Reves_Fallado: 2.5,
  Globo_Malo: 2.0,
  Error_Fondo_Derecha: 2.0, Error_Fondo_Reves: 2.0,
  Bajada_Derecha_Error: 2.0, Bajada_Reves_Error: 2.0,
  Posicionamiento_Fondo_Error: 1.5,
  Error_Volea_Derecha: 2.0, Error_Volea_Reves: 2.0,
  Posicionamiento_Volea_Error: 1.5, Tirar_Ficha_Error: 2.5,
  Bandeja_Error: 2.0, Smash_Error: 2.0
}

export const ERROR_LABELS: Record<ErrorField, string> = {
  Doble_Falta: 'Doble falta',
  Resto_Derecha_Fallado: 'Resto derecha',
  Resto_Reves_Fallado: 'Resto revés',
  Globo_Malo: 'Globo malo',
  Error_Fondo_Derecha: 'Fondo derecha',
  Error_Fondo_Reves: 'Fondo revés',
  Bajada_Derecha_Error: 'Bajada derecha',
  Bajada_Reves_Error: 'Bajada revés',
  Posicionamiento_Fondo_Error: 'Posicionamiento fondo',
  Error_Volea_Derecha: 'Volea derecha',
  Error_Volea_Reves: 'Volea revés',
  Posicionamiento_Volea_Error: 'Posicionamiento volea',
  Tirar_Ficha_Error: 'Tirar ficha',
  Bandeja_Error: 'Bandeja/Víbora',
  Smash_Error: 'Remate fallido'
}

export const SUCCESS_LABELS: Record<SuccessField, string> = {
  Winner_Derecha: 'Winner derecha',
  Winner_Reves: 'Winner revés',
  Resto_Ganador_Derecha: 'Resto ganador derecha',
  Resto_Ganador_Reves: 'Resto ganador revés',
  Globo_De_Oro: 'Globo de oro',
  Chiquita_Ganadora: 'Chiquita ganadora',
  Bajada_De_Pared: 'Bajada de pared',
  Remate_Finalizador: 'Remate finalizador',
  Volea_Derecha_Ganadora: 'Volea derecha ganadora',
  Volea_Reves_Ganadora: 'Volea revés ganadora',
  Bandeja_Vibora_Definitiva: 'Bandeja/Víbora definitiva',
  Volea_Bloqueo_Contraataque: 'Volea de bloqueo',
  Dormilona: 'Dormilona'
}

export const FIELD_LABELS: Record<string, string> = { ...ERROR_LABELS, ...SUCCESS_LABELS }

export type SetRow = Record<ErrorField | SuccessField, number>

export function emptySetRow(): SetRow {
  const row = {} as SetRow
  for (const f of ERROR_FIELDS) row[f] = 0
  for (const f of SUCCESS_FIELDS) row[f] = 0
  return row
}
