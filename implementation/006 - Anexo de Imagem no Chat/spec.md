# 006 - Anexo de Imagem no Chat com Visão GPT-4o

> **ID:** 006
> **Status:** 🟢 Concluída
> **Prioridade:** 🟡 Média
> **Criada em:** 2026-06-16
> **Última atualização:** 2026-06-16
> **Autor:** Agente AI

---

## 1. Resumo Executivo

Esta implementação permite que o chefe escoteiro anexe uma imagem (foto) na conversa do chat para que o agente a analise usando a capacidade de **visão multimodal do GPT-4o**. Hoje o fluxo é exclusivamente textual: `components/ChatInterface.tsx` envia `{ message: string, conversationId? }` para `POST /api/chat/[agentId]/route.ts`, que persiste a mensagem do usuário em `messages` (apenas `content text`), monta o histórico das últimas 20 mensagens como `{ role, content: string }` e chama `openai.chat.completions.create({ model: "gpt-4o", stream: true, max_tokens: 1500 })`.

O escopo cobre: na **UI**, um botão de clipe/anexo ao lado do input, seleção de imagem, preview/thumbnail antes do envio com opção de remover, e exibição da imagem na bolha do usuário; no **upload**, o envio da imagem ao Storage (bucket `agent-chat-images`) via signed URL reaproveitando o padrão de `app/api/admin/agents/[id]/documents/upload-url/route.ts`, obtendo uma URL pública/assinada; no **backend**, aceitar opcionalmente uma `imageUrl` no body do chat, construir o `content` multimodal do usuário como array `[{type:"text"},{type:"image_url"}]` mantendo o streaming SSE; na **persistência**, uma migration adicionando a coluna `image_url text` à tabela `messages` para guardar a referência e re-renderizar a imagem ao recarregar a conversa; e **validações** de tipo (png/jpg/webp), tamanho máximo e limite de 1 imagem por mensagem.

## 2. Contexto e Motivação

### 2.1 Problema Atual

O chat do ScoutDoc.AI é puramente textual. Um chefe escoteiro que tem uma foto relevante — uma ficha preenchida à mão, uma tabela de um documento impresso, um formulário da UEB, um cartaz de atividade, um erro de tela do sistema — não tem como mostrá-la ao agente. Ele precisa transcrever manualmente o conteúdo para texto, o que é trabalhoso, sujeito a erros e inviável para conteúdo visual (diagramas, layouts, imagens). A interface (`ChatInterface.tsx`) só possui `textarea` + botão enviar, e o backend (`route.ts`) trata `message` como string pura, persistindo somente `content text` em `messages`.

### 2.2 Impacto do Problema

- **Perda de capacidade do modelo:** o GPT-4o suporta visão nativamente, mas o produto não expõe esse recurso, subutilizando o investimento no modelo multimodal.
- **Fricção no uso real:** documentos escoteiros são frequentemente físicos/escaneados; sem anexo de imagem, o usuário precisa digitar tudo manualmente.
- **Casos de uso bloqueados:** análise de fichas, leitura de tabelas fotografadas, interpretação de formulários e conferência visual ficam impossíveis.
- **Competitividade:** assistentes concorrentes já aceitam imagens; a ausência reduz a percepção de valor da ferramenta.

### 2.3 Soluções Consideradas

Comparação entre as duas estratégias principais de transporte da imagem até a API de visão:

| Solução | Prós | Contras | Decisão |
| --- | --- | --- | --- |
| **Data URL base64 direto no body** | Implementação simples; sem dependência de Storage; sem etapa extra de upload; funciona offline-first no client | Payload pesado (base64 infla ~33%); risco de estourar limites de body do route handler; difícil persistir referência reaproveitável; reenvio integral a cada turno encarece o histórico; não há thumbnail leve para recarregar conversa | ❌ Rejeitada como estratégia principal |
| **Upload ao Storage via signed URL + URL no body** | Payload do chat leve (só a URL); reaproveita o padrão de `documents/upload-url/route.ts`; URL persistível em `messages.image_url` para re-render; descarrega bytes do route handler; a API de visão aceita URL pública | Requer bucket, política de acesso e etapa de upload antes do envio; URL precisa ser acessível pela OpenAI (pública ou assinada com validade adequada) | ✅ **Adotada** |
| Híbrido: base64 para imagens muito pequenas, Storage acima de um limiar | Otimiza payload por tamanho | Dois caminhos de código e de persistência; maior complexidade de teste; ganho marginal | ❌ Rejeitada (over-engineering nesta versão) |

