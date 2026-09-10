import { useId } from "react";
import { View, ViewStyle, StyleProp } from "react-native";
import Svg, { Defs, Pattern, Rect } from "react-native-svg";

/**
 * Fundo hachurado (equivalente ao `repeating-linear-gradient` do CSS) para
 * intervalos fora do expediente, bloqueios e buracos mortos na linha do
 * tempo da Agenda — "mostrar o dinheiro vazando" (spec §7.1).
 */
export function Hachura({
  corFundo,
  corListra,
  larguraListra = 5,
  passo = 11,
  style,
  children,
}: {
  corFundo: string;
  corListra: string;
  larguraListra?: number;
  passo?: number;
  style?: StyleProp<ViewStyle>;
  children?: React.ReactNode;
}) {
  const id = `hachura${useId().replace(/[^a-zA-Z0-9]/g, "")}`;
  return (
    <View style={[{ overflow: "hidden" }, style]}>
      <Svg width="100%" height="100%" style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0 }}>
        <Defs>
          <Pattern id={id} width={passo} height={passo} patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
            <Rect width={passo} height={passo} fill={corFundo} />
            <Rect width={larguraListra} height={passo} fill={corListra} />
          </Pattern>
        </Defs>
        <Rect width="100%" height="100%" fill={`url(#${id})`} />
      </Svg>
      {children}
    </View>
  );
}
