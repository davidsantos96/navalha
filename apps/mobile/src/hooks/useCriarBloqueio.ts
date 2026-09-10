import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "../lib/supabase";

/**
 * F9 — bloqueio é um agendamento sem cliente/serviço (ver migração 0003).
 * `inicio`/`fim` em ISO (timestamptz) — quem chama monta o instante a
 * partir do dia + minutos escolhidos na UI.
 */
export function useCriarBloqueio() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (params: {
      barbeariaId: string;
      profissionalId: string;
      inicio: string;
      fim: string;
      motivo?: string;
    }) => {
      const { error } = await supabase.from("agendamentos").insert({
        barbearia_id: params.barbeariaId,
        profissional_id: params.profissionalId,
        cliente_id: null,
        servico_id: null,
        inicio: params.inicio,
        fim: params.fim,
        motivo: params.motivo ?? null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["agenda-dia"] });
      queryClient.invalidateQueries({ queryKey: ["bloqueios"] });
    },
  });
}