**Decisão:** adotar **upload ao Storage via signed URL**, persistindo `image_url` em `messages`. O base64 fica documentado como alternativa de fallback caso o bucket não esteja disponível, mas não é o caminho padrão.

## 3. Especificação Técnica

### 3.1 Visão Geral da Arquitetura

O fluxo estende o pipeline de chat existente com uma etapa de anexo:

- **Seleção + upload (client):** `ChatInterface.tsx` ganha um `<input type="file">` oculto acionado por um botão de clipe. Ao selecionar a imagem, valida tipo/tamanho no cliente, gera preview local (`URL.createObjectURL`), solicita uma signed URL ao endpoint de upload, envia os bytes ao Storage (bucket `agent-chat-images`) e obtém a `imageUrl` final.
- **Envio (client → backend):** `sendMessage` passa a incluir `imageUrl?` no body do `POST /api/chat/[agentId]`, junto de `message` (que pode ser vazio quando há só imagem).
- **Processamento (backend):** `route.ts` persiste a mensagem do usuário em `messages` com `content` (texto) e `image_url` (quando houver). Ao montar a chamada à OpenAI, o `content` do turno do usuário com imagem vira o array multimodal `[{type:"text",text},{type:"image_url",image_url:{url}}]`; turnos sem imagem permanecem como string. O `stream: true` é mantido.
- **Re-render (client):** ao recarregar a conversa, as mensagens trazem `image_url`; a bolha do usuário renderiza o texto e, abaixo, a imagem (thumbnail clicável).

### 3.2 Componentes Afetados

| Componente | Tipo | Ação | Descrição |
| --- | --- | --- | --- |
| `supabase/schema.sql` | Migration/Schema | Modificar | Adicionar coluna `image_url text` (nulável) à tabela `messages`; criar bucket `agent-chat-images` e políticas de Storage |
| `app/api/chat/[agentId]/route.ts` | Route Handler (POST) | Modificar | Aceitar `imageUrl` opcional no body; persistir em `messages.image_url`; construir `content` multimodal `[{type:"text"},{type:"image_url"}]` para o turno do usuário; manter streaming |
| `app/api/chat/[agentId]/upload-url/route.ts` | Route Handler (POST) | Criar | Gerar signed URL de upload para o bucket `agent-chat-images`, seguindo o padrão de `documents/upload-url/route.ts` |
| `components/ChatInterface.tsx` | Componente React (client) | Modificar | Botão de anexo + input file; validação client; preview/remover; incluir `imageUrl` no body; estender `interface Message` com `imageUrl`; renderizar imagem na bolha do usuário |
| `lib/imageValidation.ts` | Utilitário (novo) | Criar | Constantes e helpers de validação de tipo MIME e tamanho máximo, reusados no client e no backend |

### 3.3 Interfaces e Contratos

#### Entradas

- **Usuário (UI):** seleciona um arquivo de imagem (`image/png`, `image/jpeg`, `image/webp`) via botão de clipe; opcionalmente digita texto; o texto pode ficar vazio quando há imagem.
- **Mensagem (client `interface Message`):** estendida com `imageUrl?: string | null` além de `role`, `content`, `pending?`.

#### Saídas

- **Bolha do usuário:** renderiza `content` como texto (quando houver) e, abaixo, a imagem (thumbnail clicável que abre em tamanho maior).
- **Resposta do assistente:** stream SSE de texto, inalterado no formato; o conteúdo passa a refletir a análise visual.

