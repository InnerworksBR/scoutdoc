# 001 - Sugestões e Boas-vindas Configuráveis por Agente

> **ID:** 001
> **Status:** 🟢 Concluída
> **Prioridade:** 🟠 Alta
> **Criada em:** 2026-06-16
> **Última atualização:** 2026-06-16
> **Autor:** Agente AI

---

## 1. Resumo Executivo

Esta implementação torna configuráveis, por agente, dois elementos hoje fixos no estado vazio (empty state) do chat: a **mensagem de boas-vindas** (`welcome_message`) e a **lista de sugestões de pergunta** (`suggestions`). Atualmente o componente `components/ChatInterface.tsx` usa um array hardcoded (`const SUGGESTED`, ~linha 31) com 3 frases idênticas para todos os agentes, e não exibe nenhuma saudação personalizada além de `agentName` e `agentDescription`.

O escopo cobre: uma migration SQL adicionando as colunas `welcome_message text` e `suggestions jsonb` à tabela `agents`; a extensão do formulário `components/admin/AgentForm.tsx` com um campo de texto para boas-vindas e um editor de lista (adicionar/remover sugestões); a atualização das rotas `POST /api/admin/agents` e `PUT /api/admin/agents/[id]` para aceitar e persistir os novos campos; a inclusão dos campos no `select` de `app/assistants/[agentId]/page.tsx`; e a passagem das props `welcomeMessage` e `suggestions` ao `ChatInterface`, que passa a usá-las no empty state com fallback para o array atual quando não configuradas.

## 2. Contexto e Motivação

### 2.1 Problema Atual

O empty state do chat exibe `agentName`, `agentDescription` e três botões de sugestão renderizados a partir de `const SUGGESTED` em `components/ChatInterface.tsx` (~linha 31). Esse array é hardcoded e compartilhado por todos os agentes, independentemente do propósito de cada um. Não existe nenhum mecanismo para um administrador personalizar nem a saudação inicial nem as perguntas sugeridas por agente — o `AgentForm.tsx` só expõe `name`, `description`, `system_prompt`, `avatar_color` e `is_active`.

### 2.2 Impacto do Problema

- **Experiência genérica:** um agente de "Programa de Atividades" e um de "Documentação Administrativa" oferecem exatamente as mesmas sugestões, que muitas vezes não fazem sentido para o domínio do agente.
- **Onboarding fraco:** sem boas-vindas personalizada, o chefe escoteiro não recebe orientação sobre o que aquele agente específico pode fazer.
- **Manutenção centralizada:** qualquer ajuste nas sugestões exige alteração de código e novo deploy, em vez de configuração via painel admin.
- **Subutilização dos agentes:** sugestões bem direcionadas aumentam a taxa de primeira interação; o estado atual desperdiça essa oportunidade.

### 2.3 Soluções Consideradas

| Solução | Prós | Contras | Decisão |
| --- | --- | --- | --- |
| Manter `SUGGESTED` hardcoded | Zero esforço; nenhum risco | Não resolve o problema; sem personalização | ❌ Rejeitada |
| Colunas `welcome_message text` + `suggestions jsonb` na tabela `agents` | Personalização por agente; sem nova tabela; jsonb suporta array de strings nativamente; fallback simples | Requer migration e ajustes em form/API/UI | ✅ Adotada |
| Coluna `suggestions text[]` (array nativo Postgres) | Tipo semântico mais forte para lista de strings | Menos flexível para evolução (ex.: objetos com label+prompt); supabase-js serializa array nativo de forma menos previsível que jsonb | ❌ Rejeitada (jsonb preferido pela flexibilidade) |
| Tabela separada `agent_suggestions` (1:N) | Normalização; ordenação explícita por coluna | Overhead de joins e RLS adicional para um caso de uso simples (lista curta de strings) | ❌ Rejeitada (over-engineering) |

## 3. Especificação Técnica

### 3.1 Visão Geral da Arquitetura

O fluxo é o de leitura/escrita de configuração de agente já existente, estendido com dois campos:

- **Escrita (admin):** `AgentForm.tsx` coleta `welcome_message` e `suggestions` → `fetch` para `POST /api/admin/agents` ou `PUT /api/admin/agents/[id]` → handlers (protegidos por `requireAdmin`) validam e persistem na tabela `agents`.
- **Leitura (usuário):** `app/assistants/[agentId]/page.tsx` (Server Component) faz `select` incluindo as novas colunas → repassa como props `welcomeMessage` e `suggestions` ao `ChatInterface` → o empty state renderiza a saudação e os botões de sugestão, com fallback para os valores padrão quando ausentes.

