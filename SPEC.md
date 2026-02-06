# SPEC: Arquitetura Técnica - Scout Doc Agent

## 1. Stack Tecnológica
* **Framework:** Next.js 14 (App Router).
* **Linguagem:** TypeScript.
* **Estilização:** Tailwind CSS + Shadcn/UI.
* **Animações:** Framer Motion (Transições) + Lucide React (Ícones).
* **Banco de Dados:** Supabase (Auth + PostgreSQL para metadados dos docs).
* **LLM:** OpenAI API (GPT-4o) ou Google Gemini 1.5 Pro.
* **Document Generation:** `docx` (Node.js library) para manipulação de arquivos Office.

## 2. Estrutura de Dados (Database)
### Tabela `documents`
* `id`: uuid (PK)
* `user_id`: uuid (FK)
* `title`: string
* `content_json`: jsonb (Conteúdo bruto da IA)
* `status`: enum ('draft', 'completed')
* `created_at`: timestamp

## 3. API & AI Prompting
O sistema enviará um payload para o Route Handler do Next.js:
```json
{
  "linha": "Escotista",
  "nivel": "Avançado",
  "ramo": "Escoteiro",
  "titulo": "Pioneirismo com Nós e Amarras",
  "contexto": "UEL em zona urbana com 20 jovens"
}

**Ação:** O backend concatena os dados com o _System Prompt_ (definido anteriormente) e solicita um JSON estruturado da LLM para facilitar o preenchimento do template Word.

## 4. Componentes Chave (Frontend)

*   **StepForm.tsx**: Gerencia o estado local do formulário e as animações de entrada/saída usando AnimatePresence.
    
*   **LoadingScout.tsx**: Componente de animação customizado. Uma bússola girando ou fogueira pulsando enquanto a fetch para a API está em pending.
    
*   **PreviewModal.tsx**: Renderiza o texto da IA em um formato legível para aprovação do usuário.
    

5\. Estratégia de Geração de Arquivos
-------------------------------------

1.  O conteúdo é validado pela IA.
    
2.  A biblioteca docx recebe o JSON.
    
3.  O código mapeia as chaves (ex: detalhamento\_metodologia) para as células específicas da tabela no modelo oficial.
    
4.  O arquivo é gerado no Server Side e enviado como stream para o cliente.
    

6\. Segurança
-------------

*   Middleware do Next.js para proteger rotas de /dashboard e /gerador.
    
*   Sanitização de strings vindas da LLM para evitar quebras no XML do Word.

