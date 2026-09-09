import { Linking } from "react-native";

/** Abre o WhatsApp com mensagem pronta. Funciona com WhatsApp comum e Business. */
export function abrirWhatsApp(telefoneE164: string, mensagem: string) {
  const url = `https://wa.me/${telefoneE164.replace(/\D/g, "")}?text=${encodeURIComponent(mensagem)}`;
  return Linking.openURL(url);
}

export function msgConfirmacao(nome: string, dia: string, hora: string, barbearia: string) {
  return `${nome}, confirmado ${dia} às ${hora} na ${barbearia} ✂`;
}

export function msgRetorno(nome: string, servico: string, opcoes: string[]) {
  return `Fala ${nome}! Tá na hora do ${servico}. Tenho ${opcoes.join(" ou ")} — qual prefere?`;
}
