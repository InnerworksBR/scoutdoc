# Tarefas: 001 - Sugestões e Boas-vindas Configuráveis por Agente

> **Implementação:** 001 - Sugestões e Boas-vindas Configuráveis por Agente
> **Spec:** [spec.md](./spec.md)
> **Progresso:** 7/8 tarefas concluídas (87%)
> **Última atualização:** 2026-06-16

## Legenda
- `[ ]` Pendente · `[x]` Concluída · `[!]` Bloqueada · `[-]` Cancelada

## Tarefas

### Fase 1: Banco/Migration

- [x] **T-001:** Adicionar colunas `welcome_message` e `suggestions` à tabela `agents`
  - **Descrição:** Criar a migration idempotente que adiciona `welcome_message text` (nulável) e `suggestions jsonb NOT NULL DEFAULT '[]'::jsonb` à tabela `agents`. Confirmar que as políticas RLS `agents_read_active` e `agents_admin_all` continuam cobrindo as novas colunas sem alteração.
  - **Arquivos envolvidos:** `supabase/schema.sql`
  - **Critério de conclusão:** DDL com `ADD COLUMN IF NOT EXISTS` aplicada; colunas presentes; nenhum dado existente perdido; RLS inalterada (CA-001).
  - **Dependências:** Nenhuma
  - **Estimativa:** Pequena
  - **Observações:** Aplicar em staging antes de produção. Decisão jsonb vs text[] registrada na spec (2.3).

### Fase 2: Backend/API

- [x] **T-002:** Estender validação e shape do body nas rotas de agentes
  - **Descrição:** Atualizar o schema zod (ou validação equivalente) dos handlers para aceitar `welcome_message` (string opcional/nulável) e `suggestions` (array de strings, default `[]`). Rejeitar `suggestions` não-array com `400`.
  - **Arquivos envolvidos:** `app/api/admin/agents/route.ts`, `app/api/admin/agents/[id]/route.ts`
  - **Critério de conclusão:** Body válido aceito; `suggestions` não-array retorna `400` sem persistir (CA-009).
  - **Dependências:** T-001
  - **Estimativa:** Pequena
  - **Observações:** Reaproveitar o padrão de validação já existente nas rotas.

- [x] **T-003:** Persistir `welcome_message` e `suggestions` no insert/update
  - **Descrição:** Incluir os novos campos no insert do `POST` e no update do `PUT`. Aplicar normalização de `suggestions` no servidor (trim, descarte de vazios, limite máximo de 6). Garantir que `requireAdmin` continua protegendo ambos os handlers.
  - **Arquivos envolvidos:** `app/api/admin/agents/route.ts`, `app/api/admin/agents/[id]/route.ts`, `utils/supabase/admin.ts` (somente leitura/uso)
  - **Critério de conclusão:** POST cria e PUT atualiza os campos corretamente; normalização aplicada (CA-003, CA-004).
  - **Dependências:** T-002
  - **Estimativa:** Média
  - **Observações:** Normalização também no cliente (T-005); defesa em profundidade.

### Fase 3: Frontend Admin

- [x] **T-004:** Adicionar campo de boas-vindas no `AgentForm`
  - **Descrição:** Incluir um textarea para `welcome_message` no formulário, integrado ao `react-hook-form`, estilizado com a paleta `scout-*`/`cream-*`. Incluir o valor no body do `fetch` de criar/editar.
  - **Arquivos envolvidos:** `components/admin/AgentForm.tsx`
  - **Critério de conclusão:** Campo presente, editável, persistido via API; valor aparece no body do fetch (CA-002 parcial).
  - **Dependências:** T-003
  - **Estimativa:** Pequena
  - **Observações:** Campo opcional; vazio é estado válido.

