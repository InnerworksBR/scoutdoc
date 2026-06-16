# Relevância e Limiar de Similaridade no RAG

> **ID:** 010
> **Status:** 🟢 Concluída
> **Prioridade:** 🟠 Alta
> **Criada em:** 2026-06-16
> **Última atualização:** 2026-06-16
> **Autor:** Agente AI

---

## 1. Resumo Executivo

Tornar a recuperação RAG (impl. 008) mais inteligente: descartar trechos irrelevantes por um **limiar de similaridade**, distinguir "agente sem índice" de "agente indexado sem nada relevante", e endurecer a instrução de citação para o modelo só citar quando o trecho realmente responder à pergunta. Resolve o problema de o agente puxar e citar documentos pouco relacionados ao assunto.

## 2. Contexto e Motivação

### 2.1 Problema Atual

A função `match_agent_chunks` retorna sempre o top-K por proximidade, **sem limiar**. Mesmo quando nenhum trecho é realmente relevante, o melhor "menos distante" é injetado e o agente o cita como fonte. Observado em produção: para uma pergunta sobre construção/pioneiria, o agente citou `Manual_de_orientacao.pdf`, que não tratava do tema.

Além disso, o fallback antigo era acionado sempre que a recuperação voltava vazia — inclusive quando o agente estava indexado mas nada passava no limiar — reintroduzindo o documento inteiro truncado (ruído).

### 2.2 Impacto

- Citações espúrias reduzem a confiança e a fidelidade ao ChatGPT.
- Respostas contaminadas por contexto irrelevante.

### 2.3 Soluções Consideradas

| Solução | Prós | Contras | Decisão |
|---------|------|---------|---------|
| Limiar de similaridade no app + 3 estados (sem índice / relevante / nada relevante) + prompt mais rígido | Sem migração de banco; preciso; ajustável por env | Requer calibrar o limiar | ✅ Escolhida |
| Limiar dentro da função SQL | Centraliza | Migração/overload de função; menos flexível | ❌ Descartada |
| Só ajustar o prompt | Trivial | Não impede injeção de ruído | ❌ Insuficiente |

## 3. Especificação Técnica

### 3.2 Componentes Afetados

| Componente | Tipo | Ação | Descrição |
|-----------|------|------|-----------|
| `app/api/chat/[agentId]/route.ts` | Arquivo | Modificar | Filtro por limiar; 3 estados; prompt de citação mais rígido |

### 3.3 Parâmetros

- `RAG_MIN_SIMILARITY` (env, default 0.3): similaridade de cosseno mínima (0..1).
- `RAG_CANDIDATES` = 12: candidatos buscados antes do filtro.
- `RAG_MAX_USED` = 6: trechos usados após o filtro.

### 3.5 Fluxo

1. Embute a pergunta e busca 12 candidatos via `match_agent_chunks` (já retorna `similarity`).
2. Filtra por `similarity >= RAG_MIN_SIMILARITY`; usa no máximo 6.
3. Estados:
   - **Sem índice** (count 0) → fallback ao texto truncado (legado).
   - **Indexado, há relevantes** → injeta só os relevantes.
   - **Indexado, nada relevante** → não injeta nada; agente responde pelo conhecimento próprio, sem citar.
4. Instrução ao modelo: usar/citar um trecho só se ele realmente contiver a resposta; caso contrário, ignorar e não citar.

### 3.6 Tratamento de Erros

- Erro na RPC/embedding → trata como "sem relevantes" (não força fallback de ruído quando indexado).

## 4. Requisitos

- **RF-001:** Trechos abaixo do limiar não entram no contexto.
- **RF-002:** Agente indexado sem trechos relevantes não cita fontes.
- **RF-003:** Fallback ao texto truncado só para agentes não indexados.
- **RF-004:** Limiar configurável por env sem alterar código.
- **RNF-001:** Sem migração de banco (reaproveita `similarity` da função existente).

## 5. Critérios de Aceitação

- [x] **CA-001:** Pergunta fora do escopo dos documentos não gera citação espúria.
- [x] **CA-002:** Documento irrelevante deixa de ser injetado/citado.
- [x] **CA-003:** Agente sem índice continua respondendo (fallback) normalmente.
- [x] **CA-004:** `RAG_MIN_SIMILARITY` ajusta o rigor sem redeploy de código.

## 6. Plano de Testes

- Pergunta claramente fora do tema dos documentos → sem citação.
- Pergunta coberta pelos documentos → cita a fonte correta.
- Agente não indexado → fallback funciona.
- Ajustar env para 0.45 e 0.2 e observar a mudança de rigor.

## 7. Riscos e Mitigações

| Risco | Prob. | Impacto | Mitigação |
|-------|-------|---------|-----------|
| Limiar alto demais derruba trecho relevante | Média | Médio | Default moderado (0.3); ajustável por env |
| Calibração varia por idioma/conteúdo | Média | Baixo | Env permite ajuste rápido em produção |

## 8. Dependências

- Impl. 008 (RAG, função `match_agent_chunks` que já retorna `similarity`).

## 9. Observações e Decisões de Design

- O filtro fica na aplicação para evitar migração/overload da função SQL e permitir ajuste por env.
- A distinção dos 3 estados é o que evita reintroduzir ruído via fallback quando o agente já está indexado.
- Calibragem inicial do limiar em 0.3; recomenda-se observar em produção e ajustar `RAG_MIN_SIMILARITY`.

---

> **⚠️ NOTA:** Fonte de verdade desta implementação.
