import { useQuery } from "@tanstack/react-query";
import { supabase } from "../lib/supabase";
import {
  sugerirHorarios,
  type DiaAgenda,
  type Sugestao,
} from "@navalha/agenda-inteligente";

/**
 * Ponte entre o banco e o motor de sugestão.
 * Baixa a agenda dos próximos 7 dias e calcula as sugestões NO APARELHO
 * (spec 6.3: o aparelho pensa rápido; o banco garante a verdade).
 */
export function useSugestoes(params: {
  profissionalId: string;
  duracaoServico: number;
  menorServico: number;
  buffer?: number;
  ancora?: "inicio" | "fim";
  /** Reagendamento: exclui o próprio agendamento sendo movido do cálculo de ocupação. */
  ignorarAgendamentoId?: string;
}) {
  return useQuery({
    queryKey: ["sugestoes", params],
    queryFn: async (): Promise<Sugestao[]> => {
      const hoje = new Date();
      const fim = new Date(hoje);
      fim.setDate(fim.getDate() + 7);

      let consultaAgendamentos = supabase
        .from("agendamentos")
        .select("id, inicio, fim, status")
        .eq("profissional_id", params.profissionalId)
        .in("status", ["agendado", "concluido"])
        .gte("inicio", hoje.toISOString())
        .lt("inicio", fim.toISOString());
      if (params.ignorarAgendamentoId) {
        consultaAgendamentos = consultaAgendamentos.neq("id", params.ignorarAgendamentoId);
      }

      const [{ data: ags, error: e1 }, { data: exps, error: e2 }] = await Promise.all([
        consultaAgendamentos,
        supabase
          .from("expedientes")
          .select("dia_semana, inicio_min, fim_min")
          .eq("profissional_id", params.profissionalId),
      ]);
      if (e1) throw e1;
      if (e2) throw e2;

      const dias: DiaAgenda[] = [];
      for (let d = 0; d < 7; d++) {
        const data = new Date(hoje);
        data.setDate(data.getDate() + d);
        const iso = data.toISOString().slice(0, 10);
        const dow = data.getDay();
        const expediente = (exps ?? [])
          .filter((e) => e.dia_semana === dow)
          .map((e) => ({ inicio: e.inicio_min, fim: e.fim_min }));
        if (!expediente.length) continue; // dia sem expediente = fechado

        const agendamentos = (ags ?? [])
          .filter((a) => a.inicio.slice(0, 10) === iso)
          .map((a) => ({
            id: a.id,
            inicio: minutosDoDia(a.inicio),
            fim: minutosDoDia(a.fim),
          }));
        dias.push({ data: iso, expediente, agendamentos });
      }

      return sugerirHorarios(dias, {
        duracaoServico: params.duracaoServico,
        menorServico: params.menorServico,
        buffer: params.buffer,
        ancora: params.ancora,
      });
    },
  });
}

function minutosDoDia(isoTimestamp: string): number {
  const d = new Date(isoTimestamp);
  return d.getHours() * 60 + d.getMinutes();
}
