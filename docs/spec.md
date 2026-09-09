# Navalha — Especificação do produto

**Versão:** 1.0 · **Data:** 08/09/2026 · **Status:** aprovada para desenvolvimento do MVP
**Nome provisório:** Navalha (sujeito a validação de marca)

---

## 1. Visão e posicionamento

### 1.1 O problema

Apps de agendamento existentes (Booksy, Trinks, AppBarber, Fresha) tratam a agenda como recurso passivo: exibem todos os horários livres e o cliente escolhe. Isso otimiza a conveniência do cliente às custas do barbeiro e produz **fragmentação de agenda** — intervalos entre atendimentos pequenos demais para caber outro serviço ("buracos mortos"), que são tempo e receita perdidos sem possibilidade de recuperação.

Origem do projeto: um barbeiro real relatou exatamente essa dor e pediu um app onde **ele** controlasse os horários, oferecendo opções ao cliente durante o contato (WhatsApp), em vez de deixar a agenda aberta.

### 1.2 A proposta

> **"O app de agenda que trabalha pelo barbeiro: sem buracos no dia, sem cliente sumido, sem sair do WhatsApp."**

Três pilares, em ordem de prioridade:

1. **Agenda que se defende sozinha** — o app calcula e sugere apenas horários que compactam o dia. O barbeiro mantém o controle; o algoritmo faz o trabalho de pensar.
2. **Velocidade radical** — agendamento em 3 toques e menos de 15 segundos, cadastro de cliente em 5 segundos, tudo operável com uma mão entre um corte e outro.
3. **WhatsApp como espinha dorsal** — o app não compete com o WhatsApp; vive ao redor dele. Mensagens prontas, links `wa.me`, zero digitação.

### 1.3 Público e mercado

- **Usuário do MVP:** barbeiro autônomo ou dono de barbearia pequena (1 cadeira), Brasil, agenda gerenciada hoje por caderno + WhatsApp.
- **Expansão (v2+):** barbearias com equipe (2–6 profissionais).
- **Modelo de negócio (pós-validação):** freemium por cadeira/profissional. Grátis: 1 profissional com limites. Pago: equipe, lembretes automáticos, relatórios.
- **Canal inicial de distribuição:** o barbeiro-cliente original e sua rede (barbeiros se conhecem entre si).

### 1.4 O que este produto NÃO é

Não é um ERP de barbearia. Ficam permanentemente fora do escopo: controle de estoque, comissionamento complexo, emissão de nota fiscal, marketplace de barbeiros. A simplicidade é parte da proposta de valor, não uma limitação temporária.

---

## 2. Escopo do MVP

### 2.1 Critério de corte

Entra no MVP o que valida a proposta central (agenda sem buracos + velocidade no WhatsApp). Sai tudo que é "seria legal ter". Meta do MVP: **3 a 5 barbeiros usando diariamente por 4 semanas sem incentivo externo.**

### 2.2 Funcionalidades do MVP

| # | Funcionalidade | Descrição resumida |
|---|---------------|--------------------|
| F1 | Onboarding do barbeiro | Conta (telefone/OTP ou e-mail no início), nome da barbearia, expediente por dia da semana com blocos (ex: 9–12h / 13–19h), cadastro de serviços (nome, duração, preço). Meta: < 5 minutos, uma única vez. |
| F2 | Agenda do dia | Tela principal. Linha do tempo vertical do dia com blocos de atendimento, navegação entre dias, medidor de ocupação (%), destaque visual hachurado em vermelho para buracos mortos, alerta com total de minutos perdidos. Ações por toque no bloco: concluir, marcar falta, chamar no WhatsApp, cancelar. |
| F3 | Agendamento turbo | Fluxo de 3 passos: cliente (busca por nome/telefone + criação inline com nome e WhatsApp apenas) → serviço (presets) → sugestões inteligentes (3 opções com selo de qualidade do encaixe). Confirmação com opção "Agendar e avisar no WhatsApp" (mensagem pronta) ou "Agendar sem avisar". |
| F4 | Sugestão inteligente | Motor de pontuação descrito na seção 4. Roda no aparelho (função pura). Opções que criam buraco morto só aparecem sob demanda ("ver outros horários") e com aviso explícito. |
| F5 | Compartilhar disponibilidade | Botão que gera mensagem de WhatsApp com as melhores opções calculadas ("Tenho amanhã 14h ou quinta 10h30 — qual prefere?"). |
| F6 | Retornos | Lista derivada de clientes "na hora de voltar" (último atendimento + ciclo individual), com botão de WhatsApp e mensagem pronta incluindo horários sugeridos. Ao concluir atendimento, o ciclo do cliente é reaprendido automaticamente (seção 5.4). Clientes com horário futuro marcado saem da lista. |
| F7 | Reencaixe pós-cancelamento | Ao cancelar um agendamento, o app calcula o espaço liberado, cruza com a lista de retornos e sugere quais clientes cabem ali, com atalho de WhatsApp. |
| F8 | Painel mínimo | Ocupação do dia (na agenda) e total faturado do dia/semana (soma de atendimentos concluídos). Nada além disso no MVP. |
| F9 | Bloqueios | Fechar dia inteiro ou trecho (folga, feriado, compromisso). Tratado pelo motor como espaço ocupado sem cliente — sem mudança na lógica de sugestão. Sem F9 o algoritmo sugeriria horários em que o barbeiro não estará. |

