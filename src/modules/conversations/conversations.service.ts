import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { Conversation, ConversationMessage, Prisma, User, UserRole } from "@prisma/client";
import { PrismaService } from "../../infrastructure/database/prisma/prisma.service";
import { getDefaultProfile } from "../users/domain/default-profile";
import {
  ContactQueryDto,
  ConversationContactDto,
  ConversationDto,
  ConversationMessageDto,
  ConversationPageDto,
  ConversationQueryDto,
  MessagePageDto,
} from "./dto/conversation.dto";

const contactSelect = {
  id: true,
  role: true,
  communityName: true,
  avatarEmoji: true,
  avatarBg: true,
} satisfies Prisma.UserSelect;

type ContactRecord = Pick<User, "id" | "role" | "communityName" | "avatarEmoji" | "avatarBg">;
type ConversationRecord = Conversation & {
  participantA: ContactRecord;
  participantB: ContactRecord;
  messages: ConversationMessage[];
  _count: { messages: number };
};

@Injectable()
export class ConversationsService {
  constructor(private readonly prisma: PrismaService) {}

  async listContacts(userId: string, query: ContactQueryDto): Promise<ConversationContactDto[]> {
    await this.ensureActive(userId);
    const search = query.search?.toLocaleLowerCase("pt-BR");
    const users = await this.prisma.user.findMany({
      where: {
        id: { not: userId },
        isActive: true,
        role: { in: [UserRole.USER, UserRole.PROFESSIONAL] },
        ...(search ? { OR: [
          { communityName: { contains: search, mode: "insensitive" as const } },
          { communityName: null },
        ] } : {}),
      },
      select: contactSelect,
      orderBy: [{ role: "desc" }, { communityName: "asc" }, { id: "asc" }],
      ...(!search ? { take: 100 } : {}),
    });
    const contacts = users.map((user) => this.toContact(user));
    return search
      ? contacts.filter((contact) => contact.name.toLocaleLowerCase("pt-BR").includes(search)).slice(0, 100)
      : contacts;
  }

  async listConversations(userId: string, query: ConversationQueryDto): Promise<ConversationPageDto> {
    await this.ensureActive(userId);
    const where = this.memberWhere(userId);
    if (query.cursor) {
      const cursor = await this.prisma.conversation.findFirst({
        where: { id: query.cursor, ...where },
        select: { id: true },
      });
      if (!cursor) throw new BadRequestException({ code: "INVALID_CURSOR", message: "Cursor inválido" });
    }
    const limit = query.limit ?? 30;
    const conversations = await this.prisma.conversation.findMany({
      where,
      take: limit + 1,
      ...(query.cursor ? { cursor: { id: query.cursor }, skip: 1 } : {}),
      orderBy: [{ updatedAt: "desc" }, { id: "desc" }],
      include: this.conversationInclude(userId),
    });
    const page = conversations.slice(0, limit);
    return {
      items: page.map((conversation) => this.toConversation(conversation, userId)),
      nextCursor: conversations.length > limit ? page[page.length - 1].id : null,
    };
  }

  async startConversation(userId: string, recipientId: string): Promise<ConversationDto> {
    await this.ensureActive(userId);
    if (recipientId === userId) {
      throw new BadRequestException({ code: "SELF_CONVERSATION", message: "Escolha outra pessoa para conversar" });
    }
    const recipient = await this.prisma.user.findFirst({
      where: { id: recipientId, isActive: true, role: { in: [UserRole.USER, UserRole.PROFESSIONAL] } },
      select: { id: true },
    });
    if (!recipient) throw new NotFoundException({ code: "CONTACT_NOT_FOUND", message: "Contato não disponível" });
    const pairKey = [userId, recipientId].sort().join(":");
    const conversation = await this.prisma.conversation.upsert({
      where: { pairKey },
      create: { pairKey, participantAId: userId, participantBId: recipientId },
      update: {},
      include: this.conversationInclude(userId),
    });
    return this.toConversation(conversation, userId);
  }

  async getConversation(userId: string, conversationId: string): Promise<ConversationDto> {
    await this.ensureActive(userId);
    const conversation = await this.prisma.conversation.findFirst({
      where: { id: conversationId, ...this.memberWhere(userId) },
      include: this.conversationInclude(userId),
    });
    if (!conversation) throw this.notFound();
    return this.toConversation(conversation, userId);
  }

