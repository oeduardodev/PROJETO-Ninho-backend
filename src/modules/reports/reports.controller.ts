import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Query,
} from "@nestjs/common";
import {
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from "@nestjs/swagger";
import { Throttle } from "@nestjs/throttler";

import { CurrentUser } from "../../common/decorators/current-user.decorator";
import { ReportsService } from "./reports.service";
import {
  CreateReportDto,
  ReportDto,
  ReportPageDto,
  ReportQueryDto,
} from "./dto/report.dto";

@ApiTags("Reports")
@ApiBearerAuth()
@Controller("reports")
export class ReportsController {
  constructor(private readonly reports: ReportsService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @Throttle({ default: { limit: 10, ttl: 60 * 60 * 1000 } })
  @ApiOperation({
    summary: "Registrar um relato de problema",
    description:
      "Categorias: content (conteúdo inadequado), user (comportamento abusivo) e app_error (falha técnica). A identidade do denunciante é preservada sempre que possível.",
  })
  @ApiCreatedResponse({ type: ReportDto })
  create(
    @CurrentUser("sub") userId: string,
    @Body() input: CreateReportDto,
  ): Promise<ReportDto> {
    return this.reports.create(userId, input);
  }

  @Get("me")
  @ApiOperation({ summary: "Listar meus relatos e seus status" })
  @ApiOkResponse({ type: ReportPageDto })
  listMine(
    @CurrentUser("sub") userId: string,
    @Query() query: ReportQueryDto,
  ): Promise<ReportPageDto> {
    return this.reports.listMine(userId, query);
  }
}
