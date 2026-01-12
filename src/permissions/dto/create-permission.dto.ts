import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, IsOptional } from 'class-validator';

export class CreatePermissionDto {
  @ApiProperty({
    description: 'Permission name (unique)',
    example: 'users.create',
  })
  @IsNotEmpty()
  @IsString()
  name: string;

  @ApiProperty({
    description: 'Permission module/category',
    example: 'users',
  })
  @IsNotEmpty()
  @IsString()
  module: string;

  @ApiProperty({
    description: 'Permission description',
    example: 'Create new users',
    required: false,
  })
  @IsOptional()
  @IsString()
  description?: string;
}
