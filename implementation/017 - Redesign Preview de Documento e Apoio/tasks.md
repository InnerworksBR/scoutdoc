# Tarefas: Redesign Preview de Documento & Apoio

> **Implementação:** 017 - Redesign Preview de Documento e Apoio
> **Spec:** [spec.md](./spec.md)
> **Progresso:** 2/2 tarefas concluídas (100%)
> **Última atualização:** 2026-06-17

---
## Legenda
- `[ ]` Pendente · `[x]` Concluída · `[!]` Bloqueada · `[-]` Cancelada
---
## Tarefas
### Fase 1: Implementação
- [x] **T-001:** Re-skin `PreviewModal` (sticker, faixa-gradiente, selo "APROVADO", export)
  - **Arquivos:** `components/PreviewModal.tsx` · **Critério:** RF-001, RF-002, CA-001/CA-002 · **Dep:** 012 · **Est:** Média
### Fase 2: Validação
- [x] **T-002:** `tsc --noEmit` + `next build` (cobre perfil/admin herdando o tema)
  - **Critério:** CA-003 · **Dep:** T-001 · **Est:** Pequena
---
## Registro de Progresso
| Tarefa | Status | Data | Observações |
|--------|--------|------|-------------|
| T-001 | 🟢 Concluída | 2026-06-17 | Modal sticker + selo |
| T-002 | 🟢 Concluída | 2026-06-17 | build ok |
---
> **📌 NOTA:** Atualizar ao concluir cada tarefa.
