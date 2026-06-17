# Redesign Landing & Login

> **ID:** 013
> **Status:** 🟢 Concluída
> **Prioridade:** 🟠 Alta
> **Criada em:** 2026-06-17
> **Última atualização:** 2026-06-17
> **Autor:** Agente AI

---

## 1. Resumo Executivo

Retematizar as telas públicas **Landing** (`app/page.tsx`) e **Login** (`app/login/page.tsx`)
para o design ScoutDoc 2026, reproduzindo nav com emblema, hero com onda SVG e "sticker" de
preview, cards de features, rodapé em gradiente, e a tela de login em gradiente com card sticker.
A lógica de autenticação existente (server actions `login`/`signup`, toggle, erros) é **preservada**.

## 2. Contexto e Motivação

### 2.1 Problema Atual
Landing e Login usam o visual antigo (Outfit, paleta suave, cards flat). Com a fundação 012 no
lugar, são as primeiras telas a receber o layout específico do design (entrada pública do produto).

### 2.2 Impacto do Problema
São a primeira impressão do produto; precisam refletir fielmente a identidade aprovada.

### 2.3 Soluções Consideradas

| Solução | Prós | Contras | Decisão |
|---------|------|---------|---------|
| Reescrever JSX das telas usando tokens/utilitários da 012 | Fiel ao design, reuso da fundação | Reescrita ampla do markup | ✅ Escolhida |
| Apenas trocar classes pontuais | Menor diff | Não alcança o layout do design (ondas, stickers) | ❌ Descartada |

## 3. Especificação Técnica

### 3.1 Visão Geral da Arquitetura
Landing permanece Server Component (`Link` + `Button`). Login permanece Client Component
(`"use client"`, `useTransition`, `useState`) chamando as server actions de `./actions`.
Imagens de marca via `next/image` apontando para `/brand/*` (config `remotePatterns` não é
necessária para assets locais de `public/`).

### 3.2 Componentes Afetados

| Componente | Tipo | Ação | Descrição |
|-----------|------|------|-----------|
| `app/page.tsx` | Arquivo | Modificar | Landing sticker: nav, hero+onda+preview, features, footer |
| `app/login/page.tsx` | Arquivo | Modificar | Login sticker: gradiente, emblema, card, mantém lógica |

### 3.3 Interfaces e Contratos
#### Entradas
Login: form com `email`/`password` (mantido). Landing: sem entradas.
#### Saídas
Login: chama `login`/`signup` → redireciona `/dashboard` ou exibe erro (mantido).
#### Contratos de API (se aplicável)
N/A — usa as server actions existentes inalteradas.

### 3.4 Modelos de Dados (se aplicável)
N/A.

### 3.5 Fluxo de Execução
1. Landing: links levam a `/login`, `/dashboard`, `/assistants`, `/pud/new`.
2. Login: submit → `startTransition` → action → erro inline ou redirect.

### 3.6 Tratamento de Erros
Login mantém bloco de erro inline (estado `error`) e estado `isPending` (spinner). Imagens com
`alt` adequado.

## 4. Requisitos

### 4.1 Requisitos Funcionais
- **RF-001:** Landing reproduz nav (emblema + "ScoutDoc"), hero com onda SVG, card de preview com stickers flutuantes, 3 features, footer em gradiente.
- **RF-002:** CTAs da Landing navegam para `/pud/new`, `/assistants`, `/login`, `/dashboard`.
- **RF-003:** Login reproduz fundo em gradiente com ondas, emblema em quadro branco, card sticker com inputs e botão verde.
- **RF-004:** Login preserva toggle entrar/cadastrar, validação de erro e estado de carregando.

### 4.2 Requisitos Não-Funcionais
- **RNF-001:** Landing permanece Server Component; Login permanece Client Component.
- **RNF-002:** `tsc --noEmit` e `lint` passam.
- **RNF-003:** Responsivo (grid colapsa em telas estreitas).

### 4.3 Restrições e Limitações
- Não alterar `app/login/actions.ts`.
- Usar apenas tokens/utilitários da fundação 012.

## 5. Critérios de Aceitação
- [x] **CA-001:** Landing exibe emblema UEB, hero com onda, preview sticker e footer gradiente.
- [x] **CA-002:** Botões e cards usam o estilo sticker (borda tinta + sombra).
- [x] **CA-003:** Login autentica (fluxo inalterado — `actions.ts` intocado) e exibe erros como antes.
- [x] **CA-004:** `tsc --noEmit` passa; arquivos tocados sem novos erros de lint.

## 6. Plano de Testes
### 6.1 Testes Unitários
N/A.
### 6.2 Testes de Integração
Build/typecheck/lint.
### 6.3 Testes de Aceitação
Inspeção visual das duas telas; tentativa de login válido/ inválido (erro inline).
### 6.4 Casos de Borda
- Email fora de `@escoteiros.org.br` no cadastro → erro da action.
- Viewport mobile: hero/feature grid colapsam para 1 coluna.

## 7. Riscos e Mitigações

| Risco | Probabilidade | Impacto | Mitigação |
|-------|--------------|---------|-----------|
| `next/image` com asset local exigir config | Baixa | Baixo | `public/` é servido direto; usar `<Image>` com width/height fixos |
| Quebra de layout responsivo | Média | Baixo | Classes `lg:` e grids colapsáveis |

## 8. Dependências
### 8.1 Dependências Internas
**012 — Fundação Design System** (tokens, fontes, utilitários sticker, assets de marca).
### 8.2 Dependências Externas
`next/image`, `next/link`, `lucide-react` (ícones), server actions de auth (Supabase) existentes.

## 9. Observações e Decisões de Design
- Ondas reproduzidas com `<svg>` inline (mesmos paths/opacidades do design).
- Stickers flutuantes usam `.animate-sd-float` com `--r` (rotação) inline.
- Login mantém os primitivos `Input`/`Label`/`Button` (já no estilo sticker pela 012).

---

> **⚠️ NOTA:** Contrato vivo. Depende de 012.
