import { View, Text, StyleSheet, Pressable } from "react-native";
import { cores, raio } from "../theme";

/**
 * Tela principal (spec F2). Esqueleto: substitua o conteúdo estático
 * pela linha do tempo real seguindo o protótipo (prototipo-barbearia.html).
 */
export function AgendaScreen({ onNovo }: { onNovo: () => void }) {
  return (
    <View style={s.tela}>
      <Text style={s.marca}>NAVALHA</Text>
      <Text style={s.titulo}>Agenda do dia</Text>
      <Text style={s.sub}>
        TODO: linha do tempo com blocos, medidor de ocupação e buracos mortos
        hachurados — referência visual no protótipo HTML.
      </Text>
      <Pressable style={s.fab} onPress={onNovo} accessibilityLabel="Novo agendamento">
        <Text style={s.fabTxt}>+</Text>
      </Pressable>
    </View>
  );
}

const s = StyleSheet.create({
  tela: { flex: 1, backgroundColor: cores.fundo, padding: 20 },
  marca: { color: cores.vermelho, fontWeight: "800", fontSize: 14, letterSpacing: 0.5 },
  titulo: { color: cores.tinta, fontSize: 28, fontWeight: "800", marginTop: 4 },
  sub: { color: cores.sub, marginTop: 12, lineHeight: 20 },
  fab: {
    position: "absolute", right: 18, bottom: 24, width: 60, height: 60,
    borderRadius: 20, backgroundColor: cores.vermelho,
    alignItems: "center", justifyContent: "center", elevation: 6,
  },
  fabTxt: { color: "#fff", fontSize: 30, lineHeight: 32 },
});
