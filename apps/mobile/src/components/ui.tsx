import { ActivityIndicator, Pressable, StyleSheet, Text, View, ViewStyle } from "react-native";
import { cores, fontes, raio } from "../theme";

export function VoltarButton({ onPress }: { onPress: () => void }) {
  return (
    <Pressable onPress={onPress} accessibilityLabel="Voltar" style={s.voltar} hitSlop={8}>
      <Text style={{ fontSize: 17, color: cores.tinta }}>‹</Text>
    </Pressable>
  );
}

export function ScreenHeader({ titulo, onVoltar, acao }: { titulo: string; onVoltar?: () => void; acao?: React.ReactNode }) {
  return (
    <View style={s.header}>
      {onVoltar ? <VoltarButton onPress={onVoltar} /> : null}
      <Text style={s.headerTitulo}>{titulo}</Text>
      <View style={{ flex: 1 }} />
      {acao}
    </View>
  );
}

export function Chip({ ativo, texto, onPress, opaco = true }: { ativo: boolean; texto: string; onPress: () => void; opaco?: boolean }) {
  return (
    <Pressable onPress={onPress} style={[s.chip, ativo ? s.chipAtivo : s.chipInativo, !opaco && { opacity: 0.4 }]}>
      <Text style={[s.chipTexto, ativo && s.chipTextoAtivo]}>{texto}</Text>
    </Pressable>
  );
}

export function BotaoPrimario({
  texto,
  onPress,
  style,
  disabled,
  carregando,
}: {
  texto: string;
  onPress: () => void;
  style?: ViewStyle;
  disabled?: boolean;
  carregando?: boolean;
}) {
  return (
    <Pressable onPress={onPress} disabled={disabled || carregando} style={[s.botaoBase, { backgroundColor: cores.azul, opacity: disabled ? 0.5 : 1 }, style]}>
      {carregando ? <ActivityIndicator color="#fff" /> : <Text style={s.botaoTextoClaro}>{texto}</Text>}
    </Pressable>
  );
}

export function BotaoSecundario({ texto, onPress, style, corTexto = cores.tinta }: { texto: string; onPress: () => void; style?: ViewStyle; corTexto?: string }) {
  return (
    <Pressable onPress={onPress} style={[s.botaoBase, s.botaoSecundario, style]}>
      <Text style={[s.botaoTexto, { color: corTexto }]}>{texto}</Text>
    </Pressable>
  );
}

export function BotaoPerigo({ texto, onPress, style }: { texto: string; onPress: () => void; style?: ViewStyle }) {
  return (
    <Pressable onPress={onPress} style={[s.botaoBase, { backgroundColor: cores.vermelhoSuave }, style]}>
      <Text style={[s.botaoTexto, { color: cores.vermelho }]}>{texto}</Text>
    </Pressable>
  );
}

export function BotaoEscuro({ texto, onPress, style }: { texto: string; onPress: () => void; style?: ViewStyle }) {
  return (
    <Pressable onPress={onPress} style={[s.botaoBase, { backgroundColor: cores.tinta }, style]}>
      <Text style={s.botaoTextoClaro}>{texto}</Text>
    </Pressable>
  );
}

export function LinkTexto({ texto, onPress, style }: { texto: string; onPress: () => void; style?: ViewStyle }) {
  return (
    <Pressable onPress={onPress} style={style} hitSlop={6}>
      <Text style={s.link}>{texto}</Text>
    </Pressable>
  );
}

export function Interruptor({ ativo, onToggle }: { ativo: boolean; onToggle: () => void }) {
  return (
    <Pressable onPress={onToggle} accessibilityLabel="Ativar ou desativar" style={[s.sw, { backgroundColor: ativo ? cores.verde : "#CDD3DA", justifyContent: ativo ? "flex-end" : "flex-start" }]}>
      <View style={s.kn} />
    </Pressable>
  );
}

export function Carregando() {
  return (
    <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
      <ActivityIndicator color={cores.azul} size="large" />
    </View>
  );
}

export function MensagemErro({ texto }: { texto: string | null }) {
  if (!texto) return null;
  return <Text style={s.erro}>{texto}</Text>;
}

export function MensagemSucesso({ texto }: { texto: string | null }) {
  if (!texto) return null;
  return (
    <View style={s.sucessoCartao}>
      <Text style={s.sucessoTexto}>✓ {texto}</Text>
    </View>
  );
}

const s = StyleSheet.create({
  voltar: { width: 38, height: 38, borderRadius: 12, borderWidth: 1, borderColor: cores.linha, backgroundColor: cores.card, alignItems: "center", justifyContent: "center" },
  header: { flexDirection: "row", alignItems: "center", gap: 10, paddingHorizontal: 20, paddingTop: 16, paddingBottom: 8 },
  headerTitulo: { fontFamily: fontes.titulo, fontSize: 20, color: cores.tinta },
  chip: { paddingVertical: 9, paddingHorizontal: 13, borderRadius: raio.pilula, borderWidth: 1.5 },
  chipAtivo: { backgroundColor: cores.tinta, borderColor: cores.tinta },
  chipInativo: { backgroundColor: cores.card, borderColor: cores.linha },
  chipTexto: { fontFamily: fontes.corpoNegrito, fontSize: 13, color: cores.sub },
  chipTextoAtivo: { color: "#fff" },
  botaoBase: { width: "100%", paddingVertical: 15, borderRadius: raio.botao, alignItems: "center", justifyContent: "center", flexDirection: "row", gap: 8 },
  botaoSecundario: { backgroundColor: cores.card, borderWidth: 1.5, borderColor: cores.linha },
  botaoTexto: { fontFamily: fontes.corpoNegrito, fontSize: 15 },
  botaoTextoClaro: { fontFamily: fontes.corpoNegrito, fontSize: 15, color: "#fff" },
  link: { color: cores.tinta, fontFamily: fontes.corpoNegrito, fontSize: 14, textDecorationLine: "underline" },
  sw: { width: 46, height: 26, borderRadius: raio.pilula, padding: 2, flexDirection: "row" },
  kn: { width: 22, height: 22, borderRadius: raio.pilula, backgroundColor: "#fff" },
  erro: { color: cores.vermelho, marginBottom: 8, fontFamily: fontes.corpoMedio },
  sucessoCartao: { backgroundColor: cores.verdeSuave, borderWidth: 1, borderColor: "#BFE0CE", borderRadius: raio.card, padding: 12, marginBottom: 8 },
  sucessoTexto: { color: cores.verde, fontFamily: fontes.corpoSemi, fontSize: 13.5 },
});
