# Tarefas: Foto de Perfil do Usuário

> **Implementação:** 007 - Foto de Perfil do Usuário
> **Spec:** [spec.md](./spec.md)
> **Progresso:** 9/9 tarefas concluídas (100%)
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

- [ ] **T-001:** Migration de colunas e bucket de avatares
  - **Descrição:** Criar migration que adiciona `avatar_url text` e `display_name text` a `profiles` (com `add column if not exists`), cria o bucket público `user-avatars` (com `file_size_limit` de 2 MB e `allowed_mime_types` para PNG/JPEG/WebP) e define as políticas de Storage (leitura pública; insert/update/delete restritos ao prefixo `${user.id}/` via `(storage.foldername(name))[1] = auth.uid()::text`). Refletir as mesmas alterações em `supabase/schema.sql`.
  - **Arquivos envolvidos:** `supabase/migrations/0007_user_avatar.sql`, `supabase/schema.sql`
  - **Critério de conclusão:** Migration aplica sem erro e é idempotente; `profiles` tem as duas colunas; bucket `user-avatars` existe com políticas corretas.
  - **Dependências:** Nenhuma
  - **Estimativa:** Média
  - **Observações:** A política `profiles_self_update` já cobre o UPDATE de `avatar_url`/`display_name`; não criar nova política na tabela. Atende CA-001, CA-002.

- [ ] **T-002:** Configurar `remotePatterns` para o Storage no Next.js
  - **Descrição:** Adicionar `images.remotePatterns` em `next.config.ts` apontando para o host do Supabase Storage (derivado de `NEXT_PUBLIC_SUPABASE_URL`, path `/storage/v1/object/public/**`), preservando a configuração `experimental.serverActions` existente.
  - **Arquivos envolvidos:** `next.config.ts`
  - **Critério de conclusão:** `next/image` carrega uma URL pública do bucket sem erro de "hostname not configured".
  - **Dependências:** Nenhuma
  - **Estimativa:** Pequena
  - **Observações:** Atende CA-008, RNF-003.

### Fase 2: Backend Upload

- [ ] **T-003:** Rota de signed URL para avatar
  - **Descrição:** Criar `POST /api/profile/avatar/upload-url` que exige sessão (`supabase.auth.getUser()`, `401` se ausente), valida `contentType` contra a allowlist (PNG/JPEG/WebP), e gera `createSignedUploadUrl` no bucket `user-avatars` com `filePath = ${user.id}/${Date.now()}.${ext}`. Espelhar o padrão de `app/api/admin/agents/[id]/documents/upload-url/route.ts`, sem `requireAdmin`.
  - **Arquivos envolvidos:** `app/api/profile/avatar/upload-url/route.ts`
  - **Critério de conclusão:** Rota retorna `{ signedUrl, filePath }` para usuário autenticado e `400`/`401`/`500` nos casos de erro previstos.
  - **Dependências:** T-001
  - **Estimativa:** Média
  - **Observações:** Atende RF-007, parte do fluxo 3.5.

- [ ] **T-004:** Rota de persistência e remoção do avatar
  - **Descrição:** Criar `app/api/profile/avatar/route.ts`. `POST` recebe `{ filePath }`, valida que começa com `${user.id}/` (`400` caso contrário), resolve a `publicUrl` e faz `UPDATE profiles SET avatar_url = ... WHERE id = auth.uid()`. `DELETE` remove o objeto do Storage e zera `avatar_url`. Ambos exigem sessão.
  - **Arquivos envolvidos:** `app/api/profile/avatar/route.ts`
  - **Critério de conclusão:** `POST` persiste `avatar_url` e retorna `{ avatarUrl }`; `DELETE` limpa a foto; `filePath` fora do prefixo retorna `400`.
  - **Dependências:** T-003
  - **Estimativa:** Média
  - **Observações:** Atende RF-002, RF-005, CA-007, CA-009.

### Fase 3: UI Perfil

- [ ] **T-005:** Componente reutilizável `UserAvatar`
  - **Descrição:** Criar `components/UserAvatar.tsx` que renderiza `next/image` quando `avatarUrl` existe (com `alt` descritivo, `object-cover`, `onError` → fallback) e a inicial do email/`displayName` num círculo (paleta `scout-*`) quando ausente. Props: `avatarUrl`, `email`, `displayName`, `size`, `className`.
  - **Arquivos envolvidos:** `components/UserAvatar.tsx`
  - **Critério de conclusão:** Componente exibe foto ou inicial corretamente e tem `alt` em toda imagem.
  - **Dependências:** T-002
  - **Estimativa:** Média
  - **Observações:** Atende RF-003, RNF-002, CA-006, CA-010.

