# Redesign Dashboard

> **ID:** 014
> **Status:** 🟢 Concluída
> **Prioridade:** 🟠 Alta
> **Criada em:** 2026-06-17
> **Última atualização:** 2026-06-17
> **Autor:** Agente AI

---

## 1. Resumo Executivo
Retematizar o Dashboard para o design ScoutDoc 2026: hero em gradiente com ondas SVG, saudação
"Olá, {nome}!", pills de estatística, CTA "Planejar nova atividade" (card sticker), carrossel de
assistentes (cards sticker) e seção "Meus Documentos". Preserva toda a lógica de dados (server
component que busca documentos/agentes/perfil) e os handlers de busca/exclusão/download.

## 2. Contexto e Motivação
### 2.1 Problema Atual
`DashboardLayout`/`DocumentCard` usam estilos inline `oklch(...)` da paleta antiga (hero escuro,
cards flat) que não acompanham a retematização por token (012). Precisam ser reescritos para o
visual sticker.
### 2.2 Impacto do Problema
É a tela principal pós-login; precisa refletir a identidade aprovada.
### 2.3 Soluções Consideradas
| Solução | Prós | Contras | Decisão |
|---------|------|---------|---------|
| Reescrever o markup com tokens/utilitários da 012 | Fiel ao design | Reescrita ampla | ✅ Escolhida |
| Só trocar cores inline | Menor diff | Não alcança o layout sticker | ❌ Descartada |

## 3. Especificação Técnica
### 3.1 Visão Geral da Arquitetura
`app/dashboard/page.tsx` (server) permanece igual (busca dados, redireciona admin/login).
`DashboardLayout` e `DocumentCard` (client) reescritos visualmente. `DashboardClient` recebe
ajustes leves (empty state sticker). Mantém framer-motion para entrada.
### 3.2 Componentes Afetados
| Componente | Tipo | Ação | Descrição |
|-----------|------|------|-----------|
| `components/DashboardLayout.tsx` | Arquivo | Modificar | Hero+ondas, CTA sticker, carrossel de assistentes, seção docs |
| `components/DashboardClient.tsx` | Arquivo | Modificar | Busca + grid + empty state sticker |
| `components/DocumentCard.tsx` | Arquivo | Modificar | Card sticker (tint, status badge, menu/download) |
### 3.3 Interfaces e Contratos
#### Entradas
Props existentes de `DashboardLayout` (firstName, userEmail, userAvatarUrl, documents, agents) e
`DocumentCard` (doc, onDelete). Inalteradas.
#### Saídas
Navegação para `/pud/new`, `/assistants`, `/assistants/[id]`, `/profile`; signout; download/delete.
#### Contratos de API (se aplicável)
Usa `/api/download/docx` e Supabase client (delete) já existentes.
### 3.4 Modelos de Dados (se aplicável)
N/A.
### 3.5 Fluxo de Execução
1. page.tsx busca dados → DashboardLayout. 2. Carrossel lista agentes. 3. Seção docs usa
DashboardClient (busca/grid/empty). 4. DocumentCard baixa/exclui.
### 3.6 Tratamento de Erros
Mantém `alert()` em falha de download/exclusão e estados de loading existentes.

## 4. Requisitos
### 4.1 Requisitos Funcionais
- **RF-001:** Hero em gradiente com ondas, nav (emblema+ScoutDoc, email+avatar+Sair), saudação e pills de stats.
- **RF-002:** CTA "Planejar nova atividade" como card sticker linkando `/pud/new`.
- **RF-003:** Carrossel horizontal de assistentes (cards sticker) linkando o chat.
- **RF-004:** Seção "Meus Documentos" com busca e grid de `DocumentCard` sticker.
- **RF-005:** `DocumentCard` mantém menu (baixar .docx / excluir) e badge de status.
### 4.2 Requisitos Não-Funcionais
- **RNF-001:** Nenhuma mudança de props/contratos de dados.
- **RNF-002:** `tsc --noEmit` e `next build` passam.
### 4.3 Restrições e Limitações
- Não alterar `app/dashboard/page.tsx` (lógica server).
- Apenas tokens/utilitários da 012.

## 5. Critérios de Aceitação
- [x] **CA-001:** Dashboard exibe hero sticker, CTA, carrossel de assistentes e grid de docs.
- [x] **CA-002:** Busca filtra; empty state e exclusão/download funcionam como antes.
- [x] **CA-003:** `tsc --noEmit` e `next build` passam (lint `any` pré-existente nos contratos de dados).

## 6. Plano de Testes
### 6.1 Testes Unitários
N/A.
### 6.2 Testes de Integração
Build/typecheck.
### 6.3 Testes de Aceitação
Login → dashboard; criar/baixar/excluir doc; abrir assistente.
### 6.4 Casos de Borda
- Sem documentos (empty state). - Sem agentes (estado vazio do carrossel).

## 7. Riscos e Mitigações
| Risco | Probabilidade | Impacto | Mitigação |
|-------|--------------|---------|-----------|
| Quebrar handlers ao reescrever markup | Média | Médio | Preservar funções/efeitos; só trocar estilo/estrutura visual |
| Cores inline antigas remanescentes | Média | Baixo | Substituir `oklch` por paleta/sticker |

## 8. Dependências
### 8.1 Internas
012 (fundação).
### 8.2 Externas
framer-motion, lucide-react, Supabase client, `UserAvatar`.

## 9. Observações e Decisões de Design
- Carrossel usa `.sd-scroll`. - Cores de avatar de agente vindas do banco (`avatar_color`) são respeitadas.

---
> **⚠️ NOTA:** Contrato vivo. Depende de 012.
