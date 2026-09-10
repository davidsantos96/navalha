import { useState } from "react";
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { supabase } from "../../lib/supabase";
import { cores, fontes, raio } from "../../theme";
import {
  expedientePadrao,
  paraLinhas,
  validarExpediente,
  type Bloco,
  type DiaExpediente,
} from "../../lib/expediente";
import { BotaoPrimario, MensagemErro, ScreenHeader } from "../../components/ui";
import { ExpedienteEditor } from "../../components/ExpedienteEditor";

interface ServicoForm {
  nome: string;
  duracaoMin: string;
  precoReais: string;
}

const TITULOS = ["Quem corta aqui?", "Quando você trabalha?", "O que você oferece?"];

/**
 * Onboarding do barbeiro (F1): nome + barbearia → expediente → serviços.
 * Ao concluir, cria barbearia+profissional (via RPC, ver migração 0002)
 * e depois expedientes/serviços com o profissional já existente.
 */
export function OnboardingScreen({ onConcluido }: { onConcluido: () => void }) {
  const [passo, setPasso] = useState(0);
  const [nomeProfissional, setNomeProfissional] = useState("");
  const [nomeBarbearia, setNomeBarbearia] = useState("");
  const [dias, setDias] = useState<DiaExpediente[]>(expedientePadrao());
  const [servicos, setServicos] = useState<ServicoForm[]>([{ nome: "Corte", duracaoMin: "30", precoReais: "40" }]);
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  function alternarDia(diaSemana: number, aberto: boolean) {
    setDias((atual) =>
      atual.map((d) =>
        d.diaSemana === diaSemana
          ? { ...d, aberto, blocos: aberto && d.blocos.length === 0 ? [{ inicioMin: 9 * 60, fimMin: 18 * 60 }] : d.blocos }
          : d
      )
    );
  }

  function atualizarBloco(diaSemana: number, indice: number, campo: keyof Bloco, valor: number) {
    setDias((atual) =>
      atual.map((d) => (d.diaSemana === diaSemana ? { ...d, blocos: d.blocos.map((b, i) => (i === indice ? { ...b, [campo]: valor } : b)) } : d))
    );
  }

  function adicionarBloco(diaSemana: number) {
    setDias((atual) => atual.map((d) => (d.diaSemana === diaSemana ? { ...d, blocos: [...d.blocos, { inicioMin: 9 * 60, fimMin: 18 * 60 }] } : d)));
  }

  function removerBloco(diaSemana: number, indice: number) {
    setDias((atual) => atual.map((d) => (d.diaSemana === diaSemana ? { ...d, blocos: d.blocos.filter((_, i) => i !== indice) } : d)));
  }

  function copiarParaDiasUteis(diaSemanaOrigem: number) {
    setDias((atual) => {
      const origem = atual.find((d) => d.diaSemana === diaSemanaOrigem);
      if (!origem) return atual;
      return atual.map((d) => (d.diaSemana >= 1 && d.diaSemana <= 5 ? { ...d, aberto: true, blocos: origem.blocos.map((b) => ({ ...b })) } : d));
    });
  }

  function atualizarServico(indice: number, campo: keyof ServicoForm, valor: string) {
    setServicos((atual) => atual.map((sv, i) => (i === indice ? { ...sv, [campo]: valor } : sv)));
  }

  function adicionarServico() {
    setServicos((atual) => [...atual, { nome: "", duracaoMin: "30", precoReais: "" }]);
  }

  function removerServico(indice: number) {
    setServicos((atual) => atual.filter((_, i) => i !== indice));
  }

  function validarPasso0(): string | null {
    if (!nomeProfissional.trim()) return "Digite seu nome.";
    if (!nomeBarbearia.trim()) return "Digite o nome da barbearia.";
    return null;
  }

  function validarPasso2(): { erro: string | null; validos: ServicoForm[] } {
    const validos = servicos.filter((sv) => sv.nome.trim());
    if (validos.length === 0) return { erro: "Cadastre pelo menos um serviço.", validos };
    for (const sv of validos) {
      const dur = Number(sv.duracaoMin);
      if (!dur || dur < 5) return { erro: `Duração inválida em "${sv.nome}" (mínimo 5 min).`, validos };
      const preco = Number(sv.precoReais.replace(",", "."));
      if (Number.isNaN(preco) || preco < 0) return { erro: `Preço inválido em "${sv.nome}".`, validos };
    }
    return { erro: null, validos };
  }

  function avancar() {
    setErro(null);
    if (passo === 0) {
      const e = validarPasso0();
      if (e) return setErro(e);
      setPasso(1);
    } else if (passo === 1) {
      const e = validarExpediente(dias);
      if (e) return setErro(e);
      setPasso(2);
    }
  }

  async function concluir() {
    setErro(null);
    const e0 = validarPasso0();
    if (e0) { setErro(e0); setPasso(0); return; }
    const e1 = validarExpediente(dias);
    if (e1) { setErro(e1); setPasso(1); return; }
    const { erro: e2, validos: servicosValidos } = validarPasso2();
    if (e2) { setErro(e2); return; }

    setSalvando(true);
    try {
      const { data, error: erroRpc } = await supabase.rpc("criar_barbearia_e_profissional", {
        p_nome_barbearia: nomeBarbearia.trim(),
        p_nome_profissional: nomeProfissional.trim(),
      });
      if (erroRpc) throw erroRpc;
      const { profissional_id: profissionalId, barbearia_id: barbeariaId } = data[0];

      const linhasExpediente = paraLinhas(dias).map((l) => ({
        profissional_id: profissionalId,
        dia_semana: l.diaSemana,
        inicio_min: l.inicioMin,
        fim_min: l.fimMin,
      }));
      const { error: erroExpediente } = await supabase.from("expedientes").insert(linhasExpediente);
      if (erroExpediente) throw erroExpediente;

      const linhasServicos = servicosValidos.map((sv) => ({
        barbearia_id: barbeariaId,
        nome: sv.nome.trim(),
        duracao_min: Math.round(Number(sv.duracaoMin)),
        preco_centavos: Math.round(Number(sv.precoReais.replace(",", ".")) * 100),
      }));
      const { error: erroServicos } = await supabase.from("servicos").insert(linhasServicos);
      if (erroServicos) throw erroServicos;

      onConcluido();
    } catch (err: any) {
      setErro(err.message ?? "Erro ao salvar. Tente novamente.");
    } finally {
      setSalvando(false);
    }
  }

  return (
    <KeyboardAvoidingView style={s.tela} behavior={Platform.OS === "ios" ? "padding" : "height"}>
      <ScreenHeader titulo={TITULOS[passo]} onVoltar={passo > 0 ? () => setPasso((p) => p - 1) : undefined} />
      <Text style={s.passoTxt}>PASSO {passo + 1} DE 3</Text>
      <View style={s.dots}>
        <View style={[s.dot, { backgroundColor: cores.vermelho }]} />
        <View style={[s.dot, { backgroundColor: passo >= 1 ? cores.vermelho : "#DDE1E6" }]} />
        <View style={[s.dot, { backgroundColor: passo >= 2 ? cores.vermelho : "#DDE1E6" }]} />
      </View>

      <ScrollView style={{ flex: 1 }} contentContainerStyle={s.conteudo} keyboardShouldPersistTaps="handled">
        {passo === 0 && (
          <View>
            <Text style={s.rotulo}>SEU NOME</Text>
            <TextInput style={s.input} placeholder="Como os clientes te chamam" placeholderTextColor={cores.fraco} value={nomeProfissional} onChangeText={setNomeProfissional} />
            <Text style={[s.rotulo, { marginTop: 6 }]}>NOME DA BARBEARIA</Text>
            <TextInput style={s.input} placeholder="Ex: Barbearia do Léo" placeholderTextColor={cores.fraco} value={nomeBarbearia} onChangeText={setNomeBarbearia} />
            <Text style={s.nota}>O nome da barbearia aparece nas mensagens de WhatsApp que o app monta para você.</Text>
          </View>
        )}

        {passo === 1 && (
          <View>
            <Text style={s.nota}>Dias úteis já vêm agrupados no preset — personalize só se algum dia for diferente.</Text>
            <View style={{ height: 6 }} />
            <ExpedienteEditor
              dias={dias}
              onAlternarDia={alternarDia}
              onAtualizarBloco={atualizarBloco}
              onAdicionarBloco={adicionarBloco}
              onRemoverBloco={removerBloco}
              onCopiarParaDiasUteis={copiarParaDiasUteis}
            />
          </View>
        )}

        {passo === 2 && (
          <View>
            <Text style={s.nota}>Esses são os presets do agendamento em 3 toques. Ajuste os valores como quiser.</Text>
            <View style={{ height: 6 }} />
            {servicos.map((sv, i) => (
              <View key={i} style={s.cardServico}>
                <View style={s.linhaServicoTopo}>
                  <Text style={s.servicoIndice}>Serviço {i + 1}</Text>
                  {servicos.length > 1 && (
                    <Text style={s.removerTxt} onPress={() => removerServico(i)}>
                      ×
                    </Text>
                  )}
                </View>
                <TextInput style={s.input} placeholder="Ex: Corte" placeholderTextColor={cores.fraco} value={sv.nome} onChangeText={(v) => atualizarServico(i, "nome", v)} />
                <View style={{ flexDirection: "row", gap: 8 }}>
                  <TextInput
                    style={[s.input, { flex: 1 }]}
                    placeholder="Duração (min)"
                    placeholderTextColor={cores.fraco}
                    keyboardType="number-pad"
                    value={sv.duracaoMin}
                    onChangeText={(v) => atualizarServico(i, "duracaoMin", v)}
                  />
                  <TextInput
                    style={[s.input, { flex: 1 }]}
                    placeholder="Preço (R$)"
                    placeholderTextColor={cores.fraco}
                    keyboardType="decimal-pad"
                    value={sv.precoReais}
                    onChangeText={(v) => atualizarServico(i, "precoReais", v)}
                  />
                </View>
              </View>
            ))}
            <Text style={s.link} onPress={adicionarServico}>
              + adicionar serviço
            </Text>
          </View>
        )}

        <MensagemErro texto={erro} />
      </ScrollView>

      <View style={s.rodape}>
        <BotaoPrimario texto={passo === 2 ? "Começar a usar o Navalha" : "Continuar"} onPress={passo === 2 ? concluir : avancar} carregando={salvando} />
      </View>
    </KeyboardAvoidingView>
  );
}

