# Tarefas: Redesign Gerador de PUD & Loading

> **Implementação:** 016 - Redesign Gerador de PUD e Loading
> **Spec:** [spec.md](./spec.md)
> **Progresso:** 4/4 tarefas concluídas (100%)
> **Última atualização:** 2026-06-17

---
## Legenda
- `[ ]` Pendente · `[x]` Concluída · `[!]` Bloqueada · `[-]` Cancelada
---
## Tarefas
### Fase 1: Implementação
- [x] **T-001:** Re-skin `pud/new/page.tsx` (header emblema, título, wrapper loading)
  - **Arquivos:** `app/pud/new/page.tsx` · **Critério:** RF-004 (wrapper) · **Dep:** 012 · **Est:** Pequena
- [x] **T-002:** Re-skin `StepForm` (trilha ondulada + card sticker + campos)
  - **Arquivos:** `components/StepForm.tsx` · **Critério:** RF-001..RF-003, CA-001 · **Dep:** 012 · **Est:** Grande
- [x] **T-003:** Re-skin `LoadingScout` (onda draw + emblema girando)
  - **Arquivos:** `components/LoadingScout.tsx` · **Critério:** RF-004 · **Dep:** 012 · **Est:** Média
### Fase 2: Validação
- [x] **T-004:** `tsc --noEmit` + `next build`
  - **Critério:** CA-003 · **Dep:** T-001..T-003 · **Est:** Pequena
---
## Registro de Progresso
| Tarefa | Status | Data | Observações |
|--------|--------|------|-------------|
| T-001 | 🟢 Concluída | 2026-06-17 | Header/loading wrapper |
| T-002 | 🟢 Concluída | 2026-06-17 | Wizard sticker, RHF preservado |
| T-003 | 🟢 Concluída | 2026-06-17 | Loading do design |
| T-004 | 🟢 Concluída | 2026-06-17 | build ok |
---
> **📌 NOTA:** Atualizar ao concluir cada tarefa.
