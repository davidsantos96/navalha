import { useState } from "react";
import { ActivityIndicator, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { cores, fontes, raio } from "../../theme";
import type { Profissional } from "../../hooks/useProfissional";
import { useBuscarClientes, useCriarCliente } from "../../hooks/useClientes";
import { iniciais } from "../../lib/texto";
import { ScreenHeader } from "../../components/ui";
import { TurboProgress } from "./TurboProgress";
import type { Navegacao, TurboState } from "../../navigation/types";

export function Turbo1ClienteScreen({
  profissional,
  nav,
  setTurbo,
}: {
  profissional: Profissional;
  nav: Navegacao;
  turbo: TurboState;
  setTurbo: (patch: Partial<TurboState>) => void;
}) {
  const [busca, setBusca] = useState("");
  const [novoAberto, setNovoAberto] = useState(false);
  const [novoNome, setNovoNome] = useState("");
  const [novoTelefone, setNovoTelefone] = useState("");
  const [erro, setErro] = useState<string | null>(null);

  const clientes = useBuscarClientes(profissional.barbearia_id, busca);
  const criarCliente = useCriarCliente();

  function selecionar(cliente: { id: string; nome: string; telefone: string }) {
    setTurbo({ clienteId: cliente.id, clienteNome: cliente.nome, clienteTelefone: cliente.telefone });
    nav.push("turbo2");
  }

  function salvarNovoCliente() {
    setErro(null);
    if (!novoNome.trim() || !novoTelefone.trim()) {
      setErro("Preencha nome e WhatsApp.");
      return;
    }
    criarCliente.mutate(
      { barbeariaId: profissional.barbearia_id, nome: novoNome.trim(), telefone: novoTelefone.trim() },
      { onSuccess: (cliente) => selecionar(cliente), onError: (e: any) => setErro(e.message ?? "Erro ao salvar.") }
    );
  }

  return (
    <KeyboardAvoidingView style={s.tela} behavior={Platform.OS === "ios" ? "padding" : "height"}>
      <ScreenHeader titulo="Quem é o cliente?" onVoltar={() => nav.pop()} />
      <TurboProgress passo={1} />
      <ScrollView contentContainerStyle={s.conteudo} keyboardShouldPersistTaps="handled">
        <TextInput style={s.input} placeholder="Nome ou telefone" placeholderTextColor={cores.fraco} value={busca} onChangeText={setBusca} />

        {clientes.isFetching && busca.trim().length > 0 && <ActivityIndicator color={cores.vermelho} style={{ marginTop: 16 }} />}

        {busca.trim().length === 0 ? (
          <Text style={s.vazio}>Digite para buscar por nome ou telefone.</Text>
        ) : (
          <>
            {(clientes.data ?? []).map((c) => (
              <Pressable key={c.id} style={s.linha} onPress={() => selecionar(c)}>
                <View style={s.avatar}>
                  <Text style={s.avatarTexto}>{iniciais(c.nome)}</Text>
                </View>
                <View style={{ flex: 1, minWidth: 0 }}>
                  <Text style={s.nome}>{c.nome}</Text>
                  <Text style={s.telefone}>{c.telefone}</Text>
                </View>
              </Pressable>
            ))}
            {clientes.isFetched && (clientes.data ?? []).length === 0 && <Text style={s.vazio}>Nenhum cliente encontrado — cadastre abaixo.</Text>}
          </>
        )}

        {novoAberto ? (
          <View style={s.novoCartao}>
            <Text style={s.novoTitulo}>Novo cliente em 5 segundos</Text>
            <TextInput style={s.inputInterno} placeholder="Nome" placeholderTextColor={cores.fraco} value={novoNome} onChangeText={setNovoNome} />
            <TextInput style={s.inputInterno} placeholder="WhatsApp" placeholderTextColor={cores.fraco} keyboardType="phone-pad" value={novoTelefone} onChangeText={setNovoTelefone} />
            {erro && <Text style={s.erro}>{erro}</Text>}
            <Pressable style={s.salvarBotao} onPress={salvarNovoCliente} disabled={criarCliente.isPending}>
              {criarCliente.isPending ? <ActivityIndicator color="#fff" /> : <Text style={s.salvarTexto}>Salvar e continuar</Text>}
            </Pressable>
          </View>
        ) : (
          <Pressable onPress={() => setNovoAberto(true)} style={{ paddingVertical: 10 }}>
            <Text style={s.link}>+ Cadastrar novo cliente</Text>
          </Pressable>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const s = StyleSheet.create({
  tela: { flex: 1, backgroundColor: cores.fundo },
  conteudo: { paddingHorizontal: 20, paddingTop: 4, paddingBottom: 30 },
  input: { width: "100%", padding: 15, borderRadius: 14, borderWidth: 1.5, borderColor: cores.linha, backgroundColor: cores.card, fontSize: 16, color: cores.tinta },
  vazio: { fontSize: 14, color: cores.fraco, paddingVertical: 14 },
  linha: { flexDirection: "row", alignItems: "center", gap: 12, backgroundColor: cores.card, borderWidth: 1, borderColor: cores.linha, borderRadius: raio.card, padding: 12, marginTop: 10 },
  avatar: { width: 42, height: 42, borderRadius: 12, backgroundColor: cores.tinta, alignItems: "center", justifyContent: "center" },
  avatarTexto: { color: "#fff", fontFamily: fontes.tituloSemi, fontSize: 16 },
  nome: { fontFamily: fontes.corpoNegrito, fontSize: 15, color: cores.tinta },
  telefone: { fontSize: 12.5, color: cores.sub },
  novoCartao: { backgroundColor: cores.card, borderWidth: 1.5, borderColor: "#C6CCD4", borderStyle: "dashed", borderRadius: raio.card, padding: 14, marginTop: 16 },
  novoTitulo: { fontFamily: fontes.corpoNegrito, fontSize: 14, color: cores.tinta, marginBottom: 10 },
  inputInterno: { width: "100%", padding: 12, borderRadius: 12, borderWidth: 1.5, borderColor: cores.linha, backgroundColor: "#FAFBFC", fontSize: 15, color: cores.tinta, marginBottom: 8 },
  salvarBotao: { width: "100%", paddingVertical: 14, borderRadius: 12, backgroundColor: cores.vermelho, alignItems: "center" },
  salvarTexto: { color: "#fff", fontFamily: fontes.corpoNegrito, fontSize: 15 },
  link: { color: cores.tinta, fontFamily: fontes.corpoNegrito, fontSize: 14, textDecorationLine: "underline" },
  erro: { color: cores.vermelho, marginBottom: 8, fontFamily: fontes.corpoMedio },
});
