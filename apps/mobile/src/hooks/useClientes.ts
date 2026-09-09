import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "../lib/supabase";

export interface Cliente {
  id: string;
  nome: string;
  telefone: string;
}

/**
 * Busca por nome ou telefone (spec F3 passo 1). Duas queries separadas
 * (nome/telefone) em vez de um único `.or()` — o termo digitado pode ter
 * parênteses/espaços/traço (comum em telefone) que quebrariam a sintaxe
 * do filtro combinado do PostgREST.
 */
export function useBuscarClientes(barbeariaId: string | undefined, termo: string) {
  const termoLimpo = termo.trim();
  const somenteDigitos = termoLimpo.replace(/\D/g, "");

  return useQuery({
    queryKey: ["clientes-busca", barbeariaId, termoLimpo],
    enabled: !!barbeariaId && termoLimpo.length > 0,
    queryFn: async (): Promise<Cliente[]> => {
      const porNome = supabase.from("clientes").select("id, nome, telefone").ilike("nome", `%${termoLimpo}%`).order("nome").limit(20);
      const porTelefone =
        somenteDigitos.length >= 3
          ? supabase.from("clientes").select("id, nome, telefone").ilike("telefone", `%${somenteDigitos}%`).order("nome").limit(20)
          : null;

      const [resNome, resTelefone] = await Promise.all([
        porNome,
        porTelefone ?? Promise.resolve({ data: [] as Cliente[], error: null }),
      ]);
      if (resNome.error) throw resNome.error;
      if (resTelefone.error) throw resTelefone.error;

      const combinados = new Map<string, Cliente>();
      for (const c of [...(resNome.data ?? []), ...(resTelefone.data ?? [])]) combinados.set(c.id, c);
      return Array.from(combinados.values());
    },
  });
}

/** Cadastro inline em 5 segundos (spec F3): só nome + WhatsApp. */
export function useCriarCliente() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (params: { barbeariaId: string; nome: string; telefone: string }): Promise<Cliente> => {
      const { data, error } = await supabase
        .from("clientes")
        .insert({ barbearia_id: params.barbeariaId, nome: params.nome, telefone: params.telefone })
        .select("id, nome, telefone")
        .single();

      if (error) {
        // 23505 = unique_violation: já existe cliente com esse telefone
        // nessa barbearia (constraint barbearia_id+telefone). Devolve o
        // existente em vez de estourar um erro cru no meio do fluxo turbo.
        if ((error as { code?: string }).code === "23505") {
          const { data: existente, error: erroBusca } = await supabase
            .from("clientes")
            .select("id, nome, telefone")
            .eq("barbearia_id", params.barbeariaId)
            .eq("telefone", params.telefone)
            .single();
          if (erroBusca) throw erroBusca;
          return existente;
        }
        throw error;
      }
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["clientes-busca"] });
    },
  });
}
