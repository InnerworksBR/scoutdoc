# 004 - Documentos Estruturados Configuráveis nos Agentes

> **ID:** 004
> **Status:** 🟢 Concluída
> **Prioridade:** 🟠 Alta
> **Criada em:** 2026-06-16
> **Última atualização:** 2026-06-16
> **Autor:** Agente AI

---

## 1. Resumo Executivo

Esta implementação permite que um administrador configure um agente como **"produtor de documento"**: ao final de uma conversa (ou sob demanda, via botão no chat), o agente monta um **documento oficial estruturado** a partir do histórico da conversa e dos documentos de referência do próprio agente, e o usuário baixa o resultado em **Word (DOCX)** ou **PDF**.

Hoje o projeto só gera documentos por um fluxo fixo e isolado (o PUD, em `lib/ai.ts` + `lib/docx-generator.ts`, com schema `GeneratedContent` hardcoded). Não há nenhuma forma de um agente arbitrário, configurado via painel admin, produzir um documento cuja estrutura (seções/campos) seja definida pelo próprio administrador.

O escopo cobre: (1) uma migration adicionando à tabela `agents` os campos `produces_document boolean default false`, `document_template jsonb` (define as seções/campos que o agente deve preencher) e `document_title text`; (2) extensão do `components/admin/AgentForm.tsx` com um toggle "Este agente gera documento" e um editor de template de seções (rótulo, instrução, tipo `texto|lista|tabela`); (3) uma nova rota `POST /api/chat/[agentId]/document` que, dada a conversa, deriva um system prompt do `document_template`, chama `gpt-4o` com `response_format: { type: "json_object" }` e converte o JSON resultante via o **motor de documentos da impl. 003** (`lib/document-engine` + `lib/pdf-generator.ts`) para DOCX/PDF; (4) um botão "Gerar documento" no `components/ChatInterface.tsx`, visível apenas quando `produces_document`, que dispara a rota, oferece preview (reusando `PreviewModal`) e baixa o arquivo; (5) respeito às **citações da impl. 002**, garantindo que o documento gerado cite as fontes dos `agent_documents`.

A implementação **depende** da impl. 003 (motor de documentos genérico + exportação PDF) e da impl. 002 (citação de fontes), ambas pré-requisitos.

## 2. Contexto e Motivação

### 2.1 Problema Atual

A geração de documentos existente é monolítica e específica: `lib/ai.ts` define `generatePUD` com um `SYSTEM_PROMPT` fixo e a interface `GeneratedContent` (título, objetivo, passos, rubrica, checklist etc.), e `lib/docx-generator.ts` (`DocxGenerator.generate`) mapeia **exatamente** esse shape para um DOCX. A rota de chat (`app/api/chat/[agentId]/route.ts`) apenas faz streaming de texto livre — não produz nenhum artefato estruturado.

Consequência: cada agente configurado no painel (`AgentForm.tsx` expõe apenas `name`, `description`, `system_prompt`, `avatar_color`, `is_active`) só consegue conversar. Não existe mecanismo para declarar que um agente, ao final do atendimento, deve consolidar a conversa em um **documento oficial** com uma estrutura própria (ex.: uma ata, um ofício, um plano de atividade, um relatório de progressão). Qualquer novo tipo de documento exigiria uma nova interface TypeScript hardcoded, um novo `SYSTEM_PROMPT` e um novo gerador — tudo via código e deploy.

### 2.2 Impacto do Problema

- **Falta de extensibilidade:** adicionar um novo tipo de documento oficial é uma tarefa de engenharia, não de configuração; o administrador escoteiro não consegue criar/ajustar modelos sozinho.
- **Subaproveitamento dos agentes:** a conversa rica que o usuário tem com o agente "evapora" — não há um entregável formal ao final, que é justamente o que o chefe escoteiro precisa (documentos para a UEB).
- **Inconsistência documental:** sem template declarado, dois usuários do mesmo agente podem terminar com documentos de estrutura diferente; falta padronização institucional.
- **Acoplamento ao PUD:** o único caminho de documento está preso ao formato PUD, impossibilitando reuso para atas, ofícios, relatórios, autorizações etc.
- **Citações perdidas:** mesmo quando o agente usa documentos de referência (`agent_documents`), o resultado final não preserva a rastreabilidade das fontes (impl. 002), enfraquecendo a validade oficial do documento.

