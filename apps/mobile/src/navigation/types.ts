import type { Sugestao } from "@navalha/agenda-inteligente";

/**
 * Filtro de período do passo 3 do fluxo turbo (spec §3.1) — puramente de
 * UI. O motor (`@navalha/agenda-inteligente`) não conhece "manhã/tarde/
 * noite"; a tela traduz o filtro escolhido numa `janelaCliente` em
 * minutos antes de chamar `useSugestoes` (ver `src/lib/periodo.ts`).
 */
export type Periodo = "todos" | "manha" | "tarde" | "noite";

export type Rota =
  | "turbo1"
  | "turbo2"
  | "turbo3"
  | "turboConfirmar"
  | "faturamento"
  | "configHub"
  | "configPerfil"
  | "configBarbearia"
  | "configServicos"
  | "configHorarios"
  | "configBloqueios"
  | "configAlgoritmo"
  | "configAjuda";

export interface TurboState {
  clienteId: string | null;
  clienteNome: string | null;
  clienteTelefone: string | null;
  servicoId: string | null;
  servicoNome: string | null;
  servicoDuracaoMin: number | null;
  servicoPrecoCentavos: number | null;
  sugestao: Sugestao | null;
  /** Preenchido quando o fluxo é um reagendamento (sheet → "Reagendar"). */
  reagendandoId: string | null;
  filtroPeriodo: Periodo;
  diaSelecionadoOffset: number | null;
  incluirBuracoMorto: boolean;
  /**
   * Preenchido quando o fluxo começou por um toque num horário livre da
   * agenda (em vez do botão "+"). Nesse caso o horário já está decidido —
   * o passo 3 (Melhores encaixes) é pulado assim que o serviço é
   * escolhido, direto pra confirmação.
   */
  horarioForcado: { data: string; inicio: number } | null;
}

export const turboVazio: TurboState = {
  clienteId: null,
  clienteNome: null,
  clienteTelefone: null,
  servicoId: null,
  servicoNome: null,
  servicoDuracaoMin: null,
  servicoPrecoCentavos: null,
  sugestao: null,
  reagendandoId: null,
  filtroPeriodo: "todos",
  diaSelecionadoOffset: null,
  incluirBuracoMorto: false,
  horarioForcado: null,
};

export interface Navegacao {
  push: (rota: Rota) => void;
  pop: () => void;
  popToRoot: () => void;
}
