# 003 — Motor de Documentos e Exportação PDF

> **ID:** 003
> **Status:** 🟡 Planejada
> **Prioridade:** 🟠 Alta
> **Criada em:** 2026-06-16
> **Última atualização:** 2026-06-16
> **Autor:** Agente AI

---

## 1. Resumo Executivo

O ScoutDoc.AI já gera Planos de Unidade Didática (PUD) e os exporta em formato **Word (.docx)** através da classe `DocxGenerator` e da rota `app/api/download/docx/route.ts`. No entanto, o PRD promete múltiplos formatos de saída e o usuário solicitou explicitamente exportação em **PDF**, que ainda não existe no projeto.

Esta implementação entrega:

1. A escolha e instalação de uma biblioteca de geração de PDF compatível com o runtime **Node** de route handlers do Next.js 16.
2. Um novo módulo `lib/pdf-generator.ts` (`PdfGenerator.generate(content: GeneratedContent): Promise<Buffer>`) que espelha as seções do `DocxGenerator` aplicando a identidade visual escoteira (paleta `scout-*`, `azure-*`, `gold-*`, `cream-*`).
3. Uma nova rota `app/api/download/pdf/route.ts`, análoga à de DOCX, retornando `application/pdf`.
4. A atualização do `PreviewModal.tsx` para oferecer **dois botões**: "Baixar .DOCX" e "Baixar .PDF".
5. Como melhoria opcional, o desenho de um **DocumentEngine** comum (modelo de seções compartilhado) preparando o terreno para a implementação 004 (documentos estruturados a partir de schemas variáveis nos agentes).

O resultado é uma base de geração de documentos reutilizável e a paridade de formatos entre Word e PDF para o fluxo PUD.

---

## 2. Contexto e Motivação

### 2.1 Problema Atual

- O projeto exporta **apenas .docx**. Não há nenhuma biblioteca de PDF instalada (verificado: `docx@9.5.1`, `unpdf`, `zod`, `framer-motion` presentes; nenhuma lib de geração de PDF).
- O `PRD.md` promete `.docx` **e** `.pptx`, mas o usuário pediu **PDF e Word**. Hoje **PPTX e PDF não existem**, gerando um gap entre o prometido/solicitado e o entregue.
- A lógica de montagem das seções do documento está **acoplada** ao `DocxGenerator` (lib `docx`). Não há um modelo intermediário de seções reutilizável, o que forçaria reescrever toda a estrutura ao adicionar um novo formato.
- O `PreviewModal.tsx` possui um único botão "Baixar .DOCX", sem opção de PDF.

### 2.2 Impacto

- **Usuário (chefe escoteiro):** PDF é o formato preferencial para distribuição/impressão e arquivamento, pois preserva a formatação de forma universal (não depende de Word instalado). A ausência reduz a utilidade prática do PUD gerado.
- **Produto:** entrega parcial frente ao PRD e ao pedido do usuário; percepção de funcionalidade incompleta.
- **Engenharia:** sem uma base reutilizável, a implementação 004 (documentos estruturados a partir de schemas variáveis) terá de duplicar lógica de layout, aumentando custo de manutenção e divergência visual entre formatos.

### 2.3 Soluções Consideradas

Comparação das bibliotecas de geração de PDF avaliadas para rodar em route handler **Node** do Next.js 16:

