import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import pino, { Logger as PinoLogger, Level } from 'pino';
import pinoPretty from 'pino-pretty';

@Injectable()
export class TelemetryService implements OnModuleInit {
  private logger: PinoLogger;
  private readonly nestLogger = new Logger(TelemetryService.name);

  constructor(private configService: ConfigService) {}

  onModuleInit(): void {
    const logLevel = this.configService.get<Level>('LOG_LEVEL') || 'info';
    const isProduction = this.configService.get<string>('APP_ENV') === 'production';

    if (isProduction) {
      this.logger = pino({ level: logLevel });
    } else {
      this.logger = pino(
        { level: logLevel },
        pinoPretty({
          colorize: true,
          translateTime: 'SYS:standard',
          ignore: 'pid,hostname',
        }),
      );
    }

    this.nestLogger.log('✅ Telemetry initialized');
  }

  getLogger(): PinoLogger {
    return this.logger;
  }

  child(bindings: Record<string, unknown>): PinoLogger {
    return this.logger.child(bindings);
  }
}

export const telemetryService = new TelemetryService(new ConfigService());
export const logger = telemetryService.getLogger();