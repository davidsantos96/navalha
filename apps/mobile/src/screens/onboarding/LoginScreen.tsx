import { useState } from "react";
import { KeyboardAvoidingView, Platform, Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { supabase } from "../../lib/supabase";
import { cores, fontes } from "../../theme";
import { Pole } from "../../components/Pole";
import { BotaoPrimario, MensagemErro } from "../../components/ui";

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
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={{ flex: 1 }}>
        <View style={s.corpo}>
          <Pole />
          <Text style={s.marca}>NAVALHA</Text>
          <Text style={s.slogan}>A agenda que trabalha pelo barbeiro.</Text>
          <Text style={s.sub}>Sem buraco no dia, sem cliente sumido, sem sair do WhatsApp.</Text>

          {etapa === "email" ? (
            <View style={{ marginTop: 32 }}>
              <Text style={s.rotulo}>ENTRAR OU CRIAR CONTA</Text>
              <TextInput
                style={s.input}
                placeholder="Seu e-mail"
                placeholderTextColor="#7E8DB0"
                autoCapitalize="none"
                autoCorrect={false}
                keyboardType="email-address"
                value={email}
                onChangeText={setEmail}
              />
              <MensagemErro texto={erro} />
              <BotaoPrimario texto="Receber código de acesso" onPress={enviarCodigo} carregando={carregando} style={{ marginTop: 10 }} />
              <Text style={s.nota}>Sem senha para decorar — você recebe um código no e-mail e pronto.</Text>
            </View>
          ) : (
            <View style={{ marginTop: 32 }}>
              <Text style={s.codigoPara}>
                Código enviado para <Text style={{ color: "#fff" }}>{email}</Text>
              </Text>
              <TextInput
                style={s.inputCodigo}
                placeholder="········"
                placeholderTextColor="#7E8DB0"
                keyboardType="number-pad"
                maxLength={10}
                value={codigo}
                onChangeText={(v) => setCodigo(v.replace(/\D/g, "").slice(0, 10))}
              />
              <MensagemErro texto={erro} />
              <BotaoPrimario texto="Entrar" onPress={confirmarCodigo} carregando={carregando} style={{ marginTop: 10 }} />
              <Pressable onPress={() => setEtapa("email")} disabled={carregando} style={{ marginTop: 14 }}>
                <Text style={s.link}>Trocar e-mail</Text>
              </Pressable>
            </View>
          )}
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

const s = StyleSheet.create({
  tela: { flex: 1, backgroundColor: cores.tinta },
  corpo: { flex: 1, justifyContent: "center", paddingHorizontal: 26 },
  marca: { fontFamily: fontes.titulo, fontSize: 46, color: "#fff", marginTop: 20, letterSpacing: 0.4 },
  slogan: { fontFamily: fontes.tituloSemi, fontSize: 19, color: "#E8B4B0", marginTop: 10, lineHeight: 24 },
  sub: { fontSize: 14, color: "#9FACC6", marginTop: 6, lineHeight: 20 },
  rotulo: { fontSize: 11.5, fontFamily: fontes.corpoNegrito, color: "#9FACC6", letterSpacing: 1 },
  input: {
    marginTop: 10,
    width: "100%",
    padding: 16,
    borderRadius: 15,
    borderWidth: 1.5,
    borderColor: "#3D507C",
    backgroundColor: "#1D2C4F",
    color: "#fff",
    fontSize: 16,
  },
  inputCodigo: {
    marginTop: 12,
    width: "100%",
    padding: 12,
    borderRadius: 15,
    borderWidth: 1.5,
    borderColor: "#3D507C",
    backgroundColor: "#1D2C4F",
    color: "#fff",
    fontFamily: fontes.titulo,
    fontSize: 26,
    letterSpacing: 6,
    textAlign: "center",
  },
  nota: { fontSize: 12.5, color: "#7E8DB0", marginTop: 12, lineHeight: 18 },
  codigoPara: { fontSize: 14, color: "#C6CFE2", fontFamily: fontes.corpoSemi },
  link: { color: "#9FACC6", fontFamily: fontes.corpoNegrito, fontSize: 13, textDecorationLine: "underline", textAlign: "center" },
});