### 2.3 Explicitamente fora do MVP (backlog v2)

- Auto-agendamento pelo cliente via link público (com slots restritos pelo algoritmo e campo `origem` já previsto no banco).
- Interface multi-profissional (o **banco** já nasce multi-profissional; a UI não).
- Lembretes automáticos via API oficial do WhatsApp Business (pagos).
- Notificações push (Expo Notifications).
- Pagamentos/planos, relatórios avançados, fidelidade, fotos/portfólio, avaliações.
- Lista de espera formal (o MVP usa a lista de retornos como proxy no reencaixe).

### 2.4 Critérios de sucesso do MVP

1. Barbeiro cria 100% dos agendamentos pelo app (abandono do caderno) por 4 semanas seguidas.
2. Tempo mediano de criação de agendamento < 15 segundos (medir por telemetria simples).
3. Redução perceptível de buracos mortos (comparar minutos perdidos/semana nas primeiras vs. últimas semanas).
4. Ao menos 1 relato espontâneo de valor ("meu dia ficou mais cheio/organizado").

---

## 3. Fluxos principais

### 3.1 Agendamento turbo (barbeiro, durante conversa no WhatsApp)

```
Agenda do dia → [+] → Passo 1: cliente (busca ou cadastro inline)
             → Passo 2: serviço (preset)
             → Passo 3: 3 sugestões com selo (perfeito/útil/buraco)
             → Confirmação → [Agendar e avisar no WhatsApp] → wa.me com mensagem
             → retorna à agenda no dia agendado, bloco visível
```

Regras do fluxo:
- Cadastro inline exige apenas nome + WhatsApp; validação mínima (ambos preenchidos).
- As 3 sugestões respeitam diversidade: máximo 2 do mesmo dia.
- Se nenhum encaixe sem buraco existir, exibir os com aviso (recusar cliente é pior que perder 15 min).
- Preferência do cliente (ex: "só depois das 18h") é **filtro** aplicado antes da pontuação, nunca fator de nota. No MVP, o filtro é um seletor simples de período (manhã/tarde/noite) opcional no passo 3.

### 3.2 Ciclo de atendimento

```
Bloco na agenda → toque → sheet de ações
  ✓ Concluir  → status=concluido → recalcula ciclo do cliente → toast com previsão de retorno
  Falta       → status=falta → registrada no histórico do cliente
  Cancelar    → status=cancelado → se abrir espaço, sugerir reencaixe (F7)
  WhatsApp    → abre conversa com o cliente
```

### 3.3 Retornos

```
Aba Retornos → lista ordenada por atraso (vencidos primeiro)
  → botão WhatsApp por cliente → mensagem pronta: saudação + serviço habitual
    + 2 melhores horários calculados na hora
```

---

## 4. Regras de negócio: o motor de sugestão

### 4.1 Princípios

1. **Regra de ouro:** candidatos a horário são **apenas as bordas** de cada espaço livre (colado no compromisso anterior ou no próximo, ou nas bordas do expediente). Nunca o meio — meio sempre cria dois buracos.
2. **Buraco morto** = sobra criada menor que a duração do menor serviço ativo da barbearia. É tempo irrecuperável.
3. **Sobra útil** = sobra ≥ menor serviço. Continua vendável.
4. O banco de dados, não o algoritmo, é a autoridade final contra conflitos (seção 6.3).

