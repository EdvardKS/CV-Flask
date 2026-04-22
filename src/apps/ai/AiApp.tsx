'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { useLocale } from '@lib/i18n/config'

type Msg = { role: 'user' | 'assistant'; content: string }

const SUGGESTIONS_BY_LOCALE: Record<string, string[]> = {
  es: [
    '¿Qué experiencia tienes en IA?',
    '¿Qué proyectos has hecho?',
    '¿Cuál es tu formación?',
    '¿Qué tecnologías dominas?'
  ],
  en: [
    'What AI experience do you have?',
    'Which projects have you built?',
    "What's your education?",
    'Which technologies do you master?'
  ],
  hy: [
    'Ի՞նչ փորձ ունես ԲԻ-ում:',
    'Ի՞նչ նախագծեր ես արել:',
    'Ի՞նչ կրթություն ունես:',
    'Ի՞նչ տեխնոլոգիաներ գիտես:'
  ]
}

export function AiApp() {
  const locale = useLocale(s => s.locale)
  const [messages, setMessages] = useState<Msg[]>([])
  const [input, setInput] = useState('')
  const [streaming, setStreaming] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const abortRef = useRef<AbortController | null>(null)
  const endRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, streaming])

  const send = useCallback(async (text: string) => {
    const clean = text.trim()
    if (!clean || streaming !== null) return
    setError(null)
    const nextMessages: Msg[] = [...messages, { role: 'user', content: clean }]
    setMessages(nextMessages)
    setInput('')
    setStreaming('')
    const ctl = new AbortController()
    abortRef.current = ctl
    try {
      const res = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: nextMessages, locale }),
        signal: ctl.signal
      })
      if (!res.ok || !res.body) {
        const body = await res.text().catch(() => '')
        throw new Error(`HTTP ${res.status}: ${body.slice(0, 200)}`)
      }
      const reader = res.body.getReader()
      const dec = new TextDecoder('utf-8')
      let acc = ''
      while (true) {
        const { value, done } = await reader.read()
        if (done) break
        acc += dec.decode(value, { stream: true })
        setStreaming(acc)
      }
      setMessages(prev => [...prev, { role: 'assistant', content: acc }])
      setStreaming(null)
    } catch (e) {
      if ((e as Error).name === 'AbortError') {
        setStreaming(null)
        return
      }
      setError(e instanceof Error ? e.message : String(e))
      setStreaming(null)
    }
  }, [locale, messages, streaming])

  const stop = () => { abortRef.current?.abort() }
  const reset = () => { setMessages([]); setError(null) }

  const suggestions = SUGGESTIONS_BY_LOCALE[locale] ?? SUGGESTIONS_BY_LOCALE.es

  return (
    <div className="ai-chat">
      <div className="ai-msgs">
        {messages.length === 0 && (
          <div className="ai-empty">
            <div className="ai-sparkle" aria-hidden>
              <svg viewBox="0 0 24 24" width="36" height="36" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 3l1.8 4.7L18.5 9l-4.7 1.8L12 15l-1.8-4.7L5.5 9l4.7-1.3L12 3z"/>
                <path d="M19 15l.9 2.2L22 18l-2.1.9L19 21l-.9-2.1L16 18l2.1-.8L19 15z"/>
              </svg>
            </div>
            <h3>Chat IA sobre Edvard</h3>
            <p>La IA solo responde con información del CV. Prueba:</p>
            <div className="ai-suggestions">
              {suggestions.map(s => (
                <button key={s} onClick={() => send(s)} className="ai-suggestion">{s}</button>
              ))}
            </div>
          </div>
        )}
        {messages.map((m, i) => (
          <Bubble key={i} msg={m} />
        ))}
        {streaming !== null && (
          <Bubble msg={{ role: 'assistant', content: streaming || '…' }} streaming />
        )}
        <div ref={endRef} />
      </div>

      {error && <div className="ai-error">⚠ {error}</div>}

      <form
        className="ai-input-row"
        onSubmit={e => { e.preventDefault(); send(input) }}
      >
        <textarea
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => {
            if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(input) }
          }}
          placeholder="Pregunta sobre Edvard (Enter envía · Shift+Enter salto)"
          rows={2}
          disabled={streaming !== null}
        />
        {streaming !== null ? (
          <button type="button" onClick={stop} className="ai-send ai-stop">■</button>
        ) : (
          <button type="submit" className="ai-send" disabled={!input.trim()}>▶</button>
        )}
      </form>
      {messages.length > 0 && streaming === null && (
        <button onClick={reset} className="ai-reset">Nueva conversación</button>
      )}
    </div>
  )
}

function Bubble({ msg, streaming }: { msg: Msg; streaming?: boolean }) {
  return (
    <div className={`ai-bubble ai-bubble-${msg.role}${streaming ? ' is-streaming' : ''}`}>
      {msg.content}
    </div>
  )
}
