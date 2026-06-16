# Tarefas: Relevância e Limiar de Similaridade no RAG

> **Implementação:** 010 - Relevância e Limiar de Similaridade no RAG
> **Spec:** [spec.md](./spec.md)
> **Progresso:** 4/4 tarefas concluídas (100%)
> **Última atualização:** 2026-06-16

---

## Tarefas

- [x] **T-001:** Filtro por limiar de similaridade na recuperação (busca 12, usa até 6 acima do limiar)
- [x] **T-002:** Distinguir 3 estados (sem índice / relevante / nada relevante) e corrigir fallback
- [x] **T-003:** Instrução de citação mais rígida (só cita se o trecho responde)
- [x] **T-004:** Limiar configurável por env `RAG_MIN_SIMILARITY`; validação (tsc)

---

## Registro de Progresso

| Tarefa | Descrição curta | Status |
| --- | --- | --- |
| T-001 | Limiar de similaridade | ✅ Concluída |
| T-002 | 3 estados + fallback correto | ✅ Concluída |
| T-003 | Prompt de citação rígido | ✅ Concluída |
| T-004 | Env + validação | ✅ Concluída |
