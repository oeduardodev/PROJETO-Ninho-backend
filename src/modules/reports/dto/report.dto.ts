import { Transform, Type } from "class-transformer";
import {
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  IsUrl,
  IsUUID,
  Max,
  MaxLength,
  Min,
  MinLength,
} from "class-validator";
import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";

const trim = ({ value }: { value: unknown }): unknown =>
  typeof value === "string" ? value.trim() : value;

export type ReportCategoryValue = "content" | "user" | "app_error";
export type ReportStatusValue = "pending" | "reviewing" | "resolved" | "dismissed";

export class CreateReportDto {
  @ApiProperty({
    enum: ["content", "user", "app_error"],
    description:
      "content: publicações/comentários/mensagens; user: comportamento abusivo; app_error: falha técnica.",
  })
  @IsIn(["content", "user", "app_error"])
  category!: ReportCategoryValue;

  @ApiProperty({ example: "Esta mensagem contém ofensas pessoais." })
  @Transform(trim)
  @IsString()
  @MinLength(10)
  @MaxLength(2000)
  description!: string;

  @ApiPropertyOptional({
    enum: ["post", "comment", "message", "user"],
    description: "Tipo do conteúdo denunciado, quando aplicável.",
  })
  @IsOptional()
  @IsIn(["post", "comment", "message", "user"])
  targetType?: "post" | "comment" | "message" | "user";

  @ApiPropertyOptional({ description: "Identificador do alvo da denúncia." })
  @IsOptional()
  @Transform(trim)
  @IsString()
  @MaxLength(64)
  targetId?: string;

  @ApiPropertyOptional({
    description:
      "URL de uma imagem que ajude a ilustrar o problema. O upload de arquivos será tratado em uma etapa futura.",
  })
  @IsOptional()
  @Transform(trim)
  @IsUrl()
  @MaxLength(500)
  imageUrl?: string;
}

export class ReportQueryDto {
  @ApiPropertyOptional({ format: "uuid" })
  @IsOptional()
  @IsUUID()
  cursor?: string;

  @ApiPropertyOptional({ default: 20, minimum: 1, maximum: 50 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(50)
  limit?: number = 20;
}

export class ReportDto {
  @ApiProperty({ format: "uuid" })
  id!: string;

  @ApiProperty({ enum: ["content", "user", "app_error"] })
  category!: ReportCategoryValue;

  @ApiProperty()
  description!: string;

  @ApiPropertyOptional({ nullable: true })
  targetType!: string | null;

  @ApiPropertyOptional({ nullable: true })
  targetId!: string | null;

  @ApiPropertyOptional({ nullable: true })
  imageUrl!: string | null;

  @ApiProperty({
    enum: ["pending", "reviewing", "resolved", "dismissed"],
  })
  status!: ReportStatusValue;

  @ApiProperty()
  createdAt!: Date;

  @ApiProperty()
  updatedAt!: Date;
}

export class ReportPageDto {
  @ApiProperty({ type: [ReportDto] })
  items!: ReportDto[];

  @ApiPropertyOptional({ format: "uuid", nullable: true })
  nextCursor!: string | null;
}
