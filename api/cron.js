import { Redis } from '@upstash/redis'

const redis = new Redis({
  url:   process.env.KV_REST_API_URL,
  token: process.env.KV_REST_API_TOKEN,
})

const NUMEROS_ALERTA = ['5599984491810']

function diasRestantes(r) {
  if (!r.dataISO) return 999
  const hoje = new Date(); hoje.setHours(0, 0, 0, 0)
  const venc = new Date(r.dataISO); venc.setHours(0, 0, 0, 0)
  return Math.ceil((venc - hoje) / 86400000)
}

function montarMensagem(processos) {
  const hoje = new Date().toLocaleDateString('pt-BR', { timeZone: 'America/Sao_Paulo' })
  const vencidos  = processos.filter(r => diasRestantes(r) < 0)
  const urgentes  = processos.filter(r => { const d = diasRestantes(r); return d >= 0 && ((r.prazo || 'normal') === 'urgente' || d === 0) })
  const priorizar = processos.filter(r => { const d = diasRestantes(r); return d > 0 && r.prazo !== 'urgente' && (r.prazo === 'priorizar' || d <= 3) })

  let msg = `⚠️ *WMS Consultoria — Resumo de Prazos*\n📅 ${hoje}\n`

  if (vencidos.length) {
    msg += `\n🔴 *VENCIDOS (${vencidos.length})*\n`
    vencidos.forEach(r => {
      const d = Math.abs(diasRestantes(r))
      msg += `• ${r.razaoSocial || 'Sem nome'} — vencido há ${d} dia${d !== 1 ? 's' : ''}\n`
    })
  }
  if (urgentes.length) {
    msg += `\n🚨 *URGENTE (${urgentes.length})*\n`
    urgentes.forEach(r => {
      const d = diasRestantes(r)
      msg += `• ${r.razaoSocial || 'Sem nome'} — ${d === 0 ? 'vence hoje' : `vence em ${d} dia${d !== 1 ? 's' : ''}`}\n`
    })
  }
  if (priorizar.length) {
    msg += `\n🟡 *PRIORIZAR (${priorizar.length})*\n`
    priorizar.forEach(r => {
      const d = diasRestantes(r)
      msg += `• ${r.razaoSocial || 'Sem nome'} — vence em ${d} dia${d !== 1 ? 's' : ''}\n`
    })
  }

  msg += `\n_WMS Consultoria Contábil_`
  return msg
}

async function enviarZAPI(numero, texto, cfg) {
  const res = await fetch(
    `https://api.z-api.io/instances/${cfg.zInstanceId}/token/${cfg.zToken}/send-text`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Client-Token': cfg.zClientToken || '',
      },
      body: JSON.stringify({ phone: numero, message: texto }),
    }
  )
  return res.ok
}

export default async function handler(req, res) {
  const auth = req.headers['authorization']
  if (process.env.CRON_SECRET && auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return res.status(401).json({ error: 'Unauthorized' })
  }

  try {
    const [registrosRaw, configRaw] = await Promise.all([
      redis.get('wms:registros'),
      redis.get('wms:config'),
    ])

    const registros = typeof registrosRaw === 'string' ? JSON.parse(registrosRaw) : (registrosRaw || [])
    const config    = typeof configRaw    === 'string' ? JSON.parse(configRaw)    : (configRaw    || {})

    if (!config.zInstanceId || !config.zToken) {
      console.log('[cron] Z-API não configurada')
      return res.status(200).json({ ok: false, motivo: 'API não configurada' })
    }

    const processos = registros.filter(r => {
      const d = diasRestantes(r)
      return d < 0 || d <= 3 || (r.prazo || 'normal') === 'urgente'
    })

    if (!processos.length) {
      console.log('[cron] Nenhum processo urgente/vencido')
      return res.status(200).json({ ok: true, enviados: 0 })
    }

    const msg = montarMensagem(processos)
    const resultados = await Promise.all(
      NUMEROS_ALERTA.map(num => enviarZAPI(num, msg, config))
    )

    const enviados = resultados.filter(Boolean).length
    console.log(`[cron] Alertas enviados: ${enviados}/${NUMEROS_ALERTA.length}`)
    return res.status(200).json({ ok: true, enviados, processos: processos.length })
  } catch (err) {
    console.error('[cron]', err)
    return res.status(500).json({ error: err.message })
  }
}
