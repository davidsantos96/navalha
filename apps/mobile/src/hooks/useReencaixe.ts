import { useQuery } from "@tanstack/react-query";
import { supabase } from "../lib/supabase";
import { servicosQueCabem, type Intervalo } from "@navalha/agenda-inteligente";
import { useRetornos } from "./useRetornos";

export interface SugestaoReencaixe {
  clienteId: string;
  nome: string;
  telefone: string;
  servicoNome: string;
  duracaoMin: number;
  vencido: boolean;
  previstoPara: string;
}

/**
 * F7 — ao cancelar um agendamento, cruza o espaço liberado com a lista
 * de retornos: quem tem serviço habitual (spec §4.3) que caiba ali,
 * vencidos primeiro (herdado da ordenação de useRetornos).
 */
export function useReencaixe(barbeariaId: string | undefined, buraco: Intervalo | undefined, buffer = 0) {
  const retornos = useRetornos(barbeariaId);

  return useQuery({
    queryKey: ["reencaixe", barbeariaId, buraco?.inicio, buraco?.fim, buffer, retornos.dataUpdatedAt],
    enabled: !!barbeariaId && !!buraco && !!retornos.data,
    queryFn: async (): Promise<SugestaoReencaixe[]> => {
      const candidatos = (retornos.data ?? []).filter((r) => r.servicoHabitualId);
      if (candidatos.length === 0) return [];

      const idsServico = Array.from(new Set(candidatos.map((r) => r.servicoHabitualId!)));
      const { data: servicos, error } = await supabase
        .from("servicos")
        .select("id, nome, duracao_min")
        .in("id", idsServico);
      if (error) throw error;

      const servicoPorId = new Map((servicos ?? []).map((s) => [s.id, s]));
      const duracoesQueCabem = new Set(servicosQueCabem(buraco!, (servicos ?? []).map((s) => s.duracao_min), buffer));

      const sugestoes: SugestaoReencaixe[] = [];
      for (const r of candidatos) {
        const servico = servicoPorId.get(r.servicoHabitualId!);
        if (!servico || !duracoesQueCabem.has(servico.duracao_min)) continue;
        sugestoes.push({
          clienteId: r.clienteId,
          nome: r.nome,
          telefone: r.telefone,
          servicoNome: servico.nome,
          duracaoMin: servico.duracao_min,
          vencido: r.vencido,
          previstoPara: r.previstoPara,
        });
      }
      return sugestoes;
    },
  });
}
