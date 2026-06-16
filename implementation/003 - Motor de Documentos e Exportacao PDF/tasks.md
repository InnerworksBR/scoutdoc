# Tarefas — 003 Motor de Documentos e Exportação PDF

> **Implementação:** 003 — Motor de Documentos e Exportação PDF
> **Spec:** [./spec.md](./spec.md)
> **Progresso:** 6/8 (75%)
> **Última atualização:** 2026-06-16

---

## Legenda

- ⬜ **Pendente** — ainda não iniciada
- 🟦 **Em andamento** — em execução
- ✅ **Concluída** — finalizada e validada
- ⛔ **Bloqueada** — aguardando dependência
- ⚪ **Opcional** — melhoria não obrigatória para o escopo mínimo

---

## Fase 1 — Setup / Lib

### T-001 — Instalar e configurar a biblioteca de PDF (`pdfkit`)
- **Descrição:** Adicionar `pdfkit` (runtime) e `@types/pdfkit` (dev) ao projeto. Validar que importa em route handler Node. Se necessário, registrar `pdfkit` como pacote externo do servidor no `next.config` para evitar problemas de bundling de assets internos.
- **Arquivos envolvidos:** `package.json`, `next.config.ts`/`next.config.mjs`
- **Critério de conclusão:** `pdfkit` instalado; um `import PDFDocument from "pdfkit"` em rota Node compila e roda no build de produção sem erro.
- **Dependências:** —
- **Estimativa:** 0,5h
- **Observações:** Confirmar versão; não instalar `puppeteer`.

---

## Fase 2 — Geração PDF

### T-002 — (Opcional) Criar o modelo de seções DocumentEngine
- **Descrição:** Criar `lib/document-model.ts` com o tipo `Section` (title, metaTable, heading, steps, bullets, paragraph, table, pageBreak), o tipo `DocumentModel` e o builder `buildPudModel(content: GeneratedContent): DocumentModel`. Base reutilizável para a implementação 004.
- **Arquivos envolvidos:** `lib/document-model.ts`, `lib/ai.ts` (import do tipo)
- **Critério de conclusão:** `buildPudModel` produz as seções do PUD na ordem correta; tipos exportados e compiláveis.
- **Dependências:** —
- **Estimativa:** 1,5h
- **Observações:** ⚪ Opcional, mas recomendado para reuso na 004. Se omitido, o `PdfGenerator` consome `GeneratedContent` diretamente.

### T-003 — Implementar `PdfGenerator.generate`
- **Descrição:** Criar `lib/pdf-generator.ts` com `PdfGenerator.generate(content): Promise<Buffer>` usando `pdfkit`. Renderizar todas as seções espelhando o `DocxGenerator`: título, tabela de metadados, DESENVOLVIMENTO (steps), MATERIAIS (bullets), AVALIAÇÃO, SEGURANÇA, FONTES/REFERÊNCIAS, quebra de página, RUBRICA (tabela), CHECKLIST (tabela), COMENTÁRIOS (bullets). Aplicar cores da paleta escoteira. Acumular o stream em `Buffer`.
- **Arquivos envolvidos:** `lib/pdf-generator.ts`, `lib/document-model.ts` (se T-002), `lib/docx-generator.ts` (referência), `lib/ai.ts`
- **Critério de conclusão:** retorna `Buffer` iniciando em `%PDF`; todas as seções presentes na ordem da spec; tolera arrays vazios.
- **Dependências:** T-001 (e T-002 se adotado)
- **Estimativa:** 4h
- **Observações:** Implementar helper de tabela com quebra de página automática (R-02). Garantir acentuação PT-BR.

---

## Fase 3 — Rota API

### T-004 — Criar esquema Zod de validação do payload
- **Descrição:** Criar/definir `generatedContentSchema` (Zod) refletindo `GeneratedContent`, para validar o body das rotas de download. Fechar a TODO da rota DOCX.
- **Arquivos envolvidos:** `lib/ai.ts` ou `lib/schemas.ts`
- **Critério de conclusão:** schema aceita payload válido e rejeita payload com campos faltando/tipos errados.
- **Dependências:** —
- **Estimativa:** 0,75h
- **Observações:** `zod` já instalada.

