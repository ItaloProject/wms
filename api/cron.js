import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

const NUMEROS_ALERTA = ['5599984491810']

function diasRestantes(r) {
  if (!r.data_iso) return 999
  const hoje = new Date(); hoje.setHours(0, 0, 0, 0)
  const venc = new Date(r.data_iso); venc.setHours(0, 0, 0, 0)
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
      msg += `• ${r.razao_social || 'Sem nome'} — vencido há ${d} dia${d !== 1 ? 's' : ''}\n`
    })
  }
  if (urgentes.length) {
    msg += `\n🚨 *URGENTE (${urgentes.length})*\n`
    urgentes.forEach(r => {
      const d = diasRestantes(r)
      msg += `• ${r.razao_social || 'Sem nome'} — ${d === 0 ? 'vence hoje' : `vence em ${d} dia${d !== 1 ? 's' : ''}`}\n`
    })
  }
  if (priorizar.length) {
    msg += `\n🟡 *PRIORIZAR (${priorizar.length})*\n`
    priorizar.forEach(r => {
      const d = diasRestantes(r)
      msg += `• ${r.razao_social || 'Sem nome'} — vence em ${d} dia${d !== 1 ? 's' : ''}\n`
    })
  }

  msg += `\n_WMS Consultoria Contábil_`
  return msg
}

async function enviarZAPI(numero, texto, cfg) {
  const res = await fetch(
    `https://api.z-api.io/instances/${cfg.z_instance_id}/token/${cfg.z_token}/send-text`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Client-Token': cfg.z_client_token || '',
      },
      body: JSON.stringify({ phone: numero, message: texto }),
    }
  )
  return res.ok
}

async function enviarEvolution(numero, texto, cfg) {
  const url      = (cfg.url || '').replace(/\/$/, '')
  const instance = cfg.evolution_instance || 'wms'
  const res = await fetch(`${url}/message/sendText/${instance}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'apikey': cfg.token || '' },
    body: JSON.stringify({ number: numero, text: texto }),
  })
  return res.ok
}

export default async function handler(req, res) {
  const auth = req.headers['authorization']
  if (process.env.CRON_SECRET && auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return res.status(401).json({ error: 'Unauthorized' })
  }

  try {
    const [{ data: processos }, { data: cfg }] = await Promise.all([
      supabase.from('processos').select('*'),
      supabase.from('configuracoes').select('*').eq('id', 1).single(),
    ])

    const provider = cfg?.provider || 'zapi'
    const prontoZAPI      = cfg?.z_instance_id && cfg?.z_token
    const prontoEvolution = cfg?.url && cfg?.token

    if (!cfg || (provider === 'zapi' ? !prontoZAPI : !prontoEvolution)) {
      console.log('[cron] API WhatsApp não configurada — provider:', provider)
      return res.status(200).json({ ok: false, motivo: 'API não configurada', provider })
    }

    const urgentes = (processos || []).filter(r => {
      const d = diasRestantes(r)
      return d < 0 || d <= 3 || (r.prazo || 'normal') === 'urgente'
    })

    if (!urgentes.length) {
      console.log('[cron] Nenhum processo urgente/vencido')
      return res.status(200).json({ ok: true, enviados: 0 })
    }

    const msg = montarMensagem(urgentes)

    const enviar = provider === 'zapi'
      ? num => enviarZAPI(num, msg, cfg)
      : num => enviarEvolution(num, msg, cfg)

    const resultados = await Promise.all(NUMEROS_ALERTA.map(enviar))
    const enviados = resultados.filter(Boolean).length

    console.log(`[cron] Provider: ${provider} | Alertas enviados: ${enviados}/${NUMEROS_ALERTA.length}`)
    return res.status(200).json({ ok: true, enviados, processos: urgentes.length, provider })
  } catch (err) {
    console.error('[cron]', err)
    return res.status(500).json({ error: err.message })
  }
}
