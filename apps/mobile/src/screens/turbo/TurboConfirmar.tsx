import { useState } from "react";
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { minParaHora } from "@navalha/agenda-inteligente";
import { cores, fontes, raio } from "../../theme";
import type { Profissional } from "../../hooks/useProfissional";
import { useBarbearia } from "../../hooks/useBarbearia";
import { useCriarAgendamento } from "../../hooks/useCriarAgendamento";
import { useReagendarAgendamento } from "../../hooks/useReagendarAgendamento";
import { ehConflitoDeHorario } from "../../lib/erros";
import { minutosParaISO, offsetDaData } from "../../lib/datas";
import { formatarCentavos } from "../../lib/datas";
import { nomeRelativoDaData } from "../../lib/motorAgenda";
import { abrirWhatsApp, msgConfirmacao } from "../../lib/whatsapp";
import { MensagemErro, ScreenHeader } from "../../components/ui";
import { WhatsAppIcon } from "../../components/WhatsAppIcon";
import type { Navegacao, TurboState } from "../../navigation/types";

export function TurboConfirmarScreen({
  profissional,
  nav,
  turbo,
  onConfirmado,
}: {
  profissional: Profissional;
  nav: Navegacao;
  turbo: TurboState;
  onConfirmado: (offsetDoAgendamento: number) => void;
}) {
  const [erro, setErro] = useState<string | null>(null);
  const barbearia = useBarbearia(profissional.barbearia_id);
  const criar = useCriarAgendamento();
  const reagendar = useReagendarAgendamento();

  const { clienteId, clienteNome, clienteTelefone, servicoId, servicoNome, servicoPrecoCentavos, sugestao, reagendandoId } = turbo;
  if (!sugestao || !clienteNome || !servicoNome) return null;

  const horaTxt = `${nomeRelativoDaData(sugestao.data)} ${minParaHora(sugestao.inicio)}–${minParaHora(sugestao.fim)}`;
  const carregando = criar.isPending || reagendar.isPending;
  const primeiroNomeCliente = clienteNome.split(" ")[0];

  function confirmar(avisar: boolean) {
    if (!sugestao) return;
    setErro(null);
    const inicioISO = minutosParaISO(sugestao.data, sugestao.inicio);
    const fimISO = minutosParaISO(sugestao.data, sugestao.fim);

    const aoSucesso = () => {
      if (avisar && clienteTelefone) {
        const dia = nomeRelativoDaData(sugestao.data).toLowerCase();
        abrirWhatsApp(clienteTelefone, msgConfirmacao(primeiroNomeCliente, dia, minParaHora(sugestao.inicio), barbearia.data?.nome ?? ""));
      }
      onConfirmado(offsetDaData(sugestao.data));
    };

    const aoErro = (e: unknown) => {
      setErro(ehConflitoDeHorario(e) ? "Esse horário acabou de ser ocupado — volte e escolha outro." : "Erro ao salvar. Tente novamente.");
    };

    if (reagendandoId) {
      reagendar.mutate({ id: reagendandoId, inicio: inicioISO, fim: fimISO }, { onSuccess: aoSucesso, onError: aoErro });
    } else {
      if (!clienteId || !servicoId || servicoPrecoCentavos === null) return;
      criar.mutate(
        {
          barbeariaId: profissional.barbearia_id,
          profissionalId: profissional.id,
          clienteId,
          servicoId,
          precoCentavos: servicoPrecoCentavos,
          inicio: inicioISO,
          fim: fimISO,
        },
        { onSuccess: aoSucesso, onError: aoErro }
      );
    }
  }

  return (
    <View style={s.tela}>
      <ScreenHeader titulo="Confirmar" onVoltar={() => nav.pop()} />
      <ScrollView contentContainerStyle={s.conteudo}>
        <View style={s.cartao}>
          <Text style={s.rotulo}>Cliente</Text>
          <Text style={s.valor}>{clienteNome}</Text>
          <Text style={s.rotulo}>Serviço</Text>
          <Text style={s.valor}>
            {servicoNome}
            {servicoPrecoCentavos !== null ? ` · ${formatarCentavos(servicoPrecoCentavos)}` : ""}
          </Text>
          <Text style={s.rotulo}>Horário</Text>
          <Text style={s.valorGrande}>{horaTxt}</Text>
        </View>

        <MensagemErro texto={erro} />

        <Pressable style={s.botaoWhats} onPress={() => confirmar(true)} disabled={carregando}>
          {carregando ? <ActivityIndicator color="#fff" /> : (
            <>
              <WhatsAppIcon />
              <Text style={s.botaoWhatsTexto}>{reagendandoId ? "Reagendar e avisar no WhatsApp" : "Agendar e avisar no WhatsApp"}</Text>
            </>
          )}
        </Pressable>
        <Pressable style={s.botaoSemAviso} onPress={() => confirmar(false)} disabled={carregando}>
          <Text style={s.botaoSemAvisoTexto}>{reagendandoId ? "Reagendar sem avisar" : "Agendar sem avisar"}</Text>
        </Pressable>
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  tela: { flex: 1, backgroundColor: cores.fundo },
  conteudo: { paddingHorizontal: 20, paddingTop: 4, paddingBottom: 30 },
  cartao: { backgroundColor: cores.tinta, borderRadius: 20, padding: 22, marginTop: 6 },
  rotulo: { fontSize: 12, color: "#9FACC6", fontFamily: fontes.corpoSemi, marginBottom: 2 },
  valor: { fontFamily: fontes.titulo, fontSize: 18, color: "#F2F5FA", marginBottom: 14 },
  valorGrande: { fontFamily: fontes.titulo, fontSize: 24, color: "#F2F5FA" },
  botaoWhats: { marginTop: 12, width: "100%", paddingVertical: 17, borderRadius: raio.botao, backgroundColor: cores.whatsapp, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8 },
  botaoWhatsTexto: { color: "#fff", fontFamily: fontes.corpoNegrito, fontSize: 16 },
  botaoSemAviso: { marginTop: 10, width: "100%", paddingVertical: 17, borderRadius: raio.botao, borderWidth: 1.5, borderColor: cores.linha, backgroundColor: cores.card, alignItems: "center" },
  botaoSemAvisoTexto: { color: cores.tinta, fontFamily: fontes.corpoNegrito, fontSize: 16 },
});
