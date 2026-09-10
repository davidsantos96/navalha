const DIAS = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];
const MESES = ["jan", "fev", "mar", "abr", "mai", "jun", "jul", "ago", "set", "out", "nov", "dez"];

/** Data (meia-noite local) do dia `offset` dias a partir de hoje. */
export function dataDoOffset(offset: number): Date {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() + offset);
  return d;
}

/** "YYYY-MM-DD" do dia `offset` dias a partir de hoje — formato usado pelos hooks. */
export function dataISODoOffset(offset: number): string {
  const d = dataDoOffset(offset);
  const ano = d.getFullYear();
  const mes = String(d.getMonth() + 1).padStart(2, "0");
  const dia = String(d.getDate()).padStart(2, "0");
  return `${ano}-${mes}-${dia}`;
}

export function diaSemanaDoOffset(offset: number): number {
  return dataDoOffset(offset).getDay();
}

/** "Hoje" / "Amanhã" / "Seg" — como a spec pede que a agenda se refira ao dia. */
export function nomeRelativo(offset: number): string {
  if (offset === 0) return "Hoje";
  if (offset === 1) return "Amanhã";
  return DIAS[diaSemanaDoOffset(offset)];
}

/** "7 set" */
export function dataCurta(offset: number): string {
  const d = dataDoOffset(offset);
  return `${d.getDate()} ${MESES[d.getMonth()]}`;
}

/** "Seg, 7 set" */
export function dataCompleta(offset: number): string {
  return `${DIAS[diaSemanaDoOffset(offset)]}, ${dataCurta(offset)}`;
}

/** "7 set" a partir de uma data "YYYY-MM-DD" (evita o fuso do `new Date(iso)`). */
export function dataCurtaDeISO(iso: string): string {
  const [, mes, dia] = iso.split("-").map(Number);
  return `${dia} ${MESES[mes - 1]}`;
}

/** ISO timestamptz (sem timezone explícito, hora local) a partir de "YYYY-MM-DD" + minutos desde 00:00. */
export function minutosParaISO(dataISO: string, minutos: number): string {
  const h = String(Math.floor(minutos / 60)).padStart(2, "0");
  const m = String(minutos % 60).padStart(2, "0");
  return `${dataISO}T${h}:${m}:00`;
}

/** Offset (dias a partir de hoje) correspondente a uma data "YYYY-MM-DD", dentro de um horizonte de busca. */
export function offsetDaData(iso: string, horizonteDias = 14): number {
  for (let offset = 0; offset < horizonteDias; offset++) {
    if (dataISODoOffset(offset) === iso) return offset;
  }
  return 0;
}

export function formatarCentavos(centavos: number): string {
  return `R$ ${(centavos / 100).toFixed(centavos % 100 === 0 ? 0 : 2).replace(".", ",")}`;
}