const s = StyleSheet.create({
  tela: { flex: 1, backgroundColor: cores.fundo },
  passoTxt: { fontSize: 11.5, fontFamily: fontes.corpoNegrito, color: cores.vermelho, letterSpacing: 1, marginLeft: 20, marginTop: -4 },
  dots: { flexDirection: "row", gap: 5, paddingHorizontal: 20, paddingTop: 10, paddingBottom: 12 },
  dot: { flex: 1, height: 4, borderRadius: raio.pilula },
  conteudo: { paddingHorizontal: 20, paddingTop: 4, paddingBottom: 20 },
  rotulo: { fontSize: 12, fontFamily: fontes.corpoNegrito, color: cores.sub, letterSpacing: 0.6, marginBottom: 8, marginTop: 12 },
  input: { width: "100%", padding: 14, borderRadius: 14, borderWidth: 1.5, borderColor: cores.linha, backgroundColor: cores.card, fontSize: 16, color: cores.tinta, marginBottom: 10 },
  nota: { fontSize: 12.5, color: cores.fraco, lineHeight: 18 },
  cardServico: { backgroundColor: cores.card, borderWidth: 1, borderColor: cores.linha, borderRadius: raio.card, padding: 14, marginBottom: 12 },
  linhaServicoTopo: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 8 },
  servicoIndice: { fontFamily: fontes.corpoNegrito, fontSize: 14, color: cores.tinta },
  removerTxt: { color: cores.vermelho, fontSize: 20, fontFamily: fontes.corpoNegrito, paddingHorizontal: 8 },
  link: { color: cores.tinta, fontFamily: fontes.corpoNegrito, fontSize: 14, textDecorationLine: "underline", marginTop: 2, marginBottom: 8 },
  rodape: { padding: 20, paddingTop: 10 },
});
