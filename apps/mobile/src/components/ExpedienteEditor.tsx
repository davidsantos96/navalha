import { useState } from "react";
import { Modal, Platform, Pressable, StyleSheet, Switch, Text, View } from "react-native";
import DateTimePicker from "@react-native-community/datetimepicker";
import { cores, fontes, raio } from "../theme";
import { BotaoPrimario } from "./ui";
import {
  dataParaMin,
  formatarMin,
  minParaData,
  type Bloco,
  type DiaExpediente,
} from "../lib/expediente";

interface PickerAlvo {
  diaSemana: number;
  indice: number;
  campo: "inicioMin" | "fimMin";
}

/**
 * Editor de expediente — extraído do onboarding (passo 2) pra ser
 * reaproveitado em Configurações → Horários (mesmo componente visual da
 * spec §7.3 telas 2 e 8, sugerido em design-handoff.md).
 */
export function ExpedienteEditor({
  dias,
  onAlternarDia,
  onAtualizarBloco,
  onAdicionarBloco,
  onRemoverBloco,
  onCopiarParaDiasUteis,
}: {
  dias: DiaExpediente[];
  onAlternarDia: (diaSemana: number, aberto: boolean) => void;
  onAtualizarBloco: (diaSemana: number, indice: number, campo: keyof Bloco, valor: number) => void;
  onAdicionarBloco: (diaSemana: number) => void;
  onRemoverBloco: (diaSemana: number, indice: number) => void;
  onCopiarParaDiasUteis: (diaSemanaOrigem: number) => void;
}) {
  const [picker, setPicker] = useState<PickerAlvo | null>(null);
  const diaSelecionado = picker ? dias.find((d) => d.diaSemana === picker.diaSemana) : undefined;
  const blocoSelecionado = diaSelecionado && picker ? diaSelecionado.blocos[picker.indice] : undefined;

  return (
    <View>
      {dias.map((d) => (
        <View key={d.diaSemana} style={s.cardDia}>
          <View style={s.linhaDia}>
            <Text style={s.diaNome}>{d.nome}</Text>
            <Switch value={d.aberto} onValueChange={(v) => onAlternarDia(d.diaSemana, v)} trackColor={{ true: cores.verde, false: cores.linha }} />
          </View>
          {d.aberto && (
            <View>
              {d.blocos.map((b, i) => (
                <View key={i} style={s.linhaBloco}>
                  <Pressable style={s.chipHora} onPress={() => setPicker({ diaSemana: d.diaSemana, indice: i, campo: "inicioMin" })}>
                    <Text style={s.chipHoraTxt}>{formatarMin(b.inicioMin)}</Text>
                  </Pressable>
                  <Text style={s.ate}>até</Text>
                  <Pressable style={s.chipHora} onPress={() => setPicker({ diaSemana: d.diaSemana, indice: i, campo: "fimMin" })}>
                    <Text style={s.chipHoraTxt}>{formatarMin(b.fimMin)}</Text>
                  </Pressable>
                  {d.blocos.length > 1 && (
                    <Pressable onPress={() => onRemoverBloco(d.diaSemana, i)} style={s.removerBtn}>
                      <Text style={s.removerTxt}>×</Text>
                    </Pressable>
                  )}
                </View>
              ))}
              <Pressable onPress={() => onAdicionarBloco(d.diaSemana)}>
                <Text style={s.link}>+ adicionar período</Text>
              </Pressable>
              {d.diaSemana === 1 && (
                <Pressable onPress={() => onCopiarParaDiasUteis(1)}>
                  <Text style={s.linkSecundario}>Usar esse horário de seg a sex →</Text>
                </Pressable>
              )}
            </View>
          )}
        </View>
      ))}

      {picker && blocoSelecionado && Platform.OS !== "ios" && (
        <DateTimePicker
          value={minParaData(blocoSelecionado[picker.campo])}
          mode="time"
          is24Hour
          display="default"
          onChange={(_evento, valor) => {
            setPicker(null);
            if (valor) onAtualizarBloco(picker.diaSemana, picker.indice, picker.campo, dataParaMin(valor));
          }}
        />
      )}

      {/* No Android o DateTimePicker já abre como diálogo nativo (não
          precisa de modal próprio). No iOS o modo "spinner" é inline — sem
          um Modal, ele renderizava no fim da lista de dias, longe de onde
          a pessoa tocou, dando a impressão de que a alteração era em outro
          lugar. */}
      <Modal visible={!!(picker && blocoSelecionado) && Platform.OS === "ios"} transparent animationType="fade" onRequestClose={() => setPicker(null)}>
        <Pressable style={s.modalFundo} onPress={() => setPicker(null)}>
          <Pressable style={s.pickerCaixa} onPress={(e) => e.stopPropagation()}>
            {picker && blocoSelecionado && (
              <DateTimePicker
                value={minParaData(blocoSelecionado[picker.campo])}
                mode="time"
                is24Hour
                display="spinner"
                onChange={(_evento, valor) => {
                  if (valor) onAtualizarBloco(picker.diaSemana, picker.indice, picker.campo, dataParaMin(valor));
                }}
              />
            )}
            <BotaoPrimario texto="Pronto" onPress={() => setPicker(null)} />
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

const s = StyleSheet.create({
  cardDia: { backgroundColor: cores.card, borderRadius: raio.card, borderWidth: 1, borderColor: cores.linha, padding: 14, marginBottom: 12 },
  linhaDia: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 8 },
  diaNome: { color: cores.tinta, fontFamily: fontes.corpoNegrito, fontSize: 16 },
  linhaBloco: { flexDirection: "row", alignItems: "center", marginBottom: 8, gap: 8 },
  chipHora: { flex: 1, backgroundColor: cores.fundo, borderRadius: raio.botao, borderWidth: 1, borderColor: cores.linha, paddingVertical: 12, alignItems: "center" },
  chipHoraTxt: { color: cores.tinta, fontSize: 16, fontFamily: fontes.titulo },
  ate: { color: cores.sub, fontFamily: fontes.corpoSemi },
  removerBtn: { paddingHorizontal: 10, paddingVertical: 4 },
  removerTxt: { color: cores.vermelho, fontSize: 20, fontFamily: fontes.corpoNegrito },
  link: { color: cores.tinta, fontFamily: fontes.corpoNegrito, fontSize: 13, textDecorationLine: "underline", marginTop: 4, marginBottom: 8 },
  linkSecundario: { color: cores.sub, fontFamily: fontes.corpoSemi, marginTop: 2, marginBottom: 4, textDecorationLine: "underline" },
  modalFundo: { flex: 1, backgroundColor: "rgba(22,35,63,0.45)", alignItems: "center", justifyContent: "center", padding: 24 },
  pickerCaixa: { backgroundColor: cores.card, borderRadius: raio.card, borderWidth: 1, borderColor: cores.linha, padding: 12, width: "100%", maxWidth: 340, alignItems: "center" },
});
