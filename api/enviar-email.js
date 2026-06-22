import nodemailer from 'nodemailer'

// Envia e-mail transacional via Gmail SMTP (App Password).
// Credenciais ficam em variáveis de ambiente do Vercel (nunca no navegador):
//   GMAIL_USER          → ex: italo.fontes2026@gmail.com
//   GMAIL_APP_PASSWORD  → senha de app de 16 caracteres gerada no Google
//
// Corpo esperado (POST JSON):
//   { to: string|string[], subject, text, attachments: [{ filename, content(base64) }] }
export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')

  if (req.method === 'OPTIONS') return res.status(200).end()
  if (req.method !== 'POST')   return res.status(405).json({ error: 'Method not allowed' })

  const user = process.env.GMAIL_USER
  const pass = process.env.GMAIL_APP_PASSWORD
  if (!user || !pass) {
    return res.status(500).json({ error: 'GMAIL_USER / GMAIL_APP_PASSWORD não configurados no Vercel' })
  }

  try {
    const { to, subject, text, attachments } = req.body || {}
    if (!to || !subject) return res.status(400).json({ error: 'Campos "to" e "subject" são obrigatórios' })

    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: { user, pass },
    })

    await transporter.sendMail({
      from:    `"WMS Consultoria" <${user}>`,
      to:      Array.isArray(to) ? to.join(', ') : to,
      subject,
      text:    text || '',
      attachments: (attachments || []).map(a => ({
        filename: a.filename,
        content:  a.content,
        encoding: 'base64',
      })),
    })

    return res.status(200).json({ ok: true })
  } catch (err) {
    console.error('[enviar-email]', err)
    return res.status(500).json({ error: err.message })
  }
}
