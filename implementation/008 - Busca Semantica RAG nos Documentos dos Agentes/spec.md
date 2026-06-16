# Busca Semântica (RAG) nos Documentos dos Agentes

> **ID:** 008
> **Status:** 🟢 Concluída
> **Prioridade:** 🔴 Crítica
> **Criada em:** 2026-06-16
> **Última atualização:** 2026-06-16
> **Autor:** Agente AI

---

## 1. Resumo Executivo

Substituir o método atual de contexto dos agentes — que despeja o texto inteiro de cada documento (truncado em 8000 caracteres) no system prompt a cada mensagem — por um pipeline de **RAG (Retrieval-Augmented Generation)** com busca vetorial. Os documentos passam a ser quebrados em trechos (chunks), indexados com embeddings da OpenAI (`text-embedding-3-small`) e armazenados em `pgvector` no Supabase. A cada pergunta, apenas os trechos mais relevantes são recuperados e injetados no prompt. Isso replica fielmente o comportamento dos Custom GPTs do ChatGPT, garantindo respostas precisas mesmo com muitos arquivos ou arquivos grandes.

## 2. Contexto e Motivação

### 2.1 Problema Atual

O objetivo do produto é replicar os Custom GPTs do ChatGPT numa plataforma própria. No ChatGPT, a funcionalidade de "Knowledge" usa RAG: os arquivos são fragmentados e indexados, e cada pergunta recupera apenas os trechos relevantes.

Hoje, em `app/api/chat/[agentId]/route.ts`, o contexto é montado assim:

```ts
const MAX_CHARS_PER_DOC = 8000;
// pega content_text de cada doc, corta em 8000 chars, junta TODOS no system prompt
```

`8000 caracteres ≈ 1.300 palavras ≈ ~3 páginas`. Para um agente com um PDF de 50 páginas, **~47 páginas são descartadas** — o modelo nunca as vê.

### 2.2 Impacto do Problema

- **Perda de fidelidade:** com arquivos grandes/muitos arquivos, o agente responde de forma incompleta ou incorreta, diferente do ChatGPT — exatamente a queixa do cliente.
- **Custo:** envia o início de todos os documentos em toda mensagem, inflando tokens.
- **Ruído:** sem ranqueamento por relevância, o modelo recebe conteúdo irrelevante.

### 2.3 Soluções Consideradas

| Solução | Prós | Contras | Decisão |
|---------|------|---------|---------|
| RAG com `pgvector` no Supabase + embeddings OpenAI | Replica fielmente o ChatGPT; escala para muitos/grandes arquivos; baixo custo; mantém citações | Exige nova tabela, extensão e pipeline de ingestão/busca | ✅ Escolhida |
| Aumentar `MAX_CHARS_PER_DOC` / mandar tudo | Trivial | Estoura janela de contexto; caro; ainda perde conteúdo; não ranqueia | ❌ Descartada |
| Serviço externo de vetores (Pinecone, etc.) | Gerenciado | Custo/infra extra; o Supabase já tem pgvector | ❌ Descartada |

## 3. Especificação Técnica

### 3.1 Visão Geral da Arquitetura

```
INGESTÃO (no upload do documento)
  texto extraído ─► chunkText() ─► embedTexts() (OpenAI) ─► insert em agent_document_chunks (vector)

BUSCA (a cada mensagem do chat)
  pergunta do usuário ─► embedQuery() ─► rpc match_agent_chunks(agent_id, embedding, k)
                       ─► top-K trechos relevantes ─► system prompt ─► gpt-4o (stream)
```

### 3.2 Componentes Afetados

