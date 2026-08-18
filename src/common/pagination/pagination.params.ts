import { IsOptional, IsInt, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class CursorPaginationParams {
  @ApiPropertyOptional({ description: 'Cursor for pagination', example: 'eyJpZCI6IjEyMyJ9' })
  @IsOptional()
  cursor?: string;

  @ApiPropertyOptional({ description: 'Number of items per page', default: 20, minimum: 1, maximum: 100 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number = 20;
}

export class OffsetPaginationParams {
  @ApiPropertyOptional({ description: 'Page number', default: 1, minimum: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({ description: 'Number of items per page', default: 20, minimum: 1, maximum: 100 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number = 20;
}

export interface CursorPaginationResult<T> {
  data: T[];
  nextCursor?: string;
  hasMore: boolean;
}

export interface OffsetPaginationResult<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export function encodeCursor<T extends { id: string; createdAt: Date }>(item: T): string {
  return Buffer.from(JSON.stringify({ id: item.id, createdAt: item.createdAt.toISOString() })).toString('base64');
}

export function decodeCursor(cursor: string): { id: string; createdAt: Date } {
  return JSON.parse(Buffer.from(cursor, 'base64').toString('utf-8'));
}