### 3.2 Componentes Afetados

| Componente | Tipo | Ação | Descrição |
| --- | --- | --- | --- |
| `supabase/schema.sql` | Migration/Schema | Modificar | Adicionar colunas `welcome_message text` e `suggestions jsonb default '[]'::jsonb` à tabela `agents` |
| `app/api/admin/agents/route.ts` | Route Handler (POST) | Modificar | Ler, validar (zod) e inserir `welcome_message` e `suggestions` |
| `app/api/admin/agents/[id]/route.ts` | Route Handler (PUT) | Modificar | Ler, validar e atualizar `welcome_message` e `suggestions` |
| `components/admin/AgentForm.tsx` | Componente React (client) | Modificar | Adicionar textarea de boas-vindas e editor de lista de sugestões (adicionar/remover); incluir no body do fetch |
| `app/assistants/[agentId]/page.tsx` | Page (Server Component) | Modificar | Incluir `welcome_message, suggestions` no `select` e repassar como props |
| `components/ChatInterface.tsx` | Componente React (client) | Modificar | Receber props `welcomeMessage` e `suggestions`; usar no empty state com fallback para `SUGGESTED` |

### 3.3 Interfaces e Contratos

#### Entradas

- **Admin (AgentForm):**
  - `welcome_message`: string opcional (textarea), pode ser vazia.
  - `suggestions`: lista de strings (cada item não vazio após trim), gerenciada por controles de adicionar/remover.
- **Usuário (ChatInterface props):**
  - `welcomeMessage?: string | null`
  - `suggestions?: string[] | null`

#### Saídas

- **Empty state do chat:** quando `welcomeMessage` presente e não vazio, exibe-o como saudação; caso contrário, mantém comportamento atual (`agentName` + `agentDescription`).
- **Botões de sugestão:** renderizados a partir de `suggestions` quando o array tiver ≥ 1 item; caso contrário, fallback para `SUGGESTED`. Cada botão chama `sendMessage(texto)`.

#### Contratos de API

**`POST /api/admin/agents`** — Body JSON (campos novos em **negrito**):

```json
{
  "name": "string",
  "description": "string",
  "system_prompt": "string",
  "avatar_color": "string",
  "is_active": true,
  "welcome_message": "string | null",
  "suggestions": ["string", "string"]
}
```

**`PUT /api/admin/agents/[id]`** — mesmo shape do body acima.

- `welcome_message`: opcional; `null`/`""` aceitos (sem boas-vindas).
- `suggestions`: array de strings; default `[]`; itens vazios removidos na normalização; limite máximo recomendado de 6 itens (RNF-002).
- Resposta de sucesso: `200`/`201` com o registro do agente incluindo os novos campos. Erros de validação retornam `400` com mensagem; ausência de admin retorna o status já definido por `requireAdmin`.

### 3.4 Modelos de Dados

Tabela `agents` (colunas adicionadas):

| Coluna | Tipo | Nulável | Default | Descrição |
| --- | --- | --- | --- | --- |
| `welcome_message` | `text` | Sim | `NULL` | Saudação opcional exibida no empty state |
| `suggestions` | `jsonb` | Não | `'[]'::jsonb` | Array JSON de strings com perguntas sugeridas |

DDL prevista (em `supabase/schema.sql`):

```sql
ALTER TABLE agents
  ADD COLUMN IF NOT EXISTS welcome_message text,
  ADD COLUMN IF NOT EXISTS suggestions jsonb NOT NULL DEFAULT '[]'::jsonb;
```

As políticas RLS existentes (`agents_read_active` e `agents_admin_all`) cobrem as novas colunas sem alteração, pois operam em nível de linha. Leitura pública de usuários autenticados continua via `agents_read_active`; escrita continua restrita a admin.

### 3.5 Fluxo de Execução

1. **Configuração (admin):** admin abre `AgentForm` (criar ou editar) → preenche boas-vindas e adiciona/remove sugestões → submit dispara `fetch` POST/PUT com os novos campos no body.
2. **Persistência:** handler valida com zod, normaliza `suggestions` (trim + remoção de vazios + limite), executa insert/update na tabela `agents` via cliente Supabase admin.
3. **Carregamento (usuário):** ao acessar `app/assistants/[agentId]/page.tsx`, o `select` traz `id, name, description, avatar_color, welcome_message, suggestions` (e demais campos já usados).
4. **Renderização:** a page passa `welcomeMessage={agent.welcome_message}` e `suggestions={agent.suggestions}` ao `ChatInterface`.
5. **Empty state:** se houver conversa em andamento, nada muda; no estado vazio, o componente usa `welcomeMessage` (ou fallback) e renderiza os botões a partir de `suggestions` (ou `SUGGESTED`). Clique chama `sendMessage`.