- [x] **T-005:** Editor de lista de sugestões no `AgentForm`
  - **Descrição:** Implementar editor de `suggestions` com controles de adicionar e remover itens (cada item é um input de texto). Normalizar no cliente (trim, sem vazios) antes do envio e aplicar limite de 6 itens. Incluir o array no body do `fetch`.
  - **Arquivos envolvidos:** `components/admin/AgentForm.tsx`
  - **Critério de conclusão:** Admin adiciona/remove sugestões; array normalizado enviado no body; limite respeitado (CA-002).
  - **Dependências:** T-004
  - **Estimativa:** Média
  - **Observações:** Sem reordenação por drag-and-drop nesta versão.

### Fase 4: Frontend Chat

- [x] **T-006:** Carregar novos campos na page do assistente
  - **Descrição:** Atualizar o `select` em `app/assistants/[agentId]/page.tsx` para incluir `welcome_message, suggestions` (além de `id, name, description, avatar_color`) e repassar como props `welcomeMessage` e `suggestions` ao `ChatInterface`.
  - **Arquivos envolvidos:** `app/assistants/[agentId]/page.tsx`
  - **Critério de conclusão:** Campos retornados no `select` e repassados ao `ChatInterface` (RF-004).
  - **Dependências:** T-001
  - **Estimativa:** Pequena
  - **Observações:** Confirmar tipagem dos props na assinatura do componente (RNF-004).

- [x] **T-007:** Usar `welcomeMessage` e `suggestions` no empty state do `ChatInterface`
  - **Descrição:** Adicionar as props `welcomeMessage?: string | null` e `suggestions?: string[] | null` ao `ChatInterface`. No empty state: exibir `welcomeMessage` quando presente (senão manter `agentName`/`agentDescription`); renderizar botões a partir de `suggestions` quando `Array.isArray` e ≥ 1 item, com fallback para `SUGGESTED`. Cada botão chama `sendMessage` com o texto da sugestão.
  - **Arquivos envolvidos:** `components/ChatInterface.tsx`
  - **Critério de conclusão:** Empty state usa valores configurados com fallback correto; cliques chamam `sendMessage` (CA-005, CA-006, CA-007, CA-008).
  - **Dependências:** T-006
  - **Estimativa:** Média
  - **Observações:** Manter `const SUGGESTED` como fallback; proteger render com `Array.isArray`.

### Fase 5: Testes

- [ ] **T-008:** Testes unitários, integração e aceitação
  - **Descrição:** Cobrir: validação/normalização de `suggestions` (unit), persistência em POST/PUT (integração), `select` da page repassando campos (integração), e fluxos de aceitação (criar agente com boas-vindas + sugestões → empty state; remover sugestões → fallback). Incluir casos de borda da spec (6.4).
  - **Arquivos envolvidos:** Suíte de testes correspondente a `app/api/admin/agents/*`, `components/ChatInterface.tsx`, `components/admin/AgentForm.tsx`
  - **Critério de conclusão:** Todos os critérios CA-001..CA-009 verificados; casos de borda cobertos.
  - **Dependências:** T-003, T-005, T-007
  - **Estimativa:** Média
  - **Observações:** Priorizar testes de fallback e de validação `400`.

## Registro de Progresso

| Tarefa | Status | Data de Conclusão | Observações |
| --- | --- | --- | --- |
| T-001 | ✅ Concluída | 2026-06-16 | Migration das colunas `welcome_message` e `suggestions` em schema.sql |
| T-002 | ✅ Concluída | 2026-06-16 | Validação de tipo em route.ts (POST) e [id]/route.ts (PUT) |
| T-003 | ✅ Concluída | 2026-06-16 | normalizeSuggestions() + insert/update com novos campos |
| T-004 | ✅ Concluída | 2026-06-16 | Textarea welcome_message no AgentForm |
| T-005 | ✅ Concluída | 2026-06-16 | Editor de lista com add/remove no AgentForm |
| T-006 | ✅ Concluída | 2026-06-16 | select e props na page do assistente |
| T-007 | ✅ Concluída | 2026-06-16 | Empty state usando welcomeMessage/activeSuggestions com fallback |
| T-008 | ⬜ Pendente | — | Testes unit/integração/aceitação (sem suíte de testes no projeto) |
