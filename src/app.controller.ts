import { Controller, Get } from "@nestjs/common";
import { ApiOperation, ApiTags } from "@nestjs/swagger";
import { Public } from "./common/decorators/public.decorator";

@ApiTags("System")
@Controller()
export class AppController {
  @Get()
  @Public()
  @ApiOperation({ summary: "Get API information" })
  getInfo() {
    return {
      name: "Ninho API",
      version: "1.0.0",
      status: "running",
    };
  }

  @Get("health")
  @Public()
  @ApiOperation({ summary: "Check API health" })
  getHealth() {
    return {
      status: "ok",
      uptime: process.uptime(),
    };
  }
}
