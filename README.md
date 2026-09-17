# Ninho Backend

API de autenticação do Ninho construída com NestJS, Prisma e PostgreSQL.

## Pré-requisitos

- Node.js 20+
- PostgreSQL 16+ ou Docker Desktop

## Executar localmente

```powershell
npm install
Copy-Item .env.example .env # somente se o arquivo .env ainda não existir
docker compose up -d        # dispense se já tiver PostgreSQL local
npm run prisma:migrate:prod
npm run start:dev
```

A API fica em `http://localhost:3000/api/v1` e o Swagger em
`http://localhost:3000/api/docs`.

## Rotas de autenticação

| Método | Rota | Autenticação | Finalidade |
| --- | --- | --- | --- |
| POST | `/api/v1/auth/register` | Pública | Cria a conta e inicia a sessão |
| POST | `/api/v1/auth/login` | Pública | Entra com e-mail e senha |
| POST | `/api/v1/auth/refresh` | Pública | Rotaciona access e refresh tokens |
| POST | `/api/v1/auth/logout` | Bearer | Revoga a sessão |
| GET | `/api/v1/auth/me` | Bearer | Retorna o usuário autenticado |

No cadastro, envie `email`, `phone`, `password` e `passwordConfirmation`.
Senhas e refresh tokens são persistidos somente como hashes Argon2id.

## Verificação

```powershell
npm run prisma:validate
npm run build
npm test -- --runInBand
```
