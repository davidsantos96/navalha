-- =====================================================================
-- F8 — Faturamento precisa do preço cobrado NA ÉPOCA, não do preço atual
-- do serviço. Sem isso, reajustar o preço de um serviço mudaria
-- retroativamente o faturado de semanas já fechadas.
--
-- Snapshot do preço no momento da criação do agendamento. Null em
-- bloqueios (sem serviço) e em qualquer linha criada antes desta
-- migração — aceitável, é dado de piloto/teste, não faturamento real.
-- =====================================================================

alter table agendamentos add column preco_centavos integer;
