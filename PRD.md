# PRD: Agent Scout Doc Generator

## 1. Visão Geral
Um assistente inteligente para Chefes e Dirigentes da UEB (União dos Escoteiros do Brasil) que automatiza a criação de Planos de Unidade Didática (PUD) e documentos de formação, garantindo conformidade com as normas nacionais e metodologias andragógicas.

## 2. Objetivos
* Reduzir o tempo de planejamento de um PUD de horas para minutos.
* Garantir 100% de precisão técnica (Citações POR, PNAME e Matriz de Formação).
* Proporcionar uma experiência de usuário (UX) fluida e moderna com interface Step-by-Step.

## 3. Público-Alvo
* Escotistas, Dirigentes e Formadores da UEB que precisam criar material pedagógico para cursos e reuniões.

## 4. Requisitos Funcionais (FR)
* **FR1: Autenticação:** Login e senha simples para acesso ao dashboard pessoal.
* **FR2: Dashboard de Documentos:** Listagem de arquivos gerados anteriormente com status e botões de download.
* **FR3: Formulário Inteligente (Step-by-Step):** Coleta de dados (Linha, Nível, Ramo, etc.) com validação em tempo real.
* **FR4: Integração LLM:** Envio dos dados estruturados para a IA para geração do conteúdo técnico.
* **FR5: Preview do Documento:** Visualização em tela do conteúdo gerado antes da conversão final.
* **FR6: Geração de Arquivos:** Conversão do conteúdo aprovado para formatos `.docx` (modelo oficial) e `.pptx`.

## 5. Requisitos Não Funcionais (NFR)
* **NFR1: Performance:** O formulário deve ter transições suaves (< 300ms) entre passos.
* **NFR2: UX/UI:** Estética baseada na identidade escoteira, mas com visual "clean" e moderno.
* **NFR3: Confiabilidade:** O conteúdo gerado deve obrigatoriamente citar fontes oficiais da UEB.

## 6. Fluxo do Usuário
1. Login -> 2. Dashboard -> 3. Clique em "Novo PUD" -> 4. Preenchimento de 7-8 passos -> 5. Animação de Processamento (IA) -> 6. Preview e Edição -> 7. Download.