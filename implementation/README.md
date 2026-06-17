# Implementações — ScoutDoc.AI

Índice de implementações (Spec-Driven Development). Cada pasta `NNN - Nome` contém `spec.md` (contrato) e `tasks.md` (plano de execução).

Origem: auditoria de funcionalidades solicitada em 2026-06-16, decomposta em 7 implementações coesas.

## Tabela de Decomposição

| Nº | Implementação | Pedido atendido | Status | Depende de |
|----|---------------|-----------------|--------|------------|
| [001](./001%20-%20Sugestoes%20e%20Boas-vindas%20Configuraveis%20por%20Agente/spec.md) | Sugestões e Boas-vindas Configuráveis por Agente | Editar sugestão de 1ª mensagem | 🟡 Planejada | — |
| [002](./002%20-%20Citacao%20de%20Fontes%20nas%20Respostas%20dos%20Agentes/spec.md) | Citação de Fontes nas Respostas dos Agentes | Referências de qual documento | 🟡 Planejada | — |
| [003](./003%20-%20Motor%20de%20Documentos%20e%20Exportacao%20PDF/spec.md) | Motor de Documentos e Exportação PDF | Geração PDF/Word (base) | 🟡 Planejada | — |
| [004](./004%20-%20Documentos%20Estruturados%20Configuraveis%20nos%20Agentes/spec.md) | Documentos Estruturados Configuráveis nos Agentes | Agentes geram documento ao final | 🟡 Planejada | 003, 002 |
| [005](./005%20-%20Foto%20de%20Avatar%20do%20Agente/spec.md) | Foto de Avatar do Agente | Colocar imagens de foto (agente) | 🟡 Planejada | — |
| [006](./006%20-%20Anexo%20de%20Imagem%20no%20Chat/spec.md) | Anexo de Imagem no Chat (Visão GPT-4o) | Colocar imagens de foto (chat) | 🟡 Planejada | — |
| [007](./007%20-%20Foto%20de%20Perfil%20do%20Usuario/spec.md) | Foto de Perfil do Usuário | Colocar imagens de foto (usuário) | 🟡 Planejada | — |

## Ordem de Execução Recomendada

1. **001** — quick win, isolado (config de sugestões/boas-vindas por agente)
2. **002** — citações de fonte no chat e no PUD
3. **003** — motor de documentos + PDF (base reutilizável)
4. **004** — documentos estruturados nos agentes (requer 003 e 002)
5. **005**, **006**, **007** — pipeline de imagens (independentes entre si)

## Redesign ScoutDoc 2026 (012–017)

Origem: design aprovado **"ScoutDoc 2026.dc.html"** (tema sticker/neo-brutalista escoteiro —
Fredoka+Montserrat, bordas tinta `#16302b`, sombras hard-offset, paleta verde `#08ba54` /
lime `#b0dd43` / azure `#02a1d9` / azul-real `#0649d5` / dourado `#ffda3e` sobre creme `#f1efe4`).
Decomposto em 6 implementações coesas; **012 é a fundação** e habilita as demais.

| Nº | Implementação | Escopo | Status | Depende de |
|----|---------------|--------|--------|------------|
| [012](./012%20-%20Fundacao%20Design%20System%20ScoutDoc%202026/spec.md) | Fundação Design System ScoutDoc 2026 | Fontes, paleta, animações, utilitários sticker, assets UEB, primitivos UI | 🟢 Concluída | — |
| [013](./013%20-%20Redesign%20Landing%20e%20Login/spec.md) | Redesign Landing & Login | Telas Landing + Login | 🟢 Concluída | 012 |
| [014](./014%20-%20Redesign%20Dashboard/spec.md) | Redesign Dashboard | Hero, CTA PUD, carrossel de assistentes, grid de documentos | 🟢 Concluída | 012 |
| [015](./015%20-%20Redesign%20Assistentes%20e%20Chat/spec.md) | Redesign Assistentes & Chat | Lista de assistentes + chat (bolhas, sugestões, header) | 🟢 Concluída | 012 |
| [016](./016%20-%20Redesign%20Gerador%20de%20PUD%20e%20Loading/spec.md) | Redesign Gerador de PUD & Loading | Wizard 4 passos + trilha de progresso + loading | 🟢 Concluída | 012 |
| [017](./017%20-%20Redesign%20Preview%20de%20Documento%20e%20Apoio/spec.md) | Redesign Preview de Documento & Apoio | Preview do PUD (selo, export) + perfil/admin herdam tema | 🟢 Concluída | 012 |

### Ordem de Execução Recomendada (redesign)
1. **012** — fundação (obrigatória primeiro)
2. **013** — Landing & Login (entrada pública)
3. **014**, **015**, **016**, **017** — telas internas (independentes entre si após 012)

> **Status do redesign:** ✅ 012–017 concluídas. Verificação: `tsc --noEmit` ✓ e `next build` ✓ (21 rotas).
> Lógica/funcionalidades preservadas; erros de lint `no-explicit-any` são pré-existentes (dívida de tipagem do projeto, não gateiam o build no Next 16).

## Legenda de Status

🟡 Planejada · 🔵 Em Andamento · 🟢 Concluída · 🔴 Bloqueada · ⚪ Cancelada
