import { useState } from "react";
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { minParaHora } from "@navalha/agenda-inteligente";
import { cores, fontes, raio } from "../theme";
import type { Profissional } from "../hooks/useProfissional";
import { useRetornos, type Retorno } from "../hooks/useRetornos";
import { useServicos } from "../hooks/useServicos";
import { buscarSugestoes, nomeRelativoDaData } from "../lib/motorAgenda";
import { abrirWhatsApp, msgRetorno } from "../lib/whatsapp";
import { Carregando } from "../components/ui";
import { WhatsAppIcon } from "../components/WhatsAppIcon";
import { iniciais } from "../lib/texto";

function textoVencimento(r: Retorno): { texto: string; atrasado: boolean } {
  const dias = Math.round((new Date(r.previstoPara).getTime() - Date.now()) / 86400000);
  if (r.vencido) return { texto: dias < -1 ? `Venceu há ${Math.abs(dias)} dias` : "Venceu há 1 dia", atrasado: true };
  if (dias === 0) return { texto: "Vence hoje", atrasado: true };
  if (dias === 1) return { texto: "Vence amanhã", atrasado: false };
  return { texto: `Volta em ${dias} dias`, atrasado: false };
}

/** Aba Retornos (spec F6, §3.3) — clientes na hora de voltar, vencidos primeiro. */
export function RetornosScreen({ profissional }: { profissional: Profissional }) {
  const retornos = useRetornos(profissional.barbearia_id);
  const servicos = useServicos(profissional.barbearia_id);
  const [enviandoId, setEnviandoId] = useState<string | null>(null);

  if (retornos.isLoading || servicos.isLoading) return <Carregando />;

  const servicosAtivos = (servicos.data ?? []).filter((sv) => sv.ativo);
  const menorServico = servicosAtivos.length ? Math.min(...servicosAtivos.map((sv) => sv.duracaoMin)) : 30;

  async function chamarNoWhatsApp(r: Retorno) {
    setEnviandoId(r.clienteId);
    try {
      const servico = (servicos.data ?? []).find((sv) => sv.id === r.servicoHabitualId);
      const sugestoes = servico
        ? await buscarSugestoes({
            profissionalId: profissional.id,
            duracaoServico: servico.duracaoMin,
            menorServico,
            buffer: profissional.buffer_min,
            ancora: profissional.ancora,
            maxSugestoes: 2,
          })
        : [];
      const opcoes = sugestoes.map((s) => `${nomeRelativoDaData(s.data).toLowerCase()} ${minParaHora(s.inicio)}`);
      abrirWhatsApp(r.telefone, msgRetorno(r.nome.split(" ")[0], servico?.nome.toLowerCase() ?? "corte", opcoes.length ? opcoes : ["a agenda aberta"]));
    } finally {
      setEnviandoId(null);
    }
  }

  return (
    <View style={s.tela}>
      <View style={s.header}>
        <Text style={s.marca}>NAVALHA</Text>
        <Text style={s.titulo}>Retornos</Text>
        <Text style={s.sub}>Clientes na hora de voltar — um toque e a conversa começa</Text>
      </View>

      <ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 6, paddingBottom: 110 }}>
        {(retornos.data ?? []).map((r) => {
          const venc = textoVencimento(r);
          return (
            <View key={r.clienteId} style={s.cartao}>
              <View style={s.avatar}>
                <Text style={s.avatarTexto}>{iniciais(r.nome)}</Text>
              </View>
              <View style={{ flex: 1, minWidth: 0 }}>
                <Text style={s.nome}>{r.nome}</Text>
                <Text style={s.info}>Costuma voltar a cada {r.cicloDias} dias</Text>
                <Text style={[s.venc, { color: venc.atrasado ? cores.vermelho : cores.verde }]}>{venc.texto}</Text>
              </View>
              <Pressable style={s.waBotao} accessibilityLabel="Chamar no WhatsApp" onPress={() => chamarNoWhatsApp(r)} disabled={enviandoId === r.clienteId}>
                {enviandoId === r.clienteId ? <ActivityIndicator color="#fff" size="small" /> : <WhatsAppIcon size={20} />}
              </Pressable>
            </View>
          );
        })}
        {(retornos.data ?? []).length === 0 && <Text style={s.vazio}>Nenhum cliente na hora de voltar por enquanto.</Text>}
        <Text style={s.rodape}>A mensagem já sai pronta com os melhores horários calculados pela agenda inteligente.</Text>
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  tela: { flex: 1, backgroundColor: cores.fundo },
  header: { paddingHorizontal: 20, paddingTop: 6, paddingBottom: 10 },
  marca: { fontFamily: fontes.titulo, fontSize: 14, letterSpacing: 0.4, color: cores.vermelho },
  titulo: { fontFamily: fontes.titulo, fontSize: 29, color: cores.tinta, lineHeight: 32 },
  sub: { fontSize: 13, color: cores.sub, fontFamily: fontes.corpoMedio, marginTop: 2 },
  cartao: { flexDirection: "row", alignItems: "center", gap: 12, backgroundColor: cores.card, borderWidth: 1, borderColor: cores.linha, borderRadius: raio.card, padding: 14, marginBottom: 10 },
  avatar: { width: 42, height: 42, borderRadius: 12, backgroundColor: cores.tinta, alignItems: "center", justifyContent: "center" },
  avatarTexto: { color: "#fff", fontFamily: fontes.tituloSemi, fontSize: 16 },
  nome: { fontFamily: fontes.corpoNegrito, fontSize: 15, color: cores.tinta },
  info: { fontSize: 12, color: cores.sub },
  venc: { fontSize: 11.5, fontFamily: fontes.corpoNegrito, marginTop: 2 },
  waBotao: { width: 44, height: 44, borderRadius: 13, backgroundColor: cores.whatsapp, alignItems: "center", justifyContent: "center" },
  vazio: { fontSize: 14, color: cores.fraco, padding: 8 },
  rodape: { fontSize: 12.5, color: cores.fraco, textAlign: "center", padding: 14, lineHeight: 18 },
});
