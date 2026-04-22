'use client'

// Placeholder body for manifests that are only external links.
// The desktop icon / start menu will intercept clicks and open externalUrl
// directly, so this component is rarely rendered. Kept as a safety net.
export function ExternalAppStub() {
  return (
    <div style={{ padding: 24, textAlign: 'center', color: '#555' }}>
      <p>Esta app abre un enlace externo en una pestaña nueva.</p>
    </div>
  )
}