### 2.3 Soluções Consideradas

| Solução | Prós | Contras | Decisão |
| --- | --- | --- | --- |
| Manter geração hardcoded por tipo (estilo PUD) | Já existe; baixo risco imediato | Não escala; cada documento novo é código+deploy; não atende ao pedido de configuração por agente | ❌ Rejeitada |
| `document_template jsonb` por agente + rota que deriva system prompt do template e usa motor genérico (003) | Configuração 100% via admin; reusa motor da 003; um único caminho para N documentos; flexível (texto/lista/tabela) | Requer validação do template e mapeamento JSON dinâmico → seções; prompt derivado mais complexo | ✅ Adotada |
| Tabela separada `document_templates` (1:N com `agents`) | Permite múltiplos templates por agente; versionamento futuro | Over-engineering para o caso atual (1 documento por agente); joins/RLS extra | ❌ Rejeitada (preferir `jsonb` na própria `agents`) |
| Gerar Markdown livre e converter para DOCX/PDF | Simples de promptar | Sem estrutura garantida; perde tabelas/seções tipadas; difícil mapear citações por seção | ❌ Rejeitada |
| Template em `text` (string livre, não estruturado) | Flexível para o admin escrever | Não validável; sem tipos de seção; impossível gerar editor visual confiável | ❌ Rejeitada (jsonb estruturado preferido) |

## 3. Especificação Técnica

### 3.1 Visão Geral da Arquitetura

O fluxo reaproveita os caminhos de configuração de agente e de chat já existentes, somando um caminho novo de geração documental:

- **Configuração (admin):** `AgentForm.tsx` ganha um toggle `produces_document` e um editor de `document_template` (lista de seções tipadas) → `fetch` para `POST /api/admin/agents` ou `PUT /api/admin/agents/[id]` → handlers (protegidos por `requireAdmin`) validam (zod) e persistem na tabela `agents`.
- **Leitura no chat (usuário):** `app/assistants/[agentId]/page.tsx` inclui `produces_document, document_template, document_title` no `select` e repassa ao `ChatInterface`, que decide exibir o botão "Gerar documento".
- **Geração (usuário):** clique no botão → `POST /api/chat/[agentId]/document` com `conversationId` → a rota busca agente + `agent_documents` + histórico da conversa → deriva um **system prompt** do `document_template` (instruindo o modelo a devolver JSON conforme as seções, com citações da impl. 002) → chama `gpt-4o` com `response_format: { type: "json_object" }` → valida/normaliza o JSON → mapeia o JSON dinâmico para a **estrutura genérica de seções do motor da impl. 003** → gera `Buffer` DOCX ou PDF → responde com o arquivo (ou JSON para preview).
- **Entrega:** `ChatInterface` recebe o arquivo e dispara download; opcionalmente abre `PreviewModal` antes do download.

### 3.2 Componentes Afetados

| Componente | Tipo | Ação | Descrição |
| --- | --- | --- | --- |
| `supabase/schema.sql` | Migration/Schema | Modificar | Adicionar `produces_document boolean default false`, `document_template jsonb`, `document_title text` à tabela `agents` |
| `app/api/admin/agents/route.ts` | Route Handler (POST) | Modificar | Ler, validar (zod) e inserir os três novos campos |
| `app/api/admin/agents/[id]/route.ts` | Route Handler (PUT) | Modificar | Ler, validar e atualizar os três novos campos |
| `components/admin/AgentForm.tsx` | Componente React (client) | Modificar | Toggle "Este agente gera documento" + editor de template de seções (rótulo, instrução, tipo); incluir no body do fetch |
| `app/api/chat/[agentId]/document/route.ts` | Route Handler (POST) | Criar | Nova rota: deriva prompt do template, chama gpt-4o (json_object), valida, mapeia e gera DOCX/PDF com citações |
| `lib/document-template.ts` | Módulo/Lib | Criar | Tipos (`DocumentTemplate`, `DocumentSection`), validação zod do template e função que mapeia JSON gerado → seções do motor da 003 |
| `lib/ai.ts` | Módulo/Lib | Modificar | Adicionar `generateStructuredDocument(template, history, docs)` seguindo o padrão de `generatePUD` (json_object) |
| `app/assistants/[agentId]/page.tsx` | Page (Server Component) | Modificar | Incluir `produces_document, document_template, document_title` no `select` e repassar como props |
| `components/ChatInterface.tsx` | Componente React (client) | Modificar | Receber props; renderizar botão "Gerar documento"; chamar a rota; preview/download |
| `components/PreviewModal.tsx` | Componente React (client) | Reutilizar | Exibir preview do documento gerado antes do download (impl. 003) |
| `lib/document-engine.ts` / `lib/pdf-generator.ts` | Módulo/Lib | Reutilizar | Motor genérico de seções e exportação PDF/DOCX criados pela impl. 003 |

