import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "../lib/supabase";

/**
 * Move um agendamento existente pra outro horário — mesmo dia ou outro
 * dia, tanto faz: é sempre trocar inicio/fim da mesma linha (mantém
 * cliente/serviço/histórico). A exclusion constraint revalida o novo
 * horário sozinha contra o resto da agenda; conflito chega como
 * exclusion_violation (ver `ehConflitoDeHorario` em lib/erros).
 *
 * Pra sugerir bons horários de destino, chame `useSugestoes` passando
 * `ignorarAgendamentoId` com o id deste agendamento — senão o próprio
 * horário atual dele entra como "ocupado" e atrapalha o cálculo.
 */
export function useReagendarAgendamento() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (params: { id: string; inicio: string; fim: string }) => {
      const { error } = await supabase
        .from("agendamentos")
        .update({ inicio: params.inicio, fim: params.fim })
        .eq("id", params.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["agenda-dia"] });
      queryClient.invalidateQueries({ queryKey: ["sugestoes"] });
      queryClient.invalidateQueries({ queryKey: ["retornos"] });
    },
  });
}