### 4.2 Pontuação (valores iniciais, calibráveis)

| Fator | Pontos | Racional |
|-------|-------:|----------|
| Encaixe perfeito (sobra = 0) | 100 | Dia compacto |
| Sobra útil | 70 | Espaço restante vendável |
| Buraco morto | 20 | Só na falta de opção melhor, com aviso |
| Adjacência a atendimento (vs. borda do expediente) | +15 | Consolida blocos de trabalho |
| Sobra múltiplo exato de duração de serviço ativo | +10 | Sobra "pronta para vender" |
| Dia que já possui atendimento | +12 | Consolidação de dias (dia cheio + dia livre > dois dias pela metade) |
| Dia vazio: candidato na âncora configurada | +8 | Respeitar preferência de compactação (início ou fim do expediente) |
| Penalidade de recência | −3/dia | Desempate suave a favor de datas próximas |

Parâmetros por profissional: `ancora` (`inicio`/`fim`, padrão `inicio`) e `buffer_min` (respiro entre atendimentos, 0–30 min, padrão 0).

Horizonte de busca: próximos 7 dias. Retorno: top 3 com diversidade (máx. 2/dia).

### 4.3 Reencaixe (lógica inversa)

Dado um espaço liberado por cancelamento, listar serviços cuja duração (+ buffer) caiba nele e cruzar com clientes da lista de retornos cujo serviço habitual caiba. Ordenar por atraso do retorno.

### 4.4 Calibragem prevista

Os pesos acima são hipóteses iniciais. Instrumentar: qual sugestão o barbeiro escolhe (1ª/2ª/3ª/manual), frequência de uso do "ver outros horários", e minutos mortos por semana. Revisar pesos após 4 semanas de dados reais. A relação buraco-morto (20) × recência (−3/dia) define a preferência entre "imperfeito hoje" e "perfeito depois de amanhã".

### 4.5 Implementação de referência

`packages/agenda-inteligente/agenda-inteligente.ts` — TypeScript puro, sem dependências, já validado com cenário de teste (desvia de espaço-armadilha de 45 min, prefere bordas com sobra vendável, ancora dia vazio na abertura). Funções públicas: `sugerirHorarios`, `espacosLivres`, `servicosQueCabem`, `minParaHora`.

---

## 5. Modelo de dados

Referência completa: `supabase/schema.sql`. Resumo das entidades e decisões:

### 5.1 Entidades

```
barbearias (tenant)
 └─ profissionais (user_id → auth.users; ancora; buffer_min)
     └─ expedientes (dia_semana, inicio_min, fim_min — várias linhas = blocos)
 └─ servicos (nome, duracao_min, preco_centavos, ativo)
 └─ clientes (nome, telefone E.164, ciclo_retorno_dias; unique por barbearia+telefone)
 └─ agendamentos (profissional, cliente, servico, inicio, fim, status, origem)
retornos (VIEW derivada — nunca tabela)
```

### 5.2 Estados do agendamento

`agendado → concluido | falta | cancelado`. Apenas `agendado` e `concluido` ocupam horário; `falta` e `cancelado` liberam o espaço (inclusive para a constraint de conflito). `origem ∈ {barbeiro, cliente}` — MVP grava sempre `barbeiro`; o campo existe para a v2 sem migração.

### 5.3 Decisões estruturais

- **Multi-tenant por `barbearia_id` + Row Level Security**: isolamento garantido pelo banco via política `minha_barbearia()`, mesmo diante de bug no app.
- **Multi-profissional no banco, mono na UI**: mudar isso depois seria reescrita; assim é só interface.
- **Retornos como view**: derivada de `max(fim concluído) + ciclo`, sempre correta, zero sincronização, exclui quem já tem horário futuro.
- **Anti-conflito no banco**: exclusion constraint GiST sobre `(profissional_id, tstzrange(inicio, fim))` com filtro de status. Dois clientes simultâneos jamais gravam o mesmo horário.

### 5.4 Aprendizado do ciclo de retorno

