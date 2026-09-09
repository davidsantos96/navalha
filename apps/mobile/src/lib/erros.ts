/**
 * Postgres SQLSTATE 23P01 = exclusion_violation: dois agendamentos
 * sobrepostos pro mesmo profissional. É o banco recusando fisicamente o
 * conflito (spec §6.3) — quem chama deve recalcular sugestões, não só
 * exibir o erro cru.
 */
export function ehConflitoDeHorario(erro: unknown): boolean {
  return typeof erro === "object" && erro !== null && (erro as { code?: string }).code === "23P01";
}
