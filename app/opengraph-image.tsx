import { ImageResponse } from 'next/og'
import { readFile } from 'node:fs/promises'
import { join } from 'node:path'

export const runtime = 'nodejs'
export const alt = 'Edvard Khachatryan Sahakyan — Científico de datos'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

export default async function OpengraphImage() {
  const photo = await readFile(join(process.cwd(), 'public/assets/photos/file.jpg'))
  const photoSrc = `data:image/jpeg;base64,${photo.toString('base64')}`

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '70px 80px',
          background: 'linear-gradient(135deg, #0a246a 0%, #245edc 55%, #3c82e0 100%)',
          fontFamily: 'Tahoma, Geneva, Verdana, sans-serif',
          color: '#ffffff'
        }}
      >
        <div style={{ display: 'flex', flexDirection: 'column', maxWidth: 640 }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              fontSize: 26,
              letterSpacing: 2,
              opacity: 0.85,
              marginBottom: 18
            }}
          >
            edvardks.com
          </div>
          <div style={{ display: 'flex', fontSize: 70, fontWeight: 700, lineHeight: 1.05 }}>
            Edvard Khachatryan Sahakyan
          </div>
          <div
            style={{
              display: 'flex',
              marginTop: 26,
              fontSize: 36,
              fontWeight: 600,
              color: '#22d3ee'
            }}
          >
            Científico de datos · Data Scientist
          </div>
          <div style={{ display: 'flex', marginTop: 12, fontSize: 30, opacity: 0.92 }}>
            Ingeniero Informático en formación (UAX) · Madrid
          </div>
        </div>
        <div
          style={{
            display: 'flex',
            width: 360,
            height: 360,
            borderRadius: 24,
            overflow: 'hidden',
            border: '6px solid rgba(255,255,255,0.85)',
            boxShadow: '0 20px 60px rgba(0,0,0,0.45)'
          }}
        >
          <img
            src={photoSrc}
            width={360}
            height={360}
            style={{ width: 360, height: 360, objectFit: 'cover' }}
          />
        </div>
      </div>
    ),
    { ...size }
  )
}
