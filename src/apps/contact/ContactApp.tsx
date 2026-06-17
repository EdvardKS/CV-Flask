'use client'

import { useRef, useState } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { useT } from '@lib/i18n/config'

// No email address is ever rendered in the markup — it lives only on the server
// (CONTACT_RECIPIENT). The form POSTs to /api/contact; bots can't harvest it.

const schema = z.object({
  name: z.string().min(2).max(120),
  email: z.string().email().max(200),
  message: z.string().min(10).max(4000)
})
type FormData = z.infer<typeof schema>

export function ContactApp() {
  const t = useT()
  const [state, setState] = useState<'idle' | 'sending' | 'ok' | 'error'>('idle')
  const hpRef = useRef<HTMLInputElement>(null)         // honeypot — must stay empty
  const { register, handleSubmit, formState: { errors }, reset } = useForm<FormData>({
    resolver: zodResolver(schema)
  })

  const onSubmit = async (data: FormData) => {
    setState('sending')
    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...data, company: hpRef.current?.value || '' })
      })
      if (!res.ok) throw new Error('send failed')
      setState('ok')
      reset()
      if (hpRef.current) hpRef.current.value = ''
    } catch {
      setState('error')
    }
  }

  const input: React.CSSProperties = {
    width: '100%', padding: 6, border: '1px solid #888', fontFamily: 'inherit', fontSize: 13, boxSizing: 'border-box'
  }
  const label: React.CSSProperties = { display: 'block', fontSize: 12, marginBottom: 3, fontWeight: 'bold' }
  const err: React.CSSProperties = { color: '#c00', fontSize: 11, marginTop: 2 }

  if (state === 'ok') {
    return (
      <div style={{ textAlign: 'center', padding: 40 }}>
        <div style={{ fontSize: 48 }}>📧</div>
        <h2>{t('messageSent')}</h2>
        <p style={{ fontSize: 12, color: '#444' }}>
          Te he enviado una confirmación por email. Te responderé lo antes posible.
        </p>
        <button onClick={() => setState('idle')}>OK</button>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div>
        <label style={label}>{t('name')}</label>
        <input {...register('name')} style={input} autoComplete="name" />
        {errors.name && <div style={err}>{errors.name.message}</div>}
      </div>
      <div>
        <label style={label}>{t('email')}</label>
        <input type="email" {...register('email')} style={input} autoComplete="email" />
        {errors.email && <div style={err}>{errors.email.message}</div>}
      </div>
      <div>
        <label style={label}>{t('message')}</label>
        <textarea {...register('message')} style={{ ...input, minHeight: 140, resize: 'vertical' }} />
        {errors.message && <div style={err}>{errors.message.message}</div>}
      </div>
      {/* honeypot — invisible to humans; bots that fill it get silently dropped */}
      <input ref={hpRef} type="text" name="company" tabIndex={-1} autoComplete="off" aria-hidden="true"
        style={{ position: 'absolute', left: '-9999px', width: 1, height: 1, opacity: 0 }} />
      {state === 'error' && (
        <div style={err}>No se pudo enviar. Inténtalo de nuevo en unos minutos.</div>
      )}
      <button
        type="submit"
        disabled={state === 'sending'}
        style={{
          padding: '8px 16px',
          background: 'linear-gradient(180deg, #3a6ea5, #1941a5)',
          color: '#fff',
          border: '1px solid #1941a5',
          borderRadius: 3,
          fontWeight: 'bold',
          cursor: state === 'sending' ? 'wait' : 'pointer',
          opacity: state === 'sending' ? 0.7 : 1
        }}
      >
        {state === 'sending' ? '…' : t('send')}
      </button>
    </form>
  )
}
