// Gera os ícones do app a partir do logo "inicial" (N + navalha/poste de
// barbeiro) em assets/marca/logo-inicial.png. Rode com:
//   node scripts/gerar-icones.js
const sharp = require("sharp");
const path = require("path");

const NAVY = "#16233F"; // cores.tinta — mesmo azul-marinho usado no resto do app

const assets = path.join(__dirname, "..", "assets");
const fonte = path.join(assets, "marca", "logo-inicial.png");

async function gerar() {
  // icon.png — ícone principal (iOS/Expo). A arte já vem com fundo/gradiente
  // e cantos arredondados embutidos; o SO aplica a própria máscara por cima.
  await sharp(fonte).resize(1024, 1024).flatten({ background: NAVY }).png().toFile(path.join(assets, "icon.png"));

  // Android adaptive icon: foreground (logo encolhido dentro da safe zone,
  // centralizado num canvas 512 preenchido com o mesmo azul do background,
  // pra não sobrar borda visível) + background (azul sólido) + monochrome
  // (silhueta branca, usada só quando o launcher liga "ícones no tema").
  const logoEncolhido = await sharp(fonte).resize(420, 420).toBuffer();
  await sharp({ create: { width: 512, height: 512, channels: 4, background: NAVY } })
    .composite([{ input: logoEncolhido, gravity: "center" }])
    .png()
    .toFile(path.join(assets, "android-icon-foreground.png"));

  await sharp({ create: { width: 512, height: 512, channels: 4, background: NAVY } })
    .png()
    .toFile(path.join(assets, "android-icon-background.png"));

  // Sem monochromeImage: a logo tem degradê/textura nas áreas "sólidas" (não
  // é arte vetorial), então uma silhueta extraída por cor sai granulada.
  // O Android usa o ícone normal quando não há monochrome — é só um efeito
  // cosmético opcional ("ícones no tema"), não vale a pena forçar.

  // favicon.png — pequeno, direto da arte original.
  await sharp(fonte).resize(48, 48).png().toFile(path.join(assets, "favicon.png"));

  // splash-icon.png — mesma arte, tamanho cheio (mostrado centralizado
  // sobre o backgroundColor do splash nativo, configurado pro mesmo azul).
  await sharp(fonte).resize(1024, 1024).png().toFile(path.join(assets, "splash-icon.png"));

  console.log("Ícones gerados em assets/ a partir de assets/marca/logo-inicial.png");
}

gerar().catch((e) => {
  console.error(e);
  process.exit(1);
});
