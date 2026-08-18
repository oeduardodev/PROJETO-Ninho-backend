import { registerAs } from '@nestjs/config';

export default registerAs('queue', () => ({
  redis: {
    url: process.env.REDIS_URL!,
    maxRetriesPerRequest: 3,
    retryStrategy: (times: number) => Math.min(times * 100, 3000),
  },
  defaultJobOptions: {
    removeOnComplete: 100,
    removeOnFail: 50,
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 1000,
    },
  },
  queues: {
    notifications: { concurrency: 10 },
    uploads: { concurrency: 5 },
    moderation: { concurrency: 3 },
    privacy: { concurrency: 2 },
    maintenance: { concurrency: 1 },
  },
}));