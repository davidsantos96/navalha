# Navalha — Documentação Técnica

**Baseado em:** `docs/spec.md` v1.0 (08/09/2026) + inspeção direta do código em `master`
**Preparado em:** 11/09/2026

---

## 1. O que é

App de agenda para barbearias que inverte o modelo dominante do mercado (Booksy, Trinks, AppBarber, Fresha): em vez de expor todos os horários livres para o cliente escolher, o **barbeiro** controla a agenda, e o app sugere apenas os horários que compactam o dia — durante a própria conversa no WhatsApp.

**Proposta central:** *"O app de agenda que trabalha pelo barbeiro: sem buracos no dia, sem cliente sumido, sem sair do WhatsApp."*

**Diferencial estrutural (por que não é só mais um app de agendamento):**
| Mercado atual | Navalha |
|---|---|
| Agenda passiva — cliente escolhe entre todos os horários livres | Agenda ativa — algoritmo oferece só os horários que compactam o dia |
| Otimiza a conveniência do cliente | Otimiza a receita/tempo do barbeiro |
| Compete com o WhatsApp (app próprio de conversa/agendamento) | Vive ao redor do WhatsApp (links `wa.me`, mensagens prontas) |
| Fragmentação de agenda é um custo invisível | Buraco morto é visualizado (hachura vermelha) — vira argumento de venda |

---

## 2. Estado atual do desenvolvimento

### 2.1 Resumo por camada

| Camada | Status | Evidência |
|---|---|---|
| Motor de sugestão (`packages/agenda-inteligente`) | ✅ Completo e testado | TS puro, zero dependências, 13 testes passando (`npm test`) |
| Schema do banco (Supabase/Postgres) | ✅ Completo | 7 migrations aplicadas (0001–0007) |
| Telas do app mobile (MVP F1–F9) | ✅ Implementadas contra hooks reais | Branch `refino-visual-telas` já mesclada em `master`; ~40 arquivos em `apps/mobile/src` |
| Identidade visual no app real | ✅ Aplicada | Fontes (Bricolage Grotesque + Figtree) carregadas em `App.tsx`; paleta em `theme.ts` |
| Validação em produção | ❌ Pendente | Falta rodar contra projeto Supabase real e em aparelho físico |
| Distribuição do piloto | ❌ Pendente | APK via `eas build` ainda não gerado |

**Leitura estratégica:** o produto está tecnicamente pronto para piloto — o gargalo agora é validação com barbeiros reais, não engenharia.

### 2.2 Motor de sugestão — `packages/agenda-inteligente/src/index.ts`

Função pura, roda **no aparelho** (sem round-trip de rede):

- `espacosLivres(dia, buffer)` — calcula espaços livres do dia (expediente − agendamentos).
- `sugerirHorarios(dias, config, duracoes)` — gera candidatos **apenas nas bordas** de cada espaço livre (nunca no meio — regra de ouro, meio sempre cria dois buracos), pontua e retorna top 3 com diversidade (máx. 2 por dia).
- `servicosQueCabem(buraco, duracoes, buffer)` — lógica inversa, usada no reencaixe pós-cancelamento (F7).
- `minParaHora(min)` — formatação.

**Pontuação** (valores iniciais, calibráveis por telemetria):

| Fator | Pontos |
|---|---:|
| Encaixe perfeito (sobra = 0) | 100 |
| Sobra útil (≥ menor serviço ativo) | 70 |
| Buraco morto (só exibido sob demanda) | 20 |
| Adjacência a atendimento existente | +15 |
| Sobra múltipla exata de duração de serviço | +10 |
| Dia que já tem atendimento (consolidação) | +12 |
| Candidato na âncora configurada (dia vazio) | +8 |
| Penalidade de recência | −3/dia |

Parâmetros configuráveis por profissional: `ancora` (início/fim do expediente) e `buffer_min` (0–30 min).

### 2.3 Modelo de dados (Supabase/Postgres)

Tabelas: `barbearias` (tenant) → `profissionais` → `expedientes`, `servicos`, `clientes`, `agendamentos`. View derivada: `retornos`.

Decisões estruturais confirmadas no schema:
- **Multi-tenant por `barbearia_id` + RLS** — isolamento garantido no banco, não só na app.
- **Multi-profissional no banco, mono na UI** — a UI do MVP assume 1 profissional, mas o schema já suporta equipe (evita reescrita em v2).
- **`retornos` é view, não tabela** — derivada de `max(fim concluído) + ciclo_retorno_dias`, sempre correta, sem sincronização manual.
- **Anti-conflito por exclusion constraint GiST** sobre `(profissional_id, tstzrange(inicio, fim))` — o banco recusa fisicamente sobreposições; o app trata a recusa como conflito e recalcula.
- **Trigger `atualiza_ciclo`** — recalcula `ciclo_retorno_dias` como média dos últimos 6 intervalos concluídos (descarta < 5 ou > 90 dias) a cada atendimento concluído.

Migrations aplicadas: schema inicial → onboarding bootstrap → bloqueios → reencaixe/faturamento → preço histórico → contato da barbearia → exclusão de conta.

### 2.4 App mobile (Expo + React Native)

Stack: React Native + Expo (EAS Build/Update), TanStack React Query (cache/estado otimista), Supabase JS client.

| Área | Telas implementadas |
|---|---|
| Núcleo diário | Agenda do dia (F2), Fluxo turbo 3 passos + confirmação (F3/F4), Sheet de ações, Retornos (F6) |
| Onboarding | Login, Onboarding (conta → barbearia → expediente → serviços) |
| Configurações | Perfil (+ excluir conta), Barbearia, Serviços (CRUD), Horários, Bloqueios (F9), Preferências do algoritmo, Ajuda/legal |
| Faturamento | Painel dedicado por dia/serviço (F8), além dos cards na Agenda |
| Reencaixe | Dica no sheet ao cancelar, se houver cliente de retorno compatível (F7) |

