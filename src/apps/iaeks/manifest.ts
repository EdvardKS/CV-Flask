import type { AppManifest } from '@os/types'
import { ExternalAppStub } from '../_shared/ExternalAppStub'

const manifest: AppManifest = {
  id: 'iaeks',
  title: 'IAEKS',
  icon: 'iaeks',
  category: 'tool',
  defaultSize: { width: 400, height: 200 },
  externalUrl: 'https://iaeks.com',
  description: 'Mi negocio: soluciones de automatización, CRM e IA para pequeñas empresas y autónomos. Producción, despliegue y todo end-to-end.',
  Component: ExternalAppStub
}

export default manifest
