import { Linking } from "react-native";

/**
 * Os números de cliente são cadastrados como DDD + número, sem código do
 * país (ex.: "11999999999") — mas o wa.me exige E.164 completo. Sem o "55"
 * na frente, o WhatsApp tenta adivinhar o país e erra, dizendo que o
 * número não existe. Só prefixa se ainda não tiver: alguns números (ex.
 * o de suporte) já são cadastrados com "55" na frente.
 */
function paraE164Brasil(telefone: string): string {
  const digitos = telefone.replace(/\D/g, "");
  const jaTemCodigoDoPais = digitos.startsWith("55") && (digitos.length === 12 || digitos.length === 13);
  return jaTemCodigoDoPais ? digitos : `55${digitos}`;
}

/** Abre o WhatsApp com mensagem pronta. Funciona com WhatsApp comum e Business. */
export function abrirWhatsApp(telefone: string, mensagem: string) {
  const url = `https://wa.me/${paraE164Brasil(telefone)}?text=${encodeURIComponent(mensagem)}`;
  return Linking.openURL(url);
}

export function msgConfirmacao(nome: string, dia: string, hora: string, barbearia: string) {
  return `${nome}, confirmado ${dia} às ${hora} na ${barbearia} ✂`;
}

export function msgRetorno(nome: string, servico: string, opcoes: string[]) {
  return `Fala ${nome}! Tá na hora do ${servico}. Tenho ${opcoes.join(" ou ")} — qual prefere?`;
}
