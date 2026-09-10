import { useId } from "react";
import Svg, { Defs, Pattern, Rect } from "react-native-svg";

/**
 * A listra diagonal do poste de barbeiro — assinatura visual do Navalha
 * (spec §7.2). Usada como selo de marca no topo do Login.
 */
export function Pole({ width = 52, height = 7 }: { width?: number; height?: number }) {
  const id = `pole${useId().replace(/[^a-zA-Z0-9]/g, "")}`;
  const passo = height;
  return (
    <Svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
      <Defs>
        <Pattern id={id} width={passo * 4} height={passo * 4} patternUnits="userSpaceOnUse" patternTransform="rotate(-55)">
          <Rect width={passo * 4} height={passo * 4} fill="#C8362E" />
          <Rect x={passo} width={passo} height={passo * 4} fill="#F4F6F5" />
          <Rect x={passo * 2} width={passo} height={passo * 4} fill="#16233F" />
          <Rect x={passo * 3} width={passo} height={passo * 4} fill="#F4F6F5" />
        </Pattern>
      </Defs>
      <Rect width={width} height={height} rx={height / 2} fill={`url(#${id})`} />
    </Svg>
  );
}
