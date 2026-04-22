'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { useT } from '@lib/i18n/config'

const schema = z.object({
  name: z.string().min(2).max(120),
  email: z.string().email().max(200),
  message: z.string().min(10).max(4000)
})
type FormData = z.infer<typeof schema>

export function ContactApp() {
  const t = useT()
  const [state, setState] = useState<'idle' | 'sending' | 'ok' | 'error'>('idle')
  const [errorMsg, setErrorMsg] = useState('')
  const { register, handleSubmit, formState: { errors }, reset } = useForm<FormData>({
    resolver: zodResolver(schema)
  })

  const onSubmit = async (data: FormData) => {
    setState('sending')
    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      })
      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        throw new Error(body.error ?? `HTTP ${res.status}`)
      }
      setState('ok')
      reset()
    } catch (e) {
      setErrorMsg(e instanceof Error ? e.message : String(e))
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
        <div style={{ fontSize: 48 }}>✅</div>
        <h2>{t('messageSent')}</h2>
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
          cursor: 'pointer'
        }}
      >
        {state === 'sending' ? `${t('send')}…` : t('send')}
      </button>
      {state === 'error' && <div style={err}>⚠️ {errorMsg}</div>}
    </form>
  )
}
