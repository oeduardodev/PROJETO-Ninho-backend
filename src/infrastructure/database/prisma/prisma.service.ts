import {
  Injectable,
  OnModuleInit,
  OnModuleDestroy,
  Logger,
} from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(PrismaService.name);

  constructor(configService: ConfigService) {
    super({
      datasources: {
        db: {
          url: configService.get<string>('database.url'),
        },
      },
      log: configService.get<boolean>('database.logging')
        ? ['query', 'info', 'warn', 'error']
        : ['error'],
    });
  }

  async onModuleInit(): Promise<void> {
    await this.$connect();
    this.logger.log('✅ Database connected');
  }

  async onModuleDestroy(): Promise<void> {
    await this.$disconnect();
    this.logger.log('🔌 Database disconnected');
  }

  async cleanDatabase(): Promise<void> {
    if (process.env.APP_ENV === 'production') {
      throw new Error('Cannot clean database in production');
    }

    const models = Reflect.ownKeys(this).filter(
      (key) => typeof key === 'string' && !key.startsWith('_') && !key.startsWith('$'),
    ) as string[];

    for (const model of models) {
      const delegate = (this as Record<string, unknown>)[model];
      if (delegate && typeof delegate === 'object' && 'deleteMany' in delegate) {
        try {
          await (delegate as { deleteMany: () => Promise<unknown> }).deleteMany();
        } catch {
          // Ignore errors for non-model properties
        }
      }
    }
  }

  async transaction<T>(fn: (prisma: PrismaClient) => Promise<T>): Promise<T> {
    return this.$transaction(fn);
  }
}