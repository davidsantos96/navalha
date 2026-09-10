import { useState } from "react";
import { Platform, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import DateTimePicker from "@react-native-community/datetimepicker";
import { useQueryClient } from "@tanstack/react-query";
import { cores, fontes, raio } from "../../theme";
import { supabase } from "../../lib/supabase";
import type { Profissional } from "../../hooks/useProfissional";
import { useBloqueios } from "../../hooks/useBloqueios";
import { useCriarBloqueio } from "../../hooks/useCriarBloqueio";
import { useAtualizarStatusAgendamento } from "../../hooks/useAtualizarStatusAgendamento";
import { useExpedientes } from "../../hooks/useExpedientes";
import { dataCurta, dataISODoOffset, diaSemanaDoOffset, minutosParaISO, nomeRelativo } from "../../lib/datas";
import { dataParaMin, formatarMin, minParaData } from "../../lib/expediente";
import { BotaoPrimario, Carregando, Chip, MensagemErro, MensagemSucesso, ScreenHeader } from "../../components/ui";
import type { Navegacao } from "../../navigation/types";

interface ConflitoAgendamento {
  id: string;
  inicio: string;
  fim: string;
  clienteNome: string | null;
}

/** Agendamentos com cliente que se sobrepõem ao período [inicioISO, fimISO). */
async function buscarConflitos(profissionalId: string, inicioISO: string, fimISO: string): Promise<ConflitoAgendamento[]> {
  const { data, error } = await supabase
    .from("agendamentos")
    .select("id, inicio, fim, clientes(nome)")
    .eq("profissional_id", profissionalId)
    .not("cliente_id", "is", null)
    .in("status", ["agendado", "concluido"])
    .lt("inicio", fimISO)
    .gt("fim", inicioISO);
  if (error) throw error;
  return (data ?? []).map((a: any) => ({ id: a.id, inicio: a.inicio, fim: a.fim, clienteNome: a.clientes?.nome ?? null }));
}

export function ConfigBloqueiosScreen({ profissional, nav }: { profissional: Profissional; nav: Navegacao }) {
  const queryClient = useQueryClient();
  const bloqueios = useBloqueios(profissional.id);
  const expedientes = useExpedientes(profissional.id);
  const criarBloqueio = useCriarBloqueio();
  const atualizarStatus = useAtualizarStatusAgendamento();

  const [diaOffset, setDiaOffset] = useState(1);
  const [todoDia, setTodoDia] = useState(true);
  const [inicioMin, setInicioMin] = useState(9 * 60);
  const [fimMin, setFimMin] = useState(12 * 60);
  const [pickerAberto, setPickerAberto] = useState<"inicio" | "fim" | null>(null);
  const [erro, setErro] = useState<string | null>(null);
  const [sucesso, setSucesso] = useState(false);
  const [verificando, setVerificando] = useState(false);
  const [conflitos, setConflitos] = useState<ConflitoAgendamento[] | null>(null);

  if (bloqueios.isLoading || expedientes.isLoading) return <Carregando />;

  // Qualquer mudança no que vai ser bloqueado invalida uma checagem de
  // conflito anterior — senão dava pra confirmar "mesmo assim" pra um
  // horário diferente do que foi checado.
  function limparChecagem() {
    setErro(null);
    setSucesso(false);
    setConflitos(null);
  }

  async function bloquear() {
    setErro(null);
    setSucesso(false);
    const blocosDoDia = (expedientes.data ?? []).filter((b) => b.diaSemana === diaSemanaDoOffset(diaOffset));
    if (blocosDoDia.length === 0) {
      setErro("Esse dia já está fechado no expediente.");
      return;
    }
    let i = inicioMin;
    let f = fimMin;
    if (todoDia) {
      i = Math.min(...blocosDoDia.map((b) => b.inicioMin));
      f = Math.max(...blocosDoDia.map((b) => b.fimMin));
    } else if (f <= i) {
      setErro("O fim precisa ser depois do início.");
      return;
    }
    const dataISO = dataISODoOffset(diaOffset);
    const inicioISO = minutosParaISO(dataISO, i);
    const fimISO = minutosParaISO(dataISO, f);

    if (!conflitos) {
      setVerificando(true);
      try {
        const encontrados = await buscarConflitos(profissional.id, inicioISO, fimISO);
        setVerificando(false);
        if (encontrados.length > 0) {
          setConflitos(encontrados);
          return; // espera o barbeiro confirmar o cancelamento dos conflitos
        }
      } catch {
        setVerificando(false);
        setErro("Não deu pra checar conflitos com a agenda — tenta de novo.");
        return;
      }
    }

    // O banco não deixa um bloqueio sobrepor um agendamento ativo (mesma
    // exclusion constraint que evita dois clientes no mesmo horário) — se
    // o barbeiro confirmou "cancelar e bloquear", cancela os conflitantes
    // primeiro pra abrir espaço pro bloqueio.
    if (conflitos && conflitos.length > 0) {
      try {
        await Promise.all(conflitos.map((c) => atualizarStatus.mutateAsync({ id: c.id, status: "cancelado" })));
      } catch {
        setErro("Não deu pra cancelar os agendamentos em conflito — tenta de novo.");
        return;
      }
    }

    criarBloqueio.mutate(
      { barbeariaId: profissional.barbearia_id, profissionalId: profissional.id, inicio: inicioISO, fim: fimISO },
      {
        onSuccess: () => {
          setConflitos(null);
          setSucesso(true);
        },
        onError: () => setErro("Não deu pra bloquear — tenta de novo."),
      }
    );
  }

  function remover(id: string) {
    atualizarStatus.mutate({ id, status: "cancelado" }, { onSuccess: () => queryClient.invalidateQueries({ queryKey: ["bloqueios"] }) });
  }

  return (
    <View style={s.tela}>
      <ScreenHeader titulo="Bloqueios e folgas" onVoltar={() => nav.pop()} />
      <ScrollView contentContainerStyle={s.conteudo}>
        <Text style={s.nota}>Horário bloqueado vira espaço ocupado — a agenda inteligente não sugere nada ali.</Text>

        {(bloqueios.data ?? []).map((b) => (
          <View key={b.id} style={s.linha}>
            <Text style={s.linhaTexto}>
              {formatarDataHora(b.inicio)} – {formatarHora(b.fim)}
              {b.motivo ? ` · ${b.motivo}` : ""}
            </Text>
            <Pressable style={s.remover} onPress={() => remover(b.id)} accessibilityLabel="Remover bloqueio">
              <Text style={{ color: cores.fraco, fontSize: 15 }}>×</Text>
            </Pressable>
          </View>
        ))}
        {(bloqueios.data ?? []).length === 0 && <Text style={s.vazio}>Nenhum bloqueio nos próximos dias.</Text>}

        <View style={s.novoCartao}>
          <Text style={s.novoTitulo}>Novo bloqueio</Text>
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 6, marginBottom: 12 }}>
            {[0, 1, 2, 3, 4, 5, 6].map((d) => (
              <Chip
                key={d}
                ativo={diaOffset === d}
                texto={`${nomeRelativo(d)} ${dataCurta(d).split(" ")[0]}`}
                onPress={() => {
                  limparChecagem();
                  setDiaOffset(d);
                }}
              />
            ))}
          </View>
          <View style={{ flexDirection: "row", gap: 8, marginBottom: 10 }}>
            <Pressable
              style={[s.opcao, todoDia && s.opcaoAtiva, { flex: 1 }]}
              onPress={() => {
                limparChecagem();
                setTodoDia(true);
              }}
            >
              <Text style={[s.opcaoTexto, todoDia && s.opcaoTextoAtiva]}>Dia inteiro</Text>
            </Pressable>
            <Pressable
              style={[s.opcao, !todoDia && s.opcaoAtiva, { flex: 1 }]}
              onPress={() => {
                limparChecagem();
                setTodoDia(false);
              }}
            >
              <Text style={[s.opcaoTexto, !todoDia && s.opcaoTextoAtiva]}>Só um trecho</Text>
            </Pressable>
          </View>
          {!todoDia && (
            <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 10 }}>
              <Pressable style={s.chipHora} onPress={() => setPickerAberto("inicio")}>
                <Text style={s.chipHoraTxt}>{formatarMin(inicioMin)}</Text>
              </Pressable>
              <Text style={{ fontSize: 13, color: cores.sub, fontFamily: fontes.corpoSemi }}>até</Text>
              <Pressable style={s.chipHora} onPress={() => setPickerAberto("fim")}>
                <Text style={s.chipHoraTxt}>{formatarMin(fimMin)}</Text>
              </Pressable>
            </View>
          )}
          {pickerAberto && (
            <View style={s.pickerCaixa}>
              <DateTimePicker
                value={minParaData(pickerAberto === "inicio" ? inicioMin : fimMin)}
                mode="time"
                is24Hour
                display={Platform.OS === "ios" ? "spinner" : "default"}
                onChange={(_e, valor) => {
                  if (Platform.OS !== "ios") setPickerAberto(null);
                  if (!valor) return;
                  limparChecagem();
                  if (pickerAberto === "inicio") setInicioMin(dataParaMin(valor));
                  else setFimMin(dataParaMin(valor));
                }}
              />
              {Platform.OS === "ios" && <BotaoPrimario texto="Pronto" onPress={() => setPickerAberto(null)} />}
            </View>
          )}

          {conflitos && conflitos.length > 0 && (
            <View style={s.conflitoCartao}>
              <Text style={s.conflitoTitulo}>
                {conflitos.length} agendamento{conflitos.length > 1 ? "s" : ""} nesse horário
              </Text>
              {conflitos.map((c) => (
                <Text key={c.id} style={s.conflitoLinha}>
                  · {formatarHora(c.inicio)}–{formatarHora(c.fim)} {c.clienteNome ? `com ${c.clienteNome}` : ""}
                </Text>
              ))}
              <Text style={s.conflitoNota}>
                O horário só libera se esses agendamentos forem cancelados. Confirmando abaixo, o app cancela eles automaticamente — avise os
                clientes pelo WhatsApp antes.
              </Text>
            </View>
          )}

          <MensagemErro texto={erro} />
          <MensagemSucesso texto={sucesso ? "Bloqueio criado com sucesso." : null} />

          <Pressable style={s.bloquearBotao} onPress={bloquear} disabled={criarBloqueio.isPending || verificando || atualizarStatus.isPending}>
            <Text style={s.bloquearTexto}>
              {verificando
                ? "Checando a agenda…"
                : criarBloqueio.isPending || atualizarStatus.isPending
                  ? "Bloqueando…"
                  : conflitos && conflitos.length > 0
                    ? "Cancelar agendamentos e bloquear"
                    : "Bloquear horário"}
            </Text>
          </Pressable>
        </View>
      </ScrollView>
    </View>
  );
}