#### Contrato do endpoint de upload

**`POST /api/chat/[agentId]/upload-url`** — Body JSON:

```json
{
  "fileName": "string",
  "contentType": "image/png | image/jpeg | image/webp",
  "fileSize": 0
}
```

Resposta de sucesso (`200`):

```json
{
  "uploadUrl": "https://...signed-upload-url...",
  "path": "agent-chat-images/<userId>/<uuid>.png",
  "publicUrl": "https://...accessible-url..."
}
```

- Valida `contentType` na allowlist e `fileSize` ≤ limite (RNF-001). Tipo/tamanho inválidos → `400`.
- Caminho namespaceado por usuário para isolamento.

#### Contrato do chat (novo body)

**`POST /api/chat/[agentId]`** — Body JSON (campo novo em **negrito**):

```json
{
  "message": "string",
  "conversationId": "string | undefined",
  "imageUrl": "string | null"
}
```

- `message`: pode ser `""` quando `imageUrl` está presente (mensagem só com imagem).
- `imageUrl`: opcional; URL acessível pela API da OpenAI.
- Pelo menos um entre `message` (não vazio) e `imageUrl` deve estar presente; caso contrário → `400`.

#### Formato multimodal enviado à OpenAI

O turno do usuário **com imagem** passa a usar `content` como array, conforme o contrato de visão do GPT-4o:

```json
{
  "role": "user",
  "content": [
    { "type": "text", "text": "Analise esta ficha e resuma os dados." },
    { "type": "image_url", "image_url": { "url": "https://...", "detail": "auto" } }
  ]
}
```

- Turnos **sem imagem** (histórico e mensagens só de texto) permanecem como `content: string`.
- Quando a mensagem tem só imagem, o item de texto pode ser omitido ou enviado com um texto padrão curto (ex.: "Analise a imagem anexada.") para orientar o modelo.

### 3.4 Modelos de Dados

Tabela `messages` (coluna adicionada):

| Coluna | Tipo | Nulável | Default | Descrição |
| --- | --- | --- | --- | --- |
| `image_url` | `text` | Sim | `NULL` | URL da imagem anexada à mensagem do usuário (Storage). `NULL` quando não há anexo |

DDL prevista (em `supabase/schema.sql`):

```sql
ALTER TABLE messages
  ADD COLUMN IF NOT EXISTS image_url text;
```

Bucket de Storage `agent-chat-images` com políticas que permitam: upload pela própria conta autenticada (caminho namespaceado por `userId`) e leitura suficiente para que a URL seja acessível pela OpenAI durante a análise (bucket público OU signed URL de leitura com validade adequada). As políticas RLS existentes da tabela `messages` (vinculadas à `conversation` do usuário) cobrem a nova coluna sem alteração, por operarem em nível de linha.

> **Decisão `image_url text` vs `attachments jsonb`:** optou-se por `image_url text` por simplicidade, dado o limite de 1 imagem por mensagem nesta versão. Caso se evolua para múltiplos anexos ou tipos variados (PDF, áudio), migrar para `attachments jsonb` (array de objetos `{ type, url }`) — registrado na seção 9.

### 3.5 Fluxo de Execução

1. **Seleção:** usuário clica no botão de clipe → abre o seletor de arquivo → escolhe uma imagem.
2. **Validação client:** `ChatInterface` valida tipo (png/jpg/webp) e tamanho (≤ limite) via `lib/imageValidation.ts`; se inválido, exibe erro e aborta.
3. **Preview:** gera preview local (`URL.createObjectURL`) exibido acima do input, com botão de remover.
4. **Upload:** ao enviar, o client solicita `POST /api/chat/[agentId]/upload-url`, recebe `uploadUrl`/`publicUrl`, faz `PUT` dos bytes para o Storage e obtém a `imageUrl`.
5. **Envio do chat:** `sendMessage` faz `POST /api/chat/[agentId]` com `{ message, conversationId?, imageUrl }`.
6. **Persistência:** `route.ts` insere a mensagem do usuário em `messages` com `content` e `image_url`.
7. **Montagem multimodal:** ao montar as mensagens para a OpenAI, o turno atual do usuário com imagem vira o array `[{type:"text"},{type:"image_url"}]`; demais turnos seguem como string. Histórico continua limitado às últimas 20 mensagens.
8. **Streaming:** `openai.chat.completions.create({ model: "gpt-4o", messages, stream: true, max_tokens: 1500 })` mantém o stream SSE; a resposta do assistente é persistida como hoje.
9. **Render:** a bolha do usuário mostra texto + thumbnail; ao recarregar a conversa, `image_url` reidrata a imagem.

