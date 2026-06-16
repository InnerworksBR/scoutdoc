# Tarefas: Foto de Avatar do Agente

> **Implementação:** 005 - Foto de Avatar do Agente
> **Spec:** [spec.md](./spec.md)
> **Progresso:** 0/9 tarefas concluídas (0%)
> **Última atualização:** 2026-06-16

---

## Legenda

- `[ ]` — Pendente
- `[x]` — Concluída
- `[!]` — Bloqueada (ver observação)
- `[-]` — Cancelada

---

## Tarefas

### Fase 1: Banco + Storage

- [ ] **T-001:** Migration da coluna `avatar_url` e atualização do schema
  - **Descrição:** Criar migration adicionando `ALTER TABLE agents ADD COLUMN avatar_url text;` (nullable) e refletir a coluna em `supabase/schema.sql`.
  - **Arquivos envolvidos:** `supabase/migrations/00X_agent_avatar_url.sql`, `supabase/schema.sql`
  - **Critério de conclusão:** Coluna `avatar_url text` existe na tabela `agents` e o `schema.sql` está consistente com a migration.
  - **Dependências:** Nenhuma
  - **Estimativa:** Pequena
  - **Observações:** Manter nullable; `NULL`/vazio significa usar inicial + `avatar_color`.

- [ ] **T-002:** Criar bucket público `avatars` e políticas de acesso
  - **Descrição:** Criar (ou declarar na migration) o bucket público `avatars` com leitura pública e escrita restrita ao service role (admin). Garantir que objetos sejam acessíveis via `getPublicUrl`.
  - **Arquivos envolvidos:** `supabase/migrations/00X_agent_avatar_url.sql` (ou script de Storage)
  - **Critério de conclusão:** Bucket `avatars` existe, leitura pública funciona e não há políticas de escrita para usuários comuns.
  - **Dependências:** Nenhuma
  - **Estimativa:** Pequena
  - **Observações:** Espelhar a abordagem do bucket `agent-documents`, porém público.

- [ ] **T-003:** Configurar `remotePatterns` do Supabase Storage no `next.config.ts`
  - **Descrição:** Adicionar `images.remotePatterns` apontando para o host do Supabase Storage (`<project>.supabase.co`, path `/storage/v1/object/public/**`) para habilitar `next/image`.
  - **Arquivos envolvidos:** `next.config.ts`
  - **Critério de conclusão:** `next/image` carrega imagens do Storage sem erro de host não configurado em dev.
  - **Dependências:** Nenhuma
  - **Estimativa:** Pequena
  - **Observações:** Derivar o host de `NEXT_PUBLIC_SUPABASE_URL`.

### Fase 2: Backend Upload

- [ ] **T-004:** Rota de signed URL para upload de avatar
  - **Descrição:** Criar `POST /api/admin/agents/[id]/avatar/upload-url` espelhando `documents/upload-url`: `requireAdmin`, `createServiceClient`, validar `contentType` (png/jpeg/webp), gerar `createSignedUploadUrl` no bucket `avatars` e retornar `{ signedUrl, filePath, publicUrl }`.
  - **Arquivos envolvidos:** `app/api/admin/agents/[id]/avatar/upload-url/route.ts`
  - **Critério de conclusão:** Rota retorna 401 sem admin, 400 para tipo inválido, 500 sem service key, e 200 com `signedUrl`/`publicUrl` no sucesso.
  - **Dependências:** T-002
  - **Estimativa:** Média
  - **Observações:** Path do objeto: `${agentId}/${Date.now()}_${safeName}`; sanitizar nome como na rota de documentos.

- [ ] **T-005:** Persistir `avatar_url` no CRUD de agentes
  - **Descrição:** Atualizar `PUT /api/admin/agents/[id]` para aceitar e gravar `avatar_url` (string ou `null` para remoção) e incluir o campo em `route.ts` (select/insert) quando aplicável.
  - **Arquivos envolvidos:** `app/api/admin/agents/[id]/route.ts`, `app/api/admin/agents/route.ts`
  - **Critério de conclusão:** PUT com `avatar_url` persiste o valor; PUT com `null` zera o campo; respostas incluem `avatar_url`.
  - **Dependências:** T-001
  - **Estimativa:** Pequena
  - **Observações:** Validar que `null`/vazio seja tratado como remoção.

