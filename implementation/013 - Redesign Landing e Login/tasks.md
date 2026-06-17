# Tarefas: Redesign Landing & Login

> **Implementação:** 013 - Redesign Landing e Login
> **Spec:** [spec.md](./spec.md)
> **Progresso:** 3/3 tarefas concluídas (100%)
> **Última atualização:** 2026-06-17

---

## Legenda
- `[ ]` Pendente · `[x]` Concluída · `[!]` Bloqueada · `[-]` Cancelada

---

## Tarefas

### Fase 1: Implementação

- [x] **T-001:** Reescrever Landing (`app/page.tsx`)
  - **Descrição:** Nav com emblema, hero com onda SVG + card preview com stickers flutuantes, 3 features sticker, footer em gradiente. CTAs ligadas às rotas.
  - **Arquivos envolvidos:** `app/page.tsx`
  - **Critério de conclusão:** RF-001, RF-002, CA-001, CA-002.
  - **Dependências:** 012
  - **Estimativa:** Grande

- [x] **T-002:** Reescrever Login (`app/login/page.tsx`)
  - **Descrição:** Fundo gradiente com ondas, emblema em quadro branco, card sticker com inputs/botão; manter `useTransition`, toggle e erros e as actions.
  - **Arquivos envolvidos:** `app/login/page.tsx`
  - **Critério de conclusão:** RF-003, RF-004, CA-003.
  - **Dependências:** 012
  - **Estimativa:** Média

### Fase 2: Validação

- [x] **T-003:** Verificação de qualidade
  - **Descrição:** `npx tsc --noEmit` + `npm run lint`; corrigir regressões.
  - **Arquivos envolvidos:** —
  - **Critério de conclusão:** CA-004.
  - **Dependências:** T-001, T-002
  - **Estimativa:** Pequena

---

## Registro de Progresso

| Tarefa | Status | Data de Conclusão | Observações |
|--------|--------|-------------------|-------------|
| T-001  | 🟢 Concluída | 2026-06-17 | Landing sticker |
| T-002  | 🟢 Concluída | 2026-06-17 | Login sticker (lógica preservada) |
| T-003  | 🟢 Concluída | 2026-06-17 | tsc + lint |

---

> **📌 NOTA:** Atualizar ao concluir cada tarefa.
