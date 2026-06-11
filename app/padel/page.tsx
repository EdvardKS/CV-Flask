import { Desktop } from '@os/Desktop'
import { DeepLinkOpener } from '@os/DeepLinkOpener'

export const metadata = {
  title: 'Padel Scout — Edvard K.',
  description:
    'Padel Scout: proyecto de análisis de datos de pádel de Edvard Khachatryan Sahakyan. Estadísticas y scouting de jugadores con ciencia de datos.'
}

export default function Page() {
  return (<><Desktop /><DeepLinkOpener appId="padel" /></>)
}
