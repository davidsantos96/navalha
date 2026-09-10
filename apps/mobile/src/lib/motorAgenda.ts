import { supabase } from "./supabase";
import { sugerirHorarios, type DiaAgenda, type Intervalo, type Sugestao } from "@navalha/agenda-inteligente";
import { offsetDaData, nomeRelativo } from "./datas";

const HORIZONTE_DIAS = 14; // spec §3.1: cobre 2 semanas (ajustado a partir do feedback do piloto)

export interface ParametrosSugestoes {
  profissionalId: string;
  duracaoServico: number;
  menorServico: number;
  buffer?: number;
  ancora?: "inicio" | "fim";
  /** Reagendamento: exclui o próprio agendamento sendo movido do cálculo de ocupação. */
  ignorarAgendamentoId?: string;
  /** Preferência do cliente — filtro, nunca fator de nota (spec §3.1). */
  janelaCliente?: Intervalo;
  /** Restringe a busca a um único dia (offset a partir de hoje) — chip "ver horários desse dia". */
  offsetDiaUnico?: number;
  /** Padrão 3; "ver outros horários" pede mais (inclui sobra útil/morto de pontuação mais baixa). */
  maxSugestoes?: number;
}

/**
 * Ponte entre o banco e o motor de sugestão. Baixa a agenda dos próximos
 * dias e calcula as sugestões NO APARELHO (spec 6.3). Função simples (não
 * hook) para poder ser chamada tanto declarativamente (`useSugestoes`,
 * fluxo turbo) quanto imperativamente (botão de WhatsApp em Retornos, que
 * só precisa da resposta uma vez, no toque, sem cache de query).
 */
export async function buscarSugestoes(params: ParametrosSugestoes): Promise<Sugestao[]> {
  const diaInicial = params.offsetDiaUnico ?? 0;
  const diaFinal = params.offsetDiaUnico ?? HORIZONTE_DIAS - 1;

  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);
  const inicioBusca = new Date(hoje);
  inicioBusca.setDate(inicioBusca.getDate() + diaInicial);
  const fimBusca = new Date(hoje);
  fimBusca.setDate(fimBusca.getDate() + diaFinal + 1);

  let consultaAgendamentos = supabase
    .from("agendamentos")
    .select("id, inicio, fim, status")
    .eq("profissional_id", params.profissionalId)
    .in("status", ["agendado", "concluido"])
    .gte("inicio", inicioBusca.toISOString())
    .lt("inicio", fimBusca.toISOString());
  if (params.ignorarAgendamentoId) {
    consultaAgendamentos = consultaAgendamentos.neq("id", params.ignorarAgendamentoId);
  }

  const [{ data: ags, error: e1 }, { data: exps, error: e2 }] = await Promise.all([
    consultaAgendamentos,
    supabase.from("expedientes").select("dia_semana, inicio_min, fim_min").eq("profissional_id", params.profissionalId),
  ]);
  if (e1) throw e1;
  if (e2) throw e2;

  const dias: DiaAgenda[] = [];
  for (let d = diaInicial; d <= diaFinal; d++) {
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
      .map((a) => ({ id: a.id, inicio: minutosDoDia(a.inicio), fim: minutosDoDia(a.fim) }));
    dias.push({ data: iso, expediente, agendamentos });
  }

  return sugerirHorarios(dias, {
    duracaoServico: params.duracaoServico,
    menorServico: params.menorServico,
    buffer: params.buffer,
    ancora: params.ancora,
    janelaCliente: params.janelaCliente,
    maxSugestoes: params.maxSugestoes ?? (params.offsetDiaUnico !== undefined ? 12 : 3),
    maxPorDia: params.offsetDiaUnico !== undefined ? 12 : undefined,
  });
}

function minutosDoDia(isoTimestamp: string): number {
  const d = new Date(isoTimestamp);
  return d.getHours() * 60 + d.getMinutes();
}

/** "Hoje" / "Amanhã" / "Seg" a partir de uma data "YYYY-MM-DD" dentro do horizonte de busca. */
export function nomeRelativoDaData(iso: string): string {
  return nomeRelativo(offsetDaData(iso, HORIZONTE_DIAS));
}
