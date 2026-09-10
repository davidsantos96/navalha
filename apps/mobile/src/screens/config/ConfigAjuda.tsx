import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { cores, fontes, raio } from "../../theme";
import { abrirWhatsApp } from "../../lib/whatsapp";
import { ScreenHeader } from "../../components/ui";
import { WhatsAppIcon } from "../../components/WhatsAppIcon";
import type { Navegacao } from "../../navigation/types";

const SUPORTE_WHATSAPP = "5511999999999";

export function ConfigAjudaScreen({ nav }: { nav: Navegacao }) {
  return (
    <View style={s.tela}>
      <ScreenHeader titulo="Ajuda e legal" onVoltar={() => nav.pop()} />
      <ScrollView contentContainerStyle={s.conteudo}>
        <Pressable style={s.whatsBotao} onPress={() => abrirWhatsApp(SUPORTE_WHATSAPP, "Oi! Preciso de ajuda com o Navalha.")}>
          <WhatsAppIcon />
          <Text style={s.whatsTexto}>Falar com o suporte no WhatsApp</Text>
        </Pressable>

        <View style={s.linha}>
          <Text style={s.linhaTexto}>Termos de Uso</Text>
          <Text style={{ color: cores.fraco, fontSize: 18 }}>›</Text>
        </View>
        <View style={s.linha}>
          <Text style={s.linhaTexto}>Política de Privacidade</Text>
          <Text style={{ color: cores.fraco, fontSize: 18 }}>›</Text>
        </View>

        <Text style={s.versao}>Navalha 0.1 · feito para a mão do barbeiro</Text>
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  tela: { flex: 1, backgroundColor: cores.fundo },
  conteudo: { paddingHorizontal: 20, paddingTop: 8, paddingBottom: 30 },
  whatsBotao: { width: "100%", paddingVertical: 16, borderRadius: raio.botao, backgroundColor: cores.whatsapp, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, marginBottom: 14 },
  whatsTexto: { color: "#fff", fontFamily: fontes.corpoNegrito, fontSize: 15 },
  linha: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", backgroundColor: cores.card, borderWidth: 1, borderColor: cores.linha, borderRadius: raio.card, padding: 15, paddingHorizontal: 16, marginBottom: 8 },
  linhaTexto: { fontFamily: fontes.corpoNegrito, fontSize: 15, color: cores.tinta },
  versao: { fontSize: 12, color: cores.fraco, textAlign: "center", marginTop: 24 },
});
