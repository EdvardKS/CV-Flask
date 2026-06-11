import { Desktop } from '@os/Desktop'
import { DeepLinkOpener } from '@os/DeepLinkOpener'

export const metadata = {
  title: 'Proyectos — Edvard K.',
  description:
    'Proyectos de Edvard Khachatryan Sahakyan: soluciones de IA/MLOps, data science y desarrollo web. Repos en GitHub (EdvardKS) y casos prácticos.'
}

export default function Page() {
  return (<><Desktop /><DeepLinkOpener appId="projects" /></>)
}