### 3.6 Tratamento de Erros

- **Tipo de arquivo inválido:** bloqueado no client (mensagem clara) e revalidado no `upload-url` → `400`; não envia.
- **Tamanho acima do limite:** bloqueado no client e no `upload-url` → `400`; sugere comprimir/reduzir.
- **Falha de upload ao Storage:** `sendMessage` não prossegue com o chat; exibe erro e mantém o preview para nova tentativa; a mensagem não é persistida.
- **Mensagem vazia sem imagem:** `route.ts` retorna `400` (precisa de texto ou imagem).
- **URL inacessível pela OpenAI:** se a API de visão falhar ao buscar a imagem, capturar o erro do stream e retornar mensagem de erro amigável; logar para diagnóstico.
- **Imagem muito grande para a API de visão:** respeitar os limites de tamanho/resolução da API; o limite client (RNF-001) deve ser ≤ o limite da API para evitar rejeição tardia.
- **`image_url` malformada no banco ao recarregar:** o render valida a presença/forma da URL antes de exibir; ausência → bolha só com texto, sem crash.

## 4. Requisitos

### 4.1 Requisitos Funcionais

- **RF-001:** O usuário deve poder anexar uma imagem via botão de clipe ao lado do input do chat.
- **RF-002:** O `ChatInterface` deve exibir preview/thumbnail da imagem selecionada antes do envio, com opção de remover.
- **RF-003:** O usuário deve poder enviar uma mensagem contendo apenas imagem (sem texto).
- **RF-004:** A imagem selecionada deve ser enviada ao Storage e ter sua URL obtida antes do envio do chat.
- **RF-005:** `POST /api/chat/[agentId]` deve aceitar `imageUrl` opcional no body e persisti-la em `messages.image_url`.
- **RF-006:** O backend deve construir o `content` multimodal `[{type:"text"},{type:"image_url"}]` para o turno do usuário com imagem, mantendo o streaming.
- **RF-007:** A bolha do usuário deve exibir a imagem enviada (thumbnail), tanto no envio quanto ao recarregar a conversa.
- **RF-008:** O sistema deve aceitar apenas 1 imagem por mensagem nesta versão.

### 4.2 Requisitos Não-Funcionais

- **RNF-001:** A imagem deve ser validada por tipo MIME (`image/png`, `image/jpeg`, `image/webp`) e tamanho máximo (recomendado ≤ 10 MB, e ≤ ao limite da API de visão), no client e no servidor.
- **RNF-002:** A migration deve ser idempotente (`ADD COLUMN IF NOT EXISTS`) e não destrutiva.
- **RNF-003:** O payload do chat deve permanecer leve, transportando apenas a URL da imagem (não base64), conforme decisão 2.3.
- **RNF-004:** A tipagem TypeScript dos novos campos (`imageUrl` no body e em `interface Message`) deve ser explícita e nulável onde aplicável, sem `any`.
- **RNF-005:** O preview e a imagem na bolha devem ser responsivos e acessíveis (alt text, botão de remover focável, contraste da paleta `scout-*`/`azure-*`).
- **RNF-006:** As políticas de Storage e RLS não devem expor imagens de um usuário a outro; caminho namespaceado por `userId`.

### 4.3 Restrições e Limitações

