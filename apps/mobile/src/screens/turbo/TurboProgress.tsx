import { View } from "react-native";
import { cores, raio } from "../../theme";

export function TurboProgress({ passo }: { passo: 1 | 2 | 3 }) {
  return (
    <View style={{ flexDirection: "row", gap: 5, paddingHorizontal: 20, paddingBottom: 12 }}>
      {[1, 2, 3].map((i) => (
        <View key={i} style={{ flex: 1, height: 4, borderRadius: raio.pilula, backgroundColor: i <= passo ? cores.vermelho : "#DDE1E6" }} />
      ))}
    </View>
  );
}