### 3.3 Interfaces e Contratos

#### Entradas

- **Admin (AgentForm):**
  - `produces_document`: boolean (toggle).
  - `document_title`: string opcional (título padrão do documento gerado; ex.: "Ata de Reunião de Grupo").
  - `document_template`: objeto estruturado com a lista de seções a preencher (ver JSON abaixo). Só é exigido/validado quando `produces_document = true`.
- **Usuário (ChatInterface props):**
  - `producesDocument?: boolean | null`
  - `documentTemplate?: DocumentTemplate | null`
  - `documentTitle?: string | null`
  - `conversationId` (já existente no fluxo de chat).
- **Rota de geração — body de `POST /api/chat/[agentId]/document`:**
  - `conversationId: string` (obrigatório).
  - `format: "docx" | "pdf"` (default `"docx"`).
  - `preview?: boolean` (quando `true`, retorna o JSON estruturado em vez do binário).

#### Saídas

- **Geração (binário):** resposta com `Content-Type` apropriado (`application/vnd.openxmlformats-officedocument.wordprocessingml.document` para DOCX ou `application/pdf` para PDF) e `Content-Disposition: attachment; filename="<document_title>.<ext>"`, contendo o `Buffer` gerado pelo motor da impl. 003.
- **Geração (preview):** quando `preview = true`, JSON `{ title, sections: [...], citations: [...] }` para renderização no `PreviewModal`.
- **Empty/desabilitado:** se `produces_document = false`, o botão não é renderizado no chat e a rota retorna `400` se chamada.

#### Contratos de API

**Estrutura do `document_template` (jsonb na tabela `agents`):**

```json
{
  "title": "Ata de Reunião de Grupo Escoteiro",
  "sections": [
    {
      "key": "cabecalho",
      "label": "Cabeçalho",
      "instruction": "Extraia data, local e participantes mencionados na conversa.",
      "type": "texto"
    },
    {
      "key": "pautas",
      "label": "Pautas Discutidas",
      "instruction": "Liste cada pauta discutida como um item.",
      "type": "lista"
    },
    {
      "key": "deliberacoes",
      "label": "Deliberações",
      "instruction": "Tabela com Assunto, Decisão e Responsável.",
      "type": "tabela",
      "columns": ["Assunto", "Decisão", "Responsável"]
    }
  ]
}
```

- `sections[].type`: enum `"texto" | "lista" | "tabela"`. Para `"tabela"`, `columns` (array de strings) é obrigatório.
- `sections[].key`: identificador estável usado como chave no JSON de saída do modelo.
- `title`: opcional aqui; se ausente, usa `document_title` da coluna; se ambos ausentes, fallback genérico.

**`POST /api/chat/[agentId]/document`** — Body JSON:

```json
{
  "conversationId": "uuid",
  "format": "docx",
  "preview": false
}
```

**JSON de saída esperado do `gpt-4o`** (derivado do template; o prompt instrui o modelo a usar exatamente as `key` das seções):

```json
{
  "title": "Ata de Reunião de Grupo Escoteiro",
  "sections": {
    "cabecalho": { "type": "texto", "value": "..." },
    "pautas": { "type": "lista", "value": ["...", "..."] },
    "deliberacoes": {
      "type": "tabela",
      "columns": ["Assunto", "Decisão", "Responsável"],
      "rows": [["...", "...", "..."]]
    }
  },
  "citations": [
    { "section": "deliberacoes", "source": "Estatuto do Grupo — p. 4" }
  ]
}
```

