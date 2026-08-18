import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';

@Injectable()
export class RedisService extends Redis implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(RedisService.name);

  constructor(configService: ConfigService) {
    super(configService.get<string>('queue.redis.url')!, {
      maxRetriesPerRequest: configService.get<number>('queue.redis.maxRetriesPerRequest'),
      retryStrategy: configService.get<Function>('queue.redis.retryStrategy'),
      lazyConnect: true,
    });
  }

  async onModuleInit(): Promise<void> {
    await this.connect();
    this.logger.log('✅ Redis connected');
  }

  async onModuleDestroy(): Promise<void> {
    await this.quit();
    this.logger.log('🔌 Redis disconnected');
  }

  async healthCheck(): Promise<boolean> {
    try {
      const result = await this.ping();
      return result === 'PONG';
    } catch {
      return false;
    }
  }
}