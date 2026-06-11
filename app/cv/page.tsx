import { Desktop } from '@os/Desktop'
import { DeepLinkOpener } from '@os/DeepLinkOpener'

export const metadata = {
  title: 'CV — Edvard K.',
  description:
    'CV de Edvard Khachatryan Sahakyan: experiencia como Científico de datos, formación en la Universidad Alfonso X el Sabio (UAX), certificaciones (Udacity AWS) y skills (Python, SQL, Docker, MLOps).'
}

export default function Page() {
  return (<><Desktop /><DeepLinkOpener appId="cv" /></>)
}