Navegação: pilha local simples (`AppShell.tsx`), sem lib de rotas externa.

### 2.5 O que falta para o piloto

1. Validar todo o fluxo contra um projeto Supabase real (não só local/dev).
2. Rodar em aparelho físico (não só simulador/Expo Go).
3. Gerar APK via `eas build -p android --profile preview` e distribuir aos 3–5 barbeiros piloto.
4. Ativar telemetria mínima (§4 abaixo) desde o primeiro uso — sem isso não há como calibrar o algoritmo depois.

---

## 3. Arquitetura — decisões-chave e porquês

| Decisão | Racional |
|---|---|
| Algoritmo roda no aparelho, não no servidor | Sugestão instantânea, tolera internet ruim, zero round-trip |
| Banco é a autoridade final contra conflitos (não o algoritmo) | Elimina necessidade de locks/fila no servidor, mesmo com escrita concorrente futura (auto-agendamento v2) |
| Supabase (Postgres + Auth + Realtime) | Zero backend a operar para dev solo; RLS multi-tenant nativo; free tier cobre a validação |
| `wa.me` em vez de WhatsApp Business API | Grátis, sem aprovação Meta, sem servidor — mas ver risco em §5 |
| Cache pragmático (React Query, ±7 dias), não local-first | Local-first completo (WatermelonDB) só se dados reais mostrarem necessidade |
| Auth por e-mail/link mágico no MVP | Custo zero; migração para telefone/OTP quando houver receita (SMS tem custo variável) |

Custo até a validação: **R$ 0** (Supabase free + Expo free + APK direto). Lojas oficiais só entram na fase de escala (Play Store US$ 25 única + App Store US$ 99/ano).

---

## 4. Telemetria mínima (necessária para calibrar o algoritmo)

Eventos a registrar desde o dia 1 do piloto: `agendamento_criado` (posição da sugestão escolhida: 1ª/2ª/3ª/outros/manual, duração do fluxo em segundos), `ver_outros_horarios`, `whatsapp_aberto` (contexto), `atendimento_concluido`, `falta`, `cancelamento` (+ reencaixe aceito ou não).

Métrica derivada semanal: **minutos mortos por barbeiro** — é o número que valida (ou invalida) a proposta central do produto.

---

## 5. Riscos

| Risco | Mitigação oficial (spec) | Observação adicional |
|---|---|---|
| Barbeiro volta ao caderno (fricção) | Meta de fluxo < 15s é requisito, não desejo | — |
| Algoritmo sugere horários rejeitados | Telemetria de posição escolhida; recalibrar em 4 semanas | — |
| Dependência de WhatsApp manual não escala | Aceitável no MVP; API oficial é upgrade pago da v2 | **Risco não documentado:** envio de `wa.me` em volume alto por número pessoal pode acionar banimento por spam do WhatsApp. Vale definir um teto prático de mensagens/dia antes do piloto crescer. |
| Conflitos com auto-agendamento (v2) | Já resolvido por arquitetura (exclusion constraint) | UX do que o cliente vê quando o slot some entre sugestão e confirmação ainda não está desenhada — recomendo especificar antes de construir a tela, não depois. |
| Custo de SMS no login | Iniciar com e-mail/link mágico | — |
| *(novo)* Gatilho de monetização depende de v2 (multi-profissional) | — | O modelo "freemium por cadeira" só tem gatilho de upgrade quando a UI multi-profissional existir. Lembretes automáticos poderiam virar o primeiro plano pago mesmo para barbeiro solo, dando runway de receita antes da v2. |

---

## 6. Roadmap

### v1 — MVP (este documento), em piloto
F1–F9 completos. Meta: 3–5 barbearias usando diariamente por 4 semanas sem incentivo externo.

### v1.1 — pós-piloto
Calibragem de pesos do algoritmo com dados reais; ajustes de fricção observados.

### v2
- Auto-agendamento do cliente via link público (slots restritos pelo algoritmo — campo `origem` já existe no banco).
- Interface multi-profissional (banco já suporta; falta só a UI).
- Lembretes automáticos via WhatsApp Business API (paga).
- Notificações push (Expo Notifications).
- Pagamentos/planos, relatórios avançados, fidelidade, fotos/portfólio, avaliações.
- Lista de espera formal (MVP usa retornos como proxy).

### v3+
Conforme dados de uso — não por achismo (princípio explícito da spec).

### Propostas estratégicas (fora da spec original — para avaliação)

1. **Card semanal compartilhável** ("você evitou R$ X em buracos essa semana") gerado a partir da telemetria já prevista — baixo custo de implementação, potencial de distribuição orgânica entre barbeiros via WhatsApp Status/Instagram.
2. **Plano pago antecipado** (lembretes automáticos) desacoplado da UI multi-profissional, para não depender inteiramente da v2 para monetizar.
3. **Especificar UX de conflito de concorrência** (auto-agendamento v2) agora, como padrão de interação, antes de a tela ser construída.
4. **Teto prático de mensagens `wa.me`/dia** e plano de contingência para risco de banimento de número.
5. **Waitlist para barbearias com equipe** capturada já na fase de piloto (landing simples), para medir demanda por multi-profissional antes de priorizar a v2.

---

## Anexo — Como rodar localmente

```bash
npm install
npm test              # 13 testes do algoritmo devem passar
# criar projeto Supabase, rodar migrations 0001–0007 em ordem
# configurar apps/mobile/.env com EXPO_PUBLIC_SUPABASE_URL e EXPO_PUBLIC_SUPABASE_ANON_KEY
npm run mobile        # abre Expo; escanear QR com Expo Go
```
