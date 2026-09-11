// Gera os ícones do app a partir das duas artes em assets/marca/:
//   logo-calendario.png — ícone principal (fora do app: tela inicial do
//     celular, ícone adaptativo Android, favicon do web).
//   logo-inicial.png ("N" + poste de barbeiro) — marca de dentro do app
//     (tela de carregamento / splash).
// Rode com: node scripts/gerar-icones.js
const sharp = require("sharp");
const path = require("path");

const NAVY = "#16233F"; // cores.tinta — mesmo azul-marinho usado no resto do app

const assets = path.join(__dirname, "..", "assets");
const fonteIcone = path.join(assets, "marca", "logo-calendario.png");
const fonteSplash = path.join(assets, "marca", "logo-inicial.png");

async function gerar() {
  // icon.png — ícone principal (iOS/Expo). A arte já vem com fundo/gradiente
  // e cantos arredondados embutidos; o SO aplica a própria máscara por cima.
  await sharp(fonteIcone).resize(1024, 1024).flatten({ background: NAVY }).png().toFile(path.join(assets, "icon.png"));

  // Android adaptive icon: foreground (logo encolhido dentro da safe zone,
  // centralizado num canvas 512 preenchido com o mesmo azul do background,
  // pra não sobrar borda visível) + background (azul sólido).
  const logoEncolhido = await sharp(fonteIcone).resize(420, 420).toBuffer();
  await sharp({ create: { width: 512, height: 512, channels: 4, background: NAVY } })
    .composite([{ input: logoEncolhido, gravity: "center" }])
    .png()
    .toFile(path.join(assets, "android-icon-foreground.png"));

  await sharp({ create: { width: 512, height: 512, channels: 4, background: NAVY } })
    .png()
    .toFile(path.join(assets, "android-icon-background.png"));

  // Sem monochromeImage: a arte tem degradê/textura nas áreas "sólidas" (não
  // é vetorial), então uma silhueta extraída por cor sai granulada. O
  // Android usa o ícone normal quando não há monochrome — é só um efeito
  // cosmético opcional ("ícones no tema"), não vale a pena forçar.

  // favicon.png — pequeno, direto do ícone principal.
  await sharp(fonteIcone).resize(48, 48).png().toFile(path.join(assets, "favicon.png"));

  // splash-icon.png — a outra arte (N + poste), mostrada centralizada sobre
  // o backgroundColor do splash nativo (mesmo azul) e na TelaCarregamento.
  await sharp(fonteSplash).resize(1024, 1024).png().toFile(path.join(assets, "splash-icon.png"));

  console.log("Ícones gerados em assets/ — ícone principal de logo-calendario.png, splash de logo-inicial.png");
}

gerar().catch((e) => {
  console.error(e);
  process.exit(1);
});
