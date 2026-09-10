import type { Intervalo } from "@navalha/agenda-inteligente";
import type { Periodo } from "../navigation/types";

/**
 * Traduz o filtro de período (UI) na `janelaCliente` que o motor entende
 * (spec §3.1: preferência do cliente é filtro, nunca fator de nota).
 */
export function janelaDoPeriodo(periodo: Periodo): Intervalo | undefined {
  if (periodo === "manha") return { inicio: 0, fim: 720 };
  if (periodo === "tarde") return { inicio: 720, fim: 1080 };
  if (periodo === "noite") return { inicio: 1080, fim: 1440 };
  return undefined;
}
