// @vitest-environment jsdom
//
// TDD — visor de imágenes (ver specs/quiz-image-lightbox/tdd.md, ciclo 4).
// Comportamiento de apertura/cierre del lightbox.
import { afterEach, describe, expect, it } from 'vitest'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { ZoomableImage } from '../ZoomableImage'

afterEach(cleanup)

describe('ZoomableImage', () => {
  it('muestra una miniatura accesible que actúa de botón', () => {
    render(<ZoomableImage src="/fig.jpg" alt="Tabla" />)
    const trigger = screen.getByRole('button', { name: /ampliar imagen/i })
    expect(trigger).toBeTruthy()
    expect(screen.queryByRole('dialog')).toBeNull()
  })

  it('abre el visor a pantalla completa al hacer clic', () => {
    render(<ZoomableImage src="/fig.jpg" alt="Tabla" />)
    fireEvent.click(screen.getByRole('button', { name: /ampliar imagen/i }))
    const dialog = screen.getByRole('dialog')
    expect(dialog).toBeTruthy()
    expect(screen.getByRole('button', { name: /acercar/i })).toBeTruthy()
    expect(screen.getByRole('button', { name: /cerrar/i })).toBeTruthy()
  })

  it('cierra con el botón ✕', () => {
    render(<ZoomableImage src="/fig.jpg" alt="Tabla" />)
    fireEvent.click(screen.getByRole('button', { name: /ampliar imagen/i }))
    fireEvent.click(screen.getByRole('button', { name: /cerrar/i }))
    expect(screen.queryByRole('dialog')).toBeNull()
  })

  it('cierra con la tecla Escape', () => {
    render(<ZoomableImage src="/fig.jpg" alt="Tabla" />)
    fireEvent.click(screen.getByRole('button', { name: /ampliar imagen/i }))
    fireEvent.keyDown(window, { key: 'Escape' })
    expect(screen.queryByRole('dialog')).toBeNull()
  })
})
