import { useState } from "react";
import { Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { cores, fontes, raio } from "../theme";
import type { Servico } from "../hooks/useServicos";
import { formatarCentavos } from "../lib/datas";
import { Interruptor } from "./ui";

export function ServicoItem({
  servico,
  editando,
  onEditar,
  onCancelar,
  onSalvar,
  onRemover,
  interruptor,
}: {
  servico: Servico;
  editando: boolean;
  onEditar: () => void;
  onCancelar: () => void;
  onSalvar: (nome: string, duracaoMin: number, precoCentavos: number) => void;
  onRemover: () => void;
  interruptor?: { ativo: boolean; onToggle: () => void };
}) {
  const [nome, setNome] = useState(servico.nome);
  const [duracao, setDuracao] = useState(String(servico.duracaoMin));
  const [preco, setPreco] = useState((servico.precoCentavos / 100).toFixed(2).replace(".", ","));

  if (!editando) {
    return (
      <View style={[s.linha, interruptor && !interruptor.ativo && { opacity: 0.45 }]}>
        <Pressable style={{ flex: 1 }} onPress={onEditar}>
          <Text style={s.nome}>
            {servico.nome} <Text style={s.lapis}>✎</Text>
          </Text>
          <Text style={s.meta}>
            {servico.duracaoMin} min · {formatarCentavos(servico.precoCentavos)}
          </Text>
        </Pressable>
        {interruptor ? <Interruptor ativo={interruptor.ativo} onToggle={interruptor.onToggle} /> : null}
      </View>
    );
  }

  function salvar() {
    const dur = Number(duracao);
    const precoCentavos = Math.round(Number(preco.replace(",", ".")) * 100);
    if (!nome.trim() || !dur || Number.isNaN(precoCentavos)) return;
    onSalvar(nome.trim(), dur, precoCentavos);
  }

  return (
    <View style={s.editorCartao}>
      <TextInput value={nome} onChangeText={setNome} placeholder="Nome do serviço" placeholderTextColor={cores.fraco} style={s.input} />
      <View style={s.linhaEditor}>
        <TextInput value={duracao} onChangeText={setDuracao} keyboardType="number-pad" placeholder="Duração (min)" placeholderTextColor={cores.fraco} style={[s.input, { flex: 1, marginBottom: 0 }]} />
        <TextInput value={preco} onChangeText={setPreco} keyboardType="decimal-pad" placeholder="R$" placeholderTextColor={cores.fraco} style={[s.input, { flex: 1, marginBottom: 0 }]} />
      </View>
      <View style={{ flexDirection: "row", gap: 8, marginTop: 10 }}>
        <Pressable style={s.salvar} onPress={salvar}>
          <Text style={s.salvarTexto}>Salvar alterações</Text>
        </Pressable>
        <Pressable style={s.remover} onPress={onRemover} accessibilityLabel="Remover serviço">
          <Text style={s.removerTexto}>×</Text>
        </Pressable>
      </View>
      <Pressable onPress={onCancelar} style={{ marginTop: 8 }}>
        <Text style={s.cancelar}>cancelar</Text>
      </Pressable>
    </View>
  );
}

const s = StyleSheet.create({
  linha: { flexDirection: "row", alignItems: "center", gap: 10, backgroundColor: cores.card, borderWidth: 1.5, borderColor: cores.linha, borderRadius: raio.card, padding: 14, marginBottom: 9 },
  nome: { fontFamily: fontes.corpoNegrito, fontSize: 15, color: cores.tinta },
  lapis: { color: cores.fraco, fontSize: 13, fontFamily: fontes.corpo },
  meta: { fontSize: 12.5, color: cores.sub, fontFamily: fontes.corpoSemi, marginTop: 2 },
  editorCartao: { backgroundColor: cores.card, borderWidth: 1.5, borderColor: cores.tinta, borderRadius: raio.card, padding: 14, marginBottom: 9 },
  input: { width: "100%", padding: 12, borderRadius: 12, borderWidth: 1.5, borderColor: cores.linha, backgroundColor: "#FAFBFC", fontSize: 15, color: cores.tinta, marginBottom: 8 },
  linhaEditor: { flexDirection: "row", gap: 8 },
  salvar: { flex: 1, paddingVertical: 13, borderRadius: 12, backgroundColor: cores.tinta, alignItems: "center" },
  salvarTexto: { color: "#fff", fontFamily: fontes.corpoNegrito, fontSize: 14 },
  remover: { width: 44, borderRadius: 12, borderWidth: 1, borderColor: "#F0C7C4", backgroundColor: cores.vermelhoSuave, alignItems: "center", justifyContent: "center" },
  removerTexto: { color: cores.vermelho, fontSize: 16 },
  cancelar: { color: cores.sub, fontSize: 12.5, fontFamily: fontes.corpoSemi, textAlign: "center" },
});