| Componente | Tipo | Ação | Descrição |
|-----------|------|------|-----------|
| `supabase/schema.sql` | Schema | Modificar | Migração 008: extensão `vector`, tabela `agent_document_chunks`, índice HNSW, função `match_agent_chunks`, RLS |
| `lib/rag.ts` | Arquivo | Criar | `chunkText`, `embedTexts`, `embedQuery`, constantes do modelo |
| `app/api/admin/agents/[id]/documents/route.ts` | Arquivo | Modificar | Indexar (chunk+embed) ao salvar documento |
| `app/api/admin/agents/[id]/documents/reindex/route.ts` | Arquivo | Criar | Reindexar documentos existentes (legados) |
| `app/api/chat/[agentId]/route.ts` | Arquivo | Modificar | Recuperar trechos por similaridade; fallback ao método antigo |
| `components/admin/DocumentManager.tsx` | Arquivo | Modificar | Botão "Reindexar para busca" + status de indexação |
| `app/admin/agents/[id]/documents/page.tsx` | Arquivo | Modificar | Texto explicativo atualizado |

### 3.3 Interfaces e Contratos

#### `lib/rag.ts`
- `chunkText(text: string, opts?): string[]` — fragmenta respeitando parágrafos, com sobreposição.
- `embedTexts(texts: string[]): Promise<number[][]>` — embeddings em lote.
- `embedQuery(query: string): Promise<number[]>` — embedding de uma pergunta.

#### RPC `match_agent_chunks(p_agent_id uuid, p_query_embedding vector(1536), p_match_count int)`
Retorna `{ id, document_id, content, name, similarity }` ordenado por similaridade.

#### `POST /api/admin/agents/[id]/documents/reindex`
- Auth: `requireAdmin`.
- Para cada `agent_document` com `content_text`: apaga chunks antigos, refaz chunk+embed+insert.
- Retorna `{ documents: n, chunks: m }`.

### 3.4 Modelos de Dados

```sql
create extension if not exists vector;

create table agent_document_chunks (
  id uuid primary key default gen_random_uuid(),
  document_id uuid references agent_documents(id) on delete cascade not null,
  agent_id   uuid references agents(id) on delete cascade not null,
  chunk_index int not null,
  content text not null,
  embedding vector(1536),
  created_at timestamptz default now() not null
);
```
- Embedding: `text-embedding-3-small` → 1536 dimensões.
- Índice HNSW (`vector_cosine_ops`) para busca aproximada rápida.
- `on delete cascade` remove chunks ao remover documento/agente.

### 3.5 Fluxo de Execução

1. **Upload:** admin sobe PDF/TXT → texto é extraído (já existe) → `chunkText` → `embedTexts` → insert em `agent_document_chunks`.
2. **Reindex (legados):** admin clica "Reindexar" → endpoint reprocessa todos os documentos com `content_text`.
3. **Chat:** usuário pergunta → `embedQuery` → `match_agent_chunks` (top-K) → trechos com rótulo `[Fonte: nome]` no system prompt → `gpt-4o` responde com citações.
4. **Fallback:** se o agente ainda não tem chunks, usa o método antigo (texto truncado) para não quebrar nada.

### 3.6 Tratamento de Erros

- Falha de embedding no upload → documento é salvo mesmo assim (não bloqueia); reindex permite repetir.
- Falha de embedding no chat → cai no fallback de texto truncado.
- Sem documentos/chunks → prompt instrui o modelo a não citar fontes (comportamento atual).
- Mensagem só com imagem (sem texto) → pula a recuperação.

## 4. Requisitos

### 4.1 Requisitos Funcionais

- **RF-001:** Documentos são fragmentados e indexados com embeddings ao serem salvos.
- **RF-002:** Existe endpoint para reindexar documentos já existentes.
- **RF-003:** O chat recupera apenas os trechos relevantes por similaridade vetorial.
- **RF-004:** Citações `[Fonte: nome]` continuam funcionando a partir dos trechos recuperados.
- **RF-005:** Fallback automático ao método antigo quando não há chunks indexados.
- **RF-006:** Remoção de documento remove seus chunks (cascade).

### 4.2 Requisitos Não-Funcionais

- **RNF-001:** Modelo de embedding `text-embedding-3-small` (1536 dim) com a `OPENAI_API_KEY` existente.
- **RNF-002:** Busca vetorial com índice HNSW; recuperação de top-K (default 8).
- **RNF-003:** Indexação em lote (batch) para conter latência e custo.
- **RNF-004:** RLS consistente com `agent_documents` (leitura autenticada; escrita admin).

