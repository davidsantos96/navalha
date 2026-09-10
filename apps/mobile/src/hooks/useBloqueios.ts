import { useQuery } from "@tanstack/react-query";
import { supabase } from "../lib/supabase";

export interface Bloqueio {
  id: string;
  inicio: string; // ISO
  fim: string;
  motivo: string | null;
}

/**
 * Bloqueios futuros (spec §7.3 tela 9, F9) — são agendamentos sem cliente
 * nem serviço (migração 0003), então a listagem é a mesma tabela filtrada
 * por `cliente_id is null`. Remover um bloqueio é só marcar `cancelado`
 * (reaproveita `useAtualizarStatusAgendamento`) — a exclusion constraint
 * só olha status agendado/concluido, então cancelar já libera o horário.
 */
export function useBloqueios(profissionalId: string | undefined) {
  return useQuery({
    queryKey: ["bloqueios", profissionalId],
    enabled: !!profissionalId,
    queryFn: async (): Promise<Bloqueio[]> => {
      const hoje = new Date();
      hoje.setHours(0, 0, 0, 0);
      const { data, error } = await supabase
        .from("agendamentos")
        .select("id, inicio, fim, motivo")
        .eq("profissional_id", profissionalId)
        .is("cliente_id", null)
        .eq("status", "agendado")
        .gte("inicio", hoje.toISOString())
        .order("inicio");
      if (error) throw error;
      return data ?? [];
    },
  });
}
