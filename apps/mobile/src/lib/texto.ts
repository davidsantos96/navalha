export function iniciais(nome: string): string {
  return nome.split(" ").map((p) => p[0]).slice(0, 2).join("").toUpperCase();
}
