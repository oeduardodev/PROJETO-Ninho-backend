import { Transform, Type } from "class-transformer";
import {
  IsBoolean,
  IsInt,
  IsOptional,
  IsUUID,
  Max,
  Min,
} from "class-validator";
import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";

export type NotificationTypeValue = "welcome" | "comment";

const toBoolean = ({ value }: { value: unknown }): unknown =>
  value === true || value === "true" ? true : value === false || value === "false" ? false : value;

export class NotificationQueryDto {
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

  @ApiPropertyOptional({ description: "Retorna apenas notificações não lidas." })
  @IsOptional()
  @Transform(toBoolean)
  @IsBoolean()
  unreadOnly?: boolean;
}

export class NotificationDto {
  @ApiProperty({ format: "uuid" })
  id!: string;

  @ApiProperty({ enum: ["welcome", "comment"] })
  type!: NotificationTypeValue;

  @ApiProperty()
  message!: string;

  @ApiPropertyOptional({ nullable: true })
  entityType!: string | null;

  @ApiPropertyOptional({ nullable: true })
  entityId!: string | null;

  @ApiPropertyOptional({ nullable: true })
  readAt!: Date | null;

  @ApiProperty()
  createdAt!: Date;
}

export class NotificationPageDto {
  @ApiProperty({ type: [NotificationDto] })
  items!: NotificationDto[];

  @ApiPropertyOptional({ format: "uuid", nullable: true })
  nextCursor!: string | null;
}

export class UnreadCountDto {
  @ApiProperty()
  count!: number;
}
