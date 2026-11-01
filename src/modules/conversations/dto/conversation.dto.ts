import { Transform, Type } from "class-transformer";
import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { IsInt, IsOptional, IsString, IsUUID, Max, MaxLength, Min, MinLength } from "class-validator";

const trim = ({ value }: { value: unknown }): unknown =>
  typeof value === "string" ? value.trim() : value;

export class ConversationQueryDto {
  @ApiPropertyOptional({ format: "uuid" })
  @IsOptional()
  @IsUUID()
  cursor?: string;

  @ApiPropertyOptional({ default: 30, minimum: 1, maximum: 50 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(50)
  limit?: number = 30;
}

export class ContactQueryDto {
  @ApiPropertyOptional({ maxLength: 60 })
  @IsOptional()
  @Transform(trim)
  @IsString()
  @MaxLength(60)
  search?: string;
}

export class StartConversationDto {
  @ApiProperty({ format: "uuid" })
  @IsUUID()
  recipientId!: string;
}

export class SendMessageDto {
  @ApiProperty({ maxLength: 2000 })
  @Transform(trim)
  @IsString()
  @MinLength(1)
  @MaxLength(2000)
  text!: string;
}

export class ConversationContactDto {
  @ApiProperty({ format: "uuid" })
  id!: string;

  @ApiProperty()
  name!: string;

  @ApiProperty({ enum: ["professional", "user"] })
  role!: "professional" | "user";

  @ApiProperty()
  avatarEmoji!: string;

  @ApiProperty()
  avatarBg!: string;
}

export class ConversationMessageDto {
  @ApiProperty({ format: "uuid" })
  id!: string;

  @ApiProperty({ format: "uuid" })
  conversationId!: string;

  @ApiProperty({ format: "uuid" })
  senderId!: string;

  @ApiProperty()
  text!: string;

  @ApiProperty()
  createdAt!: Date;

  @ApiPropertyOptional({ nullable: true })
  readAt!: Date | null;
}

export class ConversationDto {
  @ApiProperty({ format: "uuid" })
  id!: string;

  @ApiProperty({ type: ConversationContactDto })
  contact!: ConversationContactDto;

  @ApiPropertyOptional({ type: ConversationMessageDto, nullable: true })
  lastMessage!: ConversationMessageDto | null;

  @ApiProperty()
  unreadCount!: number;

  @ApiProperty()
  createdAt!: Date;

  @ApiProperty()
  updatedAt!: Date;
}

export class ConversationPageDto {
  @ApiProperty({ type: [ConversationDto] })
  items!: ConversationDto[];

  @ApiPropertyOptional({ format: "uuid", nullable: true })
  nextCursor!: string | null;
}

export class MessagePageDto {
  @ApiProperty({ type: [ConversationMessageDto] })
  items!: ConversationMessageDto[];

  @ApiPropertyOptional({ format: "uuid", nullable: true })
  nextCursor!: string | null;
}
