import { Injectable, Logger, OnModuleInit } from "@nestjs/common";
import { Logger as PinoLogger } from "pino";
import { logger } from "./logger";

@Injectable()
export class TelemetryService implements OnModuleInit {
  private readonly nestLogger = new Logger(TelemetryService.name);

  onModuleInit(): void {
    this.nestLogger.log("Telemetry initialized");
  }

  getLogger(): PinoLogger {
    return logger;
  }

  child(bindings: Record<string, unknown>): PinoLogger {
    return logger.child(bindings);
  }
}
