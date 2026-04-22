import nodemailer from 'nodemailer'

export type ContactPayload = {
  name: string
  email: string
  message: string
}

let transporter: nodemailer.Transporter | null = null
function getTransporter() {
  if (transporter) return transporter
  const host = process.env.SMTP_HOST
  const port = Number(process.env.SMTP_PORT ?? 587)
  const user = process.env.SMTP_USER
  const pass = process.env.SMTP_PASS
  if (!host || !user || !pass) {
    throw new Error('SMTP not configured (SMTP_HOST / SMTP_USER / SMTP_PASS missing)')
  }
  transporter = nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: { user, pass }
  })
  return transporter
}

export async function sendContactEmail(payload: ContactPayload) {
  const to = process.env.CONTACT_RECIPIENT ?? process.env.SMTP_USER
  if (!to) throw new Error('CONTACT_RECIPIENT not configured')
  const t = getTransporter()
  await t.sendMail({
    from: `"CV Portfolio" <${process.env.SMTP_USER}>`,
    to,
    replyTo: payload.email,
    subject: `[CV] Nuevo mensaje de ${payload.name}`,
    text: `De: ${payload.name} <${payload.email}>\n\n${payload.message}`,
    html: `<p><strong>De:</strong> ${escapeHtml(payload.name)} &lt;${escapeHtml(payload.email)}&gt;</p><p style="white-space:pre-wrap">${escapeHtml(payload.message)}</p>`
  })
}

function escapeHtml(s: string) {
  return s.replace(/[&<>"']/g, c => ({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;' })[c]!)
}
