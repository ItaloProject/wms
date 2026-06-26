import { readFileSync, writeFileSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const DATA_FILE   = join(__dirname, 'wms-data.json')
const CONFIG_FILE = join(__dirname, 'wms-config.json')
const PORT = 3456

const NUMEROS_ALERTA = ['5599984491810']
const HORARIOS = [{ h: 7, m: 50 }, { h: 15, m: 0 }]

// ── Persistência ──────────────────────────────────────────────────────────────
function loadData()   { try { return JSON.parse(readFileSync(DATA_FILE,   'utf-8')) } catch { return { registros: [] } } }
function loadConfig() { try { return JSON.parse(readFileSync(CONFIG_FILE, 'utf-8')) } catch { return {} } }

// ── Lógica de prazo ───────────────────────────────────────────────────────────
function diasRestantes(r) {
  const raw = r.dataVencimento || r.data_vencimento
  if (!raw) return 999
  const hoje = new Date()
  hoje.setHours(0, 0, 0, 0)
  const venc = new Date(raw)
  if (isNaN(venc.getTime())) return 999
  venc.setHours(0, 0, 0, 0)
  return Math.ceil((venc - hoje) / 86400000)
}

function montarMensagem(processos) {
  const hoje = new Date().toLocaleDateString('pt-BR')
  const vencidos  = processos.filter(r => diasRestantes(r) < 0)
  const urgentes  = processos.filter(r => { const d = diasRestantes(r); return d >= 0 && ((r.prazo || 'normal') === 'urgente' || d === 0) })
  const priorizar = processos.filter(r => { const d = diasRestantes(r); return d > 0 && r.prazo !== 'urgente' && (r.prazo === 'priorizar' || d <= 3) })

  if (!vencidos.length && !urgentes.length && !priorizar.length) return null

  let msg = `⚠️ *WMS Consultoria — Resumo de Prazos*\n📅 ${hoje}\n`
  if (vencidos.length) {
    msg += `\n🔴 *VENCIDOS (${vencidos.length})*\n`
    vencidos.forEach(r => { const d = Math.abs(diasRestantes(r)); msg += `• ${r.razaoSocial || 'Sem nome'} — vencido há ${d} dia${d !== 1 ? 's' : ''}\n` })
  }
  if (urgentes.length) {
    msg += `\n🚨 *URGENTE (${urgentes.length})*\n`
    urgentes.forEach(r => { const d = diasRestantes(r); msg += `• ${r.razaoSocial || 'Sem nome'} — ${d === 0 ? 'vence hoje' : `vence em ${d} dia${d !== 1 ? 's' : ''}`}\n` })
  }
  if (priorizar.length) {
    msg += `\n🟡 *PRIORIZAR (${priorizar.length})*\n`
    priorizar.forEach(r => { const d = diasRestantes(r); msg += `• ${r.razaoSocial || 'Sem nome'} — vence em ${d} dia${d !== 1 ? 's' : ''}\n` })
  }
  msg += `\n_WMS Consultoria Contábil_`
  return msg
}

// ── Z-API ─────────────────────────────────────────────────────────────────────
async function enviarParaNumero(numero, texto, cfg) {
  try {
    if (cfg.provider === 'zapi' || cfg.zInstanceId) {
      const res = await fetch(
        `https://api.z-api.io/instances/${cfg.zInstanceId}/token/${cfg.zToken}/send-text`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Client-Token': cfg.zClientToken || '' },
          body: JSON.stringify({ phone: numero, message: texto }),
        }
      )
      return res.ok
    }
    return false
  } catch (e) {
    console.error(`[WMS] Erro ao enviar para ${numero}:`, e.message)
    return false
  }
}

async function dispararAlertas() {
  const cfg = loadConfig()
  if (!cfg.zInstanceId || !cfg.zToken) {
    console.log('[WMS] API não configurada — configure no app e salve.')
    return
  }
  const { registros = [] } = loadData()
  const ativos = registros.filter(r => !r.concluido)
  const processos = ativos.filter(r => {
    const d = diasRestantes(r)
    return d < 0 || d <= 3 || (r.prazo || 'normal') === 'urgente'
  })
  if (!processos.length) {
    console.log('[WMS] Nenhum processo urgente/vencido encontrado.')
    return
  }
  const msg = montarMensagem(processos)
  if (!msg) {
    console.log('[WMS] Nenhum alerta a enviar.')
    return
  }
  for (const num of NUMEROS_ALERTA) {
    const ok = await enviarParaNumero(num, msg, cfg)
    console.log(`[WMS] → ${num}: ${ok ? '✓ enviado' : '✗ falhou'}`)
  }
}

// ── Agendador (verifica a cada minuto) ───────────────────────────────────────
let ultimoDisparo = null
setInterval(() => {
  const now  = new Date()
  const chave = `${now.getFullYear()}-${now.getMonth()}-${now.getDate()}-${now.getHours()}-${now.getMinutes()}`
  if (ultimoDisparo === chave) return
  const h = now.getHours(), m = now.getMinutes()
  const matchou = HORARIOS.some(t => t.h === h && t.m === m)
  if (matchou) {
    ultimoDisparo = chave
    console.log(`[WMS] ⏰ Disparando alertas (${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')})`)
    dispararAlertas()
  }
}, 60000)

// ── Servidor HTTP (recebe dados do app Vue) ───────────────────────────────────
const CORS = {
  'Access-Control-Allow-Origin':  '*',
  'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
}

Bun.serve({
  port: PORT,
  async fetch(req) {
    const url = new URL(req.url)
    if (req.method === 'OPTIONS') return new Response(null, { headers: CORS })

    if (req.method === 'POST' && url.pathname === '/data') {
      writeFileSync(DATA_FILE, JSON.stringify(await req.json()))
      return new Response('ok', { headers: CORS })
    }
    if (req.method === 'POST' && url.pathname === '/config') {
      writeFileSync(CONFIG_FILE, JSON.stringify(await req.json()))
      return new Response('ok', { headers: CORS })
    }
    if (req.method === 'POST' && url.pathname === '/testar') {
      dispararAlertas()
      return new Response('ok', { headers: CORS })
    }
    if (url.pathname === '/status') {
      const now = new Date()
      return new Response(JSON.stringify({ ok: true, hora: now.toLocaleTimeString('pt-BR') }), {
        headers: { ...CORS, 'Content-Type': 'application/json' },
      })
    }
    return new Response('not found', { status: 404, headers: CORS })
  },
})

console.log(`[WMS] Servidor de alertas ativo na porta ${PORT}`)
console.log(`[WMS] Horários programados: 07:50 e 15:00`)
