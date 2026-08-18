import { Injectable, Logger } from '@nestjs/common';
import { RedisService } from './redis.service';

@Injectable()
export class CacheService {
  private readonly logger = new Logger(CacheService.name);

  constructor(private redis: RedisService) {}

  async get<T>(key: string): Promise<T | null> {
    try {
      const value = await this.redis.get(key);
      return value ? JSON.parse(value) : null;
    } catch (error) {
      this.logger.error({ key, error }, 'Cache get error');
      return null;
    }
  }

  async set(key: string, value: unknown, ttlSeconds: number): Promise<void> {
    try {
      await this.redis.setex(key, ttlSeconds, JSON.stringify(value));
    } catch (error) {
      this.logger.error({ key, error }, 'Cache set error');
    }
  }

  async del(key: string): Promise<void> {
    try {
      await this.redis.del(key);
    } catch (error) {
      this.logger.error({ key, error }, 'Cache del error');
    }
  }

  async delPattern(pattern: string): Promise<void> {
    try {
      const keys = await this.redis.keys(pattern);
      if (keys.length > 0) {
        await this.redis.del(...keys);
      }
    } catch (error) {
      this.logger.error({ pattern, error }, 'Cache delPattern error');
    }
  }

  async exists(key: string): Promise<boolean> {
    try {
      return (await this.redis.exists(key)) === 1;
    } catch {
      return false;
    }
  }

  async increment(key: string, ttlSeconds?: number): Promise<number> {
    try {
      const count = await this.redis.incr(key);
      if (ttlSeconds && count === 1) {
        await this.redis.expire(key, ttlSeconds);
      }
      return count;
    } catch (error) {
      this.logger.error({ key, error }, 'Cache increment error');
      return 0;
    }
  }

  async getSet<T>(key: string, factory: () => Promise<T>, ttlSeconds: number): Promise<T> {
    const cached = await this.get<T>(key);
    if (cached !== null) {
      return cached;
    }

    const value = await factory();
    await this.set(key, value, ttlSeconds);
    return value;
  }
}