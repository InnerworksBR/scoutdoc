# Citação de Fontes nas Respostas dos Agentes

> **ID:** 002
> **Status:** 🟡 Planejada
> **Prioridade:** 🔴 Crítica
> **Criada em:** 2026-06-16
> **Última atualização:** 2026-06-16
> **Autor:** Agente AI

---

## 1. Resumo Executivo

Implementar a citação verificável de fontes nas respostas dos agentes do ScoutDoc.AI. No chat, o modelo passará a citar de qual documento (`agent_documents.name`) cada informação foi extraída, usando rótulos explícitos injetados no `docsContext`, e o `ChatInterface` renderizará essas citações como chips/rodapé de referências. No gerador de PUD (`lib/ai.ts`), o campo `source` será reforçado para citar referências verificáveis em vez de alucinadas. O valor entregue é confiança e auditabilidade: chefes escoteiros poderão verificar a origem das informações nos documentos oficiais da UEB.

## 2. Contexto e Motivação

### 2.1 Problema Atual

Hoje as respostas dos agentes não indicam a procedência das informações:

- Em `app/api/chat/[agentId]/route.ts`, o `docsContext` concatena os documentos com o cabeçalho `\n\n=== DOCUMENTO: {name} ===\n{content_text}`, mas o `systemPrompt` (`agent.system_prompt` + `## DOCUMENTOS DE REFERÊNCIA` + `docsContext`) **não instrui** o modelo a citar de qual documento veio cada afirmação. O usuário recebe texto sem rastreabilidade.
- Em `components/ChatInterface.tsx`, a resposta do assistant é renderizada cruamente como `<p className="whitespace-pre-wrap">{msg.content}</p>`, sem qualquer parser de citações.
- Em `lib/ai.ts`, a função `generatePUD()` usa um `SYSTEM_PROMPT` que pede um JSON com campo `source` (string), mas esse campo é livre e frequentemente **alucinado** — não há grounding nos documentos reais. A interface `GeneratedContent` declara `source: string`.
- Em `app/api/admin/agents/[id]/documents/route.ts`, a extração de PDF usa `unpdf` `extractText` com `mergePages: true`, o que descarta a separação por página — não há metadados de página em `agent_documents.content_text`.

### 2.2 Impacto do Problema

- **Quem é afetado:** chefes escoteiros (usuários finais) que precisam de informações confiáveis para conduzir atividades, e que hoje não conseguem verificar a origem do que o agente afirma.
- **Magnitude:** todas as respostas de chat com documentos anexados e todos os PUDs gerados são impactados. A ausência de fonte reduz a confiança no produto e expõe risco de o agente apresentar informação incorreta como se fosse oficial da UEB.
- **Se não for resolvido:** o assistente continua suscetível a alucinações sem rastreabilidade, comprometendo a credibilidade institucional do ScoutDoc.AI junto a um público que lida com responsabilidade sobre menores.

### 2.3 Soluções Consideradas

| Solução | Prós | Contras | Decisão |
|---------|------|---------|---------|
| A — Citação por prompt + rótulos no `docsContext` + parser no frontend | Baixo custo; sem mudança de schema; aproveita o `docsContext` já existente; aplicável imediatamente | Depende da aderência do modelo ao formato; não garante 100% de precisão | ✅ Escolhida |
| B — RAG completo (embeddings + vector store + chunk retrieval com offsets de página) | Grounding forte; citação por trecho/página precisa | Alto custo de implementação; exige `pgvector`/serviço de embeddings; fora do escopo de 2 dias | ❌ Descartada (fica como evolução futura) |
| C — Pós-processamento por regex casando frases da resposta com `content_text` | Independe do modelo citar | Frágil; falsos positivos/negativos; difícil para paráfrases | ❌ Descartada |
| D — Não citar fontes (manter como está) | Zero esforço | Não resolve o problema; mantém alucinação sem rastreio | ❌ Descartada |

