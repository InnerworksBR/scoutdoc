# Foto de Perfil do Usuário

> **ID:** 007
> **Status:** 🟡 Planejada
> **Prioridade:** 🟢 Baixa
> **Criada em:** 2026-06-16
> **Última atualização:** 2026-06-16
> **Autor:** Agente AI

---

## 1. Resumo Executivo

Permitir que cada usuário (chefe escoteiro) tenha uma foto de perfil exibida no chat e no dashboard do ScoutDoc.AI. A foto será armazenada em um bucket público de Storage do Supabase, sob um caminho isolado por `user_id`, e o seu endereço persistido em uma nova coluna `avatar_url` da tabela `profiles`. Uma área de "Perfil" (`app/profile/page.tsx`) permitirá o upload com preview, e os componentes que hoje mostram apenas a inicial do email (`ChatInterface`, dashboard) passarão a renderizar a foto, com fallback para a inicial quando não houver imagem. O valor entregue é personalização e senso de identidade para o usuário dentro do produto.

## 2. Contexto e Motivação

### 2.1 Problema Atual

Hoje o ScoutDoc.AI não tem nenhum conceito de foto/identidade visual do usuário:

- A tabela `profiles` (em `supabase/schema.sql`) contém apenas `id`, `role` e `created_at`. Não há campo para avatar nem para nome de exibição.
- Em `components/ChatInterface.tsx`, o avatar do usuário é renderizado como a inicial do email em um círculo: `const userInitial = userEmail?.[0]?.toUpperCase() ?? "U";` (linha 137) e exibido em `<div ...>{userInitial}</div>` (linhas 360-367). O componente recebe apenas a prop `userEmail`.
- Em `app/assistants/[agentId]/page.tsx`, apenas `userEmail={user?.email ?? undefined}` é passado ao `ChatInterface` — não há acesso ao profile.
- O dashboard (`app/dashboard/page.tsx` + `components/DashboardClient.tsx` / `components/DashboardLayout.tsx`) não exibe nenhuma representação visual do usuário.
- Não existe bucket de Storage para avatares de usuário; o único bucket conhecido é `agent-documents` (usado em `app/api/admin/agents/[id]/documents/upload-url/route.ts`).
- O `next.config.ts` não declara `images.remotePatterns`, então `next/image` não consegue otimizar imagens vindas do host do Supabase Storage.

### 2.2 Impacto do Problema

- **Quem é afetado:** todos os usuários finais (chefes escoteiros), que hoje são representados apenas por uma letra genérica, sem identidade pessoal.
- **Magnitude:** trata-se de uma melhoria de experiência/personalização, não de uma funcionalidade crítica. A ausência não bloqueia nenhum fluxo existente, mas reduz o senso de pertencimento e de produto "acabado".
- **Se não for resolvido:** o produto continua funcional; permanece apenas a lacuna de personalização. Por isso a prioridade é 🟢 Baixa.

### 2.3 Soluções Consideradas

| Solução | Prós | Contras | Decisão |
|---------|------|---------|---------|
| A — Coluna `avatar_url` em `profiles` + bucket público `user-avatars` (path por `user_id`) + upload via signed URL, reaproveitando o padrão de `documents/upload-url` | Reusa padrão existente; leitura pública simples; URL estável em `next/image`; RLS/políticas de Storage isolam escrita por usuário | Exige migration, novo bucket, políticas e ajuste de `next.config.ts` | ✅ Escolhida |
| B — Bucket privado + signed URL de leitura a cada render | Mais restritivo na leitura | URLs expiram, exigem renovação constante; complica `next/image`; custo desnecessário para avatar (dado não sensível) | ❌ Descartada |
| C — Armazenar a imagem como base64 diretamente em `profiles.avatar_url` | Sem bucket/Storage | Infla a tabela; ruim para cache e CDN; quebra otimização de imagem; antipadrão | ❌ Descartada |
| D — Integrar Gravatar/serviço externo por email | Zero upload | Depende de terceiro; sem controle do usuário; privacidade do email exposta a terceiros | ❌ Descartada |

## 3. Especificação Técnica

### 3.1 Visão Geral da Arquitetura

A solução adiciona uma dimensão de "perfil visual" sobre a infraestrutura existente de auth/profiles:

