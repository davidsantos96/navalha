import { useQuery } from "@tanstack/react-query";
import { supabase } from "../lib/supabase";
import { espacosLivres, type DiaAgenda, type Intervalo } from "@navalha/agenda-inteligente";

export type StatusAgendamento = "agendado" | "concluido" | "falta" | "cancelado";

export interface ItemAgenda {
  id: string;
  inicio: number; // minutos desde 00:00
  fim: number;
  status: StatusAgendamento;
  clienteId: string | null;
  clienteNome: string | null;
  servicoNome: string | null;
  motivo: string | null;
  ehBloqueio: boolean;
}

export interface AgendaDoDia {
  itens: ItemAgenda[];
  espacosLivres: Intervalo[]; // a tela decide o que vira "buraco morto" (depende do menor serviço)
  minutosOcupados: number;
  minutosExpediente: number;
}

// Formato bruto da linha antes de mapear para ItemAgenda. O projeto não
// gera tipos do Postgres, então a forma do embed (clientes/servicos) é
// descrita manualmente aqui.
interface LinhaAgendamento {
  id: string;
  inicio: string;
  fim: string;
  status: StatusAgendamento;
  cliente_id: string | null;
  motivo: string | null;
  clientes: { nome: string } | null;
  servicos: { nome: string } | null;
}

/** Agenda de UM dia (spec F2): itens do dia + espaços livres para desenhar a linha do tempo. */
export function useAgendaDoDia(profissionalId: string | undefined, data: string /* "YYYY-MM-DD" */) {
  return useQuery({
    queryKey: ["agenda-dia", profissionalId, data],
    enabled: !!profissionalId,
    queryFn: async (): Promise<AgendaDoDia> => {
      const inicioDia = `${data}T00:00:00`;
      const fimDia = `${data}T23:59:59`;
      const diaSemana = new Date(`${data}T12:00:00`).getDay();

      const [{ data: ags, error: e1 }, { data: exps, error: e2 }] = await Promise.all([
        supabase
          .from("agendamentos")
          .select("id, inicio, fim, status, cliente_id, motivo, clientes(nome), servicos(nome)")
          .eq("profissional_id", profissionalId)
          .in("status", ["agendado", "concluido"])
          .gte("inicio", inicioDia)
          .lte("inicio", fimDia)
          .order("inicio") as unknown as { data: LinhaAgendamento[] | null; error: any },
        supabase
          .from("expedientes")
          .select("inicio_min, fim_min")
          .eq("profissional_id", profissionalId)
          .eq("dia_semana", diaSemana),
      ]);
      if (e1) throw e1;
      if (e2) throw e2;

      const itens: ItemAgenda[] = (ags ?? []).map((a) => ({
        id: a.id,
        inicio: minutosDoDia(a.inicio),
        fim: minutosDoDia(a.fim),
        status: a.status,
        clienteId: a.cliente_id,
        clienteNome: a.clientes?.nome ?? null,
        servicoNome: a.servicos?.nome ?? null,
        motivo: a.motivo,
        ehBloqueio: a.cliente_id == null,
      }));

      const expediente = (exps ?? []).map((e) => ({ inicio: e.inicio_min, fim: e.fim_min }));
      const diaAgenda: DiaAgenda = {
        data,
        expediente,
        agendamentos: itens.map((i) => ({ id: i.id, inicio: i.inicio, fim: i.fim })),
      };

      const minutosExpediente = expediente.reduce((soma, b) => soma + (b.fim - b.inicio), 0);
      const minutosOcupados = itens.reduce((soma, i) => soma + (i.fim - i.inicio), 0);

      return {
        itens,
        espacosLivres: espacosLivres(diaAgenda),
        minutosOcupados,
        minutosExpediente,
      };
    },
  });
}

function minutosDoDia(isoTimestamp: string): number {
  const d = new Date(isoTimestamp);
  return d.getHours() * 60 + d.getMinutes();
}
