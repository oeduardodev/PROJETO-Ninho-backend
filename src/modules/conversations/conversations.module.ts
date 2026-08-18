import { Module } from '@nestjs/common';
import { ConversationsController } from './presentation/controllers/conversations.controller';
import { ConversationsGateway } from './presentation/gateways/conversations.gateway';
import { ConversationsService } from './application/conversations.service';
import { ConversationRepository } from './domain/ports/conversation.repository';
import { PrismaConversationRepository } from './infrastructure/persistence/prisma-conversation.repository';
import { MessageRepository } from './domain/ports/message.repository';
import { PrismaMessageRepository } from './infrastructure/persistence/prisma-message.repository';
import { CacheModule } from '../../infrastructure/cache/redis/cache.module';
import { QueueModule } from '../../infrastructure/queue/bullmq/queue.module';

@Module({
  imports: [CacheModule, QueueModule],
  controllers: [ConversationsController],
  providers: [
    ConversationsService,
    ConversationsGateway,
    { provide: ConversationRepository, useClass: PrismaConversationRepository },
    { provide: MessageRepository, useClass: PrismaMessageRepository },
  ],
  exports: [ConversationsService, ConversationRepository, MessageRepository],
})
export class ConversationsModule {}