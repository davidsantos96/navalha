import { ActivityIndicator, Image, StyleSheet, View } from "react-native";
import { cores } from "../theme";

/**
 * Tela de carregamento do boot do app (fonte carregando, sessão sendo
 * checada, perfil sendo buscado) — mesma marca e fundo do splash nativo
 * (assets/splash-icon.png) pra não ter um "salto" visual entre o splash
 * do SO e o primeiro frame em JS. Não usar em telas internas — pra
 * loading dentro do app já logado, ver <Carregando/> em components/ui.
 */
export function TelaCarregamento() {
  return (
    <View style={s.tela}>
      <Image source={require("../../assets/splash-icon.png")} style={s.marca} resizeMode="contain" />
      <ActivityIndicator color="#fff" style={s.spinner} />
    </View>
  );
}

const s = StyleSheet.create({
  tela: { flex: 1, backgroundColor: cores.tinta, alignItems: "center", justifyContent: "center" },
  marca: { width: 180, height: 180 },
  spinner: { marginTop: 20 },
});
