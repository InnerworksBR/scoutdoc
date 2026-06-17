# Fundação do Design System ScoutDoc 2026

> **ID:** 012
> **Status:** 🟢 Concluída
> **Prioridade:** 🔴 Crítica
> **Criada em:** 2026-06-17
> **Última atualização:** 2026-06-17
> **Autor:** Agente AI

---

## 1. Resumo Executivo

Reconstruir a fundação visual do app (`scoutdoc/`) para o tema **ScoutDoc 2026** — estética
"sticker"/neo-brutalista escoteira: fontes **Fredoka** (títulos/UI) + **Montserrat** (corpo),
bordas grossas tinta-escura `#16302b`, sombras hard-offset, paleta verde `#08ba54` / lime
`#b0dd43` / azure `#02a1d9` / azul-real `#0649d5` / dourado `#ffda3e` sobre creme `#f1efe4`.
A retematização é feita **reutilizando os nomes de token existentes** (`scout/azure/gold/cream`)
para que todas as telas herdem o novo visual sem quebrar, mais novos tokens (`ink`, `lime`,
`royal`) e primitivos de UI re-estilizados. É o pré-requisito de todas as implementações 013–017.

## 2. Contexto e Motivação

### 2.1 Problema Atual
O app usa fontes Outfit/Plus Jakarta e uma paleta OKLCH suave (`globals.css`) com primitivos
flat (`ui/button`, `ui/card`, `ui/input`, `ui/label`). O design aprovado "ScoutDoc 2026" tem
linguagem visual distinta (sticker/neo-brutalista) que precisa estar disponível como fundação
antes de retematizar cada tela.

### 2.2 Impacto do Problema
Sem a fundação, cada tela precisaria redefinir cores/sombras/fontes localmente — duplicação,
inconsistência e risco de regressão. Os primitivos são usados em ~todas as telas; centralizar
a mudança neles propaga o visual imediatamente.

### 2.3 Soluções Consideradas

| Solução | Prós | Contras | Decisão |
|---------|------|---------|---------|
| Retunar tokens existentes + re-skin de primitivos | Propaga global; telas não-tocadas já melhoram; baixo risco | Algumas telas legadas ficam transitoriamente fora do layout-alvo | ✅ Escolhida |
| Criar tokens novos paralelos (`sd-*`) e migrar tela a tela | Isola o legado | Duplicação de paleta; classes antigas continuam com visual velho | ❌ Descartada |
| Reescrever tudo numa só implementação | Resultado final de uma vez | >15 tarefas, alto risco de quebra, difícil revisar | ❌ Descartada |

## 3. Especificação Técnica

### 3.1 Visão Geral da Arquitetura
Tailwind v4 com `@theme` inline em `app/globals.css` (sem `tailwind.config`). Os utilitários de
cor (`bg-scout-600`, `border-cream-300`, etc.) são gerados a partir das variáveis `--color-*`.
Reescrevemos essas variáveis com a paleta do design e adicionamos `--color-ink`, `--color-lime`,
`--color-royal*`. Fontes carregadas via `next/font/google` em `app/layout.tsx`. Animações,
scrollbar e utilitários "sticker" adicionados em `globals.css`.

### 3.2 Componentes Afetados

| Componente | Tipo | Ação | Descrição |
|-----------|------|------|-----------|
| `app/globals.css` | Arquivo | Modificar | Nova paleta, fontes, animações `sd-*`, utilitários sticker, scrollbar |
| `app/layout.tsx` | Arquivo | Modificar | Trocar fontes para Fredoka + Montserrat |
| `components/ui/button.tsx` | Arquivo | Modificar | Variantes "sticker" (borda+sombra hard-offset+press) |
| `components/ui/card.tsx` | Arquivo | Modificar | Card sticker (borda grossa, sombra, raio maior) |
| `components/ui/input.tsx` | Arquivo | Modificar | Input sticker (borda grossa, foco azure) |
| `components/ui/label.tsx` | Arquivo | Modificar | Label em Fredoka |
| `public/brand/*` | Assets | Criar | `emblema.png`, `logo-horizontal.png`, `logo-vertical.png` (UEB) |

### 3.3 Interfaces e Contratos

#### Entradas
N/A — mudança puramente de tema/estilo; as APIs dos primitivos (`variant`, `size`, props HTML)
permanecem idênticas.

#### Saídas
Classes utilitárias e variáveis CSS novas disponíveis globalmente; primitivos com novo visual,
mesma assinatura de props.

#### Contratos de API (se aplicável)
N/A — nenhuma API de servidor alterada.

### 3.4 Modelos de Dados (se aplicável)
N/A — nenhum dado persistido alterado.

### 3.5 Fluxo de Execução
1. Copiar assets UEB para `public/brand/`.
2. Reescrever `globals.css` (tokens + fontes + animações + utilitários).
3. Trocar fontes em `layout.tsx`.
4. Re-estilizar primitivos `button/card/input/label` preservando props.
5. Verificar typecheck/lint.

