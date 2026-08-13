import nodemailer from 'nodemailer'

export type ContactPayload = {
  name: string
  email: string
  message: string
}

// From must be *@mail.iaeks.com for the relay's OpenDKIM to sign.
const FROM = process.env.SMTP_FROM ?? 'web@mail.iaeks.com'

let transporter: nodemailer.Transporter | null = null
function getTransporter() {
  if (transporter) return transporter
  const host = process.env.SMTP_HOST
  const port = Number(process.env.SMTP_PORT ?? 25)
  const user = process.env.SMTP_USER
  const pass = process.env.SMTP_PASS
  if (!host) {
    throw new Error('SMTP not configured (SMTP_HOST missing)')
  }
  // Auth-less local relay: omit auth + skip TLS when no user is set.
  transporter = nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    ignoreTLS: !user,
    ...(user ? { auth: { user, pass } } : {})
  })
  return transporter
}

export async function sendContactEmail(payload: ContactPayload) {
  const to = process.env.CONTACT_RECIPIENT ?? 'info@edvardks.com'
  const t = getTransporter()
  await t.sendMail({
    from: `"Web edvardks.com" <${FROM}>`,
    to,
    replyTo: payload.email,
    subject: `[Web] Nuevo mensaje de ${payload.name}`,
    text: `De: ${payload.name} <${payload.email}>\n\n${payload.message}`,
    html: `<p><strong>De:</strong> ${escapeHtml(payload.name)} &lt;${escapeHtml(payload.email)}&gt;</p><p style="white-space:pre-wrap">${escapeHtml(payload.message)}</p>`
  })
}

// Acknowledgement back to the person who wrote in.
export async function sendContactAck(payload: ContactPayload) {
  const t = getTransporter()
  await t.sendMail({
    from: `"Edvard KS" <${FROM}>`,
    to: payload.email,
    subject: 'Hemos recibido tu mensaje',
    text: `Hola ${payload.name},\n\nGracias por escribir. He recibido tu mensaje y te responderé lo antes posible.\n\nTu mensaje:\n${payload.message}\n\nUn saludo,\nEdvard KS`,
    html: `<p>Hola ${escapeHtml(payload.name)},</p><p>Gracias por escribir. He recibido tu mensaje y te responderé lo antes posible.</p><p style="color:#666"><em>Tu mensaje:</em></p><p style="white-space:pre-wrap;color:#666">${escapeHtml(payload.message)}</p><p>Un saludo,<br>Edvard KS</p>`
  })
}

function escapeHtml(s: string) {
  return s.replace(/[&<>"']/g, c => ({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;' })[c]!)
}