- **Contratos de admin (`POST /api/admin/agents`, `PUT /api/admin/agents/[id]`):** o body passa a aceitar `produces_document` (boolean), `document_title` (string|null) e `document_template` (objeto validado por zod ou `null`). Quando `produces_document = true`, `document_template.sections` deve ter ≥ 1 item válido; caso contrário `400`.
- **Códigos de status:** `200` (sucesso, binário ou preview), `400` (template inválido / agente não produz documento / conversa ausente), `401` (não autenticado), `404` (agente/conversa não encontrados), `422` (JSON do modelo não conforme após retry), `500` (falha de geração/OpenAI).

### 3.4 Modelos de Dados

Tabela `agents` (colunas adicionadas):

| Coluna | Tipo | Nulável | Default | Descrição |
| --- | --- | --- | --- | --- |
| `produces_document` | `boolean` | Não | `false` | Indica se o agente expõe a geração de documento estruturado |
| `document_template` | `jsonb` | Sim | `NULL` | Define as seções/campos do documento (estrutura da seção 3.3) |
| `document_title` | `text` | Sim | `NULL` | Título padrão do documento gerado e base do nome do arquivo |

DDL prevista (em `supabase/schema.sql`):

```sql
ALTER TABLE agents
  ADD COLUMN IF NOT EXISTS produces_document boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS document_template jsonb,
  ADD COLUMN IF NOT EXISTS document_title text;
```

As políticas RLS existentes (`agents_read_active`, `agents_admin_all`) cobrem as novas colunas sem alteração (operam por linha). A leitura no chat ocorre via cliente autenticado; a escrita permanece restrita a admin. Os documentos de referência continuam em `agent_documents` (lidos via join `agent_documents(name, content_text, file_type)`).

### 3.5 Fluxo de Execução

1. **Configuração (admin):** admin abre `AgentForm`, ativa o toggle "Este agente gera documento", define `document_title` e adiciona seções (rótulo, instrução, tipo; para tabela, define colunas) → submit dispara `fetch` POST/PUT.
2. **Persistência:** handler valida com zod (incluindo `document_template` quando `produces_document = true`), normaliza e grava na tabela `agents`.
3. **Carregamento do chat (usuário):** `app/assistants/[agentId]/page.tsx` traz `produces_document, document_template, document_title` no `select` e repassa ao `ChatInterface`.
4. **Exibição do botão:** se `producesDocument = true`, o `ChatInterface` renderiza o botão "Gerar documento" (desabilitado enquanto a conversa estiver vazia).
5. **Disparo:** clique → `POST /api/chat/[agentId]/document` com `{ conversationId, format, preview }`.
6. **Coleta de contexto (rota):** busca o agente (ativo) com `agent_documents(name, content_text, file_type)` e o histórico de `messages` da conversa.
7. **Derivação do prompt:** `lib/document-template.ts` + `lib/ai.ts` montam um system prompt que descreve cada seção (key/label/instruction/type/columns), o JSON de saída esperado e a regra de citações (impl. 002 — citar `name` do `agent_documents` usado por seção).
8. **Geração estrutural:** `generateStructuredDocument` chama `gpt-4o` com `response_format: { type: "json_object" }`, faz `JSON.parse` e valida contra o template (chaves e tipos por seção).
9. **Mapeamento:** o JSON dinâmico é convertido para a lista genérica de seções aceita pelo **motor da impl. 003** (`texto` → parágrafo(s), `lista` → bullets, `tabela` → tabela), anexando uma seção/linha de **Fontes** a partir de `citations`.
10. **Renderização do arquivo:** o motor gera `Buffer` DOCX ou PDF (`lib/pdf-generator.ts`) conforme `format`.
11. **Entrega:** se `preview = true`, retorna JSON para o `PreviewModal`; senão, retorna o binário com `Content-Disposition: attachment`. O `ChatInterface` dispara o download.

### 3.6 Tratamento de Erros