Trigger `atualiza_ciclo`: ao concluir atendimento, recalcula `ciclo_retorno_dias` como a média dos intervalos entre os últimos 6 atendimentos concluídos do cliente (descartando intervalos < 5 ou > 90 dias). Cliente sem histórico usa padrão de 21 dias na view.

---

## 6. Arquitetura técnica

### 6.1 Stack

| Camada | Escolha | Racional |
|--------|---------|----------|
| App mobile | React Native + Expo (EAS Build/Update) | TypeScript ponta a ponta; reaproveita o algoritmo; builds e OTA sem manter toolchain nativa; presença nas lojas (credibilidade de venda) |
| Backend | Supabase (Postgres + Auth + Realtime) | Dev solo: zero backend para operar; RLS multi-tenant nativo; Auth por telefone/OTP; Realtime para equipe (v2); free tier cobre a validação |
| Cache/estado servidor | TanStack React Query | Atualização otimista: UI responde na hora, reverte com aviso se o banco recusar |
| Algoritmo | Pacote TS compartilhado, executado **no aparelho** | Sugestões instantâneas e tolerantes a internet ruim; sem round-trip |
| WhatsApp | Links `wa.me` com mensagem codificada | Grátis, sem aprovação Meta, sem servidor. API oficial = v2 paga |

### 6.2 Estrutura do repositório (monorepo)

```
navalha/
├─ packages/
│  └─ agenda-inteligente/     # TS puro + testes (vitest)
├─ apps/
│  └─ mobile/                 # Expo; importa o pacote
└─ supabase/
   ├─ schema.sql              # migração inicial
   └─ migrations/
```

### 6.3 Divisão de responsabilidades (decisão-chave)

- **Aparelho (algoritmo):** pensa rápido — calcula sugestões localmente sobre a agenda da semana em cache.
- **Banco (constraint):** garante a verdade — recusa fisicamente sobreposições. O app trata a recusa como conflito e recalcula sugestões.

Essa separação elimina a necessidade de locks ou fila no servidor, inclusive quando o auto-agendamento da v2 introduzir escrita concorrente por clientes.

### 6.4 Offline e resiliência

Pragmático, não local-first: cache do React Query com a agenda de ±7 dias, escrita otimista com fila de retry do próprio Query. Local-first completo (WatermelonDB etc.) só se dados reais mostrarem necessidade.

### 6.5 Autenticação

MVP inicia com e-mail/link mágico (custo zero); migração para telefone/OTP (SMS, custo variável) quando houver receita ou funding do teste. O modelo (`profissionais.user_id`) é agnóstico ao método.

### 6.6 Distribuição

- **Piloto:** Android via APK direto (EAS internal distribution — link de instalação, sem loja, sem revisão, atualização imediata); iOS via TestFlight se necessário (conta Apple US$ 99/ano, builds expiram em 90 dias). Fallback universal: build web (PWA) do próprio Expo, com limitações.
- **Escala:** publicação nas lojas oficiais (Google Play + App Store) — a presença nas lojas é parte do argumento de venda a novas barbearias. Pré-requisitos de aprovação já contemplados na spec: exclusão de conta no app (tela 5) e Política de Privacidade (tela 11).

### 6.7 Hospedagem

Nenhuma além do Supabase no MVP: o app roda no aparelho e o Supabase é o backend completo. Futuro: landing page de vendas (Vercel/Netlify, free) e página pública de auto-agendamento da v2 (idem). Lógica de servidor da v2 (lembretes) cabe em Supabase Edge Functions — nenhum serviço novo a operar.

### 6.8 Esclarecimento WhatsApp

Links `wa.me` funcionam identicamente com WhatsApp comum e WhatsApp Business (app gratuito) — nenhuma exigência sobre qual versão o barbeiro ou o cliente usa. A WhatsApp Business Platform (API paga, v2) é conta do produto junto à Meta, não do barbeiro: ele nunca precisa mudar de app.

### 6.9 Custos até a validação

Supabase free tier + Expo free + APK direto (R$ 0). Lojas só na fase de escala: Play Store (US$ 25 única) + App Store (US$ 99/ano). Nenhum custo variável se auth por e-mail.

---

## 7. Interface e design

Referência viva: `prototipo-barbearia.html` (protótipo navegável com o algoritmo embutido).

