-- =====================================================================
-- Tela "Barbearia" (spec §7.3 tela 6): endereço e telefone opcionais,
-- usados nas mensagens de WhatsApp que o app monta. Colunas novas e
-- nullable — não quebra nenhuma linha existente.
-- =====================================================================

alter table barbearias
  add column endereco text,
  add column telefone text;