## 3. Especificação Técnica

### 3.1 Visão Geral da Arquitetura

A solução atua em três pontos, sem alterar o schema do banco:

```
[agent_documents] --(name, content_text, file_type)--> route.ts (chat)
        |                                                   |
        |                              monta docsContext com RÓTULOS [Fonte: name]
        |                                                   v
        |                              systemPrompt + instrução de citação
        |                                                   v
        |                                          OpenAI gpt-4o (stream SSE)
        |                                                   v
        |                              resposta contém marcadores [Fonte: name.pdf]
        |                                                   v
   ChatInterface.tsx --> parser de citações --> chips/badges + rodapé de referências

lib/ai.ts (PUD) --> SYSTEM_PROMPT reforçado --> campo `source` com referências verificáveis
```

O fluxo de chat permanece SSE streaming; o parser de citações roda no cliente sobre o texto acumulado. O PUD não possui RAG e, portanto, recebe apenas reforço de prompt anti-alucinação.

### 3.2 Componentes Afetados

| Componente | Tipo | Ação | Descrição |
|-----------|------|------|-----------|
| `app/api/chat/[agentId]/route.ts` | Arquivo | Modificar | Adicionar rótulo de fonte por documento no `docsContext` e instrução de citação no `systemPrompt`; tratar caso sem documentos |
| `lib/citations.ts` | Arquivo | Criar | Função pura `parseCitations(content)` que extrai marcadores `[Fonte: ...]`, deduplica e retorna texto + lista de referências |
| `components/ChatInterface.tsx` | Arquivo | Modificar | Usar `parseCitations` para renderizar chips de fonte inline e/ou rodapé de referências na mensagem do assistant |
| `components/CitationBadge.tsx` | Arquivo | Criar | Componente visual de chip/badge de fonte (paleta `scout-*`/`azure-*`/`gold-*`/`cream-*`) |
| `lib/ai.ts` | Arquivo | Modificar | Reforçar `SYSTEM_PROMPT` do `generatePUD()` para que `source` cite referências verificáveis e não invente; documentar limitação |
| `app/api/admin/agents/[id]/documents/route.ts` | Arquivo | Modificar (opcional) | Avaliar extração por página com `unpdf` para anexar nº de página aproximado ao `content_text` |
| `supabase/schema.sql` | Arquivo | Não alterar | Schema atual (`agent_documents`, `messages`) é suficiente; sem migração |

### 3.3 Interfaces e Contratos

#### Entradas

- **Chat (`route.ts`):** array `agent_documents` com `{ name: string, content_text: string | null, file_type: string }`. Apenas documentos com `content_text` não nulo entram no `docsContext`.
- **Parser (`parseCitations`):** `content: string` — texto bruto (ou acumulado durante streaming) da resposta do assistant.
- **PUD (`generatePUD`):** mesma assinatura atual; nenhuma mudança de entrada, apenas de prompt.

#### Saídas

- **Chat:** resposta SSE cujo texto contém marcadores no formato `[Fonte: nome-do-documento.pdf]` imediatamente após a informação citada. Quando não houver documentos, nenhum marcador é emitido.
- **Parser:** objeto `{ segments: Array<{ text: string } | { citation: string }>, references: string[] }`, com `references` deduplicado e ordenado por primeira ocorrência.
- **PUD:** `GeneratedContent.source` contendo referências verificáveis (documentos oficiais conhecidos da UEB), sem citações inventadas; string vazia/`"N/A"` quando não houver fonte segura.

#### Contratos de API

- **`POST /api/chat/[agentId]`** — contrato inalterado (request/response SSE). Mudança é apenas no conteúdo textual gerado (presença dos marcadores `[Fonte: ...]`). Nenhum novo campo no payload.
- **`lib/citations.ts`:**
  ```ts
  type CitationSegment = { type: 'text'; value: string } | { type: 'citation'; source: string };
  interface ParsedCitations { segments: CitationSegment[]; references: string[]; }
  function parseCitations(content: string): ParsedCitations;
  ```

