// Agenda Inteligente — sugestão de horários sem buracos
// TypeScript puro, sem dependências. Todos os tempos em minutos desde 00:00.

export interface Intervalo {
  inicio: number; // ex: 9h = 540
  fim: number;    // ex: 10h = 600
}

export interface Agendamento extends Intervalo {
  id: string;
}

export interface DiaAgenda {
  data: string;               // "2026-09-08" (ISO)
  expediente: Intervalo[];    // blocos de trabalho, ex: [{540,720},{780,1140}] = 9-12h e 13-19h
  agendamentos: Agendamento[];
}

export interface ConfigSugestao {
  duracaoServico: number;      // duração do serviço a agendar (min)
  menorServico: number;        // menor serviço ativo da barbearia (define "buraco morto")
  buffer?: number;             // respiro entre atendimentos (min), padrão 0
  ancora?: "inicio" | "fim";  // onde compactar dia vazio, padrão "inicio"
  janelaCliente?: Intervalo;   // preferência do cliente (filtro), ex: {1080, 1440} = após 18h
  maxSugestoes?: number;       // padrão 3
}

export type TipoSobra = "perfeito" | "util" | "morto";

export interface Sugestao {
  data: string;
  inicio: number;
  fim: number;
  pontos: number;
  tipoSobra: TipoSobra;
  sobraMin: number;      // tamanho da sobra criada no espaço livre usado
  criaBuracoMorto: boolean; // para exibir aviso na UI
}

// ---------- utilitários ----------

/** Espaços livres de um dia = expediente menos agendamentos (com buffer). */
export function espacosLivres(dia: DiaAgenda, buffer = 0): Intervalo[] {
  const ocupados = dia.agendamentos
    .map((a) => ({ inicio: a.inicio - buffer, fim: a.fim + buffer }))
    .sort((a, b) => a.inicio - b.inicio);

  const livres: Intervalo[] = [];
  for (const bloco of dia.expediente) {
    let cursor = bloco.inicio;
    for (const occ of ocupados) {
      if (occ.fim <= bloco.inicio || occ.inicio >= bloco.fim) continue;
      if (occ.inicio > cursor) livres.push({ inicio: cursor, fim: Math.min(occ.inicio, bloco.fim) });
      cursor = Math.max(cursor, occ.fim);
    }
    if (cursor < bloco.fim) livres.push({ inicio: cursor, fim: bloco.fim });
  }
  return livres.filter((g) => g.fim > g.inicio);
}

function classificaSobra(sobra: number, menorServico: number): TipoSobra {
  if (sobra === 0) return "perfeito";
  if (sobra >= menorServico) return "util";
  return "morto";
}

// ---------- geração de candidatos ----------

interface Candidato {
  inicio: number;
  fim: number;
  sobra: number;
  tipoSobra: TipoSobra;
  encostaEmAgendamento: boolean; // true = cola em atendimento; false = cola em borda do expediente
}

/**
 * Regra de ouro: candidatos são APENAS as bordas de cada espaço livre.
 * Colocar no meio sempre cria dois buracos — nunca é oferecido.
 */
function gerarCandidatos(dia: DiaAgenda, cfg: ConfigSugestao): Candidato[] {
  const dur = cfg.duracaoServico;
  const livres = espacosLivres(dia, cfg.buffer ?? 0);
  const candidatos: Candidato[] = [];

  const bordasExpediente = new Set(dia.expediente.flatMap((e) => [e.inicio, e.fim]));

  for (const gap of livres) {
    const tamanho = gap.fim - gap.inicio;
    if (tamanho < dur) continue;
    const sobra = tamanho - dur;
    const tipo = classificaSobra(sobra, cfg.menorServico);

    // Candidato na borda esquerda (cola no que vem antes)
    candidatos.push({
      inicio: gap.inicio,
      fim: gap.inicio + dur,
      sobra,
      tipoSobra: tipo,
      encostaEmAgendamento: !bordasExpediente.has(gap.inicio),
    });

    // Candidato na borda direita (cola no que vem depois) — só se difere do esquerdo
    if (sobra > 0) {
      candidatos.push({
        inicio: gap.fim - dur,
        fim: gap.fim,
        sobra,
        tipoSobra: tipo,
        encostaEmAgendamento: !bordasExpediente.has(gap.fim),
      });
    }
  }
  return candidatos;
}

