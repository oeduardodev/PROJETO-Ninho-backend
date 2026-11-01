import { BadRequestException, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../../infrastructure/database/prisma/prisma.service";
import { ConversationsService } from "./conversations.service";

describe("ConversationsService", () => {
  const userId = "00000000-0000-0000-0000-000000000001";
  const conversationId = "00000000-0000-0000-0000-000000000002";
  const prisma = {
    user: { findUnique: jest.fn(), findMany: jest.fn() },
    conversation: { findFirst: jest.fn() },
    conversationMessage: { findMany: jest.fn(), create: jest.fn() },
  };
  const service = new ConversationsService(prisma as unknown as PrismaService);

  beforeEach(() => {
    jest.clearAllMocks();
    prisma.user.findUnique.mockResolvedValue({ isActive: true });
    prisma.user.findMany.mockResolvedValue([]);
    prisma.conversation.findFirst.mockResolvedValue(null);
  });

  it("does not reveal a conversation to someone outside it", async () => {
    await expect(service.getConversation(userId, conversationId)).rejects.toBeInstanceOf(NotFoundException);
    expect(prisma.conversation.findFirst).toHaveBeenCalledWith(expect.objectContaining({
      where: {
        id: conversationId,
        OR: [{ participantAId: userId }, { participantBId: userId }],
      },
    }));
  });

  it("does not list or send messages for someone outside the conversation", async () => {
    await expect(service.listMessages(userId, conversationId, {})).rejects.toBeInstanceOf(NotFoundException);
    await expect(service.sendMessage(userId, conversationId, "Olá")).rejects.toBeInstanceOf(NotFoundException);
    expect(prisma.conversationMessage.findMany).not.toHaveBeenCalled();
    expect(prisma.conversationMessage.create).not.toHaveBeenCalled();
  });

  it("rejects a conversation with oneself", async () => {
    await expect(service.startConversation(userId, userId)).rejects.toBeInstanceOf(BadRequestException);
  });

  it("finds contacts by their default display name", async () => {
    prisma.user.findMany.mockResolvedValue([
      { id: "8d1e67d0-2491-44c5-a331-5bce0c39bd25", role: "USER", communityName: null, avatarEmoji: null, avatarBg: null },
      { id: "8d1e67d1-2491-44c5-a331-5bce0c39bd25", role: "USER", communityName: null, avatarEmoji: null, avatarBg: null },
    ]);

    const contacts = await service.listContacts(userId, { search: "Ana" });

    expect(contacts).toMatchObject([{ name: "Ana Silva", avatarEmoji: "" }]);
  });
});
