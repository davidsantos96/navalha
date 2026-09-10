export const NOMES_DIAS = ["Domingo", "Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado"];

export interface Bloco {
  inicioMin: number;
  fimMin: number;
}

export interface DiaExpediente {
  diaSemana: number;
  nome: string;
  aberto: boolean;
  blocos: Bloco[];
}

export function formatarMin(min: number): string {
  const h = Math.floor(min / 60).toString().padStart(2, "0");
  const m = (min % 60).toString().padStart(2, "0");
  return `${h}:${m}`;
}

export function minParaData(min: number): Date {
  const d = new Date();
  d.setHours(Math.floor(min / 60), min % 60, 0, 0);
  return d;
}

export function dataParaMin(d: Date): number {
  return d.getHours() * 60 + d.getMinutes();
}

// Preset da spec §2.2 (ex: 9–12h / 13–19h) — reduz fricção, tudo editável.
export function expedientePadrao(): DiaExpediente[] {
  return NOMES_DIAS.map((nome, diaSemana) => {
    if (diaSemana === 0) return { diaSemana, nome, aberto: false, blocos: [] };
    if (diaSemana === 6) {
      return { diaSemana, nome, aberto: true, blocos: [{ inicioMin: 9 * 60, fimMin: 13 * 60 }] };
    }
    return {
      diaSemana,
      nome,
      aberto: true,
      blocos: [
        { inicioMin: 9 * 60, fimMin: 12 * 60 },
        { inicioMin: 13 * 60, fimMin: 19 * 60 },
      ],
    };
  });
}

export function paraLinhas(dias: DiaExpediente[]): { diaSemana: number; inicioMin: number; fimMin: number }[] {
  return dias
    .filter((d) => d.aberto)
    .flatMap((d) => d.blocos.map((b) => ({ diaSemana: d.diaSemana, inicioMin: b.inicioMin, fimMin: b.fimMin })));
}

export function deLinhas(linhas: { diaSemana: number; inicioMin: number; fimMin: number }[]): DiaExpediente[] {
  return NOMES_DIAS.map((nome, diaSemana) => {
    const blocos = linhas.filter((l) => l.diaSemana === diaSemana).map((l) => ({ inicioMin: l.inicioMin, fimMin: l.fimMin }));
    return { diaSemana, nome, aberto: blocos.length > 0, blocos };
  });
}

export function validarExpediente(dias: DiaExpediente[]): string | null {
  const abertos = dias.filter((d) => d.aberto);
  if (abertos.length === 0) return "Abra pelo menos um dia da semana.";
  for (const d of abertos) {
    if (d.blocos.length === 0) return `Adicione um horário em ${d.nome}.`;
    for (const b of d.blocos) {
      if (b.fimMin <= b.inicioMin) return `Em ${d.nome}, o fim deve ser depois do início.`;
    }
  }
  return null;
}
