# Navalha

App de agenda para barbearias que trabalha pelo barbeiro: sem buracos no dia,
sem cliente sumido, sem sair do WhatsApp.

Em vez de expor todos os horários livres pro cliente escolher (como a maioria
dos apps de agendamento), o **barbeiro** controla a agenda — o app sugere só
os horários que compactam o dia, direto na conversa do WhatsApp.

| Mercado atual | Navalha |
|---|---|
| Agenda passiva — cliente escolhe entre todos os horários livres | Agenda ativa — algoritmo oferece só os horários que compactam o dia |
| Otimiza a conveniência do cliente | Otimiza a receita/tempo do barbeiro |
| Compete com o WhatsApp (app próprio de conversa) | Vive ao redor do WhatsApp (links `wa.me`, mensagens prontas) |
| Buraco na agenda é um custo invisível | Buraco morto é visualizado (hachura vermelha) — vira argumento de venda |

**Documentação completa:**
- [`docs/spec.md`](docs/spec.md) — especificação do produto (visão, regras de negócio, dados, telas).
- [`docs/documentacao-tecnica.md`](docs/documentacao-tecnica.md) — arquitetura, decisões técnicas, roadmap e riscos.

## Estado atual

Piloto em andamento em dispositivos reais — Android via APK (EAS Build) e iOS
via túnel do Expo Go. As 9 telas do MVP (F1–F9) estão implementadas contra o
Supabase real, com identidade visual própria (ícone, splash, tipografia
Bricolage Grotesque + Figtree) e sem dependências pendentes de infraestrutura.

## Estrutura

```
navalha/
├─ docs/                            # spec do produto + doc técnica
├─ packages/agenda-inteligente/     # motor de sugestão (TS puro + 13 testes)
├─ apps/mobile/                     # app Expo/React Native
└─ supabase/migrations/             # schema do banco (RLS + anti-conflito)
```

## Pré-requisitos

- Node.js 20+
- Conta gratuita no [Supabase](https://supabase.com)
- App **Expo Go** no celular (pra rodar sem gerar build nativo)
- [EAS CLI](https://docs.expo.dev/eas/) (`npx eas-cli`) pra gerar APK/build de distribuição

## Setup

### 1. Instalar dependências e rodar os testes do motor

```bash
npm install
npm test        # 13 testes de packages/agenda-inteligente devem passar
```

### 2. Criar o backend

1. Crie um projeto no [Supabase](https://supabase.com).
2. No SQL Editor, rode as migrações de `supabase/migrations/` **em ordem** (0001 a 0007).
3. Em Authentication → Providers, habilite **Email** (link mágico) e customize
   o template "Magic Link" pra incluir `{{ .Token }}` — por padrão o e-mail só
   traz um link, sem código. O tamanho do código (6, 8 dígitos etc.) depende
   da configuração de OTP do projeto; a tela de login aceita qualquer tamanho.

### 3. Configurar o app mobile

Crie `apps/mobile/.env`:

```
EXPO_PUBLIC_SUPABASE_URL=https://SEU-PROJETO.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=sua-anon-key
```

### 4. Rodar em desenvolvimento

```bash
npm run mobile     # abre o Expo; escaneie o QR com o Expo Go
```

Pra testar num iPhone sem Mac/conta Apple Developer, use o modo túnel
(`npx expo start --tunnel` dentro de `apps/mobile`) — o Expo Go conecta pela
internet, sem precisar da mesma rede Wi-Fi.

## Distribuição do piloto

Build via EAS (perfis já configurados em `apps/mobile/eas.json`):

```bash
cd apps/mobile
npx eas-cli build --platform android --profile preview   # APK direto, sem loja
```

As variáveis de ambiente do build (`EXPO_PUBLIC_SUPABASE_URL`/`ANON_KEY`)
ficam nos ambientes `preview`/`production` do projeto EAS, não no `.env`
local — configure com `eas env:set` antes do primeiro build.

iOS exige conta Apple Developer (US$ 99/ano) pra gerar build de distribuição;
até lá, o teste em iPhone é feito via túnel do Expo Go.
