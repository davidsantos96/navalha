import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "../lib/supabase";

export interface Barbearia {
  id: string;
  nome: string;
  endereco: string | null;
  telefone: string | null;
}

/** Dados da barbearia (spec §7.3 tela 6) — endereço/telefone entram nas mensagens de WhatsApp. */
export function useBarbearia(barbeariaId: string | undefined) {
  return useQuery({
    queryKey: ["barbearia", barbeariaId],
    enabled: !!barbeariaId,
    queryFn: async (): Promise<Barbearia> => {
      const { data, error } = await supabase
        .from("barbearias")
        .select("id, nome, endereco, telefone")
        .eq("id", barbeariaId)
        .single();
      if (error) throw error;
      return data;
    },
  });
}

export function useAtualizarBarbearia() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (params: { id: string; nome: string; endereco: string | null; telefone: string | null }) => {
      const { error } = await supabase
        .from("barbearias")
        .update({ nome: params.nome, endereco: params.endereco, telefone: params.telefone })
        .eq("id", params.id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["barbearia"] }),
  });
}
