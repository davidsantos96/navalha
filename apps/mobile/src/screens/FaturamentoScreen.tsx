import { ScrollView, StyleSheet, Text, View } from "react-native";
import { cores, fontes, raio } from "../theme";
import type { Profissional } from "../hooks/useProfissional";
import { useFaturamento } from "../hooks/useFaturamento";
import { dataISODoOffset, formatarCentavos } from "../lib/datas";
import { Carregando, ScreenHeader } from "../components/ui";
import type { Navegacao } from "../navigation/types";

const NOMES_DIAS = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

export function FaturamentoScreen({ profissional, nav }: { profissional: Profissional; nav: Navegacao }) {
  const faturamento = useFaturamento(profissional.id, dataISODoOffset(0));
  if (faturamento.isLoading || !faturamento.data) return <Carregando />;

  const f = faturamento.data;
  const maxDia = Math.max(...f.porDia.map((d) => d.totalCentavos), 1);
  const hojeSemana = new Date().getDay();

  return (
    <View style={s.tela}>
      <ScreenHeader titulo="Faturamento" onVoltar={() => nav.pop()} />
      <ScrollView contentContainerStyle={s.conteudo}>
        <View style={s.cartaoTotal}>
          <Text style={s.periodo}>Semana atual (seg a dom)</Text>
          <Text style={s.totalGrande}>{formatarCentavos(f.totalSemanaCentavos)}</Text>
          <Text style={s.hojeTxt}>
            Hoje: <Text style={{ color: "#7ED9A6" }}>{formatarCentavos(f.totalDiaCentavos)}</Text>
          </Text>
        </View>

        <View style={s.statLinha}>
          <View style={s.statCartao}>
            <Text style={s.statRotulo}>ATENDIMENTOS</Text>
            <Text style={s.statValor}>{f.atendimentosSemana}</Text>
          </View>
          <View style={s.statCartao}>
            <Text style={s.statRotulo}>TICKET MÉDIO</Text>
            <Text style={s.statValor}>{formatarCentavos(f.ticketMedioCentavos)}</Text>
          </View>
          <View style={s.statCartao}>
            <Text style={s.statRotulo}>FALTAS</Text>
            <Text style={[s.statValor, { color: cores.vermelho }]}>{f.faltasSemana}</Text>
          </View>
        </View>

        <Text style={s.secao}>POR DIA</Text>
        <View style={s.porDiaCartao}>
          {f.porDia.map((d) => {
            const hoje = d.diaSemana === hojeSemana;
            return (
              <View key={d.diaSemana} style={s.diaLinha}>
                <Text style={[s.diaLabel, hoje && { color: cores.vermelho, fontFamily: fontes.corpoNegrito }]}>{hoje ? "Hoje" : NOMES_DIAS[d.diaSemana]}</Text>
                <View style={s.diaBarraFundo}>
                  <View style={[s.diaBarraPreenchida, { backgroundColor: hoje ? cores.vermelho : cores.tinta, width: `${Math.max((d.totalCentavos / maxDia) * 100, d.totalCentavos ? 4 : 0)}%` }]} />
                </View>
                <Text style={[s.diaValor, { color: d.totalCentavos ? cores.tinta : cores.fraco }]}>{d.totalCentavos ? formatarCentavos(d.totalCentavos) : "—"}</Text>
              </View>
            );
          })}
        </View>

        <Text style={s.secao}>POR SERVIÇO</Text>
        {f.porServico.map((sv) => (
          <View key={sv.servicoId} style={s.servicoCartao}>
            <View style={s.servicoLinha}>
              <Text style={s.servicoNome}>
                {sv.nome} <Text style={s.servicoQtd}>{sv.quantidade}×</Text>
              </Text>
              <Text style={s.servicoTotal}>{formatarCentavos(sv.totalCentavos)}</Text>
            </View>
            <View style={s.servicoBarraFundo}>
              <View style={[s.servicoBarraPreenchida, { width: `${(sv.totalCentavos / Math.max(f.totalSemanaCentavos, 1)) * 100}%` }]} />
            </View>
          </View>
        ))}
        {f.porServico.length === 0 && <Text style={s.vazio}>Nenhum atendimento concluído nesta semana ainda.</Text>}

        <Text style={s.rodape}>Conta só o que foi concluído — agendado ainda não é dinheiro no bolso.</Text>
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  tela: { flex: 1, backgroundColor: cores.fundo },
  conteudo: { paddingHorizontal: 20, paddingTop: 4, paddingBottom: 30 },
  cartaoTotal: { backgroundColor: cores.tinta, borderRadius: 20, padding: 20, paddingHorizontal: 22, marginTop: 6 },
  periodo: { fontSize: 12, color: "#9FACC6", fontFamily: fontes.corpoSemi },
  totalGrande: { fontFamily: fontes.titulo, fontSize: 40, color: "#F2F5FA", marginTop: 4 },
  hojeTxt: { fontSize: 13, color: "#9FACC6", fontFamily: fontes.corpoSemi, marginTop: 6 },
  statLinha: { flexDirection: "row", gap: 8, marginTop: 10 },
  statCartao: { flex: 1, backgroundColor: cores.card, borderWidth: 1, borderColor: cores.linha, borderRadius: raio.card, padding: 11 },
  statRotulo: { fontSize: 10.5, fontFamily: fontes.corpoNegrito, color: cores.fraco, letterSpacing: 0.5 },
  statValor: { fontFamily: fontes.titulo, fontSize: 21, color: cores.tinta },
  secao: { fontSize: 12, fontFamily: fontes.corpoNegrito, color: cores.sub, letterSpacing: 0.6, marginTop: 20, marginBottom: 10 },
  porDiaCartao: { backgroundColor: cores.card, borderWidth: 1, borderColor: cores.linha, borderRadius: raio.card, padding: 14, paddingHorizontal: 16 },
  diaLinha: { flexDirection: "row", alignItems: "center", gap: 10, paddingVertical: 5 },
  diaLabel: { width: 34, fontSize: 12, fontFamily: fontes.corpoSemi, color: cores.sub },
  diaBarraFundo: { flex: 1, height: 10, borderRadius: raio.pilula, backgroundColor: "#F0F2F4", overflow: "hidden" },
  diaBarraPreenchida: { height: "100%", borderRadius: raio.pilula },
  diaValor: { width: 64, textAlign: "right", fontFamily: fontes.titulo, fontSize: 13 },
  servicoCartao: { backgroundColor: cores.card, borderWidth: 1, borderColor: cores.linha, borderRadius: raio.card, padding: 12, paddingHorizontal: 16, marginBottom: 8 },
  servicoLinha: { flexDirection: "row", alignItems: "baseline", justifyContent: "space-between", gap: 10 },
  servicoNome: { fontFamily: fontes.corpoNegrito, fontSize: 14.5, color: cores.tinta },
  servicoQtd: { color: cores.fraco, fontFamily: fontes.corpoSemi, fontSize: 12.5 },
  servicoTotal: { fontFamily: fontes.titulo, fontSize: 16, color: cores.tinta },
  servicoBarraFundo: { marginTop: 8, height: 6, borderRadius: raio.pilula, backgroundColor: "#F0F2F4", overflow: "hidden" },
  servicoBarraPreenchida: { height: "100%", borderRadius: raio.pilula, backgroundColor: "#DDE3EC" },
  vazio: { fontSize: 13.5, color: cores.fraco, paddingVertical: 4 },
  rodape: { fontSize: 12, color: cores.fraco, textAlign: "center", marginTop: 16, lineHeight: 18 },
});
