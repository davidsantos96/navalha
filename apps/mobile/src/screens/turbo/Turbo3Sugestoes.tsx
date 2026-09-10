import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import type { Sugestao } from "@navalha/agenda-inteligente";
import { minParaHora } from "@navalha/agenda-inteligente";
import { cores, fontes, raio } from "../../theme";
import type { Profissional } from "../../hooks/useProfissional";
import { useServicos } from "../../hooks/useServicos";
import { useExpedientes } from "../../hooks/useExpedientes";
import { useSugestoes } from "../../hooks/useSugestoes";
import { dataCompleta, dataCurta, dataCurtaDeISO, dataISODoOffset, diaSemanaDoOffset, nomeRelativo } from "../../lib/datas";
import { nomeRelativoDaData } from "../../lib/motorAgenda";
import { janelaDoPeriodo } from "../../lib/periodo";
import { Carregando, Chip, ScreenHeader } from "../../components/ui";
import { TurboProgress } from "./TurboProgress";
import type { Navegacao, Periodo, TurboState } from "../../navigation/types";

const FILTROS: { valor: Periodo; texto: string }[] = [
  { valor: "todos", texto: "Qualquer hora" },
  { valor: "manha", texto: "Manhã" },
  { valor: "tarde", texto: "Tarde" },
  { valor: "noite", texto: "Noite" },
];

function tagDaSugestao(s: Sugestao) {
  if (s.tipoSobra === "perfeito") return { texto: "Encaixe perfeito — dia compacto", bg: cores.verdeSuave, fg: cores.verde };
  if (s.tipoSobra === "util") return { texto: `Sobra de ${s.sobraMin} min ainda vendável`, bg: cores.ambarSuave, fg: cores.ambar };
  return { texto: `⚠ Cria buraco de ${s.sobraMin} min`, bg: cores.vermelhoSuave, fg: cores.vermelho };
}