| Solução | Prós | Contras | Decisão |
|---|---|---|---|
| **`pdfkit`** | API imperativa madura e estável; roda nativamente em Node; controle fino de posição/cores/tabelas; fontes padrão (Helvetica/Times) embutidas sem precisar embarcar arquivos; buffer via stream sem headless browser. | API de baixo nível (precisa calcular layout/quebras manualmente); tabelas exigem desenho manual; bundling de assets de fonte no Next pode exigir cuidado se forem usadas fontes customizadas. | ✅ **Escolhida** |
| **`@react-pdf/renderer`** | Estilização declarativa via componentes React e flexbox; combina com a stack React 19; fácil de manter visualmente; suporta tabelas via layout flex. | Mais pesado; já houve atritos conhecidos com versões/ESM e bundling em ambientes server do Next; pode exigir registro de fontes customizadas para acentuação completa; superfície de incompatibilidade maior com Next 16. | ⬜ Alternativa |
| **`pdf-lib`** | Leve; excelente para **manipular/preencher** PDFs existentes; puro JS, sem dependências nativas. | Não foi desenhado para **compor** documentos longos a partir do zero (sem motor de layout/fluxo de texto/tabelas); exigiria construir todo o sistema de layout manualmente. | ❌ Descartada |
| **HTML→PDF (`puppeteer`)** | Fidelidade total ao HTML/CSS; poderia reutilizar Tailwind. | **Muito pesado** (baixa um Chromium headless); inadequado para serverless/route handler; tempo de cold start e consumo de memória altos; complexidade operacional. | ❌ Descartada |

**Decisão e justificativa:** adotar **`pdfkit`**. É a opção mais estável e previsível em runtime Node do Next 16, não depende de browser headless e usa fontes padrão embutidas (evitando a restrição de "libs que exigem fontes embarcadas"). A estilização escoteira (cores da paleta) é totalmente viável via API de cores/retângulos do pdfkit. O `@react-pdf/renderer` fica registrado como alternativa caso, na 004, a estilização declarativa traga ganho de produtividade significativo.

> **Nota sobre acentuação:** as fontes padrão do pdfkit (Helvetica/Times/Courier — WinAnsi) cobrem os caracteres acentuados do português. Caso se deseje uma fonte de marca, será necessário embarcar um `.ttf` (ver Riscos R-03).

---

## 3. Especificação Técnica

### 3.1 Arquitetura

```
                 GeneratedContent (lib/ai.ts)
                          │
          ┌───────────────┴───────────────┐
          │                               │
   POST /api/download/docx        POST /api/download/pdf   (route handlers Node)
          │                               │
   DocxGenerator.generate()       PdfGenerator.generate()
   (lib/docx-generator.ts)        (lib/pdf-generator.ts)   ◄── NOVO
          │                               │
       lib `docx`                     lib `pdfkit`
          │                               │
       Buffer (.docx)                 Buffer (.pdf)
          │                               │
          └───────────────┬───────────────┘
                          │
                 PreviewModal.tsx
            [Baixar .DOCX] [Baixar .PDF]  ◄── NOVO botão
```

- Ambos os geradores consomem o **mesmo contrato** `GeneratedContent` (definido em `lib/ai.ts`), garantindo paridade de conteúdo.
- O `PdfGenerator` segue o mesmo padrão estático do `DocxGenerator` (`public static async generate(content): Promise<Buffer>`).
- **Runtime:** as rotas declaram `export const runtime = "nodejs"` para garantir execução fora do Edge (pdfkit depende de APIs Node).
- **DocumentEngine (opcional / preparação 004):** introduzir um modelo intermediário `DocumentModel` — uma lista de seções genéricas (título, tabela chave-valor, lista de passos, bullets, parágrafo, tabela, quebra de página) que cada renderer (DOCX/PDF) consome. Os geradores atuais passam a renderizar a partir desse modelo em vez de conhecer o shape específico do PUD, permitindo que a 004 alimente o mesmo motor com conteúdo derivado de schemas variáveis.

### 3.2 Componentes Afetados

