import { useQuery } from "@tanstack/react-query";
import { buscarSugestoes, type ParametrosSugestoes } from "../lib/motorAgenda";

/**
 * Ponte reativa (React Query) para `buscarSugestoes` — usada pelo fluxo
 * turbo, que precisa recalcular a cada mudança de filtro/dia mantendo
 * cache e estado de loading. Para uma chamada única e imperativa (ex:
 * botão de WhatsApp em Retornos), chame `buscarSugestoes` direto.
 */
export function useSugestoes(params: ParametrosSugestoes) {
  return useQuery({
    queryKey: ["sugestoes", params],
    queryFn: () => buscarSugestoes(params),
  });
}
