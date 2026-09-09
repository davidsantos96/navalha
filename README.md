# Navalha — monorepo

App de agenda para barbearias que trabalha pelo barbeiro: sem buracos no dia,
sem cliente sumido, sem sair do WhatsApp.

**Leia primeiro:** `docs/spec.md` — a especificação completa do produto
(visão, escopo do MVP, regras de negócio, dados, arquitetura, telas).

## Estrutura

```
navalha/
├─ docs/spec.md                     # fonte da verdade do produto
├─ packages/agenda-inteligente/     # motor de sugestão (TS puro + 12 testes)
├─ apps/mobile/                     # app Expo (esqueleto — veja setup abaixo)
└─ supabase/migrations/             # schema do banco (RLS + anti-conflito)
```

## Pré-requisitos

- Node.js 20+
- Conta gratuita no [Supabase](https://supabase.com)
- App **Expo Go** no celular (para desenvolvimento)

## Setup

### 1. Instalar e testar o motor

```bash
npm install
npm test        # 12 testes do algoritmo devem passar
```

### 2. Criar o backend

1. Crie um projeto no Supabase.
2. No SQL Editor, execute `supabase/migrations/0001_schema_inicial.sql`.
3. Em Authentication → Providers, habilite **Email** (link mágico). Telefone/OTP fica para depois (tem custo de SMS).

### 3. Completar o app Expo

O diretório `apps/mobile` traz o código-fonte (`src/`, `App.tsx`) mas **não fixa
versões do Expo** — elas mudam rápido demais para um scaffold congelado.
Gere a base oficial e traga o código por cima:

```bash
# na raiz do monorepo
npx create-expo-app@latest apps/mobile-base --template blank-typescript
# copie de apps/mobile-base para apps/mobile: package.json, app.json,
# babel.config.js e demais arquivos de config (NÃO sobrescreva src/ nem App.tsx)
# depois remova apps/mobile-base

cd apps/mobile
npx expo install @supabase/supabase-js @tanstack/react-query
```

No `package.json` do mobile, garanta o nome `"mobile"` e adicione a dependência
do workspace:

```json
"dependencies": {
  "@navalha/agenda-inteligente": "*"
}
```

Crie `apps/mobile/.env`:

```
EXPO_PUBLIC_SUPABASE_URL=https://SEU-PROJETO.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=sua-anon-key
```

### 4. Rodar

```bash
npm run mobile     # abre o Expo; escaneie o QR com o Expo Go
```

## O que já está pronto vs. o que falta

| Pronto | Falta (ordem sugerida na spec §2.2) |
|--------|--------------------------------------|
| Motor de sugestão testado (12 testes) | Onboarding (F1) |
| Schema com RLS multi-tenant e constraint anti-conflito | Linha do tempo da agenda (F2) — referência visual: `prototipo-barbearia.html` |
| Tokens de design (`src/theme.ts`) | Fluxo turbo (F3) usando `useSugestoes` |
| Helpers de WhatsApp (`src/lib/whatsapp.ts`) | Retornos (F6) — a view `retornos` já existe no banco |
| Hook `useSugestoes` (banco → algoritmo no aparelho) | Bloqueios (F9), reencaixe (F7), painel (F8) |

## Distribuição do piloto

Android por APK direto (sem loja): `npx eas build -p android --profile preview`
gera um link de instalação. Detalhes na spec §6.6.