- Nesta versão, apenas 1 imagem por mensagem; sem múltiplos anexos.
- Apenas imagens (sem PDF, áudio ou vídeo).
- A imagem é reenviada como URL no histórico apenas no turno em que foi anexada; turnos antigos com imagem mantêm a URL persistida, mas a inclusão multimodal no histórico pode ser limitada para conter custo de tokens (decisão em 9).
- Sem edição/anotação da imagem antes do envio (somente anexar/remover).
- Modelo fixo `gpt-4o` (já suporta visão); sem seleção de modelo.

## 5. Critérios de Aceitação

- [ ] **CA-001:** A coluna `image_url text` existe na tabela `messages` após a migration, sem perda de dados, e o bucket `agent-chat-images` está disponível com políticas adequadas.
- [ ] **CA-002:** No `ChatInterface`, o botão de clipe abre o seletor e permite escolher uma imagem png/jpg/webp.
- [ ] **CA-003:** Após selecionar, um preview/thumbnail é exibido com botão de remover funcional.
- [ ] **CA-004:** Selecionar um arquivo de tipo não permitido ou acima do tamanho máximo é bloqueado com mensagem clara, sem upload.
- [ ] **CA-005:** Ao enviar, a imagem é carregada no Storage e a `imageUrl` é incluída no body do `POST /api/chat/[agentId]`.
- [ ] **CA-006:** É possível enviar uma mensagem só com imagem (texto vazio) e o agente responde analisando-a.
- [ ] **CA-007:** O backend monta o `content` multimodal `[{type:"text"},{type:"image_url"}]` e a resposta chega via streaming normalmente.
- [ ] **CA-008:** A mensagem do usuário é persistida com `image_url`, e ao recarregar a conversa a imagem reaparece na bolha.
- [ ] **CA-009:** Enviar mensagem sem texto e sem imagem retorna `400` e não persiste.
- [ ] **CA-010:** Uma falha de upload ao Storage impede o envio do chat e exibe erro, preservando o preview.

## 6. Plano de Testes

### 6.1 Testes Unitários

- `lib/imageValidation.ts`: aceita png/jpg/webp; rejeita outros tipos; aceita ≤ limite e rejeita acima.
- Construção do `content` multimodal: com imagem → array `[{type:"text"},{type:"image_url"}]`; sem imagem → string.
- Validação do body do chat: `400` quando `message` vazio e `imageUrl` ausente; OK quando ao menos um presente.
- Lógica de render da bolha: com `imageUrl` válida → exibe imagem; ausente/inválida → só texto.

### 6.2 Testes de Integração

- `POST /api/chat/[agentId]/upload-url` retorna signed URL para tipo/tamanho válidos e `400` para inválidos.
- `POST /api/chat/[agentId]` com `imageUrl` persiste `messages.image_url` e dispara stream com payload multimodal.
- Recarregar a conversa traz `image_url` nas mensagens e o client reidrata a imagem.
- Isolamento de Storage: usuário não acessa caminho de outro usuário.

### 6.3 Testes de Aceitação

- Fluxo end-to-end: anexar foto de uma ficha → enviar com texto "resuma os dados" → receber análise via stream → recarregar página e ver a imagem na bolha.
- Fluxo só-imagem: anexar imagem sem texto → enviar → receber análise.
- Remover imagem do preview antes de enviar → enviar só texto normalmente.

### 6.4 Casos de Borda

- Imagem exatamente no tamanho limite (aceita) e 1 byte acima (rejeitada).
- Imagem com extensão enganosa (ex.: `.png` mas MIME diferente) → validação por MIME real.
- Mensagem só com imagem (texto vazio) → texto padrão injetado para orientar o modelo.
- Falha de rede no `PUT` ao Storage → erro tratado, preview preservado.
- URL de imagem expirada/inacessível no momento da chamada à OpenAI → erro amigável no stream.
- Conversa antiga com mensagem que tem `image_url` → re-render correto sem crash.
- Imagem muito grande para a API de visão, porém dentro do limite client → erro tratado e orientação ao usuário.

