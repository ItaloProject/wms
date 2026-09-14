import { createClient } from '@supabase/supabase-js'
import { S3Client, GetObjectCommand } from '@aws-sdk/client-s3'
import nodemailer from 'nodemailer'

// Processa a fila de e-mails agendados. Chamado pelo cron do Worker a cada 5 min.
//
// A fila vive no Supabase (não mais no localStorage), então dispara no horário
// mesmo com o navegador fechado. Cada agendamento é reivindicado com um UPDATE
// condicional (status pendente → enviando): se duas execuções concorrerem, só
// uma altera a linha e a outra pula — é isso que garante envio único.

const env = (...nomes) => nomes.map(n => process.env[n]).find(Boolean)

// SUPABASE_URL pode reaproveitar a var do frontend (mesmo valor). A service
// role key NUNCA existiu no projeto (é sensível, não pode ir no frontend) —
// precisa ser criada do zero nas env vars da Vercel.
const SUPABASE_URL = env('SUPABASE_URL', 'VITE_SUPABASE_URL')
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

const R2_BUCKET     = env('R2_BUCKET_NAME', 'VITE_R2_BUCKET_NAME')
const R2_ACCOUNT_ID = env('R2_ACCOUNT_ID', 'VITE_R2_ACCOUNT_ID')
const R2_KEY_ID     = env('R2_ACCESS_KEY_ID', 'VITE_R2_ACCESS_KEY_ID')
const R2_SECRET     = env('R2_SECRET_ACCESS_KEY', 'VITE_R2_SECRET_ACCESS_KEY')

let _s3 = null
function s3() {
  if (!_s3) {
    _s3 = new S3Client({
      region: 'auto',
      endpoint: `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
      credentials: { accessKeyId: R2_KEY_ID, secretAccessKey: R2_SECRET },
    })
  }
  return _s3
}

async function anexosDoProcesso(supabase, processoId, empresa) {
  let docs = []
  if (processoId) {
    const { data } = await supabase.from('documentos').select('nome, r2_key')
      .eq('processo_id', processoId).order('created_at')
    docs = data || []
  } else if (empresa && empresa !== '—') {
    const { data } = await supabase.from('documentos').select('nome, r2_key')
      .ilike('empresa', empresa).order('created_at')
    docs = data || []
  }

  const attachments = []
  for (const doc of docs) {
    if (!doc.r2_key) continue
    try {
      const obj = await s3().send(new GetObjectCommand({ Bucket: R2_BUCKET, Key: doc.r2_key }))
      const buf = Buffer.from(await obj.Body.transformToByteArray())
      attachments.push({ filename: doc.nome, content: buf.toString('base64'), encoding: 'base64' })
    } catch (err) {
      console.error('[processar-agendados] anexo falhou:', doc.r2_key, err.message)
    }
  }
  return attachments
}

export default async function handler(req, res) {
  const segredo = process.env.CRON_SECRET
  const enviado = req.headers.authorization?.replace(/^Bearer\s+/i, '') || req.query?.key
  if (!segredo || enviado !== segredo) {
    return res.status(401).json({ error: 'Não autorizado' })
  }

  const user = process.env.GMAIL_USER
  const pass = process.env.GMAIL_APP_PASSWORD
  if (!user || !pass) {
    return res.status(500).json({ error: 'GMAIL_USER / GMAIL_APP_PASSWORD não configurados' })
  }
  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    return res.status(500).json({ error: 'SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY não configurados na Vercel' })
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

  // Devolve à fila o que ficou preso em 'enviando' por execução interrompida.
  await supabase.rpc('destravar_emails_agendados').catch(() => {})

  const { data: fila, error } = await supabase
    .from('emails_agendados')
    .select('*')
    .eq('status', 'pendente')
    .lte('data_hora', new Date().toISOString())
    .order('data_hora')
    .limit(20)

  if (error) return res.status(500).json({ error: error.message })
  if (!fila?.length) return res.status(200).json({ ok: true, enviados: 0, processados: 0 })

  const transporter = nodemailer.createTransport({ service: 'gmail', auth: { user, pass } })
  let enviados = 0
  const erros = []

  for (const ag of fila) {
    // Claim atômico: só quem alterar a linha de 'pendente' para 'enviando' envia.
    const { data: claim } = await supabase
      .from('emails_agendados')
      .update({ status: 'enviando', iniciado_em: new Date().toISOString() })
      .eq('id', ag.id)
      .eq('status', 'pendente')
      .select('id')
    if (!claim?.length) continue

    try {
      const attachments = await anexosDoProcesso(supabase, ag.processo_id, ag.empresa)
      const info = await transporter.sendMail({
        from: `"WMS Consultoria" <${user}>`,
        to: ag.para,
        subject: ag.assunto,
        text: ag.mensagem || '',
        attachments,
      })
      console.log('[processar-agendados] enviado:', ag.assunto, info.messageId)

      await supabase.from('emails_agendados')
        .update({ status: 'enviado', enviado_em: new Date().toISOString(), erro: null })
        .eq('id', ag.id)

      if (ag.processo_id != null) {
        await supabase.from('emails_enviados').insert({
          processo_id: ag.processo_id, empresa: ag.empresa || '',
          para: ag.para || '', assunto: ag.assunto || '',
        })
      }
      enviados++
    } catch (err) {
      // Fica em 'erro' e não volta para a fila: reenvio automático às cegas pode
      // duplicar quando a falha foi no retorno, não no envio.
      console.error('[processar-agendados] falhou:', ag.assunto, err.message)
      await supabase.from('emails_agendados')
        .update({ status: 'erro', erro: err.message }).eq('id', ag.id)
      erros.push({ assunto: ag.assunto, erro: err.message })
    }
  }

  return res.status(200).json({ ok: true, processados: fila.length, enviados, erros })
}
