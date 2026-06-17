# Redesign Assistentes & Chat

> **ID:** 015
> **Status:** 🟢 Concluída
> **Prioridade:** 🟠 Alta
> **Criada em:** 2026-06-17
> **Última atualização:** 2026-06-17
> **Autor:** Agente AI

---

## 1. Resumo Executivo
Retematizar a lista de Assistentes e a tela de Chat para o design ScoutDoc 2026 (header sticker
com avatar + status "Online", bolhas sticker — usuário verde / assistente branco com borda tinta,
sugestões em pílulas, input sticker, scrollbar lime). **Toda a funcionalidade é preservada**:
sidebar de conversas, histórico, streaming SSE, anexo de imagem (GPT-4o), geração de documento e
citações de fonte.

## 2. Contexto e Motivação
### 2.1 Problema Atual
`assistants/page.tsx` e `ChatInterface` usam estilos inline `oklch(...)` da paleta antiga (sidebar
verde-escuro, bolhas flat). Não acompanham a retematização por token.
### 2.2 Impacto do Problema
Chat é o coração dos assistentes; precisa do visual aprovado sem perder recursos.
### 2.3 Soluções Consideradas
| Solução | Prós | Contras | Decisão |
|---------|------|---------|---------|
| Re-skin preservando sidebar/recursos | Mantém features + visual novo | Markup grande | ✅ Escolhida |
| Adotar layout single-column do mock (sem sidebar) | Mais próximo do mock | Perderia histórico/recursos | ❌ Descartada |

## 3. Especificação Técnica
### 3.1 Visão Geral da Arquitetura
`assistants/page.tsx` (server) e `assistants/[agentId]/page.tsx` (server) mantêm a busca de dados.
`ChatInterface` (client) reescrito visualmente, mantendo todos os estados/handlers (sendMessage,
streaming, loadConversation, image upload, handleGenerateDocument, PreviewModal).
### 3.2 Componentes Afetados
| Componente | Tipo | Ação | Descrição |
|-----------|------|------|-----------|
| `app/assistants/page.tsx` | Arquivo | Modificar | Header com emblema, grid de cards sticker |
| `components/ChatInterface.tsx` | Arquivo | Modificar | Sidebar ink, header sticker, bolhas, sugestões, input sticker |
| `components/UserAvatar.tsx` | Arquivo | Modificar | Fallback bg para a paleta nova (`ink`) |
### 3.3 Interfaces e Contratos
#### Entradas
Props de `ChatInterface` inalteradas. Lista de agentes do Supabase.
#### Saídas
SSE de `/api/chat/[agentId]`, upload em `/api/chat/[agentId]/upload-url`, doc em
`/api/chat/[agentId]/document`. Inalterados.
#### Contratos de API (se aplicável)
Nenhum endpoint alterado.
### 3.4 Modelos de Dados (se aplicável)
N/A.
### 3.5 Fluxo de Execução
Inalterado — apenas estilos/estrutura visual mudam.
### 3.6 Tratamento de Erros
Mantém banners de erro (doc/imagem) e fallback de mensagem em falha de stream.

## 4. Requisitos
### 4.1 Requisitos Funcionais
- **RF-001:** Lista de assistentes em cards sticker (avatar, nome, descrição, "Conversar →").
- **RF-002:** Chat com header sticker (avatar + nome + "Online"), botão "Gerar documento" quando aplicável.
- **RF-003:** Bolhas: usuário verde (`scout-600`), assistente branco com borda tinta; sugestões em pílulas.
- **RF-004:** Input sticker com anexo de imagem e envio; scrollbar lime.
- **RF-005:** Sidebar de conversas (histórico, nova conversa) preservada com visual ink.
### 4.2 Requisitos Não-Funcionais
- **RNF-001:** Nenhuma perda de funcionalidade (streaming, imagem, doc, citações).
- **RNF-002:** `tsc --noEmit` e `next build` passam.
### 4.3 Restrições e Limitações
- Não alterar páginas server nem endpoints. - Apenas tokens/utilitários da 012.

## 5. Critérios de Aceitação
- [x] **CA-001:** Lista e chat exibem o visual sticker do design.
- [x] **CA-002:** Streaming, anexo de imagem, geração de documento e histórico preservados (handlers intocados).
- [x] **CA-003:** `tsc --noEmit` e `next build` passam (lint `any` pré-existente).

## 6. Plano de Testes
### 6.1 Unitários: N/A. ### 6.2 Integração: build/typecheck.
### 6.3 Aceitação: abrir assistente, enviar mensagem (stream), anexar imagem, gerar documento.
### 6.4 Borda: agente sem sugestões (usa fallback `SUGGESTED`); sem conversas (estado vazio).

## 7. Riscos e Mitigações
| Risco | Prob. | Impacto | Mitigação |
|-------|-------|---------|-----------|
| Quebrar o pipeline de streaming ao reescrever | Média | Alto | Não tocar nas funções; só JSX/classes |
| Contraste de bolha do assistente | Baixa | Baixo | Texto `scout-800` em fundo branco |

## 8. Dependências
### 8.1 Internas: 012; usa `MarkdownMessage`, `PreviewModal` (017), `AgentAvatar`, `UserAvatar`.
### 8.2 Externas: lucide-react, Supabase client, react-markdown.

## 9. Observações e Decisões de Design
- Mantida a sidebar (recurso de histórico) com fundo `ink` em vez do single-column do mock.
- Bolha do assistente mantém barra lateral colorida com a cor do agente.

---
> **⚠️ NOTA:** Contrato vivo. Depende de 012.