```
[app/profile/page.tsx]  (server: lê profile)
        │
        ▼
[ProfileClient.tsx] ──(1) POST /api/profile/avatar/upload-url──► [route: gera signed URL no bucket user-avatars/{userId}/...]
        │                                                                │
        │ (2) PUT signedUrl (browser → Storage)                         │
        ▼                                                                ▼
[Supabase Storage: bucket user-avatars]  ◄── políticas: leitura pública, escrita só dono (path = user_id)
        │
        │ (3) POST /api/profile/avatar  { filePath }  → resolve publicUrl, UPDATE profiles.avatar_url (RLS profiles_self_update)
        ▼
[profiles.avatar_url]
        │
        ├──► app/assistants/[agentId]/page.tsx → ChatInterface (prop userAvatarUrl)
        └──► app/dashboard + DashboardLayout/DashboardClient (avatar no cabeçalho/menu)
```

O fluxo de upload reaproveita o padrão de signed URL já validado em `app/api/admin/agents/[id]/documents/upload-url/route.ts` (uso de `createSignedUploadUrl`), adaptado para o contexto do usuário comum (sem `requireAdmin`, escopo no próprio `user.id`).

### 3.2 Componentes Afetados

| Componente | Tipo | Ação | Descrição |
|-----------|------|------|-----------|
| `supabase/schema.sql` | Arquivo SQL | Modificar | Adicionar colunas `avatar_url text` e `display_name text` à tabela `profiles`; criar bucket `user-avatars` e políticas de Storage |
| `supabase/migrations/0007_user_avatar.sql` | Arquivo SQL | Criar | Migration idempotente com `alter table`, criação do bucket e políticas de Storage |
| `next.config.ts` | Arquivo | Modificar | Adicionar `images.remotePatterns` apontando para o host do Supabase Storage |
| `app/api/profile/avatar/upload-url/route.ts` | Rota API | Criar | Gera signed upload URL no bucket `user-avatars` sob `{user.id}/...` |
| `app/api/profile/avatar/route.ts` | Rota API | Criar | `POST` persiste `avatar_url` no profile a partir do `filePath`; `DELETE` remove a foto |
| `app/profile/page.tsx` | Página (server) | Criar | Carrega profile do usuário e renderiza `ProfileClient` |
| `components/ProfileClient.tsx` | Componente client | Criar | UI de perfil: preview, seleção, upload e remoção da foto |
| `components/UserAvatar.tsx` | Componente client | Criar | Avatar reutilizável: renderiza `next/image` se houver `avatarUrl`, senão a inicial (fallback) |
| `components/ChatInterface.tsx` | Componente client | Modificar | Receber prop `userAvatarUrl?` e usar `UserAvatar` no lugar da inicial fixa (linhas 360-367) |
| `app/assistants/[agentId]/page.tsx` | Página (server) | Modificar | Buscar `avatar_url` do profile e passar `userAvatarUrl` ao `ChatInterface` |
| `components/DashboardLayout.tsx` | Componente | Modificar | Exibir `UserAvatar` no cabeçalho/menu do dashboard |
| `components/DashboardClient.tsx` | Componente | Modificar | Repassar `avatarUrl`/`displayName` quando aplicável e link para `/profile` |
| `app/dashboard/page.tsx` | Página (server) | Modificar | Buscar `avatar_url`/`display_name` do profile e repassar ao layout/cliente |

### 3.3 Interfaces e Contratos

#### Entradas

- **Upload (cliente → API `upload-url`):** `POST` com corpo JSON `{ contentType: string, ext: string }` (ex.: `{ "contentType": "image/png", "ext": "png" }`). O usuário é identificado pela sessão (`supabase.auth.getUser()`), não pelo corpo.
- **Upload (cliente → Storage):** `PUT` na `signedUrl` retornada, com o binário da imagem como corpo e o header `Content-Type` correspondente.
- **Persistência (cliente → API `avatar`):** `POST` com corpo JSON `{ filePath: string }` (o caminho retornado pela rota de signed URL).
- **Remoção (cliente → API `avatar`):** `DELETE` sem corpo (identidade pela sessão).
- **Arquivo de imagem:** formatos aceitos `image/png`, `image/jpeg`, `image/webp`; tamanho máximo **2 MB**; recomendado quadrado (será exibido com `object-cover`).

#### Saídas

- **`POST /api/profile/avatar/upload-url`** → `200` `{ signedUrl: string, filePath: string }` ou `4xx/5xx` `{ error: string }`.
- **`POST /api/profile/avatar`** → `200` `{ avatarUrl: string }` (URL pública resolvida) ou erro `{ error }`.
- **`DELETE /api/profile/avatar`** → `200` `{ ok: true }` ou erro `{ error }`.
- **Efeito colateral:** `UPDATE profiles SET avatar_url = ... WHERE id = auth.uid()` (e/ou `display_name`); objeto criado/removido no bucket `user-avatars`.

