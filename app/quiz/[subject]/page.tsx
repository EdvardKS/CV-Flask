import { Desktop } from '@os/Desktop'
import { DeepLinkOpener } from '@os/DeepLinkOpener'

export async function generateMetadata({ params }: { params: Promise<{ subject: string }> }) {
  const { subject } = await params
  return { title: `Quiz ${subject} — Edvard K.` }
}

export default async function Page({ params }: { params: Promise<{ subject: string }> }) {
  const { subject } = await params
  return (<><Desktop /><DeepLinkOpener appId="quiz" params={{ subject }} /></>)
}
