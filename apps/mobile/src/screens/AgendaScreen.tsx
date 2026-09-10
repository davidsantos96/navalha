import { useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import Svg, { Circle, Path } from "react-native-svg";
import { minParaHora } from "@navalha/agenda-inteligente";
import { cores, fontes, raio } from "../theme";
import type { Profissional } from "../hooks/useProfissional";
import { useAgendaDoDia, type ItemAgenda } from "../hooks/useAgendaDoDia";
import { useExpedientes } from "../hooks/useExpedientes";
import { useServicos } from "../hooks/useServicos";
import { useFaturamento } from "../hooks/useFaturamento";
import { dataCompleta, dataISODoOffset, diaSemanaDoOffset, formatarCentavos, nomeRelativo } from "../lib/datas";
import { Hachura } from "../components/Hachura";
import { SheetAcoes } from "../components/SheetAcoes";
import { Carregando } from "../components/ui";

const ZOOM = 1.35;

function IconeConfig() {
  return (
    <Svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke={cores.sub} strokeWidth={2}>
      <Circle cx={12} cy={12} r={3} />
      <Path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
    </Svg>
  );
}

export interface ReagendarPayload {
  id: string;
  clienteId: string | null;
  clienteNome: string | null;
  clienteTelefone: string | null;
  servicoId: string | null;
  servicoNome: string | null;
  servicoDuracaoMin: number | null;
  servicoPrecoCentavos: number | null;
}

export function AgendaScreen({
  profissional,
  offsetDia,
  setOffsetDia,
  onReagendar,
  onAbrirFaturamento,
  onAbrirConfig,
}: {
  profissional: Profissional;
  offsetDia: number;
  setOffsetDia: (n: number) => void;
  onReagendar: (payload: ReagendarPayload) => void;
  onAbrirFaturamento: () => void;
  onAbrirConfig: () => void;
}) {
  const [itemSelecionado, setItemSelecionado] = useState<ItemAgenda | null>(null);
  const data = dataISODoOffset(offsetDia);
  const agenda = useAgendaDoDia(profissional.id, data);
  const expedientes = useExpedientes(profissional.id);
  const servicos = useServicos(profissional.barbearia_id);
  const faturamento = useFaturamento(profissional.id, dataISODoOffset(0));

  if (agenda.isLoading || expedientes.isLoading || servicos.isLoading) return <Carregando />;

  const blocosDoDia = (expedientes.data ?? [])
    .filter((b) => b.diaSemana === diaSemanaDoOffset(offsetDia))
    .sort((a, b) => a.inicioMin - b.inicioMin);
  const fechado = blocosDoDia.length === 0;
  const abre = fechado ? 0 : blocosDoDia[0].inicioMin;
  const fecha = fechado ? 0 : blocosDoDia[blocosDoDia.length - 1].fimMin;

  const servicosAtivos = (servicos.data ?? []).filter((sv) => sv.ativo);
  const menorServico = servicosAtivos.length ? Math.min(...servicosAtivos.map((sv) => sv.duracaoMin)) : 30;

  const minutosOcupados = agenda.data?.minutosOcupados ?? 0;
  const minutosExpediente = agenda.data?.minutosExpediente ?? 0;
  const pct = minutosExpediente ? Math.min(Math.round((minutosOcupados / minutosExpediente) * 100), 100) : 0;

  const buracos = (agenda.data?.espacosLivres ?? [])
    .filter((g) => g.fim - g.inicio < menorServico)
    .map((g) => ({ inicio: g.inicio, fim: g.fim, minutos: g.fim - g.inicio }));
  const minutosMortosTotal = buracos.reduce((acc, b) => acc + b.minutos, 0);

  const forasDoExpediente: { inicio: number; fim: number }[] = [];
  for (let k = 0; k < blocosDoDia.length - 1; k++) {
    const a = blocosDoDia[k].fimMin;
    const b = blocosDoDia[k + 1].inicioMin;
    if (b > a) forasDoExpediente.push({ inicio: a, fim: b });
  }

  const Y = (m: number) => (m - abre) * ZOOM;
  const gridHoras: number[] = [];
  if (!fechado) for (let h = Math.ceil(abre / 60) * 60; h <= fecha; h += 60) gridHoras.push(h);

  const dn = dataCompleta(offsetDia);
  const rel = nomeRelativo(offsetDia);
  const hSub = fechado ? `${rel} · fechado` : `${rel} · expediente ${minParaHora(abre)}–${minParaHora(fecha)}`;

  function abrirReagendamento(item: ItemAgenda) {
    const servico = (servicos.data ?? []).find((sv) => sv.id === item.servicoId);
    setItemSelecionado(null);
    onReagendar({
      id: item.id,
      clienteId: item.clienteId,
      clienteNome: item.clienteNome,
      clienteTelefone: item.clienteTelefone,
      servicoId: item.servicoId,
      servicoNome: item.servicoNome,
      servicoDuracaoMin: servico?.duracaoMin ?? null,
      servicoPrecoCentavos: servico?.precoCentavos ?? null,
    });
  }

  return (
    <View style={s.tela}>
      <View style={s.header}>
        <View style={s.headerLinha}>
          <View>
            <Text style={s.marca}>NAVALHA</Text>
            <Text style={s.data}>{dn}</Text>
            <Text style={s.sub}>{hSub}</Text>
          </View>
          <View style={{ flexDirection: "row", gap: 6 }}>
            <Pressable style={s.iconeBotao} onPress={onAbrirConfig} accessibilityLabel="Configurações">
              <IconeConfig />
            </Pressable>
            <Pressable style={s.iconeBotao} onPress={() => setOffsetDia(Math.max(0, offsetDia - 1))} accessibilityLabel="Dia anterior">
              <Text style={s.setaTexto}>‹</Text>
            </Pressable>
            <Pressable style={s.iconeBotao} onPress={() => setOffsetDia(Math.min(13, offsetDia + 1))} accessibilityLabel="Próximo dia">
              <Text style={s.setaTexto}>›</Text>
            </Pressable>
          </View>
        </View>

        <View style={s.ocupacaoCartao}>
          <Text style={s.pct}>{pct}%</Text>
          <View style={s.barraFundo}>
            <View style={[s.barraPreenchida, { width: `${pct}%` }]} />
          </View>
          <Text style={s.mTxt}>
            {(minutosOcupados / 60).toFixed(1).replace(".0", "")} de {(minutosExpediente / 60).toFixed(1).replace(".0", "")}h ocupadas
          </Text>
        </View>

        <Pressable style={s.faturamentoLinha} onPress={onAbrirFaturamento}>
          <View style={s.faturamentoCartao}>
            <Text style={s.faturamentoRotulo}>FATURADO HOJE</Text>
            <Text style={[s.faturamentoValor, { color: cores.verde }]}>{formatarCentavos(faturamento.data?.totalDiaCentavos ?? 0)}</Text>
          </View>
          <View style={[s.faturamentoCartao, { flexDirection: "row", alignItems: "center", justifyContent: "space-between" }]}>
            <View>
              <Text style={s.faturamentoRotulo}>SEMANA</Text>
              <Text style={s.faturamentoValor}>{formatarCentavos(faturamento.data?.totalSemanaCentavos ?? 0)}</Text>
            </View>
            <Text style={{ color: cores.fraco, fontSize: 16 }}>›</Text>
          </View>
        </Pressable>

        {buracos.length > 0 && (
          <View style={s.alerta}>
            <Text style={s.alertaTexto}>
              ⚠ {buracos.length} buraco{buracos.length > 1 ? "s" : ""} morto{buracos.length > 1 ? "s" : ""} no dia — {minutosMortosTotal} min sem uso
              possível
            </Text>
          </View>
        )}
      </View>

      {fechado ? (
        <View style={s.fechadoCartao}>
          <Text style={s.fechadoTitulo}>Dia fechado</Text>
          <Text style={s.fechadoTexto}>Sem expediente configurado para este dia.</Text>
          <Pressable style={s.fechadoBotao} onPress={onAbrirConfig}>
            <Text style={s.fechadoBotaoTexto}>Ajustar horários de trabalho</Text>
          </Pressable>
        </View>
      ) : (
        <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 6, paddingBottom: 120 }}>
          <View style={{ position: "relative", marginLeft: 44, height: (fecha - abre) * ZOOM + 30 }}>
            {gridHoras.map((h) => (
              <View key={h}>
                <View style={[s.gridLinha, { top: Y(h) }]} />
                <Text style={[s.gridLabel, { top: Y(h) - 6 }]}>{minParaHora(h)}</Text>
              </View>
            ))}

            {forasDoExpediente.map((f, i) => (
              <Hachura key={`fora${i}`} corFundo="#EDEFF1" corListra="#E4E7EA" style={[s.bloco, { top: Y(f.inicio), height: Math.max(f.fim - f.inicio, 0) * ZOOM - 4, borderWidth: 1, borderColor: "#CFD5DA", borderStyle: "dashed" as const }]}>
                <Text style={s.blocoTextoNeutro}>
                  Intervalo {minParaHora(f.inicio)}–{minParaHora(f.fim)}
                </Text>
              </Hachura>
            ))}

            {(agenda.data?.itens ?? [])
              .filter((item) => item.ehBloqueio)
              .map((item) => (
                <Hachura key={item.id} corFundo="#E7EAF2" corListra="#DDE2EE" style={[s.bloco, { top: Y(item.inicio), height: Math.max(item.fim - item.inicio, 0) * ZOOM - 4, borderWidth: 1, borderColor: "#B9C3D6", borderStyle: "dashed" as const }]}>
                  <Text style={s.blocoTextoNavy}>
                    Fechado{item.motivo ? ` · ${item.motivo}` : ""} · {minParaHora(item.inicio)}–{minParaHora(item.fim)}
                  </Text>
                </Hachura>
              ))}

            {(agenda.data?.itens ?? [])
              .filter((item) => !item.ehBloqueio)
              .map((item) => {
                const done = item.status === "concluido";
                const falta = item.status === "falta";
                return (
                  <Pressable
                    key={item.id}
                    onPress={() => setItemSelecionado(item)}
                    style={[
                      s.bloco,
                      {
                        top: Y(item.inicio),
                        height: Math.max((item.fim - item.inicio) * ZOOM - 4, 22),
                        backgroundColor: done ? cores.verdeSuave : falta ? "#F1F2F4" : cores.tinta,
                        borderWidth: 1,
                        borderColor: done ? "#BFE0CE" : falta ? cores.linha : "transparent",
                        padding: 7,
                        paddingHorizontal: 12,
                      },
                    ]}
                  >
                    <Text style={{ fontFamily: fontes.corpoNegrito, fontSize: 13.5, color: done ? cores.verde : falta ? cores.fraco : "#F2F5FA", textDecorationLine: falta ? "line-through" : "none" }}>
                      {item.clienteNome ?? "—"}
                    </Text>
                    <Text style={{ fontSize: 11.5, fontFamily: fontes.corpoMedio, color: done ? cores.verde : falta ? cores.fraco : "#B9C3D6", textDecorationLine: falta ? "line-through" : "none" }}>
                      {item.servicoNome ?? "—"} · {minParaHora(item.inicio)}–{minParaHora(item.fim)}
                      {done ? " · concluído" : falta ? " · faltou" : ""}
                    </Text>
                  </Pressable>
                );
              })}

            {buracos.map((b, i) => (
              <Hachura key={`buraco${i}`} corFundo={cores.vermelhoSuave} corListra="#fff" style={[s.bloco, { top: Y(b.inicio), height: Math.max(b.minutos * ZOOM - 4, 18), borderWidth: 1.5, borderColor: "#E4A19B", borderStyle: "dashed" as const }]}>
                <Text style={s.blocoTextoVermelho}>⚠ Buraco de {b.minutos} min</Text>
              </Hachura>
            ))}
          </View>
        </ScrollView>
      )}

      {itemSelecionado && (
        <SheetAcoes
          item={itemSelecionado}
          barbeariaId={profissional.barbearia_id}
          bufferMin={profissional.buffer_min}
          onFechar={() => setItemSelecionado(null)}
          onReagendar={() => abrirReagendamento(itemSelecionado)}
        />
      )}
    </View>
  );
}

