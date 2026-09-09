import { useState } from "react";
import {
  View,
  Text,
  TextInput,
  Pressable,
  ScrollView,
  Switch,
  StyleSheet,
  ActivityIndicator,
  Platform,
} from "react-native";
import DateTimePicker from "@react-native-community/datetimepicker";
import { supabase } from "../../lib/supabase";
import { cores, raio } from "../../theme";

const NOMES_DIAS = ["Domingo", "Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado"];

interface Bloco {
  inicioMin: number;
  fimMin: number;
}

interface DiaExpediente {
  diaSemana: number;
  nome: string;
  aberto: boolean;
  blocos: Bloco[];
}

interface ServicoForm {
  nome: string;
  duracaoMin: string;
  precoReais: string;
}

function formatarMin(min: number): string {
  const h = Math.floor(min / 60)
    .toString()
    .padStart(2, "0");
  const m = (min % 60).toString().padStart(2, "0");
  return `${h}:${m}`;
}

function minParaData(min: number): Date {
  const d = new Date();
  d.setHours(Math.floor(min / 60), min % 60, 0, 0);
  return d;
}

function dataParaMin(d: Date): number {
  return d.getHours() * 60 + d.getMinutes();
}

// Preset da spec §2.2 (ex: 9–12h / 13–19h) — reduz fricção, tudo editável.
function expedientePadrao(): DiaExpediente[] {
  return NOMES_DIAS.map((nome, diaSemana) => {
    if (diaSemana === 0) return { diaSemana, nome, aberto: false, blocos: [] };
    if (diaSemana === 6) {
      return { diaSemana, nome, aberto: true, blocos: [{ inicioMin: 9 * 60, fimMin: 13 * 60 }] };
    }
    return {
      diaSemana,
      nome,
      aberto: true,
      blocos: [
        { inicioMin: 9 * 60, fimMin: 12 * 60 },
        { inicioMin: 13 * 60, fimMin: 19 * 60 },
      ],
    };
  });
}