### 3.6 Tratamento de Erros

- **Suggestions malformadas no banco (não-array):** `ChatInterface` aplica `Array.isArray(suggestions) ? suggestions : []` e, se vazio, cai no fallback `SUGGESTED`, evitando crash de render.
- **welcome_message vazia/`null`:** tratada como ausente; render mantém `agentName` + `agentDescription`.
- **Validação de API:** body inválido (tipo errado, `suggestions` não-array) → `400` com mensagem zod; não persiste.
- **Falha de persistência (erro Supabase):** handler retorna `500` com mensagem; o `AgentForm` exibe estado de erro e não navega.
- **Itens em branco/duplicados no editor:** normalizados (trim, descarte de vazios) antes do envio e novamente no servidor (defesa em profundidade).

## 4. Requisitos

### 4.1 Requisitos Funcionais

- **RF-001:** O admin deve poder definir uma `welcome_message` opcional por agente no `AgentForm`.
- **RF-002:** O admin deve poder adicionar, editar e remover itens de `suggestions` por agente no `AgentForm`.
- **RF-003:** As rotas `POST /api/admin/agents` e `PUT /api/admin/agents/[id]` devem aceitar e persistir `welcome_message` e `suggestions`.
- **RF-004:** A página `app/assistants/[agentId]/page.tsx` deve carregar `welcome_message` e `suggestions` no `select` e repassá-los ao `ChatInterface`.
- **RF-005:** O empty state do `ChatInterface` deve exibir `welcomeMessage` quando configurada, mantendo `agentName`/`agentDescription` caso contrário.
- **RF-006:** Os botões de sugestão devem ser renderizados a partir de `suggestions` quando houver ≥ 1 item, com fallback para o array `SUGGESTED` existente.
- **RF-007:** Cada botão de sugestão renderizado deve chamar `sendMessage` com o texto exato da sugestão.

### 4.2 Requisitos Não-Funcionais

- **RNF-001:** A migration deve ser idempotente (`ADD COLUMN IF NOT EXISTS`) e não destrutiva para dados existentes.
- **RNF-002:** O número de sugestões por agente deve ser limitado (recomendado: máximo 6) para preservar o layout do empty state.
- **RNF-003:** Nenhuma alteração de política RLS deve enfraquecer o acesso atual; leitura permanece restrita a usuários autenticados com `is_active`, escrita a admin.
- **RNF-004:** A tipagem TypeScript dos novos campos deve ser explícita e opcional/nulável onde aplicável, sem `any`.
- **RNF-005:** O empty state deve permanecer responsivo e acessível (botões focáveis, contraste conforme paleta `scout-*`/`azure-*`).

### 4.3 Restrições e Limitações

- Não há internacionalização das sugestões; o texto é livre, definido pelo admin em português.
- `suggestions` armazena apenas strings simples (sem label/ícone por item) nesta versão.
- Sem migração de dados retroativa: agentes existentes ficam com `welcome_message = NULL` e `suggestions = []`, usando os fallbacks.
- Não há reordenação por drag-and-drop nesta versão (apenas adicionar/remover).

## 5. Critérios de Aceitação

- [ ] **CA-001:** As colunas `welcome_message text` e `suggestions jsonb default '[]'` existem na tabela `agents` após aplicar a migration, sem perda de dados.
- [ ] **CA-002:** No `AgentForm`, é possível preencher boas-vindas e adicionar/remover sugestões, e os valores aparecem no body do fetch.
- [ ] **CA-003:** `POST /api/admin/agents` cria um agente com `welcome_message` e `suggestions` persistidos corretamente.
- [ ] **CA-004:** `PUT /api/admin/agents/[id]` atualiza `welcome_message` e `suggestions` de um agente existente.
- [ ] **CA-005:** Ao abrir um agente com `suggestions` configuradas, o empty state exibe exatamente essas sugestões (e não as do `SUGGESTED`).
- [ ] **CA-006:** Ao abrir um agente sem `suggestions`, o empty state exibe o fallback `SUGGESTED`.
- [ ] **CA-007:** Quando `welcome_message` está preenchida, ela aparece no empty state; quando vazia/`null`, mantém `agentName`/`agentDescription`.
- [ ] **CA-008:** Clicar em uma sugestão configurada chama `sendMessage` com o texto correto e inicia a conversa.
- [ ] **CA-009:** Body de API com `suggestions` não-array é rejeitado com `400` e não persiste.