#### Contratos de API (se aplicável)

```
POST /api/profile/avatar/upload-url
  auth: sessão obrigatória (401 se ausente)
  req:  { contentType: "image/png"|"image/jpeg"|"image/webp", ext: string }
  res:  200 { signedUrl, filePath }   // filePath = `${user.id}/${Date.now()}.${ext}`
        400 { error }                 // contentType não permitido
        401 { error }                 // não autenticado
        500 { error }                 // service key ausente / erro do Storage

POST /api/profile/avatar
  auth: sessão obrigatória
  req:  { filePath: string }          // deve começar com `${user.id}/`
  res:  200 { avatarUrl }
        400 { error }                 // filePath fora do escopo do usuário
        401 { error }

DELETE /api/profile/avatar
  auth: sessão obrigatória
  res:  200 { ok: true }
        401 { error }
```

> Validação de pertencimento: a rota `POST /api/profile/avatar` rejeita qualquer `filePath` que não comece com `${user.id}/`, garantindo que o usuário só registre arquivos do próprio prefixo.

### 3.4 Modelos de Dados (se aplicável)

Alteração na tabela `profiles`:

```sql
alter table profiles add column if not exists avatar_url text;
alter table profiles add column if not exists display_name text;
```

Bucket de Storage `user-avatars` (público para leitura) e políticas (escrita restrita ao próprio prefixo `user_id/`):

```sql
insert into storage.buckets (id, name, public)
values ('user-avatars', 'user-avatars', true)
on conflict (id) do nothing;

-- Leitura pública dos avatares
create policy "user_avatars_public_read" on storage.objects
  for select using (bucket_id = 'user-avatars');

-- Inserção apenas no prefixo do próprio usuário
create policy "user_avatars_self_insert" on storage.objects
  for insert with check (
    bucket_id = 'user-avatars'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

-- Atualização/remoção apenas dos próprios objetos
create policy "user_avatars_self_update" on storage.objects
  for update using (
    bucket_id = 'user-avatars'
    and (storage.foldername(name))[1] = auth.uid()::text
  );
create policy "user_avatars_self_delete" on storage.objects
  for delete using (
    bucket_id = 'user-avatars'
    and (storage.foldername(name))[1] = auth.uid()::text
  );
```

A política `profiles_self_update` já existente (`supabase/schema.sql`, linhas 50-52) cobre o `UPDATE` de `avatar_url`/`display_name` pelo próprio usuário, sem necessidade de nova política na tabela.

Tipo TypeScript de apoio (em `components/UserAvatar.tsx`):

```ts
interface UserAvatarProps {
  avatarUrl?: string | null;
  email?: string | null;
  displayName?: string | null;
  size?: number;           // px (default 32)
  className?: string;
}
```

### 3.5 Fluxo de Execução

1. Usuário acessa `/profile`; a página server carrega `profiles` (`avatar_url`, `display_name`) via `supabase.auth.getUser()` + `select`.
2. `ProfileClient` mostra o avatar atual (ou inicial) e um botão "Alterar foto".
3. Ao selecionar um arquivo, o cliente valida tipo e tamanho (≤ 2 MB) e exibe preview local (`URL.createObjectURL`).
4. Cliente chama `POST /api/profile/avatar/upload-url` → recebe `{ signedUrl, filePath }`.
5. Cliente faz `PUT signedUrl` com o binário (upload direto ao Storage).
6. Cliente chama `POST /api/profile/avatar` com `{ filePath }`; a rota valida o prefixo, resolve a `publicUrl` e faz `UPDATE profiles.avatar_url`.
7. UI atualiza o preview com a URL persistida; mensagem de sucesso.
8. Nos próximos carregamentos, `app/assistants/[agentId]/page.tsx` e `app/dashboard/page.tsx` leem `avatar_url` e passam para `ChatInterface`/`DashboardLayout`, que renderizam via `UserAvatar` (fallback para inicial se `avatar_url` for nulo).
9. Em "Remover foto", `DELETE /api/profile/avatar` apaga o objeto no Storage e zera `avatar_url`.

### 3.6 Tratamento de Erros

