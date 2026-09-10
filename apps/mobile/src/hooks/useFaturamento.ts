import { useQuery } from "@tanstack/react-query";
import { supabase } from "../lib/supabase";

export interface FaturamentoPorDia {
  diaSemana: number; // 0 = domingo
  totalCentavos: number;
}

export interface FaturamentoPorServico {
  servicoId: string;
  nome: string;
  quantidade: number;
  totalCentavos: number;
}

export interface Faturamento {
  totalDiaCentavos: number;
  totalSemanaCentavos: number;
  atendimentosSemana: number;
  ticketMedioCentavos: number;
  faltasSemana: number;
  porDia: FaturamentoPorDia[]; // segunda a domingo da semana de `data`
  porServico: FaturamentoPorServico[]; // ordenado por total desc
}

interface LinhaFaturamento {
  inicio: string;
  status: "agendado" | "concluido" | "falta" | "cancelado";
  preco_centavos: number | null;
  servico_id: string | null;
  servicos: { nome: string } | null;
}

/**
 * Painel mínimo (spec F8): faturado do dia e da semana, atendimentos,
 * ticket médio, faltas, e os dois recortes extras que o protótipo de
 * referência acrescentou (por dia / por serviço) — só conta concluído
 * (agendado ainda não é dinheiro no bolso).
 *
 * Usa o preço gravado no próprio agendamento (snapshot no momento da
 * criação, ver migração 0005 e `useCriarAgendamento`), não o preço atual
 * do serviço — reajustar um preço não pode reescrever faturamento
 * passado.
 *
 * Semana = segunda a domingo (convenção BR; a spec não define
 * explicitamente o corte da semana) — mesma janela usada no card do dia
 * e no gráfico por dia, pra não misturar duas definições de "semana".
 */
export function useFaturamento(profissionalId: string | undefined, data: string /* "YYYY-MM-DD", dia de referência */) {
  return useQuery({
    queryKey: ["faturamento", profissionalId, data],
    enabled: !!profissionalId,
    queryFn: async (): Promise<Faturamento> => {
      const dia = new Date(`${data}T12:00:00`);
      const inicioDia = `${data}T00:00:00`;
      const fimDia = `${data}T23:59:59`;

      const diaSemanaRef = dia.getDay(); // 0 = domingo
      const offsetSegunda = diaSemanaRef === 0 ? 6 : diaSemanaRef - 1;
      const inicioSemanaDate = new Date(dia);
      inicioSemanaDate.setDate(dia.getDate() - offsetSegunda);
      const inicioSemana = `${inicioSemanaDate.toISOString().slice(0, 10)}T00:00:00`;
      const fimSemanaDate = new Date(inicioSemanaDate);
      fimSemanaDate.setDate(inicioSemanaDate.getDate() + 6);
      const fimSemana = `${fimSemanaDate.toISOString().slice(0, 10)}T23:59:59`;

      const [{ data: concluidos, error: e1 }, { count: faltasSemana, error: e2 }] = await Promise.all([
        supabase
          .from("agendamentos")
          .select("inicio, status, preco_centavos, servico_id, servicos(nome)")
          .eq("profissional_id", profissionalId)
          .eq("status", "concluido")
          .gte("inicio", inicioSemana)
          .lte("inicio", fimSemana) as unknown as Promise<{ data: LinhaFaturamento[] | null; error: any }>,
        supabase
          .from("agendamentos")
          .select("id", { count: "exact", head: true })
          .eq("profissional_id", profissionalId)
          .eq("status", "falta")
          .gte("inicio", inicioSemana)
          .lte("inicio", fimSemana),
      ]);
      if (e1) throw e1;
      if (e2) throw e2;

      let totalDiaCentavos = 0;
      let totalSemanaCentavos = 0;
      const porDiaMap = new Map<number, number>();
      const porServicoMap = new Map<string, FaturamentoPorServico>();

      for (const l of concluidos ?? []) {
        const preco = l.preco_centavos ?? 0;
        totalSemanaCentavos += preco;
        if (l.inicio >= inicioDia && l.inicio <= fimDia) totalDiaCentavos += preco;

        const dow = new Date(l.inicio).getDay();
        porDiaMap.set(dow, (porDiaMap.get(dow) ?? 0) + preco);

        if (l.servico_id) {
          const atual = porServicoMap.get(l.servico_id) ?? {
            servicoId: l.servico_id,
            nome: l.servicos?.nome ?? "—",
            quantidade: 0,
            totalCentavos: 0,
          };
          atual.quantidade++;
          atual.totalCentavos += preco;
          porServicoMap.set(l.servico_id, atual);
        }
      }

      const atendimentosSemana = (concluidos ?? []).length;
      const porDia: FaturamentoPorDia[] = [1, 2, 3, 4, 5, 6, 0].map((diaSemana) => ({
        diaSemana,
        totalCentavos: porDiaMap.get(diaSemana) ?? 0,
      }));
      const porServico = Array.from(porServicoMap.values()).sort((a, b) => b.totalCentavos - a.totalCentavos);

      return {
        totalDiaCentavos,
        totalSemanaCentavos,
        atendimentosSemana,
        ticketMedioCentavos: atendimentosSemana ? Math.round(totalSemanaCentavos / atendimentosSemana) : 0,
        faltasSemana: faltasSemana ?? 0,
        porDia,
        porServico,
      };
    },
  });
}
