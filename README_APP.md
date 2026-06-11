# Estação Jardim

Este é o aplicativo Estação Jardim, com backend NestJS + Prisma + PostgreSQL e frontend em HTML/CSS/JavaScript.

## Como executar

1. Copie as variáveis de ambiente:
   ```powershell
   cp .env.example .env
   ```
2. Inicie o sistema com Docker Compose:
   ```powershell
   npm run docker:up
   ```
3. Abra no navegador:
   ```
   http://localhost:8080
   ```

## Estrutura do projeto

- `backend-gateway/` — API NestJS com autenticação JWT e Prisma.
- `frontend/` — interface web estática.
- `docker-compose.yml` — orquestra PostgreSQL, backend e Nginx.

## Endpoints principais

- `POST /api/auth/register`
- `POST /api/auth/login`
- `GET /api/menu`
- `GET /api/reservations`
- `POST /api/reservations`
- `GET /api/orders`
- `POST /api/orders`

## Variáveis de ambiente

- `DATABASE_URL`
- `JWT_SECRET`
- `JWT_EXPIRES_IN`
- `BACKEND_PORT`
- `FRONTEND_PORT`
- `POSTGRES_PORT`