| Componente | Tipo | Ação | Descrição |
|---|---|---|---|
| `lib/pdf-generator.ts` | Módulo / classe | **Criar** | `PdfGenerator.generate(content: GeneratedContent): Promise<Buffer>` usando `pdfkit`, espelhando todas as seções do DocxGenerator com identidade visual escoteira. |
| `app/api/download/pdf/route.ts` | Route handler (POST, Node) | **Criar** | Recebe `GeneratedContent`, chama `PdfGenerator.generate`, retorna `application/pdf` com `Content-Disposition: attachment`. |
| `components/PreviewModal.tsx` | Componente React | **Modificar** | Adicionar botão "Baixar .PDF" ao lado de "Baixar .DOCX"; generalizar `handleDownload(format)` para suportar `docx` e `pdf`. |
| `package.json` | Configuração | **Modificar** | Adicionar dependência `pdfkit` (e `@types/pdfkit` em devDependencies). |
| `lib/document-model.ts` | Módulo (tipos/builders) | **Criar (opcional)** | Modelo `DocumentModel` de seções genéricas + builder `buildPudModel(content)`; base do DocumentEngine para reuso na 004. |
| `lib/docx-generator.ts` | Módulo / classe | **Modificar (opcional)** | Refatorar para renderizar a partir do `DocumentModel` (se o DocumentEngine for adotado nesta entrega). |
| `app/api/download/docx/route.ts` | Route handler | **Modificar (opcional)** | Adicionar `export const runtime = "nodejs"` por consistência/segurança. |

### 3.3 Interfaces e Contratos

**Entrada (ambas as rotas):** corpo JSON `POST` contendo um objeto `GeneratedContent`.

**Contrato da classe (novo):**

```ts
// lib/pdf-generator.ts
export class PdfGenerator {
  public static async generate(content: GeneratedContent): Promise<Buffer>;
}
```

**Contrato de API — `POST /api/download/pdf`:**

- **Request:** `Content-Type: application/json`, body = `GeneratedContent`.
- **Response 200:**
  - `Content-Type: application/pdf`
  - `Content-Disposition: attachment; filename="<titulo_sanitizado>.pdf"`
  - Corpo: bytes do PDF.
- **Response 400:** body inválido (falha na validação Zod) → `{ "error": "..." }`.
- **Response 500:** falha na geração → `{ "error": "Failed to generate document" }`.

**Saídas:**
- `PdfGenerator.generate` → `Promise<Buffer>` (PDF binário).
- Rota → `NextResponse` com Blob do buffer e headers de download (mesmo padrão da rota DOCX existente).

**Sanitização do filename:** reutilizar a regra atual `content.title.replace(/[^a-z0-9]/gi, "_").toLowerCase()`.

### 3.4 Modelos de Dados

Reutiliza o contrato existente, **sem alteração de schema**:

```ts
// lib/ai.ts (existente)
interface GeneratedContent {
  title: string;
  objective: string;
  duration: string;
  participants: string;
  place: string;
  materials: string[];
  steps: { title: string; description: string; time: string }[];
  evaluation: string;
  safety: string;
  source: string;
  comments: string[];
  rubric: { criteria: string; evidence: string; bloom: string }[];
  daily_checklist: { item: string; checked: boolean }[];
}
```

**Modelo intermediário (opcional, DocumentEngine):**

```ts
// lib/document-model.ts (novo, opcional)
type Section =
  | { kind: "title"; text: string }
  | { kind: "metaTable"; rows: { label: string; value: string }[] }
  | { kind: "heading"; text: string }
  | { kind: "steps"; items: { title: string; time: string; description: string }[] }
  | { kind: "bullets"; items: string[] }
  | { kind: "paragraph"; text: string }
  | { kind: "table"; headers: string[]; rows: string[][] }
  | { kind: "pageBreak" };

interface DocumentModel { sections: Section[]; }
function buildPudModel(content: GeneratedContent): DocumentModel;
```

Validação de entrada via **Zod** (schema `generatedContentSchema`) nas rotas — fechando a TODO já anotada na rota DOCX ("In a real app, validate body with Zod schema").

### 3.5 Fluxo de Execução

