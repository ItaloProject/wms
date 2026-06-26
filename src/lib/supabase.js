import { createClient } from '@supabase/supabase-js'

export const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
)

// ── Processos ─────────────────────────────────────────────────────────────────
export function processoToDb(r) {
  return {
    id:                 r.id,
    prazo:              r.prazo || 'normal',
    razao_social:       r.razaoSocial || '',
    data_iso:           r.dataISO || null,
    data_vencimento:    r.dataVencimento || null,
    data_formatada:     r.dataFormatada || '',
    data_venc_formatada: r.dataVencFormatada || '',
    empresa:            r.empresa    || [],
    socio:              r.socio      || [],
    taxas:              r.taxas      || [],
    observacao:         r.observacao || '',
    concluido:          r.concluido  || false,
    etapas:             r.etapas     || [],
  }
}

export function processoFromDb(row) {
  return {
    id:                 row.id,
    prazo:              row.prazo || 'normal',
    razaoSocial:        row.razao_social || '',
    dataISO:            row.data_iso || '',
    dataVencimento:     row.data_vencimento || '',
    dataFormatada:      row.data_formatada || '',
    dataVencFormatada:  row.data_venc_formatada || '',
    empresa:            row.empresa    || [],
    socio:              row.socio      || [],
    taxas:              row.taxas      || [],
    observacao:         row.observacao || '',
    concluido:          row.concluido  || false,
    etapas:             row.etapas     || [],
  }
}

// ── Histórico ─────────────────────────────────────────────────────────────────
export function historicoToDb(h) {
  return {
    id:           h.id,
    processo_id:  h.processoId   || null,
    empresa:      h.empresa      || '',
    protocolo:    h.protocolo    || '',
    localizacao:  h.localizacao  || '',
    pct:          h.pct          ?? 0,
    data:         h.data         || '',
    hora:         h.hora         || '',
    concluido_por: h.concluidoPor || '',
  }
}

export function historicoFromDb(row) {
  return {
    id:           row.id,
    processoId:   row.processo_id  || null,
    empresa:      row.empresa      || '',
    protocolo:    row.protocolo    || '',
    localizacao:  row.localizacao  || '',
    pct:          row.pct          ?? 0,
    data:         row.data         || '',
    hora:         row.hora         || '',
    concluidoPor: row.concluido_por || '',
  }
}

// ── Configurações ─────────────────────────────────────────────────────────────
export function configToDb(cfg) {
  return {
    id:                  1,
    provider:            cfg.provider          || 'zapi',
    z_instance_id:       cfg.zInstanceId       || '',
    z_token:             cfg.zToken            || '',
    z_client_token:      cfg.zClientToken      || '',
    telefone:            cfg.telefone          || '',
    url:                 cfg.url               || '',
    token:               cfg.token             || '',
    evolution_instance:  cfg.evolutionInstance || 'wms',
    email_url:           cfg.emailUrl          || '',
    email_key:           cfg.emailKey          || '',
    email_from:          cfg.emailFrom         || '',
    responsavel:         cfg.responsavel       || '',
    updated_at:          new Date().toISOString(),
  }
}

export function configFromDb(row) {
  if (!row) return {}
  return {
    provider:          row.provider            || 'zapi',
    zInstanceId:       row.z_instance_id       || '',
    zToken:            row.z_token             || '',
    zClientToken:      row.z_client_token      || '',
    telefone:          row.telefone            || '',
    url:               row.url                 || '',
    token:             row.token               || '',
    evolutionInstance: row.evolution_instance  || 'wms',
    emailUrl:          row.email_url           || '',
    emailKey:          row.email_key           || '',
    emailFrom:         row.email_from          || '',
    responsavel:       row.responsavel         || '',
  }
}
