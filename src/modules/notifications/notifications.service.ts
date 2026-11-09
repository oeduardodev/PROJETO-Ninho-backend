import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { Notification, NotificationType } from "@prisma/client";

import { PrismaService } from "../../infrastructure/database/prisma/prisma.service";
import {
  NotificationDto,
  NotificationPageDto,
  NotificationQueryDto,
  UnreadCountDto,
} from "./dto/notification.dto";

@Injectable()
export class NotificationsService {
  constructor(private readonly prisma: PrismaService) {}

  async notifyWelcome(input: {
    recipientId: string;
    actorId: string;
    actorName: string;
    postId: string;
  }): Promise<void> {
    await this.create({
      recipientId: input.recipientId,
      actorId: input.actorId,
      type: NotificationType.WELCOME,
      message: `${input.actorName} acolheu sua publicação`,
      entityType: "post",
      entityId: input.postId,
    });
  }

  async notifyComment(input: {
    recipientId: string;
    actorId: string;
    actorName: string;
    postId: string;
    commentId: string;
  }): Promise<void> {
    await this.create({
      recipientId: input.recipientId,
      actorId: input.actorId,
      type: NotificationType.COMMENT,
      message: `${input.actorName} respondeu sua publicação`,
      entityType: "comment",
      entityId: input.commentId,
    });
  }

  async list(
    userId: string,
    query: NotificationQueryDto,
  ): Promise<NotificationPageDto> {
    await this.ensureActive(userId);
    if (query.cursor) {
      const cursor = await this.prisma.notification.findFirst({
        where: { id: query.cursor, userId },
        select: { id: true },
      });
      if (!cursor) {
        throw new BadRequestException({
          code: "INVALID_CURSOR",
          message: "Cursor inválido",
        });
      }
    }
    const limit = query.limit ?? 20;
    const where = {
      userId,
      ...(query.unreadOnly ? { readAt: null } : {}),
    };
    const notifications = await this.prisma.notification.findMany({
      where,
      take: limit + 1,
      ...(query.cursor ? { cursor: { id: query.cursor }, skip: 1 } : {}),
      orderBy: [{ createdAt: "desc" }, { id: "desc" }],
    });
    const page = notifications.slice(0, limit);
    return {
      items: page.map((notification) => this.toNotification(notification)),
      nextCursor: notifications.length > limit ? page[page.length - 1].id : null,
    };
  }

  async unreadCount(userId: string): Promise<UnreadCountDto> {
    await this.ensureActive(userId);
    const count = await this.prisma.notification.count({
      where: { userId, readAt: null },
    });
    return { count };
  }

  async markRead(userId: string, notificationId: string): Promise<NotificationDto> {
    await this.ensureActive(userId);
    const notification = await this.prisma.notification.findFirst({
      where: { id: notificationId, userId },
    });
    if (!notification) {
      throw new NotFoundException({
        code: "NOTIFICATION_NOT_FOUND",
        message: "Notificação não encontrada",
      });
    }
    const updated = notification.readAt
      ? notification
      : await this.prisma.notification.update({
          where: { id: notificationId },
          data: { readAt: new Date() },
        });
    return this.toNotification(updated);
  }

  async markAllRead(userId: string): Promise<void> {
    await this.ensureActive(userId);
    await this.prisma.notification.updateMany({
      where: { userId, readAt: null },
      data: { readAt: new Date() },
    });
  }

  private async create(input: {
    recipientId: string;
    actorId: string;
    type: NotificationType;
    message: string;
    entityType: string;
    entityId: string;
  }): Promise<void> {
    if (input.recipientId === input.actorId) return;

    await this.prisma.notification.create({
      data: {
        userId: input.recipientId,
        actorId: input.actorId,
        type: input.type,
        message: input.message,
        entityType: input.entityType,
        entityId: input.entityId,
      },
    });
  }

  private toNotification(notification: Notification): NotificationDto {
    return {
      id: notification.id,
      type: notification.type.toLowerCase() as NotificationDto["type"],
      message: notification.message,
      entityType: notification.entityType,
      entityId: notification.entityId,
      readAt: notification.readAt,
      createdAt: notification.createdAt,
    };
  }

  private async ensureActive(userId: string): Promise<void> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { isActive: true },
    });
    if (!user?.isActive) {
      throw new ForbiddenException({
        code: "USER_INACTIVE",
        message: "Conta não disponível",
      });
    }
  }
}
