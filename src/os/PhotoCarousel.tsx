'use client'

import { useWM } from './store'
import { APPS_BY_ID } from '@apps/_registry'

const PHOTOS = [
  { src: '/assets/photos/edvard-3.jpg', label: 'Edvard Khachatryan Sahakyan' }
]

export function PhotoCarousel() {
  const openApp = useWM(s => s.openApp)

  const openCV = () => {
    const m = APPS_BY_ID.cv
    if (m) openApp(m)
  }

  return (
    <div className="photo-carousel" role="region" aria-label="Fotos de Edvard">
      <span className="photo-carousel-label">Ponle cara al proyecto · scroll →</span>
      <div className="photo-carousel-track">
        {PHOTOS.map((p, i) => (
          <button
            key={i}
            className="photo-card"
            onClick={openCV}
            title="Abrir mi CV"
            aria-label={`Foto ${p.label} — abrir CV`}
          >
            <img src={p.src} alt={`${p.label} — Científico de datos`} loading="lazy" width={180} height={180} />
            <span className="photo-card-label">{p.label}</span>
          </button>
        ))}
      </div>
    </div>
  )
}