### 3.4 Modelos de Dados

N/A — justificativa: nenhuma alteração de schema. Reutiliza `agent_documents(name, content_text, file_type)` e `messages(role, content)` já existentes em `supabase/schema.sql`. As citações vivem dentro do texto de `messages.content`; o parser é executado em runtime no cliente. O campo `source` do PUD continua sendo `string` na interface `GeneratedContent` (`lib/ai.ts`).

### 3.5 Fluxo de Execução

**Chat:**
1. `route.ts` busca `agent` + `agent_documents`.
2. Para cada documento com `content_text`, monta o bloco com rótulo de citação: `\n\n=== DOCUMENTO: {name} ===\n[Citar como: [Fonte: {name}]]\n{content_text}`.
3. Concatena em `docsContext`; se `docsContext` estiver vazio, **não** adiciona a seção de documentos e instrui o modelo a não citar fontes.
4. `systemPrompt` = `agent.system_prompt` + instrução de citação + `## DOCUMENTOS DE REFERÊNCIA` + `docsContext`.
5. `openai.chat.completions.create` (gpt-4o, stream, max_tokens 1500) gera a resposta com marcadores `[Fonte: ...]`.
6. Cliente (`ChatInterface.tsx`) acumula o stream em `accumulated`; ao final (ou incrementalmente), `parseCitations(accumulated)` separa texto e citações.
7. Renderiza o texto e exibe chips inline + rodapé de referências deduplicadas via `CitationBadge`.
8. Resposta final é salva em `messages` (role assistant, content) **com** os marcadores preservados, para que o parser funcione ao recarregar o histórico.

**PUD:**
1. `generatePUD()` chama OpenAI com `SYSTEM_PROMPT` reforçado, instruindo a preencher `source` apenas com referências verificáveis (documentos oficiais conhecidos) e a nunca inventar títulos/códigos.
2. O JSON retornado popula `GeneratedContent.source`, exibido na seção FONTES do `.docx` (já existente via `docx`).

### 3.6 Tratamento de Erros

- **Sem documentos (`docsContext` vazio):** não inserir seção de referência; instruir o modelo a responder sem citar fontes. O parser, ao não encontrar marcadores, retorna `references: []` e o frontend não renderiza rodapé.
- **Marcador malformado** (ex.: `[Fonte: ]` ou colchete não fechado): o parser ignora o trecho como texto comum, sem quebrar a renderização.
- **Citação a documento inexistente** (modelo cita nome fora da lista): renderizar o chip mesmo assim (não temos garantia de validação cruzada), mas a instrução de prompt deve enfatizar usar exatamente os nomes fornecidos. Opcionalmente marcar visualmente como não verificada.
- **Streaming parcial:** durante o stream, um marcador pode estar incompleto; o parser deve tolerar marcadores truncados no fim do buffer, tratando-os como texto até o fechamento chegar.
- **PUD sem fonte segura:** `source` recebe `"N/A"`/string vazia em vez de invenção; a seção FONTES do docx exibe ausência de fontes graciosamente.

## 4. Requisitos

### 4.1 Requisitos Funcionais

