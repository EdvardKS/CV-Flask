import { Desktop } from '@os/Desktop'
import { DeepLinkOpener } from '@os/DeepLinkOpener'

export const metadata = { title: 'Contacto — Edvard K.' }

export default function Page() {
  return (<><Desktop /><DeepLinkOpener appId="contact" /></>)
}
