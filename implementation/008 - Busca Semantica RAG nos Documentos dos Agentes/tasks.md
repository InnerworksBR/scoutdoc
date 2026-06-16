# Tarefas: Busca Semântica (RAG) nos Documentos dos Agentes

> **Implementação:** 008 - Busca Semântica (RAG) nos Documentos dos Agentes
> **Spec:** [spec.md](./spec.md)
> **Progresso:** 8/8 tarefas concluídas (100%)
> **Última atualização:** 2026-06-16

---

## Legenda
- `[ ]` Pendente · `[x]` Concluída · `[!]` Bloqueada · `[-]` Cancelada

---

## Tarefas

### Fase 1: Banco / pgvector

- [ ] **T-001:** Migração 008 — extensão, tabela de chunks, índice e função de busca
  - **Descrição:** Em `supabase/schema.sql`, habilitar `vector`, criar `agent_document_chunks` (com `embedding vector(1536)`), RLS consistente com `agent_documents`, índices (agent_id, document_id, HNSW vetorial) e a função `match_agent_chunks`. Tudo idempotente.
  - **Arquivos:** `supabase/schema.sql`
  - **Critério:** Roda sem erro; reexecutável; tabela/função presentes (CA-001).
  - **Dependências:** Nenhuma
  - **Estimativa:** Média

### Fase 2: Biblioteca RAG

- [ ] **T-002:** `lib/rag.ts` — chunking e embeddings
  - **Descrição:** Implementar `chunkText` (parágrafos + sobreposição), `embedTexts` (batch) e `embedQuery`, com constantes do modelo/dimensão.
  - **Arquivos:** `lib/rag.ts`
  - **Critério:** Funções tipadas, sem `any`; batelamento correto (RF-001, RNF-001/003).
  - **Dependências:** Nenhuma
  - **Estimativa:** Média

### Fase 3: Ingestão

- [ ] **T-003:** Indexar documento ao salvar
  - **Descrição:** Em `documents/route.ts` (POST), após obter `content_text`, gerar chunks+embeddings e inserir em `agent_document_chunks` (via service client). Não bloquear o upload em caso de falha.
  - **Arquivos:** `app/api/admin/agents/[id]/documents/route.ts`
  - **Critério:** Upload gera chunks; falha de indexação não quebra o upload (CA-002).
  - **Dependências:** T-001, T-002
  - **Estimativa:** Média

- [ ] **T-004:** Endpoint de reindexação de documentos legados
  - **Descrição:** Criar `POST /api/admin/agents/[id]/documents/reindex`: para cada documento com `content_text`, apagar chunks antigos e recriar. Retornar contagens.
  - **Arquivos:** `app/api/admin/agents/[id]/documents/reindex/route.ts`
  - **Critério:** Reindexa todos os documentos do agente; idempotente (CA-006).
  - **Dependências:** T-001, T-002
  - **Estimativa:** Média

### Fase 4: Recuperação no Chat

- [ ] **T-005:** Recuperar trechos por similaridade no chat
  - **Descrição:** Em `chat/[agentId]/route.ts`, embutir a pergunta, chamar `match_agent_chunks` (top-K), montar o contexto só com os trechos recuperados + rótulos de citação. Fallback ao método truncado quando não houver chunks. Pular recuperação se a mensagem for só imagem.
  - **Arquivos:** `app/api/chat/[agentId]/route.ts`
  - **Critério:** Prompt contém só trechos relevantes; citações ok; fallback funciona (CA-003, CA-004, CA-005, CA-007).
  - **Dependências:** T-001, T-002
  - **Estimativa:** Média

### Fase 5: Admin UI

- [ ] **T-006:** Botão "Reindexar para busca" + status no `DocumentManager`
  - **Descrição:** Adicionar botão que chama o endpoint de reindex, com loading e resultado (nº de documentos/chunks). Atualizar o texto explicativo da página de documentos.
  - **Arquivos:** `components/admin/DocumentManager.tsx`, `app/admin/agents/[id]/documents/page.tsx`
  - **Critério:** Admin reindexa pela UI e vê o resultado (CA-006).
  - **Dependências:** T-004
  - **Estimativa:** Pequena

### Fase 6: Validação

- [ ] **T-007:** Verificação técnica (tsc) e fluxo ponta a ponta
  - **Descrição:** `tsc --noEmit` limpo; subir um PDF grande, reindexar, perguntar sobre conteúdo profundo e conferir resposta + citação; remover doc e confirmar remoção de chunks.
  - **Arquivos:** —
  - **Critério:** CA-002..CA-008 verificados.
  - **Dependências:** T-003, T-004, T-005, T-006
  - **Estimativa:** Média

- [ ] **T-008:** Atualizar memória/índice de implementações
  - **Descrição:** Atualizar `implementation/README.md` (se houver) e a memória do projeto com o pipeline RAG.
  - **Arquivos:** `implementation/README.md`, memória
  - **Critério:** Documentação reflete o RAG como método de contexto vigente.
  - **Dependências:** T-007
  - **Estimativa:** Pequena

---

## Registro de Progresso

| Tarefa | Fase | Descrição curta | Status | Estimativa |
| --- | --- | --- | --- | --- |
| T-001 | Banco | Migração pgvector + tabela + função | ✅ Concluída | 🟡 Média |
| T-002 | Lib | `lib/rag.ts` chunking/embeddings | ✅ Concluída | 🟡 Média |
| T-003 | Ingestão | Indexar no upload | ✅ Concluída | 🟡 Média |
| T-004 | Ingestão | Endpoint de reindex | ✅ Concluída | 🟡 Média |
| T-005 | Chat | Recuperação por similaridade | ✅ Concluída | 🟡 Média |
| T-006 | Admin UI | Botão reindexar + status | ✅ Concluída | 🟢 Baixa |
| T-007 | Validação | tsc + fluxo e2e | ✅ Concluída | 🟡 Média |
| T-008 | Docs | Atualizar memória/índice | ✅ Concluída | 🟢 Baixa |