1. Usuário gera o PUD; o `PreviewModal` recebe `data: GeneratedContent` e renderiza o preview.
2. Usuário clica em **"Baixar .PDF"**.
3. `handleDownload("pdf")` faz `POST /api/download/pdf` com `JSON.stringify(data)`.
4. A rota valida o body (Zod). Se inválido → 400.
5. A rota chama `PdfGenerator.generate(content)`.
6. `PdfGenerator` instancia um `PDFDocument` (pdfkit), aplica cores da paleta escoteira e escreve, na ordem: **título**, **tabela de metadados** (duração, objetivos, participantes, local), **DESENVOLVIMENTO** (steps com título/tempo/descrição), **MATERIAIS** (bullets), **AVALIAÇÃO**, **SEGURANÇA**, **FONTES/REFERÊNCIAS**, **quebra de página**, **RUBRICA DE AVALIAÇÃO** (tabela), **CHECKLIST DE CONFORMIDADE** (tabela), **COMENTÁRIOS** (bullets).
7. O documento é coletado em um `Buffer` (acumulando os chunks do stream do pdfkit até o evento `end`).
8. A rota responde com `application/pdf` + `Content-Disposition: attachment`.
9. O front recebe o blob, cria uma URL temporária e dispara o download `<a download>` (mesmo mecanismo já usado para DOCX).

### 3.6 Tratamento de Erros

- **Body ausente/malformado ou JSON inválido:** capturar no `try/catch` da rota → `400` com `{ error }`.
- **Validação Zod falha (campos faltando/tipos errados):** retornar `400` com mensagem do issue do Zod (evita crash do gerador ao acessar campos `undefined`).
- **Campos de array vazios (`steps`, `materials`, `rubric`, `daily_checklist`, `comments`):** o gerador deve tolerar arrays vazios renderizando a seção vazia (ou omitindo o corpo), sem lançar exceção.
- **Falha interna do pdfkit / stream:** capturar no `catch` da rota → `500` com `{ error: "Failed to generate document" }` e `console.error` (paridade com a rota DOCX).
- **Front-end:** em resposta não-`ok`, manter o `alert("Erro ao baixar arquivo.")` e `console.error`, resetando o estado de loading no `finally`.
- **Acentuação/encoding:** garantir fonte WinAnsi-compatível; se um caractere fora do range aparecer, fazer fallback sem quebrar a geração (ver R-03).

---

## 4. Requisitos

### 4.1 Requisitos Funcionais (RF)

- **RF-01:** O sistema deve gerar um arquivo PDF a partir de um `GeneratedContent` válido.
- **RF-02:** O PDF deve conter, na mesma ordem do DOCX: título, tabela de metadados, DESENVOLVIMENTO (steps), MATERIAIS, AVALIAÇÃO, SEGURANÇA, FONTES/REFERÊNCIAS, quebra de página, RUBRICA (tabela), CHECKLIST (tabela), COMENTÁRIOS.
- **RF-03:** A rota `POST /api/download/pdf` deve retornar `application/pdf` com `Content-Disposition: attachment` e filename derivado do título.
- **RF-04:** O `PreviewModal` deve exibir dois botões de download ("Baixar .DOCX" e "Baixar .PDF"), cada um disparando o download correto.
- **RF-05:** O PDF deve aplicar a identidade visual escoteira usando cores da paleta (`scout-*`, `azure-*`, `gold-*`, `cream-*`) em títulos, cabeçalhos e tabelas.
- **RF-06:** A entrada das rotas de download deve ser validada via Zod antes da geração.

### 4.2 Requisitos Não-Funcionais (RNF)

- **RNF-01 (Runtime):** Deve executar no runtime **Node** (`runtime = "nodejs"`) do Next 16, nunca no Edge.
- **RNF-02 (Performance):** A geração de um PUD típico deve concluir em tempo interativo (alvo < 2 s no servidor), sem baixar binários externos em runtime (sem headless browser).
- **RNF-03 (Sem fontes embarcadas obrigatórias):** A solução não deve depender do embarque de arquivos de fonte para funcionar; deve operar com as fontes padrão da lib.
- **RNF-04 (Acentuação):** Caracteres acentuados do português devem ser renderizados corretamente.
- **RNF-05 (Manutenibilidade):** A lógica de seções deve ser estruturada de forma a permitir reuso na implementação 004 (ganchos para conteúdo genérico, não só PUD).
- **RNF-06 (Consistência):** O PDF e o DOCX devem apresentar o mesmo conteúdo a partir da mesma entrada.

### 4.3 Restrições

