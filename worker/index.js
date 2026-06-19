/**
 * WMS Alertas Worker — Cloudflare Worker com Cron Trigger
 * Horários (BRT = UTC-3): 07:50 → 10:50 UTC | 15:00 → 18:00 UTC
 */

export default {
  async scheduled(event, env, ctx) {
    // 10:50 UTC = 07:50 BRT → resumo completo | 18:00 UTC = 15:00 BRT → só urgências
    const utcHour = new Date(event.scheduledTime).getUTCHours()
    const modoCompleto = utcHour < 14  // manhã
    ctx.waitUntil(run(env, modoCompleto))
  },

  async fetch(request, env) {
    const url = new URL(request.url)
    if (url.pathname === '/test') {
      await run(env, true)
      return new Response('✅ Alertas processados', { status: 200 })
    }
    if (url.pathname === '/test-tarde') {
      await run(env, false)
      return new Response('✅ Alerta de tarde processado', { status: 200 })
    }
    if (url.pathname === '/converter') {
      return converterDocxPdf(request, env)
    }
    return new Response('WMS Alertas Worker — OK', { status: 200 })
  },
}

// ── Conversão DOCX → PDF (proxy para Gotenberg/LibreOffice) ──
const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': '*',
}

async function converterDocxPdf(request, env) {
  if (request.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: CORS })
  }
  if (request.method !== 'POST') {
    return new Response('Use POST', { status: 405, headers: CORS })
  }
  if (!env.GOTENBERG_URL) {
    return new Response('GOTENBERG_URL não configurada', { status: 500, headers: CORS })
  }
  const base = env.GOTENBERG_URL.replace(/\/$/, '')
  try {
    const upstream = await fetch(`${base}/forms/libreoffice/convert`, {
      method: 'POST',
      body: request.body,
      headers: { 'Content-Type': request.headers.get('Content-Type') || '' },
    })
    if (!upstream.ok) {
      const t = await upstream.text()
      return new Response(`Gotenberg erro ${upstream.status}: ${t.slice(0, 300)}`, { status: 502, headers: CORS })
    }
    return new Response(upstream.body, {
      status: 200,
      headers: { ...CORS, 'Content-Type': 'application/pdf' },
    })
  } catch (err) {
    return new Response(`Falha na conversão: ${err.message}`, { status: 502, headers: CORS })
  }
}

// ── Helpers ────────────────────────────────────────────────────────────────

async function fetchSupabase(env, path) {
  const res = await fetch(`${env.SUPABASE_URL}${path}`, {
    headers: {
      apikey:        env.SUPABASE_ANON_KEY,
      Authorization: `Bearer ${env.SUPABASE_ANON_KEY}`,
    },
  })
  return res.json()
}

function diasRestantes(reg) {
  if (!reg.data_vencimento) return 999
  const venc = new Date(reg.data_vencimento + 'T00:00:00')
  if (isNaN(venc.getTime())) return 999
  const hoje = new Date()
  hoje.setHours(0, 0, 0, 0)
  return Math.ceil((venc - hoje) / 86400000)
}

// Meia-noite de hoje no horário de Brasília (UTC-3), convertida para UTC
function hojeInicioUTC() {
  const brtNow = new Date(Date.now() - 3 * 3600000)
  brtNow.setUTCHours(0, 0, 0, 0)
  return new Date(brtNow.getTime() + 3 * 3600000)
}

