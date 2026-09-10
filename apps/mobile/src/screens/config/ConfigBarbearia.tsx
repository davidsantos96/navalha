import { useEffect, useState } from "react";
import { ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { cores, fontes, raio } from "../../theme";
import type { Profissional } from "../../hooks/useProfissional";
import { useAtualizarBarbearia, useBarbearia } from "../../hooks/useBarbearia";
import { Carregando, ScreenHeader } from "../../components/ui";
import type { Navegacao } from "../../navigation/types";

export function ConfigBarbeariaScreen({ profissional, nav }: { profissional: Profissional; nav: Navegacao }) {
  const barbearia = useBarbearia(profissional.barbearia_id);
  const atualizar = useAtualizarBarbearia();
  const [nome, setNome] = useState("");
  const [endereco, setEndereco] = useState("");
  const [telefone, setTelefone] = useState("");
  const [carregado, setCarregado] = useState(false);

  useEffect(() => {
    if (barbearia.data && !carregado) {
      setNome(barbearia.data.nome);
      setEndereco(barbearia.data.endereco ?? "");
      setTelefone(barbearia.data.telefone ?? "");
      setCarregado(true);
    }
  }, [barbearia.data, carregado]);

  function salvar() {
    if (!nome.trim()) return;
    atualizar.mutate({ id: profissional.barbearia_id, nome: nome.trim(), endereco: endereco.trim() || null, telefone: telefone.trim() || null });
  }

  if (barbearia.isLoading || !carregado) return <Carregando />;

  return (
    <View style={s.tela}>
      <ScreenHeader titulo="Barbearia" onVoltar={() => nav.pop()} />
      <ScrollView contentContainerStyle={s.conteudo}>
        <Text style={s.rotulo}>NOME</Text>
        <TextInput style={s.input} value={nome} onChangeText={setNome} onBlur={salvar} />
        <Text style={[s.rotulo, { marginTop: 18 }]}>ENDEREÇO (OPCIONAL)</Text>
        <TextInput style={s.input} placeholder="Rua, número e bairro" placeholderTextColor={cores.fraco} value={endereco} onChangeText={setEndereco} onBlur={salvar} />
        <Text style={[s.rotulo, { marginTop: 18 }]}>TELEFONE (OPCIONAL)</Text>
        <TextInput style={s.input} placeholder="(11) 90000-0000" placeholderTextColor={cores.fraco} keyboardType="phone-pad" value={telefone} onChangeText={setTelefone} onBlur={salvar} />
        <View style={s.nota}>
          <Text style={s.notaTexto}>Endereço e telefone entram automaticamente nas mensagens de WhatsApp que o app monta.</Text>
        </View>
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  tela: { flex: 1, backgroundColor: cores.fundo },
  conteudo: { paddingHorizontal: 20, paddingTop: 4, paddingBottom: 30 },
  rotulo: { fontSize: 12, fontFamily: fontes.corpoNegrito, color: cores.sub, letterSpacing: 0.6, marginBottom: 8 },
  input: { width: "100%", padding: 14, borderRadius: 14, borderWidth: 1.5, borderColor: cores.linha, backgroundColor: cores.card, fontSize: 16, color: cores.tinta },
  nota: { backgroundColor: cores.verdeSuave, borderWidth: 1, borderColor: "#BFE0CE", borderRadius: raio.card, padding: 14, marginTop: 16 },
  notaTexto: { fontSize: 13, color: cores.verde, fontFamily: fontes.corpoSemi, lineHeight: 19 },
});
