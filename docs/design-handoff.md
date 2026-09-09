# Handoff de design — Navalha

Documento de continuidade para o refino visual no Claude Design. Não repete
a spec (`docs/spec.md`), só mapeia **o que já existe em código**, **o que já
tem referência visual mas não foi implementado**, e **o que ainda não existe
em lugar nenhum**. Feito em 2026-09-07, depois de F1 (onboarding) funcionando
ponta a ponta contra o Supabase real.

## Como ver o que já existe

- **Protótipo navegável (visual de referência, HTML puro, sem o app):**
  `docs/prototipo-barbearia.html` — abra direto no navegador. Cobre Agenda,
  Retornos, Fluxo turbo e Sheet de ações com o visual já validado pela spec
  (§7). **Não cobre** Login, Onboarding, Configurações, Bloqueios ou Painel —
  essas não têm nenhuma referência visual ainda, só as telas RN funcionais
  (feias) descritas abaixo.
- **App React Native rodando de verdade:** `npm run mobile` na raiz do
  monorepo (ou `npm run web -w mobile` para abrir no navegador, mais rápido
  para iterar). Precisa de `apps/mobile/.env` preenchido (Supabase já
  configurado).

## Sistema de design

### Já implementado (`apps/mobile/src/theme.ts`)

Paleta do poste de barbeiro, idêntica à do protótipo — pode copiar direto:

| Token | Hex | Uso |
|---|---|---|
| `fundo` | `#F4F6F5` | Fundo de tela |
| `card` | `#FFFFFF` | Cards, inputs |
| `tinta` | `#16233F` | Texto principal, títulos |
| `sub` | `#5C6678` | Texto secundário |
| `fraco` | `#8B93A3` | Placeholder, texto desabilitado |
| `vermelho` | `#C8362E` | Marca, ações primárias, alerta de buraco morto |
| `vermelhoSuave` | `#FBEDEC` | Fundo de destaque vermelho |
| `verde` | `#1E7A4F` | Sucesso |
| `verdeSuave` | `#E8F4EE` | Fundo de destaque verde |
| `ambar` | `#A66A0C` | Atenção |
| `ambarSuave` | `#FBF2E2` | Fundo de destaque âmbar |
| `linha` | `#DFE3E6` | Bordas, divisores |
| `whatsapp` | `#1FAF57` | Botão de WhatsApp |

Raios: `raio.card = 16`, `raio.botao = 15`, `raio.bloco = 12`.

### Pendente — ainda não existe no app

- **Tipografia:** a spec (§7.2) e o protótipo usam **Bricolage Grotesque**
  (títulos/números) + **Figtree** (corpo). O app RN hoje renderiza tudo na
  fonte padrão do sistema — as fontes nunca foram carregadas
  (`expo-font`/`expo-google-fonts`). Isso precisa entrar como tarefa de
  implementação depois do refino visual, senão o resultado do Claude Design
  não vai bater com o app real.
- **Listra do poste de barbeiro** como assinatura no topo (protótipo tem,
  `.pole` — gradiente diagonal vermelho/branco/azul-marinho). Não existe em
  nenhuma tela RN ainda.
- Selos de qualidade das sugestões (verde/âmbar/vermelho) — existem no
  protótipo (função `svcs`/lista de sugestões), não implementados em RN
  (fluxo turbo inteiro ainda não existe em código, ver abaixo).

## Inventário de telas

### A. Existem em código RN, funcionais, mas com visual mínimo/placeholder

Precisam de refino visual (não de arquitetura — os dados e a lógica já
funcionam contra o Supabase).

| Tela | Arquivo | Estado |
|---|---|---|
| Login (e-mail → código de 6 dígitos) | `apps/mobile/src/screens/onboarding/LoginScreen.tsx` | Funcional, testado ponta a ponta. Visual é só formulário genérico — sem marca forte, sem ilustração, sem estado de "e-mail enviado" mais rico. |
| Onboarding passo 1 — dados | `apps/mobile/src/screens/onboarding/OnboardingScreen.tsx` (passo 0) | Nome do profissional + nome da barbearia. Dois inputs simples. |
| Onboarding passo 2 — expediente | idem (passo 1) | Um card por dia da semana, switch aberto/fechado, blocos com seletor de hora nativo (`@react-native-community/datetimepicker`) e atalho "usar esse horário de seg a sex". Testado, mas ainda **denso visualmente** — 7 cards por padrão é bastante scroll. Ver nota de UX abaixo. |
| Onboarding passo 3 — serviços | idem (passo 2) | Lista de cards (nome, duração, preço), "+ adicionar serviço". |
| Agenda do dia | `apps/mobile/src/screens/AgendaScreen.tsx` | **Placeholder puro** — só texto "TODO". Esta é a tela mais importante do produto (spec F2) e ainda não foi construída nem visualmente nem funcionalmente. |

**Nota de UX já coletada (feedback do usuário, 2026-09-07):** o preenchimento
do expediente no onboarding foi considerado "trabalhoso e pode gerar
dúvidas". Já trocamos texto livre (`HH:MM` digitado) por seletor de hora
nativo + atalho de cópia para dias úteis, o que deve ajudar bastante. Ao
desenhar essa tela de novo, vale considerar: (1) reduzir a lista de 7 dias
individuais visualmente — ex. agrupar "dias úteis" vs. fim de semana por
padrão e só "desagrupar" sob demanda; (2) o mesmo padrão de horário
(seletor nativo) deve ser reaproveitado depois na tela de Bloqueios (F9),
que ainda não existe.

### B. Têm referência visual pronta no protótipo, mas zero código RN

Copiar fielmente do `docs/prototipo-barbearia.html` (visual já validado),
implementar como tela React Native de verdade puxando dados do Supabase.