- [ ] **T-006:** Página e cliente de Perfil
  - **Descrição:** Criar `app/profile/page.tsx` (server: carrega `profiles.avatar_url`/`display_name` do usuário) e `components/ProfileClient.tsx` (preview com `UserAvatar`, seleção de arquivo, validação de tipo/tamanho ≤ 2 MB, orquestração do fluxo upload-url → PUT → POST avatar, botão "Remover foto", e campo opcional de `display_name`). Aplicar paleta e acessibilidade (botões acionáveis por teclado, rótulos claros).
  - **Arquivos envolvidos:** `app/profile/page.tsx`, `components/ProfileClient.tsx`
  - **Critério de conclusão:** Usuário envia/troca/remove a foto em `/profile` e vê o resultado refletido; validações de tipo/tamanho funcionam com mensagens claras.
  - **Dependências:** T-003, T-004, T-005
  - **Estimativa:** Grande
  - **Observações:** Atende RF-001, RF-005, RF-006, CA-003, RNF-002, 3.6.

### Fase 4: Render Chat/Dashboard

- [ ] **T-007:** Render do avatar no Chat
  - **Descrição:** Em `components/ChatInterface.tsx`, adicionar prop `userAvatarUrl?: string`, substituir o bloco da inicial fixa do usuário (linhas ~360-367) pelo `UserAvatar`. Em `app/assistants/[agentId]/page.tsx`, buscar `avatar_url`/`display_name` do profile (junto da consulta já existente) e passar `userAvatarUrl` ao `ChatInterface`.
  - **Arquivos envolvidos:** `components/ChatInterface.tsx`, `app/assistants/[agentId]/page.tsx`
  - **Critério de conclusão:** A foto do usuário aparece no chat quando existir; inicial como fallback quando ausente.
  - **Dependências:** T-005
  - **Estimativa:** Média
  - **Observações:** Atende RF-003, CA-004, CA-006.

- [ ] **T-008:** Render do avatar no Dashboard
  - **Descrição:** Em `app/dashboard/page.tsx`, buscar `avatar_url`/`display_name` do profile e repassar para `components/DashboardLayout.tsx` / `components/DashboardClient.tsx`, exibindo `UserAvatar` no cabeçalho/menu, com link para `/profile`. Fallback de inicial preservado.
  - **Arquivos envolvidos:** `app/dashboard/page.tsx`, `components/DashboardLayout.tsx`, `components/DashboardClient.tsx`
  - **Critério de conclusão:** A foto aparece no dashboard quando existir; inicial como fallback; link para `/profile` funciona.
  - **Dependências:** T-005
  - **Estimativa:** Média
  - **Observações:** Atende RF-004, CA-005, CA-006.

### Fase 5: Testes

- [ ] **T-009:** Verificação dos critérios de aceitação e casos de borda
  - **Descrição:** Validar manualmente CA-001…CA-010 com Supabase configurado: upload/troca/remoção, fallback de usuário sem foto, `filePath` cruzado retornando `400`, `next/image` sem erro de host, e os edge cases da seção 6.4 (URL órfã com `onError`, email indefinido, upload interrompido, uploads em sequência). Testar políticas de Storage com dois usuários distintos.
  - **Arquivos envolvidos:** `implementation/007 - Foto de Perfil do Usuario/spec.md` (checklist de CA)
  - **Critério de conclusão:** Todos os CA marcados; casos de borda confirmados; nenhuma escrita cruzada possível entre usuários.
  - **Dependências:** T-006, T-007, T-008
  - **Estimativa:** Média
  - **Observações:** Cobre seções 6.1-6.4 da spec.

---

## Registro de Progresso

| Tarefa | Status | Data de Conclusão | Observações |
|--------|--------|-------------------|-------------|
| T-001  | ✅ Concluída | — | — |
| T-002  | ✅ Concluída | — | — |
| T-003  | ✅ Concluída | — | — |
| T-004  | ✅ Concluída | — | — |
| T-005  | ✅ Concluída | — | — |
| T-006  | ✅ Concluída | — | — |
| T-007  | ✅ Concluída | — | — |
| T-008  | ✅ Concluída | — | — |
| T-009  | ✅ Concluída | — | — |

---

> **📌 NOTA:** Atualize este documento conforme as tarefas forem concluídas.
> Marque `[x]` nas tarefas finalizadas e atualize a tabela de progresso.
