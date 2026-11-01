import "dotenv/config";
import { PrismaClient, UserRole } from "@prisma/client";
import * as argon2 from "argon2";
import { randomUUID } from "node:crypto";

const databaseUrl = process.env.DATABASE_URL;
if (
  process.env.APP_ENV !== "local" ||
  !databaseUrl ||
  !["localhost", "127.0.0.1"].includes(new URL(databaseUrl).hostname)
) {
  throw new Error("Os dados de demonstração só podem ser inseridos no banco local.");
}

const prisma = new PrismaClient();

const users = [
  {
    id: "a0000000-0000-4000-8000-000000000001",
    name: "Ana Silva",
    handle: "ana_silva",
    email: "ana.silva@ninho.example",
    phone: "+550000000001",
    avatarBg: "#E8F0E6",
  },
  {
    id: "a0000001-0000-4000-8000-000000000002",
    name: "Camila Oliveira",
    handle: "camila_oliveira",
    email: "camila.oliveira@ninho.example",
    phone: "+550000000002",
    avatarBg: "#E9E2FF",
  },
  {
    id: "a0000002-0000-4000-8000-000000000003",
    name: "Lucas Santos",
    handle: "lucas_santos",
    email: "lucas.santos@ninho.example",
    phone: "+550000000003",
    avatarBg: "#E8F0E6",
  },
  {
    id: "a0000003-0000-4000-8000-000000000004",
    name: "Mariana Costa",
    handle: "mariana_costa",
    email: "mariana.costa@ninho.example",
    phone: "+550000000004",
    avatarBg: "#F9E9E4",
  },
] as const;

const posts = [
  {
    author: 0,
    tag: "Conquista",
    text: "Hoje consegui fazer uma caminhada curta depois de dias difíceis. Foi simples, mas me fez bem.",
    replies: ["Que bom, Ana! Cada passo conta.", "Fico feliz por você. Também quero tentar amanhã."],
  },
  {
    author: 1,
    tag: "Apoio",
    text: "Quando a ansiedade aperta, respirar por alguns minutos tem me ajudado a voltar para o presente.",
    replies: ["Obrigado por compartilhar. Vou experimentar isso hoje.", "Essa pausa também costuma me ajudar."],
  },
  {
    author: 2,
    tag: "Desabafo",
    text: "Hoje pedi ajuda em vez de guardar tudo para mim. Deu medo, mas a conversa me trouxe alívio.",
    replies: ["Pedir ajuda exige coragem. Que bom que você conseguiu.", "Você não precisa passar por tudo sozinho."],
  },
  {
    author: 3,
    tag: "Apoio",
    text: "Se o dia foi pesado, descansar também é uma forma de cuidado. Amanhã a gente tenta de novo.",
    replies: ["Eu precisava ler isso hoje. Obrigada!", "É bom lembrar que descanso também importa."],
  },
  {
    author: 0,
    tag: "Ansiedade",
    text: "Estou tentando criar uma rotina de sono. Alguém tem uma dica simples que funcionou para vocês?",
    replies: ["Deixar o celular longe da cama tem me ajudado.", "Um horário parecido para dormir fez diferença para mim."],
  },
  {
    author: 1,
    tag: "Conquista",
    text: "Comecei a anotar três coisas boas do meu dia. Ontem foi difícil, mas consegui encontrar uma.",
    replies: ["Uma já é um ótimo começo!", "Gostei da ideia, vou tentar fazer isso também."],
  },
  {
    author: 2,
    tag: "Ansiedade",
    text: "Como vocês lidam com a cobrança de ter que dar conta de tudo ao mesmo tempo?",
    replies: ["Tento escolher só uma prioridade por vez.", "Conversar sobre isso já ajuda a diminuir o peso."],
  },
  {
    author: 3,
    tag: "Conquista",
    text: "Voltei a fazer algo que eu gosto: cozinhei ouvindo música e me senti mais presente.",
    replies: ["Que momento gostoso, Mariana!", "Essas pequenas pausas fazem bem mesmo."],
  },
] as const;

const demoId = (prefix: string, number: number) =>
  `${prefix}0000000-0000-4000-8000-${String(number).padStart(12, "0")}`;

async function main() {
  const passwordHash = await argon2.hash(randomUUID());
  const now = Date.now();

  await prisma.$transaction(async (tx) => {
    for (const user of users) {
      const existing = await tx.user.findUnique({ where: { id: user.id }, select: { email: true } });
      if (existing && existing.email !== user.email) {
        throw new Error(`O identificador de demonstração ${user.id} já pertence a outra conta.`);
      }
      await tx.user.upsert({
        where: { id: user.id },
        update: {},
        create: {
          id: user.id,
          email: user.email,
          phone: user.phone,
          passwordHash,
          role: UserRole.USER,
          communityName: user.name,
          communityHandle: user.handle,
          avatarBg: user.avatarBg,
        },
      });
    }

    for (const [index, post] of posts.entries()) {
      const postId = demoId("b", index + 1);
      const authorId = users[post.author].id;
      const createdAt = new Date(now - (posts.length - index) * 45 * 60 * 1000);
      await tx.communityPost.upsert({
        where: { id: postId },
        update: {},
        create: { id: postId, authorId, tag: post.tag, text: post.text, createdAt },
      });

      for (let replyIndex = 0; replyIndex < post.replies.length; replyIndex++) {
        const responderId = users[(post.author + replyIndex + 1) % users.length].id;
        await tx.communityComment.upsert({
          where: { id: demoId("c", index * 2 + replyIndex + 1) },
          update: {},
          create: {
            id: demoId("c", index * 2 + replyIndex + 1),
            postId,
            authorId: responderId,
            text: post.replies[replyIndex],
            createdAt: new Date(createdAt.getTime() + (replyIndex + 1) * 5 * 60 * 1000),
          },
        });
      }

      for (let offset = 1; offset < users.length; offset++) {
        const userId = users[(post.author + offset) % users.length].id;
        await tx.communityWelcome.upsert({
          where: { postId_userId: { postId, userId } },
          update: {},
          create: { postId, userId },
        });
      }
    }
  });

  const postIds = posts.map((_, index) => demoId("b", index + 1));
  const [seededUsers, comments, welcomes] = await Promise.all([
    prisma.user.findMany({
      where: { id: { in: users.map((user) => user.id) } },
      select: { communityName: true, posts: { where: { id: { in: postIds } }, select: { id: true } } },
    }),
    prisma.communityComment.count({ where: { postId: { in: postIds } } }),
    prisma.communityWelcome.count({ where: { postId: { in: postIds } } }),
  ]);
  if (
    seededUsers.length !== 4 ||
    seededUsers.some((user) => user.posts.length !== 2) ||
    comments < 16 ||
    welcomes < 24
  ) {
    throw new Error("Os dados de demonstração não passaram na verificação.");
  }
  console.log(`Dados locais prontos: 4 usuários, 8 posts, ${comments} comentários e ${welcomes} acolhimentos.`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