- **Conversa vazia / sem `conversationId`:** rota retorna `400` ("conversa vazia ou inexistente"); o botão fica desabilitado no front quando não há mensagens, como defesa em profundidade.
- **Agente não produz documento (`produces_document = false`):** rota retorna `400` mesmo se chamada diretamente; botão não é renderizado.
- **Template inválido/ausente:** se `document_template` for `null`, sem `sections`, ou com seção `tabela` sem `columns`, a validação zod (no admin e na rota) rejeita com `400`/`422`; o `AgentForm` impede salvar.
- **Agente sem documentos de referência:** geração prossegue normalmente; a seção de Fontes fica vazia ou omitida, e o prompt instrui o modelo a não inventar citações (não fabricar fontes inexistentes).
- **JSON do modelo não conforme:** após `JSON.parse`, valida chaves/tipos contra o template; em divergência, faz **1 retry** com instrução reforçada; persistindo o erro, retorna `422` ("não foi possível estruturar o documento").
- **Tipo de seção inesperado no JSON (ex.: tabela sem `rows`):** o mapeador aplica defaults seguros (lista/tabela vazia) e registra aviso, sem quebrar a geração.
- **Falha do motor de documentos (003):** erro propagado como `500`; nenhum arquivo parcial é enviado.
- **Falha da OpenAI / sem `OPENAI_API_KEY`:** `500` com mensagem amigável; segue o padrão de `generatePUD` (try/catch + `console.error`).
- **`document_title` ausente:** usa `document_template.title`, depois fallback genérico ("Documento - <nome do agente>") para nome do arquivo.

## 4. Requisitos

### 4.1 Requisitos Funcionais

- **RF-001:** O admin deve poder marcar um agente como produtor de documento (`produces_document`) no `AgentForm`.
- **RF-002:** O admin deve poder definir `document_title` e um `document_template` com seções tipadas (`texto`, `lista`, `tabela`) no `AgentForm`, incluindo colunas para seções de tabela.
- **RF-003:** As rotas admin (`POST`/`PUT`) devem aceitar e persistir `produces_document`, `document_template` e `document_title`, validando o template quando aplicável.
- **RF-004:** A página `app/assistants/[agentId]/page.tsx` deve carregar os três campos no `select` e repassá-los ao `ChatInterface`.
- **RF-005:** O `ChatInterface` deve exibir o botão "Gerar documento" somente quando `produces_document = true`.
- **RF-006:** A rota `POST /api/chat/[agentId]/document` deve derivar um system prompt do `document_template` e do histórico da conversa e chamar `gpt-4o` com `response_format: { type: "json_object" }`.
- **RF-007:** O JSON estruturado retornado deve ser mapeado para as seções do motor de documentos (impl. 003) e exportado em DOCX ou PDF conforme `format`.
- **RF-008:** O documento gerado deve incluir citações das fontes dos `agent_documents` utilizados, conforme a impl. 002.
- **RF-009:** O usuário deve poder pré-visualizar o documento (preview, reusando `PreviewModal`) antes de baixar.
- **RF-010:** O download deve usar nome de arquivo derivado de `document_title`/`document_template.title` com extensão correta.

### 4.2 Requisitos Não-Funcionais

- **RNF-001:** A migration deve ser idempotente (`ADD COLUMN IF NOT EXISTS`) e não destrutiva.
- **RNF-002:** A geração deve reutilizar o motor da impl. 003 (sem duplicar lógica de DOCX/PDF) e o padrão de prompt de `lib/ai.ts` (sem `any` nas interfaces públicas).
- **RNF-003:** A validação do `document_template` e do JSON do modelo deve ocorrer com zod, no servidor, com defesa em profundidade no cliente.
- **RNF-004:** O endpoint deve ser idempotente em relação ao estado (não altera mensagens da conversa) e seguro (autenticado, agente `is_active`).
- **RNF-005:** A geração de um documento típico deve concluir em tempo aceitável de UX (feedback de loading no botão; sem travar a UI do chat).
- **RNF-006:** O front deve permanecer responsivo e acessível (botão focável, estados de loading/erro claros, paleta `scout-*`/`azure-*`/`gold-*`/`cream-*`).

### 4.3 Restrições e Limitações

- Um agente possui **um único** template de documento nesta versão (sem múltiplos modelos por agente).
- Tipos de seção limitados a `texto`, `lista` e `tabela` (sem imagens/assinaturas/anexos nesta versão).
- Sem persistência do documento gerado no Storage nesta versão — o arquivo é entregue diretamente para download (geração efêmera).
- Citações dependem da impl. 002 já entregue; sem ela, a seção de Fontes fica limitada ao `name` bruto dos documentos.
- Sem versionamento/histórico de documentos gerados.

