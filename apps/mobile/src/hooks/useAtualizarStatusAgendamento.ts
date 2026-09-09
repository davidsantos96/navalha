import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "../lib/supabase";
import type { StatusAgendamento } from "./useAgendaDoDia";

/**
 * Ciclo de atendimento (spec §3.2): concluir/marcar falta/cancelar são
 * todos a mesma operação — mudar o status. Concluir dispara a trigger de
 * ciclo de retorno no banco; cancelar libera o horário automaticamente
 * (a exclusion constraint só olha status agendado/concluido).
 */
export function useAtualizarStatusAgendamento() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (params: { id: string; status: StatusAgendamento }) => {
      const { error } = await supabase.from("agendamentos").update({ status: params.status }).eq("id", params.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["agenda-dia"] });
      queryClient.invalidateQueries({ queryKey: ["retornos"] });
    },
  });
}
