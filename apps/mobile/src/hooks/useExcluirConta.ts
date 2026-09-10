import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "../lib/supabase";

/**
 * Exclusão de conta (spec §7.3 tela 5, exigência de loja). A RPC roda com
 * privilégio de dono (migração 0007): apaga a barbearia inteira em
 * cascata e por fim a própria linha em auth.users. Limpamos o cache local
 * do React Query pelo mesmo motivo do sign-out — não deixar dado do
 * barbeiro anterior vazar pro próximo login neste aparelho.
 */
export function useExcluirConta() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      const { error } = await supabase.rpc("excluir_minha_conta");
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.clear();
    },
  });
}
