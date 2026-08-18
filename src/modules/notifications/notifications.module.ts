import { Module } from '@nestjs/common';
import { NotificationsController } from './presentation/controllers/notifications.controller';
import { NotificationsService } from './application/notifications.service';
import { NotificationRepository } from './domain/ports/notification.repository';
import { PrismaNotificationRepository } from './infrastructure/persistence/prisma-notification.repository';
import { QueueModule } from '../../infrastructure/queue/bullmq/queue.module';
import { MailModule } from '../../infrastructure/mail/mail.module';
import { PushModule } from '../../infrastructure/push/push.module';

@Module({
  imports: [QueueModule, MailModule, PushModule],
  controllers: [NotificationsController],
  providers: [
    NotificationsService,
    { provide: NotificationRepository, useClass: PrismaNotificationRepository },
  ],
  exports: [NotificationsService, NotificationRepository],
})
export class NotificationsModule {}