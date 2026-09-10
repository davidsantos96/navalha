import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "../lib/supabase";

/**
 * Update parcial de `profissionais` — usado tanto no Perfil (nome) quanto
 * em Configurações → Agenda inteligente (ancora/buffer_min, spec §4.2).
 */
export function useAtualizarProfissional() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (params: {
      id: string;
      nome?: string;
      ancora?: "inicio" | "fim";
      bufferMin?: number;
    }) => {
      const { id, ...resto } = params;
      const patch: Record<string, unknown> = {};
      if (resto.nome !== undefined) patch.nome = resto.nome;
      if (resto.ancora !== undefined) patch.ancora = resto.ancora;
      if (resto.bufferMin !== undefined) patch.buffer_min = resto.bufferMin;
      const { error } = await supabase.from("profissionais").update(patch).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["profissional"] });
      queryClient.invalidateQueries({ queryKey: ["sugestoes"] });
    },
  });
}