### T-005 — Criar a rota `POST /api/download/pdf`
- **Descrição:** Criar `app/api/download/pdf/route.ts` análoga à de DOCX: declarar `runtime = "nodejs"`, validar o body com Zod, chamar `PdfGenerator.generate`, retornar `application/pdf` com `Content-Disposition: attachment; filename="<titulo>.pdf"`. Tratar 400 (inválido) e 500 (falha).
- **Arquivos envolvidos:** `app/api/download/pdf/route.ts`, `lib/pdf-generator.ts`, schema Zod
- **Critério de conclusão:** `POST` válido → 200 com PDF e headers corretos; body inválido → 400; erro de geração → 500.
- **Dependências:** T-003, T-004
- **Estimativa:** 1h
- **Observações:** Reutilizar sanitização de filename da rota DOCX. Opcional: adicionar `runtime = "nodejs"` também na rota DOCX.

---

## Fase 4 — Frontend

### T-006 — Adicionar botão "Baixar .PDF" no `PreviewModal`
- **Descrição:** Atualizar `components/PreviewModal.tsx` para generalizar `handleDownload(format: "docx" | "pdf")` (endpoint e extensão por formato) e adicionar um segundo botão "Baixar .PDF" ao lado de "Baixar .DOCX", com estados de loading independentes.
- **Arquivos envolvidos:** `components/PreviewModal.tsx`, `components/ui/button.tsx`
- **Critério de conclusão:** ambos os botões aparecem e baixam o arquivo correto; loading por botão; "Baixar .DOCX" continua funcional.
- **Dependências:** T-005
- **Estimativa:** 1h
- **Observações:** Manter o tratamento de erro/alert existente.

---

## Fase 5 — Testes

### T-007 — Testes unitários e de integração
- **Descrição:** Cobrir `PdfGenerator.generate` (payload completo, arrays vazios, assinatura `%PDF`), o schema Zod (aceita/rejeita) e a rota `/api/download/pdf` (200/400/500 e headers). Se T-002, testar `buildPudModel`.
- **Arquivos envolvidos:** `lib/pdf-generator.ts`, `app/api/download/pdf/route.ts`, arquivos de teste correspondentes
- **Critério de conclusão:** testes passam cobrindo os casos 6.1 e 6.2 da spec.
- **Dependências:** T-003, T-005
- **Estimativa:** 2h
- **Observações:** —

### T-008 — Validação manual / regressão e identidade visual
- **Descrição:** Gerar um PUD real, baixar o PDF e o DOCX, conferir paridade de conteúdo, quebra de página antes da Rubrica, renderização das tabelas, cores da paleta escoteira e acentuação. Confirmar que o DOCX não regrediu.
- **Arquivos envolvidos:** `components/PreviewModal.tsx`, `lib/pdf-generator.ts`, `lib/docx-generator.ts`
- **Critério de conclusão:** PDF abre corretamente; paridade com DOCX; cores/acentuação OK; DOCX sem regressão.
- **Dependências:** T-006, T-007
- **Estimativa:** 1h
- **Observações:** Cobre os CAs 03, 06, 07, 08 e os testes 6.3/6.4 da spec.

---

## Registro de Progresso

| Tarefa | Descrição | Fase | Status | Estimativa |
|---|---|---|---|---|
| T-001 | Instalar e configurar `pdfkit` | Setup / Lib | ✅ Concluída | 0,5h |
| T-002 | (Opcional) Modelo de seções DocumentEngine | Geração PDF | ✅ Concluída | 1,5h |
| T-003 | Implementar `PdfGenerator.generate` | Geração PDF | ✅ Concluída | 4h |
| T-004 | Esquema Zod de validação | Rota API | ✅ Concluída | 0,75h |
| T-005 | Rota `POST /api/download/pdf` | Rota API | ✅ Concluída | 1h |
| T-006 | Botão "Baixar .PDF" no `PreviewModal` | Frontend | ✅ Concluída | 1h |
| T-007 | Testes unitários e de integração | Testes | ⬜ Pendente | 2h |
| T-008 | Validação manual / regressão / identidade visual | Testes | ⬜ Pendente | 1h |
