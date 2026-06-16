# Foto de Avatar do Agente

> **ID:** 005
> **Status:** 🟡 Planejada
> **Prioridade:** 🟡 Média
> **Criada em:** 2026-06-16
> **Última atualização:** 2026-06-16
> **Autor:** Agente AI

---

## 1. Resumo Executivo

Permitir que o administrador faça upload de uma foto real para cada agente do ScoutDoc.AI, exibida no lugar da atual inicial colorida (círculo com a primeira letra do nome sobre `avatar_color`). A foto será armazenada em um bucket público do Supabase Storage, persistida na coluna `avatar_url` da tabela `agents`, e renderizada em toda a interface (lista de assistentes, página do chat e bolhas de mensagem) com fallback automático para a inicial colorida quando não houver imagem. Isso humaniza os agentes e melhora a identidade visual sem quebrar a experiência existente.

## 2. Contexto e Motivação

### 2.1 Problema Atual

Hoje cada agente é representado visualmente apenas pela inicial do seu nome dentro de um círculo com um gradiente escolhido entre 6 opções fixas (`AVATAR_COLORS` em `components/admin/AgentForm.tsx`). Esse padrão se repete em vários pontos da UI: `components/ChatInterface.tsx` (sidebar, topbar, empty state e bolhas do assistant), `app/assistants/page.tsx` (cards) e `app/assistants/[agentId]/page.tsx` (seleção do agente). Não há nenhuma forma de associar uma foto/ilustração real ao agente, o que limita a personalização e a identidade visual.

### 2.2 Impacto do Problema

Afeta diretamente administradores (que não conseguem dar uma identidade visual distinta a cada agente) e usuários finais (chefes escoteiros), que percebem todos os agentes como visualmente genéricos. Sem fotos, agentes ficam menos memoráveis e menos diferenciáveis em listas com muitos itens. O impacto é estético/UX (média gravidade): não bloqueia o uso do produto, mas reduz a qualidade percebida e a personalização.

### 2.3 Soluções Consideradas

| Solução | Prós | Contras | Decisão |
|---------|------|---------|---------|
| Coluna `avatar_url` + bucket público dedicado (`avatars`), upload via signed URL espelhando o padrão de `documents/upload-url` | Reaproveita padrão já validado no projeto; leitura pública simples com `getPublicUrl`; URL estável e cacheável; separa avatares de PDFs | Exige novo bucket e configuração de `remotePatterns` no `next.config.ts` | ✅ Escolhida |
| Reutilizar o bucket privado existente `agent-documents` em subpasta `avatars/` | Não cria bucket novo | Bucket é privado → exigiria signed URL de leitura com expiração para exibir a imagem em toda parte (complexo e com renovação); mistura PDFs e imagens | ❌ Descartada |
| Armazenar a imagem como base64 em coluna `text` na tabela | Sem Storage e sem `remotePatterns` | Infla o banco e os payloads; sem cache de CDN; ruim para performance | ❌ Descartada |
| Upload via multipart direto a uma rota Next.js (sem signed URL) | Um passo a menos no cliente | Sai do padrão do projeto; envia o arquivo pelo servidor Next (mais carga/limite de body); reescreve lógica já existente | ❌ Descartada |

## 3. Especificação Técnica

### 3.1 Visão Geral da Arquitetura

O fluxo espelha o padrão existente de upload de documentos. O cliente (AgentForm) solicita uma signed upload URL a uma nova rota de API, faz `PUT` do arquivo direto ao bucket público `avatars` no Supabase Storage e, em seguida, persiste a URL pública (`avatar_url`) no agente via PUT no CRUD existente. A renderização lê `avatar_url` e exibe `<Image>`/`<img>` quando presente, com fallback para a inicial colorida.

```
AgentForm (cliente)
   │  1. valida tipo/tamanho da imagem localmente
   │  2. POST /api/admin/agents/[id]/avatar/upload-url  → { signedUrl, filePath, publicUrl }
   ├──────────────────────────────────────────────►  Rota API (requireAdmin + serviceClient)
   │                                                     createSignedUploadUrl no bucket "avatars"
   │  3. PUT arquivo → signedUrl (Supabase Storage)
   │  4. PUT /api/admin/agents/[id] { avatar_url: publicUrl }
   ▼
agents.avatar_url (Postgres)  ──►  ChatInterface / assistants/page / assistants/[agentId]
                                    render: avatar_url ? <Image/img> : inicial+cor
```

### 3.2 Componentes Afetados

