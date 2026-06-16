# Geração Livre de Documentos pelo System Prompt

> **ID:** 009
> **Status:** 🟢 Concluída
> **Prioridade:** 🟠 Alta
> **Criada em:** 2026-06-16
> **Última atualização:** 2026-06-16
> **Autor:** Agente AI

---

## 1. Resumo Executivo

Tornar a geração de documentos **dirigida pelo system prompt do agente**, em vez de exigir a configuração manual de um template de seções (impl. 004). Ao marcar "Este agente gera documento", o agente passa a produzir, a partir das próprias instruções e da conversa atual, um documento completo em Markdown, que é convertido em PDF/Word reaproveitando o motor de documentos (impl. 003). Isso replica o comportamento dos Custom GPTs do ChatGPT, onde o documento sai naturalmente das instruções do agente.

## 2. Contexto e Motivação

### 2.1 Problema Atual

Na impl. 004, para um agente gerar documentos o admin precisava montar manualmente uma estrutura rígida de seções (chave, rótulo, instrução, tipo texto/lista/tabela). O documento saía desse template configurado no admin, e não do system prompt do agente. Isso não corresponde à expectativa do cliente: os Custom GPTs do chefe já descrevem nas instruções o documento que produzem.

### 2.2 Impacto do Problema

- Configuração trabalhosa e duplicada (o formato já está descrito no system prompt).
- Não replica fielmente os Custom GPTs.
- Barreira para o cliente cadastrar muitos agentes rapidamente.

### 2.3 Soluções Consideradas

| Solução | Prós | Contras | Decisão |
|---------|------|---------|---------|
| Geração livre: agente escreve o documento em Markdown (system prompt + conversa) → converte p/ PDF/DOCX | Replica Custom GPTs; zero configuração de seções; flexível | Estrutura menos previsível que um template fixo | ✅ Escolhida |
| Manter apenas template de seções (004) | Estrutura controlada | Trabalhoso; não segue o system prompt | ❌ Descartada como padrão |
| Baixar a última resposta do chat como PDF | Trivial | Não consolida a conversa num documento final coeso | ❌ Descartada |

## 3. Especificação Técnica

### 3.1 Visão Geral

```
Botão "Gerar documento" (chat)
  → POST /api/chat/[agentId]/document
  → modo: template existe? estruturado (004) : livre (009)
  LIVRE:
    generateFreeformDocument(system_prompt, conversa, docs) → Markdown
    → markdownToSections(md) → DocumentModel → PdfGenerator/DocxGenerator
```

### 3.2 Componentes Afetados

| Componente | Tipo | Ação | Descrição |
|-----------|------|------|-----------|
| `lib/ai.ts` | Arquivo | Modificar | `generateFreeformDocument()` — gera o documento em Markdown |
| `lib/markdown-to-model.ts` | Arquivo | Criar | Converte Markdown → seções do motor (impl. 003) |
| `app/api/chat/[agentId]/document/route.ts` | Arquivo | Modificar | Ramifica entre livre (padrão) e estruturado (se houver template) |
| `app/api/admin/agents/route.ts` | Arquivo | Modificar | Template passa a ser opcional (valida só se enviado) |
| `app/api/admin/agents/[id]/route.ts` | Arquivo | Modificar | Idem |
| `components/admin/AgentForm.tsx` | Arquivo | Modificar | Remove editor de seções; mantém toggle + título + nota explicativa |

### 3.3 Interfaces e Contratos

#### `generateFreeformDocument(agentSystemPrompt, history, docs, title?) → Promise<string>`
Retorna o documento em Markdown. Usa `gpt-4o`, temperatura 0.5, instruções de formatação (título H1, seções, listas, tabelas).

#### `markdownToSections(md: string) → Section[]`
Converte Markdown em seções do `DocumentModel`: `#`→title, `##/###`→heading, parágrafos→paragraph, `-`/`1.`→bullets, tabelas GFM→table. Remove marcação inline; cita fontes como "(Fonte: X)".

#### `POST /api/chat/[agentId]/document`
- `preview: true` (livre) → `{ title, content: <markdown> }`.
- `preview: false` → binário PDF/DOCX.
- Se o agente tiver `document_template` válido com seções → mantém o fluxo estruturado (004).

