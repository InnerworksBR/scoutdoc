# Guia de Deploy - ScoutDoc AI

Este projeto foi construído com Next.js 14 e Supabase. Siga os passos abaixo para colocar o sistema no ar.

## 1. Pré-requisitos
-   Conta no Github.
-   Conta na Vercel (para frontend/API).
-   Conta no Supabase (para banco de dados/auth).
-   Chave de API da OpenAI.

## 2. Configuração do Supabase
1.  Crie um novo projeto no Supabase.
2.  Vá no **SQL Editor** e rode o script contido em `supabase/schema.sql` para criar tabela `documents`.
3.  Vá em **Authentication** -> **Providers** e habilite o proveder **Email**.
4.  Em **Authentication** -> **URL Configuration**, adicione a URL do seu site de produção (quando tiver) em "Site URL" e "Redirect URLs".

## 3. Deploy na Vercel
1.  Faça o push deste código para um repositório no Github.
2.  Acesse [vercel.com/new](https://vercel.com/new) e importe o repositório.
3.  Nas configurações de **Environment Variables**, adicione as seguintes chaves (copie os valores do seu Supabase e OpenAI):

    ```env
    NEXT_PUBLIC_SUPABASE_URL=...
    NEXT_PUBLIC_SUPABASE_ANON_KEY=...
    OPENAI_API_KEY=...
    ```

4.  Clique em **Deploy**.

## 4. Pós-Deploy
-   Acesse a URL gerada pela Vercel.
-   Tente criar uma conta (lembre-se: apenas `@escoteiros.org.br`).
-   Gere um PUD para testar a integração com a OpenAI e o Banco de Dados.

## 5. Manutenção
-   Para alterar o prompt da IA, edite `lib/ai.ts`.
-   Para mudar as regras de acesso, edite `supabase/schema.sql` (RLS policies).

Sempre Alerta! ⚜️
