# Colortim Backend

Backend Node.js + Express + TypeScript + PostgreSQL

## Setup

### 1. Instalar dependências
```bash
cd backend
npm install
```

### 2. Subir o PostgreSQL com Docker
```bash
docker-compose up -d
```

### 3. Configurar variáveis de ambiente
```bash
cp .env.example .env
```

### 4. Rodar as migrações
```bash
npm run db:migrate
```

### 5. Seed (criar usuário admin)
```bash
npm run db:seed
```
> Login padrão: **admin / admin123**

### 6. Rodar o backend em dev
```bash
npm run dev
```

Backend disponível em: `http://localhost:3001`

## Estrutura
```
src/
├── db/
│   ├── pool.ts       # Conexão PostgreSQL
│   ├── migrate.ts    # Criação das tabelas
│   └── seed.ts       # Dados iniciais
├── middleware/
│   └── auth.ts       # Middleware de autenticação por sessão
├── routes/
│   ├── auth.ts       # Login, logout, /me
│   ├── productionOrders.ts
│   ├── stages.ts     # Preparação, produção, secadora, etc.
│   ├── dashboard.ts  # KPIs
│   ├── employees.ts
│   ├── admin.ts      # Gestão de usuários
│   └── misc.ts       # Fibras, transportadoras, regiões, pesagem, PCP, fabric quality
├── shared/
│   └── types.ts      # Schemas Zod compartilhados
└── index.ts          # Entry point
```