## 5. Critérios de Aceitação

- [ ] **CA-001:** As colunas `produces_document`, `document_template` e `document_title` existem na tabela `agents` após a migration, sem perda de dados.
- [ ] **CA-002:** No `AgentForm`, ativar o toggle revela o editor de template; é possível adicionar seções de tipo `texto`, `lista` e `tabela` (com colunas) e os valores chegam no body do fetch.
- [ ] **CA-003:** `POST`/`PUT` de agentes persistem corretamente os três campos e rejeitam (`400`) template inválido quando `produces_document = true`.
- [ ] **CA-004:** A página do assistente carrega e repassa `produces_document`, `document_template`, `document_title` ao `ChatInterface`.
- [ ] **CA-005:** O botão "Gerar documento" aparece apenas para agentes com `produces_document = true` e fica desabilitado em conversa vazia.
- [ ] **CA-006:** `POST /api/chat/[agentId]/document` gera, a partir de uma conversa real, um JSON conforme o template e devolve um DOCX válido para download.
- [ ] **CA-007:** Com `format: "pdf"`, a mesma rota devolve um PDF válido (via motor da impl. 003).
- [ ] **CA-008:** O documento gerado contém uma seção/linha de Fontes citando os `agent_documents` usados (impl. 002); um agente sem documentos não gera citações fabricadas.
- [ ] **CA-009:** `preview: true` retorna o JSON estruturado e o `PreviewModal` exibe o conteúdo antes do download.
- [ ] **CA-010:** Chamar a rota para um agente com `produces_document = false` retorna `400` e não gera arquivo.
- [ ] **CA-011:** JSON do modelo não conforme dispara 1 retry e, persistindo, retorna `422` sem arquivo parcial.

## 6. Plano de Testes

### 6.1 Testes Unitários

- Validação zod do `document_template`: aceita seções válidas; rejeita `tabela` sem `columns`, `type` desconhecido, `sections` vazio quando `produces_document = true`.
- Mapeador `JSON dinâmico → seções do motor (003)`: `texto`→parágrafo, `lista`→bullets, `tabela`→tabela; trata `rows`/`value` ausentes com defaults seguros.
- Derivação do system prompt a partir do template: inclui todas as `key`/`label`/`instruction`/`type` e a instrução de citações (002).
- Resolução do nome de arquivo: `document_title` → `template.title` → fallback genérico.

### 6.2 Testes de Integração

- `POST`/`PUT` admin persistem os três campos e aplicam validação condicional ao `produces_document`.
- `app/assistants/[agentId]/page.tsx` retorna os novos campos no `select`.
- `POST /api/chat/[agentId]/document` (mock OpenAI): conversa real → JSON conforme → DOCX e PDF gerados pelo motor da 003.
- Citações: agente com `agent_documents` produz seção de Fontes; agente sem documentos não fabrica citações.
- Autorização: rota exige usuário autenticado e agente `is_active`.

### 6.3 Testes de Aceitação

- Fluxo end-to-end: admin cria agente "produtor de Ata" com template de 3 seções → usuário conversa → clica "Gerar documento" → preview → baixa DOCX → abre no Word e confere estrutura.
- Repetir escolhendo PDF e verificar abertura/legibilidade.

### 6.4 Casos de Borda

- Conversa vazia → botão desabilitado / rota `400`.
- `document_template = null` ou `sections = []` com `produces_document = true` → bloqueado no admin e `400`/`422` na rota.
- Agente sem `agent_documents` → documento gerado sem citações fabricadas.
- Tabela com `columns` mas modelo retorna `rows` faltando → mapeador usa tabela vazia, sem crash.
- `document_title` ausente → usa `template.title` ou fallback no nome do arquivo.
- JSON do modelo malformado → retry → `422`.
- Histórico muito longo → truncamento/limite de mensagens antes do prompt (alinhado ao limite de 20 já usado no chat).

## 7. Riscos e Mitigações

