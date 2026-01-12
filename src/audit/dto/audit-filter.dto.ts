import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString, IsInt, IsDateString, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class AuditFilterDto {
  @ApiProperty({
    required: false,
    description: 'Page number',
    minimum: 1,
    default: 1,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiProperty({
    required: false,
    description: 'Number of items per page',
    minimum: 1,
    maximum: 100,
    default: 20,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  limit?: number = 20;

  @ApiProperty({
    required: false,
    description: 'Filter by action',
    example: 'USER_CREATED',
  })
  @IsOptional()
  @IsString()
  action?: string;

  @ApiProperty({
    required: false,
    description: 'Filter by entity type',
    example: 'sas_users',
  })
  @IsOptional()
  @IsString()
  entity?: string;

  @ApiProperty({
    required: false,
    description: 'Filter by user ID',
  })
  @IsOptional()
  @IsString()
  userId?: string;

  @ApiProperty({
    required: false,
    description: 'Filter by agent ID',
  })
  @IsOptional()
  @IsString()
  agentId?: string;

  @ApiProperty({
    required: false,
    description: 'Start date (ISO 8601)',
    example: '2026-01-01T00:00:00Z',
  })
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiProperty({
    required: false,
    description: 'End date (ISO 8601)',
    example: '2026-01-31T23:59:59Z',
  })
  @IsOptional()
  @IsDateString()
  endDate?: string;
}
