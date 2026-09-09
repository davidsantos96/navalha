import { useQuery } from "@tanstack/react-query";
import { supabase } from "../lib/supabase";

export interface Faturamento {
  totalDiaCentavos: number;
  totalSemanaCentavos: number;
}

interface LinhaFaturamento {
  inicio: string;
  preco_centavos: number | null;
}

/**
 * Painel mínimo (spec F8): faturado do dia e da semana, somando
 * atendimentos concluídos. Ocupação do dia já vem de `useAgendaDoDia`
 * (minutosOcupados/minutosExpediente) — não duplicado aqui.
 *
 * Usa o preço gravado no próprio agendamento (snapshot no momento da
 * criação, ver migração 0005 e `useCriarAgendamento`), não o preço atual
 * do serviço — reajustar um preço não pode reescrever faturamento
 * passado.
 *
 * Semana = segunda a domingo (convenção BR; a spec não define
 * explicitamente o corte da semana).
 */
export function useFaturamento(profissionalId: string | undefined, data: string /* "YYYY-MM-DD", dia de referência */) {
  return useQuery({
    queryKey: ["faturamento", profissionalId, data],
    enabled: !!profissionalId,
    queryFn: async (): Promise<Faturamento> => {
      const dia = new Date(`${data}T12:00:00`);
      const inicioDia = `${data}T00:00:00`;
      const fimDia = `${data}T23:59:59`;

      const diaSemana = dia.getDay(); // 0 = domingo
      const offsetSegunda = diaSemana === 0 ? 6 : diaSemana - 1;
      const inicioSemanaDate = new Date(dia);
      inicioSemanaDate.setDate(dia.getDate() - offsetSegunda);
      const inicioSemana = `${inicioSemanaDate.toISOString().slice(0, 10)}T00:00:00`;

      const { data: linhas, error } = (await supabase
        .from("agendamentos")
        .select("inicio, preco_centavos")
        .eq("profissional_id", profissionalId)
        .eq("status", "concluido")
        .gte("inicio", inicioSemana)
        .lte("inicio", fimDia)) as unknown as { data: LinhaFaturamento[] | null; error: any };
      if (error) throw error;

      let totalDiaCentavos = 0;
      let totalSemanaCentavos = 0;
      for (const l of linhas ?? []) {
        const preco = l.preco_centavos ?? 0;
        totalSemanaCentavos += preco;
        if (l.inicio >= inicioDia && l.inicio <= fimDia) totalDiaCentavos += preco;
      }
      return { totalDiaCentavos, totalSemanaCentavos };
    },
  });
}
