# Smart B3 - Gerenciador de Carteira e Impostos

O **Smart B3** é uma aplicação web full-stack para gerenciamento e acompanhamento de carteira de investimentos, focada em ativos de Renda Variável (Ações da B3, FIIs e Criptomoedas).

A plataforma permite que o usuário cadastre suas operações de compra e venda, visualize a alocação de seus ativos em um dashboard, acompanhe o preço dos ativos em tempo real e, o mais importante, automatize o cálculo do imposto de renda (DARF) devido sobre seus lucros.

## ✨ Funcionalidades Principais

Este projeto vai além de um CRUD básico e implementa diversas funcionalidades complexas e modernas:

* **Dashboard Detalhado:**
    * Visualização do patrimônio total, custo de aquisição e lucro/prejuízo da carteira.
    * Gráfico de alocação de ativos (Pizza).
    * Card de "Ativos em Destaque" com dados de mercado em tempo real.
    * Lista das últimas transações realizadas.

* **Gerenciamento de Transações:**
    * CRUD completo para registrar operações de compra e venda.
    * Formulário dinâmico que busca o preço atual do ativo no momento do cadastro.
    * Campos condicionais de formulário (Zod) que exigem `operationType` (Swing/Day Trade) para Ações/Cripto e `retentionPeriod` para FIIs.
    * Validação de backend que impede a venda a descoberto (vender mais ativos do que possui).

* **Cálculo de Imposto (DARF):**
    * Gera PDFs de DARF individuais para Ações (Cód. 6015), FIIs (Cód. 6015) e Cripto (Cód. 4600/1889).
    * Gera um **Relatório Mensal Unificado** que consolida os três cálculos em um único PDF.
    * **Atualização Atômica:** Atualiza automaticamente o relatório unificado sempre que um DARF individual é (re)calculado, garantindo consistência dos dados.
    * Armazena prejuízos acumulados (`AccumulatedLoss`) para compensação em lucros futuros.

* **Relatórios e Armazenamento:**
    * Geração de PDFs dinâmicos no servidor usando `@react-pdf/renderer`.
    * Armazenamento de relatórios gerados no **Vercel Blob**.
    * Página de relatórios com visão dupla: "Por Mês (Unificado)" ou "Geral (Por Categoria)".

* **Busca e Notificações:**
    * Pesquisa global de ativos (`⌘K` / `Ctrl+K`) que busca tanto na carteira do usuário quanto em APIs externas para adicionar novos ativos.
    * Notificações via **WhatsApp** (usando a API da Meta).
    * Disparo de notificações mensais automatizado via **Vercel Cron Jobs**.

* **Autenticação e Sincronização:**
    * Gerenciamento de usuários completo via **Clerk**.
    * Sincronização de exclusão de usuário: Um webhook do Clerk (não incluído no código, mas planejado) garante que, se um usuário for excluído no Clerk, todos os seus dados pessoais (carteira, transações, DARFs) sejam **automaticamente excluídos** do banco de dados (via `onDelete: Cascade`).

## 🚀 Stack de Tecnologia

Este projeto utiliza uma stack moderna e robusta focada em TypeScript e Next.js.

* **Framework:** **Next.js 14** (com App Router)
* **Linguagem:** **TypeScript**
* **Backend:** **Next.js Server Actions** (para mutações de dados)
* **ORM:** **Prisma**
* **Banco de Dados:** **PostgreSQL**
* **Autenticação:** **Clerk**
* **UI:** **Tailwind CSS** + **shadcn/ui**
* **Gráficos:** **Recharts**
* **Animações:** **Framer Motion** (ex: `CometCard`)
* **Formulários:** **React Hook Form**
* **Validação:** **Zod**
* **Geração de PDF:** **`@react-pdf/renderer`**
* **Armazenamento de Arquivos:** **Vercel Blob**
* **Notificações:** **API da Meta (WhatsApp)**

## 🔗 APIs Externas

O projeto se integra com APIs financeiras para obter dados de mercado em tempo real:

* **Brapi API:** Utilizada para buscar cotações e informações de ações e FIIs listados na B3.
* **CoinGecko API:** Utilizada para buscar cotações, IDs e informações de Criptomoedas.

## 🗃️ Modelo do Banco de Dados (Prisma)

O `schema.prisma` define a estrutura central da aplicação:

* `User`: Gerencia os usuários (ID espelhado do Clerk).
* `Portfolio`: Armazena a carteira do usuário (ex: "Carteira Principal").
* `Asset`: Ativos (Ações, FIIs, Cripto) com `quantity`, `averagePrice` e `apiId` (para cripto).
* `Transaction`: Registra cada operação individual de `COMPRA` ou `VENDA` de um ativo.
* `MonthlyResult`: Armazena resultados mensais por tipo de operação (Swing/Day Trade).
* `AccumulatedLoss`: Controla os prejuízos acumulados de meses anteriores para abatimento em lucros futuros.
* `Darf`: Armazena os PDFs gerados, incluindo os tipos `ACAO`, `FII`, `CRIPTO` e `UNIFICADA`.



## ⚙️ Como Executar o Projeto

1.  **Clone o repositório:**
    ```bash
    git clone [https://github.com/victoriacarvalho/smart-b3](https://github.com/victoriacarvalho/smart-b3)
    cd smart-b3
    ```

2.  **Instale as dependências:**
    ```bash
    npm install
    ```

3.  **Configure as Variáveis de Ambiente:**
    Crie um arquivo `.env.local` na raiz do projeto e adicione as seguintes chaves:

    ```env
    # Prisma
    DATABASE_URL="postgresql://USER:PASSWORD@HOST:PORT/DATABASE"

    # Clerk (Obrigatório para login)
    NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=...
    CLERK_SECRET_KEY=...
    CLERK_WEBHOOK_SECRET=... # (Para sincronia de exclusão de usuário)

    # Vercel (Obrigatório para gerar PDFs)
    BLOB_READ_WRITE_TOKEN=...
    
    # Cron (Obrigatório para o Vercel Cron)
    CRON_SECRET=...

    # APIs (Opcional, mas recomendado para funcionalidade completa)
    BRAPI_API_TOKEN=...
    WHATSAPP_API_TOKEN=...
    WHATSAPP_PHONE_NUMBER_ID=...
    ```

4.  **Execute as Migrações do Banco:**
    O Prisma usará o `schema.prisma` para criar as tabelas no seu banco.
    ```bash
    npx prisma migrate dev
    ```

5.  **Inicie o servidor de desenvolvimento:**
    ```bash
    npm run dev
    ```

Abra [http://localhost:3000](http://localhost:3000) no seu navegador para ver a aplicação.
