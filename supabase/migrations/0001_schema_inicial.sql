-- =====================================================================
-- Schema do app de barbearia (Postgres / Supabase)
-- Multi-tenant desde o dia 1: barbearia -> profissionais -> agendamentos
-- =====================================================================

create extension if not exists btree_gist;   -- exigido pela exclusion constraint
create extension if not exists pgcrypto;     -- gen_random_uuid

-- ---------------------------------------------------------------------
-- Tenants
-- ---------------------------------------------------------------------
create table barbearias (
  id          uuid primary key default gen_random_uuid(),
  nome        text not null,
  criado_em   timestamptz not null default now()
);

-- Profissionais ligados ao usuário autenticado do Supabase (auth.users).
-- MVP: 1 profissional por barbearia; o modelo já suporta N.
create table profissionais (
  id            uuid primary key default gen_random_uuid(),
  barbearia_id  uuid not null references barbearias(id) on delete cascade,
  user_id       uuid unique references auth.users(id) on delete set null,
  nome          text not null,
  ativo         boolean not null default true,
  -- Preferência do algoritmo: onde compactar dia vazio
  ancora        text not null default 'inicio' check (ancora in ('inicio','fim')),
  buffer_min    smallint not null default 0 check (buffer_min between 0 and 30),
  criado_em     timestamptz not null default now()
);

-- Expediente por dia da semana; várias linhas por dia = blocos (ex: manhã/tarde)
create table expedientes (
  id               uuid primary key default gen_random_uuid(),
  profissional_id  uuid not null references profissionais(id) on delete cascade,
  dia_semana       smallint not null check (dia_semana between 0 and 6), -- 0 = domingo
  inicio_min       smallint not null check (inicio_min between 0 and 1439),
  fim_min          smallint not null check (fim_min between 1 and 1440),
  check (fim_min > inicio_min)
);

-- ---------------------------------------------------------------------
-- Catálogo
-- ---------------------------------------------------------------------
create table servicos (
  id             uuid primary key default gen_random_uuid(),
  barbearia_id   uuid not null references barbearias(id) on delete cascade,
  nome           text not null,
  duracao_min    smallint not null check (duracao_min between 5 and 480),
  preco_centavos integer not null check (preco_centavos >= 0),
  ativo          boolean not null default true
);

create table clientes (
  id                 uuid primary key default gen_random_uuid(),
  barbearia_id       uuid not null references barbearias(id) on delete cascade,
  nome               text not null,
  telefone           text not null,           -- E.164, ex: +5511988771020
  ciclo_retorno_dias smallint,                -- null = ainda sem padrão detectado
  criado_em          timestamptz not null default now(),
  unique (barbearia_id, telefone)             -- mesmo telefone pode existir em outra barbearia
);

-- ---------------------------------------------------------------------
-- Agendamentos — o coração do sistema
-- ---------------------------------------------------------------------
create table agendamentos (
  id               uuid primary key default gen_random_uuid(),
  barbearia_id     uuid not null references barbearias(id) on delete cascade,
  profissional_id  uuid not null references profissionais(id) on delete cascade,
  cliente_id       uuid not null references clientes(id) on delete cascade,
  servico_id       uuid not null references servicos(id),
  inicio           timestamptz not null,
  fim              timestamptz not null,
  status           text not null default 'agendado'
                   check (status in ('agendado','concluido','falta','cancelado')),
  origem           text not null default 'barbeiro'
                   check (origem in ('barbeiro','cliente')),  -- pronto p/ auto-agendamento v2
  criado_em        timestamptz not null default now(),
  check (fim > inicio),

  -- Intervalo materializado do atendimento
  periodo tstzrange generated always as (tstzrange(inicio, fim, '[)')) stored,

  -- A REGRA DE OURO DO BANCO: o mesmo profissional nunca tem dois
  -- agendamentos ativos sobrepostos, não importa quantos clientes
  -- tentem ao mesmo tempo. Cancelados/faltas liberam o horário.
  constraint sem_conflito_de_horario
    exclude using gist (profissional_id with =, periodo with &&)
    where (status in ('agendado','concluido'))
);

create index idx_ag_dia on agendamentos (profissional_id, inicio);
create index idx_cli_busca on clientes (barbearia_id, nome text_pattern_ops);

-- ---------------------------------------------------------------------
-- Retornos: derivado, não armazenado (sempre correto, zero manutenção)
-- Último atendimento concluído + ciclo do cliente = data prevista de volta
-- ---------------------------------------------------------------------
create view retornos as
select
  c.id            as cliente_id,
  c.barbearia_id,
  c.nome,
  c.telefone,
  max(a.fim)      as ultimo_atendimento,
  coalesce(c.ciclo_retorno_dias, 21) as ciclo_dias,
  max(a.fim) + make_interval(days => coalesce(c.ciclo_retorno_dias, 21)) as previsto_para,
  (now() - (max(a.fim) + make_interval(days => coalesce(c.ciclo_retorno_dias, 21)))) > interval '0' as vencido
from clientes c
join agendamentos a on a.cliente_id = c.id and a.status = 'concluido'
where not exists (   -- some da lista quem já tem horário futuro marcado
  select 1 from agendamentos f
  where f.cliente_id = c.id and f.status = 'agendado' and f.inicio > now()
)
group by c.id;

-- ---------------------------------------------------------------------
-- Row Level Security: isolamento entre barbearias garantido pelo banco
-- ---------------------------------------------------------------------
alter table barbearias      enable row level security;
alter table profissionais   enable row level security;
alter table expedientes     enable row level security;
alter table servicos        enable row level security;
alter table clientes        enable row level security;
alter table agendamentos    enable row level security;

-- Barbearia do usuário logado
create or replace function minha_barbearia() returns uuid
language sql stable security definer set search_path = public as $$
  select barbearia_id from profissionais where user_id = auth.uid() limit 1
$$;

create policy p_barbearias on barbearias
  for all using (id = minha_barbearia());

create policy p_profissionais on profissionais
  for all using (barbearia_id = minha_barbearia());

create policy p_expedientes on expedientes
  for all using (profissional_id in
    (select id from profissionais where barbearia_id = minha_barbearia()));

create policy p_servicos on servicos
  for all using (barbearia_id = minha_barbearia());

create policy p_clientes on clientes
  for all using (barbearia_id = minha_barbearia());

create policy p_agendamentos on agendamentos
  for all using (barbearia_id = minha_barbearia());

-- ---------------------------------------------------------------------
-- Gatilho de aprendizado do ciclo de retorno:
-- ao concluir um atendimento, recalcula o intervalo médio real do cliente
-- (média dos espaçamentos entre os últimos atendimentos concluídos)
-- ---------------------------------------------------------------------
create or replace function atualiza_ciclo() returns trigger
language plpgsql as $$
declare novo_ciclo smallint;
begin
  if new.status = 'concluido' then
    select round(avg(dif))::smallint into novo_ciclo
    from (
      select extract(epoch from (inicio - lag(inicio) over (order by inicio)))/86400 as dif
      from agendamentos
      where cliente_id = new.cliente_id and status = 'concluido'
      order by inicio desc limit 6
    ) t where dif is not null and dif between 5 and 90;
    if novo_ciclo is not null then
      update clientes set ciclo_retorno_dias = novo_ciclo where id = new.cliente_id;
    end if;
  end if;
  return new;
end $$;

create trigger trg_ciclo after insert or update of status on agendamentos
  for each row execute function atualiza_ciclo();