const s = StyleSheet.create({
  tela: { flex: 1, backgroundColor: cores.fundo },
  header: { paddingHorizontal: 20, paddingTop: 6, paddingBottom: 10 },
  headerLinha: { flexDirection: "row", alignItems: "flex-end", justifyContent: "space-between", gap: 10 },
  marca: { fontFamily: fontes.titulo, fontSize: 14, letterSpacing: 0.4, color: cores.vermelho },
  data: { fontFamily: fontes.titulo, fontSize: 29, color: cores.tinta, lineHeight: 32 },
  sub: { fontSize: 13, color: cores.sub, fontFamily: fontes.corpoMedio, marginTop: 2 },
  iconeBotao: { width: 38, height: 38, borderWidth: 1, borderColor: cores.linha, backgroundColor: cores.card, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  setaTexto: { fontSize: 16, color: cores.tinta },
  ocupacaoCartao: { marginTop: 12, backgroundColor: cores.card, borderWidth: 1, borderColor: cores.linha, borderRadius: raio.card, paddingVertical: 10, paddingHorizontal: 14, flexDirection: "row", alignItems: "center", gap: 12 },
  pct: { fontFamily: fontes.titulo, fontSize: 22, color: cores.tinta },
  barraFundo: { flex: 1, height: 8, borderRadius: raio.pilula, backgroundColor: "#E3E7EA", overflow: "hidden" },
  barraPreenchida: { height: "100%", backgroundColor: cores.tinta, borderRadius: raio.pilula },
  mTxt: { fontSize: 12, color: cores.sub, fontFamily: fontes.corpoSemi },
  faturamentoLinha: { marginTop: 8, flexDirection: "row", gap: 8 },
  faturamentoCartao: { flex: 1, backgroundColor: cores.card, borderWidth: 1, borderColor: cores.linha, borderRadius: raio.card, paddingVertical: 9, paddingHorizontal: 14 },
  faturamentoRotulo: { fontSize: 10.5, fontFamily: fontes.corpoNegrito, color: cores.fraco, letterSpacing: 0.5 },
  faturamentoValor: { fontFamily: fontes.titulo, fontSize: 19, color: cores.tinta },
  alerta: { marginTop: 8, backgroundColor: cores.vermelhoSuave, borderWidth: 1, borderColor: "#F0C7C4", borderRadius: 12, paddingVertical: 8, paddingHorizontal: 12 },
  alertaTexto: { color: cores.vermelho, fontSize: 12.5, fontFamily: fontes.corpoSemi },
  gridLinha: { position: "absolute", left: 0, right: 0, height: 1, backgroundColor: cores.linha },
  gridLabel: { position: "absolute", left: -44, width: 36, textAlign: "right", fontSize: 11, color: cores.fraco, fontFamily: fontes.corpoSemi },
  bloco: { position: "absolute", left: 0, right: 0, borderRadius: raio.bloco, justifyContent: "center" },
  blocoTextoNeutro: { fontSize: 12, fontFamily: fontes.corpoSemi, color: cores.sub, paddingHorizontal: 12 },
  blocoTextoNavy: { fontSize: 12, fontFamily: fontes.corpoNegrito, color: cores.tinta, paddingHorizontal: 12 },
  blocoTextoVermelho: { fontSize: 12, fontFamily: fontes.corpoNegrito, color: cores.vermelho, paddingHorizontal: 12 },
  fechadoCartao: { backgroundColor: cores.card, borderWidth: 1, borderColor: cores.linha, borderRadius: raio.card, padding: 24, marginHorizontal: 20, marginTop: 20, alignItems: "center" },
  fechadoTitulo: { fontFamily: fontes.titulo, fontSize: 20, color: cores.tinta },
  fechadoTexto: { fontSize: 13.5, color: cores.sub, marginTop: 6, textAlign: "center", lineHeight: 19 },
  fechadoBotao: { marginTop: 14, paddingVertical: 12, paddingHorizontal: 18, borderRadius: 12, borderWidth: 1.5, borderColor: cores.linha, backgroundColor: cores.fundo },
  fechadoBotaoTexto: { fontFamily: fontes.corpoNegrito, fontSize: 14, color: cores.tinta },
});
