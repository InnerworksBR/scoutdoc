# Redesign Preview de Documento & Apoio

> **ID:** 017
> **Status:** 🟢 Concluída
> **Prioridade:** 🟡 Média
> **Criada em:** 2026-06-17
> **Última atualização:** 2026-06-17
> **Autor:** Agente AI

---

## 1. Resumo Executivo
Retematizar o `PreviewModal` (visualização do PUD gerado) para o design ScoutDoc 2026 — modal
sticker com faixa-gradiente no topo, selo "APROVADO" e botões de exportação — preservando os
handlers de download (.docx/.pdf, com suporte ao `downloadHandler` do chat). Telas de apoio
(perfil/admin) herdam o tema da fundação 012; ajustes pontuais conforme necessário.

## 2. Contexto e Motivação
### 2.1 Problema Atual
`PreviewModal` usa visual flat (header em gradiente simples, `<pre>` cru). O design tem o documento
como peça-chave (selo, faixa, export).
### 2.2 Impacto do Problema
É a entrega final ao usuário (o documento). Precisa transmitir confiança/identidade.
### 2.3 Soluções Consideradas
| Solução | Prós | Contras | Decisão |
|---------|------|---------|---------|
| Re-skin do modal mantendo `<pre>` + handlers | Seguro, mantém conteúdo markdown | Não renderiza markdown rico | ✅ Escolhida |
| Renderizar markdown estruturado | Mais bonito | Risco/escopo maior | ❌ Adiada |

## 3. Especificação Técnica
### 3.1 Visão Geral da Arquitetura
`PreviewModal` (client) reescrito visualmente; mantém props e `handleDownload`. Perfil/admin
inalterados (herdam primitivos/tema da 012).
### 3.2 Componentes Afetados
| Componente | Tipo | Ação | Descrição |
|-----------|------|------|-----------|
| `components/PreviewModal.tsx` | Arquivo | Modificar | Modal sticker, faixa-gradiente, selo "APROVADO", export |
### 3.3 Interfaces e Contratos
#### Entradas: props `isOpen/onClose/title/content/data/downloadHandler` inalteradas.
#### Saídas: download via `downloadHandler` ou `/api/download/{format}`. Inalterado.
#### Contratos de API: nenhum endpoint alterado.
### 3.4 Modelos de Dados: N/A.
### 3.5 Fluxo de Execução: abrir → ler conteúdo → baixar .docx/.pdf. Inalterado.
### 3.6 Tratamento de Erros: mantém `alert()` em falha e estados de loading dos botões.

## 4. Requisitos
### 4.1 Requisitos Funcionais
- **RF-001:** Modal sticker com faixa-gradiente no topo e selo "APROVADO".
- **RF-002:** Conteúdo do PUD legível (área rolável) e botões de exportar .docx/.pdf preservados.
- **RF-003:** Telas de perfil/admin permanecem funcionais com o tema herdado.
### 4.2 Requisitos Não-Funcionais
- **RNF-001:** Nenhuma mudança de props/handlers. - **RNF-002:** `tsc`/`build` passam.
### 4.3 Restrições e Limitações
- Não alterar endpoints de download. - Apenas tokens/utilitários da 012.

## 5. Critérios de Aceitação
- [x] **CA-001:** Preview exibe modal sticker com faixa/selo e conteúdo rolável.
- [x] **CA-002:** Download .docx/.pdf preservado (handlers do chat e do gerador de PUD).
- [x] **CA-003:** `tsc --noEmit` e `next build` passam.

## 6. Plano de Testes
### 6.1 Unitários: N/A. ### 6.2 Integração: build/typecheck.
### 6.3 Aceitação: gerar PUD → preview → baixar; no chat, gerar documento → preview → baixar.
### 6.4 Borda: `content` nulo (placeholder); `data` ausente (botões desabilitados via `downloadHandler`).

## 7. Riscos e Mitigações
| Risco | Prob. | Impacto | Mitigação |
|-------|-------|---------|-----------|
| Quebrar download ao reescrever | Baixa | Médio | Preservar `handleDownload`/props |

## 8. Dependências
### 8.1 Internas: 012; consumido por 015 (chat) e 016 (PUD). ### 8.2 Externas: framer-motion, lucide-react.

## 9. Observações e Decisões de Design
- Mantido `<pre>` para o conteúdo (markdown/seções) por segurança; renderização rica fica como melhoria futura.
- Selo "APROVADO" decorativo (não implica validação real de POR).

---
> **⚠️ NOTA:** Contrato vivo. Depende de 012.