- **RF-001:** O `systemPrompt` do chat deve instruir o modelo a citar a fonte no formato `[Fonte: {name}]` (ou numerada `[1]`, `[2]` com legenda ao final) sempre que usar informação de um documento.
- **RF-002:** Cada documento no `docsContext` deve receber um rótulo/identificador explícito que o modelo possa referenciar exatamente (baseado em `agent_documents.name`).
- **RF-003:** Deve existir uma função pura `parseCitations(content)` em `lib/citations.ts` que extraia, deduplique e ordene as citações de uma resposta.
- **RF-004:** O `ChatInterface.tsx` deve renderizar as citações de forma visível (chips/badges inline e/ou rodapé de referências por mensagem) usando `CitationBadge`.
- **RF-005:** Quando não houver documentos com `content_text`, o agente não deve citar fontes e nenhum rodapé deve ser renderizado.
- **RF-006:** Citações repetidas ao mesmo documento devem aparecer uma única vez no rodapé de referências (deduplicação).
- **RF-007:** O `SYSTEM_PROMPT` de `generatePUD()` deve reforçar que o campo `source` contenha apenas referências verificáveis (documentos oficiais conhecidos da UEB), sem inventar.
- **RF-008:** As respostas salvas em `messages.content` devem preservar os marcadores de citação para que o parser funcione ao recarregar o histórico.

### 4.2 Requisitos Não-Funcionais

- **RNF-001:** O parser de citações não deve introduzir latência perceptível na renderização do streaming (operação O(n) sobre o texto, sem regex catastrófica).
- **RNF-002:** O design dos chips/badges deve usar a paleta do projeto (`scout-*`, `azure-*`, `gold-*`, `cream-*`) e ser acessível (contraste e `aria-label` na referência).
- **RNF-003:** O acréscimo de rótulos no `docsContext` não deve estourar o orçamento de contexto; aplicar estratégia de chunking/limite por documento para caber junto às últimas 20 mensagens e `max_tokens` 1500.
- **RNF-004:** A solução não deve exigir migração de banco nem novas dependências além das já presentes (`docx`, `unpdf`, `zod`, `framer-motion`, `lucide-react`).

### 4.3 Restrições e Limitações

- O PUD (`lib/ai.ts`) **não possui RAG**; o grounding de fontes é limitado ao conhecimento do modelo. Mitigação: prompt anti-alucinação que restringe `source` a documentos oficiais conhecidos e permite `"N/A"`.
- A extração atual com `unpdf` `mergePages: true` **perde a separação por página**; o número de página aproximado nos chunks é OPCIONAL e só será viável se a extração por página for adotada (RF não obrigatório).
- A precisão da citação depende da aderência do modelo ao formato instruído — não há validação cruzada forte sem RAG.

## 5. Critérios de Aceitação

- [ ] **CA-001:** Com pelo menos um `agent_document` com `content_text`, a resposta do chat contém ao menos um marcador `[Fonte: {name}]` quando a informação vem do documento.
- [ ] **CA-002:** O `ChatInterface` exibe as citações como chips/badges e/ou rodapé de referências visíveis na mensagem do assistant.
- [ ] **CA-003:** Referências duplicadas aparecem uma única vez no rodapé (deduplicação verificada).
- [ ] **CA-004:** Sem documentos com `content_text`, nenhuma citação/rodapé é renderizado e o modelo não inventa fontes.
- [ ] **CA-005:** `parseCitations` retorna `segments` e `references` corretos para entradas com 0, 1 e múltiplas citações, incluindo marcador malformado tratado como texto.
- [ ] **CA-006:** O `source` do PUD gerado não contém referências claramente inventadas; quando não há fonte segura, retorna `"N/A"`/vazio e a seção FONTES do docx exibe isso sem quebrar.
- [ ] **CA-007:** Ao recarregar uma conversa do histórico, as citações continuam sendo renderizadas (marcadores preservados em `messages.content`).
- [ ] **CA-008:** Nenhuma migração de schema e nenhuma nova dependência foi introduzida.

## 6. Plano de Testes

### 6.1 Testes Unitários

- `parseCitations`: entrada sem citações → `references: []`; uma citação → 1 referência; múltiplas iguais → deduplicadas; marcador malformado (`[Fonte: ]`, colchete aberto) → tratado como texto; marcador truncado no fim do buffer → não quebra.
- Montagem do `docsContext`: com N documentos, gera N rótulos `[Fonte: {name}]`; com 0 documentos, retorna seção vazia/sem instrução de citação.

