import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { cores, fontes, raio } from "../../theme";
import type { Profissional } from "../../hooks/useProfissional";
import { iniciais } from "../../lib/texto";
import { ScreenHeader } from "../../components/ui";
import type { Navegacao, Rota } from "../../navigation/types";

const ITENS: { titulo: string; desc: string; rota: Rota }[] = [
  { titulo: "Perfil e conta", desc: "Nome, login, sair, excluir conta", rota: "configPerfil" },
  { titulo: "Barbearia", desc: "Nome, endereço e telefone", rota: "configBarbearia" },
  { titulo: "Serviços", desc: "Presets do agendamento em 3 toques", rota: "configServicos" },
  { titulo: "Horários de trabalho", desc: "Expediente por dia da semana", rota: "configHorarios" },
  { titulo: "Bloqueios e folgas", desc: "Fechar dia inteiro ou trecho", rota: "configBloqueios" },
  { titulo: "Agenda inteligente", desc: "Âncora do dia e respiro entre cortes", rota: "configAlgoritmo" },
  { titulo: "Ajuda e legal", desc: "Suporte, termos e privacidade", rota: "configAjuda" },
];

export function ConfigHubScreen({ profissional, nav }: { profissional: Profissional; nav: Navegacao }) {
  return (
    <View style={s.tela}>
      <ScreenHeader titulo="Configurações" onVoltar={() => nav.pop()} />
      <ScrollView contentContainerStyle={s.conteudo}>
        <View style={s.perfilCartao}>
          <View style={s.avatar}>
            <Text style={s.avatarTexto}>{iniciais(profissional.nome)}</Text>
          </View>
          <Text style={s.perfilNome}>{profissional.nome}</Text>
        </View>

        {ITENS.map((item) => (
          <Pressable key={item.rota} style={s.linha} onPress={() => nav.push(item.rota)}>
            <View>
              <Text style={s.linhaTitulo}>{item.titulo}</Text>
              <Text style={s.linhaDesc}>{item.desc}</Text>
            </View>
            <Text style={{ color: cores.fraco, fontSize: 18 }}>›</Text>
          </Pressable>
        ))}
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  tela: { flex: 1, backgroundColor: cores.fundo },
  conteudo: { paddingHorizontal: 20, paddingTop: 4, paddingBottom: 30 },
  perfilCartao: { flexDirection: "row", alignItems: "center", gap: 12, backgroundColor: cores.tinta, borderRadius: raio.card, padding: 14, marginBottom: 14 },
  avatar: { width: 44, height: 44, borderRadius: 13, backgroundColor: cores.vermelho, alignItems: "center", justifyContent: "center" },
  avatarTexto: { color: "#fff", fontFamily: fontes.titulo, fontSize: 17 },
  perfilNome: { fontFamily: fontes.corpoNegrito, fontSize: 15, color: "#fff" },
  linha: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 10, backgroundColor: cores.card, borderWidth: 1, borderColor: cores.linha, borderRadius: raio.card, padding: 14, paddingHorizontal: 16, marginBottom: 8 },
  linhaTitulo: { fontFamily: fontes.corpoNegrito, fontSize: 15, color: cores.tinta },
  linhaDesc: { fontSize: 12, color: cores.fraco },
});
