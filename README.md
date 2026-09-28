# Ninho Backend

API de autenticação e comunidade do Ninho construída com NestJS, Prisma e PostgreSQL.

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

## Comunidade

Todas as rotas abaixo exigem `Authorization: Bearer <accessToken>` e ficam em
`/api/v1/community`. As respostas seguem o envelope `{ "data": ..., "meta": ... }`.

| Método | Rota | Finalidade |
| --- | --- | --- |
| GET | `/profile/me` | Ver meu nome, identificador e avatar públicos |
| PATCH | `/profile/me` | Atualizar `name`, `handle`, `avatarEmoji` ou `avatarBg` |
| GET | `/posts?filter=para&limit=20&cursor=...` | Feed paginado; `para` prioriza acolhimentos e `recentes` usa data |
| POST | `/posts` | Criar publicação com `text` e `tag` opcional |
| GET | `/posts/:postId` | Consultar publicação e suas contagens |
| DELETE | `/posts/:postId` | Excluir publicação própria |
| PUT | `/posts/:postId/welcome` | Acolher publicação, sem duplicar a reação |
| DELETE | `/posts/:postId/welcome` | Retirar acolhimento |
| GET | `/posts/:postId/comments?limit=30&cursor=...` | Listar comentários em ordem de criação |
| POST | `/posts/:postId/comments` | Criar comentário com `text` |
| DELETE | `/posts/:postId/comments/:commentId` | Excluir comentário próprio |

As listagens retornam `{ "items": [...], "nextCursor": null | "uuid" }` dentro
de `data`. Passe `nextCursor` na próxima chamada enquanto ele não for `null`.
Cada publicação contém `author` (`name`, `handle`, `avatarEmoji`, `avatarBg`),
`tag`, `text`, `welcomeCount`, `commentCount` e `welcomedByMe`. Os comentários
contêm `author`, `text` e `createdAt`. O apelido inicial é gerado a partir do
identificador da conta; e-mail e telefone não aparecem no feed.

O frontend atual de Comunidade ainda usa `MOCK_POSTS` e `INITIAL_COMMENTS`.
Para exibir os dados reais, ele precisa chamar essas rotas com o token da sessão.

## Verificação

```powershell
npm run prisma:validate
npm run build
npm test -- --runInBand
```
