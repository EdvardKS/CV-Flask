// @vitest-environment jsdom
//
// TDD — navegación (specs/quiz-area-and-motion/tdd.md, ciclo 4).
import { afterEach, describe, expect, it, vi } from 'vitest'
import { cleanup, render, screen } from '@testing-library/react'

vi.mock('next/navigation', () => ({ usePathname: () => '/quiz' }))
vi.mock('next/link', () => ({
  default: ({ href, children, ...rest }: { href: string; children: React.ReactNode }) =>
    <a href={href} {...rest}>{children}</a>
}))

import { UaxTopBar } from '../UaxTopBar'

afterEach(cleanup)

describe('UaxTopBar', () => {
  it('incluye «Conoce IAEKS.com» como enlace externo en pestaña nueva', () => {
    render(<UaxTopBar />)
    const link = screen.getByRole('link', { name: /conoce iaeks\.com/i })
    expect(link.getAttribute('href')).toBe('https://iaeks.com')
    expect(link.getAttribute('target')).toBe('_blank')
    expect(link.getAttribute('rel')).toContain('noopener')
  })

  it('«Área personal» apunta a /quiz/area-personal', () => {
    render(<UaxTopBar />)
    const link = screen.getByRole('link', { name: /área personal/i })
    expect(link.getAttribute('href')).toBe('/quiz/area-personal')
  })
})
