import { Global, Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { ConfigService } from '@nestjs/config';
import { QueueService } from './queue.service';

@Global()
@Module({
  imports: [
    BullModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        connection: {
          url: configService.get<string>('queue.redis.url')!,
          maxRetriesPerRequest: configService.get<number>('queue.redis.maxRetriesPerRequest'),
        },
        defaultJobOptions: configService.get('queue.defaultJobOptions'),
      }),
    }),
    BullModule.registerQueue(
      { name: 'notifications' },
      { name: 'uploads' },
      { name: 'moderation' },
      { name: 'privacy' },
      { name: 'maintenance' },
    ),
  ],
  providers: [QueueService],
  exports: [QueueService, BullModule],
})
export class QueueModule {}