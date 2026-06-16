# Tarefas: Geração Livre de Documentos pelo System Prompt

> **Implementação:** 009 - Geração Livre de Documentos pelo System Prompt
> **Spec:** [spec.md](./spec.md)
> **Progresso:** 6/6 tarefas concluídas (100%)
> **Última atualização:** 2026-06-16

---

## Legenda
- `[ ]` Pendente · `[x]` Concluída · `[!]` Bloqueada · `[-]` Cancelada

---

## Tarefas

- [x] **T-001:** Conversor `lib/markdown-to-model.ts` (Markdown → seções do motor 003)
- [x] **T-002:** `generateFreeformDocument` em `lib/ai.ts` (documento em Markdown via gpt-4o)
- [x] **T-003:** Ramificar a rota `document/route.ts` entre livre (padrão) e estruturado
- [x] **T-004:** Tornar `document_template` opcional nas rotas admin (POST/PUT)
- [x] **T-005:** Simplificar `AgentForm` — remover editor de seções, manter toggle + título + nota
- [x] **T-006:** Validação (tsc + build) e documentação

---

## Registro de Progresso

| Tarefa | Descrição curta | Status | Estimativa |
| --- | --- | --- | --- |
| T-001 | markdown-to-model.ts | ✅ Concluída | 🟡 Média |
| T-002 | generateFreeformDocument | ✅ Concluída | 🟡 Média |
| T-003 | Ramificação da rota de documento | ✅ Concluída | 🟡 Média |
| T-004 | Template opcional no admin | ✅ Concluída | 🟢 Baixa |
| T-005 | AgentForm simplificado | ✅ Concluída | 🟡 Média |
| T-006 | tsc + build + docs | ✅ Concluída | 🟢 Baixa |
