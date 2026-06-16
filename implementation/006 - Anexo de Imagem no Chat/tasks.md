# Tarefas: 006 - Anexo de Imagem no Chat com Visão GPT-4o

> **Implementação:** 006 - Anexo de Imagem no Chat com Visão GPT-4o
> **Spec:** [spec.md](./spec.md)
> **Progresso:** 9/9 tarefas concluídas (100%)
> **Última atualização:** 2026-06-16

## Legenda
- `[ ]` Pendente · `[x]` Concluída · `[!]` Bloqueada · `[-]` Cancelada

## Tarefas

### Fase 1: Banco/Migration

- [ ] **T-001:** Adicionar coluna `image_url` à tabela `messages` e bucket de Storage
  - **Descrição:** Criar a migration idempotente que adiciona `image_url text` (nulável) à tabela `messages`. Criar o bucket `agent-chat-images` no Storage com políticas que permitam upload pela conta autenticada (caminho namespaceado por `userId`) e leitura suficiente para que a URL seja acessível pela OpenAI (bucket público ou signed URL de leitura). Confirmar que a RLS existente de `messages` cobre a nova coluna sem alteração.
  - **Arquivos envolvidos:** `supabase/schema.sql`
  - **Critério de conclusão:** DDL com `ADD COLUMN IF NOT EXISTS` aplicada; coluna presente; bucket disponível com políticas; nenhum dado perdido; RLS inalterada (CA-001).
  - **Dependências:** Nenhuma
  - **Estimativa:** Pequena
  - **Observações:** Aplicar em staging antes de produção. Decisão `image_url text` vs `attachments jsonb` registrada na spec (3.4, 9).

### Fase 2: Backend Visão

- [ ] **T-002:** Aceitar `imageUrl` no body do chat e validar entrada
  - **Descrição:** Estender o handler `POST /api/chat/[agentId]` para ler `imageUrl` opcional do body. Validar que ao menos um entre `message` (não vazio) e `imageUrl` está presente, retornando `400` caso contrário.
  - **Arquivos envolvidos:** `app/api/chat/[agentId]/route.ts`
  - **Critério de conclusão:** Body com `imageUrl` aceito; mensagem sem texto e sem imagem retorna `400` (CA-009).
  - **Dependências:** T-001
  - **Estimativa:** Pequena
  - **Observações:** `message` pode ser `""` quando há imagem.

- [ ] **T-003:** Persistir `image_url` e montar `content` multimodal para o GPT-4o
  - **Descrição:** Persistir a mensagem do usuário em `messages` incluindo `image_url` quando presente. Ao montar as mensagens para a OpenAI, transformar o turno do usuário com imagem no array `[{type:"text",text},{type:"image_url",image_url:{url,detail:"auto"}}]`; turnos sem imagem permanecem como string. Injetar texto padrão curto quando a mensagem for só imagem. Manter `model:"gpt-4o"`, `stream:true`, `max_tokens:1500` e o limite de 20 mensagens no histórico.
  - **Arquivos envolvidos:** `app/api/chat/[agentId]/route.ts`
  - **Critério de conclusão:** `messages.image_url` persistido; payload multimodal correto; streaming preservado (CA-007, CA-008 parcial).
  - **Dependências:** T-002
  - **Estimativa:** Média
  - **Observações:** Limitar inclusão multimodal a turnos recentes para conter custo de tokens (spec 9).

### Fase 3: Upload/Storage

- [ ] **T-004:** Utilitário de validação de imagem compartilhado
  - **Descrição:** Criar `lib/imageValidation.ts` com a allowlist de MIME (`image/png`, `image/jpeg`, `image/webp`), o tamanho máximo (≤ 10 MB, ≤ limite da API de visão) e helpers de validação reutilizáveis no client e no backend.
  - **Arquivos envolvidos:** `lib/imageValidation.ts`
  - **Critério de conclusão:** Constantes e helpers exportados; usados em T-005 e T-007; sem `any` (RNF-001, RNF-004).
  - **Dependências:** Nenhuma
  - **Estimativa:** Pequena
  - **Observações:** Fonte única de verdade para tipo/tamanho.

- [ ] **T-005:** Endpoint de signed URL para upload de imagem do chat
  - **Descrição:** Criar `POST /api/chat/[agentId]/upload-url` seguindo o padrão de `documents/upload-url/route.ts`. Receber `{ fileName, contentType, fileSize }`, validar tipo/tamanho via `lib/imageValidation.ts`, gerar signed URL de upload no bucket `agent-chat-images` com caminho namespaceado por `userId`, e retornar `uploadUrl`/`path`/`publicUrl`. Tipo/tamanho inválidos → `400`.
  - **Arquivos envolvidos:** `app/api/chat/[agentId]/upload-url/route.ts`, `lib/imageValidation.ts` (uso), `utils/supabase/server.ts` (uso)
  - **Critério de conclusão:** Signed URL retornada para válidos; `400` para inválidos; caminho isolado por usuário (CA-004 parcial, CA-005 parcial, RNF-006).
  - **Dependências:** T-001, T-004
  - **Estimativa:** Média
  - **Observações:** Reaproveitar o padrão de upload de documentos existente.

