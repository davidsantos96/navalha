import { useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import Svg, { Path, Rect } from "react-native-svg";
import { cores, fontes } from "../theme";
import type { Profissional } from "../hooks/useProfissional";
import { AgendaScreen, type ReagendarPayload } from "../screens/AgendaScreen";
import { RetornosScreen } from "../screens/RetornosScreen";
import { FaturamentoScreen } from "../screens/FaturamentoScreen";
import { Turbo1ClienteScreen } from "../screens/turbo/Turbo1Cliente";
import { Turbo2ServicoScreen } from "../screens/turbo/Turbo2Servico";
import { Turbo3SugestoesScreen } from "../screens/turbo/Turbo3Sugestoes";
import { TurboConfirmarScreen } from "../screens/turbo/TurboConfirmar";
import { ConfigHubScreen } from "../screens/config/ConfigHub";
import { ConfigPerfilScreen } from "../screens/config/ConfigPerfil";
import { ConfigBarbeariaScreen } from "../screens/config/ConfigBarbearia";
import { ConfigServicosScreen } from "../screens/config/ConfigServicos";
import { ConfigHorariosScreen } from "../screens/config/ConfigHorarios";
import { ConfigBloqueiosScreen } from "../screens/config/ConfigBloqueios";
import { ConfigAlgoritmoScreen } from "../screens/config/ConfigAlgoritmo";
import { ConfigAjudaScreen } from "../screens/config/ConfigAjuda";
import { turboVazio, type Navegacao, type Rota, type TurboState } from "./types";

function IconeAgenda({ ativo }: { ativo: boolean }) {
  const c = ativo ? cores.azul : cores.fraco;
  return (
    <Svg width={22} height={22} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth={2}>
      <Rect x={3} y={5} width={18} height={16} rx={3} />
      <Path d="M3 10h18M8 3v4M16 3v4" />
    </Svg>
  );
}

function IconeRetornos({ ativo }: { ativo: boolean }) {
  const c = ativo ? cores.azul : cores.fraco;
  return (
    <Svg width={22} height={22} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth={2}>
      <Path d="M4 5a2 2 0 0 1 2-2h2l2 5-2.5 1.5a11 11 0 0 0 5 5L14 12l5 2v2a2 2 0 0 1-2 2A15 15 0 0 1 4 5z" />
    </Svg>
  );
}

/**
 * Raiz do app autenticado (spec F2-F9). Não existe biblioteca de
 * navegação neste projeto (App.tsx troca de tela por estado simples) —
 * aqui a mesma filosofia continua: uma pilha local (como o `stack` do
 * protótipo de referência) em vez de importar uma lib de rotas só pra
 * empilhar ~13 telas.
 */
export function AppShell({ profissional }: { profissional: Profissional }) {
  const [aba, setAba] = useState<"agenda" | "retornos">("agenda");
  const [pilha, setPilha] = useState<Rota[]>([]);
  const [offsetDia, setOffsetDia] = useState(0);
  const [turbo, setTurboState] = useState<TurboState>(turboVazio);

  const nav: Navegacao = {
    push: (rota) => setPilha((p) => [...p, rota]),
    pop: () => setPilha((p) => p.slice(0, -1)),
    popToRoot: () => setPilha([]),
  };

  function setTurbo(patch: Partial<TurboState>) {
    setTurboState((t) => ({ ...t, ...patch }));
  }

  function iniciarTurbo() {
    setTurboState(turboVazio);
    nav.push("turbo1");
  }

  function iniciarTurboComHorario(data: string, minutos: number) {
    setTurboState({ ...turboVazio, horarioForcado: { data, inicio: minutos } });
    nav.push("turbo1");
  }

  function iniciarReagendamento(agendamento: ReagendarPayload) {
    setTurboState({
      ...turboVazio,
      reagendandoId: agendamento.id,
      clienteId: agendamento.clienteId,
      clienteNome: agendamento.clienteNome,
      clienteTelefone: agendamento.clienteTelefone,
      servicoId: agendamento.servicoId,
      servicoNome: agendamento.servicoNome,
      servicoDuracaoMin: agendamento.servicoDuracaoMin,
      servicoPrecoCentavos: agendamento.servicoPrecoCentavos,
    });
    nav.push("turbo3");
  }

  function aoConfirmarAgendamento(offsetDoAgendamento: number) {
    setOffsetDia(offsetDoAgendamento);
    setAba("agenda");
    nav.popToRoot();
  }

  const rotaAtual = pilha[pilha.length - 1];

  if (rotaAtual) {
    return (
      <View style={{ flex: 1, backgroundColor: cores.fundo }}>
        {rotaAtual === "turbo1" && <Turbo1ClienteScreen profissional={profissional} nav={nav} turbo={turbo} setTurbo={setTurbo} />}
        {rotaAtual === "turbo2" && <Turbo2ServicoScreen profissional={profissional} nav={nav} turbo={turbo} setTurbo={setTurbo} />}
        {rotaAtual === "turbo3" && <Turbo3SugestoesScreen profissional={profissional} nav={nav} turbo={turbo} setTurbo={setTurbo} />}
        {rotaAtual === "turboConfirmar" && (
          <TurboConfirmarScreen profissional={profissional} nav={nav} turbo={turbo} onConfirmado={aoConfirmarAgendamento} />
        )}
        {rotaAtual === "faturamento" && <FaturamentoScreen profissional={profissional} nav={nav} />}
        {rotaAtual === "configHub" && <ConfigHubScreen profissional={profissional} nav={nav} />}
        {rotaAtual === "configPerfil" && <ConfigPerfilScreen profissional={profissional} nav={nav} />}
        {rotaAtual === "configBarbearia" && <ConfigBarbeariaScreen profissional={profissional} nav={nav} />}
        {rotaAtual === "configServicos" && <ConfigServicosScreen profissional={profissional} nav={nav} />}
        {rotaAtual === "configHorarios" && <ConfigHorariosScreen profissional={profissional} nav={nav} />}
        {rotaAtual === "configBloqueios" && <ConfigBloqueiosScreen profissional={profissional} nav={nav} />}
        {rotaAtual === "configAlgoritmo" && <ConfigAlgoritmoScreen profissional={profissional} nav={nav} />}
        {rotaAtual === "configAjuda" && <ConfigAjudaScreen nav={nav} />}
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: cores.fundo }}>
      <View style={{ flex: 1 }}>
        {aba === "agenda" ? (
          <AgendaScreen
            profissional={profissional}
            offsetDia={offsetDia}
            setOffsetDia={setOffsetDia}
            onReagendar={iniciarReagendamento}
            onAbrirFaturamento={() => nav.push("faturamento")}
            onAbrirConfig={() => nav.push("configHub")}
            onTocarHorario={iniciarTurboComHorario}
          />
        ) : (
          <RetornosScreen profissional={profissional} />
        )}
      </View>

      <View style={styles.barra}>
        <Pressable style={styles.tab} onPress={() => setAba("agenda")}>
          <IconeAgenda ativo={aba === "agenda"} />
          <Text style={[styles.tabTexto, aba === "agenda" && styles.tabTextoAtivo]}>Agenda</Text>
        </Pressable>

        <View style={styles.fabContainer}>
          <Pressable style={styles.fab} accessibilityLabel="Novo agendamento" onPress={iniciarTurbo}>
            <Text style={styles.fabTexto}>+</Text>
          </Pressable>
        </View>

        <Pressable style={styles.tab} onPress={() => setAba("retornos")}>
          <IconeRetornos ativo={aba === "retornos"} />
          <Text style={[styles.tabTexto, aba === "retornos" && styles.tabTextoAtivo]}>Retornos</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  barra: { flexDirection: "row", alignItems: "stretch", backgroundColor: "#fff", borderTopWidth: 1, borderTopColor: cores.linha, paddingBottom: 8 },
  tab: { flex: 1, paddingTop: 12, paddingBottom: 8, alignItems: "center", gap: 3 },
  tabTexto: { fontSize: 11, fontFamily: fontes.corpoSemi, color: cores.fraco },
  tabTextoAtivo: { color: cores.azul },
  fabContainer: { width: 76, alignItems: "center", justifyContent: "flex-start" },
  fab: {
    width: 56,
    height: 56,
    borderRadius: 19,
    backgroundColor: cores.azul,
    alignItems: "center",
    justifyContent: "center",
    transform: [{ translateY: -16 }],
    elevation: 6,
  },
  fabTexto: { color: "#fff", fontSize: 28, lineHeight: 30 },
});
