import {
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Post,
  Query,
} from "@nestjs/common";
import {
  ApiBearerAuth,
  ApiNoContentResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from "@nestjs/swagger";

import { CurrentUser } from "../../common/decorators/current-user.decorator";
import { NotificationsService } from "./notifications.service";
import {
  NotificationDto,
  NotificationPageDto,
  NotificationQueryDto,
  UnreadCountDto,
} from "./dto/notification.dto";

@ApiTags("Notifications")
@ApiBearerAuth()
@Controller("notifications")
export class NotificationsController {
  constructor(private readonly notifications: NotificationsService) {}

  @Get()
  @ApiOperation({ summary: "Listar minhas notificações" })
  @ApiOkResponse({ type: NotificationPageDto })
  list(
    @CurrentUser("sub") userId: string,
    @Query() query: NotificationQueryDto,
  ): Promise<NotificationPageDto> {
    return this.notifications.list(userId, query);
  }

  @Get("unread-count")
  @ApiOperation({ summary: "Contar notificações não lidas" })
  @ApiOkResponse({ type: UnreadCountDto })
  unreadCount(@CurrentUser("sub") userId: string): Promise<UnreadCountDto> {
    return this.notifications.unreadCount(userId);
  }

  @Post("read-all")
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: "Marcar todas as notificações como lidas" })
  @ApiNoContentResponse()
  async markAllRead(@CurrentUser("sub") userId: string): Promise<void> {
    await this.notifications.markAllRead(userId);
  }

  @Post(":notificationId/read")
  @ApiOperation({ summary: "Marcar uma notificação como lida" })
  @ApiOkResponse({ type: NotificationDto })
  markRead(
    @CurrentUser("sub") userId: string,
    @Param("notificationId", ParseUUIDPipe) notificationId: string,
  ): Promise<NotificationDto> {
    return this.notifications.markRead(userId, notificationId);
  }
}
