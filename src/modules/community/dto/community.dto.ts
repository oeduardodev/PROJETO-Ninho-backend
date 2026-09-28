import { Transform, Type } from "class-transformer";
import {
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  Matches,
  Max,
  MaxLength,
  Min,
  MinLength,
} from "class-validator";
import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";

const trim = ({ value }: { value: unknown }): unknown =>
  typeof value === "string" ? value.trim() : value;

export class PostQueryDto {
  @ApiPropertyOptional({ enum: ["para", "recentes"], default: "para" })
  @IsOptional()
  @IsIn(["para", "recentes"])
  filter?: "para" | "recentes" = "para";

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

export class CommentQueryDto {
  @ApiPropertyOptional({ format: "uuid" })
  @IsOptional()
  @IsUUID()
  cursor?: string;

  @ApiPropertyOptional({ default: 30, minimum: 1, maximum: 100 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number = 30;
}

export class CreatePostDto {
  @ApiProperty({ example: "Hoje consegui sair para caminhar." })
  @Transform(trim)
  @IsString()
  @MinLength(1)
  @MaxLength(2000)
  text!: string;

  @ApiPropertyOptional({ example: "Ansiedade", default: "Desabafo" })
  @IsOptional()
  @Transform(trim)
  @IsString()
  @MinLength(1)
  @MaxLength(32)
  tag?: string;
}

export class CreateCommentDto {
  @ApiProperty({ example: "Cada passo conta!" })
  @Transform(trim)
  @IsString()
  @MinLength(1)
  @MaxLength(1000)
  text!: string;
}

export class UpdateCommunityProfileDto {
  @ApiPropertyOptional({ example: "Ana" })
  @IsOptional()
  @Transform(trim)
  @IsString()
  @MinLength(2)
  @MaxLength(60)
  name?: string;

  @ApiPropertyOptional({ example: "ana_silva" })
  @IsOptional()
  @Transform(({ value }: { value: unknown }) =>
    typeof value === "string" ? value.trim().toLowerCase() : value,
  )
  @IsString()
  @Matches(/^[a-z0-9_]{3,30}$/)
  handle?: string;

  @ApiPropertyOptional({ example: "🙂" })
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(16)
  avatarEmoji?: string;

  @ApiPropertyOptional({ example: "#E8F0E6" })
  @IsOptional()
  @IsString()
  @Matches(/^#[0-9a-fA-F]{6}$/)
  avatarBg?: string;
}

export class CommunityAuthorDto {
  @ApiProperty({ format: "uuid" })
  id!: string;

  @ApiProperty()
  name!: string;

  @ApiProperty()
  handle!: string;

  @ApiProperty()
  avatarEmoji!: string;

  @ApiProperty()
  avatarBg!: string;
}

export class CommunityPostDto {
  @ApiProperty({ format: "uuid" })
  id!: string;

  @ApiProperty({ type: CommunityAuthorDto })
  author!: CommunityAuthorDto;

  @ApiProperty()
  tag!: string;

  @ApiProperty()
  text!: string;

  @ApiProperty()
  welcomeCount!: number;

  @ApiProperty()
  commentCount!: number;

  @ApiProperty()
  welcomedByMe!: boolean;

  @ApiProperty()
  createdAt!: Date;

  @ApiProperty()
  updatedAt!: Date;
}

export class CommunityCommentDto {
  @ApiProperty({ format: "uuid" })
  id!: string;

  @ApiProperty({ format: "uuid" })
  postId!: string;

  @ApiProperty({ type: CommunityAuthorDto })
  author!: CommunityAuthorDto;

  @ApiProperty()
  text!: string;

  @ApiProperty()
  createdAt!: Date;
}

export class CommunityWelcomeDto {
  @ApiProperty()
  welcomeCount!: number;

  @ApiProperty()
  welcomedByMe!: boolean;
}

export class PostPageDto {
  @ApiProperty({ type: [CommunityPostDto] })
  items!: CommunityPostDto[];

  @ApiPropertyOptional({ format: "uuid", nullable: true })
  nextCursor!: string | null;
}

export class CommentPageDto {
  @ApiProperty({ type: [CommunityCommentDto] })
  items!: CommunityCommentDto[];

  @ApiPropertyOptional({ format: "uuid", nullable: true })
  nextCursor!: string | null;
}