// ---------- pontuação ----------

const PONTOS_SOBRA: Record<TipoSobra, number> = { perfeito: 100, util: 70, morto: 20 };

function pontuar(
  c: Candidato,
  dia: DiaAgenda,
  cfg: ConfigSugestao,
  duracoesComuns: number[],
): number {
  let pontos = PONTOS_SOBRA[c.tipoSobra];

  // Adjacência: colar em atendimento consolida blocos de trabalho
  if (c.encostaEmAgendamento) pontos += 15;

  // Sobra "vendável": múltiplo exato de uma duração comum (ex: sobra 60 com cortes de 30)
  if (c.sobra > 0 && duracoesComuns.some((d) => c.sobra % d === 0)) pontos += 10;

  // Consolidação: dia que já tem movimento vale mais que abrir dia vazio
  if (dia.agendamentos.length > 0) pontos += 12;

  // Dia vazio: respeitar a âncora do barbeiro
  if (dia.agendamentos.length === 0) {
    const ancora = cfg.ancora ?? "inicio";
    const alvo = ancora === "inicio"
      ? Math.min(...dia.expediente.map((e) => e.inicio))
      : Math.max(...dia.expediente.map((e) => e.fim)) - cfg.duracaoServico;
    if (c.inicio === alvo) pontos += 8;
  }

  return pontos;
}

// ---------- API principal ----------

/**
 * Sugere os melhores horários nos próximos dias.
 * @param dias      agenda dos próximos N dias (ex: 7), em ordem cronológica
 * @param cfg       configuração do serviço e preferências
 * @param duracoes  durações dos serviços ativos da barbearia (p/ detectar sobra vendável)
 */
export function sugerirHorarios(
  dias: DiaAgenda[],
  cfg: ConfigSugestao,
  duracoes: number[] = [],
): Sugestao[] {
  const max = cfg.maxSugestoes ?? 3;
  const todas: Sugestao[] = [];

  dias.forEach((dia, offset) => {
    let candidatos = gerarCandidatos(dia, cfg);

    // Preferência do cliente é FILTRO, não fator de nota
    if (cfg.janelaCliente) {
      const j = cfg.janelaCliente;
      candidatos = candidatos.filter((c) => c.inicio >= j.inicio && c.fim <= j.fim);
    }

    for (const c of candidatos) {
      // Recência: quanto mais próximo o dia, melhor (desempate suave, -3/dia)
      const pontos = pontuar(c, dia, cfg, duracoes) - offset * 3;
      todas.push({
        data: dia.data,
        inicio: c.inicio,
        fim: c.fim,
        pontos,
        tipoSobra: c.tipoSobra,
        sobraMin: c.sobra,
        criaBuracoMorto: c.tipoSobra === "morto",
      });
    }
  });

  todas.sort((a, b) => b.pontos - a.pontos || a.data.localeCompare(b.data) || a.inicio - b.inicio);

  // Diversidade: no máximo 2 sugestões do mesmo dia entre as top N
  const resultado: Sugestao[] = [];
  const porDia = new Map<string, number>();
  for (const s of todas) {
    const usado = porDia.get(s.data) ?? 0;
    if (usado >= 2) continue;
    resultado.push(s);
    porDia.set(s.data, usado + 1);
    if (resultado.length === max) break;
  }
  return resultado;
}

/**
 * Lógica inversa (reencaixe): dado um buraco criado por cancelamento,
 * retorna quais durações de serviço cabem nele — para cruzar com a
 * lista de retornos/espera e sugerir "chamar fulano no WhatsApp".
 */
export function servicosQueCabem(buraco: Intervalo, duracoes: number[], buffer = 0): number[] {
  const tamanho = buraco.fim - buraco.inicio;
  return duracoes.filter((d) => d + buffer <= tamanho);
}

// ---------- helpers de formatação ----------

export function minParaHora(min: number): string {
  const h = Math.floor(min / 60);
  const m = min % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}
