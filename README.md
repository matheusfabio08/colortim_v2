# Colortim V2

Sistema de gestão de ordens de produção — **React + Node.js + PostgreSQL**

## Estrutura

```
colortim_v2/
├── backend/    # Node.js + Express + TypeScript + PostgreSQL
└── frontend/   # React + Vite + Tailwind
```

## Como rodar

### Backend
```bash
cd backend
npm install
docker-compose up -d          # Sobe o PostgreSQL
cp .env.example .env
npm run db:migrate             # Cria as tabelas
npm run db:seed                # Cria usuário admin (admin/admin123)
npm run dev                    # Roda em http://localhost:3001
```

### Frontend
```bash
cd frontend
npm install
npm run dev                    # Roda em http://localhost:5173
```

O frontend faz proxy de `/api` para `http://localhost:3001` automaticamente.

## Credenciais padrão
- **Usuário:** admin
- **Senha:** admin123
