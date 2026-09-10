// Design tokens da spec (seção 7.2) — paleta do poste de barbeiro
export const cores = {
  fundo: "#F4F6F5",
  card: "#FFFFFF",
  tinta: "#16233F",
  sub: "#5C6678",
  fraco: "#8B93A3",
  vermelho: "#C8362E",
  vermelhoSuave: "#FBEDEC",
  azul: "#2563EB",
  azulSuave: "#E5EDFC",
  verde: "#1E7A4F",
  verdeSuave: "#E8F4EE",
  ambar: "#A66A0C",
  ambarSuave: "#FBF2E2",
  linha: "#DFE3E6",
  whatsapp: "#1FAF57",
};

export const raio = { card: 16, botao: 15, bloco: 12, pilula: 999 };

// Tipografia da spec (§7.2): Bricolage Grotesque (títulos/números, "voz de
// letreiro") + Figtree (corpo). Carregadas em App.tsx via useFonts.
export const fontes = {
  titulo: "BricolageGrotesque_800ExtraBold",
  tituloSemi: "BricolageGrotesque_700Bold",
  corpo: "Figtree_400Regular",
  corpoMedio: "Figtree_500Medium",
  corpoSemi: "Figtree_600SemiBold",
  corpoNegrito: "Figtree_700Bold",
};
