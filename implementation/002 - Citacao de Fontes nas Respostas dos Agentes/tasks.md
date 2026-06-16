# Tarefas: Citação de Fontes nas Respostas dos Agentes

> **Implementação:** 002 - Citação de Fontes nas Respostas dos Agentes
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

### Fase 1: Backend / Prompt

- [ ] **T-001:** Adicionar rótulos de fonte por documento no `docsContext`
  - **Descrição:** No `route.ts` do chat, ao montar o `docsContext`, incluir para cada documento com `content_text` um rótulo explícito de citação, ex.: `\n\n=== DOCUMENTO: {name} ===\n[Citar como: [Fonte: {name}]]\n{content_text}`. Aplicar limite/chunking de caracteres por documento para respeitar o orçamento de contexto.
  - **Arquivos envolvidos:** `app/api/chat/[agentId]/route.ts`
  - **Critério de conclusão:** Cada documento gera um rótulo `[Fonte: {name}]` no contexto; documentos com `content_text` nulo são ignorados; com 0 documentos o `docsContext` fica vazio.
  - **Dependências:** Nenhuma
  - **Estimativa:** Média
  - **Observações:** Usa `agent_documents.name` real como rótulo. Atende RF-002, RF-005, RNF-003.

- [ ] **T-002:** Injetar instrução de citação no `systemPrompt` (e o caso sem documentos)
  - **Descrição:** Acrescentar ao `systemPrompt` (`agent.system_prompt` + `## DOCUMENTOS DE REFERÊNCIA` + `docsContext`) uma instrução clara para citar a fonte no formato `[Fonte: {name}]` (ou numerada `[1]`/`[2]` com legenda final) sempre que usar informação dos documentos, com exemplo few-shot. Quando `docsContext` estiver vazio, omitir a seção de documentos e instruir o modelo a NÃO citar fontes.
  - **Arquivos envolvidos:** `app/api/chat/[agentId]/route.ts`
  - **Critério de conclusão:** `systemPrompt` contém a instrução de citação quando há documentos e a instrução de não citar quando não há.
  - **Dependências:** T-001
  - **Estimativa:** Pequena
  - **Observações:** Atende RF-001, RF-005, RF-008 (preservar marcadores ao salvar em `messages`).

### Fase 2: Frontend / Render

- [ ] **T-003:** Criar parser de citações `lib/citations.ts`
  - **Descrição:** Implementar `parseCitations(content)` que retorna `{ segments, references }`, extraindo marcadores `[Fonte: ...]`, deduplicando por nome normalizado (trim + lowercase para comparar, exibição preserva original) e ordenando por primeira ocorrência. Tolerar marcadores malformados/truncados (tratar como texto).
  - **Arquivos envolvidos:** `lib/citations.ts`
  - **Critério de conclusão:** Função pura exportada com os tipos `CitationSegment`/`ParsedCitations` da spec; cobre 0, 1 e múltiplas citações e casos malformados.
  - **Dependências:** Nenhuma
  - **Estimativa:** Média
  - **Observações:** Atende RF-003, RF-006, RNF-001. Sem regex catastrófica.

- [ ] **T-004:** Criar componente `CitationBadge`
  - **Descrição:** Componente de chip/badge para exibir a fonte, usando a paleta `scout-*`/`azure-*`/`gold-*`/`cream-*`, ícone `lucide-react` e `aria-label`. Opcionalmente animado com `framer-motion`.
  - **Arquivos envolvidos:** `components/CitationBadge.tsx`
  - **Critério de conclusão:** Componente renderiza um chip acessível e estilizado com a paleta do projeto.
  - **Dependências:** Nenhuma
  - **Estimativa:** Pequena
  - **Observações:** Atende RNF-002.

- [ ] **T-005:** Integrar parser e badges no `ChatInterface`
  - **Descrição:** Substituir a renderização crua `<p className="whitespace-pre-wrap">{msg.content}</p>` por uma que aplique `parseCitations` ao `content` (e ao `accumulated` durante streaming), renderizando chips inline e/ou rodapé de referências deduplicadas via `CitationBadge`. Garantir tolerância a marcador truncado durante o stream.
  - **Arquivos envolvidos:** `components/ChatInterface.tsx`
  - **Critério de conclusão:** Mensagens do assistant exibem chips/rodapé; sem citações, nada extra é renderizado; histórico recarregado também renderiza.
  - **Dependências:** T-003, T-004
  - **Estimativa:** Média
  - **Observações:** Atende RF-004, RF-005, RF-007 (frontend), CA-002, CA-007.

### Fase 3: PUD

- [ ] **T-006:** Reforçar `SYSTEM_PROMPT` do `generatePUD()` para `source` verificável
  - **Descrição:** Em `lib/ai.ts`, ajustar o `SYSTEM_PROMPT` para instruir o modelo a preencher `source` apenas com referências verificáveis (documentos oficiais conhecidos da UEB), proibir invenção de títulos/códigos e permitir `"N/A"`/vazio quando não houver fonte segura. Documentar no código a limitação de ausência de RAG.
  - **Arquivos envolvidos:** `lib/ai.ts`
  - **Critério de conclusão:** `source` gerado não contém referências claramente inventadas; retorna `"N/A"`/vazio quando aplicável; seção FONTES do docx exibe corretamente.
  - **Dependências:** Nenhuma
  - **Estimativa:** Pequena
  - **Observações:** Atende RF-007, CA-006. Interface `GeneratedContent.source` permanece `string`.

- [ ] **T-007:** (Opcional) Avaliar extração por página no upload de documentos
  - **Descrição:** Investigar substituir `unpdf` `extractText` com `mergePages: true` por extração por página para anexar nº de página aproximado ao `content_text` (ex.: marcadores `[p. N]`). Se inviável no orçamento, registrar a decisão e manter como está.
  - **Arquivos envolvidos:** `app/api/admin/agents/[id]/documents/route.ts`
  - **Critério de conclusão:** Decisão documentada (adotado com formato versionado OU mantido sem páginas com justificativa).
  - **Dependências:** Nenhuma
  - **Estimativa:** Média
  - **Observações:** Opcional conforme spec 4.3; não bloqueia a entrega principal.

### Fase 4: Testes

- [ ] **T-008:** Testes unitários do parser e da montagem do `docsContext`
  - **Descrição:** Cobrir `parseCitations` (0/1/múltiplas/duplicadas/malformado/truncado) e a montagem do `docsContext` (N documentos geram N rótulos; 0 documentos gera seção vazia). Incluir nomes com `]`/`:`.
  - **Arquivos envolvidos:** `lib/citations.ts`, `app/api/chat/[agentId]/route.ts` (helper de montagem, se extraído)
  - **Critério de conclusão:** Todos os cenários da spec 6.1 e edge cases 6.4 passam.
  - **Dependências:** T-001, T-003
  - **Estimativa:** Média
  - **Observações:** Atende CA-003, CA-005.

- [ ] **T-009:** Testes de integração e roteiro de aceitação (CA-001..CA-008)
  - **Descrição:** Validar fluxo de chat com 1 e 2 documentos e agente sem documentos; validar geração de PUD e exibição da seção FONTES. Executar roteiro manual cobrindo todos os critérios de aceitação.
  - **Arquivos envolvidos:** `app/api/chat/[agentId]/route.ts`, `components/ChatInterface.tsx`, `lib/ai.ts`
  - **Critério de conclusão:** CA-001 a CA-008 verificados e registrados.
  - **Dependências:** T-002, T-005, T-006
  - **Estimativa:** Média
  - **Observações:** Confirma ausência de migração/nova dependência (CA-008).

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