function montarMensagem(processos, historico, modoCompleto = true) {
  const hojeStr = new Date().toLocaleDateString('pt-BR', { timeZone: 'America/Sao_Paulo' })
  const hojeUTC = hojeInicioUTC()

  // Map: processo_id → último historico
  const histMap = {}
  for (const h of historico || []) {
    if (h.processo_id && !histMap[h.processo_id]) histMap[h.processo_id] = h
  }

  // Urgência (presente nos dois turnos)
  const vencidos  = processos.filter(r => diasRestantes(r) < 0)
  const urgentes  = processos.filter(r => {
    const d = diasRestantes(r)
    return (r.prazo || 'normal') === 'urgente' || d === 0
  })
  const priorizar = processos.filter(r => {
    const d = diasRestantes(r)
    return d > 0 && d < 999 && (r.prazo || 'normal') !== 'urgente' && (r.prazo === 'priorizar' || d <= 3)
  })

  // Só no resumo completo da manhã
  const novosHoje = modoCompleto
    ? processos.filter(r => r.created_at && new Date(r.created_at) >= hojeUTC)
    : []

  const emAndamento = modoCompleto
    ? processos.filter(r => { const h = histMap[r.id]; return h && h.pct > 0 && h.pct < 100 })
    : []

  const seteAtras = new Date(); seteAtras.setDate(seteAtras.getDate() - 7)
  const recentes = modoCompleto
    ? (historico || []).filter(h => {
        if (!h.data) return false
        const [d, m, y] = h.data.split('/').map(Number)
        return new Date(y, m - 1, d) >= seteAtras && h.pct === 100
      })
    : []

  const temConteudo = novosHoje.length || vencidos.length || urgentes.length ||
                      priorizar.length || emAndamento.length
  if (!temConteudo) return null

  const turno = modoCompleto ? '☀️ Resumo da manhã' : '🌆 Alerta da tarde'
  let msg = `⚠️ *WMS Consultoria — ${turno}*\n📅 ${hojeStr}\n`

  if (novosHoje.length) {
    msg += `\n🆕 *ADICIONADOS HOJE (${novosHoje.length})*\n`
    novosHoje.forEach(r => {
      msg += `• *${r.razao_social || 'Sem nome'}*`
      if (r.data_formatada) msg += ` — abertura: ${r.data_formatada}`
      if (r.prazo && r.prazo !== 'normal') msg += ` · ${r.prazo.toUpperCase()}`
      msg += '\n'
    })
  }

  if (vencidos.length) {
    msg += `\n🔴 *VENCIDOS (${vencidos.length})*\n`
    vencidos.forEach(r => {
      const d = Math.abs(diasRestantes(r))
      msg += `• *${r.razao_social || 'Sem nome'}*`
      if (r.data_venc_formatada) msg += ` — encerrou em ${r.data_venc_formatada}`
      msg += ` (${d} dia${d !== 1 ? 's' : ''} atrás)\n`
    })
  }

  if (urgentes.length) {
    msg += `\n🚨 *URGENTE (${urgentes.length})*\n`
    urgentes.forEach(r => {
      const d = diasRestantes(r)
      msg += `• *${r.razao_social || 'Sem nome'}*`
      if (r.data_venc_formatada) msg += ` — vence em ${r.data_venc_formatada}`
      msg += ` (${d === 0 ? 'hoje' : d < 999 ? `${d} dia${d !== 1 ? 's' : ''}` : 'sem prazo'})\n`
    })
  }

  if (priorizar.length) {
    msg += `\n🟡 *PRIORIZAR (${priorizar.length})*\n`
    priorizar.forEach(r => {
      const d = diasRestantes(r)
      msg += `• *${r.razao_social || 'Sem nome'}*`
      if (r.data_venc_formatada) msg += ` — vence em ${r.data_venc_formatada}`
      msg += ` (${d} dia${d !== 1 ? 's' : ''})\n`
    })
  }

  if (emAndamento.length) {
    msg += `\n📋 *EM ANDAMENTO (${emAndamento.length})*\n`
    emAndamento.forEach(r => {
      const h = histMap[r.id]
      msg += `• *${r.razao_social || 'Sem nome'}* — ${h.pct}% concluído`
      if (r.proximo_passo) msg += ` · próximo: ${r.proximo_passo}`
      else if (h.localizacao && h.localizacao !== '—') msg += ` · em: ${h.localizacao}`
      msg += '\n'
    })
  }

  if (recentes.length) {
    msg += `\n✅ *CONCLUÍDOS RECENTES*\n`
    recentes.slice(0, 5).forEach(h => {
      msg += `• *${h.empresa || '—'}*`
      if (h.protocolo && h.protocolo !== '—') msg += ` · Prot: ${h.protocolo}`
      if (h.localizacao && h.localizacao !== '—') msg += ` · ${h.localizacao}`
      msg += ` — ${h.data}\n`
    })
  }

  msg += `\n_WMS Consultoria Contábil_`
  return msg
}

async function enviarWhatsApp(cfg, numero, texto) {
  if (cfg.provider === 'zapi') {
    await fetch(
      `https://api.z-api.io/instances/${cfg.z_instance_id}/token/${cfg.z_token}/send-text`,
      {
        method:  'POST',
        headers: { 'Content-Type': 'application/json', 'Client-Token': cfg.z_client_token || '' },
        body:    JSON.stringify({ phone: numero, message: texto }),
      }
    )
  } else if (cfg.url && cfg.token) {
    const instance = cfg.evolution_instance || 'wms'
    const base = cfg.url.replace(/\/$/, '')
    const res = await fetch(`${base}/message/sendText/${instance}`, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json', apikey: cfg.token },
      body:    JSON.stringify({ number: numero, text: texto }),
    })
    const body = await res.text()
    console.log('[WMS] evolution response:', res.status, body.slice(0, 200))
  }
}

// ── Lógica principal ────────────────────────────────────────────────────────

async function run(env, modoCompleto = true) {
  // 1. Configuração
  const configs = await fetchSupabase(env, '/rest/v1/configuracoes?id=eq.1')
  const cfg = configs?.[0]
  if (!cfg) { console.log('[WMS] Sem configuração'); return }

  const pronto = cfg.provider === 'zapi'
    ? (cfg.z_instance_id && cfg.z_token)
    : (cfg.url && cfg.token && cfg.evolution_instance)
  if (!pronto) { console.log('[WMS] API não configurada'); return }

  // 2. Processos ativos (inclui proximo_passo e created_at)
  const processos = await fetchSupabase(env, '/rest/v1/processos?concluido=eq.false&select=*')
  console.log('[WMS] processos ativos:', processos?.length ?? 0)
  if (!processos?.length) return

  // 3. Histórico (100 entradas para cobrir todos os processos)
  const historico = await fetchSupabase(env, '/rest/v1/historico?select=*&order=id.desc&limit=100')

  // 4. Montar mensagem com todas as seções
  const msg = montarMensagem(processos, historico, modoCompleto)
  console.log('[WMS] mensagem:', msg ? `${msg.length} chars` : 'nenhuma (sem alertas)')
  if (!msg) return

  // 5. Enviar
  const numeros = env.NUMEROS_ALERTA.split(',').map(n => n.trim()).filter(Boolean)
  const results = await Promise.allSettled(numeros.map(num => enviarWhatsApp(cfg, num, msg)))
  results.forEach((r, i) => console.log(`[WMS] envio[${numeros[i]}]:`, r.status, r.reason?.message || 'ok'))
}
