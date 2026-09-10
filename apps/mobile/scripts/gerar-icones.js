// Gera os ícones do app a partir da identidade visual já usada no login
// (listra do poste de barbeiro, ver src/components/Pole.tsx) — não depende
// de nenhum arquivo de logo externo. Rode com: node scripts/gerar-icones.js
const sharp = require("sharp");
const path = require("path");

const NAVY = "#16233F";
const RED = "#C8362E";
const OFFWHITE = "#F4F6F5";

/** Mesma lógica de padrão diagonal do componente <Pole/>, em string SVG crua. */
function listraDefs(id, passo) {
  return `
    <pattern id="${id}" width="${passo * 4}" height="${passo * 4}" patternUnits="userSpaceOnUse" patternTransform="rotate(-55)">
      <rect width="${passo * 4}" height="${passo * 4}" fill="${RED}" />
      <rect x="${passo}" width="${passo}" height="${passo * 4}" fill="${OFFWHITE}" />
      <rect x="${passo * 2}" width="${passo}" height="${passo * 4}" fill="${NAVY}" />
      <rect x="${passo * 3}" width="${passo}" height="${passo * 4}" fill="${OFFWHITE}" />
    </pattern>`;
}

/** Pill horizontal com a listra, centralizado num canvas quadrado. */
function svgPill({ canvas, pillWidthPct, pillHeightPct, fundo, monocromatico, passoDivisor = 14 }) {
  const w = canvas * pillWidthPct;
  const h = canvas * pillHeightPct;
  const x = (canvas - w) / 2;
  const y = (canvas - h) / 2;
  const rx = h / 2;
  const passo = h / passoDivisor;
  const id = "listra";
  const fill = monocromatico ? "#FFFFFF" : `url(#${id})`;
  return `
    <svg width="${canvas}" height="${canvas}" viewBox="0 0 ${canvas} ${canvas}" xmlns="http://www.w3.org/2000/svg">
      <defs>${monocromatico ? "" : listraDefs(id, passo)}</defs>
      ${fundo ? `<rect width="${canvas}" height="${canvas}" fill="${fundo}" />` : ""}
      <rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${rx}" fill="${fill}" />
    </svg>`;
}

const assets = path.join(__dirname, "..", "assets");

async function gerar() {
  // icon.png — ícone principal (iOS/Expo), sem transparência.
  await sharp(Buffer.from(svgPill({ canvas: 1024, pillWidthPct: 0.74, pillHeightPct: 0.32, fundo: NAVY })))
    .flatten({ background: NAVY })
    .png()
    .toFile(path.join(assets, "icon.png"));

  // Android adaptive icon: foreground (transparente, dentro da safe zone ~66%), background (sólido) e monochrome (silhueta).
  await sharp(Buffer.from(svgPill({ canvas: 512, pillWidthPct: 0.58, pillHeightPct: 0.24, fundo: null })))
    .png()
    .toFile(path.join(assets, "android-icon-foreground.png"));

  await sharp(Buffer.from(`<svg width="512" height="512" xmlns="http://www.w3.org/2000/svg"><rect width="512" height="512" fill="${NAVY}"/></svg>`))
    .png()
    .toFile(path.join(assets, "android-icon-background.png"));

  await sharp(Buffer.from(svgPill({ canvas: 432, pillWidthPct: 0.58, pillHeightPct: 0.24, fundo: null, monocromatico: true })))
    .png()
    .toFile(path.join(assets, "android-icon-monochrome.png"));

  // favicon.png — pequeno, pill maior e listras mais grossas pra continuar legível.
  await sharp(Buffer.from(svgPill({ canvas: 48, pillWidthPct: 0.88, pillHeightPct: 0.46, fundo: NAVY, passoDivisor: 6 })))
    .png()
    .toFile(path.join(assets, "favicon.png"));

  // splash-icon.png — mostrado centralizado sobre o fundo da splash screen, transparente.
  await sharp(Buffer.from(svgPill({ canvas: 1024, pillWidthPct: 0.6, pillHeightPct: 0.26, fundo: null })))
    .png()
    .toFile(path.join(assets, "splash-icon.png"));

  console.log("Ícones gerados em assets/.");
}

gerar().catch((e) => {
  console.error(e);
  process.exit(1);
});