function formatarHora(iso: string): string {
  const d = new Date(iso);
  return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}

function formatarDataHora(iso: string): string {
  const d = new Date(iso);
  const DIAS = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];
  return `${DIAS[d.getDay()]} · ${formatarHora(iso)}`;
}

const s = StyleSheet.create({
  tela: { flex: 1, backgroundColor: cores.fundo },
  conteudo: { paddingHorizontal: 20, paddingTop: 4, paddingBottom: 30 },
  nota: { fontSize: 13, color: cores.sub, marginBottom: 12, lineHeight: 18 },
  linha: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 10, backgroundColor: cores.card, borderWidth: 1, borderColor: cores.linha, borderRadius: raio.card, padding: 13, paddingHorizontal: 16, marginBottom: 8 },
  linhaTexto: { fontFamily: fontes.corpoNegrito, fontSize: 14.5, color: cores.tinta },
  remover: { width: 30, height: 30, borderRadius: 10, borderWidth: 1, borderColor: cores.linha, backgroundColor: "#fff", alignItems: "center", justifyContent: "center" },
  vazio: { fontSize: 13.5, color: cores.fraco, paddingBottom: 10 },
  novoCartao: { backgroundColor: cores.card, borderWidth: 1.5, borderColor: "#C6CCD4", borderStyle: "dashed", borderRadius: raio.card, padding: 14, marginTop: 8 },
  novoTitulo: { fontFamily: fontes.corpoNegrito, fontSize: 14, color: cores.tinta, marginBottom: 10 },
  opcao: { paddingVertical: 12, borderRadius: 12, borderWidth: 1.5, borderColor: cores.linha, backgroundColor: "#fff", alignItems: "center" },
  opcaoAtiva: { borderColor: cores.tinta, backgroundColor: "#EDF0F5" },
  opcaoTexto: { fontFamily: fontes.corpoSemi, fontSize: 13.5, color: cores.tinta },
  opcaoTextoAtiva: { fontFamily: fontes.corpoNegrito },
  chipHora: { flex: 1, backgroundColor: cores.fundo, borderRadius: raio.botao, borderWidth: 1, borderColor: cores.linha, paddingVertical: 12, alignItems: "center" },
  chipHoraTxt: { color: cores.tinta, fontSize: 16, fontFamily: fontes.titulo },
  pickerCaixa: { backgroundColor: "#fff", borderRadius: raio.card, borderWidth: 1, borderColor: cores.linha, padding: 8, marginBottom: 12, alignItems: "center" },
  bloquearBotao: { width: "100%", paddingVertical: 14, borderRadius: 12, backgroundColor: cores.tinta, alignItems: "center" },
  bloquearTexto: { color: "#fff", fontFamily: fontes.corpoNegrito, fontSize: 15 },
  conflitoCartao: { backgroundColor: cores.ambarSuave, borderWidth: 1, borderColor: "#EAD4A6", borderRadius: raio.card, padding: 12, marginBottom: 10 },
  conflitoTitulo: { color: cores.ambar, fontFamily: fontes.corpoNegrito, fontSize: 13.5, marginBottom: 4 },
  conflitoLinha: { color: cores.ambar, fontFamily: fontes.corpoMedio, fontSize: 13, lineHeight: 18 },
  conflitoNota: { color: cores.ambar, fontFamily: fontes.corpoSemi, fontSize: 12, marginTop: 6, lineHeight: 16 },
});
