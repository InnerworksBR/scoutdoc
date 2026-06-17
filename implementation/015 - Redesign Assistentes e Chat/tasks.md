# Tarefas: Redesign Assistentes & Chat

> **Implementação:** 015 - Redesign Assistentes e Chat
> **Spec:** [spec.md](./spec.md)
> **Progresso:** 4/4 tarefas concluídas (100%)
> **Última atualização:** 2026-06-17

---
## Legenda
- `[ ]` Pendente · `[x]` Concluída · `[!]` Bloqueada · `[-]` Cancelada
---
## Tarefas
### Fase 1: Implementação
- [x] **T-001:** Re-skin lista de assistentes
  - **Arquivos:** `app/assistants/page.tsx` · **Critério:** RF-001 · **Dep:** 012 · **Est:** Média
- [x] **T-002:** Re-skin `ChatInterface` (header, bolhas, sugestões, input, sidebar ink) preservando recursos
  - **Arquivos:** `components/ChatInterface.tsx` · **Critério:** RF-002..RF-005, CA-002 · **Dep:** 012 · **Est:** Grande
- [x] **T-003:** Ajustar fallback do `UserAvatar` à paleta nova
  - **Arquivos:** `components/UserAvatar.tsx` · **Critério:** RNF-001 · **Dep:** 012 · **Est:** Pequena
### Fase 2: Validação
- [x] **T-004:** `tsc --noEmit` + `next build`
  - **Critério:** CA-003 · **Dep:** T-001..T-003 · **Est:** Pequena
---
## Registro de Progresso
| Tarefa | Status | Data | Observações |
|--------|--------|------|-------------|
| T-001 | 🟢 Concluída | 2026-06-17 | Cards sticker |
| T-002 | 🟢 Concluída | 2026-06-17 | Recursos preservados |
| T-003 | 🟢 Concluída | 2026-06-17 | Fallback ink |
| T-004 | 🟢 Concluída | 2026-06-17 | build ok |
---
> **📌 NOTA:** Atualizar ao concluir cada tarefa.
