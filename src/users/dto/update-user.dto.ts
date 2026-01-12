import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsInt,
  IsOptional,
  IsEmail,
  IsIn,
  Min,
  MinLength,
} from 'class-validator';

export class UpdateUserDto {
  @ApiProperty({ description: 'Enable/disable user login', example: 1, enum: [0, 1] })
  @IsInt()
  @IsIn([0, 1])
  enabled: number;

  @ApiPropertyOptional({ description: 'Login password (leave null to keep current)', example: null })
  @IsOptional()
  @IsString()
  @MinLength(4)
  password?: string | null;

  @ApiPropertyOptional({ description: 'Confirm password', example: null })
  @IsOptional()
  @IsString()
  @MinLength(4)
  confirm_password?: string | null;

  @ApiProperty({ description: 'Profile ID', example: 220 })
  @IsInt()
  @Min(1)
  profile_id: number;

  @ApiProperty({ description: 'Parent manager ID', example: 224 })
  @IsInt()
  @Min(1)
  parent_id: number;

  @ApiPropertyOptional({ description: 'Site ID', example: null })
  @IsOptional()
  @IsInt()
  site_id?: number | null;

  @ApiPropertyOptional({ description: 'MAC authentication', example: 0, enum: [0, 1] })
  @IsOptional()
  @IsInt()
  @IsIn([0, 1])
  mac_auth?: number;

  @ApiPropertyOptional({ description: 'Allowed MAC addresses', example: null })
  @IsOptional()
  @IsString()
  allowed_macs?: string | null;

  @ApiPropertyOptional({ description: 'Use separate portal password', example: 0, enum: [0, 1] })
  @IsOptional()
  @IsInt()
  @IsIn([0, 1])
  use_separate_portal_password?: number;

  @ApiPropertyOptional({ description: 'Portal password', example: null })
  @IsOptional()
  @IsString()
  portal_password?: string | null;

  @ApiPropertyOptional({ description: 'Group ID', example: null })
  @IsOptional()
  @IsInt()
  group_id?: number | null;

  @ApiPropertyOptional({ description: 'First name', example: 'صلاح مهدي نور هاشم' })
  @IsOptional()
  @IsString()
  firstname?: string;

  @ApiPropertyOptional({ description: 'Last name', example: null })
  @IsOptional()
  @IsString()
  lastname?: string | null;

  @ApiPropertyOptional({ description: 'Company name', example: null })
  @IsOptional()
  @IsString()
  company?: string | null;

  @ApiPropertyOptional({ description: 'Email address', example: null })
  @IsOptional()
  @IsEmail()
  email?: string | null;

  @ApiPropertyOptional({ description: 'Phone number', example: '7732431601' })
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiPropertyOptional({ description: 'City', example: null })
  @IsOptional()
  @IsString()
  city?: string | null;

  @ApiPropertyOptional({ description: 'Address', example: null })
  @IsOptional()
  @IsString()
  address?: string | null;

  @ApiPropertyOptional({ description: 'Apartment', example: null })
  @IsOptional()
  @IsString()
  apartment?: string | null;

  @ApiPropertyOptional({ description: 'Street', example: null })
  @IsOptional()
  @IsString()
  street?: string | null;

  @ApiPropertyOptional({ description: 'Contract ID', example: null })
  @IsOptional()
  @IsString()
  contract_id?: string | null;

  @ApiPropertyOptional({ description: 'National ID', example: null })
  @IsOptional()
  @IsString()
  national_id?: string | null;

  @ApiPropertyOptional({ description: 'Notes', example: 'Test' })
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiPropertyOptional({ description: 'Auto renew', example: 0, enum: [0, 1] })
  @IsOptional()
  @IsInt()
  @IsIn([0, 1])
  auto_renew?: number;

  @ApiPropertyOptional({ description: 'Expiration date', example: '2026-01-11 10:54:01' })
  @IsOptional()
  @IsString()
  expiration?: string;

  @ApiPropertyOptional({ description: 'Simultaneous sessions allowed', example: 1 })
  @IsOptional()
  @IsInt()
  @Min(1)
  simultaneous_sessions?: number;

  @ApiPropertyOptional({ description: 'Static IP address', example: null })
  @IsOptional()
  @IsString()
  static_ip?: string | null;

  @ApiPropertyOptional({ description: 'MikroTik WinBox group', example: null })
  @IsOptional()
  @IsString()
  mikrotik_winbox_group?: string | null;

  @ApiPropertyOptional({ description: 'MikroTik framed route', example: null })
  @IsOptional()
  @IsString()
  mikrotik_framed_route?: string | null;

  @ApiPropertyOptional({ description: 'MikroTik address list', example: null })
  @IsOptional()
  @IsString()
  mikrotik_addresslist?: string | null;

  @ApiPropertyOptional({ description: 'MikroTik IPv6 prefix', example: null })
  @IsOptional()
  @IsString()
  mikrotik_ipv6_prefix?: string | null;

  @ApiPropertyOptional({ description: 'User type', example: 0 })
  @IsOptional()
  @IsInt()
  user_type?: number;

  @ApiPropertyOptional({ description: 'Restricted', example: 0, enum: [0, 1] })
  @IsOptional()
  @IsInt()
  @IsIn([0, 1])
  restricted?: number;
}

export class UpdateUserResponseDto {
  @ApiProperty({ example: '42920871-3242-760b-3f28-887b644a012c', description: 'Transaction ID' })
  transaction_id: string;

  @ApiProperty({ example: 4278, description: 'User ID' })
  user_id: number;

  @ApiProperty({ example: 'User updated successfully', description: 'Success message' })
  message: string;

  @ApiProperty({ description: 'Raw SAS response data' })
  updateResult: any;
}