### 3.4 Modelos de Dados

Sem mudança de schema. `document_template` continua existindo (opcional). Modo livre grava `document_template = null`.

### 3.5 Fluxo de Execução

1. Admin marca "Este agente gera documento" e (opcional) define um título; descreve o formato no System Prompt.
2. No chat, após conversar, o usuário clica "Gerar documento".
3. A rota detecta ausência de template → modo livre.
4. `generateFreeformDocument` produz o Markdown a partir do system prompt + conversa + documentos.
5. `markdownToSections` converte para o modelo; garante um título no topo.
6. PDF/DOCX é gerado e baixado; preview mostra o Markdown.

### 3.6 Tratamento de Erros

- Falha de geração → 500 com mensagem.
- Markdown sem título → injeta título a partir de `document_title`/nome do agente.
- Conversa vazia → 400 (mantido).

## 4. Requisitos

### 4.1 Requisitos Funcionais

- **RF-001:** Marcar o toggle habilita a geração sem configurar seções.
- **RF-002:** O documento é gerado a partir do system prompt + conversa.
- **RF-003:** Saída disponível em PDF e DOCX, com título.
- **RF-004:** Preview exibe o conteúdo antes do download.
- **RF-005:** Agentes com template existente continuam no modo estruturado (retrocompat).

### 4.2 Requisitos Não-Funcionais

- **RNF-001:** Reusar o motor de documentos (impl. 003) — sem novo renderizador.
- **RNF-002:** `gpt-4o` para a geração; documentos de referência truncados a 8000 chars/doc.

### 4.3 Restrições e Limitações

- Estrutura do documento depende da qualidade do system prompt.
- Conversão Markdown cobre títulos, parágrafos, listas e tabelas (não imagens/HTML).

## 5. Critérios de Aceitação

- [x] **CA-001:** Marcar o toggle (sem seções) já habilita o botão "Gerar documento" no chat.
- [x] **CA-002:** O documento gerado segue o formato descrito no system prompt.
- [x] **CA-003:** PDF e DOCX são gerados com título e seções a partir do Markdown.
- [x] **CA-004:** Preview mostra o documento antes de baixar.
- [x] **CA-005:** Admin não precisa mais configurar seções; UI exibe nota explicativa.
- [x] **CA-006:** Agentes legados com template seguem funcionando (modo estruturado).

## 6. Plano de Testes

### 6.1 Unitários
- `markdownToSections`: títulos, headings, parágrafos, listas, tabelas, fontes, vazio.

### 6.2 Integração
- Rota em modo livre retorna preview (markdown) e binários válidos.
- Rota com template segue modo estruturado.

### 6.3 Aceitação
- Recriar um Custom GPT que gera documento, conversar, gerar PDF/DOCX e comparar com o ChatGPT.

### 6.4 Casos de Borda
- Markdown sem título; tabela malformada; documento muito longo; conversa só com imagem.

## 7. Riscos e Mitigações

| Risco | Prob. | Impacto | Mitigação |
|-------|-------|---------|-----------|
| Markdown irregular do modelo | Média | Médio | Parser tolerante; fallback de título; instruções de formatação no prompt |
| Estrutura inconsistente entre gerações | Média | Baixo | Temperatura baixa (0.5); system prompt bem escrito |
| Perda de formatação rica (imagens/HTML) | Baixa | Baixo | Fora do escopo; cobre títulos/listas/tabelas |

## 8. Dependências

### 8.1 Internas
- Motor de documentos (impl. 003): `DocumentModel`, `PdfGenerator`/`DocxGenerator.generateFromModel`.
- Rota de documento e CRUD de agentes (impl. 004).

### 8.2 Externas
- OpenAI `gpt-4o`.

## 9. Observações e Decisões de Design

- O modo estruturado (004) é mantido como caminho alternativo quando o agente tiver `document_template` — garante retrocompatibilidade sem custo.
- A conversão Markdown→modelo isola o motor de documentos de mudanças no formato do modelo.
- A estrutura do documento passa a ser responsabilidade do **system prompt**, alinhado ao modelo mental de Custom GPT.

---

> **⚠️ NOTA:** Fonte de verdade desta implementação.