| Risco | Probabilidade | Impacto | Mitigação |
| --- | --- | --- | --- |
| Modelo retorna JSON fora do schema do template | Média | Alto | Prompt explícito com keys/tipos; validação zod; 1 retry; fallback `422` sem arquivo parcial |
| Acoplamento incorreto ao motor da impl. 003 (API ainda instável) | Média | Alto | Definir contrato de seções genéricas com a 003; adaptador isolado em `lib/document-template.ts`; testes do mapeador |
| Citações inconsistentes ou fabricadas (sem impl. 002) | Média | Médio | Depender da 002; instruir o modelo a citar apenas `name` real de `agent_documents`; testar agente sem docs |
| Editor de template no admin confuso/propenso a erro | Média | Médio | Reusar padrão visual do `AgentForm`; validação inline; tipos de seção limitados a 3 |
| Latência alta na geração (modelo + render) | Média | Médio | Loading no botão; limite de histórico; geração efêmera sem Storage nesta versão |
| Migration parcial em produção | Baixa | Alto | DDL idempotente; aplicar em staging antes |
| Template inválido salvo por rota antiga sem validação | Baixa | Médio | Validação condicional no servidor (zod) em POST e PUT |

## 8. Dependências

### 8.1 Dependências Internas

- **Impl. 003 — Motor de Documentos e Exportação PDF (PRÉ-REQUISITO):** fornece o motor genérico de seções (`lib/document-engine.ts`) e `lib/pdf-generator.ts`; esta impl. **consome** esse motor para renderizar DOCX/PDF a partir de seções genéricas. Sem a 003, não há para onde mapear o JSON do template.
- **Impl. 002 — Citação de Fontes nas Respostas dos Agentes (PRÉ-REQUISITO):** define como as fontes dos `agent_documents` são citadas; o documento gerado deve respeitar esse padrão na seção de Fontes.
- `lib/ai.ts` (`generatePUD`) como padrão de geração estruturada (`response_format: { type: "json_object" }`) a ser seguido por `generateStructuredDocument`.
- `app/api/chat/[agentId]/route.ts` como referência de coleta de agente + `agent_documents` + histórico de `messages`.
- `components/admin/AgentForm.tsx` e `components/ChatInterface.tsx` (padrões de form e de chat) e `components/PreviewModal.tsx` (preview).
- `utils/supabase/server.ts` / `admin.ts` (`requireAdmin`) e RLS atual da tabela `agents`.
- Paleta CSS `scout-*` / `azure-*` / `gold-*` / `cream-*`.

### 8.2 Dependências Externas

- `openai` (GPT-4o, `response_format: { type: "json_object" }`).
- `docx` (geração DOCX) e o gerador de PDF adotado pela impl. 003 (ex.: `unpdf`/equivalente).
- `zod` (validação de template e payloads).
- `@supabase/*` (Auth/Postgres/Storage).
- Next.js 16 (App Router), React 19, TypeScript, Tailwind CSS v4, `framer-motion`, `lucide-react` — sem novas dependências de pacote previstas.

## 9. Observações e Decisões de Design

- **Template em `jsonb` na própria `agents`:** evita nova tabela e joins para o caso 1 documento por agente; mantém RLS atual. Decisão registrada em 2.3.
- **Reuso do motor da 003:** todo o trabalho de DOCX/PDF é delegado; esta impl. cuida apenas de (a) configurar o template, (b) derivar o prompt, (c) validar e mapear o JSON para seções genéricas. Um adaptador isolado (`lib/document-template.ts`) protege contra mudanças na API da 003.
- **Seções tipadas (texto/lista/tabela):** cobrem a maioria dos documentos escoteiros (atas, ofícios, relatórios) sem explodir a complexidade do editor; extensões futuras (imagem, assinatura) ficam fora de escopo.
- **`key` estável por seção:** garante mapeamento determinístico entre template, prompt e JSON de saída, reduzindo ambiguidade do modelo.
- **Citações via 002:** o prompt instrui o modelo a citar apenas o `name` real dos `agent_documents`, anexando uma seção de Fontes; nunca fabricar referências — alinhado à validade institucional exigida pela UEB.
- **Geração efêmera:** nesta versão o arquivo não é salvo no Storage; persistência/histórico ficam como evolução futura.
- **Retry único + `422`:** equilíbrio entre robustez e custo/latência ao lidar com JSON não conforme do modelo.
