import { registerAs } from '@nestjs/config';

export default registerAs('database', () => ({
  url: process.env.DATABASE_URL!,
  logging: process.env.APP_ENV === 'local',
  pool: {
    min: 2,
    max: 10,
  },
  migrations: {
    path: 'prisma/migrations',
    tableName: '_prisma_migrations',
  },
  seed: {
    enabled: process.env.APP_ENV !== 'production',
  },
}));