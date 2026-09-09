-- =====================================================================
-- F9 — Bloqueios (folga, feriado, compromisso)
--
-- O schema original exigia cliente_id/servico_id em todo agendamento,
-- mas a spec trata bloqueio como "espaço ocupado sem cliente" (§2.2 F9).
-- Em vez de criar uma tabela separada (o que duplicaria a exclusion
-- constraint anti-conflito e o fluxo de cancelamento), um bloqueio passa
-- a ser uma linha normal de `agendamentos` com cliente_id/servico_id
-- nulos: reaproveita a constraint gist, o cancelamento e a listagem por
-- dia sem nenhum código novo além da criação em si.
-- =====================================================================

alter table agendamentos
  alter column cliente_id drop not null,
  alter column servico_id drop not null;

alter table agendamentos add column motivo text;

-- Ou os dois presentes (atendimento) ou os dois ausentes (bloqueio) —
-- nunca um estado misto.
alter table agendamentos
  add constraint bloqueio_ou_atendimento
  check ((cliente_id is null) = (servico_id is null));

-- Bloqueio nunca conclui/falta (esses status só fazem sentido para
-- atendimento com cliente); a trigger de ciclo já só age em concluido,
-- mas reforça aqui contra o caso cliente_id nulo por segurança.
create or replace function atualiza_ciclo() returns trigger
language plpgsql as $$
declare novo_ciclo smallint;
begin
  if new.status = 'concluido' and new.cliente_id is not null then
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