  async listMessages(userId: string, conversationId: string, query: ConversationQueryDto): Promise<MessagePageDto> {
    await this.ensureMember(userId, conversationId);
    if (query.cursor) {
      const cursor = await this.prisma.conversationMessage.findFirst({
        where: { id: query.cursor, conversationId },
        select: { id: true },
      });
      if (!cursor) throw new BadRequestException({ code: "INVALID_CURSOR", message: "Cursor de mensagem inválido" });
    }
    const readThrough = new Date();
    const limit = query.limit ?? 30;
    const messages = await this.prisma.conversationMessage.findMany({
      where: { conversationId },
      take: limit + 1,
      ...(query.cursor ? { cursor: { id: query.cursor }, skip: 1 } : {}),
      orderBy: [{ createdAt: "desc" }, { id: "desc" }],
    });
    await this.prisma.conversationMessage.updateMany({
      where: { conversationId, senderId: { not: userId }, readAt: null, createdAt: { lte: readThrough } },
      data: { readAt: readThrough },
    });
    const page = messages.slice(0, limit);
    return {
      items: page.reverse().map((message) => this.toMessage({
        ...message,
        readAt: message.senderId === userId ? message.readAt : message.readAt ?? readThrough,
      })),
      nextCursor: messages.length > limit ? page[0].id : null,
    };
  }

  async sendMessage(userId: string, conversationId: string, text: string): Promise<ConversationMessageDto> {
    const conversation = await this.ensureMember(userId, conversationId);
    const recipientId = conversation.participantAId === userId
      ? conversation.participantBId : conversation.participantAId;
    await this.ensureActive(recipientId);
    const [message] = await this.prisma.$transaction([
      this.prisma.conversationMessage.create({ data: { conversationId, senderId: userId, text } }),
      this.prisma.conversation.update({ where: { id: conversationId }, data: { updatedAt: new Date() } }),
    ]);
    return this.toMessage(message);
  }

  private conversationInclude(userId: string) {
    return {
      participantA: { select: contactSelect },
      participantB: { select: contactSelect },
      messages: { take: 1, orderBy: [{ createdAt: "desc" as const }, { id: "desc" as const }] },
      _count: { select: { messages: { where: { senderId: { not: userId }, readAt: null } } } },
    } satisfies Prisma.ConversationInclude;
  }

  private memberWhere(userId: string) {
    return { OR: [{ participantAId: userId }, { participantBId: userId }] };
  }

  private toContact(user: ContactRecord): ConversationContactDto {
    const fallback = getDefaultProfile(user.id);
    const professional = user.role === UserRole.PROFESSIONAL;
    return {
      id: user.id,
      name: user.communityName ?? fallback.name,
      role: professional ? "professional" : "user",
      avatarEmoji: user.avatarEmoji ?? (user.communityName ? (professional ? "🌿" : "🙂") : ""),
      avatarBg: user.avatarBg ?? (professional ? "#E9E2FF" : "#E8F0E6"),
    };
  }

  private toConversation(conversation: ConversationRecord, userId: string): ConversationDto {
    return {
      id: conversation.id,
      contact: this.toContact(conversation.participantAId === userId ? conversation.participantB : conversation.participantA),
      lastMessage: conversation.messages[0] ? this.toMessage(conversation.messages[0]) : null,
      unreadCount: conversation._count.messages,
      createdAt: conversation.createdAt,
      updatedAt: conversation.updatedAt,
    };
  }

  private toMessage(message: ConversationMessage): ConversationMessageDto {
    return {
      id: message.id,
      conversationId: message.conversationId,
      senderId: message.senderId,
      text: message.text,
      createdAt: message.createdAt,
      readAt: message.readAt,
    };
  }

  private async ensureActive(userId: string): Promise<void> {
    const user = await this.prisma.user.findUnique({ where: { id: userId }, select: { isActive: true } });
    if (!user?.isActive) throw new ForbiddenException({ code: "USER_INACTIVE", message: "Conta não disponível" });
  }

  private async ensureMember(userId: string, conversationId: string): Promise<Conversation> {
    await this.ensureActive(userId);
    const conversation = await this.prisma.conversation.findFirst({
      where: { id: conversationId, ...this.memberWhere(userId) },
    });
    if (!conversation) throw this.notFound();
    return conversation;
  }

  private notFound(): NotFoundException {
    return new NotFoundException({ code: "CONVERSATION_NOT_FOUND", message: "Conversa não encontrada" });
  }
}
