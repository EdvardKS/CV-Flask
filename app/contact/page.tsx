import { Desktop } from '@os/Desktop'
import { DeepLinkOpener } from '@os/DeepLinkOpener'

export const metadata = {
  title: 'Contacto — Edvard K.',
  description:
    'Contacta con Edvard Khachatryan Sahakyan, Científico de datos e Ingeniero Informático (UAX). Disponible para proyectos de IA, data science y consultoría.'
}

export default function Page() {
  return (<><Desktop /><DeepLinkOpener appId="contact" /></>)
}
