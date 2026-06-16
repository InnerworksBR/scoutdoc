# 004 - Documentos Estruturados Configuráveis nos Agentes — Tarefas

> **ID:** 004
> **Status:** 🟡 Planejada
> **Prioridade:** 🟠 Alta
> **Criada em:** 2026-06-16
> **Última atualização:** 2026-06-16
> **Autor:** Agente AI
> **Spec relacionada:** [spec.md](./spec.md)

---

## Legenda

**Status da tarefa:** ⬜ Pendente · 🔵 Em Andamento · ✅ Concluída · 🔴 Bloqueada · ⚪ Cancelada

**Estimativa:** 🟢 Baixa (< 2h) · 🟡 Média (2–4h) · 🟠 Alta (4–8h) · 🔴 Muito Alta (> 8h)

**Pré-requisitos globais:** Impl. 003 (motor de documentos + PDF) e Impl. 002 (citação de fontes) concluídas.

---

## Fase 1 — Banco / Migration

### T-001 — Migration: novos campos de documento na tabela `agents`

- **Descrição:** Adicionar as colunas `produces_document boolean not null default false`, `document_template jsonb` e `document_title text` à tabela `agents`, de forma idempotente.
- **Arquivos envolvidos:** `supabase/schema.sql`
- **Critério de conclusão:** Migration aplicada sem erro; colunas presentes com defaults corretos; dados existentes preservados; RLS atual continua cobrindo as colunas.
- **Dependências:** —
- **Estimativa:** 🟢 Baixa
- **Observações:** Usar `ADD COLUMN IF NOT EXISTS`. Não criar tabela nova (decisão da spec 2.3).

---

## Fase 2 — Backend Geração

### T-002 — Tipos e validação do template (`lib/document-template.ts`)

- **Descrição:** Criar `DocumentTemplate` e `DocumentSection` (tipos `texto|lista|tabela`, `columns` para tabela) e o schema zod correspondente, incluindo validação condicional (sections ≥ 1, `columns` obrigatório em tabela).
- **Arquivos envolvidos:** `lib/document-template.ts`
- **Critério de conclusão:** Schema valida templates corretos e rejeita inválidos (tabela sem colunas, tipo desconhecido, sections vazio); tipos exportados e sem `any`.
- **Dependências:** —
- **Estimativa:** 🟡 Média
- **Observações:** Base reutilizada por admin e pela rota de geração (defesa em profundidade).

### T-003 — Mapeador JSON dinâmico → seções do motor (impl. 003)

- **Descrição:** Implementar função que converte o JSON estruturado retornado pelo modelo nas seções genéricas aceitas pelo motor da impl. 003 (`texto`→parágrafo, `lista`→bullets, `tabela`→tabela), anexando seção de Fontes a partir de `citations`.
- **Arquivos envolvidos:** `lib/document-template.ts`, `lib/document-engine.ts` (consumo)
- **Critério de conclusão:** Dado um JSON válido, retorna estrutura de seções renderizável; trata `rows`/`value` ausentes com defaults seguros (sem crash).
- **Dependências:** T-002, Impl. 003
- **Estimativa:** 🟠 Alta
- **Observações:** Adaptador isolado para proteger contra mudanças na API da 003.

### T-004 — Geração estruturada via gpt-4o (`generateStructuredDocument`)

- **Descrição:** Adicionar a `lib/ai.ts` a função `generateStructuredDocument(template, history, docs)` que deriva o system prompt do template + histórico + documentos, chama `gpt-4o` com `response_format: { type: "json_object" }`, faz parse e validação contra o template, com 1 retry em caso de não conformidade.
- **Arquivos envolvidos:** `lib/ai.ts`, `lib/document-template.ts`
- **Critério de conclusão:** Retorna JSON validado conforme o template; em divergência persistente lança erro tratável (mapeado para 422); segue padrão de `generatePUD`.
- **Dependências:** T-002
- **Estimativa:** 🟠 Alta
- **Observações:** Prompt deve instruir citação apenas de `name` real de `agent_documents` (impl. 002), sem fabricar fontes.

