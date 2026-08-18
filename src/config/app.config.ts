import { registerAs } from '@nestjs/config';
import { EnvConfig } from './env.validation';

export default registerAs('app', (): EnvConfig['APP_ENV'] => {
  return process.env.APP_ENV as EnvConfig['APP_ENV'];
});