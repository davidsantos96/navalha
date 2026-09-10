import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "../lib/supabase";

export interface Servico {
  id: string;
  nome: string;
  duracaoMin: number;
  precoCentavos: number;
  ativo: boolean;
}

interface LinhaServico {
  id: string;
  nome: string;
  duracao_min: number;
  preco_centavos: number;
  ativo: boolean;
}

function mapear(l: LinhaServico): Servico {
  return { id: l.id, nome: l.nome, duracaoMin: l.duracao_min, precoCentavos: l.preco_centavos, ativo: l.ativo };
}

/**
 * Catálogo de serviços da barbearia (presets do fluxo turbo, spec F3/F1).
 * Traz ativos e inativos — quem decide o que mostrar é a tela (onboarding
 * e turbo só querem ativos; Configurações → Serviços mostra os dois).
 */
export function useServicos(barbeariaId: string | undefined) {
  return useQuery({
    queryKey: ["servicos", barbeariaId],
    enabled: !!barbeariaId,
    queryFn: async (): Promise<Servico[]> => {
      const { data, error } = await supabase
        .from("servicos")
        .select("id, nome, duracao_min, preco_centavos, ativo")
        .eq("barbearia_id", barbeariaId)
        .order("nome");
      if (error) throw error;
      return (data ?? []).map(mapear);
    },
  });
}

export function useCriarServico() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (params: { barbeariaId: string; nome: string; duracaoMin: number; precoCentavos: number }) => {
      const { error } = await supabase.from("servicos").insert({
        barbearia_id: params.barbeariaId,
        nome: params.nome,
        duracao_min: params.duracaoMin,
        preco_centavos: params.precoCentavos,
      });
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["servicos"] }),
  });
}

/** Editar nome/duração/preço e ativar/desativar são a mesma operação: um update parcial. */
export function useAtualizarServico() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (params: {
      id: string;
      nome?: string;
      duracaoMin?: number;
      precoCentavos?: number;
      ativo?: boolean;
    }) => {
      const { id, ...resto } = params;
      const patch: Record<string, unknown> = {};
      if (resto.nome !== undefined) patch.nome = resto.nome;
      if (resto.duracaoMin !== undefined) patch.duracao_min = resto.duracaoMin;
      if (resto.precoCentavos !== undefined) patch.preco_centavos = resto.precoCentavos;
      if (resto.ativo !== undefined) patch.ativo = resto.ativo;
      const { error } = await supabase.from("servicos").update(patch).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["servicos"] }),
  });
}

/**
 * A FK de `agendamentos.servico_id` (sem cascade) recusa a exclusão de um
 * serviço já usado em algum atendimento — o histórico não pode perder a
 * referência. Nesse caso a tela deve orientar a desativar em vez de excluir.
 */
export function useRemoverServico() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("servicos").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["servicos"] }),
  });
}
