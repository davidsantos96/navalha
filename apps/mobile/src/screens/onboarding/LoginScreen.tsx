import { useState } from "react";
import { View, Text, TextInput, Pressable, StyleSheet, ActivityIndicator } from "react-native";
import { supabase } from "../../lib/supabase";
import { cores, raio } from "../../theme";

/**
 * Login sem senha por e-mail (spec 6.5). Em vez de link mágico clicável
 * (exigiria deep link/scheme configurado), o barbeiro digita o código de
 * 6 dígitos recebido por e-mail — mesmo fluxo do Supabase, sem infra extra.
 *
 * Requer customizar o template "Magic Link" no dashboard do Supabase para
 * incluir {{ .Token }} (por padrão o e-mail só traz um link, sem código).
 */
export function LoginScreen() {
  const [etapa, setEtapa] = useState<"email" | "codigo">("email");
  const [email, setEmail] = useState("");
  const [codigo, setCodigo] = useState("");
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  async function enviarCodigo() {
    setErro(null);
    if (!email.includes("@")) {
      setErro("Digite um e-mail válido.");
      return;
    }
    setCarregando(true);
    const { error } = await supabase.auth.signInWithOtp({ email: email.trim() });
    setCarregando(false);
    if (error) {
      setErro(error.message);
      return;
    }
    setEtapa("codigo");
  }

  async function confirmarCodigo() {
    setErro(null);
    if (!codigo.trim()) {
      setErro("Digite o código recebido.");
      return;
    }
    setCarregando(true);
    const { error } = await supabase.auth.verifyOtp({
      email: email.trim(),
      token: codigo.trim(),
      type: "email",
    });
    setCarregando(false);
    if (error) setErro(error.message);
    // sucesso: a sessão muda e o App.tsx troca de tela sozinho
  }

  return (
    <View style={s.tela}>
      <Text style={s.marca}>NAVALHA</Text>
      <Text style={s.titulo}>Entrar</Text>

      {etapa === "email" ? (
        <>
          <Text style={s.label}>Seu e-mail</Text>
          <TextInput
            style={s.input}
            placeholder="voce@exemplo.com"
            placeholderTextColor={cores.fraco}
            autoCapitalize="none"
            autoCorrect={false}
            keyboardType="email-address"
            value={email}
            onChangeText={setEmail}
          />
          {erro && <Text style={s.erro}>{erro}</Text>}
          <Pressable style={s.botao} onPress={enviarCodigo} disabled={carregando}>
            {carregando ? <ActivityIndicator color="#fff" /> : <Text style={s.botaoTxt}>Enviar código</Text>}
          </Pressable>
        </>
      ) : (
        <>
          <Text style={s.label}>Código enviado para {email}</Text>
          <TextInput
            style={s.input}
            placeholder="123456"
            placeholderTextColor={cores.fraco}
            keyboardType="number-pad"
            value={codigo}
            onChangeText={setCodigo}
          />
          {erro && <Text style={s.erro}>{erro}</Text>}
          <Pressable style={s.botao} onPress={confirmarCodigo} disabled={carregando}>
            {carregando ? <ActivityIndicator color="#fff" /> : <Text style={s.botaoTxt}>Confirmar</Text>}
          </Pressable>
          <Pressable onPress={() => setEtapa("email")} disabled={carregando}>
            <Text style={s.link}>Trocar e-mail</Text>
          </Pressable>
        </>
      )}
    </View>
  );
}

const s = StyleSheet.create({
  tela: { flex: 1, backgroundColor: cores.fundo, padding: 24, justifyContent: "center" },
  marca: { color: cores.vermelho, fontWeight: "800", fontSize: 14, letterSpacing: 0.5 },
  titulo: { color: cores.tinta, fontSize: 28, fontWeight: "800", marginTop: 4, marginBottom: 24 },
  label: { color: cores.sub, marginBottom: 8 },
  input: {
    backgroundColor: cores.card,
    borderRadius: raio.botao,
    borderWidth: 1,
    borderColor: cores.linha,
    padding: 14,
    fontSize: 16,
    color: cores.tinta,
    marginBottom: 12,
  },
  botao: { backgroundColor: cores.vermelho, borderRadius: raio.botao, padding: 16, alignItems: "center", marginTop: 4 },
  botaoTxt: { color: "#fff", fontWeight: "700", fontSize: 16 },
  erro: { color: cores.vermelho, marginBottom: 8 },
  link: { color: cores.sub, textAlign: "center", marginTop: 16, textDecorationLine: "underline" },
});