- **Tipo de arquivo inválido:** validação no cliente (antes do upload) e na rota `upload-url` (`contentType` fora da allowlist → `400`); mensagem "Formato não suportado. Use PNG, JPEG ou WebP".
- **Arquivo grande (> 2 MB):** bloqueado no cliente com mensagem "A imagem deve ter no máximo 2 MB"; o bucket também recebe `file_size_limit` como defesa em profundidade.
- **`SUPABASE_SERVICE_ROLE_KEY` ausente:** rota `upload-url` retorna `500 { error: "SUPABASE_SERVICE_ROLE_KEY não configurada" }` (mesmo padrão da rota de documentos).
- **`filePath` fora do escopo do usuário:** `POST /api/profile/avatar` retorna `400 { error: "Caminho inválido" }`.
- **Usuário não autenticado:** todas as rotas retornam `401`.
- **Falha no `PUT` ao Storage:** cliente exibe "Não foi possível enviar a imagem. Tente novamente." e mantém o avatar anterior.
- **Falha de render do `next/image` (URL quebrada):** `UserAvatar` usa `onError` para cair no fallback de inicial, evitando ícone de imagem quebrada.

## 4. Requisitos

### 4.1 Requisitos Funcionais

- **RF-001:** O usuário pode enviar uma foto de perfil a partir da página `/profile`.
- **RF-002:** A foto enviada é persistida em `profiles.avatar_url` e sobrevive a recarregamentos/sessões.
- **RF-003:** O avatar do usuário no `ChatInterface` exibe a foto quando existir, e a inicial do email como fallback.
- **RF-004:** O dashboard exibe a foto do usuário (cabeçalho/menu) com o mesmo fallback de inicial.
- **RF-005:** O usuário pode remover a foto, voltando ao fallback de inicial.
- **RF-006:** Opcionalmente, o usuário pode definir um `display_name` exibido junto ao avatar.
- **RF-007:** O upload usa signed URL para o bucket `user-avatars`, com o objeto sob o prefixo `${user.id}/`.

### 4.2 Requisitos Não-Funcionais

- **RNF-001 (Segurança):** As políticas de Storage garantem que um usuário só escreve/remove objetos no próprio prefixo; a leitura é pública (dado não sensível). O `UPDATE` em `profiles` é restrito por `profiles_self_update`.
- **RNF-002 (Acessibilidade):** Toda imagem de avatar tem `alt` descritivo (ex.: "Foto de perfil de {nome ou email}"); o botão de upload é acionável por teclado e tem rótulo claro; contraste do fallback segue a paleta (`scout-*`).
- **RNF-003 (Performance):** Avatares servidos por `next/image` com `remotePatterns` configurado; tamanho máximo 2 MB; dimensões de render pequenas (32–96 px).
- **RNF-004 (Compatibilidade):** Compatível com Next.js 16 (App Router), React 19, Tailwind v4; sem novas dependências além das já presentes (`lucide-react`, `next/image`).

### 4.3 Restrições e Limitações

- Formatos aceitos limitados a PNG, JPEG e WebP; sem GIF animado e sem SVG (risco de XSS).
- Sem recorte/edição de imagem no MVP (o usuário envia a imagem já no enquadramento desejado; render com `object-cover`).
- Sem versionamento/histórico de avatares; cada novo upload substitui o anterior (objeto antigo pode ser removido para evitar lixo no bucket).

## 5. Critérios de Aceitação

- [ ] **CA-001:** A migration adiciona `avatar_url` e `display_name` a `profiles` e é idempotente (`add column if not exists`).
- [ ] **CA-002:** O bucket `user-avatars` existe, é público para leitura e possui políticas que restringem escrita/remoção ao prefixo `${user.id}/`.
- [ ] **CA-003:** Em `/profile`, o usuário envia uma imagem PNG/JPEG/WebP ≤ 2 MB e vê a foto refletida após salvar.
- [ ] **CA-004:** Após o upload, `profiles.avatar_url` está preenchido e a foto aparece no `ChatInterface` (avatar do usuário).
- [ ] **CA-005:** A foto aparece no dashboard (cabeçalho/menu).
- [ ] **CA-006:** Usuário sem foto vê a inicial do email como fallback em todos os pontos (chat, dashboard, perfil).
- [ ] **CA-007:** A remoção da foto zera `avatar_url` e restaura o fallback.
- [ ] **CA-008:** `next/image` carrega o avatar sem erro de host não permitido (`remotePatterns` configurado).
- [ ] **CA-009:** Tentar registrar um `filePath` fora do próprio prefixo retorna `400`.
- [ ] **CA-010:** Toda `<Image>` de avatar tem atributo `alt` descritivo.

## 6. Plano de Testes

### 6.1 Testes Unitários

- Função de validação de imagem (tipo/tamanho) em `ProfileClient`: aceita PNG/JPEG/WebP ≤ 2 MB; rejeita SVG, GIF e arquivos > 2 MB.
- Lógica de fallback do `UserAvatar`: renderiza `<Image>` quando `avatarUrl` presente e válido; renderiza inicial quando nulo ou quando `onError` dispara.
- Validação de prefixo em `POST /api/profile/avatar`: rejeita `filePath` que não começa com `${user.id}/`.

