import type { AppManifest } from '@os/types'
import { ContactApp } from './ContactApp'

const manifest: AppManifest = {
  id: 'contact',
  title: 'Contacto',
  icon: 'mail',
  category: 'tool',
  defaultSize: { width: 520, height: 560 },
  singleton: true,
  deepLink: '/contact',
  description: 'Envíame un mensaje',
  Component: ContactApp
}

export default manifest