- **R-01:** Stack fixa: Next.js 16 (App Router, route handlers Node), React 19, TypeScript, Tailwind v4, Supabase, OpenAI.
- **R-02:** Bibliotecas já instaladas devem ser preservadas; a única nova dependência de runtime prevista é `pdfkit` (+ `@types/pdfkit` em dev).
- **R-03:** Proibido `puppeteer`/headless browser (peso e inadequação a route handler).
- **R-04:** Não alterar o contrato `GeneratedContent` (mudaria a interface com `lib/ai.ts` e o gerador existente).

---

## 5. Critérios de Aceitação

- [ ] **CA-01:** `pdfkit` (e `@types/pdfkit`) instalados e registrados no `package.json`.
- [ ] **CA-02:** `lib/pdf-generator.ts` existe e exporta `PdfGenerator.generate(content: GeneratedContent): Promise<Buffer>`.
- [ ] **CA-03:** O PDF gerado contém todas as seções do DOCX, na mesma ordem, incluindo a quebra de página antes da Rubrica.
- [ ] **CA-04:** `app/api/download/pdf/route.ts` responde `200` com `application/pdf` e `Content-Disposition: attachment; filename="*.pdf"`.
- [ ] **CA-05:** A rota declara `runtime = "nodejs"` e funciona sem erro de Edge/bundling.
- [ ] **CA-06:** `PreviewModal.tsx` exibe os botões "Baixar .DOCX" e "Baixar .PDF", ambos funcionais, com estados de loading independentes.
- [ ] **CA-07:** O PDF aplica cores da paleta escoteira em título/cabeçalhos/tabelas.
- [ ] **CA-08:** Caracteres acentuados (á, ç, ã, é, ê, í, ó, õ, ú) aparecem corretos no PDF.
- [ ] **CA-09:** Body inválido retorna `400`; falha de geração retorna `500` (sem vazar stack ao cliente).
- [ ] **CA-10:** Arrays vazios em `steps/materials/rubric/daily_checklist/comments` não quebram a geração.

---

## 6. Plano de Testes

### 6.1 Testes Unitários

- `PdfGenerator.generate` com um `GeneratedContent` completo retorna um `Buffer` não-vazio cujos primeiros bytes são a assinatura `%PDF`.
- `PdfGenerator.generate` com arrays vazios (`steps`, `materials`, `rubric`, `daily_checklist`, `comments`) não lança e retorna um PDF válido.
- (Se DocumentEngine) `buildPudModel(content)` produz as seções esperadas na ordem correta.
- Schema Zod aceita um payload válido e rejeita payloads com campos faltando.

### 6.2 Testes de Integração

- `POST /api/download/pdf` com payload válido → `200`, `Content-Type: application/pdf`, header `Content-Disposition` com `.pdf`.
- `POST /api/download/pdf` com body vazio/JSON inválido → `400`.
- `POST /api/download/pdf` simulando erro do gerador → `500` com `{ error }`.
- Confirmar que a rota roda sob runtime Node (sem erro de API indisponível no Edge).

### 6.3 Testes Manuais / E2E

- Gerar um PUD real, abrir o `PreviewModal`, clicar em "Baixar .PDF" e verificar que o arquivo baixa e abre em leitor de PDF.
- Abrir o PDF e o DOCX lado a lado e conferir paridade de seções/conteúdo.
- Verificar visualmente cores da paleta, quebra de página antes da Rubrica e renderização das tabelas (Rubrica e Checklist).
- Conferir acentuação em um documento com texto rico em acentos.

### 6.4 Testes de Regressão

- Confirmar que "Baixar .DOCX" continua funcionando após as mudanças no `PreviewModal`.
- Confirmar que a rota DOCX existente não regrediu (mesmos headers e conteúdo).
- (Se DocumentEngine adotado) garantir que o DOCX refatorado produz saída equivalente à anterior.

---

## 7. Riscos e Mitigações

