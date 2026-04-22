import type { AppManifest } from '@os/types'
import { AiApp } from './AiApp'

const manifest: AppManifest = {
  id: 'ai',
  title: 'Chat IA · Edvard',
  icon: 'ai',
  category: 'tool',
  defaultSize: { width: 520, height: 640 },
  minSize: { width: 380, height: 440 },
  singleton: true,
  deepLink: '/ai',
  description: 'Pregúntale a la IA sobre mi perfil — solo responde en base a mis datos',
  Component: AiApp
}

export default manifest