### 6.2 Testes de Integração

- Fluxo completo de upload: `upload-url` → `PUT` no Storage → `POST avatar` → leitura de `profiles.avatar_url`.
- Propagação do `avatar_url` da página `app/assistants/[agentId]/page.tsx` até o render no `ChatInterface`.
- Propagação até o `DashboardLayout`/`DashboardClient`.

### 6.3 Testes de Aceitação

- Execução manual de cada CA-001…CA-010 em ambiente local com Supabase configurado.
- Verificação visual do avatar no chat e no dashboard, com e sem foto.

### 6.4 Casos de Borda (Edge Cases)

- Usuário recém-criado (trigger `handle_new_user`) sem `avatar_url`: deve cair no fallback sem erro.
- URL de avatar válida no banco mas objeto removido do Storage: `onError` cai para a inicial.
- Email indefinido (sessão sem email): fallback usa `display_name` ou a letra "U".
- Upload interrompido (falha no `PUT`): `avatar_url` permanece inalterado; nada parcial é persistido.
- Dois uploads em sequência rápida: prevalece o último `filePath` registrado; objeto anterior é removido.

## 7. Riscos e Mitigações

| Risco | Probabilidade | Impacto | Mitigação |
|-------|--------------|---------|-----------|
| Host do Storage não declarado em `remotePatterns` quebra `next/image` | Média | Médio | Configurar `images.remotePatterns` na T-002 e cobrir em CA-008 |
| Políticas de Storage mal escritas permitem escrita cruzada entre usuários | Baixa | Alto | Usar `(storage.foldername(name))[1] = auth.uid()::text` e testar com dois usuários |
| Upload de imagem muito grande degrada UX/custo | Média | Baixo | Limite de 2 MB no cliente e `file_size_limit` no bucket |
| Acúmulo de objetos órfãos no bucket a cada novo upload | Média | Baixo | Remover o objeto anterior ao trocar/remover a foto |
| Vazamento de XSS via SVG | Baixa | Alto | Bloquear SVG; aceitar apenas PNG/JPEG/WebP |

## 8. Dependências

### 8.1 Dependências Internas

- Tabela `profiles` e política `profiles_self_update` (`supabase/schema.sql`) — base para persistir e autorizar o `UPDATE` do avatar.
- Padrão de signed URL de `app/api/admin/agents/[id]/documents/upload-url/route.ts` — referência de implementação reutilizada.
- Clients `utils/supabase/{server,client}.ts` e `supabase.auth.getUser()` — identidade do usuário.
- `components/ChatInterface.tsx`, `app/assistants/[agentId]/page.tsx`, `app/dashboard/page.tsx`, `components/DashboardLayout.tsx`, `components/DashboardClient.tsx` — pontos de render do avatar.

### 8.2 Dependências Externas

- Supabase Storage (bucket `user-avatars`) e Postgres (Supabase).
- `next/image` (já disponível no Next.js 16) — render otimizado.
- `lucide-react` (já no projeto) — ícones do botão de upload/remoção.
- Variável de ambiente `SUPABASE_SERVICE_ROLE_KEY` (já usada) e `NEXT_PUBLIC_SUPABASE_URL`.

## 9. Observações e Decisões de Design

- **Bucket público vs. privado:** optou-se por público porque um avatar não é dado sensível e a leitura pública simplifica drasticamente o uso com `next/image` (URL estável, sem renovação de signed URL). A escrita permanece restrita por política.
- **`display_name` incluído:** embora o escopo central seja a foto, adicionar `display_name` no mesmo passo de migration/UI é barato e melhora a personalização (exibido junto do avatar). Marcado como RF opcional (RF-006).
- **Sem recorte no MVP:** edição/crop de imagem fica como evolução futura para não inflar o escopo (mantendo ≤ 2 dias). O render com `object-cover` mitiga enquadramentos não quadrados.
- **Reuso de padrão:** a rota de upload espelha conscientemente o padrão de `documents/upload-url`, removendo o `requireAdmin` e trocando o escopo para `user.id`, garantindo consistência arquitetural.
- **Componente `UserAvatar` único:** centralizar o avatar (com fallback e `onError`) num só componente evita divergência de comportamento entre chat, dashboard e perfil.

---

> **⚠️ NOTA:** Este documento é a fonte de verdade para esta implementação.
> Qualquer alteração no escopo deve ser refletida aqui ANTES de ser implementada.
