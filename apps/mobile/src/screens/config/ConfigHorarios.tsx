import { useEffect, useState } from "react";
import { ScrollView, StyleSheet, Text } from "react-native";
import { cores, fontes } from "../../theme";
import type { Profissional } from "../../hooks/useProfissional";
import { useExpedientes, useSalvarExpedientes } from "../../hooks/useExpedientes";
import { deLinhas, paraLinhas, validarExpediente, type Bloco, type DiaExpediente } from "../../lib/expediente";
import { BotaoPrimario, Carregando, MensagemErro, ScreenHeader } from "../../components/ui";
import { ExpedienteEditor } from "../../components/ExpedienteEditor";
import type { Navegacao } from "../../navigation/types";

export function ConfigHorariosScreen({ profissional, nav }: { profissional: Profissional; nav: Navegacao }) {
  const expedientes = useExpedientes(profissional.id);
  const salvar = useSalvarExpedientes();
  const [dias, setDias] = useState<DiaExpediente[] | null>(null);
  const [erro, setErro] = useState<string | null>(null);

  useEffect(() => {
    if (expedientes.data && !dias) setDias(deLinhas(expedientes.data));
  }, [expedientes.data, dias]);

  if (expedientes.isLoading || !dias) return <Carregando />;

  function alternarDia(diaSemana: number, aberto: boolean) {
    setDias((atual) =>
      (atual ?? []).map((d) =>
        d.diaSemana === diaSemana ? { ...d, aberto, blocos: aberto && d.blocos.length === 0 ? [{ inicioMin: 9 * 60, fimMin: 18 * 60 }] : d.blocos } : d
      )
    );
  }

  function atualizarBloco(diaSemana: number, indice: number, campo: keyof Bloco, valor: number) {
    setDias((atual) => (atual ?? []).map((d) => (d.diaSemana === diaSemana ? { ...d, blocos: d.blocos.map((b, i) => (i === indice ? { ...b, [campo]: valor } : b)) } : d)));
  }

  function adicionarBloco(diaSemana: number) {
    setDias((atual) => (atual ?? []).map((d) => (d.diaSemana === diaSemana ? { ...d, blocos: [...d.blocos, { inicioMin: 9 * 60, fimMin: 18 * 60 }] } : d)));
  }

  function removerBloco(diaSemana: number, indice: number) {
    setDias((atual) => (atual ?? []).map((d) => (d.diaSemana === diaSemana ? { ...d, blocos: d.blocos.filter((_, i) => i !== indice) } : d)));
  }

  function copiarParaDiasUteis(diaSemanaOrigem: number) {
    setDias((atual) => {
      const lista = atual ?? [];
      const origem = lista.find((d) => d.diaSemana === diaSemanaOrigem);
      if (!origem) return lista;
      return lista.map((d) => (d.diaSemana >= 1 && d.diaSemana <= 5 ? { ...d, aberto: true, blocos: origem.blocos.map((b) => ({ ...b })) } : d));
    });
  }

  function salvarTudo() {
    setErro(null);
    const diasAtuais = dias ?? [];
    const e = validarExpediente(diasAtuais);
    if (e) {
      setErro(e);
      return;
    }
    salvar.mutate({ profissionalId: profissional.id, blocos: paraLinhas(diasAtuais) });
  }

  return (
    <>
      <ScreenHeader titulo="Horários de trabalho" onVoltar={() => nav.pop()} />
      <ScrollView style={{ flex: 1, backgroundColor: cores.fundo }} contentContainerStyle={s.conteudo}>
        <Text style={s.nota}>A agenda inteligente só sugere horários dentro do expediente.</Text>
        <ExpedienteEditor dias={dias} onAlternarDia={alternarDia} onAtualizarBloco={atualizarBloco} onAdicionarBloco={adicionarBloco} onRemoverBloco={removerBloco} onCopiarParaDiasUteis={copiarParaDiasUteis} />
        <MensagemErro texto={erro} />
      </ScrollView>
      <BotaoPrimario texto={salvar.isPending ? "Salvando…" : "Salvar horários"} onPress={salvarTudo} disabled={salvar.isPending} style={s.botaoRodape} />
    </>
  );
}

const s = StyleSheet.create({
  conteudo: { paddingHorizontal: 20, paddingTop: 4, paddingBottom: 20, backgroundColor: cores.fundo },
  nota: { fontSize: 13, color: cores.sub, marginBottom: 12, lineHeight: 18 },
  botaoRodape: { marginHorizontal: 20, marginBottom: 20 },
});