| Componente | Tipo | Ação | Descrição |
|-----------|------|------|-----------|
| `supabase/schema.sql` | Schema | Modificar | Adicionar coluna `avatar_url text` à tabela `agents` |
| `supabase/migrations/00X_agent_avatar_url.sql` | Migration | Criar | `ALTER TABLE agents ADD COLUMN avatar_url text;` + criação/políticas do bucket `avatars` |
| Bucket Storage `avatars` | Storage | Criar | Bucket público; leitura pública, escrita restrita a admin (via service role) |
| `app/api/admin/agents/[id]/avatar/upload-url/route.ts` | Arquivo | Criar | Gera signed upload URL para o bucket `avatars` e retorna `publicUrl`; valida tipo/tamanho |
| `app/api/admin/agents/[id]/route.ts` | Arquivo | Modificar | Aceitar e persistir `avatar_url` no PUT (incl. limpar p/ `null` ao remover) |
| `app/api/admin/agents/route.ts` | Arquivo | Modificar | Incluir `avatar_url` no select/insert quando aplicável |
| `components/admin/AgentForm.tsx` | Arquivo | Modificar | Componente de upload com preview, remoção e fallback; estado `avatarUrl` |
| `components/ChatInterface.tsx` | Arquivo | Modificar | Renderizar foto quando `avatar_url` existir (sidebar, topbar, empty state, bolhas) |
| `app/assistants/page.tsx` | Arquivo | Modificar | Cards exibem foto; select inclui `avatar_url` |
| `app/assistants/[agentId]/page.tsx` | Arquivo | Modificar | Select inclui `avatar_url` e repassa ao `ChatInterface` |
| `next.config.ts` | Arquivo | Modificar | Adicionar `images.remotePatterns` para o domínio do Supabase Storage |

### 3.3 Interfaces e Contratos

#### Entradas

- **Upload (cliente → AgentForm):** arquivo de imagem selecionado pelo usuário. Validação local: MIME em `image/png`, `image/jpeg`, `image/webp`; tamanho máximo 2 MB.
- **POST upload-url:** corpo `{ name: string, contentType: string }` (nome original do arquivo e MIME para validação no servidor). Path param `id` (agentId).
- **PUT agente:** corpo do CRUD existente acrescido de `avatar_url: string | null`.

#### Saídas

- **POST upload-url → 200:** `{ signedUrl: string, filePath: string, publicUrl: string }`.
- **POST upload-url → 4xx/5xx:** `{ error: string }` (401 sem admin, 400 tipo inválido, 500 sem service key/erro do Storage).
- **PUT agente → 200:** objeto do agente atualizado incluindo `avatar_url`.
- **Efeito colateral:** objeto criado no bucket `avatars` em `${agentId}/${Date.now()}_${safeName}`.

#### Contratos de API

- `POST /api/admin/agents/[id]/avatar/upload-url`
  - Auth: `requireAdmin()` (de `utils/supabase/admin.ts`).
  - Valida `contentType` ∈ {png, jpeg, webp}; caso contrário 400.
  - Usa `createServiceClient(NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)`.
  - `serviceClient.storage.from("avatars").createSignedUploadUrl(filePath)`.
  - `publicUrl` obtido via `serviceClient.storage.from("avatars").getPublicUrl(filePath).data.publicUrl`.
- `PUT /api/admin/agents/[id]` — passa a aceitar `avatar_url` (string ou `null`).

### 3.4 Modelos de Dados

Tabela `agents` (acréscimo):

```sql
ALTER TABLE agents ADD COLUMN avatar_url text;
-- nullable; NULL/'' => usar inicial + avatar_color (fallback)
```

Tipo TypeScript do agente (onde aplicável, ex.: props do `AgentForm`, selects):

```ts
avatar_url?: string | null;
```

Políticas de Storage (bucket `avatars`, público):

- Leitura: pública (objetos acessíveis via `getPublicUrl`).
- Escrita/Update/Delete: somente via service role (backend admin). Sem políticas de INSERT/UPDATE/DELETE para usuários anônimos/autenticados comuns.

### 3.5 Fluxo de Execução

1. Admin abre `AgentForm` (criação ou edição) e seleciona um arquivo no campo de avatar.
2. AgentForm valida MIME e tamanho localmente; gera um preview com `URL.createObjectURL`.
3. AgentForm faz `POST /api/admin/agents/[id]/avatar/upload-url` com `{ name, contentType }`.
4. Rota valida admin + tipo, gera signed URL e calcula `publicUrl`; retorna ao cliente.
5. AgentForm faz `PUT` do arquivo binário para `signedUrl` (upload direto ao Storage).
6. AgentForm guarda `avatar_url = publicUrl` no estado e, ao salvar o form, envia no PUT/POST do agente.
7. Backend persiste `avatar_url` na linha do agente.
8. Nas telas de leitura, cada componente verifica `avatar_url`: se presente, renderiza `<Image>`/`<img>` redondo com `alt`; senão, renderiza a inicial sobre `avatar_color`.
9. Remoção: admin clica "Remover foto" → estado `avatar_url = null` → PUT persiste `null` → UI volta ao fallback.

