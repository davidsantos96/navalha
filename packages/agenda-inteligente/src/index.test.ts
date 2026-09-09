import { describe, it, expect } from "vitest";
import {
  espacosLivres,
  sugerirHorarios,
  servicosQueCabem,
  minParaHora,
  type DiaAgenda,
} from "./index";

// Expediente padrão dos testes: 9h–12h e 13h–19h
const EXP = [
  { inicio: 540, fim: 720 },
  { inicio: 780, fim: 1140 },
];

const dia = (data: string, ags: Array<{ id: string; inicio: number; fim: number }>): DiaAgenda => ({
  data,
  expediente: EXP,
  agendamentos: ags,
});

describe("espacosLivres", () => {
  it("respeita o almoço (buraco entre blocos de expediente não é espaço livre)", () => {
    const livres = espacosLivres(dia("2026-09-08", []));
    expect(livres).toEqual([
      { inicio: 540, fim: 720 },
      { inicio: 780, fim: 1140 },
    ]);
  });

  it("subtrai agendamentos e aplica buffer", () => {
    const d = dia("2026-09-08", [{ id: "a", inicio: 600, fim: 660 }]);
    const livres = espacosLivres(d, 5);
    expect(livres[0]).toEqual({ inicio: 540, fim: 595 }); // termina 5 min antes
    expect(livres[1]).toEqual({ inicio: 665, fim: 720 }); // começa 5 min depois
  });
});

describe("sugerirHorarios — regras de ouro", () => {
  it("nunca sugere o meio de um espaço livre (apenas bordas)", () => {
    const d = dia("2026-09-08", [{ id: "a", inicio: 540, fim: 570 }]);
    // Espaço livre 570–720 (150 min). Serviço de 30: bordas = 570 e 690.
    const sugs = sugerirHorarios([d], { duracaoServico: 30, menorServico: 30, maxSugestoes: 3 });
    for (const s of sugs.filter((s) => s.inicio >= 570 && s.fim <= 720)) {
      expect([570, 690]).toContain(s.inicio);
    }
  });

  it("desvia de espaço-armadilha que criaria buraco morto", () => {
    // Cenário validado no protótipo: gap de 45 min entre 9h30 e 10h15
    const d = dia("2026-09-08", [
      { id: "a1", inicio: 540, fim: 570 },
      { id: "a2", inicio: 615, fim: 660 },
      { id: "a3", inicio: 840, fim: 870 },
    ]);
    const sugs = sugerirHorarios([d], { duracaoServico: 30, menorServico: 30 });
    // 9h30 (570) criaria sobra de 15 min = buraco morto -> não está no top 3
    expect(sugs.some((s) => s.criaBuracoMorto)).toBe(false);
    expect(sugs.map((s) => s.inicio)).not.toContain(570);
    // Melhores encaixes: colado após a2 (11h) e antes de a3 (13h30)
    expect(sugs.map((s) => minParaHora(s.inicio))).toEqual(
      expect.arrayContaining(["11:00", "13:30"]),
    );
  });

  it("encaixe perfeito ganha de sobra útil", () => {
    // Espaço exato de 30 entre dois cortes vs espaço de 60 no fim do dia
    const d = dia("2026-09-08", [
      { id: "a1", inicio: 540, fim: 570 },
      { id: "a2", inicio: 600, fim: 630 },
    ]);
    const sugs = sugerirHorarios([d], { duracaoServico: 30, menorServico: 30 });
    expect(sugs[0].inicio).toBe(570);
    expect(sugs[0].tipoSobra).toBe("perfeito");
  });

  it("dia vazio ancora na abertura por padrão e no fim quando configurado", () => {
    const d = dia("2026-09-09", []);
    const ini = sugerirHorarios([d], { duracaoServico: 30, menorServico: 30 });
    expect(ini[0].inicio).toBe(540);
    const fim = sugerirHorarios([d], { duracaoServico: 30, menorServico: 30, ancora: "fim" });
    expect(fim[0].fim).toBe(1140);
  });

  it("consolida dias: dia com movimento ganha de dia vazio mais próximo? não — recência e consolidação se equilibram", () => {
    // Amanhã vazio vs depois de amanhã com 1 corte: consolidação (+12) supera recência (-3)
    const vazio = dia("2026-09-09", []);
    const comMovimento = dia("2026-09-10", [{ id: "a", inicio: 540, fim: 570 }]);
    const sugs = sugerirHorarios([vazio, comMovimento], { duracaoServico: 30, menorServico: 30 });
    expect(sugs[0].data).toBe("2026-09-10");
    expect(sugs[0].inicio).toBe(570); // colado no corte existente
  });

  it("preferência do cliente é filtro, não nota", () => {
    const d = dia("2026-09-08", [{ id: "a1", inicio: 540, fim: 570 }]);
    const sugs = sugerirHorarios([d], {
      duracaoServico: 30,
      menorServico: 30,
      janelaCliente: { inicio: 780, fim: 1440 }, // só depois das 13h
    });
    expect(sugs.length).toBeGreaterThan(0);
    for (const s of sugs) expect(s.inicio).toBeGreaterThanOrEqual(780);
  });

  it("diversidade: no máximo 2 sugestões do mesmo dia", () => {
    const dias = [dia("2026-09-08", []), dia("2026-09-09", []), dia("2026-09-10", [])];
    const sugs = sugerirHorarios(dias, { duracaoServico: 30, menorServico: 30 });
    const porDia = new Map<string, number>();
    for (const s of sugs) porDia.set(s.data, (porDia.get(s.data) ?? 0) + 1);
    for (const n of porDia.values()) expect(n).toBeLessThanOrEqual(2);
  });

  it("oferece buraco morto com aviso quando é a única opção", () => {
    // Único espaço: 45 min -> serviço de 30 deixa 15 = morto, mas deve aparecer marcado
    const d: DiaAgenda = {
      data: "2026-09-08",
      expediente: [{ inicio: 540, fim: 585 }],
      agendamentos: [],
    };
    const sugs = sugerirHorarios([d], { duracaoServico: 30, menorServico: 30 });
    expect(sugs.length).toBeGreaterThan(0);
    expect(sugs[0].criaBuracoMorto).toBe(true);
  });
});

describe("servicosQueCabem (reencaixe)", () => {
  it("retorna apenas durações que cabem no buraco, considerando buffer", () => {
    expect(servicosQueCabem({ inicio: 600, fim: 645 }, [15, 30, 45, 60])).toEqual([15, 30, 45]);
    expect(servicosQueCabem({ inicio: 600, fim: 645 }, [15, 30, 45, 60], 5)).toEqual([15, 30]);
  });
});

describe("minParaHora", () => {
  it("formata corretamente", () => {
    expect(minParaHora(540)).toBe("09:00");
    expect(minParaHora(1139)).toBe("18:59");
  });
});
