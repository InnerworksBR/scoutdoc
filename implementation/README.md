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

## Legenda de Status

🟡 Planejada · 🔵 Em Andamento · 🟢 Concluída · 🔴 Bloqueada · ⚪ Cancelada
