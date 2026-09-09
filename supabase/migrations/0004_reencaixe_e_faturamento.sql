-- =====================================================================
-- F7 — Reencaixe: expõe o "serviço habitual" do cliente na view retornos
--
-- A spec (§4.3) fala em cruzar o espaço liberado por um cancelamento com
-- o "serviço habitual" de cada cliente da lista de retornos, mas nunca
-- define como esse serviço habitual é determinado. Para o MVP, uso o
-- serviço do último atendimento concluído (mesmo evento que já define
-- `ultimo_atendimento`) — é o dado mais barato de manter correto e o
-- mais defensável sem dados de uso reais. Revisar em v1.1 se fizer mais
-- sentido usar o serviço mais frequente do cliente (spec §4.4: pesos e
-- heurísticas são hipóteses iniciais, recalibradas com telemetria).
--
-- create or replace view exige manter nome/ordem/tipo das colunas
-- existentes: troquei o group by por distinct on (equivalente para as
-- colunas já existentes) só para poder expor a.servico_id da mesma linha
-- vencedora, e acrescentei a coluna nova no fim.
-- =====================================================================

create or replace view retornos as
select distinct on (c.id)
  c.id            as cliente_id,
  c.barbearia_id,
  c.nome,
  c.telefone,
  a.fim           as ultimo_atendimento,
  coalesce(c.ciclo_retorno_dias, 21) as ciclo_dias,
  a.fim + make_interval(days => coalesce(c.ciclo_retorno_dias, 21)) as previsto_para,
  (now() - (a.fim + make_interval(days => coalesce(c.ciclo_retorno_dias, 21)))) > interval '0' as vencido,
  a.servico_id    as servico_habitual_id
from clientes c
join agendamentos a on a.cliente_id = c.id and a.status = 'concluido'
where not exists (
  select 1 from agendamentos f
  where f.cliente_id = c.id and f.status = 'agendado' and f.inicio > now()
)
order by c.id, a.fim desc;
