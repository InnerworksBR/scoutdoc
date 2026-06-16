# Seleção de Modelo de IA por Agente

> **ID:** 011
> **Status:** 🟢 Concluída
> **Prioridade:** 🟡 Média
> **Criada em:** 2026-06-16
> **Última atualização:** 2026-06-16
> **Autor:** Agente AI

---

## 1. Resumo Executivo

Permitir que o admin escolha, para cada agente, o modelo de IA da OpenAI usado nas respostas do chat e na geração de documentos. Antes o modelo estava fixo em `gpt-4o` no código. Cada agente passa a ter uma coluna `model` (default `gpt-4o`), configurável no formulário do admin — alinhado ao modelo mental de Custom GPT, onde cada agente pode usar um modelo diferente.

## 2. Contexto e Motivação

### 2.1 Problema Atual

O modelo `gpt-4o` estava hardcoded na rota de chat e nas funções de geração de documento (`lib/ai.ts`). Não havia como usar um modelo mais barato/rápido (ex.: `gpt-4o-mini`) ou mais capaz por agente.

### 2.2 Impacto

- Sem controle de custo/qualidade por agente.
- Não replica a flexibilidade dos Custom GPTs.

### 2.3 Soluções Consideradas

| Solução | Prós | Contras | Decisão |
|---------|------|---------|---------|
| Modelo por agente (coluna `model`) + seletor no admin | Flexível; replica Custom GPTs; isolado por agente | Migração simples de schema | ✅ Escolhida |
| Variável global de ambiente | Trivial | Um modelo para todos; sem granularidade | ❌ Descartada |

## 3. Especificação Técnica

### 3.2 Componentes Afetados

| Componente | Tipo | Ação | Descrição |
|-----------|------|------|-----------|
| `supabase/schema.sql` | Schema | Modificar | Migração 011: `agents.model text not null default 'gpt-4o'` |
| `lib/models.ts` | Arquivo | Criar | Lista de modelos, default, `resolveModel()`, `isReasoningStyle()` e `buildChatParams()` (params corretos por família) |
| `lib/ai.ts` | Arquivo | Modificar | `generateStructuredDocument`/`generateFreeformDocument` aceitam `model` |
| `app/api/chat/[agentId]/route.ts` | Arquivo | Modificar | Usa `agent.model` no streaming |
| `app/api/chat/[agentId]/document/route.ts` | Arquivo | Modificar | Passa `agent.model` à geração |
| `app/api/admin/agents/route.ts` | Arquivo | Modificar | Persiste `model` no POST |
| `app/api/admin/agents/[id]/route.ts` | Arquivo | Modificar | Persiste `model` no PUT |
| `components/admin/AgentForm.tsx` | Arquivo | Modificar | Seletor de modelo |

### 3.3 Modelos Oferecidos

Geração atual (jun/2026): `gpt-5.5`, `gpt-5.4`, `gpt-5.4-mini`, `gpt-5.4-nano`.
Compatibilidade (gerações anteriores): `gpt-4.1`, `gpt-4o` (default), `gpt-4o-mini`, `gpt-4-turbo`.
Todos suportam visão e structured outputs (json_object).

**Diferença de contrato de API (importante):** a família GPT-5 (e o-series) são modelos de raciocínio — usam `max_completion_tokens` (não `max_tokens`), **não aceitam `temperature` customizada** e suportam `reasoning_effort`. Por isso há um helper `buildChatParams(model, …)` que monta os parâmetros corretos por família, evitando erro de parâmetro não suportado. Detecção por prefixo: `^(o\d|gpt-5)`.

### 3.4 Modelos de Dados

```sql
ALTER TABLE agents ADD COLUMN model text NOT NULL DEFAULT 'gpt-4o';
```

`resolveModel(model?)` cai no default quando vazio.

### 3.5 Fluxo

1. Admin seleciona o modelo no `AgentForm` → salvo em `agents.model`.
2. Chat usa `resolveModel(agent.model)` no `chat.completions.create`.
3. Geração de documento (livre/estruturada) usa o mesmo modelo do agente.

### 3.6 Tratamento de Erros

- Modelo vazio/ausente → default `gpt-4o`.
- Modelo inválido para a conta OpenAI → erro da API tratado nos fluxos existentes (resposta de erro do chat/documento).

## 4. Requisitos

- **RF-001:** Cada agente tem um modelo configurável.
- **RF-002:** Chat e geração de documentos usam o modelo do agente.
- **RF-003:** Default `gpt-4o` para agentes existentes (migração).
- **RNF-001:** Embeddings (RAG) permanecem em `text-embedding-3-small` (independente do modelo de chat).

## 5. Critérios de Aceitação

- [x] **CA-001:** Migração adiciona `model` com default `gpt-4o` sem afetar agentes existentes.
- [x] **CA-002:** Seletor de modelo aparece no formulário do agente.
- [x] **CA-003:** Trocar o modelo altera o modelo efetivamente usado no chat.
- [x] **CA-004:** A geração de documento usa o modelo do agente.

## 6. Plano de Testes

- Criar agente com `gpt-4o-mini` e verificar respostas.
- Editar agente para `gpt-4o` e confirmar persistência.
- Gerar documento e confirmar uso do modelo selecionado.

## 7. Riscos e Mitigações

| Risco | Prob. | Impacto | Mitigação |
|-------|-------|---------|-----------|
| Modelo indisponível na conta | Média | Médio | Lista curada de modelos comuns; `resolveModel` com default |
| Modelo sem suporte a visão/json | Baixa | Médio | Lista restrita a modelos compatíveis com as features |

## 8. Dependências

- OpenAI Chat Completions API.

## 9. Observações e Decisões de Design

- Lista de modelos curada (compatíveis com visão + json_object) para evitar erros de feature.
- Embeddings ficam fora desta seleção (concern separado do RAG).
- `resolveModel` centraliza o fallback para o default.

---

> **⚠️ NOTA:** Fonte de verdade desta implementação.
