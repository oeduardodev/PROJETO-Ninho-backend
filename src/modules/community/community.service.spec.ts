import { ForbiddenException } from "@nestjs/common";
import { PrismaService } from "../../infrastructure/database/prisma/prisma.service";
import { CommunityService } from "./community.service";

const userId = "4d34f224-bf4a-41c5-9de1-7497cab1f1fd";
const anotherUserId = "8d1e67d0-2491-44c5-a331-5bce0c39bd25";
const postId = "c06b6fab-bfd7-4f84-a37f-a312840339b8";

describe("CommunityService", () => {
  const prisma = {
    user: { findUnique: jest.fn() },
    communityPost: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      deleteMany: jest.fn(),
    },
    communityWelcome: {
      findUnique: jest.fn(),
      upsert: jest.fn(),
      deleteMany: jest.fn(),
      count: jest.fn(),
    },
  };
  const notifications = {
    notifyWelcome: jest.fn(),
    notifyComment: jest.fn(),
  };
  let service: CommunityService;

  beforeEach(() => {
    jest.resetAllMocks();
    prisma.user.findUnique.mockResolvedValue({ isActive: true });
    prisma.communityWelcome.findUnique.mockResolvedValue(null);
    service = new CommunityService(
      prisma as unknown as PrismaService,
      notifications as never,
    );
  });

  it("não expõe e-mail ou telefone no feed e retorna contagens reais", async () => {
    prisma.communityPost.findMany.mockResolvedValue([
      {
        id: postId,
        author: {
          id: anotherUserId,
          communityName: null,
          communityHandle: null,
          avatarEmoji: null,
          avatarBg: null,
          email: "private@example.com",
          phone: "+5511999999999",
        },
        tag: "Ansiedade",
        text: "Hoje consegui sair para caminhar.",
        createdAt: new Date("2026-09-26T10:00:00Z"),
        updatedAt: new Date("2026-09-26T10:00:00Z"),
        _count: { welcomes: 3, comments: 2 },
        welcomes: [{ userId }],
      },
    ]);

    const page = await service.listPosts(userId, { filter: "para", limit: 20 });

    expect(page.items[0]).toMatchObject({
      id: postId,
      welcomeCount: 3,
      commentCount: 2,
      welcomedByMe: true,
      author: { name: "Ana Silva", handle: "@ana_silva_50112", avatarEmoji: "" },
    });
    expect(JSON.stringify(page)).not.toContain("private@example.com");
    expect(JSON.stringify(page)).not.toContain("+5511999999999");
    expect(prisma.communityPost.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        orderBy: [
          { welcomes: { _count: "desc" } },
          { createdAt: "desc" },
          { id: "desc" },
        ],
      }),
    );
  });

  it("impede excluir publicação de outra pessoa", async () => {
    prisma.communityPost.findUnique.mockResolvedValue({
      authorId: anotherUserId,
    });

    await expect(service.deletePost(userId, postId)).rejects.toBeInstanceOf(
      ForbiddenException,
    );
    expect(prisma.communityPost.deleteMany).not.toHaveBeenCalled();
  });

  it("usa operação idempotente ao acolher a publicação", async () => {
    prisma.communityPost.findUnique.mockResolvedValue({
      authorId: anotherUserId,
    });
    prisma.communityWelcome.count.mockResolvedValue(4);

    const result = await service.setWelcome(userId, postId, true);

    expect(prisma.communityWelcome.upsert).toHaveBeenCalledWith({
      where: { postId_userId: { postId, userId } },
      update: {},
      create: { postId, userId },
    });
    expect(result).toEqual({ welcomeCount: 4, welcomedByMe: true });
  });

  it("bloqueia o acesso de conta desativada", async () => {
    prisma.user.findUnique.mockResolvedValue({ isActive: false });

    await expect(service.listPosts(userId, {})).rejects.toBeInstanceOf(
      ForbiddenException,
    );
    expect(prisma.communityPost.findMany).not.toHaveBeenCalled();
  });
});