### Fase 3: Admin Form

- [ ] **T-006:** Upload de avatar com preview e remoção no `AgentForm`
  - **Descrição:** Adicionar estado `avatarUrl`, seletor de arquivo com validação local (png/jpg/webp ≤ 2 MB), preview (atual ou recém-selecionado via `URL.createObjectURL`), fluxo de upload (POST upload-url → PUT Storage → guardar `publicUrl`) e botão "Remover foto" (volta para inicial + `avatar_color`). Enviar `avatar_url` no submit.
  - **Arquivos envolvidos:** `components/admin/AgentForm.tsx`
  - **Critério de conclusão:** Admin envia, vê preview, remove e salva; erros de tipo/tamanho aparecem inline; `avatar_url` chega ao backend.
  - **Dependências:** T-004, T-005
  - **Estimativa:** Média
  - **Observações:** Manter o seletor de `avatar_color` existente como fallback; reusar `Loader2`/ícones de `lucide-react`.

### Fase 4: Render

- [ ] **T-007:** Renderizar avatar com foto/fallback no `ChatInterface`
  - **Descrição:** Onde hoje se usa a inicial sobre `agentColor` (sidebar, topbar, empty state e bolhas do assistant), passar a exibir `<Image>`/`<img>` redondo quando `avatar_url` existir, com `alt` descritivo e `onError` → fallback para inicial+cor. Atualizar props/tipos para receber `avatar_url`.
  - **Arquivos envolvidos:** `components/ChatInterface.tsx`
  - **Critério de conclusão:** Todos os pontos de avatar do chat exibem foto quando disponível e revertem para inicial+cor caso ausente ou com falha.
  - **Dependências:** T-003, T-005
  - **Estimativa:** Média
  - **Observações:** Considerar extrair um pequeno componente/helper de avatar reutilizável para consistência.

- [ ] **T-008:** Exibir foto nos cards e select de assistentes
  - **Descrição:** Em `app/assistants/page.tsx`, renderizar a foto nos cards com fallback; em `app/assistants/[agentId]/page.tsx`, incluir `avatar_url` no select e repassar ao `ChatInterface`. Garantir `avatar_url` em todos os selects de agente.
  - **Arquivos envolvidos:** `app/assistants/page.tsx`, `app/assistants/[agentId]/page.tsx`
  - **Critério de conclusão:** Lista e página do agente carregam `avatar_url` e exibem foto com fallback para inicial+cor.
  - **Dependências:** T-003, T-005
  - **Estimativa:** Pequena
  - **Observações:** Reusar o mesmo componente/helper de avatar da T-007, se criado.

### Fase 5: Testes

- [ ] **T-009:** Validação ponta a ponta dos critérios de aceitação
  - **Descrição:** Verificar manualmente todos os CA da spec: upload válido/ inválido, persistência, remoção, render com/sem foto em todas as telas, fallback de URL quebrada, `alt` presente e `next/image` sem erro de host.
  - **Arquivos envolvidos:** Todos os componentes afetados (verificação)
  - **Critério de conclusão:** CA-001 a CA-008 verificados e marcados na spec; nenhum erro de console relacionado a imagens.
  - **Dependências:** T-006, T-007, T-008
  - **Estimativa:** Média
  - **Observações:** Testar um agente com foto e outro sem foto (legado) para confirmar o fallback.

---

## Registro de Progresso

| Tarefa | Status | Data de Conclusão | Observações |
|--------|--------|-------------------|-------------|
| T-001  | ⬜ Pendente | — | — |
| T-002  | ⬜ Pendente | — | — |
| T-003  | ⬜ Pendente | — | — |
| T-004  | ⬜ Pendente | — | — |
| T-005  | ⬜ Pendente | — | — |
| T-006  | ⬜ Pendente | — | — |
| T-007  | ⬜ Pendente | — | — |
| T-008  | ⬜ Pendente | — | — |
| T-009  | ⬜ Pendente | — | — |

---

> **📌 NOTA:** Atualize este documento conforme as tarefas forem concluídas.
> Marque `[x]` nas tarefas finalizadas e atualize a tabela de progresso.
