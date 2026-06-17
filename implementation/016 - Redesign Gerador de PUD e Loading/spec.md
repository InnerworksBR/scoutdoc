# Redesign Gerador de PUD & Loading

> **ID:** 016
> **Status:** 🟢 Concluída
> **Prioridade:** 🟠 Alta
> **Criada em:** 2026-06-17
> **Última atualização:** 2026-06-17
> **Autor:** Agente AI

---

## 1. Resumo Executivo
Retematizar o gerador de PUD (página + wizard de 4 passos) e a tela de loading para o design
ScoutDoc 2026: trilha ondulada de progresso com círculos numerados, card de formulário sticker com
faixa-gradiente no topo, e loading com onda SVG "desenhando" + emblema girando ("Traçando a rota…").
A lógica de formulário (react-hook-form + zod, validação por passo, submit) é **preservada**.

## 2. Contexto e Motivação
### 2.1 Problema Atual
`StepForm`/`LoadingScout`/`pud/new` usam o visual antigo (barra de progresso linear, compass
girando). Não refletem o design aprovado.
### 2.2 Impacto do Problema
É o fluxo central de geração de documentos; precisa do visual e do "deleite" do design.
### 2.3 Soluções Consideradas
| Solução | Prós | Contras | Decisão |
|---------|------|---------|---------|
| Re-skin preservando RHF/zod | Mantém validação + visual novo | Markup do wizard grande | ✅ Escolhida |
| Trocar libs de form | — | Risco alto, sem ganho | ❌ Descartada |

## 3. Especificação Técnica
### 3.1 Visão Geral da Arquitetura
`pud/new/page.tsx` (client) mantém estados e `handleFormComplete` (POST `/api/generate`).
`StepForm` reescrito visualmente, mantendo schema/validação/`onComplete`. `LoadingScout` reescrito
para a animação do design.
### 3.2 Componentes Afetados
| Componente | Tipo | Ação | Descrição |
|-----------|------|------|-----------|
| `app/pud/new/page.tsx` | Arquivo | Modificar | Header com emblema, título, wrapper de loading sticker |
| `components/StepForm.tsx` | Arquivo | Modificar | Trilha ondulada + card sticker + selects/inputs estilizados |
| `components/LoadingScout.tsx` | Arquivo | Modificar | Onda SVG draw + emblema girando + textos |
### 3.3 Interfaces e Contratos
#### Entradas: `StepForm.onComplete(FormData)` inalterado; campos de formulário idênticos.
#### Saídas: POST `/api/generate` → preview (PreviewModal). Inalterado.
#### Contratos de API: nenhum endpoint alterado.
### 3.4 Modelos de Dados: schema zod inalterado.
### 3.5 Fluxo de Execução: 4 passos validados → submit → loading → preview. Inalterado.
### 3.6 Tratamento de Erros: mantém mensagens de erro por campo e `alert()` em falha de geração.

## 4. Requisitos
### 4.1 Requisitos Funcionais
- **RF-001:** Trilha de progresso ondulada com círculos numerados/check e rótulos do passo atual.
- **RF-002:** Card de formulário sticker com faixa-gradiente; selects/inputs/textarea estilizados.
- **RF-003:** Validação por passo e submit preservados (RHF + zod).
- **RF-004:** Loading com onda SVG animada + emblema girando + "Traçando a rota…".
### 4.2 Requisitos Não-Funcionais
- **RNF-001:** Nenhuma mudança na validação/contrato do form. - **RNF-002:** `tsc`/`build` passam.
### 4.3 Restrições e Limitações
- Não alterar `/api/generate`. - Apenas tokens/utilitários da 012.

## 5. Critérios de Aceitação
- [x] **CA-001:** Wizard exibe trilha ondulada e card sticker; navega/valida os 4 passos (RHF+zod preservados).
- [x] **CA-002:** Submissão gera o PUD (loading do design) e abre o preview.
- [x] **CA-003:** `tsc --noEmit` e `next build` passam.

## 6. Plano de Testes
### 6.1 Unitários: N/A. ### 6.2 Integração: build/typecheck.
### 6.3 Aceitação: preencher 4 passos, validar erros, gerar PUD.
### 6.4 Borda: campos inválidos bloqueiam avanço; voltar mantém dados.

## 7. Riscos e Mitigações
| Risco | Prob. | Impacto | Mitigação |
|-------|-------|---------|-----------|
| Quebrar `register`/validação ao reescrever | Média | Alto | Manter `register`/`trigger`/`handleSubmit` intactos |

## 8. Dependências
### 8.1 Internas: 012; `PreviewModal` (017). ### 8.2 Externas: react-hook-form, zod, framer-motion.

## 9. Observações e Decisões de Design
- Trilha ondulada reproduzida via `<svg>` tracejado do design.
- Loading usa `@keyframes sd-draw`/`sd-spin`/`sd-pulse` da 012.

---
> **⚠️ NOTA:** Contrato vivo. Depende de 012.