| ID | Risco | Probabilidade | Impacto | Mitigação |
|---|---|---|---|---|
| R-01 | Bundling do `pdfkit` no Next 16 (assets internos de fonte `.afm`) gerar erro em runtime serverless. | Média | Alto | Forçar `runtime = "nodejs"`; se necessário, marcar `pdfkit` como `serverComponentsExternalPackages`/`serverExternalPackages` no `next.config`; validar com build de produção, não só dev. |
| R-02 | Layout manual de tabelas no pdfkit ficar trabalhoso e quebrar entre páginas. | Média | Médio | Implementar helper de tabela com cálculo de altura de linha e quebra automática de página; cobrir com teste de conteúdo longo. |
| R-03 | Caractere acentuado/fora de WinAnsi não renderizar com a fonte padrão. | Baixa | Médio | Usar fontes padrão (cobrem PT-BR); se necessário, embarcar um `.ttf` Unicode específico e registrá-lo no gerador (exceção pontual à RNF-03). |
| R-04 | Divergência visual/de conteúdo entre PDF e DOCX ao evoluir um sem o outro. | Média | Médio | Adotar o DocumentEngine (modelo de seções único) para que ambos derivem da mesma fonte; até lá, testes de paridade. |
| R-05 | Refator opcional do DocumentEngine introduzir regressão no DOCX já funcional. | Baixa | Alto | Tratar o DocumentEngine como entrega separada/opcional; testes de regressão de DOCX antes de mesclar. |
| R-06 | Acoplamento ao shape específico do PUD dificultar a 004. | Média | Médio | Desenhar o modelo de seções genérico desde já, com builder `buildPudModel` isolando o mapeamento PUD→seções. |

---

## 8. Dependências

### 8.1 Internas

- `lib/ai.ts` — contrato `GeneratedContent` (fonte de dados; não pode mudar).
- `lib/docx-generator.ts` — referência de seções/ordem a ser espelhada (e alvo do refator opcional).
- `app/api/download/docx/route.ts` — padrão de rota/headers a ser replicado.
- `components/PreviewModal.tsx` — consumidor do front (recebe `data`/`GeneratedContent`).
- `components/ui/button.tsx` — botão (`variant="scout"`/`outline`) reutilizado para a nova ação.

### 8.2 Externas

- **`pdfkit`** — biblioteca de geração de PDF (runtime). **A instalar.**
- **`@types/pdfkit`** — tipos TypeScript (devDependencies). **A instalar.**
- `zod` — já instalada; usada para validar o body das rotas.
- `next` (16) / `react` (19) — já presentes; runtime Node dos route handlers.
- _Não aplicável:_ nenhum serviço externo/API adicional é necessário (a geração é totalmente local ao servidor).

---

## 9. Observações e Decisões de Design

- **Por que `pdfkit` e não `@react-pdf/renderer`:** estabilidade e previsibilidade em runtime Node do Next 16, sem dependência de browser headless e sem necessidade obrigatória de embarcar fontes. A estilização declarativa do `@react-pdf` é atraente, mas o histórico de atritos de bundling/ESM em server do Next pesou contra; fica como alternativa para reavaliação na 004.
- **DocumentEngine como gancho para a 004:** a 004 vai gerar documentos a partir de **schemas variáveis** (não só PUD). Por isso o modelo de seções é desenhado genérico (`title`, `metaTable`, `heading`, `steps`, `bullets`, `paragraph`, `table`, `pageBreak`) e o mapeamento específico do PUD fica isolado em `buildPudModel`. Renderers (DOCX/PDF) consomem o modelo, não o `GeneratedContent` diretamente — minimizando duplicação futura.
- **Escopo intencionalmente limitado:** o **PPTX** prometido no PRD **não** faz parte desta implementação; permanece como trabalho futuro. Esta entrega foca em fechar o gap **PDF + Word** pedido pelo usuário.
- **Validação Zod:** aproveita-se esta implementação para fechar a TODO já anotada na rota DOCX ("validate body with Zod schema"), aplicando o mesmo schema nas duas rotas.
- **Runtime explícito:** declarar `export const runtime = "nodejs"` em ambas as rotas evita que otimizações do Next as movam para o Edge, onde `pdfkit` não funciona.
- **N/A — Migrações de banco:** não aplicável; esta implementação não toca em Supabase nem em tabelas (geração é stateless a partir do payload).