## 6. Plano de Testes

### 6.1 Testes Unitários

- Validação zod do body: aceita `suggestions` array de strings; rejeita não-array; aceita `welcome_message` ausente/`null`.
- Normalização de `suggestions`: trim de itens, remoção de vazios, aplicação de limite máximo.
- Lógica de fallback no `ChatInterface`: dado `suggestions` vazio/`null`/não-array → usa `SUGGESTED`; dado array com itens → usa os itens.

### 6.2 Testes de Integração

- `POST /api/admin/agents` com novos campos persiste e retorna o registro completo.
- `PUT /api/admin/agents/[id]` atualiza apenas os campos enviados e mantém os demais.
- `app/assistants/[agentId]/page.tsx` retorna os novos campos no `select` e os repassa ao `ChatInterface`.
- Acesso negado a não-admin nas rotas de escrita (via `requireAdmin`).

### 6.3 Testes de Aceitação

- Fluxo end-to-end admin: criar agente com boas-vindas + 3 sugestões → abrir o chat do agente → verificar empty state.
- Editar agente existente para remover todas as sugestões → confirmar fallback `SUGGESTED` no empty state.

### 6.4 Casos de Borda

- `suggestions = []` (vazio) → fallback.
- `suggestions` com itens em branco ou só espaços → normalizados/removidos.
- `welcome_message` com string muito longa → layout não quebra (truncamento/wrap).
- `suggestions` com mais itens que o limite → excedentes descartados na normalização.
- Agente legado (pré-migration) sem os campos → usa defaults sem erro.
- Valor inesperado em `suggestions` no banco (ex.: objeto) → `Array.isArray` protege o render.

## 7. Riscos e Mitigações

| Risco | Probabilidade | Impacto | Mitigação |
| --- | --- | --- | --- |
| Migration aplicada parcialmente em produção | Baixa | Alto | DDL idempotente com `IF NOT EXISTS`; aplicar em staging antes |
| Serialização inconsistente de `jsonb` pelo supabase-js | Média | Médio | Padronizar como array de strings; validar com zod no servidor e `Array.isArray` no cliente |
| Layout do empty state quebrar com muitas sugestões | Média | Baixo | Limitar a 6 itens (RNF-002); wrap/scroll responsivo |
| Regressão no empty state para agentes legados | Baixa | Médio | Fallback obrigatório para `SUGGESTED`; testes CA-006 |
| Esquecer de incluir os campos no `select` da page | Média | Médio | Checklist em tasks (T de frontend chat) + teste de integração |

## 8. Dependências

### 8.1 Dependências Internas

- `utils/supabase/admin.ts` (`requireAdmin`) para proteção das rotas de escrita.
- Cliente Supabase (server) usado em `app/assistants/[agentId]/page.tsx` e nas rotas admin.
- Estrutura existente de `AgentForm.tsx` e do empty state em `ChatInterface.tsx`.
- Paleta CSS `scout-*` / `azure-*` / `gold-*` / `cream-*` para estilização consistente.

### 8.2 Dependências Externas

- `zod` (validação de body já usada no projeto).
- `@supabase/*` (Auth/Postgres/Storage).
- Next.js 16 (App Router), React 19, TypeScript, Tailwind CSS v4 — sem novas dependências de pacote.

## 9. Observações e Decisões de Design

- **jsonb sobre text[]:** escolhido por flexibilidade futura (ex.: evoluir cada sugestão para objeto `{ label, prompt }`) e por serialização mais previsível com supabase-js. Decisão registrada em 2.3.
- **Fallback duplo:** o array `SUGGESTED` existente é preservado como fallback no `ChatInterface`, garantindo retrocompatibilidade total para agentes sem configuração.
- **Normalização em dois pontos:** cliente (UX imediata) e servidor (segurança/consistência), seguindo defesa em profundidade.
- **Sem nova tabela:** mantém a complexidade baixa; RLS atual cobre os campos sem novas políticas.
- **welcome_message nulável:** ausência é um estado válido e comum; não há valor default de texto para não impor uma saudação genérica.
