import Svg, { Path } from "react-native-svg";

export function WhatsAppIcon({ size = 18 }: { size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="#fff">
      <Path d="M12 2a10 10 0 0 0-8.6 15L2 22l5.2-1.4A10 10 0 1 0 12 2zm5.4 13.9c-.2.7-1.3 1.3-1.9 1.3-.5.1-1.1.1-1.8-.1-2.6-.8-4.4-2.7-5.6-4.6-.6-1-1-2-1-2.9 0-.9.5-1.6.9-1.9.3-.2.6-.2.8-.2h.6c.2 0 .4 0 .6.5l.8 2c.1.2.1.4 0 .6l-.4.6c-.2.2-.3.4-.1.7.5.9 1.7 2.2 3.2 2.8.3.1.5.1.7-.1l.7-.8c.2-.3.4-.3.7-.2l1.9.9c.3.2.5.3.4.9z" />
    </Svg>
  );
}
