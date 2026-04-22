import { Desktop } from '@os/Desktop'
import { DeepLinkOpener } from '@os/DeepLinkOpener'

export const metadata = { title: 'Quiz — Edvard K.' }

export default function Page() {
  return (<><Desktop /><DeepLinkOpener appId="quiz" /></>)
}