| Tela | Onde está no protótipo | Descrição |
|---|---|---|
| Agenda do dia (real) | `#sc-agenda` | Linha do tempo vertical, medidor de ocupação (%), buracos mortos hachurados em cinza/vermelho, navegação entre dias (‹ ›). **A tela mais crítica do produto** — é o argumento de venda visual (spec §7.1). |
| Retornos | `#sc-ret` | Lista de clientes "na hora de voltar", ordenada por atraso. A view `retornos` já existe no banco (`supabase/migrations/0001`), só falta consumir. |
| Fluxo turbo — passo 1 (cliente) | `#sc-t1` | Busca por nome/telefone + cadastro inline ("novo cliente em 5 segundos"). |
| Fluxo turbo — passo 2 (serviço) | `#sc-t2` | Lista de presets de serviço (já cadastrados no onboarding). |
| Fluxo turbo — passo 3 (sugestões) | `#sc-t3` | 3 sugestões com selo de qualidade + "ver outros horários" sob aviso. Consome `useSugestoes` (`apps/mobile/src/hooks/useSugestoes.ts`), que já existe e já é testado. |
| Fluxo turbo — confirmação | `#sc-conf` | Resumo + botão "Agendar e avisar no WhatsApp" (usa `apps/mobile/src/lib/whatsapp.ts`, já existe) ou "Agendar sem avisar". |
| Sheet de ações do atendimento | `#sheet` (bottom sheet) | Toque no bloco da agenda → concluir / marcar falta / cancelar / chamar no WhatsApp. |

### C. Não existem em lugar nenhum — nem protótipo, nem código

Precisam ser desenhadas do zero no Claude Design, sem referência visual
prévia. Usar a spec §7.3 (lista de telas) e §2.2 (descrição funcional) como
briefing.

| Tela | Spec | Observações de design |
|---|---|---|
| Configurações — hub | §7.3 tela 5 | Ícone de acesso a partir da Agenda. Uso esporádico — pode ser simples, tipo lista de itens. |
| Perfil e conta | §7.3 tela 5 | Nome, e-mail de login, sair, **excluir conta** (exigência de loja). Sem "redefinir senha" — autenticação é sem senha. |
| Barbearia | §7.3 tela 6 | Nome, endereço/telefone opcionais (aparecem nas msgs de WhatsApp). |
| Serviços (CRUD) | §7.3 tela 7 | Igual ao passo 3 do onboarding, mas com editar/excluir/ativar-desativar. Pode reaproveisar o componente visual do onboarding. |
| Horários de trabalho | §7.3 tela 8 | Mesma tela do onboarding (passo 2), mas em modo edição isolada. Reaproveitar componente. |
| Bloqueios (F9) | §7.3 tela 9, §2.2 F9 | Lista de folgas/fechamentos + criação. Fechar dia inteiro ou trecho. Provavelmente reaproveita o seletor de hora nativo do onboarding. Sem protótipo — desenhar do zero, mas mantendo a mesma linguagem visual da Agenda (blocos ocupados = igual a um agendamento, mas sem cliente). |
| Reencaixe pós-cancelamento (F7) | §2.2 F7, §3.2 | Ao cancelar, sugerir clientes da lista de retornos que cabem no espaço liberado. Provavelmente um sheet parecido com o de sugestões do fluxo turbo, não uma tela cheia. |
| Painel mínimo (F8) | §2.2 F8 | Ocupação do dia já mora na Agenda (ver protótipo). Falta *só* o total faturado do dia/semana — pode ser um elemento pequeno dentro da própria Agenda, não precisa ser tela separada. |
| Ajuda e legal | §7.3 tela 11 | WhatsApp do suporte, Termos, Política de Privacidade. Conteúdo estático, baixa prioridade de design agora. |

## Sugestão de ordem de trabalho

1. **Agenda do dia real** — maior impacto, já tem referência visual pronta
   (protótipo), "só" falta portar fielmente para RN. Sem isso o app não tem
   tela principal.
2. **Fluxo turbo completo** (4 sub-telas) — segundo maior impacto, também já
   tem referência visual pronta.
3. **Retornos** — reference pronta, baixo esforço.
4. **Refino visual de Login/Onboarding** — já funcionam, mas ficaram no
   estilo "formulário genérico"; dar a mesma identidade visual do
   protótipo (tipografia, listra do poste, cores) melhora a primeira
   impressão do produto.
5. **Configurações + Bloqueios + Reencaixe + Painel** — sem referência
   visual, desenhar do zero; menor prioridade porque não bloqueiam o uso
   diário do MVP (exceto Bloqueios, que evita sugestões em horário errado —
   spec §9 já cobre esse risco).

## Referências de arquivo rápidas

```
apps/mobile/src/theme.ts                          # tokens de cor/raio
apps/mobile/src/screens/AgendaScreen.tsx           # placeholder da tela principal
apps/mobile/src/screens/onboarding/LoginScreen.tsx
apps/mobile/src/screens/onboarding/OnboardingScreen.tsx
apps/mobile/src/hooks/useSugestoes.ts              # motor de sugestão já ligado ao banco
apps/mobile/src/hooks/useProfissional.ts
apps/mobile/src/hooks/useAuth.ts
apps/mobile/src/lib/whatsapp.ts                    # helpers de link wa.me
apps/mobile/src/lib/supabase.ts
packages/agenda-inteligente/src/index.ts           # algoritmo puro (sugerirHorarios etc.)
docs/prototipo-barbearia.html                      # referência visual (Agenda/Retornos/Turbo/Sheet)
docs/spec.md                                       # fonte da verdade do produto
supabase/migrations/0001_schema_inicial.sql        # schema, view retornos, RLS
supabase/migrations/0002_onboarding_bootstrap.sql  # RPC de criação de barbearia+profissional
```