### 7.1 Princípios de UI

- Operável **com uma mão**, olhando de relance, celular às vezes apoiado no balcão: contraste alto, alvos de toque grandes, números protagonistas.
- **Mostrar o dinheiro vazando:** buracos mortos aparecem hachurados em vermelho na linha do tempo, com alerta somando minutos perdidos. É o elemento memorável do produto e o argumento de venda visual.
- Selos de qualidade nas sugestões: verde "Encaixe perfeito — dia compacto", âmbar "Sobra de X min ainda vendável", vermelho "⚠ Cria buraco de X min".
- Toda ação de comunicação termina em um botão verde de WhatsApp com mensagem pronta.

### 7.2 Identidade visual

- Paleta derivada do poste de barbeiro: azul-marinho profundo `#16233F`, vermelho `#C8362E`, branco-porcelana `#F4F6F5`; apoio verde `#1E7A4F` (sucesso/WhatsApp), âmbar `#A66A0C` (atenção). Listra diagonal do poste como assinatura discreta no topo.
- Tipografia: Bricolage Grotesque (títulos e números, voz de letreiro) + Figtree (corpo).
- Navegação: 2 abas (Agenda, Retornos) + FAB vermelho de novo agendamento.

### 7.3 Telas do MVP

**Núcleo diário** (2 abas + FAB):
1. Agenda do dia (principal) — inclui criação de bloqueio por toque em espaço livre ou menu
2. Fluxo turbo (3 passos + confirmação)
3. Sheet de ações do atendimento
4. Retornos

**Onboarding** (uma vez): conta → barbearia → expediente → serviços.

**Configurações** (acessadas por ícone na Agenda, uso esporádico):
5. Perfil e conta — nome, login (e-mail/telefone), sair, **excluir conta** (exigência de Google Play e App Store para publicação)
6. Barbearia — nome, endereço/telefone opcionais (aparecem nas mensagens de WhatsApp)
7. Serviços — CRUD de presets (nome, duração, preço, ativo)
8. Horários de trabalho — expediente por dia da semana com blocos, editável
9. Bloqueios — lista e criação de folgas/fechamentos (F9)
10. Preferências do algoritmo — âncora (início/fim) e buffer (0–30 min)
11. Ajuda e legal — WhatsApp do suporte, Termos de Uso e **Política de Privacidade** (exigência das lojas; e o app armazena dados pessoais de clientes, logo LGPD se aplica)

**Nota sobre "redefinir senha":** não existe. A autenticação é sem senha (link mágico/OTP), o que elimina o fluxo de recuperação inteiro — a tela de conta oferece apenas troca do e-mail/telefone de login.

---

## 8. Telemetria mínima do MVP

Eventos a registrar (tabela simples ou PostHog free): `agendamento_criado` (com posição da sugestão escolhida: 1/2/3/outros/manual, duração do fluxo em segundos), `ver_outros_horarios`, `whatsapp_aberto` (contexto: confirmação/retorno/reencaixe), `atendimento_concluido`, `falta`, `cancelamento` (+ reencaixe aceito ou não). Métrica derivada semanal: minutos mortos por barbeiro.

---

## 9. Riscos e mitigação

| Risco | Mitigação |
|-------|-----------|
| Barbeiro volta ao caderno (fricção) | Medir tempo do fluxo turbo desde o dia 1; meta < 15 s é requisito, não desejo |
| Algoritmo sugere horários que o barbeiro rejeita | Telemetria de posição escolhida; recalibrar pesos em 4 semanas |
| Dependência de WhatsApp manual não escala | Aceitável no MVP; API oficial é o upgrade pago natural da v2 |
| Conflitos com auto-agendamento (v2) | Já resolvido por arquitetura (exclusion constraint) |
| Custo de SMS no login | Iniciar com e-mail/link mágico |

---

## 10. Roadmap resumido

- **v1 (MVP, este documento):** F1–F8, 3–5 barbearias piloto, 4 semanas de medição.
- **v1.1:** calibragem de pesos com dados; ajustes de fricção observados no piloto.
- **v2:** auto-agendamento do cliente com slots restritos; UI multi-profissional; lembretes automáticos (WhatsApp Business API); push; plano pago.
- **v3+:** conforme dados — nunca por achismo.