interface PickerAlvo {
  diaSemana: number;
  indice: number;
  campo: "inicioMin" | "fimMin";
}

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
  const [picker, setPicker] = useState<PickerAlvo | null>(null);
  const [servicos, setServicos] = useState<ServicoForm[]>([
    { nome: "Corte", duracaoMin: "30", precoReais: "40" },
  ]);
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
      atual.map((d) =>
        d.diaSemana === diaSemana
          ? { ...d, blocos: d.blocos.map((b, i) => (i === indice ? { ...b, [campo]: valor } : b)) }
          : d
      )
    );
  }

  function adicionarBloco(diaSemana: number) {
    setDias((atual) =>
      atual.map((d) =>
        d.diaSemana === diaSemana ? { ...d, blocos: [...d.blocos, { inicioMin: 9 * 60, fimMin: 18 * 60 }] } : d
      )
    );
  }

  function removerBloco(diaSemana: number, indice: number) {
    setDias((atual) =>
      atual.map((d) =>
        d.diaSemana === diaSemana ? { ...d, blocos: d.blocos.filter((_, i) => i !== indice) } : d
      )
    );
  }

  function copiarParaDiasUteis(diaSemanaOrigem: number) {
    setDias((atual) => {
      const origem = atual.find((d) => d.diaSemana === diaSemanaOrigem);
      if (!origem) return atual;
      return atual.map((d) =>
        d.diaSemana >= 1 && d.diaSemana <= 5
          ? { ...d, aberto: true, blocos: origem.blocos.map((b) => ({ ...b })) }
          : d
      );
    });
  }

  function atualizarServico(indice: number, campo: keyof ServicoForm, valor: string) {
    setServicos((atual) => atual.map((s, i) => (i === indice ? { ...s, [campo]: valor } : s)));
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

  function validarPasso1(): string | null {
    const abertos = dias.filter((d) => d.aberto);
    if (abertos.length === 0) return "Abra pelo menos um dia da semana.";
    for (const d of abertos) {
      if (d.blocos.length === 0) return `Adicione um horário em ${d.nome}.`;
      for (const b of d.blocos) {
        if (b.fimMin <= b.inicioMin) return `Em ${d.nome}, o fim deve ser depois do início.`;
      }
    }
    return null;
  }

  function validarPasso2(): { erro: string | null; validos: ServicoForm[] } {
    const validos = servicos.filter((s) => s.nome.trim());
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
      const e = validarPasso1();
      if (e) return setErro(e);
      setPasso(2);
    }
  }

  async function concluir() {
    setErro(null);
    const e0 = validarPasso0();
    if (e0) { setErro(e0); setPasso(0); return; }
    const e1 = validarPasso1();
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

      const linhasExpediente = dias
        .filter((d) => d.aberto)
        .flatMap((d) =>
          d.blocos.map((b) => ({
            profissional_id: profissionalId,
            dia_semana: d.diaSemana,
            inicio_min: b.inicioMin,
            fim_min: b.fimMin,
          }))
        );
      const { error: erroExpediente } = await supabase.from("expedientes").insert(linhasExpediente);
      if (erroExpediente) throw erroExpediente;

      const linhasServicos = servicosValidos.map((s) => ({
        barbearia_id: barbeariaId,
        nome: s.nome.trim(),
        duracao_min: Math.round(Number(s.duracaoMin)),
        preco_centavos: Math.round(Number(s.precoReais.replace(",", ".")) * 100),
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

  const diaSelecionado = picker ? dias.find((d) => d.diaSemana === picker.diaSemana) : undefined;
  const blocoSelecionado = diaSelecionado && picker ? diaSelecionado.blocos[picker.indice] : undefined;

  return (
    <View style={s.tela}>
      <Text style={s.marca}>NAVALHA</Text>
      <Text style={s.titulo}>
        {passo === 0 && "Sobre você"}
        {passo === 1 && "Seu expediente"}
        {passo === 2 && "Seus serviços"}
      </Text>
      <Text style={s.passoTxt}>Passo {passo + 1} de 3</Text>

      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingBottom: 24 }}>
        {passo === 0 && (
          <View>
            <Text style={s.label}>Seu nome</Text>
            <TextInput
              style={s.input}
              placeholder="Ex: João"
              placeholderTextColor={cores.fraco}
              value={nomeProfissional}
              onChangeText={setNomeProfissional}
            />
            <Text style={s.label}>Nome da barbearia</Text>
            <TextInput
              style={s.input}
              placeholder="Ex: Barbearia do João"
              placeholderTextColor={cores.fraco}
              value={nomeBarbearia}
              onChangeText={setNomeBarbearia}
            />
          </View>
        )}

        {passo === 1 && (
          <View>
            {dias.map((d) => (
              <View key={d.diaSemana} style={s.cardDia}>
                <View style={s.linhaDia}>
                  <Text style={s.diaNome}>{d.nome}</Text>
                  <Switch
                    value={d.aberto}
                    onValueChange={(v) => alternarDia(d.diaSemana, v)}
                    trackColor={{ true: cores.vermelho, false: cores.linha }}
                  />
                </View>
                {d.aberto && (
                  <View>
                    {d.blocos.map((b, i) => (
                      <View key={i} style={s.linhaBloco}>
                        <Pressable
                          style={s.chipHora}
                          onPress={() => setPicker({ diaSemana: d.diaSemana, indice: i, campo: "inicioMin" })}
                        >
                          <Text style={s.chipHoraTxt}>{formatarMin(b.inicioMin)}</Text>
                        </Pressable>
                        <Text style={s.ate}>até</Text>
                        <Pressable
                          style={s.chipHora}
                          onPress={() => setPicker({ diaSemana: d.diaSemana, indice: i, campo: "fimMin" })}
                        >
                          <Text style={s.chipHoraTxt}>{formatarMin(b.fimMin)}</Text>
                        </Pressable>
                        <Pressable onPress={() => removerBloco(d.diaSemana, i)} style={s.removerBtn}>
                          <Text style={s.removerTxt}>×</Text>
                        </Pressable>
                      </View>
                    ))}
                    <Pressable onPress={() => adicionarBloco(d.diaSemana)}>
                      <Text style={s.link}>+ adicionar bloco</Text>
                    </Pressable>
                    {d.diaSemana === 1 && (
                      <Pressable onPress={() => copiarParaDiasUteis(1)}>
                        <Text style={s.linkSecundario}>Usar esse horário de seg a sex →</Text>
                      </Pressable>
                    )}
                  </View>
                )}
              </View>
            ))}
          </View>
        )}

        {passo === 2 && (
          <View>
            {servicos.map((sv, i) => (
              <View key={i} style={s.cardDia}>
                <View style={s.linhaDia}>
                  <Text style={s.diaNome}>Serviço {i + 1}</Text>
                  {servicos.length > 1 && (
                    <Pressable onPress={() => removerServico(i)} style={s.removerBtn}>
                      <Text style={s.removerTxt}>×</Text>
                    </Pressable>
                  )}
                </View>
                <Text style={s.label}>Nome</Text>
                <TextInput
                  style={s.input}
                  placeholder="Ex: Corte"
                  placeholderTextColor={cores.fraco}
                  value={sv.nome}
                  onChangeText={(v) => atualizarServico(i, "nome", v)}
                />
                <View style={s.linhaBloco}>
                  <View style={{ flex: 1, marginRight: 8 }}>
                    <Text style={s.label}>Duração (min)</Text>
                    <TextInput
                      style={s.input}
                      placeholder="30"
                      placeholderTextColor={cores.fraco}
                      keyboardType="number-pad"
                      value={sv.duracaoMin}
                      onChangeText={(v) => atualizarServico(i, "duracaoMin", v)}
                    />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={s.label}>Preço (R$)</Text>
                    <TextInput
                      style={s.input}
                      placeholder="40"
                      placeholderTextColor={cores.fraco}
                      keyboardType="decimal-pad"
                      value={sv.precoReais}
                      onChangeText={(v) => atualizarServico(i, "precoReais", v)}
                    />
                  </View>
                </View>
              </View>
            ))}
            <Pressable onPress={adicionarServico}>
              <Text style={s.link}>+ adicionar serviço</Text>
            </Pressable>
          </View>
        )}
      </ScrollView>

      {picker && blocoSelecionado && (
        <View style={s.pickerCaixa}>
          <DateTimePicker
            value={minParaData(blocoSelecionado[picker.campo])}
            mode="time"
            is24Hour
            display={Platform.OS === "ios" ? "spinner" : "default"}
            onChange={(_evento, data) => {
              if (Platform.OS !== "ios") setPicker(null);
              if (data) atualizarBloco(picker.diaSemana, picker.indice, picker.campo, dataParaMin(data));
            }}
          />
          {Platform.OS === "ios" && (
            <Pressable style={s.botao} onPress={() => setPicker(null)}>
              <Text style={s.botaoTxt}>Pronto</Text>
            </Pressable>
          )}
        </View>
      )}

      {erro && <Text style={s.erro}>{erro}</Text>}

      <View style={s.rodape}>
        {passo > 0 && (
          <Pressable style={s.botaoSecundario} onPress={() => setPasso(passo - 1)} disabled={salvando}>
            <Text style={s.botaoSecundarioTxt}>Voltar</Text>
          </Pressable>
        )}
        {passo < 2 ? (
          <Pressable style={s.botao} onPress={avancar}>
            <Text style={s.botaoTxt}>Continuar</Text>
          </Pressable>
        ) : (
          <Pressable style={s.botao} onPress={concluir} disabled={salvando}>
            {salvando ? <ActivityIndicator color="#fff" /> : <Text style={s.botaoTxt}>Concluir</Text>}
          </Pressable>
        )}
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  tela: { flex: 1, backgroundColor: cores.fundo, padding: 20 },
  marca: { color: cores.vermelho, fontWeight: "800", fontSize: 14, letterSpacing: 0.5 },
  titulo: { color: cores.tinta, fontSize: 26, fontWeight: "800", marginTop: 4 },
  passoTxt: { color: cores.sub, marginBottom: 16 },
  label: { color: cores.sub, marginBottom: 6, marginTop: 4 },
  input: {
    backgroundColor: cores.card,
    borderRadius: raio.botao,
    borderWidth: 1,
    borderColor: cores.linha,
    padding: 12,
    fontSize: 16,
    color: cores.tinta,
    marginBottom: 10,
  },
  cardDia: {
    backgroundColor: cores.card,
    borderRadius: raio.card,
    borderWidth: 1,
    borderColor: cores.linha,
    padding: 14,
    marginBottom: 12,
  },
  linhaDia: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 8 },
  diaNome: { color: cores.tinta, fontWeight: "700", fontSize: 16 },
  linhaBloco: { flexDirection: "row", alignItems: "center", marginBottom: 8, gap: 8 },
  chipHora: {
    flex: 1,
    backgroundColor: cores.fundo,
    borderRadius: raio.botao,
    borderWidth: 1,
    borderColor: cores.linha,
    paddingVertical: 12,
    alignItems: "center",
  },
  chipHoraTxt: { color: cores.tinta, fontSize: 16, fontWeight: "700" },
  ate: { color: cores.sub },
  removerBtn: { paddingHorizontal: 10, paddingVertical: 4 },
  removerTxt: { color: cores.vermelho, fontSize: 20, fontWeight: "700" },
  link: { color: cores.verde, fontWeight: "700", marginTop: 4, marginBottom: 8 },
  linkSecundario: { color: cores.sub, fontWeight: "600", marginTop: 2, marginBottom: 4, textDecorationLine: "underline" },
  erro: { color: cores.vermelho, marginBottom: 8 },
  pickerCaixa: {
    backgroundColor: cores.card,
    borderRadius: raio.card,
    borderWidth: 1,
    borderColor: cores.linha,
    padding: 8,
    marginBottom: 12,
    alignItems: "center",
  },
  rodape: { flexDirection: "row", gap: 12, paddingTop: 8 },
  botao: {
    flex: 1,
    backgroundColor: cores.vermelho,
    borderRadius: raio.botao,
    padding: 16,
    alignItems: "center",
  },
  botaoTxt: { color: "#fff", fontWeight: "700", fontSize: 16 },
  botaoSecundario: {
    flex: 1,
    backgroundColor: cores.card,
    borderRadius: raio.botao,
    padding: 16,
    alignItems: "center",
    borderWidth: 1,
    borderColor: cores.linha,
  },
  botaoSecundarioTxt: { color: cores.tinta, fontWeight: "700", fontSize: 16 },
});