## 7. Riscos e Mitigações

| Risco | Probabilidade | Impacto | Mitigação |
| --- | --- | --- | --- |
| URL da imagem não acessível pela OpenAI (bucket privado/assinatura curta) | Média | Alto | Garantir bucket público ou signed URL com validade suficiente para a chamada; testar end-to-end (CA-007) |
| Payload pesado se cair no fallback base64 | Baixa | Médio | Estratégia padrão é Storage (RNF-003); base64 só como contingência documentada |
| Custo de tokens elevado ao reenviar imagens no histórico | Média | Médio | Limitar inclusão multimodal a turnos recentes; manter histórico antigo como texto (decisão 9) |
| Upload de arquivo malicioso/tipo inesperado | Média | Médio | Allowlist de MIME + limite de tamanho no client e servidor; caminho namespaceado (RNF-006) |
| Vazamento de imagem entre usuários | Baixa | Alto | Caminho por `userId` e políticas de Storage/RLS; teste de isolamento (6.2) |
| Limite de tamanho/resolução da API de visão excedido | Média | Médio | Limite client ≤ limite da API; mensagem orientando a reduzir (6.4) |
| Migration aplicada parcialmente em produção | Baixa | Alto | DDL idempotente `IF NOT EXISTS`; aplicar em staging antes |

## 8. Dependências

### 8.1 Dependências Internas

- `utils/supabase/server.ts` e `utils/supabase/client.ts` para autenticação e acesso ao Storage/Postgres.
- Padrão de signed URL de `app/api/admin/agents/[id]/documents/upload-url/route.ts` como referência para o novo endpoint de upload de imagem.
- Estrutura existente de `ChatInterface.tsx` (input, `sendMessage`, leitura de stream SSE, `interface Message`) e de `route.ts` (persistência em `messages`, montagem do histórico, streaming).
- Esquema `supabase/schema.sql` (tabelas `messages`/`conversations` e RLS).
- Paleta CSS `scout-*` / `azure-*` / `gold-*` / `cream-*` para estilização do botão de anexo, preview e bolha.

### 8.2 Dependências Externas

- `openai@6` — API de visão do `gpt-4o` (`chat.completions.create` com `content` multimodal e `stream: true`).
- `@supabase/*` — Auth, Postgres e Storage (bucket `agent-chat-images`).
- `lucide-react` — ícones (clipe/anexo, remover).
- `framer-motion` — animações de preview/bolha (já no projeto).
- Next.js 16 (App Router), React 19, TypeScript, Tailwind CSS v4 — sem novas dependências de pacote.

## 9. Observações e Decisões de Design

- **Storage sobre base64:** decisão central registrada em 2.3 — payload do chat leve, URL persistível e reaproveitável, descarregando bytes do route handler. Base64 fica como contingência documentada.
- **`image_url text` sobre `attachments jsonb`:** simplicidade para o limite de 1 imagem por mensagem. Migração para `attachments jsonb` prevista caso se evolua para múltiplos anexos ou outros tipos (PDF/áudio).
- **Histórico multimodal limitado:** para conter custo de tokens, a reinclusão de imagens no histórico deve restringir-se a turnos recentes; mensagens antigas com `image_url` mantêm a referência persistida, mas podem entrar como texto no histórico enviado ao modelo.
- **Mensagem só com imagem:** quando não há texto, injeta-se um texto padrão curto (ex.: "Analise a imagem anexada.") para orientar o GPT-4o, evitando ambiguidade.
- **Validação em dois pontos:** client (UX imediata) e servidor (segurança/consistência), seguindo defesa em profundidade, com constantes compartilhadas em `lib/imageValidation.ts`.
- **Isolamento por usuário:** caminho de Storage namespaceado por `userId` para impedir acesso cruzado, alinhado às políticas RLS de `messages`.
- **`detail: "auto"`:** usar o nível de detalhe automático da API de visão por padrão, balanceando custo e qualidade; ajustável futuramente se necessário.