### 6.2 Testes de Integração

- Fluxo de chat end-to-end com 1 e 2 documentos: verificar que o `systemPrompt` contém os rótulos e a instrução, e que o stream renderiza chips.
- Fluxo de PUD: gerar com `generatePUD()` e inspecionar `source` para garantir ausência de invenção evidente e exibição correta na seção FONTES do `.docx`.

### 6.3 Testes de Aceitação

- Roteiro manual cobrindo CA-001 a CA-008, com um agente de teste contendo documentos reais da UEB e um agente sem documentos.

### 6.4 Casos de Borda (Edge Cases)

- Documento com `content_text` nulo (deve ser ignorado no `docsContext`).
- Nome de documento contendo `]` ou `:` (caracteres que podem confundir o parser).
- Resposta com citação no formato numerado `[1]` + legenda final em vez de `[Fonte: ...]`.
- Conversa longa que aciona o corte das últimas 20 mensagens junto com documentos grandes (orçamento de contexto).
- Streaming interrompido no meio de um marcador de citação.

## 7. Riscos e Mitigações

| Risco | Probabilidade | Impacto | Mitigação |
|-------|--------------|---------|-----------|
| Modelo não adere ao formato `[Fonte: ...]` | Média | Médio | Instrução explícita + exemplos few-shot no prompt; parser tolerante a formato numerado |
| Documentos grandes estouram o contexto | Média | Alto | Chunking/limite de caracteres por documento no `docsContext`; manter corte das 20 msgs |
| Citações alucinadas no PUD (sem RAG) | Alta | Alto | Prompt anti-alucinação; permitir `"N/A"`; documentar limitação na seção 4.3 |
| Parser quebra renderização do streaming | Baixa | Médio | Tolerância a marcadores truncados/malformados; testes unitários dedicados |
| Extração por página (`unpdf`) inviável/regressão | Média | Baixo | Manter como opcional; não bloquear a entrega principal |

## 8. Dependências

### 8.1 Dependências Internas

- `app/api/chat/[agentId]/route.ts` (montagem de `docsContext` e `systemPrompt`).
- `components/ChatInterface.tsx` (renderização do assistant e acumulação de stream).
- `lib/ai.ts` (`generatePUD`, `SYSTEM_PROMPT`, interface `GeneratedContent`).
- `app/api/admin/agents/[id]/documents/route.ts` (extração de texto — opcional para nº de página).
- `supabase/schema.sql` (referência de schema; sem alteração).

### 8.2 Dependências Externas

- OpenAI GPT-4o (já em uso).
- `unpdf` (extração de PDF — apenas se a opção de página for adotada).
- `lucide-react` / `framer-motion` (ícones e animação dos chips — já presentes).
- Nenhuma nova biblioteca.

## 9. Observações e Decisões de Design

- **Formato de citação:** adotar `[Fonte: {name}]` como padrão primário por ser legível e fácil de parsear; suportar também `[1]`/`[2]` com legenda como fallback aceitável.
- **Onde os marcadores vivem:** dentro de `messages.content` para sobreviver ao histórico; o parsing é responsabilidade do cliente, mantendo o backend simples.
- **Sem RAG agora:** decisão consciente de adiar embeddings/vector store (Solução B) para uma implementação futura; esta entrega resolve a citação por prompt+rótulo, que é suficiente para o objetivo de rastreabilidade no curto prazo.
- **Número de página opcional:** dado o `mergePages: true` atual do `unpdf`, o nº de página fica fora do caminho crítico; se adotado, exigirá extrair por página e versionar o formato do `content_text`.
- **Deduplicação:** feita no parser por nome normalizado (trim + lowercase para comparação, exibição preserva o original).

---

> **⚠️ NOTA:** Este documento é a fonte de verdade para esta implementação.
> Qualquer alteração no escopo deve ser refletida aqui ANTES de ser implementada.