### Fase 4: Frontend Chat

- [ ] **T-006:** Botão de anexo, seleção e preview no `ChatInterface`
  - **Descrição:** Adicionar botão de clipe (lucide-react) ao lado do input, com `<input type="file">` oculto restrito a png/jpg/webp. Ao selecionar, validar tipo/tamanho via `lib/imageValidation.ts`, gerar preview local (`URL.createObjectURL`) acima do input e botão de remover. Bloquear arquivos inválidos com mensagem clara.
  - **Arquivos envolvidos:** `components/ChatInterface.tsx`, `lib/imageValidation.ts` (uso)
  - **Critério de conclusão:** Botão abre seletor; preview e remover funcionam; inválidos bloqueados (CA-002, CA-003, CA-004).
  - **Dependências:** T-004
  - **Estimativa:** Média
  - **Observações:** Estilização com paleta `scout-*`/`azure-*`; acessibilidade (RNF-005).

- [ ] **T-007:** Upload e envio da imagem em `sendMessage`
  - **Descrição:** No `sendMessage`, quando houver imagem selecionada, solicitar a signed URL (`/api/chat/[agentId]/upload-url`), fazer `PUT` dos bytes ao Storage, obter a `imageUrl` e incluí-la no body do `POST /api/chat/[agentId]` junto de `message` (que pode ser vazio). Tratar falha de upload (não enviar o chat, exibir erro, preservar preview).
  - **Arquivos envolvidos:** `components/ChatInterface.tsx`
  - **Critério de conclusão:** Upload feito e `imageUrl` enviada no body; mensagem só-imagem suportada; falha de upload tratada (CA-005, CA-006, CA-010).
  - **Dependências:** T-005, T-006
  - **Estimativa:** Média
  - **Observações:** Limpar preview e estado após envio bem-sucedido.

- [ ] **T-008:** Renderizar imagem na bolha do usuário e ao recarregar
  - **Descrição:** Estender `interface Message` com `imageUrl?: string | null`. Renderizar, na bolha do usuário, o texto (quando houver) e abaixo a imagem como thumbnail clicável (abre em tamanho maior), com `alt`. Garantir que ao recarregar a conversa as mensagens tragam `image_url` e a imagem reapareça; validar a URL antes de exibir para evitar crash.
  - **Arquivos envolvidos:** `components/ChatInterface.tsx`, `app/api/chat/[agentId]/route.ts` (retorno do histórico, se aplicável)
  - **Critério de conclusão:** Imagem exibida na bolha no envio e no reload; sem crash com URL ausente/inválida (CA-008, RNF-005).
  - **Dependências:** T-003, T-007
  - **Estimativa:** Média
  - **Observações:** Confirmar que o carregamento da conversa inclui `image_url`.

### Fase 5: Testes

- [ ] **T-009:** Testes unitários, integração e aceitação
  - **Descrição:** Cobrir: validação de tipo/tamanho em `lib/imageValidation.ts` (unit), construção do `content` multimodal (unit), validação `400` do body sem texto/imagem (unit/integração), `upload-url` para válidos/inválidos (integração), persistência de `image_url` e streaming multimodal (integração), isolamento de Storage entre usuários (integração) e fluxos de aceitação (anexar + enviar + reload; só-imagem; remover preview). Incluir casos de borda da spec (6.4).
  - **Arquivos envolvidos:** Suíte de testes correspondente a `app/api/chat/[agentId]/*`, `components/ChatInterface.tsx`, `lib/imageValidation.ts`
  - **Critério de conclusão:** Todos os critérios CA-001..CA-010 verificados; casos de borda cobertos.
  - **Dependências:** T-003, T-005, T-008
  - **Estimativa:** Média
  - **Observações:** Priorizar testes de acessibilidade da URL pela OpenAI e de validação/limite.

## Registro de Progresso

| Tarefa | Status | Data de Conclusão | Observações |
| --- | --- | --- | --- |
| T-001 | ✅ Concluída | — | Migration `image_url` em `messages` + bucket `agent-chat-images` |
| T-002 | ✅ Concluída | — | Aceitar `imageUrl` no body e validar entrada |
| T-003 | ✅ Concluída | — | Persistir `image_url` e montar `content` multimodal |
| T-004 | ✅ Concluída | — | Utilitário `lib/imageValidation.ts` |
| T-005 | ✅ Concluída | — | Endpoint signed URL de upload de imagem |
| T-006 | ✅ Concluída | — | Botão de anexo, seleção e preview |
| T-007 | ✅ Concluída | — | Upload e envio da imagem em `sendMessage` |
| T-008 | ✅ Concluída | — | Render da imagem na bolha e no reload |
| T-009 | ✅ Concluída | — | Testes unit/integração/aceitação |
