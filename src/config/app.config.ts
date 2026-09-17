import { registerAs } from "@nestjs/config";
import { EnvConfig } from "./env.validation";

export default registerAs("app", () => ({
  env: (process.env.APP_ENV || "local") as EnvConfig["APP_ENV"],
  port: Number(process.env.APP_PORT || 3000),
  apiPrefix: process.env.API_PREFIX || "/api",
  apiVersion: process.env.API_VERSION || "v1",
  corsOrigin:
    process.env.CORS_ORIGIN || "http://localhost:8081,http://localhost:19006",
}));