### 3.6 Tratamento de Erros

- **Tipo/tamanho inválido (cliente):** bloquear antes do upload e exibir mensagem inline ("Use PNG, JPG ou WebP de até 2 MB").
- **Tipo inválido (servidor):** 400 `{ error }`; AgentForm mostra a mensagem.
- **`SUPABASE_SERVICE_ROLE_KEY` ausente:** 500 `{ error: "SUPABASE_SERVICE_ROLE_KEY não configurada" }` (mesmo padrão da rota de documentos).
- **Falha no `PUT` ao Storage:** AgentForm captura, mantém o avatar anterior e exibe erro; não persiste `avatar_url`.
- **Falha ao carregar a imagem na renderização (URL quebrada):** `onError` no `<img>`/`<Image>` aciona fallback para inicial+cor.
- **`avatar_url` nulo/vazio:** comportamento padrão é o fallback (não é erro).

## 4. Requisitos

### 4.1 Requisitos Funcionais

- **RF-001:** O sistema deve permitir ao admin enviar uma foto (PNG/JPG/WebP) para um agente.
- **RF-002:** O sistema deve armazenar a foto no bucket público `avatars` e persistir sua URL em `agents.avatar_url`.
- **RF-003:** O `AgentForm` deve exibir um preview da imagem selecionada/atual antes e depois do upload.
- **RF-004:** O admin deve poder remover a foto, retornando o agente ao avatar de inicial + `avatar_color`.
- **RF-005:** Todas as telas (ChatInterface, lista de assistentes, página do agente) devem exibir a foto quando `avatar_url` existir, com fallback para inicial colorida.
- **RF-006:** Os selects de agente em `app/assistants/page.tsx` e `app/assistants/[agentId]/page.tsx` devem incluir `avatar_url`.

### 4.2 Requisitos Não-Funcionais

- **RNF-001 (Segurança):** Apenas administradores (via `requireAdmin` + service role) podem gerar signed URL e gravar avatares; leitura é pública.
- **RNF-002 (Performance):** Tamanho máximo de 2 MB por imagem; usar `next/image` com `sizes` adequados para servir versões otimizadas onde possível.
- **RNF-003 (Acessibilidade):** Toda imagem de avatar deve ter `alt` descritivo (ex.: `Avatar de {nome do agente}`).
- **RNF-004 (Compatibilidade):** `next.config.ts` deve declarar o domínio do Supabase Storage em `images.remotePatterns` para uso de `next/image`.
- **RNF-005 (Consistência visual):** O avatar (foto ou inicial) deve manter formato circular e dimensões equivalentes às atuais em cada local de uso.

### 4.3 Restrições e Limitações

- Não alterar o esquema de cores existente (`avatar_color` permanece e serve de fallback).
- Não implementar recorte/edição de imagem nesta entrega (apenas upload direto).
- Reutilizar o padrão de signed URL de `documents/upload-url`; não introduzir upload multipart pelo servidor.
- Apenas uma foto por agente (sobrescreve a anterior logicamente via nova `avatar_url`).

## 5. Critérios de Aceitação

- [ ] **CA-001:** A migration adiciona `avatar_url text` a `agents` e o bucket público `avatars` existe com leitura pública e escrita restrita a admin.
- [ ] **CA-002:** Admin consegue selecionar e enviar uma imagem PNG/JPG/WebP ≤ 2 MB pelo `AgentForm`, com preview visível.
- [ ] **CA-003:** Após salvar, `agents.avatar_url` contém a URL pública e a imagem abre diretamente no navegador.
- [ ] **CA-004:** Tipos não suportados ou arquivos > 2 MB são rejeitados com mensagem clara, sem upload.
- [ ] **CA-005:** Admin consegue remover a foto e o agente volta a exibir inicial + `avatar_color` em todas as telas.
- [ ] **CA-006:** ChatInterface (sidebar, topbar, empty state, bolhas do assistant), lista de assistentes e página do agente exibem a foto quando há `avatar_url`, com fallback caso a URL falhe.
- [ ] **CA-007:** `next.config.ts` permite o domínio do Supabase Storage e o `next/image` carrega as fotos sem erro de host não configurado.
- [ ] **CA-008:** Todas as imagens de avatar possuem `alt` descritivo.

