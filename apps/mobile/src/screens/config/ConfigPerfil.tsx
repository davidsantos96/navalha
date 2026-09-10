import { useState } from "react";
import { ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { cores, fontes, raio } from "../../theme";
import type { Profissional } from "../../hooks/useProfissional";
import { useAuth } from "../../hooks/useAuth";
import { useAtualizarProfissional } from "../../hooks/useAtualizarProfissional";
import { useSignOut } from "../../hooks/useSignOut";
import { useExcluirConta } from "../../hooks/useExcluirConta";
import { BotaoPerigo, BotaoSecundario, MensagemErro, ScreenHeader } from "../../components/ui";
import type { Navegacao } from "../../navigation/types";

export function ConfigPerfilScreen({ profissional, nav }: { profissional: Profissional; nav: Navegacao }) {
  const { session } = useAuth();
  const [nome, setNome] = useState(profissional.nome);
  const [confirmandoExclusao, setConfirmandoExclusao] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const atualizar = useAtualizarProfissional();
  const sair = useSignOut();
  const excluirConta = useExcluirConta();

  function salvarNome() {
    if (!nome.trim() || nome.trim() === profissional.nome) return;
    atualizar.mutate({ id: profissional.id, nome: nome.trim() });
  }

  function confirmarExclusao() {
    excluirConta.mutate(undefined, { onError: (e: any) => setErro(e.message ?? "Erro ao excluir conta.") });
  }

  return (
    <View style={s.tela}>
      <ScreenHeader titulo="Perfil e conta" onVoltar={() => nav.pop()} />
      <ScrollView contentContainerStyle={s.conteudo}>
        <Text style={s.rotulo}>SEU NOME</Text>
        <TextInput style={s.input} value={nome} onChangeText={setNome} onBlur={salvarNome} />
        <Text style={[s.rotulo, { marginTop: 18 }]}>E-MAIL DE LOGIN</Text>
        <View style={s.emailCartao}>
          <Text style={s.emailTexto}>{session?.user.email ?? "—"}</Text>
        </View>
        <Text style={s.nota}>Login sem senha: você recebe um código por e-mail a cada acesso.</Text>

        <BotaoSecundario texto="Sair da conta" onPress={() => sair.mutate()} style={{ marginTop: 22 }} />
        <BotaoPerigo texto="Excluir conta e dados" onPress={() => setConfirmandoExclusao(true)} style={{ marginTop: 10 }} />

        <MensagemErro texto={erro} />

        {confirmandoExclusao && (
          <View style={s.confirmCartao}>
            <Text style={s.confirmTexto}>Isso apaga sua conta, seus clientes e todo o histórico. Não dá para desfazer.</Text>
            <View style={{ marginTop: 10 }}>
              <BotaoPerigo texto={excluirConta.isPending ? "Excluindo…" : "Excluir definitivamente"} onPress={confirmarExclusao} style={{ backgroundColor: cores.vermelho }} />
            </View>
            <View style={{ marginTop: 8 }}>
              <BotaoSecundario texto="Manter conta" onPress={() => setConfirmandoExclusao(false)} />
            </View>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  tela: { flex: 1, backgroundColor: cores.fundo },
  conteudo: { paddingHorizontal: 20, paddingTop: 4, paddingBottom: 30 },
  rotulo: { fontSize: 12, fontFamily: fontes.corpoNegrito, color: cores.sub, letterSpacing: 0.6, marginBottom: 8 },
  input: { width: "100%", padding: 14, borderRadius: 14, borderWidth: 1.5, borderColor: cores.linha, backgroundColor: cores.card, fontSize: 16, color: cores.tinta },
  emailCartao: { backgroundColor: cores.card, borderWidth: 1, borderColor: cores.linha, borderRadius: 14, padding: 14 },
  emailTexto: { fontSize: 15, color: cores.tinta, fontFamily: fontes.corpoSemi },
  nota: { fontSize: 12.5, color: cores.fraco, marginTop: 10, lineHeight: 18 },
  confirmCartao: { backgroundColor: cores.vermelhoSuave, borderWidth: 1, borderColor: "#F0C7C4", borderRadius: raio.card, padding: 14, marginTop: 12 },
  confirmTexto: { fontSize: 13.5, color: cores.vermelho, fontFamily: fontes.corpoSemi, lineHeight: 19 },
});