### 4.3 Restrições e Limitações

- Não migrar para serviço de vetores externo; usar `pgvector` do Supabase.
- Reaproveitar a extração de texto existente (`unpdf`) e a coluna `content_text`.
- Indexação inline no upload (sem fila/worker dedicado nesta entrega).

## 5. Critérios de Aceitação

- [ ] **CA-001:** Migração 008 cria extensão, tabela, índice e função sem erro e idempotente.
- [ ] **CA-002:** Upload de um PDF grande gera múltiplos chunks com embeddings.
- [ ] **CA-003:** Pergunta sobre conteúdo da página 40 de um PDF de 50 páginas é respondida corretamente (antes falhava).
- [ ] **CA-004:** O system prompt no chat contém apenas os trechos recuperados, não o documento inteiro.
- [ ] **CA-005:** Citações `[Fonte: nome]` aparecem corretamente nas respostas.
- [ ] **CA-006:** Botão "Reindexar" processa documentos legados e passa a respondê-los via RAG.
- [ ] **CA-007:** Agente sem chunks ainda responde (fallback) sem erro.
- [ ] **CA-008:** Remover documento remove seus chunks.

## 6. Plano de Testes

### 6.1 Testes Unitários
- `chunkText`: respeita limite/sobreposição; lida com texto curto, parágrafo gigante, vazio.
- `embedTexts`/`embedQuery`: batelamento e formato (mock da OpenAI).

### 6.2 Testes de Integração
- Upload → chunks persistidos com dimensão correta.
- `match_agent_chunks` retorna trechos ordenados por similaridade para uma query.
- Chat usa RAG quando há chunks; usa fallback quando não há.
- Reindex recria chunks; delete de doc remove chunks.

### 6.3 Testes de Aceitação
- Recriar um Custom GPT real com PDFs grandes e comparar respostas com o ChatGPT.

### 6.4 Casos de Borda
- Documento sem texto extraível (PDF imagem) → sem chunks, sem crash.
- Pergunta sem relação com os docs → trechos de baixa similaridade; modelo não força citação.
- Reindex em agente com muitos documentos → batelamento; não estoura limites.
- Mensagem só com imagem → pula recuperação.

## 7. Riscos e Mitigações

| Risco | Probabilidade | Impacto | Mitigação |
|-------|--------------|---------|-----------|
| `pgvector`/HNSW indisponível na instância | Baixa | Alto | Supabase suporta; `create extension if not exists`; alternativa ivfflat |
| Timeout ao indexar arquivo enorme no serverless | Média | Médio | Batelamento; indexação não bloqueia upload; reindex para repetir |
| Custo de embeddings | Baixa | Baixo | `text-embedding-3-small` é barato; indexação só no upload/reindex |
| Recuperação ruim (K mal calibrado) | Média | Médio | K=8 default, ajustável; sobreposição nos chunks |

## 8. Dependências

### 8.1 Dependências Internas
- Extração de texto e CRUD de documentos (`documents/route.ts`, `unpdf`).
- Sistema de citações (impl. 002).
- Rota de chat (`chat/[agentId]/route.ts`).

### 8.2 Dependências Externas
- Supabase Postgres com extensão `vector` (pgvector).
- OpenAI Embeddings API (`text-embedding-3-small`).

## 9. Observações e Decisões de Design

- **`text-embedding-3-small` (1536 dim)** escolhido pelo equilíbrio custo/qualidade; pode-se migrar para `-large` (3072 dim) trocando a dimensão da coluna e reindexando.
- **Chunk ~2400 chars com ~300 de sobreposição** preserva contexto entre fronteiras sem inflar o número de vetores.
- **Fallback ao método antigo** garante retrocompatibilidade enquanto os documentos legados não são reindexados.
- A indexação é **inline no upload** nesta entrega; um worker/fila assíncrona fica como melhoria futura para arquivos muito grandes.

---

> **⚠️ NOTA:** Este documento é a fonte de verdade para esta implementação.
> Qualquer alteração no escopo deve ser refletida aqui ANTES de ser implementada.
