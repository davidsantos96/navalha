import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "../lib/supabase";

export interface Bloco {
  diaSemana: number; // 0 = domingo
  inicioMin: number;
  fimMin: number;
}

/** Expediente por dia da semana (spec §7.3 tela 8) — várias linhas por dia = blocos. */
export function useExpedientes(profissionalId: string | undefined) {
  return useQuery({
    queryKey: ["expedientes", profissionalId],
    enabled: !!profissionalId,
    queryFn: async (): Promise<Bloco[]> => {
      const { data, error } = await supabase
        .from("expedientes")
        .select("dia_semana, inicio_min, fim_min")
        .eq("profissional_id", profissionalId)
        .order("dia_semana")
        .order("inicio_min");
      if (error) throw error;
      return (data ?? []).map((e) => ({ diaSemana: e.dia_semana, inicioMin: e.inicio_min, fimMin: e.fim_min }));
    },
  });
}

/**
 * Salva o expediente inteiro de uma vez (substitui tudo). Mais simples e
 * previsível do que sincronizar bloco a bloco — a tela de Horários edita
 * a semana inteira antes de salvar, então não há concorrência a proteger.
 */
export function useSalvarExpedientes() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (params: { profissionalId: string; blocos: Bloco[] }) => {
      const { error: erroDelete } = await supabase
        .from("expedientes")
        .delete()
        .eq("profissional_id", params.profissionalId);
      if (erroDelete) throw erroDelete;

      if (params.blocos.length === 0) return;
      const { error: erroInsert } = await supabase.from("expedientes").insert(
        params.blocos.map((b) => ({
          profissional_id: params.profissionalId,
          dia_semana: b.diaSemana,
          inicio_min: b.inicioMin,
          fim_min: b.fimMin,
        }))
      );
      if (erroInsert) throw erroInsert;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["expedientes"] });
      queryClient.invalidateQueries({ queryKey: ["agenda-dia"] });
      queryClient.invalidateQueries({ queryKey: ["sugestoes"] });
    },
  });
}