### T-005 — Nova rota `POST /api/chat/[agentId]/document`

- **Descrição:** Criar a rota que autentica o usuário, busca agente (`is_active`) + `agent_documents` + histórico de `messages` da conversa, chama `generateStructuredDocument`, mapeia para seções e gera DOCX/PDF via motor da 003; suporta `preview`.
- **Arquivos envolvidos:** `app/api/chat/[agentId]/document/route.ts`, `lib/ai.ts`, `lib/document-template.ts`, `lib/pdf-generator.ts`
- **Critério de conclusão:** Retorna binário com `Content-Disposition` correto (DOCX/PDF) ou JSON de preview; trata todos os erros da spec 3.6 com os status corretos.
- **Dependências:** T-003, T-004, Impl. 003, Impl. 002
- **Estimativa:** 🟠 Alta
- **Observações:** Reusar padrão de coleta de contexto de `app/api/chat/[agentId]/route.ts`; limite de histórico alinhado ao chat.

---

## Fase 3 — Admin Config

### T-006 — Validação dos novos campos nas rotas admin

- **Descrição:** Estender `POST /api/admin/agents` e `PUT /api/admin/agents/[id]` para ler, validar (zod, condicional ao `produces_document`) e persistir `produces_document`, `document_template` e `document_title`.
- **Arquivos envolvidos:** `app/api/admin/agents/route.ts`, `app/api/admin/agents/[id]/route.ts`, `lib/document-template.ts`
- **Critério de conclusão:** Campos persistidos corretamente; template inválido com `produces_document = true` retorna `400`; rotas seguem protegidas por `requireAdmin`.
- **Dependências:** T-001, T-002
- **Estimativa:** 🟡 Média
- **Observações:** Reusar o schema zod de T-002.

### T-007 — Toggle e editor de template no `AgentForm`

- **Descrição:** Adicionar ao `AgentForm` o toggle "Este agente gera documento", o campo `document_title` e o editor de `document_template` (adicionar/remover seções; campos rótulo, instrução, tipo; colunas para tabela), incluindo tudo no body do fetch.
- **Arquivos envolvidos:** `components/admin/AgentForm.tsx`
- **Critério de conclusão:** Toggle revela/oculta o editor; é possível criar seções dos 3 tipos; validação inline impede salvar template inválido; valores chegam no fetch.
- **Dependências:** T-006
- **Estimativa:** 🟠 Alta
- **Observações:** Reaproveitar padrão visual e paleta do form atual (`scout-*`/`azure-*`/`gold-*`/`cream-*`).

---

## Fase 4 — Frontend Chat

### T-008 — Carregar campos na página do assistente

- **Descrição:** Incluir `produces_document, document_template, document_title` no `select` de `app/assistants/[agentId]/page.tsx` e repassá-los como props ao `ChatInterface`.
- **Arquivos envolvidos:** `app/assistants/[agentId]/page.tsx`, `components/ChatInterface.tsx` (props)
- **Critério de conclusão:** Os três campos chegam ao `ChatInterface` como props tipadas.
- **Dependências:** T-001
- **Estimativa:** 🟢 Baixa
- **Observações:** Tipagem explícita, nulável onde aplicável.

### T-009 — Botão "Gerar documento" no `ChatInterface`

- **Descrição:** Renderizar o botão somente quando `producesDocument = true`, desabilitado em conversa vazia; ao clicar, chamar `POST /api/chat/[agentId]/document` com `conversationId` e `format`, com estados de loading e erro.
- **Arquivos envolvidos:** `components/ChatInterface.tsx`
- **Critério de conclusão:** Botão visível só para agentes produtores; chamada disparada corretamente; feedback de loading/erro; não trava a UI do chat.
- **Dependências:** T-005, T-008
- **Estimativa:** 🟡 Média
- **Observações:** Usar `lucide-react` para ícone; respeitar acessibilidade (foco/contraste).

### T-010 — Preview e download do documento

