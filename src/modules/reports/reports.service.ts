import {
  BadRequestException,
  ForbiddenException,
  Injectable,
} from "@nestjs/common";
import {
  ReportCategory,
  Report as PrismaReport,
} from "@prisma/client";

import { PrismaService } from "../../infrastructure/database/prisma/prisma.service";
import {
  CreateReportDto,
  ReportDto,
  ReportPageDto,
  ReportQueryDto,
} from "./dto/report.dto";

const categoryMap: Record<string, ReportCategory> = {
  content: ReportCategory.CONTENT,
  user: ReportCategory.USER,
  app_error: ReportCategory.APP_ERROR,
};

@Injectable()
export class ReportsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(userId: string, input: CreateReportDto): Promise<ReportDto> {
    await this.ensureActive(userId);
    const report = await this.prisma.report.create({
      data: {
        reporterId: userId,
        category: categoryMap[input.category],
        description: input.description,
        targetType: input.targetType ?? null,
        targetId: input.targetId ?? null,
        imageUrl: input.imageUrl ?? null,
      },
    });
    return this.toReport(report);
  }

  async listMine(userId: string, query: ReportQueryDto): Promise<ReportPageDto> {
    await this.ensureActive(userId);
    if (query.cursor) {
      const cursor = await this.prisma.report.findFirst({
        where: { id: query.cursor, reporterId: userId },
        select: { id: true },
      });
      if (!cursor) {
        throw new BadRequestException({
          code: "INVALID_CURSOR",
          message: "Cursor inválido",
        });
      }
    }
    const limit = query.limit ?? 20;
    const reports = await this.prisma.report.findMany({
      where: { reporterId: userId },
      take: limit + 1,
      ...(query.cursor ? { cursor: { id: query.cursor }, skip: 1 } : {}),
      orderBy: [{ createdAt: "desc" }, { id: "desc" }],
    });
    const page = reports.slice(0, limit);
    return {
      items: page.map((report) => this.toReport(report)),
      nextCursor: reports.length > limit ? page[page.length - 1].id : null,
    };
  }

  private toReport(report: PrismaReport): ReportDto {
    return {
      id: report.id,
      category: report.category.toLowerCase() as ReportDto["category"],
      description: report.description,
      targetType: report.targetType,
      targetId: report.targetId,
      imageUrl: report.imageUrl,
      status: report.status.toLowerCase() as ReportDto["status"],
      createdAt: report.createdAt,
      updatedAt: report.updatedAt,
    };
  }

  private async ensureActive(userId: string): Promise<void> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { isActive: true },
    });
    if (!user?.isActive) {
      throw new ForbiddenException({
        code: "USER_INACTIVE",
        message: "Conta não disponível",
      });
    }
  }
}
