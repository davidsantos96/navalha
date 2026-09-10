import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { cores, fontes, raio } from "../../theme";
import type { Profissional } from "../../hooks/useProfissional";
import { useAtualizarProfissional } from "../../hooks/useAtualizarProfissional";
import { Chip, ScreenHeader } from "../../components/ui";
import type { Navegacao } from "../../navigation/types";

const OPCOES_BUFFER = [0, 5, 10, 15, 30];

export function ConfigAlgoritmoScreen({ profissional, nav }: { profissional: Profissional; nav: Navegacao }) {
  const atualizar = useAtualizarProfissional();

  return (
    <View style={s.tela}>
      <ScreenHeader titulo="Agenda inteligente" onVoltar={() => nav.pop()} />
      <ScrollView contentContainerStyle={s.conteudo}>
        <Text style={s.rotulo}>DIA VAZIO COMEÇA POR ONDE?</Text>
        <View style={{ flexDirection: "row", gap: 8 }}>
          <Pressable style={[s.opcao, profissional.ancora === "inicio" && s.opcaoAtiva]} onPress={() => atualizar.mutate({ id: profissional.id, ancora: "inicio" })}>
            <Text style={s.opcaoTitulo}>Início do expediente</Text>
            <Text style={s.opcaoDesc}>Trabalha cedo, folga no fim do dia</Text>
          </Pressable>
          <Pressable style={[s.opcao, profissional.ancora === "fim" && s.opcaoAtiva]} onPress={() => atualizar.mutate({ id: profissional.id, ancora: "fim" })}>
            <Text style={s.opcaoTitulo}>Fim do expediente</Text>
            <Text style={s.opcaoDesc}>Manhã livre, fecha o dia cheio</Text>
          </Pressable>
        </View>

        <Text style={[s.rotulo, { marginTop: 22 }]}>RESPIRO ENTRE ATENDIMENTOS</Text>
        <View style={{ flexDirection: "row", gap: 6, flexWrap: "wrap" }}>
          {OPCOES_BUFFER.map((v) => (
            <Chip key={v} ativo={profissional.buffer_min === v} texto={v === 0 ? "Sem respiro" : `${v} min`} onPress={() => atualizar.mutate({ id: profissional.id, bufferMin: v })} />
          ))}
        </View>

        <View style={s.explicacao}>
          <Text style={s.explicacaoTexto}>
            O respiro é somado à duração de cada serviço na hora de calcular os encaixes. As sugestões mudam na hora — teste no botão{" "}
            <Text style={{ color: cores.vermelho, fontFamily: fontes.corpoNegrito }}>+</Text> da agenda.
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  tela: { flex: 1, backgroundColor: cores.fundo },
  conteudo: { paddingHorizontal: 20, paddingTop: 4, paddingBottom: 30 },
  rotulo: { fontSize: 12, fontFamily: fontes.corpoNegrito, color: cores.sub, letterSpacing: 0.6, marginBottom: 8 },
  opcao: { flex: 1, padding: 14, borderRadius: 14, borderWidth: 1.5, borderColor: cores.linha, backgroundColor: "#fff" },
  opcaoAtiva: { borderWidth: 2, borderColor: cores.tinta, backgroundColor: "#EDF0F5" },
  opcaoTitulo: { fontFamily: fontes.corpoNegrito, fontSize: 14, color: cores.tinta },
  opcaoDesc: { fontSize: 12, color: cores.sub, marginTop: 3 },
  explicacao: { backgroundColor: cores.card, borderWidth: 1, borderColor: cores.linha, borderRadius: raio.card, padding: 14, marginTop: 20 },
  explicacaoTexto: { fontSize: 13, color: cores.sub, lineHeight: 20 },
});
