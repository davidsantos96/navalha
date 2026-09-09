import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "../lib/supabase";

/**
 * Passo final do fluxo turbo (spec F3). `inicio`/`fim` em ISO (timestamptz),
 * calculados a partir da sugestão escolhida (`useSugestoes`).
 *
 * Pode falhar com exclusion_violation se outra escrita ocupou o horário
 * primeiro (spec §6.3: o banco é a autoridade final). Use
 * `ehConflitoDeHorario(erro)` de `lib/erros` pra distinguir esse caso e
 * recalcular sugestões, em vez de só mostrar o erro cru.
 */
export function useCriarAgendamento() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (params: {
      barbeariaId: string;
      profissionalId: string;
      clienteId: string;
      servicoId: string;
      /** Preço do serviço NESTE momento (spec F8) — gravado na linha pra faturamento nunca mudar retroativamente se o preço do serviço for reajustado depois. */
      precoCentavos: number;
      inicio: string;
      fim: string;
    }) => {
      const { error } = await supabase.from("agendamentos").insert({
        barbearia_id: params.barbeariaId,
        profissional_id: params.profissionalId,
        cliente_id: params.clienteId,
        servico_id: params.servicoId,
        preco_centavos: params.precoCentavos,
        inicio: params.inicio,
        fim: params.fim,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["agenda-dia"] });
      queryClient.invalidateQueries({ queryKey: ["sugestoes"] });
    },
  });
}
