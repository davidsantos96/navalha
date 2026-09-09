import { useQuery } from "@tanstack/react-query";
import { supabase } from "../lib/supabase";

export interface Profissional {
  id: string;
  barbearia_id: string;
  nome: string;
  ancora: "inicio" | "fim";
  buffer_min: number;
}

/** Existe profissional para este usuário? Se não, F1 (onboarding) ainda não rodou. */
export function useProfissional(userId: string | undefined) {
  return useQuery({
    queryKey: ["profissional", userId],
    queryFn: async (): Promise<Profissional | null> => {
      const { data, error } = await supabase
        .from("profissionais")
        .select("id, barbearia_id, nome, ancora, buffer_min")
        .eq("user_id", userId)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!userId,
  });
}
