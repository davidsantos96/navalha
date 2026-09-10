import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { cores, fontes, raio } from "../../theme";
import type { Profissional } from "../../hooks/useProfissional";
import { useServicos } from "../../hooks/useServicos";
import { formatarCentavos } from "../../lib/datas";
import { Carregando, ScreenHeader } from "../../components/ui";
import { TurboProgress } from "./TurboProgress";
import type { Navegacao, TurboState } from "../../navigation/types";

export function Turbo2ServicoScreen({
  profissional,
  nav,
  turbo,
  setTurbo,
}: {
  profissional: Profissional;
  nav: Navegacao;
  turbo: TurboState;
  setTurbo: (patch: Partial<TurboState>) => void;
}) {
  const servicos = useServicos(profissional.barbearia_id);
  if (servicos.isLoading) return <Carregando />;

  const ativos = (servicos.data ?? []).filter((sv) => sv.ativo);
  const titulo = turbo.clienteNome ? `Serviço para ${turbo.clienteNome.split(" ")[0]}` : "Qual serviço?";

  return (
    <View style={s.tela}>
      <ScreenHeader titulo={titulo} onVoltar={() => nav.pop()} />
      <TurboProgress passo={2} />
      <ScrollView contentContainerStyle={s.conteudo}>
        {ativos.map((sv) => (
          <Pressable
            key={sv.id}
            style={s.linha}
            onPress={() => {
              setTurbo({
                servicoId: sv.id,
                servicoNome: sv.nome,
                servicoDuracaoMin: sv.duracaoMin,
                servicoPrecoCentavos: sv.precoCentavos,
                filtroPeriodo: "todos",
                diaSelecionadoOffset: null,
                incluirBuracoMorto: false,
              });
              nav.push("turbo3");
            }}
          >
            <View>
              <Text style={s.nome}>{sv.nome}</Text>
              <Text style={s.duracao}>{sv.duracaoMin} min</Text>
            </View>
            <Text style={s.preco}>{formatarCentavos(sv.precoCentavos)}</Text>
          </Pressable>
        ))}
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  tela: { flex: 1, backgroundColor: cores.fundo },
  conteudo: { paddingHorizontal: 20, paddingTop: 4, paddingBottom: 30 },
  linha: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", backgroundColor: cores.card, borderWidth: 1.5, borderColor: cores.linha, borderRadius: raio.card, padding: 16, marginBottom: 9 },
  nome: { fontFamily: fontes.corpoNegrito, fontSize: 16, color: cores.tinta },
  duracao: { fontSize: 12.5, color: cores.sub, fontFamily: fontes.corpoSemi },
  preco: { fontFamily: fontes.titulo, fontSize: 18, color: cores.tinta },
});
