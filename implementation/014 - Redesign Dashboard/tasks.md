# Tarefas: Redesign Dashboard

> **Implementação:** 014 - Redesign Dashboard
> **Spec:** [spec.md](./spec.md)
> **Progresso:** 4/4 tarefas concluídas (100%)
> **Última atualização:** 2026-06-17

---
## Legenda
- `[ ]` Pendente · `[x]` Concluída · `[!]` Bloqueada · `[-]` Cancelada
---
## Tarefas
### Fase 1: Implementação
- [x] **T-001:** Reescrever `DashboardLayout` (hero+ondas, CTA, carrossel, seção docs)
  - **Arquivos:** `components/DashboardLayout.tsx` · **Critério:** RF-001..RF-004 · **Dep:** 012 · **Est:** Grande
- [x] **T-002:** Ajustar `DashboardClient` (busca + empty state sticker)
  - **Arquivos:** `components/DashboardClient.tsx` · **Critério:** RF-004, CA-002 · **Dep:** T-001 · **Est:** Pequena
- [x] **T-003:** Reescrever `DocumentCard` (sticker, status, menu/download)
  - **Arquivos:** `components/DocumentCard.tsx` · **Critério:** RF-005 · **Dep:** 012 · **Est:** Média
### Fase 2: Validação
- [x] **T-004:** `tsc --noEmit` + `next build`
  - **Critério:** CA-003 · **Dep:** T-001..T-003 · **Est:** Pequena
---
## Registro de Progresso
| Tarefa | Status | Data | Observações |
|--------|--------|------|-------------|
| T-001 | 🟢 Concluída | 2026-06-17 | Hero sticker + carrossel |
| T-002 | 🟢 Concluída | 2026-06-17 | Empty state sticker |
| T-003 | 🟢 Concluída | 2026-06-17 | Card sticker |
| T-004 | 🟢 Concluída | 2026-06-17 | build ok |
---
> **📌 NOTA:** Atualizar ao concluir cada tarefa.