- **Descrição:** Integrar `PreviewModal` para exibir o documento (via `preview: true`) antes do download; ao confirmar, baixar o binário (DOCX/PDF) com nome derivado de `document_title`/`template.title`.
- **Arquivos envolvidos:** `components/ChatInterface.tsx`, `components/PreviewModal.tsx`
- **Critério de conclusão:** Preview exibe o conteúdo estruturado; download gera arquivo com nome e extensão corretos; opção DOCX e PDF funcionam.
- **Dependências:** T-009
- **Estimativa:** 🟡 Média
- **Observações:** Reusar `PreviewModal` da impl. 003 quando disponível.

---

## Fase 5 — Testes

### T-011 — Testes unitários (template, mapeador, prompt)

- **Descrição:** Cobrir validação zod do template, mapeamento JSON→seções (incl. defaults seguros), derivação do system prompt e resolução do nome de arquivo.
- **Arquivos envolvidos:** `lib/document-template.ts`, `lib/ai.ts` (testes)
- **Critério de conclusão:** Casos da spec 6.1 e 6.4 cobertos e passando.
- **Dependências:** T-002, T-003, T-004
- **Estimativa:** 🟡 Média
- **Observações:** Mockar OpenAI nos testes de prompt/geração.

### T-012 — Testes de integração (rotas e geração)

- **Descrição:** Testar persistência admin dos campos, `select` da página, e a rota de geração (DOCX e PDF) com OpenAI mockado, incluindo citações e autorização.
- **Arquivos envolvidos:** `app/api/admin/agents/*`, `app/api/chat/[agentId]/document/route.ts`, `app/assistants/[agentId]/page.tsx` (testes)
- **Critério de conclusão:** Casos da spec 6.2 cobertos; DOCX e PDF válidos gerados; agente sem docs não fabrica citações.
- **Dependências:** T-005, T-006
- **Estimativa:** 🟠 Alta
- **Observações:** Verificar status de erro (400/401/404/422/500) conforme spec 3.6.

### T-013 — Teste de aceitação end-to-end

- **Descrição:** Fluxo completo: criar agente produtor de documento → conversar → gerar (preview) → baixar DOCX e PDF → conferir estrutura e fontes.
- **Arquivos envolvidos:** —
- **Critério de conclusão:** Critérios CA-001 a CA-011 verificados manualmente; documento abre corretamente no Word e em leitor de PDF.
- **Dependências:** T-007, T-010, T-012
- **Estimativa:** 🟡 Média
- **Observações:** Validar caso de borda de conversa vazia e template inválido.

---

## Registro de Progresso

| Tarefa | Fase | Descrição curta | Status | Estimativa |
| --- | --- | --- | --- | --- |
| T-001 | Banco/Migration | Colunas de documento em `agents` | ⬜ Pendente | 🟢 Baixa |
| T-002 | Backend Geração | Tipos + validação do template | ⬜ Pendente | 🟡 Média |
| T-003 | Backend Geração | Mapeador JSON → seções (003) | ⬜ Pendente | 🟠 Alta |
| T-004 | Backend Geração | `generateStructuredDocument` (gpt-4o) | ⬜ Pendente | 🟠 Alta |
| T-005 | Backend Geração | Rota `POST .../document` | ⬜ Pendente | 🟠 Alta |
| T-006 | Admin Config | Validação nas rotas admin | ⬜ Pendente | 🟡 Média |
| T-007 | Admin Config | Toggle + editor no `AgentForm` | ⬜ Pendente | 🟠 Alta |
| T-008 | Frontend Chat | Carregar campos na página | ⬜ Pendente | 🟢 Baixa |
| T-009 | Frontend Chat | Botão "Gerar documento" | ⬜ Pendente | 🟡 Média |
| T-010 | Frontend Chat | Preview + download | ⬜ Pendente | 🟡 Média |
| T-011 | Testes | Unitários (template/mapeador/prompt) | ⬜ Pendente | 🟡 Média |
| T-012 | Testes | Integração (rotas/geração) | ⬜ Pendente | 🟠 Alta |
| T-013 | Testes | Aceitação end-to-end | ⬜ Pendente | 🟡 Média |