export function Turbo3SugestoesScreen({
  profissional,
  nav,
  turbo,
  setTurbo,
}: {
  profissional: Profissional;
  nav: Navegacao;
  turbo: TurboState;
  setTurbo: (patch: Partial<TurboState>) => void;
}) {
  const servicos = useServicos(profissional.barbearia_id);
  const expedientes = useExpedientes(profissional.id);

  const menorServico = (() => {
    const ativos = (servicos.data ?? []).filter((sv) => sv.ativo);
    return ativos.length ? Math.min(...ativos.map((sv) => sv.duracaoMin)) : 30;
  })();

  const sugestoes = useSugestoes({
    profissionalId: profissional.id,
    duracaoServico: turbo.servicoDuracaoMin ?? 30,
    menorServico,
    buffer: profissional.buffer_min,
    ancora: profissional.ancora,
    ignorarAgendamentoId: turbo.reagendandoId ?? undefined,
    janelaCliente: janelaDoPeriodo(turbo.filtroPeriodo),
    offsetDiaUnico: turbo.diaSelecionadoOffset ?? undefined,
    maxSugestoes: turbo.incluirBuracoMorto ? 8 : 3,
  });

  if (servicos.isLoading || expedientes.isLoading) return <Carregando />;

  const subtitulo = `${turbo.reagendandoId && turbo.clienteNome ? `Reagendando ${turbo.clienteNome.split(" ")[0]} · ` : ""}${turbo.servicoNome ?? ""} · ${
    (turbo.servicoDuracaoMin ?? 0) + profissional.buffer_min
  } min · calculado para não deixar buraco`;

  function temExpediente(offset: number) {
    return (expedientes.data ?? []).some((b) => b.diaSemana === diaSemanaDoOffset(offset));
  }

  return (
    <View style={s.tela}>
      <ScreenHeader titulo="Melhores encaixes" onVoltar={() => nav.pop()} />
      <TurboProgress passo={3} />
      <ScrollView contentContainerStyle={s.conteudo}>
        <Text style={s.subtitulo}>{subtitulo}</Text>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 6, paddingBottom: 6 }}>
          <Chip ativo={turbo.diaSelecionadoOffset === null} texto="✦ Melhores" onPress={() => setTurbo({ diaSelecionadoOffset: null })} />
          {Array.from({ length: 14 }, (_, d) => d).map((d) => (
            <Chip
              key={d}
              ativo={turbo.diaSelecionadoOffset === d}
              texto={d <= 1 ? nomeRelativo(d) : `${nomeRelativo(d)} ${dataCurta(d).split(" ")[0]}`}
              onPress={() => setTurbo({ diaSelecionadoOffset: d })}
              opaco={temExpediente(d)}
            />
          ))}
        </ScrollView>

        <View style={{ flexDirection: "row", gap: 6, flexWrap: "wrap", marginTop: 6, marginBottom: 12 }}>
          {FILTROS.map((f) => (
            <Chip key={f.valor} ativo={turbo.filtroPeriodo === f.valor} texto={f.texto} onPress={() => setTurbo({ filtroPeriodo: f.valor })} />
          ))}
        </View>

        {turbo.diaSelecionadoOffset === null ? (
          <Text style={s.explicacao}>Os melhores encaixes das próximas 2 semanas — o dia de cada um está no canto do cartão. Para uma data específica, toque no dia acima.</Text>
        ) : (
          <Text style={s.explicacaoForte}>Horários de {dataCompleta(turbo.diaSelecionadoOffset)}, do melhor encaixe para o pior.</Text>
        )}

        {sugestoes.isLoading && <Carregando />}

        {(sugestoes.data ?? []).map((sug, i) => {
          const tag = tagDaSugestao(sug);
          return (
            <Pressable key={i} style={s.cartao} onPress={() => { setTurbo({ sugestao: sug }); nav.push("turboConfirmar"); }}>
              <View style={s.cartaoLinha}>
                <Text style={s.hora}>{minParaHora(sug.inicio)}</Text>
                <Text style={s.relData}>
                  {nomeRelativoDaData(sug.data)} · {dataCurtaDeISO(sug.data)}
                </Text>
              </View>
              <View style={[s.tag, { backgroundColor: tag.bg }]}>
                <Text style={[s.tagTexto, { color: tag.fg }]}>{tag.texto}</Text>
              </View>
            </Pressable>
          );
        })}

        {sugestoes.isFetched && (sugestoes.data ?? []).length === 0 && (
          <Text style={s.vazio}>Sem encaixes para essa duração e período. Tente outro dia ou toque em "ver outros horários".</Text>
        )}

        {!turbo.incluirBuracoMorto ? (
          <Pressable onPress={() => setTurbo({ incluirBuracoMorto: true })} style={{ paddingVertical: 10 }}>
            <Text style={s.link}>Ver outros horários (podem criar buraco)</Text>
          </Pressable>
        ) : (
          <View style={s.aviso}>
            <Text style={s.avisoTexto}>Mostrando mais opções, incluindo horários que criam buraco morto — os marcados em vermelho.</Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  tela: { flex: 1, backgroundColor: cores.fundo },
  conteudo: { paddingHorizontal: 20, paddingTop: 4, paddingBottom: 30 },
  subtitulo: { fontSize: 13, color: cores.sub, fontFamily: fontes.corpoSemi, marginBottom: 10 },
  explicacao: { fontSize: 12, color: cores.fraco, fontFamily: fontes.corpoSemi, marginBottom: 10, lineHeight: 17 },
  explicacaoForte: { fontSize: 12, color: cores.tinta, fontFamily: fontes.corpoNegrito, marginBottom: 10 },
  cartao: { backgroundColor: cores.card, borderWidth: 1.5, borderColor: cores.linha, borderRadius: raio.card, padding: 16, marginBottom: 10 },
  cartaoLinha: { flexDirection: "row", alignItems: "baseline", justifyContent: "space-between" },
  hora: { fontFamily: fontes.titulo, fontSize: 26, color: cores.tinta },
  relData: { fontSize: 13, fontFamily: fontes.corpoNegrito, color: cores.sub },
  tag: { alignSelf: "flex-start", marginTop: 8, borderRadius: 8, paddingVertical: 4, paddingHorizontal: 9 },
  tagTexto: { fontSize: 11.5, fontFamily: fontes.corpoNegrito },
  vazio: { fontSize: 14, color: cores.fraco, paddingVertical: 6 },
  link: { color: cores.tinta, fontFamily: fontes.corpoNegrito, fontSize: 14, textDecorationLine: "underline" },
  aviso: { backgroundColor: cores.ambarSuave, borderWidth: 1, borderColor: "#EBD9B4", borderRadius: 12, padding: 10 },
  avisoTexto: { fontSize: 12.5, color: cores.ambar, fontFamily: fontes.corpoSemi, lineHeight: 18 },
});