### 3.6 Tratamento de Erros
N/A funcional. Risco visual: classes que antes referenciavam tons agora remapeados podem ficar
mais vibrantes em telas ainda não retematizadas (013–017) — aceitável e transitório, não quebra.

## 4. Requisitos

### 4.1 Requisitos Funcionais
- **RF-001:** `globals.css` define a paleta do design nos tokens `scout/azure/gold/cream` + novos `ink`, `lime`, `royal`.
- **RF-002:** Fontes Fredoka (`--font-display`) e Montserrat (`--font-body`) carregadas e aplicadas.
- **RF-003:** Animações `sd-in`, `sd-float`, `sd-spin`, `sd-pulse`, `sd-draw` e classe `.sd-scroll` disponíveis.
- **RF-004:** Utilitários sticker (`.sd-card`, sombras hard-offset) e gradiente de identidade atualizado.
- **RF-005:** `Button` oferece variantes sticker (`scout/azure/gold/outline/secondary/ghost/link`) com efeito de "pressionar".
- **RF-006:** `Card`, `Input`, `Label` re-estilizados ao tema, mantendo props.
- **RF-007:** Logos UEB disponíveis em `public/brand/`.

### 4.2 Requisitos Não-Funcionais
- **RNF-001:** Nenhuma mudança de assinatura de componente (sem quebra de chamadas existentes).
- **RNF-002:** `npx tsc --noEmit` e `npm run lint` passam.
- **RNF-003:** Contraste de texto principal sobre fundo creme ≥ AA para corpo.

### 4.3 Restrições e Limitações
- Manter Tailwind v4 inline (sem introduzir `tailwind.config`).
- Não remover tokens usados pelo código atual (apenas retunar valores).

## 5. Critérios de Aceitação

- [x] **CA-001:** `tsc --noEmit` passa; arquivos tocados sem erros de lint (lint global tem erros `no-explicit-any` PRÉ-EXISTENTES em outras telas; build Next 16 não roda lint integrado).
- [x] **CA-002:** `bg-scout-600` = `#08ba54`, `bg-azure-500` = `#02a1d9`, `bg-gold-500` = `#ffda3e`, `bg-background` = `#f1efe4`.
- [x] **CA-003:** Títulos renderizam em Fredoka e corpo em Montserrat.
- [x] **CA-004:** `<Button variant="scout">` exibe borda tinta + sombra hard-offset + efeito de clique.
- [x] **CA-005:** Logos acessíveis em `/brand/emblema.png`, `/brand/logo-horizontal.png`, `/brand/logo-vertical.png`.

## 6. Plano de Testes

### 6.1 Testes Unitários
N/A — projeto não possui suíte de testes unitários de UI.

### 6.2 Testes de Integração
Verificação de build/typecheck/lint como porta de qualidade.

### 6.3 Testes de Aceitação
Inspeção visual de Landing/Login (013) que consomem os primitivos; conferência dos hex via DevTools.

### 6.4 Casos de Borda
- Telas ainda não retematizadas (Dashboard/Chat/PUD/Preview) devem continuar funcionando, mesmo que com cores transitórias.
- Overrides de `className` em chamadas existentes de `Card`/`Button` continuam aplicáveis via `cn`/twMerge.

## 7. Riscos e Mitigações

| Risco | Probabilidade | Impacto | Mitigação |
|-------|--------------|---------|-----------|
| Tom remapeado deixa texto ilegível em tela legada | Média | Baixo | `--color-muted-foreground` neutro (#6a7a73); retematizar telas em 013–017 |
| Sombra arbitrária Tailwind não compila | Baixa | Médio | Usar valores arbitrários com hex literal `shadow-[3px_3px_0_#16302b]` |
| Fonte Google indisponível offline no build | Baixa | Baixo | `next/font` faz self-host no build |

## 8. Dependências

### 8.1 Dependências Internas
Nenhuma — é a base. Habilita 013, 014, 015, 016, 017.

### 8.2 Dependências Externas
`next/font/google` (Fredoka, Montserrat) — já disponível via `next`.

## 9. Observações e Decisões de Design
- Tinta de borda/sombra padronizada em `#16302b` (token `ink`, = `scout-900`).
- `scout-800/900` mapeados para os tons escuros de texto do design (`#1b3a32`/`#16302b`).
- `azure` = ciano do design (`#02a1d9`); azul-real do design (`#0649d5`) entra como token novo `royal`.
- Efeito de clique dos botões via utilitários `active:` do Tailwind (mesma propriedade `box-shadow`/`translate`) para precedência correta.

---

> **⚠️ NOTA:** Contrato vivo. Mudanças de escopo refletidas aqui antes do código.
