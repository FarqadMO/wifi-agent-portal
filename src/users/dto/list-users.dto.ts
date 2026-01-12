import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsInt, IsString, IsOptional, IsArray, IsIn, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class ListUsersDto {
  @ApiProperty({ description: 'Page number', example: 1, minimum: 1 })
  @IsInt()
  @Min(1)
  @Type(() => Number)
  page: number;

  @ApiProperty({ description: 'Number of items per page', example: 10, minimum: 1 })
  @IsInt()
  @Min(1)
  @Type(() => Number)
  count: number;

  @ApiPropertyOptional({ description: 'Field to sort by', example: 'username' })
  @IsOptional()
  @IsString()
  sortBy?: string;

  @ApiPropertyOptional({ description: 'Sort direction', example: 'asc', enum: ['asc', 'desc'] })
  @IsOptional()
  @IsIn(['asc', 'desc'])
  direction?: 'asc' | 'desc';

  @ApiPropertyOptional({ description: 'Search query', example: '' })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({
    description: 'Columns to return',
    type: [String],
    example: ['id', 'username', 'firstname', 'lastname', 'expiration', 'balance'],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  columns?: string[];
}

export class UserDto {
  @ApiProperty({ description: 'User ID', example: 123 })
  id: number;

  @ApiProperty({ description: 'Username', example: 'user123' })
  username: string;

  @ApiPropertyOptional({ description: 'First name', example: 'Ahmed' })
  firstname?: string;

  @ApiPropertyOptional({ description: 'Last name', example: 'Ali' })
  lastname?: string;

  @ApiPropertyOptional({ description: 'Expiration date', example: '2024-12-31 23:59:59' })
  expiration?: string;

  @ApiPropertyOptional({ description: 'Parent username', example: 'admin' })
  parent_username?: string;

  @ApiPropertyOptional({ description: 'Profile name', example: 'Gold Package' })
  name?: string;

  @ApiPropertyOptional({ description: 'Balance', example: 50000 })
  balance?: number;

  @ApiPropertyOptional({ description: 'Traffic limit', example: '100GB' })
  traffic?: string;

  @ApiPropertyOptional({ description: 'City', example: 'Baghdad' })
  city?: string;

  @ApiPropertyOptional({ description: 'Static IP', example: '192.168.1.100' })
  static_ip?: string;

  @ApiPropertyOptional({ description: 'Notes', example: 'VIP customer' })
  notes?: string;

  @ApiPropertyOptional({ description: 'Last online', example: '2024-01-08 10:30:00' })
  last_online?: string;

  @ApiPropertyOptional({ description: 'Company', example: 'ABC Corp' })
  company?: string;

  @ApiPropertyOptional({ description: 'Simultaneous sessions', example: 1 })
  simultaneous_sessions?: number;

  @ApiPropertyOptional({ description: 'Used traffic', example: '25GB' })
  used_traffic?: string;

  @ApiPropertyOptional({ description: 'Phone', example: '+9647XXXXXXXXX' })
  phone?: string;

  @ApiPropertyOptional({ description: 'Address', example: '123 Street' })
  address?: string;

  @ApiPropertyOptional({ description: 'Contract ID', example: 'CNT-001' })
  contract_id?: string;
}

export class ListUsersResponseDto {
  @ApiProperty({ description: 'Array of users', type: [UserDto] })
  users: UserDto[];

  @ApiProperty({ description: 'Total number of users', example: 250 })
  total: number;

  @ApiProperty({ description: 'Current page', example: 1 })
  page: number;

  @ApiProperty({ description: 'Items per page', example: 10 })
  count: number;
}
