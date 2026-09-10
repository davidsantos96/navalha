import { useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { cores, fontes, raio } from "../../theme";
import type { Profissional } from "../../hooks/useProfissional";
import { useAtualizarServico, useCriarServico, useRemoverServico, useServicos } from "../../hooks/useServicos";
import { Carregando, MensagemErro, ScreenHeader } from "../../components/ui";
import { ServicoItem } from "../../components/ServicoItem";
import type { Navegacao } from "../../navigation/types";

export function ConfigServicosScreen({ profissional, nav }: { profissional: Profissional; nav: Navegacao }) {
  const servicos = useServicos(profissional.barbearia_id);
  const criar = useCriarServico();
  const atualizar = useAtualizarServico();
  const remover = useRemoverServico();

  const [editandoId, setEditandoId] = useState<string | null>(null);
  const [novoNome, setNovoNome] = useState("");
  const [novaDuracao, setNovaDuracao] = useState("30");
  const [novoPreco, setNovoPreco] = useState("");
  const [erro, setErro] = useState<string | null>(null);

  if (servicos.isLoading) return <Carregando />;

  function adicionar() {
    setErro(null);
    const dur = Number(novaDuracao);
    const precoCentavos = Math.round(Number(novoPreco.replace(",", ".")) * 100);
    if (!novoNome.trim() || !dur || Number.isNaN(precoCentavos)) {
      setErro("Preencha nome, duração e preço.");
      return;
    }
    criar.mutate(
      { barbeariaId: profissional.barbearia_id, nome: novoNome.trim(), duracaoMin: dur, precoCentavos },
      { onSuccess: () => { setNovoNome(""); setNovaDuracao("30"); setNovoPreco(""); } }
    );
  }

  function remove(id: string) {
    remover.mutate(id, {
      onError: () => setErro("Esse serviço já tem atendimentos no histórico — desative em vez de remover."),
    });
  }

  return (
    <View style={s.tela}>
      <ScreenHeader titulo="Serviços" onVoltar={() => nav.pop()} />
      <ScrollView contentContainerStyle={s.conteudo}>
        <Text style={s.nota}>Serviço desativado some dos presets, mas o histórico continua.</Text>
        <MensagemErro texto={erro} />
        {(servicos.data ?? []).map((sv) => (
          <ServicoItem
            key={sv.id}
            servico={sv}
            editando={editandoId === sv.id}
            onEditar={() => setEditandoId(sv.id)}
            onCancelar={() => setEditandoId(null)}
            onSalvar={(nome, duracaoMin, precoCentavos) => {
              atualizar.mutate({ id: sv.id, nome, duracaoMin, precoCentavos }, { onSuccess: () => setEditandoId(null) });
            }}
            onRemover={() => remove(sv.id)}
            interruptor={{ ativo: sv.ativo, onToggle: () => atualizar.mutate({ id: sv.id, ativo: !sv.ativo }) }}
          />
        ))}

        <View style={s.novoCartao}>
          <Text style={s.novoTitulo}>Novo serviço</Text>
          <TextInput style={s.input} placeholder="Nome (ex: Corte degradê)" placeholderTextColor={cores.fraco} value={novoNome} onChangeText={setNovoNome} />
          <View style={{ flexDirection: "row", gap: 8, marginBottom: 8 }}>
            <TextInput style={[s.input, { flex: 1, marginBottom: 0 }]} placeholder="Duração (min)" placeholderTextColor={cores.fraco} keyboardType="number-pad" value={novaDuracao} onChangeText={setNovaDuracao} />
            <TextInput style={[s.input, { flex: 1, marginBottom: 0 }]} placeholder="R$" placeholderTextColor={cores.fraco} keyboardType="decimal-pad" value={novoPreco} onChangeText={setNovoPreco} />
          </View>
          <Pressable style={s.addBotao} onPress={adicionar}>
            <Text style={s.addBotaoTexto}>+ Adicionar serviço</Text>
          </Pressable>
        </View>
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  tela: { flex: 1, backgroundColor: cores.fundo },
  conteudo: { paddingHorizontal: 20, paddingTop: 4, paddingBottom: 30 },
  nota: { fontSize: 13, color: cores.sub, marginBottom: 12, lineHeight: 18 },
  input: { width: "100%", padding: 12, borderRadius: 12, borderWidth: 1.5, borderColor: cores.linha, backgroundColor: "#FAFBFC", fontSize: 15, color: cores.tinta, marginBottom: 8 },
  novoCartao: { backgroundColor: cores.card, borderWidth: 1.5, borderColor: "#C6CCD4", borderStyle: "dashed", borderRadius: raio.card, padding: 14, marginTop: 6 },
  novoTitulo: { fontFamily: fontes.corpoNegrito, fontSize: 14, color: cores.tinta, marginBottom: 10 },
  addBotao: { width: "100%", paddingVertical: 13, borderRadius: 12, borderWidth: 1.5, borderColor: cores.linha, backgroundColor: "#fff", alignItems: "center" },
  addBotaoTexto: { fontFamily: fontes.corpoNegrito, fontSize: 14, color: cores.tinta },
});
