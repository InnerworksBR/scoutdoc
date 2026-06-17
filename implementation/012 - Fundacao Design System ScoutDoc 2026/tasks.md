# Tarefas: Fundação do Design System ScoutDoc 2026

> **Implementação:** 012 - Fundação Design System ScoutDoc 2026
> **Spec:** [spec.md](./spec.md)
> **Progresso:** 6/6 tarefas concluídas (100%)
> **Última atualização:** 2026-06-17

---

## Legenda
- `[ ]` Pendente · `[x]` Concluída · `[!]` Bloqueada · `[-]` Cancelada

---

## Tarefas

### Fase 1: Preparação e Setup

- [x] **T-001:** Importar assets de marca UEB
  - **Descrição:** Copiar `emblema.png`, `logo-horizontal.png`, `logo-vertical.png` do design para `public/brand/`.
  - **Arquivos envolvidos:** `public/brand/*`
  - **Critério de conclusão:** Arquivos acessíveis em `/brand/...`.
  - **Dependências:** Nenhuma
  - **Estimativa:** Pequena

### Fase 2: Implementação Core

- [x] **T-002:** Reescrever paleta e tokens em `globals.css`
  - **Descrição:** Retunar `scout/azure/gold/cream` para a paleta do design e adicionar `ink/lime/royal`, mapeamentos semânticos e raios.
  - **Arquivos envolvidos:** `app/globals.css`
  - **Critério de conclusão:** Hex-alvo conferem (CA-002).
  - **Dependências:** Nenhuma
  - **Estimativa:** Média

- [x] **T-003:** Fontes + animações + utilitários sticker
  - **Descrição:** Carregar Fredoka/Montserrat em `layout.tsx`; adicionar `@keyframes sd-*`, `.sd-scroll`, utilitários sticker e gradiente atualizado em `globals.css`.
  - **Arquivos envolvidos:** `app/layout.tsx`, `app/globals.css`
  - **Critério de conclusão:** CA-003 e RF-003/004.
  - **Dependências:** T-002
  - **Estimativa:** Média

- [x] **T-004:** Re-skin do `Button`
  - **Descrição:** Variantes sticker (borda tinta, sombra hard-offset, efeito press) preservando `variant`/`size`/props.
  - **Arquivos envolvidos:** `components/ui/button.tsx`
  - **Critério de conclusão:** CA-004.
  - **Dependências:** T-002
  - **Estimativa:** Média

- [x] **T-005:** Re-skin de `Card`, `Input`, `Label`
  - **Descrição:** Aplicar estilo sticker (bordas grossas, raio, foco azure, Fredoka no Label) mantendo props.
  - **Arquivos envolvidos:** `components/ui/card.tsx`, `components/ui/input.tsx`, `components/ui/label.tsx`
  - **Critério de conclusão:** RF-006.
  - **Dependências:** T-002
  - **Estimativa:** Pequena

### Fase 3: Testes e Validação

- [x] **T-006:** Verificação de qualidade
  - **Descrição:** Rodar `npx tsc --noEmit` e `npm run lint`; corrigir regressões.
  - **Arquivos envolvidos:** —
  - **Critério de conclusão:** CA-001.
  - **Dependências:** T-002..T-005
  - **Estimativa:** Pequena

---

## Registro de Progresso

| Tarefa | Status | Data de Conclusão | Observações |
|--------|--------|-------------------|-------------|
| T-001  | 🟢 Concluída | 2026-06-17 | Assets em `public/brand/` |
| T-002  | 🟢 Concluída | 2026-06-17 | Paleta hex do design |
| T-003  | 🟢 Concluída | 2026-06-17 | Fredoka+Montserrat, animações sd-* |
| T-004  | 🟢 Concluída | 2026-06-17 | Botões sticker |
| T-005  | 🟢 Concluída | 2026-06-17 | Card/Input/Label |
| T-006  | 🟢 Concluída | 2026-06-17 | tsc + lint |

---

> **📌 NOTA:** Atualizar ao concluir cada tarefa.
