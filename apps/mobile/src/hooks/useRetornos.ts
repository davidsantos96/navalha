import { useQuery } from "@tanstack/react-query";
import { supabase } from "../lib/supabase";

export interface Retorno {
  clienteId: string;
  nome: string;
  telefone: string;
  ultimoAtendimento: string;
  cicloDias: number;
  previstoPara: string;
  vencido: boolean;
  /** Serviço do último atendimento concluído — usado como proxy pro reencaixe (F7, ver migração 0004). */
  servicoHabitualId: string | null;
}

interface LinhaRetorno {
  cliente_id: string;
  nome: string;
  telefone: string;
  ultimo_atendimento: string;
  ciclo_dias: number;
  previsto_para: string;
  vencido: boolean;
  servico_habitual_id: string | null;
}

/**
 * Clientes "na hora de voltar" (spec F6), vencidos primeiro (spec §3.3).
 * A view `retornos` já é multi-tenant por si só (RLS das tabelas base
 * que ela consulta) — `barbeariaId` aqui só serve de chave/gate do
 * React Query, não filtra a query.
 */
export function useRetornos(barbeariaId: string | undefined) {
  return useQuery({
    queryKey: ["retornos", barbeariaId],
    enabled: !!barbeariaId,
    queryFn: async (): Promise<Retorno[]> => {
      const { data, error } = (await supabase
        .from("retornos")
        .select("cliente_id, nome, telefone, ultimo_atendimento, ciclo_dias, previsto_para, vencido, servico_habitual_id")
        .order("vencido", { ascending: false })
        .order("previsto_para", { ascending: true })) as unknown as {
        data: LinhaRetorno[] | null;
        error: any;
      };
      if (error) throw error;
      return (data ?? []).map((r) => ({
        clienteId: r.cliente_id,
        nome: r.nome,
        telefone: r.telefone,
        ultimoAtendimento: r.ultimo_atendimento,
        cicloDias: r.ciclo_dias,
        previstoPara: r.previsto_para,
        vencido: r.vencido,
        servicoHabitualId: r.servico_habitual_id,
      }));
    },
  });
}
