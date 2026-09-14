-- E-mails agendados — processados pelo cron do servidor.
--
-- Antes, os agendamentos viviam no localStorage do navegador e um setInterval
-- os disparava. Com o navegador fechado nada era enviado, e ao reabrir tudo que
-- estava vencido saía de uma vez (e duplicado). Esta tabela move a fila para o
-- servidor: o Worker chama /api/processar-agendados a cada 5 min.
--
-- Rodar no SQL Editor do Supabase.

create table if not exists emails_agendados (
  id           uuid        primary key default gen_random_uuid(),
  processo_id  bigint,
  empresa      text,
  para         text        not null,
  assunto      text        not null,
  mensagem     text,
  data_hora    timestamptz not null,
  -- pendente → enviando → enviado | erro
  status       text        not null default 'pendente',
  erro         text,
  iniciado_em  timestamptz,
  enviado_em   timestamptz,
  created_at   timestamptz not null default now()
);

-- Índice da fila do cron: só pendentes, ordenados por vencimento.
create index if not exists emails_agendados_fila_idx
  on emails_agendados (data_hora)
  where status = 'pendente';

create index if not exists emails_agendados_processo_idx
  on emails_agendados (processo_id);

-- Destrava agendamentos presos em 'enviando' por uma execução interrompida
-- (deploy no meio do envio, timeout da function). Sem isso ficariam órfãos.
create or replace function destravar_emails_agendados()
returns void language sql as $$
  update emails_agendados
     set status = 'pendente'
   where status = 'enviando'
     and iniciado_em < now() - interval '30 minutes';
$$;
