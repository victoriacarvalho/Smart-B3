# Smart B3 - Gerenciador de Carteira de Investimentos

O Smart B3 é uma aplicação web full-stack para gerenciamento e acompanhamento de carteira de investimentos, focada em ativos de Renda Variável (Ações da B3 e Criptomoedas).

A plataforma permite que o usuário cadastre suas operações de compra e venda, visualize a alocação de seus ativos em um dashboard, acompanhe o preço dos ativos em tempo real e, o mais importante, automatize o cálculo do imposto de renda (DARF) devido sobre seus lucros.

## Funcionalidades Principais

* **Dashboard Intuitivo:** Visualização rápida do patrimônio total, rentabilidade, alocação de ativos (em gráfico de pizza) e as últimas transações realizadas.
* **Gerenciamento de Transações:** CRUD completo para registrar operações de compra e venda de Ações e Criptomoedas.
* **Cálculo de Imposto (DARF):** Funcionalidade para calcular o imposto devido em operações de Renda Variável, considerando lucros, prejuízos acumulados e as regras de isenção.
* **Geração de Relatórios:** Página para listar e baixar os documentos DARF que foram gerados pelo sistema.
* **Busca de Ativos:** Integração com APIs externas para buscar cotações e informações de ativos (Ações e Cripto) no momento de registrar uma nova operação.
* **Acompanhamento de Ativo:** Página dedicada para ver o histórico e informações de um ativo específico da carteira.
* **Notificações:** Configuração de notificações (via WhatsApp) para ser avisado sobre seus ativos.

## Stack de Tecnologia

* **Framework:** [Next.js](https://nextjs.org/) (com App Router)
* **Linguagem:** [TypeScript](https://www.typescriptlang.org/)
* **ORM:** [Prisma](https://www.prisma.io/)
* **Banco de Dados:** [PostgreSQL](https://www.postgresql.org/)
* **UI:** [Tailwind CSS](https://tailwindcss.com/) & [shadcn/ui](https://ui.shadcn.com/)
* **Gráficos:** [Recharts](https://recharts.org/)
* **Validação:** [Zod](https://zod.dev/)

## APIs Externas

O projeto se integra com APIs financeiras para obter dados de mercado em tempo real:

* **Brapi API:** Utilizada para buscar cotações e informações de ações listadas na B3.
* **CoinGecko API:** Utilizada para buscar cotações e informações de Criptomoedas.

## Modelo do Banco de Dados (Prisma)

O `schema.prisma` define a estrutura central da aplicação:

* `User`: Gerencia os usuários da plataforma.
* `Asset`: Armazena os ativos (Ações, Criptos, FIIs) que o usuário possui em carteira.
* `Operation`: Registra cada transação individual de compra ou venda de um ativo.
* `AccumulatedLoss`: Controla os prejuízos acumulados de meses anteriores para abatimento em lucros futuros.
* `Darf`: Armazena os documentos (DARF) de imposto que foram calculados e gerados.

## Como Executar o Projeto

1.  **Clone o repositório:**
    ```bash
    git clone https://github.com/victoriacarvalho/fp
    cd smart-b3
    ```

2.  **Instale as dependências:**
    ```bash
    npm install
    ```

3.  **Configure as Variáveis de Ambiente:**
    Crie um arquivo `.env` na raiz do projeto. Você precisará, no mínimo, da URL do seu banco de dados:
    ```env
    DATABASE_URL="postgresql://USER:PASSWORD@HOST:PORT/DATABASE"
    
    # Chaves para as APIs (opcional, mas recomendado para buscar cotações)
    # BRAPI_API_TOKEN=...
    # COINGECKO_API_KEY=...
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