## 6. Plano de Testes

### 6.1 Testes Unitários

- Função de validação de tipo/tamanho no cliente: aceita png/jpg/webp ≤ 2 MB; rejeita pdf, gif, svg e arquivos > 2 MB.
- Helper de fallback de avatar: retorna foto quando `avatar_url` presente; inicial+cor quando ausente/nulo.

### 6.2 Testes de Integração

- `POST /api/admin/agents/[id]/avatar/upload-url`: sem admin → 401; contentType inválido → 400; sucesso → `{ signedUrl, filePath, publicUrl }`.
- Fluxo completo: upload-url → PUT no Storage → PUT agente → `avatar_url` persistido e imagem acessível publicamente.
- `PUT /api/admin/agents/[id]` com `avatar_url: null` zera o campo.

### 6.3 Testes de Aceitação

- Percorrer cada CA da seção 5 manualmente no ambiente, criando um agente com foto e outro sem foto, e verificando todas as telas.

### 6.4 Casos de Borda (Edge Cases)

- Agente sem `avatar_url` (legado) continua renderizando inicial+cor.
- `avatar_url` apontando para objeto removido/URL quebrada → `onError` aciona fallback.
- Nome de arquivo com caracteres especiais/acentos → sanitizado (`safeName`).
- Upload bem-sucedido ao Storage mas falha ao salvar o agente → não exibe foto fantasma; estado consistente.
- Troca de foto: nova URL substitui a antiga (objeto antigo pode ficar órfão — ver Riscos).

## 7. Riscos e Mitigações

| Risco | Probabilidade | Impacto | Mitigação |
|-------|--------------|---------|-----------|
| Domínio do Storage não configurado em `remotePatterns` quebra `next/image` | Média | Médio | Configurar `next.config.ts` no início (Fase Banco/Storage) e validar em dev |
| Objetos antigos órfãos no bucket ao trocar/remover foto | Média | Baixo | Aceitar como dívida nesta entrega; opcionalmente deletar o objeto anterior no backend ao atualizar |
| Bucket público expor uploads indevidos | Baixa | Médio | Escrita só via service role + `requireAdmin`; sem políticas de escrita pública |
| Imagens grandes degradarem performance | Média | Médio | Limite de 2 MB + `next/image` com `sizes`; recomendar dimensões na UI |
| Inconsistência de fallback entre os vários pontos de render | Média | Baixo | Centralizar a lógica de avatar em um pequeno componente/helper reutilizável |

## 8. Dependências

### 8.1 Dependências Internas

- `utils/supabase/admin.ts` (`requireAdmin`) e `utils/supabase/server.ts`/`client.ts` para clients.
- Padrão de signed URL em `app/api/admin/agents/[id]/documents/upload-url/route.ts`.
- CRUD de agentes em `app/api/admin/agents/route.ts` e `[id]/route.ts`.
- Tabela `agents` em `supabase/schema.sql`.

### 8.2 Dependências Externas

- Supabase Storage (bucket público `avatars`) e Postgres.
- Variável de ambiente `SUPABASE_SERVICE_ROLE_KEY` e `NEXT_PUBLIC_SUPABASE_URL`.
- `next/image` (Next.js 16) e configuração de `remotePatterns`.
- Bibliotecas já presentes: `lucide-react` (ícones), `@supabase/supabase-js`.

## 9. Observações e Decisões de Design

- Optou-se por **bucket público dedicado** (`avatars`) em vez de reaproveitar o bucket privado `agent-documents` para simplificar a leitura (URL pública estável e cacheável por CDN), evitando a renovação contínua de signed URLs de leitura em toda a UI.
- `avatar_color` é mantido deliberadamente como **fallback** e identidade base — a foto é aditiva, nunca substitui o campo no banco.
- A lógica de "foto ou inicial" aparece em muitos lugares; recomenda-se extrair um pequeno componente/helper de avatar reutilizável para garantir consistência (formato circular, `alt`, `onError`).
- Recorte/edição de imagem e limpeza automática de objetos órfãos ficam **fora do escopo** desta entrega e podem virar implementações futuras.
- Limite de 2 MB e MIME restrito (png/jpg/webp) escolhidos para equilibrar qualidade, performance e segurança.

---

> **⚠️ NOTA:** Este documento é a fonte de verdade para esta implementação.
> Qualquer alteração no escopo deve ser refletida aqui ANTES de ser implementada.
