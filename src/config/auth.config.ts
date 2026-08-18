import { registerAs } from '@nestjs/config';

export default registerAs('auth', () => ({
  jwt: {
    accessSecret: process.env.JWT_ACCESS_SECRET!,
    accessExpiresIn: process.env.JWT_ACCESS_EXPIRES_IN!,
    refreshSecret: process.env.JWT_REFRESH_SECRET!,
    refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN!,
  },
  bcrypt: {
    rounds: 12,
  },
  argon2: {
    memoryCost: 2 ** 16,
    timeCost: 3,
    parallelism: 1,
  },
  session: {
    maxAge: 7 * 24 * 60 * 60 * 1000,
    cleanupInterval: 60 * 60 * 1000,
  },
  mfa: {
    issuer: 'Ninho',
    window: 1,
  },
  rateLimit: {
    login: { max: 5, windowMs: 15 * 60 * 1000 },
    register: { max: 3, windowMs: 60 * 60 * 1000 },
    passwordReset: { max: 2, windowMs: 60 * 60 * 1000 },
    mfa: { max: 5, windowMs: 5 * 60 * 1000 },
  },
}));