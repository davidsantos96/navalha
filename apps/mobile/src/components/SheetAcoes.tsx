import { useState } from "react";
import { Modal, Pressable, StyleSheet, Text, View } from "react-native";
import { cores, fontes, raio } from "../theme";
import type { ItemAgenda } from "../hooks/useAgendaDoDia";
import { useAtualizarStatusAgendamento } from "../hooks/useAtualizarStatusAgendamento";
import { useReencaixe } from "../hooks/useReencaixe";
import { minParaHora } from "@navalha/agenda-inteligente";
import { abrirWhatsApp } from "../lib/whatsapp";
import { BotaoPerigo, BotaoSecundario } from "./ui";
import { WhatsAppIcon } from "./WhatsAppIcon";

/**
 * Sheet de ações do atendimento (spec §3.2): toque no bloco da agenda →
 * concluir / reagendar / marcar falta / cancelar / chamar no WhatsApp.
 * Cancelar cruza o espaço liberado com a lista de retornos (F7) e, se
 * achar candidato, mostra a dica em vez de fechar direto.
 */
export function SheetAcoes({
  item,
  barbeariaId,
  bufferMin,
  onFechar,
  onReagendar,
}: {
  item: ItemAgenda;
  barbeariaId: string;
  bufferMin: number;
  onFechar: () => void;
  onReagendar: () => void;
}) {
  const [cancelado, setCancelado] = useState(false);
  const atualizarStatus = useAtualizarStatusAgendamento();
  const buraco = cancelado ? { inicio: item.inicio, fim: item.fim } : undefined;
  const reencaixe = useReencaixe(cancelado ? barbeariaId : undefined, buraco, bufferMin);

  function concluir() {
    atualizarStatus.mutate({ id: item.id, status: "concluido" }, { onSuccess: onFechar });
  }

  function marcarFalta() {
    atualizarStatus.mutate({ id: item.id, status: "falta" }, { onSuccess: onFechar });
  }

  function cancelar() {
    atualizarStatus.mutate({ id: item.id, status: "cancelado" }, { onSuccess: () => setCancelado(true) });
  }

  const sugestoesReencaixe = cancelado ? reencaixe.data ?? [] : [];
  const mostrarDica = cancelado && reencaixe.isFetched;

  return (
    <Modal visible transparent animationType="fade" onRequestClose={onFechar}>
      <Pressable style={s.fundo} onPress={mostrarDica ? undefined : onFechar} />
      <View style={s.sheet}>
        <View style={s.alca} />
        <Text style={s.nome}>{item.clienteNome ?? "—"}</Text>
        <Text style={s.info}>
          {item.servicoNome ?? "—"} · {minParaHora(item.inicio)}–{minParaHora(item.fim)}
        </Text>

        {mostrarDica ? (
          sugestoesReencaixe.length > 0 ? (
            <View style={s.dica}>
              <Text style={s.dicaTexto}>
                Abriu {item.fim - item.inicio} min às {minParaHora(item.inicio)}. {sugestoesReencaixe.length} cliente
                {sugestoesReencaixe.length > 1 ? "s" : ""} de retorno cabe{sugestoesReencaixe.length > 1 ? "m" : ""} nesse espaço:{" "}
                {sugestoesReencaixe.map((r) => r.nome.split(" ")[0]).join(", ")}.
              </Text>
              <Pressable
                style={s.dicaBotao}
                onPress={() => {
                  const r = sugestoesReencaixe[0];
                  abrirWhatsApp(r.telefone, `Fala ${r.nome.split(" ")[0]}! Tá na hora do ${r.servicoNome.toLowerCase()}. Abriu um horário às ${minParaHora(item.inicio)} — quer aproveitar?`);
                  onFechar();
                }}
              >
                <Text style={s.dicaBotaoTexto}>Chamar no WhatsApp</Text>
              </Pressable>
              <Pressable onPress={onFechar} style={{ marginTop: 8 }}>
                <Text style={s.fecharTexto}>Fechar</Text>
              </Pressable>
            </View>
          ) : (
            <View style={s.dica}>
              <Text style={s.dicaTexto}>Cancelado. Horário liberado na agenda.</Text>
              <Pressable onPress={onFechar} style={{ marginTop: 8 }}>
                <Text style={s.fecharTexto}>Fechar</Text>
              </Pressable>
            </View>
          )
        ) : (
          <>
            {item.clienteTelefone && (
              <Pressable
                style={[s.botao, { backgroundColor: cores.whatsapp }]}
                onPress={() => abrirWhatsApp(item.clienteTelefone!, `Oi ${item.clienteNome?.split(" ")[0]}! Passando pra confirmar seu horário.`)}
              >
                <WhatsAppIcon />
                <Text style={s.botaoTextoClaro}>Chamar no WhatsApp</Text>
              </Pressable>
            )}
            <BotaoSecundario texto="✓ Concluir atendimento" onPress={concluir} style={{ marginTop: 10 }} />
            <BotaoSecundario texto="↻ Reagendar — ver melhores encaixes" onPress={onReagendar} style={{ marginTop: 10 }} />
            <BotaoSecundario texto="Marcar falta" onPress={marcarFalta} style={{ marginTop: 10 }} />
            <BotaoPerigo texto="Cancelar agendamento" onPress={cancelar} style={{ marginTop: 10 }} />
          </>
        )}
      </View>
    </Modal>
  );
}

const s = StyleSheet.create({
  fundo: { position: "absolute", top: 0, left: 0, right: 0, bottom: 0, backgroundColor: "rgba(14,22,38,.45)" },
  sheet: { position: "absolute", left: 0, right: 0, bottom: 0, backgroundColor: "#fff", borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 20, paddingTop: 14, paddingBottom: 30 },
  alca: { width: 40, height: 4, borderRadius: raio.pilula, backgroundColor: "#D6DBE0", alignSelf: "center", marginBottom: 14 },
  nome: { fontFamily: fontes.titulo, fontSize: 20, color: cores.tinta },
  info: { fontSize: 13, color: cores.sub, fontFamily: fontes.corpoSemi, marginTop: 2, marginBottom: 14 },
  botao: { width: "100%", paddingVertical: 15, borderRadius: raio.botao, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8 },
  botaoTextoClaro: { color: "#fff", fontFamily: fontes.corpoNegrito, fontSize: 15 },
  dica: { backgroundColor: cores.verdeSuave, borderWidth: 1, borderColor: "#BFE0CE", borderRadius: 14, padding: 14 },
  dicaTexto: { fontSize: 13, color: cores.verde, fontFamily: fontes.corpoSemi, lineHeight: 19 },
  dicaBotao: { marginTop: 8, backgroundColor: cores.verde, borderRadius: 10, paddingVertical: 9, paddingHorizontal: 14, alignSelf: "flex-start" },
  dicaBotaoTexto: { color: "#fff", fontFamily: fontes.corpoNegrito, fontSize: 13 },
  fecharTexto: { color: cores.sub, fontFamily: fontes.corpoSemi, fontSize: 13 },
});
